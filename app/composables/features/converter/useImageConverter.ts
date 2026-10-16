import { computed, markRaw, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { DEFAULT_OPTIONS, outputDimensions } from '#shared/image-settings.mjs'
import type { ConversionProgress, ExportOptions, Format, Item, PresetId } from '~/types/features/converter'
import { createImageArchive } from '~/utils/archive.mjs'
import { downloadFile } from '~/utils/download'
import { extractZipImages } from '~/utils/import-zip.mjs'
import { captureDroppedFiles } from '~/utils/import-drop.mjs'

type ImportSource = { file: File; sourcePath: string }
type ImportReport = { added: number; skipped: number; warnings: string[] }
const IMAGE_EXTENSION = /\.(svg|png|webp|jpe?g|avif|gif|tiff?)$/i
const MAX_BATCH_BYTES = 200 * 1024 * 1024
const MAX_FILE_BYTES = 40 * 1024 * 1024

type Inspection = Pick<Item, 'preview' | 'width' | 'height' | 'format' | 'pages'>

async function requestError(response: Response): Promise<string> {
    const body = await response.json().catch(() => null)
    return (
        body?.statusMessage || body?.message || `The local converter returned an error (${response.status}).`
    )
}

// The page owns presentation state; this instance owns the batch and its resources.
export function useImageConverter() {
    const items = ref<Item[]>([])
    const options = reactive<ExportOptions>({ ...DEFAULT_OPTIONS })
    const processing = ref(false)
    const packing = ref(false)
    const importing = ref(false)
    const importReport = ref<ImportReport | null>(null)
    const activePreset = ref<PresetId>('custom')
    const notice = ref('')
    const processedCount = ref(0)
    const processingTotal = ref(0)

    let nextId = 0
    let disposed = false
    let applyingPreset = false
    let batchRevision = 0
    let settingsRevision = 0
    let noticeTimeout: ReturnType<typeof setTimeout> | undefined
    const requests = new Set<AbortController>()
    const itemRequests = new Map<number, AbortController>()
    const archiveUrls = new Map<string, ReturnType<typeof setTimeout>>()

    const isReading = computed(() => items.value.some((item) => item.status === 'reading'))
    const busy = computed(() => processing.value || packing.value || importing.value || isReading.value)
    const ready = computed(() =>
        items.value.filter((item) => item.status === 'ready' || (item.status === 'error' && item.preview)),
    )
    const completed = computed(() => items.value.filter((item) => item.result))
    const totalBytes = computed(() => items.value.reduce((sum, item) => sum + item.file.size, 0))
    const savedBytes = computed(() =>
        completed.value.reduce((sum, item) => sum + item.file.size - item.result!.blob.size, 0),
    )
    const hasSvg = computed(() => items.value.some((item) => item.format === 'svg'))
    const conversionProgress = computed<ConversionProgress>(() => ({
        done: processedCount.value,
        total: processingTotal.value,
        percent: processingTotal.value ? Math.round((processedCount.value / processingTotal.value) * 100) : 0,
    }))

    function dismissNotice() {
        clearTimeout(noticeTimeout)
        notice.value = ''
    }

    function message(text: string) {
        if (disposed) return
        dismissNotice()
        notice.value = text
        noticeTimeout = setTimeout(dismissNotice, 7000)
    }

    function contains(item: Item) {
        return !disposed && items.value.some((current) => current.id === item.id)
    }

    function startRequest(item?: Item) {
        const controller = new AbortController()
        requests.add(controller)
        if (item) itemRequests.set(item.id, controller)
        return controller
    }

    function finishRequest(controller: AbortController, item?: Item) {
        requests.delete(controller)
        if (item && itemRequests.get(item.id) === controller) itemRequests.delete(item.id)
    }

    function clearResult(item: Item) {
        if (item.result) URL.revokeObjectURL(item.result.url)
        item.result = undefined
        if (item.preview && item.status !== 'reading') {
            item.status = 'ready'
            item.error = undefined
        }
    }

    function invalidateResults() {
        items.value.forEach(clearResult)
        processedCount.value = 0
        processingTotal.value = 0
    }

    watch(
        options,
        () => {
            settingsRevision++
            if (applyingPreset) return
            activePreset.value = 'custom'
            if (!processing.value) invalidateResults()
        },
        { deep: true, flush: 'sync' },
    )

    async function addFiles(files: File[], sourcePaths: string[] = []) {
        if (disposed || processing.value || packing.value) return
        const added: Item[] = []
        for (const [index, file] of files.entries()) {
            if (!/\.(svg|png|webp|jpe?g|avif|gif|tiff?)$/i.test(file.name)) {
                message(`${file.name}: choose SVG, PNG, WebP, JPG, AVIF, GIF, or TIFF.`)
                continue
            }
            if (file.size > 40 * 1024 * 1024) {
                message(`${file.name} is over the 40 MB file limit.`)
                continue
            }
            if (items.value.length >= 50 || totalBytes.value + file.size > 200 * 1024 * 1024) {
                message('A batch can contain up to 50 files and 200 MB. Clear this batch to add more.')
                break
            }
            const item: Item = reactive({
                id: ++nextId,
                file: markRaw(file),
                sourcePath: sourcePaths[index] || file.webkitRelativePath || file.name,
                preview: '',
                width: 0,
                height: 0,
                format: '',
                pages: 1,
                status: 'reading',
            })
            items.value.push(item)
            added.push(item)
        }

        for (const item of added) {
            if (!contains(item)) continue
            const controller = startRequest(item)
            try {
                const response = await fetch('/api/inspect', {
                    method: 'POST',
                    body: item.file,
                    headers: { 'Content-Type': 'application/octet-stream' },
                    signal: controller.signal,
                })
                if (!response.ok) throw new Error(await requestError(response))
                const inspection: Inspection = await response.json()
                if (!contains(item) || controller.signal.aborted) continue
                Object.assign(item, inspection, { status: 'ready' })
            } catch (error) {
                if (!contains(item) || controller.signal.aborted) continue
                item.status = 'error'
                item.error = error instanceof Error ? error.message : 'Could not read this image.'
            } finally {
                finishRequest(controller, item)
            }
        }
    }

    // Snapshot dropped entries while the browser still exposes the drag data store.
    function addDrop(dataTransfer: DataTransfer) {
        if (disposed || busy.value) return Promise.resolve()
        return importSources(captureDroppedFiles(dataTransfer))
    }

    function importFiles(files: File[]) {
        if (!files.length) return Promise.resolve()
        return importSources(async function* () {
            for (const file of files) {
                yield { file, sourcePath: file.webkitRelativePath || file.name }
            }
        })
    }

    async function importSources(sources: (signal?: AbortSignal) => AsyncIterable<ImportSource>) {
        if (disposed || busy.value) return
        importing.value = true
        importReport.value = null
        const controller = startRequest()
        const revision = batchRevision
        const selected: ImportSource[] = []
        const report: ImportReport = { added: 0, skipped: 0, warnings: [] }
        let selectedBytes = 0
        let scanned = 0
        const warn = (text: string) => {
            if (report.warnings.length < 5) report.warnings.push(text)
            else if (report.warnings.length === 5)
                report.warnings.push('Additional files were skipped. Try a smaller selection to review them.')
        }
        const current = () => !disposed && !controller.signal.aborted && revision === batchRevision
        try {
            for await (const entry of sources(controller.signal)) {
                if (!current()) break
                if (++scanned > 10000) {
                    warn(
                        'Stopped after checking 10,000 files. Choose a smaller folder to add the remaining images.',
                    )
                    break
                }
                if (
                    entry.sourcePath
                        .split(/[\\/]/)
                        .some((part) => part === '__MACOSX' || part.startsWith('._'))
                ) {
                    report.skipped++
                    continue
                }
                const isZip = /\.zip$/i.test(entry.file.name)
                if (!isZip && !IMAGE_EXTENSION.test(entry.file.name)) {
                    report.skipped++
                    continue
                }
                const remainingFiles = 50 - items.value.length - selected.length
                const remainingBytes = MAX_BATCH_BYTES - totalBytes.value - selectedBytes
                if (remainingFiles <= 0 || remainingBytes <= 0) {
                    warn(
                        'Batch limit reached (50 images / 200 MB). Remaining files were not added. Download and clear this batch to add more.',
                    )
                    break
                }
                if (isZip) {
                    try {
                        const archive = await extractZipImages(entry.file, {
                            maxFiles: remainingFiles,
                            maxBytes: remainingBytes,
                            maxFileBytes: MAX_FILE_BYTES,
                            signal: controller.signal,
                        })
                        if (!current()) break
                        report.skipped += archive.skipped
                        archive.warnings.forEach(warn)
                        for (const extracted of archive.files) {
                            selected.push({
                                file: extracted.file,
                                sourcePath: `${entry.sourcePath}/${extracted.sourcePath}`,
                            })
                            selectedBytes += extracted.file.size
                        }
                    } catch (error) {
                        if (!current()) break
                        report.skipped++
                        warn(
                            `${entry.sourcePath}: ${error instanceof Error ? error.message : 'Could not open this ZIP.'}`,
                        )
                    }
                } else if (entry.file.size > MAX_FILE_BYTES) {
                    report.skipped++
                    warn(`${entry.sourcePath} exceeds the 40 MB image limit.`)
                } else if (entry.file.size > remainingBytes) {
                    report.skipped++
                    warn(`${entry.sourcePath} exceeds the remaining batch space (200 MB total).`)
                } else {
                    selected.push(entry)
                    selectedBytes += entry.file.size
                }
            }
        } catch (error) {
            if (current())
                warn(
                    error instanceof Error
                        ? error.message
                        : 'Could not read this folder. Try Choose folder instead.',
                )
        }
        try {
            if (!current()) return
            const before = items.value.length
            await addFiles(
                selected.map((entry) => entry.file),
                selected.map((entry) => entry.sourcePath),
            )
            if (!current()) return
            report.added = items.value.length - before
            if (!report.added && !report.warnings.length)
                warn(
                    'No supported images found. Choose SVG, PNG, WebP, JPG, AVIF, GIF, or TIFF files, or a ZIP containing them.',
                )
            importReport.value = report
        } finally {
            finishRequest(controller)
            importing.value = false
        }
    }

    async function addDemo() {
        if (disposed || busy.value) return
        const revision = batchRevision
        const controller = startRequest()
        try {
            const response = await fetch('/sample-sticker.svg', { signal: controller.signal })
            if (!response.ok) throw new Error()
            const blob = await response.blob()
            if (disposed || controller.signal.aborted || revision !== batchRevision) return
            await addFiles([new File([blob], 'good-vibes-sticker.svg', { type: 'image/svg+xml' })])
        } catch {
            if (!controller.signal.aborted)
                message('The sample could not be loaded. Please try adding your own image.')
        } finally {
            finishRequest(controller)
        }
    }

    function remove(item: Item) {
        itemRequests.get(item.id)?.abort()
        clearResult(item)
        items.value = items.value.filter((other) => other.id !== item.id)
    }

    function clearAll() {
        batchRevision++
        for (const controller of requests) controller.abort()
        items.value.forEach(clearResult)
        items.value = []
        importReport.value = null
        processedCount.value = 0
        processingTotal.value = 0
        dismissNotice()
    }

    function preset(name: PresetId) {
        if (processing.value || packing.value) return
        applyingPreset = true
        Object.assign(options, DEFAULT_OPTIONS)
        if (name === 'web')
            Object.assign(options, {
                format: 'webp',
                quality: 82,
                lossless: false,
                width: '1600',
                height: '1600',
            })
        if (name === 'sticker') Object.assign(options, { format: 'png', width: '2048', height: '2048' })
        if (name === 'icon') Object.assign(options, { format: 'ico', width: '256', height: '256' })
        applyingPreset = false
        activePreset.value = name
        invalidateResults()
    }

    function resetSettings() {
        preset('custom')
    }

    function selectFormat(format: Format) {
        if (processing.value || packing.value) return
        options.format = format
        activePreset.value = 'custom'
    }

    function outputSize(item: Item) {
        if (!item.width || !item.height) return ''
        const size = item.result || outputDimensions(item, options)
        return `${size.width} × ${size.height} px`
    }

    function settingsValid() {
        for (const dimension of [options.width, options.height]) {
            if (
                dimension !== '' &&
                dimension !== undefined &&
                (!Number.isInteger(Number(dimension)) || Number(dimension) < 1 || Number(dimension) > 8192)
            ) {
                message('Enter whole-number dimensions between 1 and 8192 pixels.')
                return false
            }
        }
        return true
    }

    async function convertAll() {
        if (disposed || busy.value || !ready.value.length || !settingsValid()) return
        const queue = [...ready.value]
        const snapshot = { ...options }
        const revision = settingsRevision
        const batch = batchRevision
        let success = 0
        processedCount.value = 0
        processingTotal.value = queue.length
        processing.value = true

        try {
            for (const item of queue) {
                if (disposed || batch !== batchRevision || revision !== settingsRevision) break
                if (!contains(item)) {
                    processedCount.value++
                    continue
                }
                item.status = 'converting'
                item.error = undefined
                const controller = startRequest(item)
                try {
                    const response = await fetch('/api/convert', {
                        method: 'POST',
                        body: item.file,
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'X-Conversion-Options': JSON.stringify(snapshot),
                        },
                        signal: controller.signal,
                    })
                    if (!response.ok) throw new Error(await requestError(response))
                    const blob = await response.blob()
                    if (!contains(item) || controller.signal.aborted || revision !== settingsRevision)
                        continue
                    const warnings: string[] = JSON.parse(response.headers.get('X-Image-Warnings') || '[]')
                    const extension = snapshot.format === 'jpeg' ? 'jpg' : snapshot.format
                    item.result = {
                        blob: markRaw(blob),
                        url: URL.createObjectURL(blob),
                        name: `${item.file.name.replace(/\.[^.]+$/, '')}.${extension}`,
                        width: Number(response.headers.get('X-Image-Width')),
                        height: Number(response.headers.get('X-Image-Height')),
                        format: snapshot.format,
                        warnings,
                    }
                    item.status = 'done'
                    success++
                } catch (error) {
                    if (!contains(item) || controller.signal.aborted) continue
                    item.status = 'error'
                    item.error =
                        error instanceof Error ? error.message : 'Conversion failed. Please try again.'
                } finally {
                    finishRequest(controller, item)
                    if (contains(item) && item.status === 'converting') item.status = 'ready'
                    if (!disposed && batch === batchRevision) processedCount.value++
                }
            }
        } finally {
            processing.value = false
            if (!disposed && batch === batchRevision) {
                if (revision !== settingsRevision) {
                    invalidateResults()
                    message('Your settings changed. Convert again to apply them to every image.')
                } else {
                    message(
                        success === queue.length
                            ? `${success} ${success === 1 ? 'image is' : 'images are'} ready. Download your files below.`
                            : `${success} of ${queue.length} images converted. Check the file messages for details.`,
                    )
                }
            }
        }
    }

    async function downloadAll() {
        if (disposed || !completed.value.length || busy.value) return
        packing.value = true
        const batch = batchRevision
        try {
            const archive = await createImageArchive(completed.value.map((item) => item.result!))
            if (disposed || batch !== batchRevision) return
            const url = URL.createObjectURL(new Blob([new Uint8Array(archive)], { type: 'application/zip' }))
            const timeout = setTimeout(() => {
                URL.revokeObjectURL(url)
                archiveUrls.delete(url)
            }, 10000)
            archiveUrls.set(url, timeout)
            downloadFile(url, 'musticker-images.zip')
        } catch {
            message('Could not create the ZIP. You can still download each image individually.')
        } finally {
            packing.value = false
        }
    }

    onBeforeUnmount(() => {
        disposed = true
        clearTimeout(noticeTimeout)
        for (const controller of requests) controller.abort()
        requests.clear()
        itemRequests.clear()
        items.value.forEach(clearResult)
        for (const [url, timeout] of archiveUrls) {
            clearTimeout(timeout)
            URL.revokeObjectURL(url)
        }
        archiveUrls.clear()
    })

    return {
        items,
        options,
        processing,
        packing,
        importing,
        importReport,
        busy,
        isReading,
        ready,
        completed,
        totalBytes,
        savedBytes,
        hasSvg,
        activePreset,
        notice,
        conversionProgress,
        addFiles,
        importFiles,
        addDrop,
        addDemo,
        remove,
        clearAll,
        preset,
        resetSettings,
        selectFormat,
        convertAll,
        downloadAll,
        outputSize,
        dismissNotice,
    }
}
