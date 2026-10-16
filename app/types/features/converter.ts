import type { ExportOptions as SharedExportOptions } from '#shared/image-settings.mjs'

export type ExportOptions = SharedExportOptions
export type Format = ExportOptions['format']
export type PresetId = 'custom' | 'web' | 'sticker' | 'icon'

export interface Result {
    blob: Blob
    url: string
    name: string
    width: number
    height: number
    format: Format
    warnings: string[]
}

export interface Item {
    id: number
    file: File
    sourcePath?: string
    preview: string
    width: number
    height: number
    format: string
    pages: number
    status: 'reading' | 'ready' | 'converting' | 'done' | 'error'
    error?: string
    result?: Result
}

export interface FormatChoice {
    id: Format
    label: string
    detail: string
}

export interface PresetChoice {
    id: Exclude<PresetId, 'custom'>
    label: string
    detail: string
    icon: 'zap' | 'sparkles' | 'monitor'
}

export interface ConversionProgress {
    done: number
    total: number
    percent: number
}
