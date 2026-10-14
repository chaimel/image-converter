<template>
  <details class="background" open>
    <summary class="background__heading">
      <span><Layers2 :size="15" aria-hidden="true" /> Background</span>
      <ChevronDown :size="15" aria-hidden="true" />
    </summary>
    <div class="background__body">
      <label class="check-label">
        <input
          type="checkbox"
          :checked="options.transparent && options.format !== 'jpeg'"
          :disabled="options.format === 'jpeg'"
          @change="changeTransparency"
        />
        Keep transparency
      </label>
      <p class="field-hint">
        {{
          options.format === 'jpeg'
            ? 'JPG uses the background color below.'
            : options.transparent
              ? 'Preserves existing transparency; doesn’t remove backgrounds.'
              : 'Fill transparent areas with a solid color.'
        }}
      </p>
      <div v-if="!options.transparent || options.format === 'jpeg'" class="background__color">
        <label for="export-background" class="field-label">Background color</label>
        <label for="export-background" class="background__swatch">
          <input id="export-background" v-model="options.background" type="color" />
          <span>{{ options.background.toUpperCase() }}</span>
        </label>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ChevronDown, Layers2 } from '@lucide/vue'
import type { ExportOptions } from '~/types/features/converter'

const options = defineModel<ExportOptions>({ required: true })

function changeTransparency(event: Event) {
  options.value.transparent = (event.target as HTMLInputElement).checked
}
</script>

<style scoped>
.background {
  border-top: 1px solid var(--line);
}

.background__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px;
  list-style: none;
  color: var(--ink);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.background__heading::-webkit-details-marker {
  display: none;
}

.background__heading > span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.background__heading > svg {
  color: var(--muted);
  transition: transform 150ms ease;
}

.background[open] .background__heading > svg {
  transform: rotate(180deg);
}

.background__body {
  padding: 0 22px 22px;
}

.background__color {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.background__swatch {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px 6px 6px;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--ink);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  cursor: pointer;
}

.background__swatch input {
  display: block;
  width: 24px;
  height: 24px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.background__swatch input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.background__swatch input::-webkit-color-swatch {
  border: 0;
}

.background__swatch input::-moz-color-swatch {
  border: 0;
}

@media (max-width: 480px) {
  .background__heading {
    padding: 18px;
  }

  .background__body {
    padding: 0 18px 18px;
  }
}
</style>
