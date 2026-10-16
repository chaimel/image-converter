import sharp from 'sharp'
import ImageTracer from 'imagetracerjs'
import { XMLSerializer } from '@xmldom/xmldom'
import { DEFAULT_OPTIONS, outputDimensions } from '../../shared/image-settings.mjs'
import { validateSvg, SvgValidationError } from './svg.mjs'

export const MAX_BYTES = 40 * 1024 * 1024
export const MAX_PIXELS = 40_000_000
export const formats = {
    png: 'image/png',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    avif: 'image/avif',
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
}

export class ConversionError extends Error {}

async function inputImage(bytes) {
    if (!bytes.length) throw new ConversionError('This file is empty.')
    if (bytes.length > MAX_BYTES) throw new ConversionError('Choose an image smaller than 40 MB.')
    // Validate preserved markup as well as rasterized input. Never pass a user-supplied path to Sharp.
    let svgDoc
    try {
        svgDoc = validateSvg(bytes)
    } catch (error) {
        if (error instanceof SvgValidationError) throw new ConversionError(error.message)
        throw error
    }
    const image = sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'error', pages: 1 }).autoOrient()
    const meta = await image.metadata()
    if (meta.format === 'svg' && !svgDoc)
        throw new ConversionError('Save this SVG as plain UTF-8 text before converting it.')
    return { image, meta, svgDoc }
}

export function normalizeOptions(raw = {}) {
    const format = raw.format || 'webp'
    if (!Object.hasOwn(formats, format)) throw new ConversionError('This output format is not supported.')
    const quality = Number(raw.quality ?? DEFAULT_OPTIONS.quality)
    if (!Number.isInteger(quality) || quality < 1 || quality > 100)
        throw new ConversionError('Quality must be between 1 and 100.')
    const dimension = (value) => {
        if (value === '' || value == null) return undefined
        const parsed = Number(value)
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8192)
            throw new ConversionError('Dimensions must be whole numbers from 1 to 8192.')
        return parsed
    }
    const width = dimension(raw.width)
    const height = dimension(raw.height)
    if (width && height && width * height > MAX_PIXELS)
        throw new ConversionError('The output is limited to 40 megapixels.')
    const background = raw.background || '#ffffff'
    if (!/^#[\da-f]{6}$/i.test(background)) throw new ConversionError('Choose a valid background color.')
    const svgMode = raw.svgMode ?? DEFAULT_OPTIONS.svgMode
    if (!['preserve', 'trace', 'embed'].includes(svgMode))
        throw new ConversionError('Choose a valid SVG mode.')
    const colors = Number(raw.colors ?? DEFAULT_OPTIONS.colors)
    if (![2, 4, 8, 16, 32, 64].includes(colors)) throw new ConversionError('Choose a valid tracing palette.')
    const svgRasterSize = Number(raw.svgRasterSize ?? DEFAULT_OPTIONS.svgRasterSize)
    if (![0, 1024, 2048, 4096].includes(svgRasterSize))
        throw new ConversionError('Choose a valid SVG export resolution.')
    const traceResolution = Number(raw.traceResolution ?? DEFAULT_OPTIONS.traceResolution)
    if (![512, 1024, 1536].includes(traceResolution))
        throw new ConversionError('Choose a valid tracing resolution.')
    return {
        format,
        quality,
        width,
        height,
        background,
        svgMode,
        colors,
        svgRasterSize,
        traceResolution,
        transparent: raw.transparent !== false,
        lossless: raw.lossless !== false,
        fit: raw.fit === 'fill' ? 'fill' : 'inside',
        enlarge: raw.enlarge === true,
    }
}

export async function inspectImage(bytes) {
    const { image, meta: metadata } = await inputImage(bytes)
    const rotated = [5, 6, 7, 8].includes(metadata.orientation)
    const preview = await image
        .resize({ width: 880, height: 880, fit: 'inside', withoutEnlargement: metadata.format !== 'svg' })
        .png()
        .toBuffer()
    return {
        width: rotated ? metadata.height : metadata.width,
        height: rotated ? metadata.width : metadata.pageHeight || metadata.height,
        format: metadata.format === 'heif' ? 'avif' : metadata.format,
        pages: metadata.pages || 1,
        hasAlpha: metadata.hasAlpha || false,
        preview: `data:image/png;base64,${preview.toString('base64')}`,
    }
}

function preserveSvg(bytes, doc, source, size) {
    const root = doc.documentElement
    if (size.width === source.width && size.height === source.height && root.namespaceURI) return bytes
    const viewBox = root.getAttribute('viewBox') || `0 0 ${source.width} ${source.height}`
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    root.setAttribute('viewBox', viewBox)
    root.setAttribute('width', String(size.width))
    root.setAttribute('height', String(size.height))
    // Stylesheets can override presentation attributes, even without an existing inline style.
    const style = (root.getAttribute('style') || '').replace(/(^|;)\s*(?:width|height)\s*:[^;]*/gi, '')
    root.setAttribute('style', `${style};width:${size.width}px!important;height:${size.height}px!important`)
    return Buffer.from(new XMLSerializer().serializeToString(doc))
}

