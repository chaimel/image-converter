import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { convertImage, inspectImage, normalizeOptions, MAX_BYTES } from '../server/utils/converter.mjs'

const source = await readFile(new URL('../public/sample-sticker.svg', import.meta.url))
const png = await sharp(source).resize(120, 120).png().toBuffer()

for (const format of ['png', 'webp', 'jpeg', 'avif', 'gif', 'tiff']) {
  test(`SVG to ${format} produces decodable bytes with requested size`, async () => {
    const result = await convertImage(source, { format, width: 96, height: 96 })
    const metadata = await sharp(result.data).metadata()
    assert.equal(metadata.format, format === 'avif' ? 'heif' : format)
    assert.equal(metadata.width, 96)
    assert.equal(metadata.height, 96)
    const roundtrip = await convertImage(result.data, { format: 'png' })
    assert.equal((await sharp(roundtrip.data).metadata()).width, 96)
    if (format !== 'jpeg') assert.ok(metadata.hasAlpha)
  })
}
test('Lossless PNG and WebP preserve pixels including transparency', async () => {
  const originalPixels = await sharp(png).ensureAlpha().raw().toBuffer()
  for (const format of ['png', 'webp']) {
    const result = await convertImage(png, { format, lossless: true })
    const pixels = await sharp(result.data).ensureAlpha().raw().toBuffer()
    // Fully transparent RGB may be normalized by encoders; visible pixels and alpha must match.
    for (let i = 0; i < pixels.length; i += 4) {
      assert.equal(pixels[i + 3], originalPixels[i + 3])
      if (pixels[i + 3] > 0) assert.deepEqual(pixels.subarray(i, i + 3), originalPixels.subarray(i, i + 3))
    }
  }
})
test('JPEG and explicit flattening use the selected background', async () => {
  for (const format of ['jpeg', 'png']) {
    const result = await convertImage(png, {
      format,
      transparent: false,
      background: '#ff0000',
      quality: 100,
    })
    const meta = await sharp(result.data).metadata()
    assert.equal(meta.hasAlpha, false)
    const pixel = await sharp(result.data).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()
    assert.ok(pixel[0] >= 250 && pixel[1] < 5 && pixel[2] < 5)
  }
})
test('Aspect ratio, explicit stretching, and enlargement behavior', async () => {
  const wide = await sharp({ create: { width: 100, height: 50, channels: 4, background: '#00ff00' } })
    .png()
    .toBuffer()
  const fit = await convertImage(wide, { width: 40, height: 40 })
  assert.deepEqual([fit.width, fit.height], [40, 20])
  const stretch = await convertImage(wide, { width: 40, height: 40, fit: 'fill' })
  assert.deepEqual([stretch.width, stretch.height], [40, 40])
  const unchanged = await convertImage(wide, { width: 200 })
  assert.deepEqual([unchanged.width, unchanged.height], [100, 50])
  const enlarged = await convertImage(wide, { width: 200, enlarge: true })
  assert.deepEqual([enlarged.width, enlarged.height], [200, 100])
})
test('EXIF rotation is applied and inspection matches converted dimensions', async () => {
  const rotated = await sharp({ create: { width: 100, height: 50, channels: 3, background: '#ff0000' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const preview = await inspectImage(rotated)
  const result = await convertImage(rotated, { format: 'png' })
  assert.deepEqual([preview.width, preview.height], [50, 100])
  assert.deepEqual([result.width, result.height], [50, 100])
})
test('Raster to SVG trace contains renderable paths and retains requested dimensions', async () => {
  const result = await convertImage(png, { format: 'svg', width: 80, svgMode: 'trace', colors: 8 })
  assert.match(result.data.toString(), /<path /)
  assert.doesNotMatch(result.data.toString(), /<image /)
  assert.equal((await sharp(result.data).metadata()).width, 80)
  assert.ok(result.warnings[0].includes('simplifies'))
})
test('Embedded SVG preserves exact pixel appearance and round trips', async () => {
  const result = await convertImage(png, { format: 'svg', svgMode: 'embed' })
  assert.match(result.data.toString(), /data:image\/png;base64,/)
  const raster = await convertImage(result.data, { format: 'png', svgRasterSize: 0 })
  const actual = await sharp(raster.data).raw().toBuffer()
  const expected = await sharp(png).raw().toBuffer()
  assert.ok(actual.equals(expected), 'Embedded PNG pixels should round trip at original dimensions')
})
test('ICO contains a valid icon directory and correctly sized embedded PNG', async () => {
  const result = await convertImage(source, { format: 'ico', width: 512, height: 512 })
  assert.equal(result.data.readUInt16LE(2), 1)
  assert.equal(result.data.readUInt16LE(4), 1)
  assert.equal(result.data[6], 0)
  const offset = result.data.readUInt32LE(18)
  assert.equal(result.data.readUInt32LE(14), result.data.length - offset)
  assert.equal((await sharp(result.data.subarray(offset)).metadata()).width, 256)
})
test('Internal SVG gradients and references render; external dependencies are rejected', async () => {
  const gradient = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><defs><linearGradient id="g"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><rect width="20" height="20" fill="url('#g')"/></svg>`,
  )
  assert.equal((await convertImage(gradient, { format: 'png', svgRasterSize: 0 })).width, 20)
  for (const bad of [
    '<script>alert(1)</script>',
    '<image href="file:///private.png"/>',
    '<image href="https://example.com/a.png"/>',
  ]) {
    await assert.rejects(
      convertImage(
        Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">${bad}</svg>`),
        {},
      ),
      /self-contained/,
    )
  }
})
test('Bad files, excessive sizes, and invalid settings fail cleanly', async () => {
  await assert.rejects(convertImage(Buffer.from('not an image'), {}))
  await assert.rejects(convertImage(Buffer.alloc(0), {}), /empty/)
  await assert.rejects(convertImage(Buffer.alloc(MAX_BYTES + 1), {}), /40 MB/)
  for (const options of [
    { format: 'pdf' },
    { format: 'toString' },
    { quality: 101 },
    { width: -1 },
    { width: 3.4 },
    { width: 8193 },
    { background: 'red' },
    { colors: 500 },
    { width: 8192, height: 8192 },
  ]) {
    assert.throws(() => normalizeOptions(options))
  }
})

test('Animated GIF inspection reports frames and exports only the first', async () => {
  const raw = Buffer.from([255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255])
  const gif = await sharp(raw, { raw: { width: 2, height: 2, channels: 3, pageHeight: 1 } })
    .gif({ delay: [100, 200], loop: 0 })
    .toBuffer()
  const inspection = await inspectImage(gif)
  assert.equal(inspection.pages, 2)
  assert.equal(inspection.height, 1)
  const result = await convertImage(gif, { format: 'png' })
  assert.equal(result.height, 1)
  assert.match(result.warnings[0], /first frame/)
  assert.deepEqual(
    await sharp(result.data).removeAlpha().raw().toBuffer(),
    Buffer.from([255, 0, 0, 255, 0, 0]),
  )
})
