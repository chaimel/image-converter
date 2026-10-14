import { zipSync } from 'fflate'

/** Build a flat archive without overwriting images that share a basename.
 * @param {{name: string, blob: Blob}[]} images
 */
export async function createImageArchive(images) {
  const entries = Object.create(null)
  for (const image of images) {
    const original = image.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'image'
    const dot = original.lastIndexOf('.')
    const stem = dot > 0 ? original.slice(0, dot) : original
    const extension = dot > 0 ? original.slice(dot) : ''
    let name = original,
      count = 2
    while (Object.hasOwn(entries, name)) name = `${stem}-${count++}${extension}`
    entries[name] = new Uint8Array(await image.blob.arrayBuffer())
  }
  return zipSync(entries, { level: 0 })
}
