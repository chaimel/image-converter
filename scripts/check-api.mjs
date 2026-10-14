import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { request } from 'node:http'
import sharp from 'sharp'

const probe = createServer()
probe.listen(0, '127.0.0.1')
await once(probe, 'listening')
const port = probe.address().port
await new Promise((resolve) => probe.close(resolve))
const url = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    NITRO_HOST: '127.0.0.1',
    PORT: String(port),
    NITRO_PORT: String(port),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})
let output = ''
server.stdout.on('data', (data) => {
  output += data
})
server.stderr.on('data', (data) => {
  output += data
})
server.on('error', (error) => {
  output += error.message
})
try {
  let live = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(output)
    try {
      const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(600) })
      live = response.ok && (await response.json()).app === 'musticker-image-converter'
    } catch {}
    if (live) break
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  assert.ok(live, `Local server failed to start: ${output}`)
  const home = await fetch(url)
  assert.equal(home.status, 200)
  const html = await home.text()
  assert.match(html, /Image converter/)
  assert.match(html, /Browse files/)
  assert.match(html, /Export settings/)
  assert.match(html, /Keep aspect ratio/)
  assert.match(html, /Start with a preset/)
  assert.doesNotMatch(html, /NuxtWelcome/)
  console.log('PASS: production page and health endpoint')
  const source = await readFile('public/sample-sticker.svg')
  const send = (path, options = {}, body = source, headers = {}) =>
    fetch(`${url}/api/${path}`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Conversion-Options': JSON.stringify(options),
        ...headers,
      },
    })
  const inspected = await send('inspect')
  assert.equal(inspected.status, 200)
  const metadata = await inspected.json()
  assert.equal(metadata.width, 600)
  assert.match(metadata.preview, /^data:image\/png;base64,/)
  console.log('PASS: source inspection and preview generation')
  const raster = await sharp(source).resize(96, 96).png().toBuffer()
  const inputs = { svg: source, png: raster }
  for (const format of ['webp', 'jpeg', 'avif', 'gif', 'tiff']) {
    let input = sharp(raster)
    if (format === 'jpeg') input = input.flatten({ background: '#ffffff' })
    inputs[format] = await input[format](
      format === 'tiff' ? { compression: 'lzw' } : { lossless: true },
    ).toBuffer()
  }
  const mimeTypes = {
    png: 'image/png',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    avif: 'image/avif',
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  }
  for (const [inputFormat, input] of Object.entries(inputs)) {
    const expected = await sharp(input).resize(96, 96).ensureAlpha().raw().toBuffer()
    for (const [format, mime] of Object.entries(mimeTypes)) {
      const context = `${inputFormat} to ${format}`
      const response = await send('convert', { format, width: 96, height: 96 }, input)
      assert.equal(response.status, 200, `${context}: ${response.status}`)
      assert.equal(response.headers.get('X-Image-Width'), '96', context)
      assert.equal(response.headers.get('X-Image-Height'), '96', context)
      assert.equal(response.headers.get('Content-Type')?.split(';')[0], mime, context)
      assert.equal(response.headers.get('Content-Disposition'), 'attachment', context)
      assert.equal(response.headers.get('Cache-Control'), 'no-store', context)
      let data = Buffer.from(await response.arrayBuffer())
      if (format === 'ico') {
        assert.equal(data.readUInt16LE(2), 1, context)
        data = data.subarray(data.readUInt32LE(18))
      }
      const meta = await sharp(data).metadata()
      assert.equal(meta.format, format === 'avif' ? 'heif' : format === 'ico' ? 'png' : format, context)
      assert.deepEqual([meta.width, meta.height], [96, 96], context)
      const actual = await sharp(data).ensureAlpha().raw().toBuffer()
      if (['png', 'webp', 'avif', 'tiff'].includes(format)) {
        assert.equal(actual.length, expected.length, context)
        for (let i = 0; i < expected.length; i += 4) {
          assert.equal(actual[i + 3], expected[i + 3], `${context}: alpha at pixel ${i / 4}`)
          if (expected[i + 3])
            assert.ok(
              actual.subarray(i, i + 3).equals(expected.subarray(i, i + 3)),
              `${context}: visible color at pixel ${i / 4}`,
            )
        }
      }
    }
    console.log(
      `PASS: ${inputFormat.toUpperCase()} input to all 8 downloads, including lossless pixel checks`,
    )
  }
  const defaultPng = await send('convert', { format: 'png' })
  assert.equal(defaultPng.status, 200)
  assert.equal(defaultPng.headers.get('X-Image-Width'), '2048')
  assert.equal((await sharp(Buffer.from(await defaultPng.arrayBuffer())).metadata()).width, 2048)
  const customPng = await send('convert', { format: 'png', width: 1200, enlarge: false })
  assert.equal(customPng.status, 200)
  assert.equal((await sharp(Buffer.from(await customPng.arrayBuffer())).metadata()).width, 1200)
  const originalSvg = await send('convert', { format: 'svg' })
  assert.equal(originalSvg.status, 200)
  assert.ok(
    Buffer.from(await originalSvg.arrayBuffer()).equals(source),
    'Default SVG export should retain original vectors',
  )
  console.log('PASS: SVG default/custom resolution and original vector preservation')
  assert.equal((await send('inspect', {}, source, { Origin: 'https://example.com' })).status, 403)
  // Fetch normalizes Host; use the HTTP client to exercise the actual host guard.
  const rawStatus = (headers) =>
    new Promise((resolve, reject) => {
      const req = request(`${url}/api/inspect`, { method: 'POST', headers }, (response) => {
        response.resume()
        resolve(response.statusCode)
      })
      req.on('error', reject)
      req.end(source)
    })
  assert.equal(await rawStatus({ Host: 'untrusted.example' }), 403)
  assert.equal(await rawStatus({ 'Content-Length': String(41 * 1024 * 1024) }), 413)
  assert.equal((await send('convert', { format: 'unknown' })).status, 422)
  const activeSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" onload="void 0"/>',
  )
  assert.equal((await send('inspect', {}, activeSvg)).status, 422)
  assert.equal((await send('convert', { format: 'svg' }, activeSvg)).status, 422)
  assert.equal((await send('convert', {}, Buffer.from('corrupt'))).status, 422)
  assert.equal((await send('convert', {}, source, { 'X-Conversion-Options': 'not-json' })).status, 400)
  assert.equal((await send('convert', {}, source, { 'X-Conversion-Options': 'null' })).status, 400)
  console.log('PASS: cross-origin, host, corrupt-image, and option validation')
} finally {
  server.kill()
  if (server.exitCode === null && server.signalCode === null) await once(server, 'exit')
}
