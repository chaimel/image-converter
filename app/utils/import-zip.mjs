import { inflate, strFromU8 } from 'fflate'

const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024
const IMAGE_TYPES = {
    svg: 'image/svg+xml',
    png: 'image/png',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    avif: 'image/avif',
    gif: 'image/gif',
    tif: 'image/tiff',
    tiff: 'image/tiff',
}
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    return value >>> 0
})

function abortIfNeeded(signal) {
    if (signal?.aborted) throw new DOMException('Import cancelled.', 'AbortError')
}

function invalid(message = 'The ZIP is damaged or incomplete. Export it again and retry.') {
    return new Error(message)
}

function checkLimit(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ZIP ${label} limit.`)
}

function entriesIn(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const u16 = (at) => view.getUint16(at, true)
    const u32 = (at) => view.getUint32(at, true)
    let end = bytes.length - 22
    const minimum = Math.max(0, end - 65535)
    for (; end >= minimum; end--) {
        if (u32(end) === 0x06054b50 && end + 22 + u16(end + 20) === bytes.length) break
    }
    if (end < minimum) throw invalid()
    if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) {
        throw invalid('Split ZIP archives are not supported. Combine the parts into one ZIP first.')
    }
    const count = u16(end + 10),
        size = u32(end + 12),
        start = u32(end + 16)
    if (count === 65535 || size === 0xffffffff || start === 0xffffffff) {
        throw invalid('ZIP64 archives are not supported. Create a regular ZIP under 200 MB.')
    }
    const directoryEnd = start + size
    if (directoryEnd > end) throw invalid()
    const entries = []
    let offset = start
    for (let i = 0; i < count; i++) {
        if (offset + 46 > directoryEnd || u32(offset) !== 0x02014b50) throw invalid()
        const nameLength = u16(offset + 28),
            extraLength = u16(offset + 30),
            commentLength = u16(offset + 32)
        const next = offset + 46 + nameLength + extraLength + commentLength
        if (next > directoryEnd || u16(offset + 34)) throw invalid()
        const flags = u16(offset + 8)
        const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength)
        const name = strFromU8(nameBytes, !(flags & 2048)).replaceAll('\\', '/')
        const entry = {
            name,
            nameBytes,
            flags,
            method: u16(offset + 10),
            crc: u32(offset + 16),
            compressedSize: u32(offset + 20),
            originalSize: u32(offset + 24),
            localOffset: u32(offset + 42),
            directoryStart: start,
            isSymlink: ((u32(offset + 38) >>> 16) & 0xf000) === 0xa000,
        }
        if ([entry.compressedSize, entry.originalSize, entry.localOffset].includes(0xffffffff)) {
            throw invalid('ZIP64 archives are not supported. Create a regular ZIP under 200 MB.')
        }
        entries.push(entry)
        offset = next
    }
    if (offset !== directoryEnd) throw invalid()
    return entries
}

function compressedData(bytes, entry) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const at = entry.localOffset
    if (at + 30 > entry.directoryStart || view.getUint32(at, true) !== 0x04034b50) throw invalid()
    const flags = view.getUint16(at + 6, true)
    if (flags !== entry.flags || view.getUint16(at + 8, true) !== entry.method) throw invalid()
    const nameLength = view.getUint16(at + 26, true),
        extraLength = view.getUint16(at + 28, true)
    const dataStart = at + 30 + nameLength + extraLength
    if (dataStart + entry.compressedSize > entry.directoryStart || nameLength !== entry.nameBytes.length)
        throw invalid()
    if (!entry.nameBytes.every((byte, index) => byte === bytes[at + 30 + index])) throw invalid()
    if (
        !(flags & 8) &&
        (view.getUint32(at + 14, true) !== entry.crc ||
            view.getUint32(at + 18, true) !== entry.compressedSize ||
            view.getUint32(at + 22, true) !== entry.originalSize)
    )
        throw invalid()
    return bytes.subarray(dataStart, dataStart + entry.compressedSize)
}

function boundedInflate(data, expectedSize, signal) {
    return new Promise((resolve, reject) => {
        let terminate
        const onAbort = () => {
            terminate?.()
            signal?.removeEventListener('abort', onAbort)
            reject(new DOMException('Import cancelled.', 'AbortError'))
        }
        signal?.addEventListener('abort', onAbort, { once: true })
        if (signal?.aborted) return onAbort()
        try {
            // fflate's `size` allocates a fixed worker output buffer. The extra byte
            // detects streams that expand beyond the directory's declared size.
            // Copy only this entry so the worker never clones the whole ZIP buffer.
            terminate = inflate(data.slice(), { size: expectedSize + 1, consume: true }, (error, output) => {
                signal?.removeEventListener('abort', onAbort)
                if (signal?.aborted) return onAbort()
                if (error || output.length !== expectedSize) reject(invalid())
                else resolve(output)
            })
        } catch {
            signal?.removeEventListener('abort', onAbort)
            reject(invalid())
        }
    })
}

async function validCrc(bytes, expected, signal) {
    let crc = 0xffffffff
    for (let start = 0; start < bytes.length; start += 1024 * 1024) {
        abortIfNeeded(signal)
        const end = Math.min(start + 1024 * 1024, bytes.length)
        for (let i = start; i < end; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8)
        if (end < bytes.length) await new Promise((resolve) => setTimeout(resolve, 0))
    }
    return (crc ^ 0xffffffff) >>> 0 === expected
}

/** Extract supported images without inflating unrelated ZIP entries.
 * @param {File | Blob} file
 * @param {{maxFiles?: number, maxBytes?: number, maxFileBytes?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<{files: {file: File, sourcePath: string}[], skipped: number, warnings: string[]}>}
 */
export async function extractZipImages(
    file,
    { maxFiles = 50, maxBytes = 200 * 1024 * 1024, maxFileBytes = 40 * 1024 * 1024, signal } = {},
) {
    abortIfNeeded(signal)
    checkLimit(maxFiles, 'image count')
    checkLimit(maxBytes, 'total size')
    checkLimit(maxFileBytes, 'image size')
    if (file.size > MAX_ARCHIVE_BYTES) throw invalid('This ZIP is too large. Use a ZIP under 200 MB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    abortIfNeeded(signal)
    const entries = entriesIn(bytes)
    const selected = []
    const warnings = []
    let skipped = 0,
        total = 0,
        unsafe = 0,
        nested = 0
    for (const entry of entries) {
        if (entry.name.endsWith('/')) continue
        const segments = entry.name.split('/')
        const name = segments.at(-1)
        const extension = name?.split('.').at(-1)?.toLowerCase()
        if (
            entry.isSymlink ||
            entry.name.startsWith('/') ||
            /^[a-z]:/i.test(entry.name) ||
            segments.includes('..') ||
            /[\x00-\x1f]/.test(entry.name)
        ) {
            skipped++
            unsafe++
            continue
        }
        if (
            segments.includes('__MACOSX') ||
            segments.some((part) => part.startsWith('._')) ||
            !Object.hasOwn(IMAGE_TYPES, extension)
        ) {
            skipped++
            if (extension === 'zip') nested++
            continue
        }
        if (entry.flags & 65) throw invalid(`“${name}” is encrypted. Remove the ZIP password and retry.`)
        if (![0, 8].includes(entry.method))
            throw invalid(
                `“${name}” uses unsupported ZIP compression. Recreate the ZIP using Deflate or Store.`,
            )
        if (entry.originalSize > maxFileBytes)
            throw invalid(
                `“${name}” is too large after extraction. Each image must fit the ${Math.round(maxFileBytes / 1024 / 1024)} MB limit.`,
            )
        if (selected.length >= maxFiles)
            throw invalid(
                `This ZIP contains more images than the ${maxFiles} remaining spaces. Import a smaller ZIP.`,
            )
        total += entry.originalSize
        if (total > maxBytes)
            throw invalid('The expanded images exceed the remaining batch size limit. Import a smaller ZIP.')
        if (entry.method === 0 && entry.compressedSize !== entry.originalSize) throw invalid()
        selected.push({
            ...entry,
            data: compressedData(bytes, entry),
            sourcePath: entry.name,
            name,
            type: IMAGE_TYPES[extension],
        })
    }
    if (nested)
        warnings.push(
            `${nested} nested ZIP${nested === 1 ? ' was' : 's were'} skipped. Import those ZIPs separately.`,
        )
    if (unsafe)
        warnings.push(`${unsafe} unsafe or symbolic-link entr${unsafe === 1 ? 'y was' : 'ies were'} skipped.`)
    const files = []
    for (const entry of selected) {
        abortIfNeeded(signal)
        const output =
            entry.method === 0 ? entry.data : await boundedInflate(entry.data, entry.originalSize, signal)
        if (!(await validCrc(output, entry.crc, signal)))
            throw invalid(`“${entry.name}” failed the ZIP integrity check. Export the ZIP again.`)
        abortIfNeeded(signal)
        files.push({
            file: new File([output], entry.name, { type: entry.type }),
            sourcePath: entry.sourcePath,
        })
    }
    return { files, skipped, warnings }
}
