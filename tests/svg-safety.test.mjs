import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateSvg, SvgValidationError } from '../server/utils/svg.mjs'
import { convertImage, inspectImage, ConversionError } from '../server/utils/converter.mjs'

const svg = (content = '', attributes = '') =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" ${attributes}>${content}</svg>`)
const reject = (bytes) =>
  assert.throws(
    () => validateSvg(bytes),
    (error) => error instanceof SvgValidationError && /self-contained/.test(error.message),
  )

test('SVG validation leaves binary raster input to its decoder', () => {
  assert.equal(validateSvg(Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10])), undefined)
  assert.equal(validateSvg(Buffer.from('RIFF example WEBP')), undefined)
  assert.equal(validateSvg(Buffer.from([0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70])), undefined)
})

test('SVG validation accepts namespaces, internal references, and embedded raster images', () => {
  const doc = validateSvg(
    svg(
      '<defs><linearGradient id="g"><stop stop-color="red"/></linearGradient></defs><style>.art { fill: url("#g") }</style><rect class="art" width="20" height="20"/><image href="data:image/png;base64,aGVsbG8="/>',
    ),
  )
  assert.equal(doc.documentElement.localName, 'svg')
  assert.equal(validateSvg(Buffer.from('<svg width="20" height="20"/>')).documentElement.localName, 'svg')
  assert.equal(
    validateSvg(Buffer.from('<?xml version="1.0"?><s:svg xmlns:s="http://www.w3.org/2000/svg"/>'))
      .documentElement.localName,
    'svg',
  )
  assert.equal(
    validateSvg(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), svg()])).documentElement.localName,
    'svg',
  )
  const metadata = validateSvg(
    svg(
      '',
      'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:export-filename="C:\\Users\\Artist\\sticker.png"',
    ),
  )
  assert.equal(
    metadata.documentElement.getAttribute('inkscape:export-filename'),
    'C:\\Users\\Artist\\sticker.png',
  )
})

test('Long leading comments, namespace prefixes, and event attributes do not bypass validation', () => {
  reject(Buffer.from(`<!--${'x'.repeat(2000)}-->${svg('<script>void 0</script>')}`))
  reject(svg('<s:script xmlns:s="http://www.w3.org/2000/svg">void 0</s:script>'))
  reject(
    Buffer.from(
      '<?xml version="1.0"?><s:svg xmlns:s="http://www.w3.org/2000/svg"><s:script>void 0</s:script></s:svg>',
    ),
  )
  reject(svg('', 'onload="void 0"'))
  reject(svg('<rect onclick="void 0"/>'))
  reject(svg('<foreignObject/>'))
})

test('SVG references are checked after XML entity decoding', () => {
  for (const value of [
    'https://example.invalid/image.png',
    'file:///image.png',
    'javascript:void(0)',
    '&#104;ttps://example.invalid/image.png',
  ]) {
    reject(svg(`<image href="${value}"/>`))
  }
  reject(
    svg('<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://example.invalid/image.png"/>'),
  )
  reject(svg('<image href="data:image/svg+xml;base64,PHN2Zy8+"/>'))
  reject(svg('', 'xml:base="https://example.invalid/"'))
  reject(Buffer.from(`<?xml-stylesheet href="https://example.invalid/style.css"?>${svg()}`))
})

test('External CSS URLs and imports, including decoded and escaped spellings, are rejected', () => {
  reject(svg('<rect fill="url(https://example.invalid/paint.svg#g)"/>'))
  reject(svg('<rect style="fill: url(&quot;https://example.invalid/paint.svg#g&quot;)"/>'))
  reject(svg('<style>@import "https://example.invalid/style.css";</style>'))
  reject(svg('<style>@im/**/port "https://example.invalid/style.css";</style>'))
  reject(svg('<style>.x { fill: u\\72l(https://example.invalid/paint.svg#g) }</style>'))
  reject(svg('<style>.x { background-image: image-set("https://example.invalid/image.png" 1x) }</style>'))
})

test('SVG animation cannot mutate a safe reference into active content', () => {
  reject(svg('<a id="link" href="#local"/><set href="#link" attributeName="href" to="javascript:void(0)"/>'))
  reject(svg('<animate attributeName="onload" values="void 0"/>'))
  reject(svg('<animateTransform attributeName="transform"/>'))
})

test('Document declarations, malformed XML, wrong roots, and unsupported encodings fail clearly', () => {
  reject(Buffer.from(`<!DOCTYPE svg [<!ENTITY external SYSTEM "file:///image.png">]>${svg()}`))
  assert.throws(() => validateSvg(Buffer.from('<svg><rect></svg>')), /well-formed XML/)
  assert.throws(() => validateSvg(Buffer.from('<html/>')), /valid SVG root/)
  assert.throws(
    () => validateSvg(Buffer.from('<svg xmlns="http://example.invalid/not-svg"/>')),
    /valid SVG root/,
  )
  assert.throws(
    () => validateSvg(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('<svg/>', 'utf16le')])),
    /UTF-8/,
  )
  assert.throws(() => validateSvg(Buffer.from('  <svg/>', 'utf16le')), /UTF-8/)
  assert.throws(() => validateSvg(Buffer.from('  <svg/>', 'utf16le').swap16()), /UTF-8/)
  assert.throws(() => validateSvg(Buffer.from('<?xml version="1.0" encoding="ISO-8859-1"?><svg/>')), /UTF-8/)
})

test('Inspection and SVG preservation both reject active SVG markup', async () => {
  for (const input of [
    svg('', 'onload="void 0"'),
    Buffer.from(`<!--${'x'.repeat(2000)}-->${svg('<script>void 0</script>')}`),
  ]) {
    for (const action of [inspectImage, (bytes) => convertImage(bytes, { format: 'svg' })]) {
      await assert.rejects(
        action(input),
        (error) => error instanceof ConversionError && /self-contained/.test(error.message),
      )
    }
  }
})
