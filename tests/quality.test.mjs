import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import sharp from 'sharp'
import { convertImage, inspectImage, normalizeOptions } from '../server/utils/converter.mjs'

const width = 48
const height = 32
const vector = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32"><defs><linearGradient id="gradient"><stop stop-color="#ff1648"/><stop offset="1" stop-color="#163aff"/></linearGradient></defs><rect x="2" y="2" width="44" height="28" rx="5" fill="url(#gradient)"/><circle cx="16" cy="16" r="10" fill="#00ffac" fill-opacity=".53"/><path d="M23 25L30 7L42 25Z" fill="#ffd600"/><path d="M7 15L42 15" stroke="white" stroke-width=".5"/></svg>`,
)
const inputs = { svg: vector }
for (const format of ['png', 'webp', 'jpeg', 'avif', 'gif', 'tiff']) {
  let image = sharp(vector)
  if (format === 'jpeg') image = image.flatten({ background: '#ffffff' })
  inputs[format] = await (
    format === 'png'
      ? image.png()
      : image[format](format === 'tiff' ? { compression: 'lzw' } : { quality: 98, lossless: true })
  ).toBuffer()
}

async function decoded(bytes) {
  return sharp(bytes)
    .autoOrient()
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
}

function assertVisiblePixelsEqual(actual, expected, context) {
  assert.equal(actual.length, expected.length, `${context}: byte count`)
  let differences = 0
  let maxDifference = 0
  for (let offset = 0; offset < actual.length; offset += 4) {
    for (let channel = 0; channel < 4; channel++) {
      // Lossless encoders can discard hidden RGB values under fully transparent pixels.
      if (channel < 3 && actual[offset + 3] === 0 && expected[offset + 3] === 0) continue
      const delta = Math.abs(actual[offset + channel] - expected[offset + channel])
      if (delta) differences++
      maxDifference = Math.max(maxDifference, delta)
    }
  }
  assert.equal(
    differences,
    0,
    `${context}: ${differences} changed channels, maximum change ${maxDifference}/255`,
  )
}

