export function formatBytes(size: number): string {
    if (Math.abs(size) < 1024) return `${size} B`
    if (Math.abs(size) < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
