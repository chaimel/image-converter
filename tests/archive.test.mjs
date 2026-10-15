import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync, strFromU8 } from 'fflate'
import { createImageArchive } from '../app/utils/archive.mjs'

test('Batch archive preserves duplicates and exact image bytes', async () => {
  const zip = await createImageArchive([
    { name: 'sticker.webp', blob: new Blob(['first']) },
    { name: 'sticker-2.webp', blob: new Blob(['second']) },
    { name: 'sticker.webp', blob: new Blob(['third']) },
    { name: '../logo.png', blob: new Blob(['fourth']) },
  ])
  const files = unzipSync(zip)
  assert.equal(Object.keys(files).length, 4)
  assert.equal(strFromU8(files['sticker.webp']), 'first')
  assert.equal(strFromU8(files['sticker-2.webp']), 'second')
  assert.equal(strFromU8(files['sticker-3.webp']), 'third')
  assert.equal(strFromU8(files['.._logo.png']), 'fourth')
})
