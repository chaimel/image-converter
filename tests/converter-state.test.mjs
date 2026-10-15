import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRenderer } from 'vue'
import ts from 'typescript'

const project = new URL('../', import.meta.url)

// Node runs the behavior tests directly. Resolve Nuxt aliases for the two TS
// modules without building Nuxt or introducing a browser/test dependency.
async function moduleUrl(path, aliases = {}) {
  const source = await readFile(new URL(path, project), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  const resolved = outputText.replace(/(from\s+)(['"])([^'"]+)\2/g, (statement, prefix, _quote, specifier) =>
    aliases[specifier] ? `${prefix}${JSON.stringify(aliases[specifier])}` : statement,
  )
  return `data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`
}

const { useImageConverter } = await import(
  await moduleUrl('app/composables/features/converter/useImageConverter.ts', {
    vue: import.meta.resolve('vue'),
    '#shared/image-settings.mjs': new URL('shared/image-settings.mjs', project).href,
    '~/utils/archive.mjs': new URL('app/utils/archive.mjs', project).href,
    '~/utils/download': await moduleUrl('app/utils/download.ts'),
  })
)

// No page or DOM is rendered. A real Vue component supplies setup/unmount
// lifecycle, while the host operations deliberately have no visual behavior.
const renderer = createRenderer({
  patchProp() {},
  insert() {},
  remove() {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
})

function mountConverter(t) {
  let converter
  let mounted = true
  const app = renderer.createApp({
    setup() {
      converter = useImageConverter()
      return () => null
    },
  })
  app.mount({})
  const unmount = () => {
    if (!mounted) return
    mounted = false
    app.unmount()
  }
  t.after(unmount)
  return { converter, unmount }
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function image(name = 'art.svg') {
  return new File(['<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"/>'], name, {
    type: 'image/svg+xml',
  })
}

function inspection() {
  return Response.json({
    preview: 'data:image/png;base64,cHJldmlldw==',
    width: 64,
    height: 32,
    format: 'svg',
    pages: 1,
  })
}

function converted(bytes = 'converted image', warnings = []) {
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/webp',
      'X-Image-Width': '2048',
      'X-Image-Height': '1024',
      'X-Image-Warnings': JSON.stringify(warnings),
    },
  })
}

test('Manual settings edits leave the preset and discard outdated downloadable results', async (t) => {
  const revoke = t.mock.method(URL, 'revokeObjectURL')
  t.mock.method(globalThis, 'fetch', async (url) => (url === '/api/inspect' ? inspection() : converted()))
  const { converter } = mountConverter(t)

  converter.preset('sticker')
  await converter.addFiles([image()])
  await converter.convertAll()
  const resultUrl = converter.items.value[0].result.url
  assert.equal(converter.activePreset.value, 'sticker')
  assert.equal(converter.completed.value.length, 1)

  converter.options.width = '1024'

  assert.equal(converter.activePreset.value, 'custom')
  assert.equal(converter.options.width, '1024')
  assert.equal(converter.completed.value.length, 0)
  assert.equal(converter.items.value[0].status, 'ready')
  assert.equal(converter.items.value[0].result, undefined)
  assert.ok(revoke.mock.calls.some((call) => call.arguments[0] === resultUrl))
  assert.equal(converter.outputSize(converter.items.value[0]), '1024 × 512 px')
})

test('Batch conversion sends chosen quality options and exposes progress and response metadata', async (t) => {
  const requests = []
  const firstResponse = deferred()
  const secondResponse = deferred()
  const secondStarted = deferred()
  t.mock.method(globalThis, 'fetch', (url, request) => {
    if (url === '/api/inspect') return Promise.resolve(inspection())
    requests.push(request)
    if (requests.length === 1) return firstResponse.promise
    secondStarted.resolve()
    return secondResponse.promise
  })
  const { converter } = mountConverter(t)
  await converter.addFiles([image('first.svg'), image('second.svg')])

  assert.equal(converter.options.lossless, true)
  assert.equal(converter.options.svgRasterSize, 2048)
  assert.equal(converter.outputSize(converter.items.value[0]), '2048 × 1024 px')
  const expectedOptions = { ...converter.options }
  const conversion = converter.convertAll()
  assert.equal(converter.processing.value, true)
  assert.equal(converter.items.value[0].status, 'converting')
  assert.deepEqual(converter.conversionProgress.value, { done: 0, total: 2, percent: 0 })
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].body, converter.items.value[0].file)
  assert.deepEqual(JSON.parse(requests[0].headers['X-Conversion-Options']), expectedOptions)

  firstResponse.resolve(converted('first image', ['The SVG uses locally installed fonts.']))
  await secondStarted.promise
  assert.deepEqual(converter.conversionProgress.value, { done: 1, total: 2, percent: 50 })
  assert.equal(converter.completed.value.length, 1)
  assert.equal(converter.items.value[1].status, 'converting')
  assert.deepEqual(JSON.parse(requests[1].headers['X-Conversion-Options']), expectedOptions)

  secondResponse.resolve(converted('second image'))
  await conversion
  assert.equal(converter.processing.value, false)
  assert.deepEqual(converter.conversionProgress.value, { done: 2, total: 2, percent: 100 })
  assert.equal(converter.completed.value.length, 2)
  const result = converter.items.value[0].result
  assert.equal(result.name, 'first.webp')
  assert.equal(result.format, 'webp')
  assert.equal(result.width, 2048)
  assert.equal(result.height, 1024)
  assert.deepEqual(result.warnings, ['The SVG uses locally installed fonts.'])
  assert.equal(await result.blob.text(), 'first image')
  assert.match(result.url, /^blob:/)
  assert.match(converter.notice.value, /2 images are ready/)
})