function embeddedPng(svg) {
  const base64 = svg.toString().match(/data:image\/png;base64,([^"']+)/)?.[1]
  assert.ok(base64, 'Raster SVG export must contain an embedded PNG')
  return Buffer.from(base64, 'base64')
}

function icoPng(ico) {
  assert.equal(ico.readUInt16LE(0), 0)
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 1)
  const length = ico.readUInt32LE(14)
  const offset = ico.readUInt32LE(18)
  assert.equal(offset + length, ico.length)
  return ico.subarray(offset, offset + length)
}

test('Every supported input exports valid bytes to every output (56 routes)', async (t) => {
  for (const [inputFormat, input] of Object.entries(inputs)) {
    const original = await decoded(input)
    for (const format of ['png', 'webp', 'jpeg', 'avif', 'gif', 'tiff', 'svg', 'ico']) {
      await t.test(`${inputFormat} → ${format}`, async () => {
        const result = await convertImage(input, { format, svgRasterSize: 0 })
        assert.ok(result.data.length > 0)
        const output = format === 'ico' ? icoPng(result.data) : result.data
        const metadata = await sharp(output).metadata()
        const expectedFormat = format === 'avif' ? 'heif' : format === 'ico' ? 'png' : format
        assert.equal(metadata.format, expectedFormat)
        assert.equal(metadata.width, format === 'ico' ? 256 : width)
        assert.equal(metadata.height, format === 'ico' ? 256 : height)
        assert.equal(result.width, metadata.width)
        assert.equal(result.height, metadata.height)
        const pixels = await decoded(output)
        assert.equal(pixels.info.width, metadata.width)
        assert.equal(pixels.info.height, metadata.height)
        if (['png', 'webp', 'avif', 'tiff'].includes(format)) {
          assertVisiblePixelsEqual(pixels.data, original.data, `${inputFormat} → ${format}`)
        }
        if (format === 'svg' && inputFormat !== 'svg') {
          const embedded = await decoded(embeddedPng(result.data))
          assertVisiblePixelsEqual(embedded.data, original.data, `${inputFormat} → embedded PNG`)
        }
      })
    }
  }
})

test('Quality defaults use lossless artwork exports and preserve SVG vectors', () => {
  const options = normalizeOptions({})
  assert.equal(options.lossless, true)
  assert.equal(options.svgMode, 'preserve')
  assert.equal(options.svgRasterSize, 2048)
})

test('Small SVGs export at 2048 px by default and can keep their original dimensions', async () => {
  const large = await convertImage(vector, { format: 'png' })
  assert.deepEqual([large.width, large.height], [2048, 1365])
  const metadata = await sharp(large.data).metadata()
  assert.deepEqual([metadata.width, metadata.height], [2048, 1365])
  const original = await convertImage(vector, { format: 'png', svgRasterSize: 0 })
  assert.deepEqual([original.width, original.height], [48, 32])
})

test('Requested SVG enlargement renders vector paths at target resolution', async () => {
  const line = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M2.5 0V16" stroke="#ff0000" stroke-width=".1"/></svg>',
  )
  const result = await convertImage(line, { format: 'png', width: 160, enlarge: false })
  assert.deepEqual([result.width, result.height], [160, 160])
  const pixels = await decoded(result.data)
  const rowAlpha = Array.from({ length: 160 }, (_, x) => pixels.data[(80 * 160 + x) * 4 + 3])
  const affected = rowAlpha.filter((alpha) => alpha > 0)
  assert.ok(
    affected.length <= 2,
    `A 1 px vector stroke should cover at most 2 pixels; found ${affected.length}`,
  )
  assert.ok(Math.max(...rowAlpha) >= 120, 'A thin vector stroke should remain visible after enlargement')
})

test('Raster defaults never silently enlarge an image, including embedded SVG export', async () => {
  for (const format of ['png', 'webp', 'svg']) {
    const result = await convertImage(inputs.png, { format, width: 2048 })
    assert.deepEqual([result.width, result.height], [48, 32], format)
  }
  const result = await convertImage(inputs.png, { format: 'png', width: 96, enlarge: true })
  assert.deepEqual([result.width, result.height], [96, 64])
  assert.ok(result.warnings.some((warning) => /cannot restore missing detail/.test(warning)))
})

test('SVG to SVG default returns original vector data without tracing', async () => {
  const result = await convertImage(vector, { format: 'svg' })
  assert.ok(result.data.equals(vector), 'Unchanged SVG export should preserve exact original bytes')
  assert.match(result.data.toString(), /linearGradient/)
  assert.doesNotMatch(result.data.toString(), /<image/)
  assert.deepEqual(result.warnings, [])
})

test('Resized SVG retains viewBox coordinates and gradients', async () => {
  const result = await convertImage(vector, { format: 'svg', width: 384 })
  assert.deepEqual([result.width, result.height], [384, 256])
  assert.match(result.data.toString(), /viewBox="0 0 48 32"/)
  assert.match(result.data.toString(), /linearGradient/)
  assert.doesNotMatch(result.data.toString(), /<image/)
  const actual = await decoded(result.data)
  const expected = await sharp(vector).resize(384, 256).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(actual.data, expected, 'Resized vector render')
})

test('Resizing SVG without viewBox adds source coordinates and overrides inline dimensions', async () => {
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" style="width:48px;height:32px"><rect x="2" y="2" width="44" height="28" fill="#f00"/></svg>',
  )
  const result = await convertImage(input, { format: 'svg', width: 96 })
  assert.match(result.data.toString(), /viewBox="0 0 48 32"/)
  const actual = await decoded(result.data)
  assert.deepEqual([actual.info.width, actual.info.height], [96, 64])
  const expected = await sharp(input).resize(96, 64).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(actual.data, expected, 'Resized SVG with inline dimensions')
})

test('Resized SVG overrides root dimensions from an internal stylesheet', async () => {
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32"><style>svg { width: 48px !important; height: 32px !important; }</style><rect x="3" y="3" width="42" height="26" fill="blue"/></svg>',
  )
  const result = await convertImage(input, { format: 'svg', width: 192 })
  const actual = await decoded(result.data)
  assert.deepEqual([result.width, result.height], [192, 128])
  assert.deepEqual([actual.info.width, actual.info.height], [192, 128])
  assert.doesNotMatch(result.data.toString(), /<image/)
  const expected = await sharp(input).resize(192, 128).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(actual.data, expected, 'Resized SVG with stylesheet dimensions')
})

