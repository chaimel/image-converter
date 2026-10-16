<template>
    <section id="presets" class="presets" aria-labelledby="presets-heading">
        <div class="presets__heading">
            <h2 id="presets-heading">Start with a preset</h2>
            <span>Optional</span>
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
    padding: 2px 0;
}
.presets__heading {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}
.presets__heading h2 {
    font: 600 11px var(--font-ui);
    color: var(--muted);
}
.presets__heading > span {
    font-size: 10px;
    color: var(--muted);
    margin-left: auto;
}
.presets__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}
.presets__item {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    text-align: left;
    padding: 12px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    transition:
        border-color 150ms,
        background 150ms;
}
.presets__item:hover:not(:disabled),
.presets__item--active {
    border-color: var(--brand);
    background: var(--brand-soft);
}
.presets__item > span:nth-child(2) {
    min-width: 0;
    flex: 1;
}
.presets__item strong {
    display: block;
    font-size: 11px;
    font-weight: 650;
}
.presets__item small {
    display: block;
    font-size: 9px;
    color: var(--muted);
    margin-top: 3px;
    line-height: 1.5;
}
.presets__item > svg {
    display: none;
}
.presets__item--active > svg {
    display: block;
    color: var(--brand);
}
.presets__icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 30px;
    flex-shrink: 0;
    color: var(--muted);
}
.presets__item--active .presets__icon {
    color: var(--brand);
}
@media (max-width: 1040px) and (min-width: 851px) {
    .presets__icon {
        display: none;
    }
}
@media (max-width: 560px) {
    .presets__grid {
        grid-template-columns: 1fr;
        gap: 6px;
    }
    .presets__item {
        padding: 9px 12px;
    }
    .presets__item > span:nth-child(2) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }
    .presets__item small {
        margin: 0;
    }
}
</style>
