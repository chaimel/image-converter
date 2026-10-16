<template>
    <section class="upload" aria-labelledby="upload-heading" :aria-busy="importing || undefined">
        <header class="upload__header">
            <div>
                <h2 id="upload-heading">Your images</h2>
                <span class="upload__count">{{ count }} / 50</span>
            </div>
            <span>40 MB per image</span>
        </header>
        <input
            ref="input"
            class="sr-only"
            type="file"
            tabindex="-1"
            multiple
            :accept="acceptedImageTypes"
            :disabled="busy"
            aria-label="Choose images or ZIP archives"
            @change="chooseFiles"
        />
        <input
            ref="folderInput"
            class="sr-only"
            type="file"
            tabindex="-1"
            webkitdirectory
            multiple
            :disabled="busy || folderSupported === false"
            aria-label="Choose a folder of images"
            @change="chooseFiles"
        />
        <div
            class="upload__dropzone"
            :class="{ 'upload__dropzone--compact': count, 'upload__dropzone--dragging': dragging }"
        >
            <div class="upload__symbol" aria-hidden="true">
                <UploadCloud :size="count ? 22 : 28" :stroke-width="1.5" />
            </div>
            <div class="upload__text">
                <h3>{{ count ? 'Add more to your batch' : 'Drop your files here' }}</h3>
                <p>Images, folders, or ZIPs. Add several at once.</p>
            </div>
            <div class="upload__actions">
                <MButton :disabled="busy" :variant="count ? 'secondary' : 'primary'" @click="input?.click()">
                    <template #prefix><Plus :size="16" /></template>{{ count ? 'Add files' : 'Browse files' }}
                </MButton>
                <MButton
                    variant="secondary"
                    :disabled="busy || folderSupported === false"
                    :aria-describedby="folderSupported === false ? 'folder-support-note' : undefined"
                    @click="folderInput?.click()"
                >
                    <template #prefix><FolderOpen :size="16" /></template>Choose folder
                </MButton>
            </div>
            <div v-if="!count" class="upload__formats" aria-label="Supported image formats">
                <span v-for="format in ['SVG', 'PNG', 'WebP', 'JPG', 'AVIF', 'GIF', 'TIFF']" :key="format">{{
                    format
                }}</span>
            </div>
        </div>
        <div class="upload__footer">
            <div class="upload__help">
                <p v-if="importing" class="upload__status" role="status">
                    <LoaderCircle :size="13" class="spin" aria-hidden="true" />Opening files...
                </p>
                <p>200 MB per batch. ZIPs up to 200 MB compressed.</p>
                <p v-if="folderSupported === false" id="folder-support-note">
                    This browser cannot choose folders. Use image files or a ZIP instead.
                </p>
            </div>
            <MButton v-if="!count" variant="ghost" size="sm" :disabled="busy" @click="emit('sample')"
                >Try a sample<template #suffix><ArrowRight :size="13" /></template
            ></MButton>
        </div>
    </section>
</template>
<script setup lang="ts">
import { ArrowRight, FolderOpen, LoaderCircle, Plus, UploadCloud } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
import { acceptedImageTypes } from '~/data/features/converter'
defineProps<{ count: number; busy: boolean; dragging: boolean; importing?: boolean }>()
const emit = defineEmits<{ files: [files: File[]]; sample: [] }>()
const input = ref<HTMLInputElement>()
const folderInput = ref<HTMLInputElement>()
const folderSupported = ref<boolean | null>(null)
onMounted(() => {
    folderSupported.value = Boolean(folderInput.value && 'webkitdirectory' in folderInput.value)
})
function chooseFiles(event: Event) {
    const element = event.target as HTMLInputElement
    emit('files', Array.from(element.files || []))
    element.value = ''
}
</script>
<style scoped>
.upload {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    overflow: hidden;
}
.upload__header {
    padding: 17px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.upload__header > div {
    display: flex;
    align-items: center;
    gap: 10px;
}
.upload__header h2 {
    font-size: 14px;
    letter-spacing: -0.2px;
}
.upload__count {
    font-size: 10px;
    color: var(--muted);
    background: var(--soft);
    padding: 3px 7px;
    border-radius: 5px;
    font-variant-numeric: tabular-nums;
}
.upload__header > span {
    color: var(--muted);
    font-size: 10px;
}
.upload__dropzone {
    margin: 0 18px;
    padding: 32px 18px 26px;
    border: 1px dashed var(--line-strong);
    border-radius: 9px;
    background: var(--canvas);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
    transition:
        border-color 150ms,
        background 150ms;
}
.upload__dropzone--dragging {
    background: var(--brand-soft);
    border-color: var(--brand);
}
.upload__symbol {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
    color: var(--muted);
    box-shadow: 0 3px 7px #20242c05;
}
.upload__text h3 {
    font-size: 18px;
    letter-spacing: -0.5px;
}
.upload__text p {
    margin-top: 7px;
    font-size: 12px;
    color: var(--muted);
}
.upload__actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
}
.upload__formats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
}
.upload__formats span {
    padding: 3px 6px;
    font-size: 9px;
    font-weight: 550;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 4px;
}
.upload__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 18px;
}
.upload__help {
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
    flex: 1;
    min-width: 160px;
}
.upload__status {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--brand);
    margin-bottom: 4px;
}
.upload__dropzone--compact {
    flex-direction: row;
    flex-wrap: wrap;
    text-align: left;
    gap: 12px;
    padding: 16px;
}
.upload__dropzone--compact .upload__symbol {
    width: 40px;
    height: 40px;
    border-radius: 9px;
}
.upload__dropzone--compact .upload__text {
    flex: 1;
    min-width: 180px;
}
.upload__dropzone--compact h3 {
    font-size: 13px;
    letter-spacing: 0;
}
.upload__dropzone--compact .upload__text p {
    font-size: 11px;
    margin-top: 4px;
}
.upload__dropzone--compact .upload__actions {
    justify-content: flex-start;
}
@media (max-width: 480px) {
    .upload__header {
        padding: 15px;
    }
    .upload__dropzone {
        margin: 0 12px;
        padding: 24px 12px;
    }
    .upload__dropzone--compact {
        padding: 14px;
    }
    .upload__actions {
        width: 100%;
    }
    .upload__actions :deep(.m-button) {
        flex: 1;
    }
    .upload__footer {
        padding: 12px;
    }
}
</style>
