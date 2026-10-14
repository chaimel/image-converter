/**
 * @typedef {object} ExportOptions
 * @property {'webp'|'png'|'jpeg'|'svg'|'avif'|'gif'|'tiff'|'ico'} format
 * @property {number} quality
 * @property {string|number|undefined} width
 * @property {string|number|undefined} height
 * @property {'inside'|'fill'} fit
 * @property {boolean} enlarge
 * @property {boolean} transparent
 * @property {string} background
 * @property {boolean} lossless
 * @property {'preserve'|'trace'|'embed'} svgMode
 * @property {number} colors
 * @property {number} traceResolution
 * @property {number} svgRasterSize
 */
/** @type {Readonly<ExportOptions>} */
export const DEFAULT_OPTIONS = Object.freeze({
  format: 'webp',
  quality: 95,
  width: '',
  height: '',
  fit: 'inside',
  enlarge: false,
  transparent: true,
  background: '#ffffff',
  lossless: true,
  svgMode: 'preserve',
  colors: 32,
  traceResolution: 1024,
  svgRasterSize: 2048,
})

/** Shared by the export engine and the UI so displayed dimensions match the download. */
export function outputDimensions(source, options) {
  const sw = source.width
  const sh = source.height
  const vector = source.format === 'svg'
  const canEnlarge = vector || options.enlarge === true
  let width = Number(options.width) || undefined
  let height = Number(options.height) || undefined
  if (options.format === 'ico') {
    const size = Math.min(width || height || 256, height || width || 256, 256)
    const scale = Math.min(size / sw, size / sh, canEnlarge ? Infinity : 1)
    return {
      width: size,
      height: size,
      imageWidth: Math.max(1, Math.round(sw * scale)),
      imageHeight: Math.max(1, Math.round(sh * scale)),
    }
  }
  const svgSize = options.svgRasterSize ?? DEFAULT_OPTIONS.svgRasterSize
  if (vector && options.format !== 'svg' && !width && !height && svgSize > Math.max(sw, sh)) {
    if (sw >= sh) width = svgSize
    else height = svgSize
  }
  if (!width && !height) return { width: sw, height: sh }
  if (options.fit === 'fill' && width && height) {
    return {
      width: canEnlarge ? width : Math.min(width, sw),
      height: canEnlarge ? height : Math.min(height, sh),
    }
  }
  const scale = Math.min(
    width ? width / sw : Infinity,
    height ? height / sh : Infinity,
    canEnlarge ? Infinity : 1,
  )
  return { width: Math.max(1, Math.round(sw * scale)), height: Math.max(1, Math.round(sh * scale)) }
}
