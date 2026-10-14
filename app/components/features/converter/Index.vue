<template>
  <div
    id="workspace"
    class="converter"
    @dragover.prevent
    @dragenter.prevent="enterDrag"
    @dragleave.prevent="leaveDrag"
    @drop.prevent="dropFiles"
  >
    <Banner :count="items.length" :completed="completed.length" @guide="guideOpen = true" />
    <Presets :active="activePreset" :busy="busy" @select="preset" />
    <div class="converter__grid">
      <div class="converter__images">
        <Upload
          :count="items.length"
          :busy="busy"
          :dragging="dragDepth > 0"
          @files="addFiles"
          @sample="addDemo"
        />
        <Queue
          v-if="items.length"
          :items="items"
          :busy="busy"
          :total-bytes="totalBytes"
          :output-size="outputSize"
          @clear="clearAll"
          @remove="remove"
          @preview="showPreview"
        />
        <div v-else class="converter__tips">
          <span
            ><ScanLine :size="17" /><strong>Keep the details</strong
            ><small>Lossless exports by default.</small></span
          ><span
            ><Layers :size="17" /><strong>Work in batches</strong
            ><small>Up to 50 images at a time.</small></span
          ><span
            ><LockKeyhole :size="17" /><strong>Stay local</strong
            ><small>Your files stay on this device.</small></span
          >
        </div>
        <div v-if="completed.length" class="converter__ready" role="status">
          <CircleCheck :size="21" />
          <div>
            <strong
              >{{ completed.length }} {{ completed.length === 1 ? 'image' : 'images' }} ready to
              download</strong
            >
            <p>
              {{
                savedBytes > 0
                  ? `${formatBytes(savedBytes)} smaller in total. Preview any file to check the result.`
                  : 'Preview your results, then download individual files or a ZIP.'
              }}
            </p>
          </div>
        </div>
        <p class="converter__privacy">
          <ShieldCheck :size="14" />Original files are never changed. Your batch clears when you close or
          refresh this page.
        </p>
      </div>
      <div class="converter__controls">
        <Settings
          :model-value="options"
          :busy="busy"
          :has-svg="hasSvg"
          @update:model-value="updateOptions"
          @reset="resetSettings"
        />
        <Actions
          :ready="ready.length"
          :completed="completed.length"
          :busy="busy"
          :reading="isReading"
          :processing="processing"
          :packing="packing"
          :progress="conversionProgress"
          :format="options.format"
          @convert="convertAll"
          @download="downloadAll"
        />
      </div>
    </div>
    <FormatGuide v-model="guideOpen" />
    <Preview v-model="previewOpen" :item="selected" />
    <div v-if="notice" class="converter__toast" role="status">
      <Info :size="18" /><span>{{ notice }}</span
      ><button class="icon-button" aria-label="Dismiss notification" @click="dismissNotice">
        <X :size="17" />
      </button>
    </div>
    <div v-if="dragDepth > 0 && !busy" class="converter__drop" aria-hidden="true">
      <UploadIcon :size="40" /><strong>Drop to add your images</strong><span>They’ll join this batch.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CircleCheck,
  Info,
  Layers,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Upload as UploadIcon,
  X,
} from '@lucide/vue'
import { useImageConverter } from '~/composables/features/converter/useImageConverter'
import type { ExportOptions, Item } from '~/types/features/converter'
import { formatBytes } from '~/utils/format'
import Banner from './Banner.vue'
import Presets from './Presets.vue'
import Upload from './Upload.vue'
import Queue from './queue/Index.vue'
import Settings from './settings/Index.vue'
import Actions from './Actions.vue'
import FormatGuide from './FormatGuide.vue'
import Preview from './Preview.vue'

const {
  items,
  options,
  processing,
  packing,
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
  addDemo,
  remove,
  clearAll,
  preset,
  resetSettings,
  convertAll,
  downloadAll,
  outputSize,
  dismissNotice,
} = useImageConverter()
const guideOpen = ref(false)
const previewOpen = ref(false)
const selected = ref<Item | null>(null)
const dragDepth = ref(0)
function updateOptions(value: ExportOptions) {
  Object.assign(options, value)
}
function showPreview(item: Item) {
  selected.value = item
  previewOpen.value = true
}
function enterDrag(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files') && !busy.value) dragDepth.value++
}
function leaveDrag() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}
function dropFiles(event: DragEvent) {
  dragDepth.value = 0
  if (!busy.value && event.dataTransfer?.files) void addFiles(Array.from(event.dataTransfer.files))
}
watch(
  items,
  () => {
    if (selected.value && !items.value.some((item) => item.id === selected.value!.id)) {
      previewOpen.value = false
      selected.value = null
    }
  },
  { deep: false },
)
</script>

<style scoped>
.converter {
  position: relative;
}
.converter__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 24px;
}
.converter__images,
.converter__controls {
  min-width: 0;
}
.converter__images {
  display: grid;
  gap: 18px;
}
.converter__tips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 8px 0 2px;
  gap: 14px;
}
.converter__tips > span {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 6px 14px;
  border-left: 1px solid var(--line);
}
.converter__tips > span:first-child {
  border: 0;
  padding-left: 0;
}
.converter__tips svg {
  color: var(--brand);
  margin-bottom: 5px;
}
.converter__tips strong {
  font-size: 12px;
  font-weight: 650;
}
.converter__tips small {
  font-size: 11px;
  color: var(--muted);
}
.converter__privacy {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.6;
  padding: 2px 4px;
}
.converter__privacy svg {
  margin-top: 2px;
}
.converter__ready {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  background: #eaf1e1;
  border: 1px solid #d3e0c8;
  border-radius: 12px;
  color: var(--brand);
}
.converter__ready strong {
  font-size: 13px;
}
.converter__ready p {
  margin-top: 4px;
  font-size: 12px;
}
.converter__toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  max-width: calc(100vw - 32px);
  padding: 12px 12px 12px 18px;
  border: 1px solid var(--line-strong);
  background: #fff;
  box-shadow: 0 10px 40px #23332820;
  border-radius: 12px;
  font-size: 13px;
}
.converter__drop {
  position: fixed;
  inset: 12px;
  z-index: 60;
  border: 2px dashed var(--brand);
  border-radius: 18px;
  background: #f0f6e9f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
  color: var(--brand);
}
.converter__drop strong {
  font-family: var(--font-heading);
  font-size: 26px;
}
.converter__drop span {
  color: var(--muted);
}
@media (min-width: 1600px) {
  .converter__grid {
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 30px;
  }
}
@media (max-width: 850px) {
  .converter__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .converter__controls {
    display: grid;
    gap: 0;
  }
}
@media (max-width: 480px) {
  .converter__tips {
    gap: 7px;
  }
  .converter__tips > span {
    padding: 6px 8px;
  }
  .converter__tips small {
    line-height: 1.5;
  }
}
</style>
