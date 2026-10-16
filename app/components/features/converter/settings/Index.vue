<template>
    <section class="settings" aria-labelledby="export-settings-heading">
        <header class="settings__header">
            <div class="settings__title">
                <Settings2 :size="18" aria-hidden="true" />
                <h2 id="export-settings-heading">Export settings</h2>
            </div>
            <MButton variant="ghost" size="sm" :disabled="busy" @click="emit('reset')">
                <template #prefix><RotateCcw :size="14" aria-hidden="true" /></template>
                Reset
            </MButton>
        </header>

        <fieldset class="settings__fields" :disabled="busy" aria-label="Image export options">
            <Format v-model="options" />
            <Dimensions v-model="options" :has-svg="hasSvg" />
            <Background v-model="options" />
        </fieldset>
    </section>
</template>

<script setup lang="ts">
import { RotateCcw, Settings2 } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
import type { ExportOptions } from '~/types/features/converter'
import Background from './Background.vue'
import Dimensions from './Dimensions.vue'
import Format from './Format.vue'

const options = defineModel<ExportOptions>({ required: true })
defineProps<{ busy: boolean; hasSvg: boolean }>()
const emit = defineEmits<{ reset: [] }>()
</script>

<style scoped>
.settings {
    overflow: hidden;
    border: 0;
    border-radius: 0;
    background: var(--surface);
}

.settings__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 17px 20px;
    border-bottom: 1px solid var(--line);
}

.settings__title {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--ink);
}

.settings__title h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.settings__fields {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.settings__fields:disabled {
    opacity: 0.65;
}

@media (max-width: 480px) {
    .settings__header {
        padding: 18px;
    }
}
</style>
