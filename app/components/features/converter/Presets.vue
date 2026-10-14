<template>
  <section id="presets" class="presets" aria-labelledby="presets-heading">
    <div class="presets__heading">
      <h2 id="presets-heading">Start with a preset</h2>
      <span>Or make it your own</span>
    </div>
    <div class="presets__grid">
      <button
        v-for="preset in presetChoices"
        :key="preset.id"
        class="presets__item"
        :class="{ 'presets__item--active': active === preset.id }"
        :aria-pressed="active === preset.id"
        :disabled="busy"
        @click="emit('select', preset.id)"
      >
        <span class="presets__icon" :class="`presets__icon--${preset.id}`"
          ><component :is="icons[preset.icon]" :size="19" /></span
        ><span
          ><strong>{{ preset.label }}</strong
          ><small>{{ preset.detail }}</small></span
        ><Check v-if="active === preset.id" :size="16" /><ArrowUpRight v-else :size="16" />
      </button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ArrowUpRight, Check, Monitor, Sparkles, Zap } from '@lucide/vue'
import { presetChoices } from '~/data/features/converter'
import type { PresetId } from '~/types/features/converter'
defineProps<{ active: PresetId; busy: boolean }>()
const emit = defineEmits<{ select: [preset: PresetId] }>()
const icons = { zap: Zap, sparkles: Sparkles, monitor: Monitor }
</script>
<style scoped>
.presets {
  margin-bottom: 26px;
}
.presets__heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.presets__heading h2 {
  font: 650 12px var(--font-ui);
}
.presets__heading > span {
  color: var(--muted);
  font-size: 11px;
}
.presets__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.presets__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  text-align: left;
  min-width: 0;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.presets__item:hover:not(:disabled),
.presets__item--active {
  border-color: #96ae7a;
  background: #f4f8ed;
}
.presets__item > span:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.presets__item strong {
  display: block;
  font-size: 12px;
  font-weight: 650;
}
.presets__item small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--muted);
}
.presets__item > svg {
  color: var(--brand);
}
.presets__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  flex-shrink: 0;
}
.presets__icon--web {
  background: #ebe8f5;
  color: #79669a;
}
.presets__icon--sticker {
  background: #f6eadb;
  color: #976e39;
}
.presets__icon--icon {
  background: #e5ecde;
  color: #627c4a;
}
@media (max-width: 1150px) and (min-width: 1001px) {
  .presets__item {
    padding: 12px;
    gap: 8px;
  }
  .presets__item > svg {
    display: none;
  }
}
@media (max-width: 680px) {
  .presets__grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .presets__item {
    padding: 11px 14px;
  }
  .presets__item small {
    font-size: 11px;
  }
  .presets__icon {
    width: 32px;
    height: 32px;
  }
}
</style>
