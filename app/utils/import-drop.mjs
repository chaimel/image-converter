/**
 * Snapshot drop handles while the browser still exposes the drag data store.
 * Iterate the returned factory later to read files without collecting a whole folder.
 * @param {DataTransfer} dataTransfer
 * @returns {(signal?: AbortSignal) => AsyncGenerator<{file: File, sourcePath: string}>}
 */
export function captureDroppedFiles(dataTransfer) {
    const fallbackFiles = Array.from(dataTransfer.files ?? [])
    const roots = []

    for (const item of Array.from(dataTransfer.items ?? [])) {
        if (item.kind !== 'file') continue
        let entry = null
        let file = null
        // A browser may expose either API, and entry access may be unavailable.
        try {
            entry = item.webkitGetAsEntry?.() ?? null
        } catch {}
        try {
            file = item.getAsFile?.() ?? null
        } catch {}
        if (entry || file) roots.push({ entry, file })
    }

    if (!roots.length) {
        for (const file of fallbackFiles) roots.push({ entry: null, file })
    }

    return async function* droppedFiles(signal) {
        checkAbort(signal)
        for (const { entry, file } of roots) {
            checkAbort(signal)
            if (entry) {
                const sourcePath = entry.name || file?.name || 'image'
                if (!isMetadataPath(sourcePath)) {
                    yield* walkEntry(entry, sourcePath, signal, file)
                }
            } else if (file) {
                const sourcePath = file.webkitRelativePath || file.name
                if (!isMetadataPath(sourcePath)) yield { file, sourcePath }
            }
        }
        checkAbort(signal)
    }
}

function checkAbort(signal) {
    if (signal?.aborted) throw new DOMException('Import cancelled.', 'AbortError')
}

function isMetadataPath(path) {
    return path.split(/[\\/]/).some((part) => part === '__MACOSX' || part.startsWith('._'))
}

/** Await one legacy filesystem callback while allowing cancellation of a pending read. */
function readEntry(operation, path, signal) {
    checkAbort(signal)
    return new Promise((resolve, reject) => {
        let settled = false
        const finish = (error, value) => {
            if (settled) return
            settled = true
            signal?.removeEventListener('abort', cancel)
            if (error) reject(error)
            else resolve(value)
        }
        const cancel = () => finish(new DOMException('Import cancelled.', 'AbortError'))
        signal?.addEventListener('abort', cancel, { once: true })
        if (signal?.aborted) return cancel()
        try {
            operation(
                (value) => finish(null, value),
                (error) =>
                    finish(
                        new Error(
                            'Could not read "' +
                                path +
                                '". ' +
                                (error?.message || 'Check that this folder is accessible.'),
                        ),
                    ),
            )
        } catch (error) {
            finish(
                new Error(
                    'Could not read "' +
                        path +
                        '". ' +
                        (error?.message || 'Check that this folder is accessible.'),
                ),
            )
        }
    })
}

async function* walkEntry(entry, sourcePath, signal, capturedFile = null) {
    checkAbort(signal)
    if (isMetadataPath(sourcePath)) return

    if (entry.isFile) {
        const file =
            capturedFile ??
            (await readEntry((resolve, reject) => entry.file(resolve, reject), sourcePath, signal))
        checkAbort(signal)
        yield { file, sourcePath }
    } else if (entry.isDirectory) {
        let reader
        try {
            reader = entry.createReader()
        } catch (error) {
            throw new Error(
                'Could not open folder "' +
                    sourcePath +
                    '". ' +
                    (error?.message || 'Check that this folder is accessible.'),
            )
        }
        // Chromium returns directory entries in batches, commonly 100 at a time.
        while (true) {
            const children = await readEntry(
                (resolve, reject) => reader.readEntries(resolve, reject),
                sourcePath,
                signal,
            )
            checkAbort(signal)
            if (!children.length) break
            for (const child of children) {
                checkAbort(signal)
                yield* walkEntry(child, sourcePath + '/' + child.name, signal)
            }
        }
    }
}
