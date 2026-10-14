<template>
  <section class="format" aria-labelledby="output-format-heading">
    <div class="format__heading">
      <h3 id="output-format-heading">Output format</h3>
      <span>{{ selectedFormatDetail }}</span>
    </div>

    <div class="format__grid" role="radiogroup" aria-labelledby="output-format-heading">
      <label
        v-for="format in formatChoices"
        :key="format.id"
        class="format__choice"
        :class="{ 'format__choice--selected': options.format === format.id }"
        :title="format.detail"
      >
        <input v-model="options.format" type="radio" name="export-format" :value="format.id" />
        <span class="format__choice-title">
          {{ format.label }}
          <Check v-if="options.format === format.id" :size="11" aria-hidden="true" />
        </span>
      </label>
    </div>

    <div v-if="hasQuality" class="format__quality">
      <label v-if="options.format !== 'jpeg'" class="check-label format__lossless">
        <input v-model="options.lossless" type="checkbox" />
        <span>Lossless compression<small>Preserve every pixel when encoding.</small></span>
      </label>
      <div v-if="!useLossless" class="format__quality-controls">
        <div class="format__quality-label">
          <label for="export-quality" class="field-label">Quality</label>
          <output for="export-quality">{{ options.quality }}%</output>
        </div>
        <input
          id="export-quality"
          v-model.number="options.quality"
          class="format__range"
          type="range"
          min="1"
          max="100"
        />
        <div class="format__range-labels"><span>Smaller file</span><span>Higher quality</span></div>
      </div>
    </div>

    <p v-if="options.format === 'png' || options.format === 'tiff'" class="format__note">
      <Leaf :size="15" aria-hidden="true" />
      <span>Lossless compression. Resizing can still affect detail.</span>
    </p>
    <p v-if="options.format === 'jpeg'" class="format__note format__note--warning">
      <Info :size="15" aria-hidden="true" />
      <span
        >JPG is always lossy and uses a solid background. PNG or lossless WebP is better for crisp sticker
        edges.</span
      >
    </p>
    <p
      v-if="['webp', 'avif'].includes(options.format) && !options.lossless"
      class="format__note format__note--warning"
    >
      <Info :size="15" aria-hidden="true" />
      <span>Lossy compression is on. Smaller files can lose fine details and color accuracy.</span>
    </p>

    <div v-if="options.format === 'svg'" class="format__svg">
      <div class="field">
        <label for="export-svg-mode" class="field-label">SVG conversion</label>
        <select id="export-svg-mode" v-model="options.svgMode" class="select-input">
          <option value="preserve">Keep original appearance</option>
          <option value="trace">Trace to vector paths</option>
          <option value="embed">Embed image in SVG</option>
        </select>
        <p class="field-hint">
          {{
            options.svgMode === 'trace'
              ? 'Best for logos and flat artwork. Tracing simplifies shapes and colors, including existing SVGs.'
              : options.svgMode === 'preserve'
                ? 'Existing SVGs keep their vectors with transparency and aspect ratio preserved. Solid backgrounds or stretching embed pixels. Raster inputs are embedded without tracing.'
                : 'Embeds a raster rendering inside an SVG. Existing vector paths become pixels.'
          }}
        </p>
      </div>
      <div v-if="options.svgMode === 'trace'" class="format__trace">
        <div class="field">
          <label for="export-colors" class="field-label">Color palette</label>
          <select id="export-colors" v-model.number="options.colors" class="select-input">
            <option v-for="n in [2, 4, 8, 16, 32, 64]" :key="n" :value="n">{{ n }} colors</option>
          </select>
        </div>
        <div class="field">
          <label for="export-trace-resolution" class="field-label">Trace detail</label>
          <select id="export-trace-resolution" v-model.number="options.traceResolution" class="select-input">
            <option :value="512">Fast · 512 px</option>
            <option :value="1024">Detailed · 1024 px</option>
            <option :value="1536">Extra detail · 1536 px</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="options.format === 'gif'" class="format__note format__note--warning">
      <Info :size="15" aria-hidden="true" />
      <span
        >256 colors and one transparent color. Gradients and soft edges can change. First frame only.</span
      >
    </p>
    <p v-if="options.format === 'ico'" class="format__note">
      <Info :size="15" aria-hidden="true" />
      <span>Square PNG-based icon, up to 256 × 256 px. Artwork is centered with padding.</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Info, Leaf } from '@lucide/vue'
import { formatChoices } from '~/data/features/converter'
import type { ExportOptions } from '~/types/features/converter'

const options = defineModel<ExportOptions>({ required: true })
const hasQuality = computed(() => ['webp', 'jpeg', 'avif'].includes(options.value.format))
const useLossless = computed(() => options.value.lossless && options.value.format !== 'jpeg')
const selectedFormatDetail = computed(
  () => formatChoices.find((format) => format.id === options.value.format)?.detail,
)
</script>

<style scoped>
.format {
  padding: 22px;
}

.format__heading,
.format__quality-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.format__heading {
  margin-bottom: 12px;
}

.format__heading h3 {
  margin: 0;
  color: var(--ink);
  font-size: 13px;
  font-weight: 650;
}

.format__heading > span {
  color: var(--muted);
  font-size: 11px;
}

.format__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.format__choice {
  position: relative;
  display: flex;
  min-width: 0;
  justify-content: center;
  padding: 12px 5px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
}

.format__choice:hover {
  border-color: var(--brand);
  background: var(--soft);
}

.format__choice--selected {
  border-color: var(--brand);
  background: var(--soft);
  box-shadow: inset 0 0 0 1px var(--brand);
}

.format__choice:has(input:focus-visible) {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.format__choice:has(input:disabled) {
  cursor: not-allowed;
}

.format__choice input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.format__choice-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--ink);
  font-size: 12px;
  font-weight: 750;
  line-height: 1.2;
}

.format__choice-title svg {
  flex-shrink: 0;
  color: var(--brand);
}

.format__quality {
  margin-top: 20px;
}

.format__lossless + .format__quality-controls {
  margin-top: 20px;
}

.format__lossless > span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.format__lossless small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}

.format__quality-label output {
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.format__range {
  display: block;
  width: 100%;
  height: 20px;
  margin: 12px 0 4px;
  accent-color: var(--brand);
  cursor: pointer;
}

.format__range-labels {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 10px;
}

.format__note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 16px 0 0;
  padding: 11px 12px;
  border-radius: 8px;
  background: var(--soft);
  color: var(--brand);
  font-size: 11px;
  line-height: 1.6;
}

.format__note svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.format__note--warning {
  background: #faf5e9;
  color: var(--warning);
}

.format__svg {
  margin-top: 20px;
}

.format__trace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 14px;
}

.format__trace .select-input {
  min-width: 0;
  width: 100%;
  font-size: 11px;
}

@media (max-width: 480px) {
  .format {
    padding: 18px;
  }
}
</style>