test('Removing an image aborts inspection and ignores a late response', async (t) => {
  const response = deferred()
  let signal
  t.mock.method(globalThis, 'fetch', (_url, request) => {
    signal = request.signal
    // Deliberately resolve after cancellation to check stale-response handling too.
    return response.promise
  })
  const { converter } = mountConverter(t)
  const reading = converter.addFiles([image()])
  const removed = converter.items.value[0]
  assert.equal(converter.isReading.value, true)

  converter.remove(removed)
  assert.equal(signal.aborted, true)
  assert.equal(converter.items.value.length, 0)

  response.resolve(inspection())
  await reading
  assert.equal(converter.items.value.length, 0)
  assert.equal(converter.isReading.value, false)
  assert.equal(removed.preview, '')
  assert.equal(converter.notice.value, '')
})

test('Unmount aborts pending conversion and revokes completed image URLs', async (t) => {
  const response = deferred()
  const createUrl = t.mock.method(URL, 'createObjectURL')
  const revokeUrl = t.mock.method(URL, 'revokeObjectURL')
  let pendingSignal
  let conversions = 0
  t.mock.method(globalThis, 'fetch', (url, request) => {
    if (url === '/api/inspect') return Promise.resolve(inspection())
    conversions++
    if (conversions === 1) return Promise.resolve(converted())
    pendingSignal = request.signal
    return response.promise
  })
  const { converter, unmount } = mountConverter(t)
  await converter.addFiles([image('complete.svg')])
  await converter.convertAll()
  const resultUrl = converter.items.value[0].result.url
  await converter.addFiles([image('pending.svg')])
  const converting = converter.convertAll()
  assert.equal(pendingSignal.aborted, false)

  unmount()

  assert.equal(pendingSignal.aborted, true)
  assert.ok(revokeUrl.mock.calls.some((call) => call.arguments[0] === resultUrl))
  response.resolve(converted('late result'))
  await converting
  assert.equal(createUrl.mock.callCount(), 1)
  assert.equal(converter.completed.value.length, 0)
})

test('An in-flight conversion keeps its settings snapshot and discards output after settings change', async (t) => {
  const response = deferred()
  const createUrl = t.mock.method(URL, 'createObjectURL')
  let sentOptions
  t.mock.method(globalThis, 'fetch', (url, request) => {
    if (url === '/api/inspect') return Promise.resolve(inspection())
    sentOptions = JSON.parse(request.headers['X-Conversion-Options'])
    return response.promise
  })
  const { converter } = mountConverter(t)
  converter.preset('web')
  await converter.addFiles([image()])
  const conversion = converter.convertAll()
  converter.options.lossless = true
  converter.options.width = '800'

  assert.equal(sentOptions.lossless, false)
  assert.equal(sentOptions.width, '1600')
  assert.equal(sentOptions.quality, 82)
  response.resolve(converted())
  await conversion

  assert.equal(createUrl.mock.callCount(), 0)
  assert.equal(converter.completed.value.length, 0)
  assert.equal(converter.ready.value.length, 1)
  assert.equal(converter.processing.value, false)
  assert.equal(converter.activePreset.value, 'custom')
  assert.match(converter.notice.value, /settings changed/i)
})
