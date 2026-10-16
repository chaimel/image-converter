<template>
    <details class="dimensions" open>
        <summary class="dimensions__heading">
            <span><Maximize2 :size="15" aria-hidden="true" /> Dimensions</span>
            <span class="dimensions__summary">Optional <ChevronDown :size="15" aria-hidden="true" /></span>
        </summary>
        <div class="dimensions__body">
            <div class="dimensions__inputs">
                <div class="field">
                    <label for="export-width" class="field-label">Width</label>
                    <div class="dimensions__number">
                        <input
                            id="export-width"
                            v-model="options.width"
                            class="text-input"
                            type="number"
                            min="1"
                            max="8192"
                            :placeholder="hasSvg && options.format !== 'svg' ? 'Auto' : 'Original'"
                        />
                        <span>px</span>
                    </div>
                </div>
                <span class="dimensions__times" aria-hidden="true">×</span>
                <div class="field">
                    <label for="export-height" class="field-label">Height</label>
                    <div class="dimensions__number">
                        <input
                            id="export-height"
                            v-model="options.height"
                            class="text-input"
                            type="number"
                            min="1"
                            max="8192"
                            :placeholder="hasSvg && options.format !== 'svg' ? 'Auto' : 'Original'"
                        />
                        <span>px</span>
                    </div>
                </div>
            </div>
            <label class="check-label dimensions__aspect">
                <input type="checkbox" :checked="options.fit === 'inside'" @change="changeAspect" />
                <Link2 :size="14" aria-hidden="true" /> Keep aspect ratio
            </label>
            <p class="field-hint">
                {{
                    options.fit === 'inside'
                        ? 'Fits within these bounds without cropping.'
                        : 'Stretches to these dimensions when both are set.'
                }}
            </p>

            <div v-if="hasSvg && !['svg', 'ico'].includes(options.format)" class="field dimensions__svg">
                <label for="export-svg-size" class="field-label">Default SVG export size</label>
                <select
                    id="export-svg-size"
                    v-model.number="options.svgRasterSize"
                    class="select-input"
                    :disabled="Boolean(options.width || options.height)"
                >
                    <option :value="0">Original SVG dimensions</option>
                    <option :value="1024">At least 1024 px</option>
                    <option :value="2048">At least 2048 px · recommended</option>
                    <option :value="4096">At least 4096 px</option>
                </select>
                <p class="field-hint">
                    {{
                        options.width || options.height
                            ? 'Your custom dimensions override this setting. SVGs render directly at the requested size.'
                            : 'Applies to the longest edge of SVG inputs only. Larger artwork stays at its original size.'
                    }}
                </p>
            </div>

            <label v-if="options.width || options.height" class="check-label dimensions__enlarge">
                <input v-model="options.enlarge" type="checkbox" /> Allow enlarging raster images
            </label>
            <p v-if="hasSvg" class="field-hint dimensions__hint">
                SVG vectors can always scale up. Embedded bitmap images still have limited detail.
            </p>
        </div>
    </details>
</template>

<script setup lang="ts">
import { ChevronDown, Link2, Maximize2 } from '@lucide/vue'
import type { ExportOptions } from '~/types/features/converter'

const options = defineModel<ExportOptions>({ required: true })
defineProps<{ hasSvg: boolean }>()

function changeAspect(event: Event) {
    options.value.fit = (event.target as HTMLInputElement).checked ? 'inside' : 'fill'
}
</script>

<style scoped>
.dimensions {
    border-top: 1px solid var(--line);
}

.dimensions__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px;
    list-style: none;
    color: var(--ink);
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
}

.dimensions__heading::-webkit-details-marker {
    display: none;
}

.dimensions__heading > span {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dimensions__summary {
    color: var(--muted);
    font-size: 11px;
    font-weight: 400;
}

.dimensions__summary svg {
    transition: transform 150ms ease;
}

.dimensions[open] .dimensions__summary svg {
    transform: rotate(180deg);
}

.dimensions__body {
    padding: 0 20px 20px;
}

.dimensions__inputs {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: end;
    gap: 9px;
}

.dimensions__number {
    position: relative;
}

.dimensions__number input {
    min-width: 0;
    width: 100%;
    padding-right: 35px;
    appearance: textfield;
    -moz-appearance: textfield;
}

.dimensions__number input::-webkit-inner-spin-button,
.dimensions__number input::-webkit-outer-spin-button {
    margin: 0;
    -webkit-appearance: none;
}

.dimensions__number > span {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 11px;
    pointer-events: none;
}

.dimensions__times {
    align-self: end;
    padding-bottom: 12px;
    color: var(--muted);
    font-size: 14px;
}

.dimensions__aspect {
    margin-top: 16px;
}

.dimensions__svg {
    margin-top: 18px;
}

.dimensions__enlarge {
    margin-top: 16px;
}

.dimensions__hint {
    margin-top: 12px;
}

@media (max-width: 480px) {
    .dimensions__heading {
        padding: 18px;
    }

    .dimensions__body {
        padding: 0 18px 18px;
    }
}
</style>