test('Stretching a letterboxed SVG embeds the rendered result and reports that vector paths changed', async () => {
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="red"/><circle cx="16" cy="16" r="10" fill="blue"/></svg>',
  )
  const result = await convertImage(input, { format: 'svg', width: 96, height: 96, fit: 'fill' })
  assert.deepEqual([result.width, result.height], [96, 96])
  assert.ok(result.warnings.some((warning) => /stretching.*embeds a PNG/.test(warning)))
  const actual = await decoded(embeddedPng(result.data))
  const expected = await sharp(input).resize(96, 96, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(actual.data, expected, 'Stretched letterboxed SVG')
})

test('Solid-background SVG export covers letterboxing and is unaffected by SVG opacity or shape CSS', async () => {
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 32 32" opacity=".5"><style>rect { fill: #00ff00; }</style><rect x="4" y="4" width="24" height="24"/></svg>',
  )
  const result = await convertImage(input, { format: 'svg', transparent: false, background: '#ffffff' })
  assert.ok(result.warnings.some((warning) => /solid background.*embeds a PNG/.test(warning)))
  const payload = embeddedPng(result.data)
  assert.equal((await sharp(payload).metadata()).hasAlpha, false)
  const actual = (await decoded(payload)).data
  const expected = await sharp(input).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(actual, expected, 'Flattened SVG appearance')
  assert.ok(actual.subarray(0, 4).equals(Buffer.from([255, 255, 255, 255])))
})

test('Embedded SVG stores exact pixels; renderer alpha rounding changes displayed channels by at most 2', async () => {
  const result = await convertImage(inputs.png, { format: 'svg' })
  assertVisiblePixelsEqual(
    (await decoded(embeddedPng(result.data))).data,
    (await decoded(inputs.png)).data,
    'Embedded payload',
  )
  // SVG renderers premultiply/unpremultiply alpha, so compare the visible appearance on opaque backgrounds.
  for (const background of ['#ffffff', '#000000']) {
    const actual = await sharp(result.data).flatten({ background }).raw().toBuffer()
    const expected = await sharp(inputs.png).flatten({ background }).raw().toBuffer()
    assert.equal(actual.length, expected.length)
    let maxDifference = 0
    for (let i = 0; i < actual.length; i++)
      maxDifference = Math.max(maxDifference, Math.abs(actual[i] - expected[i]))
    assert.ok(
      maxDifference <= 2,
      `SVG renderer changed visible appearance by ${maxDifference}/255 on ${background}`,
    )
  }
})

