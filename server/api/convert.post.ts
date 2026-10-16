import { convertImage } from '../utils/converter.mjs'
import { readImage, imageError } from '../utils/request'

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    try {
        let options
        try {
            options = JSON.parse(getHeader(event, 'x-conversion-options') || '{}')
        } catch {
            throw createError({ statusCode: 400, statusMessage: 'Invalid conversion settings.' })
        }
        if (!options || typeof options !== 'object' || Array.isArray(options))
            throw createError({ statusCode: 400, statusMessage: 'Invalid conversion settings.' })
        const result = await convertImage(await readImage(event), options)
        setHeaders(event, {
            'Content-Type': result.mime,
            'X-Image-Width': String(result.width),
            'X-Image-Height': String(result.height),
            'X-Image-Warnings': JSON.stringify(result.warnings),
            'Content-Disposition': 'attachment',
            'X-Content-Type-Options': 'nosniff',
        })
        return result.data
    } catch (error) {
        imageError(error)
    }
})
