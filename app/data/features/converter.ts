import type { FormatChoice, PresetChoice } from '~/types/features/converter'

export const acceptedImageTypes = '.svg,.png,.webp,.jpg,.jpeg,.avif,.gif,.tif,.tiff,.zip'

export const formatChoices: FormatChoice[] = [
    { id: 'webp', label: 'WebP', detail: 'Small & versatile' },
    { id: 'png', label: 'PNG', detail: 'Crisp & lossless' },
    { id: 'jpeg', label: 'JPG', detail: 'Photo friendly' },
    { id: 'svg', label: 'SVG', detail: 'Vector or embedded' },
    { id: 'avif', label: 'AVIF', detail: 'Compact & detailed' },
    { id: 'gif', label: 'GIF', detail: 'Single frame' },
    { id: 'tiff', label: 'TIFF', detail: 'Lossless artwork' },
    { id: 'ico', label: 'ICO', detail: 'Website icons' },
]

export const presetChoices: PresetChoice[] = [
    { id: 'web', label: 'Web ready', detail: 'WebP · 1600 px · smaller files', icon: 'zap' },
    { id: 'sticker', label: 'Sticker artwork', detail: 'PNG · 2048 px · lossless', icon: 'sparkles' },
    { id: 'icon', label: 'Website icon', detail: 'ICO · 256 × 256 px', icon: 'monitor' },
]

export const formatGuide = [
    {
        name: 'PNG',
        use: 'Stickers, logos & crisp artwork',
        note: 'Lossless pixels and smooth transparency. A good starting point for your projects.',
    },
    {
        name: 'WebP',
        use: 'Websites & product images',
        note: 'Transparent and lossless by default. Switch off lossless for smaller files with some detail loss.',
    },
    {
        name: 'JPG',
        use: 'Photos & broad compatibility',
        note: 'Always lossy. Transparent areas become your chosen background color.',
    },
    {
        name: 'SVG',
        use: 'Original vectors or embedded images',
        note: 'Preserves existing vectors by default. Raster inputs are embedded; optional tracing approximates editable paths. Solid backgrounds and stretching embed pixels.',
    },
    {
        name: 'AVIF',
        use: 'Compact modern images',
        note: 'Supports transparency and lossless export. Some older apps may not open it.',
    },
    {
        name: 'GIF',
        use: 'Simple graphics with few colors',
        note: 'Exports the first frame with up to 256 colors and limited transparency. Soft edges and gradients can change.',
    },
    {
        name: 'TIFF',
        use: 'Lossless raster artwork',
        note: 'Preserves 16-bit channels for 16-bit sources. First page only; most browsers cannot preview the download.',
    },
    {
        name: 'ICO',
        use: 'Website icons',
        note: 'Export only. A square PNG-based icon, up to 256 × 256, with centered artwork and padding.',
    },
]
