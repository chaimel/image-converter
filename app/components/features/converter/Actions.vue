<template>
    <section class="actions" aria-label="Convert and download">
        <div class="actions__summary">
            <span>{{
                ready
                    ? `${ready} ${ready === 1 ? 'image' : 'images'} to convert`
                    : completed
                      ? `${completed} ready to download`
                      : 'Your output'
            }}</span
            ><b>{{ format === 'jpeg' ? 'JPG' : format.toUpperCase() }}</b>
        </div>
        <div v-if="processing" class="actions__progress" role="status">
            <div>
                <span
                    >Converting {{ Math.min(progress.done + 1, progress.total) }} of
                    {{ progress.total }}</span
                ><span>{{ progress.percent }}%</span>
            </div>
            <progress
                :value="progress.done"
                :max="progress.total || 1"
                aria-label="Batch conversion progress"
            />
        </div>
        <MButton block :disabled="busy || !ready" :is-loading="processing || reading" @click="emit('convert')"
            ><template #prefix><ArrowLeftRight :size="17" /></template
            >{{
                processing
                    ? 'Converting images…'
                    : reading
                      ? 'Reading your images…'
                      : completed && !ready
                        ? 'All images converted'
                        : ready
                          ? `Convert ${ready} ${ready === 1 ? 'image' : 'images'}`
                          : 'Add images to convert'
            }}<template v-if="ready && !busy" #suffix><ArrowRight :size="16" /></template
        ></MButton>
        <MButton
            v-if="completed"
            block
            variant="secondary"
            :disabled="busy"
            :is-loading="packing"
            @click="emit('download')"
            ><template #prefix><Download :size="16" /></template
            >{{ packing ? 'Preparing ZIP…' : 'Download all as ZIP' }}</MButton
        >
        <p><ShieldCheck :size="12" />Converted in memory. Never stored.</p>
    </section>
</template>
<script setup lang="ts">
import { ArrowLeftRight, ArrowRight, Download, ShieldCheck } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
import type { ConversionProgress, Format } from '~/types/features/converter'
defineProps<{
    ready: number
    completed: number
    busy: boolean
    reading: boolean
    processing: boolean
    packing: boolean
    progress: ConversionProgress
    format: Format
}>()
const emit = defineEmits<{ convert: []; download: [] }>()
</script>
<style scoped>
.actions {
    display: grid;
    gap: 10px;
    background: var(--canvas);
    border-top: 1px solid var(--line);
    padding: 18px 20px;
    margin-top: 0;
}
.actions__summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--muted);
    font-size: 11px;
    margin-bottom: 3px;
}
.actions__summary b {
    padding: 3px 7px;
    font-size: 10px;
    border-radius: 5px;
    background: var(--soft);
    color: var(--brand);
}
.actions p {
    display: flex;
    justify-content: center;
    gap: 5px;
    align-items: center;
    color: var(--muted);
    font-size: 10px;
}
.actions__progress > div {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--brand);
    margin-bottom: 6px;
}
.actions__progress progress {
    width: 100%;
    height: 5px;
    display: block;
    accent-color: var(--brand);
    border-radius: 4px;
    overflow: hidden;
}
.actions__progress progress::-webkit-progress-bar {
    background: var(--soft);
}
.actions__progress progress::-webkit-progress-value {
    background: var(--brand);
}
</style>
