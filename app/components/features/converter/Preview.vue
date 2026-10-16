<template>
    <MModal
        v-model="open"
        :title="item?.file.name || 'Image preview'"
        eyebrow="CHECK YOUR ARTWORK"
        class="preview-modal"
    >
        <template v-if="item">
            <div class="preview__toolbar">
                <span>{{
                    item.result
                        ? 'Compare the source and your export.'
                        : 'Your source image, ready to convert.'
                }}</span>
                <div
                    v-if="item.result && item.result.format !== 'tiff'"
                    class="preview__zoom"
                    role="group"
                    aria-label="Export preview size"
                >
                    <button :aria-pressed="!actualSize" @click="actualSize = false">
                        <Minimize2 :size="13" />Fit</button
                    ><button :aria-pressed="actualSize" @click="actualSize = true">
                        <ScanLine :size="13" />100%
                    </button>
                </div>
            </div>
            <div class="preview__panels" :class="{ 'preview__panels--comparison': item.result }">
                <section>
                    <div class="preview__label">
                        <strong>SOURCE PREVIEW</strong
                        ><span>{{ item.width }} × {{ item.height }} · {{ formatBytes(item.file.size) }}</span>
                    </div>
                    <div class="preview__canvas checker">
                        <img :src="item.preview" :alt="`Source preview of ${item.file.name}`" />
                    </div>
                </section>
                <section v-if="item.result">
                    <div class="preview__label">
                        <strong>{{ item.result.format.toUpperCase() }} EXPORT</strong
                        ><span
                            >{{ item.result.width }} × {{ item.result.height }} ·
                            {{ formatBytes(item.result.blob.size) }}</span
                        >
                    </div>
                    <div
                        class="preview__canvas checker"
                        :class="{ 'preview__canvas--actual': actualSize && item.result.format !== 'tiff' }"
                        :tabindex="actualSize && item.result.format !== 'tiff' ? 0 : undefined"
                        role="region"
                        aria-label="Export preview; use arrow keys to scroll at 100 percent"
                    >
                        <img
                            v-if="item.result.format !== 'tiff'"
                            :src="item.result.url"
                            :alt="`Converted ${item.result.format.toUpperCase()} image`"
                        />
                        <div v-else class="preview__unsupported">
                            <FileImage :size="36" /><strong>Your TIFF is ready.</strong>
                            <p>Download it to preview in an image editor.</p>
                        </div>
                    </div>
                </section>
            </div>
            <p class="preview__hint">
                {{
                    !item.result
                        ? 'This source preview is scaled to fit. Convert the image to compare it with your export.'
                        : item.result.format === 'tiff'
                          ? 'The source preview is scaled to fit. Open the downloaded TIFF in an image editor to check its pixels.'
                          : 'The source preview is scaled for comparison. Use 100% to inspect export pixels; scroll inside the image to see more.'
                }}
            </p>
            <ul v-if="item.result?.warnings.length" class="preview__notes">
                <li v-for="warning in item.result.warnings" :key="warning">
                    <Info :size="14" />{{ warning }}
                </li>
            </ul>
        </template>
        <template #footer
            ><span class="preview__footer">{{
                item?.result ? 'Ready when you are.' : 'Choose your export settings to get started.'
            }}</span
            ><MButton v-if="item?.result" @click="downloadFile(item.result.url, item.result.name)"
                ><template #prefix><Download :size="16" /></template>Download
                {{ item.result.format.toUpperCase() }}</MButton
            ><MButton v-else variant="secondary" @click="open = false">Back to converter</MButton></template
        >
    </MModal>
</template>
<script setup lang="ts">
import { Download, FileImage, Info, Minimize2, ScanLine } from '@lucide/vue'
import MModal from '~/components/base/MModal.vue'
import MButton from '~/components/base/MButton.vue'
import type { Item } from '~/types/features/converter'
import { formatBytes } from '~/utils/format'
import { downloadFile } from '~/utils/download'
const open = defineModel<boolean>({ default: false })
const props = defineProps<{ item: Item | null }>()
const actualSize = ref(false)
watch(
    () => props.item?.id,
    () => {
        actualSize.value = false
    },
)
</script>
<style scoped>
.preview-modal {
    width: min(1020px, calc(100% - 32px));
}
.preview__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    font-size: 12px;
    color: var(--muted);
}
.preview__zoom {
    display: flex;
    background: var(--soft);
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: 8px;
    flex-shrink: 0;
}
.preview__zoom button {
    display: flex;
    gap: 6px;
    align-items: center;
    min-height: 32px;
    padding: 6px 10px;
    border-radius: 5px;
    font-size: 11px;
}
.preview__zoom button[aria-pressed='true'] {
    background: var(--surface);
    box-shadow: 0 1px 4px #20242c12;
    color: var(--brand);
}
.preview__panels {
    display: grid;
    gap: 20px;
}
.preview__panels--comparison {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.preview__panels > section {
    min-width: 0;
}
.preview__label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 10px;
}
.preview__label strong {
    font-size: 10px;
    letter-spacing: 1px;
}
.preview__label span {
    font-size: 11px;
    color: var(--muted);
}
.preview__canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 320px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
    overflow: auto;
}
.preview__canvas img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
}
.preview__canvas--actual {
    display: block;
    padding: 0;
}
.preview__canvas--actual img {
    max-width: none;
    max-height: none;
    width: auto;
    height: auto;
}
.preview__unsupported {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    background: #ffffffdf;
    border-radius: 12px;
}
.preview__unsupported p {
    color: var(--muted);
}
.preview__hint {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.6;
    margin-top: 14px;
}
.preview__notes {
    display: grid;
    gap: 8px;
    padding: 14px;
    margin: 18px 0 0;
    border-radius: 9px;
    background: var(--warning-soft);
    color: var(--warning);
    list-style: none;
    font-size: 12px;
}
.preview__notes li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}
.preview__notes svg {
    margin-top: 2px;
}
.preview__footer {
    color: var(--muted);
    font-size: 12px;
}
@media (max-width: 650px) {
    .preview__panels--comparison {
        grid-template-columns: 1fr;
    }
    .preview__canvas {
        height: 260px;
    }
    .preview__toolbar {
        flex-wrap: wrap;
    }
}
</style>
