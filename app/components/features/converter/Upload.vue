<template>
  <section class="upload" aria-labelledby="upload-heading">
    <header class="upload__header">
      <h2 id="upload-heading">
        <ImagePlus :size="18" />Your images<span>{{ count.toString().padStart(2, '0') }}</span>
      </h2>
      <span>40 MB max per file</span>
    </header>
    <input
      ref="input"
      class="sr-only"
      type="file"
      multiple
      :accept="acceptedImageTypes"
      :disabled="busy"
      aria-label="Choose images"
      @change="chooseFiles"
    />
    <div
      class="upload__dropzone"
      :class="{ 'upload__dropzone--compact': count, 'upload__dropzone--dragging': dragging }"
    >
      <div v-if="!count" class="upload__art" aria-hidden="true">
        <span class="upload__paper upload__paper--left"><Spline :size="24" /><b>SVG</b></span
        ><span class="upload__paper upload__paper--center"
          ><img src="/sample-sticker.svg" alt="" /><b>your next project</b></span
        ><span class="upload__paper upload__paper--right"><Image :size="24" /><b>WEBP</b></span>
      </div>
      <UploadCloud v-else :size="28" class="upload__compact-icon" />
      <div class="upload__text">
        <h3>{{ count ? 'Add to your batch' : 'Drop your images here' }}</h3>
        <p>
          {{
            count
              ? 'Drop more files or choose them from your computer.'
              : 'One image or a whole batch. Make yourself at home.'
          }}
        </p>
      </div>
      <MButton :disabled="busy" :variant="count ? 'secondary' : 'primary'" @click="input?.click()"
        ><template #prefix><Plus :size="17" /></template>{{ count ? 'Add images' : 'Browse files'
        }}<template v-if="!count" #suffix><ArrowUpRight :size="15" /></template
      ></MButton>
      <p v-if="!count" class="upload__formats">SVG, PNG, JPG, WebP, AVIF, GIF, TIFF</p>
    </div>
    <div v-if="!count" class="upload__sample">
      <span>Give it a quick try</span
      ><MButton variant="ghost" size="sm" :disabled="busy" @click="emit('sample')"
        >Use a sample image<template #suffix><ArrowRight :size="14" /></template
      ></MButton>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Image, ImagePlus, Plus, Spline, UploadCloud } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
import { acceptedImageTypes } from '~/data/features/converter'
defineProps<{ count: number; busy: boolean; dragging: boolean }>()
const emit = defineEmits<{ files: [files: File[]]; sample: [] }>()
const input = ref<HTMLInputElement>()
function chooseFiles(event: Event) {
  const element = event.target as HTMLInputElement
  emit('files', Array.from(element.files || []))
  element.value = ''
}
</script>
<style scoped>
.upload {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  overflow: hidden;
}
.upload__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 21px 22px;
}
.upload__header h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
}
.upload__header h2 > span {
  font: 600 10px var(--font-ui);
  color: var(--brand);
  background: var(--soft);
  padding: 3px 7px;
  border-radius: 5px;
}
.upload__header > span {
  color: var(--muted);
  font-size: 11px;
}
.upload__dropzone {
  margin: 0 20px 20px;
  border: 1.5px dashed #b7c6aa;
  border-radius: 12px;
  background: #fafcf7;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 16px 26px;
  text-align: center;
}
.upload__dropzone--dragging {
  border-color: var(--brand);
  background: #eef6e4;
}
.upload__text h3 {
  font-size: 21px;
  letter-spacing: -0.6px;
}
.upload__text p {
  color: var(--muted);
  font-size: 12px;
  margin: 8px 0 19px;
}
.upload__formats {
  font-size: 10px;
  color: var(--muted);
  margin-top: 16px;
}
.upload__sample {
  border-top: 1px solid var(--line);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 11px;
  color: var(--muted);
}
.upload__sample :deep(.m-button) {
  color: var(--brand);
}
.upload__art {
  position: relative;
  width: 240px;
  height: 155px;
  margin: 4px 0 24px;
}
.upload__paper {
  position: absolute;
  top: 24px;
  width: 83px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  border: 1px solid #d2dbc8;
  border-radius: 9px;
  box-shadow: 0 6px 10px #31492208;
}
.upload__paper b {
  font-size: 10px;
  letter-spacing: 1px;
}
.upload__paper--left {
  left: 10px;
  transform: rotate(-15deg);
  background: #ede9f3;
  color: #7a6893;
}
.upload__paper--right {
  right: 10px;
  transform: rotate(14deg);
  background: #f3eadf;
  color: #9e754e;
}
.upload__paper--center {
  left: 70px;
  top: 8px;
  height: 135px;
  width: 100px;
  z-index: 1;
  transform: rotate(-2deg);
  background: #fff;
  gap: 5px;
  border-color: #c6d3b6;
}
.upload__paper--center img {
  width: 87px;
  height: 95px;
  object-fit: contain;
}
.upload__paper--center b {
  font-size: 7px;
  color: var(--muted);
  letter-spacing: 0.3px;
}
.upload__dropzone--compact {
  flex-direction: row;
  gap: 14px;
  text-align: left;
  padding: 20px 16px;
  margin-bottom: 20px;
}
.upload__dropzone--compact .upload__text {
  flex: 1;
}
.upload__dropzone--compact h3 {
  font-size: 14px;
  letter-spacing: 0;
}
.upload__dropzone--compact p {
  font-size: 11px;
  margin: 5px 0 0;
}
.upload__compact-icon {
  color: #789265;
}
@media (max-width: 1150px) and (min-width: 851px) {
  .upload__dropzone--compact {
    flex-wrap: wrap;
  }
  .upload__dropzone--compact :deep(.m-button) {
    width: 100%;
  }
}
@media (max-width: 480px) {
  .upload__header {
    padding: 18px 16px;
  }
  .upload__header > span {
    font-size: 10px;
  }
  .upload__dropzone {
    margin: 0 12px 12px;
  }
  .upload__dropzone--compact {
    flex-wrap: wrap;
  }
  .upload__dropzone--compact :deep(.m-button) {
    width: 100%;
  }
  .upload__sample {
    gap: 0;
    padding: 10px;
  }
  .upload__art {
    transform: scale(0.9);
    margin-bottom: 8px;
  }
  .upload__text h3 {
    font-size: 19px;
  }
}
</style>