export async function convertImage(bytes, rawOptions) {
    const options = normalizeOptions(rawOptions)
    let { image, meta, svgDoc } = await inputImage(bytes)
    const rotated = [5, 6, 7, 8].includes(meta.orientation)
    const sourceWidth = rotated ? meta.height : meta.width
    const sourceHeight = rotated ? meta.width : meta.pageHeight || meta.height
    const source = { width: sourceWidth, height: sourceHeight, format: meta.format }
    const size = outputDimensions(source, options)
    if (size.width * size.height > MAX_PIXELS)
        throw new ConversionError('The output is limited to 40 megapixels. Choose smaller dimensions.')
    const preserveRequested =
        options.format === 'svg' && options.svgMode === 'preserve' && meta.format === 'svg'
    const stretchSvg = options.fit === 'fill' && size.width * sourceHeight !== size.height * sourceWidth
    if (preserveRequested && options.transparent && !stretchSvg) {
        return {
            data: preserveSvg(bytes, svgDoc, source, size),
            mime: formats.svg,
            width: size.width,
            height: size.height,
            warnings: [],
        }
    }
    // Sharp renders SVG paths again at the target size. Raster images retain the no-enlargement guard.
    image = image.resize({
        width: size.imageWidth || size.width,
        height: size.imageHeight || size.height,
        fit: 'fill',
    })
    if (options.format === 'ico') {
        const left = Math.floor((size.width - size.imageWidth) / 2)
        const top = Math.floor((size.height - size.imageHeight) / 2)
        image = image.extend({
            left,
            top,
            right: size.width - size.imageWidth - left,
            bottom: size.height - size.imageHeight - top,
            background: options.transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : options.background,
        })
    }
    if (!options.transparent || options.format === 'jpeg')
        image = image.flatten({ background: options.background })
    const warnings = []
    if (preserveRequested)
        warnings.push(
            'Adding a solid background or stretching SVG artwork embeds a PNG to preserve its appearance. Keep transparency and aspect ratio to retain the original vectors.',
        )
    if ((meta.pages || 1) > 1) warnings.push('Only the first frame or page was converted.')
    if (
        meta.format !== 'svg' &&
        (size.width > sourceWidth || size.height > sourceHeight) &&
        options.format !== 'ico'
    )
        warnings.push('Enlarging a raster image cannot restore missing detail.')
    if (options.format === 'jpeg')
        warnings.push(
            'JPEG uses lossy compression and a solid background. Use PNG or lossless WebP for exact artwork.',
        )
    if (options.format === 'gif')
        warnings.push(
            'GIF uses at most 256 colors and one transparent color; gradients and soft edges can change.',
        )
    if (meta.format === 'svg') {
        const svg = bytes.toString('utf8')
        if (/<(?:\w+:)?image[\s>]/i.test(svg))
            warnings.push('Embedded bitmap images in this SVG retain their original detail when enlarged.')
        if (/<(?:\w+:)?text[\s>]/i.test(svg))
            warnings.push(
                'SVG text uses locally installed fonts. Convert text to paths in your editor if its appearance changes.',
            )
    }
    if (meta.depth === 'ushort' && ['png', 'tiff'].includes(options.format))
        image = image.toColourspace('rgb16')
    else if (meta.depth !== 'uchar' && meta.format !== 'svg')
        warnings.push('This export uses 8-bit channels. Use PNG or TIFF to preserve 16-bit raster artwork.')
    let data, info
    if (options.format === 'svg') {
        const rendered = await image.png().toBuffer({ resolveWithObject: true })
        info = rendered.info
        if (options.svgMode !== 'trace') {
            data = Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${info.width}" height="${info.height}" viewBox="0 0 ${info.width} ${info.height}"><image width="${info.width}" height="${info.height}" xlink:href="data:image/png;base64,${rendered.data.toString('base64')}"/></svg>`,
            )
            warnings.push('SVG contains an embedded image, not editable vector paths.')
        } else {
            const pixels = await sharp(rendered.data)
                .resize({
                    width: options.traceResolution,
                    height: options.traceResolution,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true })
            let svg = ImageTracer.imagedataToSVG(
                {
                    width: pixels.info.width,
                    height: pixels.info.height,
                    data: new Uint8ClampedArray(pixels.data),
                },
                {
                    numberofcolors: options.colors,
                    colorsampling: 2,
                    mincolorratio: 0,
                    ltres: 0.5,
                    qtres: 0.5,
                    pathomit: 0,
                    roundcoords: 2,
                    viewbox: true,
                    desc: false,
                },
            )
            svg = svg.replace('<svg ', `<svg width="${info.width}" height="${info.height}" `)
            data = Buffer.from(svg)
            warnings.push('Vector tracing simplifies artwork; fine details and gradients may change.')
        }
    } else if (options.format === 'ico') {
        const rendered = await image.png().toBuffer({ resolveWithObject: true })
        info = rendered.info
        const header = Buffer.alloc(22)
        header.writeUInt16LE(1, 2)
        header.writeUInt16LE(1, 4)
        header[6] = info.width === 256 ? 0 : info.width
        header[7] = info.height === 256 ? 0 : info.height
        header.writeUInt16LE(1, 10)
        header.writeUInt16LE(32, 12)
        header.writeUInt32LE(rendered.data.length, 14)
        header.writeUInt32LE(22, 18)
        data = Buffer.concat([header, rendered.data])
    } else {
        const encoders = {
            png: () => image.png({ compressionLevel: 9 }),
            webp: () => image.webp({ quality: options.quality, lossless: options.lossless }),
            jpeg: () => image.jpeg({ quality: options.quality, mozjpeg: true, chromaSubsampling: '4:4:4' }),
            avif: () => image.avif({ quality: options.quality, lossless: options.lossless, effort: 4 }),
            gif: () => image.gif({ effort: 7, colours: 256, dither: 1 }),
            tiff: () => image.tiff({ compression: 'lzw' }),
        }
        const rendered = await encoders[options.format]().toBuffer({ resolveWithObject: true })
        data = rendered.data
        info = rendered.info
    }
    return { data, mime: formats[options.format], width: info.width, height: info.height, warnings }
}
