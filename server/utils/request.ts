import { createError, getHeader, type H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import { MAX_BYTES, ConversionError } from './converter.mjs'

export async function readImage(event: H3Event): Promise<Buffer> {
    const host = getHeader(event, 'host') || ''
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'This converter is only available on localhost.',
        })
    }
    const origin = getHeader(event, 'origin')
    if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
        throw createError({ statusCode: 403, statusMessage: 'Cross-origin requests are not allowed.' })
    }
    if (Number(getHeader(event, 'content-length')) > MAX_BYTES) {
        throw createError({ statusCode: 413, statusMessage: 'Choose an image smaller than 40 MB.' })
    }
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of event.node.req) {
        size += chunk.length
        if (size > MAX_BYTES)
            throw createError({ statusCode: 413, statusMessage: 'Choose an image smaller than 40 MB.' })
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
}

export function imageError(error: unknown): never {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({
        statusCode: 422,
        statusMessage:
            error instanceof ConversionError
                ? error.message
                : 'This image could not be read. It may be damaged or use an unsupported format.',
    })
}