test('ICO centers rectangular raster artwork without stretching or unwanted enlargement', async () => {
  const result = await convertImage(inputs.png, { format: 'ico' })
  const content = icoPng(result.data)
  const metadata = await sharp(content).metadata()
  assert.deepEqual([metadata.width, metadata.height], [256, 256])
  const extracted = await sharp(content)
    .extract({ left: 104, top: 112, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer()
  assertVisiblePixelsEqual(extracted, (await decoded(inputs.png)).data, 'Centered ICO content')
  const corner = await sharp(content)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .ensureAlpha()
    .raw()
    .toBuffer()
  assert.equal(corner[3], 0, 'Padding should remain transparent')
  const vectorIcon = await convertImage(vector, { format: 'ico' })
  const pixels = await sharp(icoPng(vectorIcon.data))
    .extract({ left: 0, top: 42, width: 256, height: 171 })
    .ensureAlpha()
    .raw()
    .toBuffer()
  const expected = await sharp(vector).resize(256, 171, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
  assertVisiblePixelsEqual(pixels, expected, 'Vector ICO content')
})

function pngChunk(type, data) {
  const chunk = Buffer.alloc(data.length + 12)
  chunk.writeUInt32BE(data.length, 0)
  chunk.write(type, 4)
  data.copy(chunk, 8)
  let crc = 0xffffffff
  for (const byte of chunk.subarray(4, -4)) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4)
  return chunk
}

function png16() {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(3, 0)
  header.writeUInt32BE(2, 4)
  header[8] = 16
  header[9] = 6
  const rows = Buffer.alloc(2 * (1 + 3 * 8))
  const values = [
    1, 32768, 65534, 65535, 257, 12345, 56789, 45000, 65500, 9, 19002, 32768, 50123, 4242, 61357, 65535, 99,
    35123, 52001, 18000, 7000, 48001, 40002, 65535,
  ]
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 12; x++) rows.writeUInt16BE(values[y * 12 + x], y * 25 + 1 + x * 2)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

test('16-bit PNG and TIFF preserve meaningful low bits through lossless exports', async (t) => {
  const source = png16()
  const tiff = await sharp(source).toColourspace('rgb16').tiff({ compression: 'lzw' }).toBuffer()
  for (const [name, input] of [
    ['png', source],
    ['tiff', tiff],
  ]) {
    const expected = await sharp(input).toColourspace('rgb16').raw({ depth: 'ushort' }).toBuffer()
    assert.equal((await sharp(input).metadata()).depth, 'ushort')
    for (const format of ['png', 'tiff']) {
      await t.test(`${name} 16-bit → ${format} 16-bit`, async () => {
        const result = await convertImage(input, { format })
        assert.equal((await sharp(result.data).metadata()).depth, 'ushort')
        const actual = await sharp(result.data).toColourspace('rgb16').raw({ depth: 'ushort' }).toBuffer()
        assert.ok(actual.equals(expected), '16-bit values, including low bits, must remain exact')
      })
    }
  }
})

test('ICC-profile input is converted consistently to sRGB for standard downloads', async () => {
  const input = await sharp(vector).withIccProfile('p3').png().toBuffer()
  assert.ok((await sharp(input).metadata()).icc?.length)
  const expected = (await decoded(input)).data
  for (const format of ['png', 'webp', 'tiff']) {
    const result = await convertImage(input, { format })
    assertVisiblePixelsEqual((await decoded(result.data)).data, expected, `ICC → ${format}`)
  }
})

test('PNG and TIFF do not lose pixels when the quality slider is low', async () => {
  const expected = (await decoded(inputs.png)).data
  for (const format of ['png', 'tiff']) {
    const result = await convertImage(inputs.png, { format, quality: 1, lossless: false })
    assertVisiblePixelsEqual((await decoded(result.data)).data, expected, `${format} remains lossless`)
  }
})

test('Optional lossy exports remain valid at the quality limits', async (t) => {
  for (const format of ['webp', 'avif', 'jpeg']) {
    for (const quality of [1, 100]) {
      await t.test(`${format} quality ${quality}`, async () => {
        const result = await convertImage(inputs.png, { format, quality, lossless: false })
        const pixels = await decoded(result.data)
        assert.deepEqual([pixels.info.width, pixels.info.height], [48, 32])
        assert.equal((await sharp(result.data).metadata()).hasAlpha, format !== 'jpeg')
      })
    }
  }
})

test('EXIF rotation preserves oriented pixel positions and removes stale rotation metadata', async () => {
  const input = await sharp(vector)
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 100 })
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const expected = await decoded(input)
  const result = await convertImage(input, { format: 'png' })
  assert.deepEqual([result.width, result.height], [32, 48])
  assertVisiblePixelsEqual((await decoded(result.data)).data, expected.data, 'EXIF rotation')
  assert.ok([undefined, 1].includes((await sharp(result.data).metadata()).orientation))
})

test('Animated and multipage raster inputs export the first frame or page with accurate dimensions and warning', async (t) => {
  const frameData = Buffer.from([255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255])
  for (const format of ['gif', 'webp', 'tiff']) {
    await t.test(format, async () => {
      const input = await sharp(frameData, { raw: { width: 2, height: 2, channels: 3, pageHeight: 1 } })
        [format](format === 'tiff' ? { compression: 'lzw' } : { lossless: true, delay: [100, 200], loop: 0 })
        .toBuffer()
      const inspection = await inspectImage(input)
      assert.equal(inspection.pages, 2)
      assert.deepEqual([inspection.width, inspection.height], [2, 1])
      const result = await convertImage(input, { format: 'png' })
      assert.deepEqual([result.width, result.height], [2, 1])
      assert.ok(result.warnings.some((warning) => /first frame or page/.test(warning)))
      const pixels = await sharp(result.data).removeAlpha().raw().toBuffer()
      assert.ok(pixels.equals(Buffer.from([255, 0, 0, 255, 0, 0])))
    })
  }
})
