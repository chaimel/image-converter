<template>
    <li class="queue-item" :class="{ 'queue-item--error': item.status === 'error' }">
        <button
            class="queue-item__thumbnail checker"
            :disabled="!item.preview"
            :aria-label="`Preview ${item.file.name}`"
            @click="emit('preview')"
        >
            <img v-if="item.preview" :src="item.preview" alt="" /><LoaderCircle
                v-else-if="item.status === 'reading'"
                :size="21"
                class="spin"
            /><FileImage v-else :size="24" />
        </button>
        <div class="queue-item__details">
            <button
                class="queue-item__name"
                :disabled="!item.preview"
                :title="item.file.name"
                @click="emit('preview')"
            >
                {{ item.file.name }}
            </button>
            <p
                v-if="item.sourcePath && item.sourcePath !== item.file.name"
                class="queue-item__path"
                :title="item.sourcePath"
            >
                {{ item.sourcePath }}
            </p>
            <div class="queue-item__meta">
                <span
                    >{{ item.width ? `${item.width} × ${item.height} · ` : ''
                    }}{{ formatBytes(item.file.size) }}</span
                ><template v-if="item.result"
                    ><ArrowRight :size="11" /><strong>{{ formatBytes(item.result.blob.size) }}</strong
                    ><b>{{ item.result.format.toUpperCase() }}</b></template
                >
            </div>
            <p v-if="item.preview" class="queue-item__size">
                {{ item.result ? 'Exported' : 'Will export' }}<ArrowRight :size="11" /><strong>{{
                    exportSize
                }}</strong>
            </p>
            <p v-if="item.error" class="queue-item__error">{{ item.error }}</p>
            <p v-else-if="item.pages > 1" class="queue-item__note">First frame / page only</p>
            <details v-if="item.result?.warnings.length" class="queue-item__notes">
                <summary>Export notes <ChevronDown :size="12" /></summary>
                <p v-for="warning in item.result.warnings" :key="warning">{{ warning }}</p>
            </details>
        </div>
        <div class="queue-item__actions">
            <span v-if="item.status === 'reading' || item.status === 'converting'" class="queue-item__status"
                ><LoaderCircle :size="13" class="spin" />{{
                    item.status === 'reading' ? 'Reading' : 'Converting'
                }}</span
            ><span v-else-if="item.result" class="queue-item__status queue-item__status--done"
                ><Check :size="13" />Done</span
            ><span v-else-if="item.status === 'ready'" class="queue-item__status">Ready</span
            ><button
                v-if="item.result"
                class="icon-button queue-item__download"
                :aria-label="`Download ${item.result.name}`"
                title="Download image"
                @click="downloadFile(item.result.url, item.result.name)"
            >
                <Download :size="17" /></button
            ><button
                class="icon-button"
                :disabled="busy"
                :aria-label="`Remove ${item.file.name}`"
                title="Remove image"
                @click="emit('remove')"
            >
                <X :size="16" />
            </button>
        </div>
    </li>
</template>
<script setup lang="ts">
import { ArrowRight, Check, ChevronDown, Download, FileImage, LoaderCircle, X } from '@lucide/vue'
import type { Item } from '~/types/features/converter'
import { formatBytes } from '~/utils/format'
import { downloadFile } from '~/utils/download'
defineProps<{ item: Item; busy: boolean; exportSize: string }>()
const emit = defineEmits<{ preview: []; remove: [] }>()
</script>
<style scoped>
.queue-item {
    padding: 18px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    border-bottom: 1px solid var(--line);
}
.queue-item:last-child {
    border: 0;
}
.queue-item--error {
    background: var(--danger-soft);
}
.queue-item__thumbnail {
    width: 48px;
    height: 52px;
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 5px;
    display: grid;
    place-items: center;
}
.queue-item__thumbnail img {
    max-height: 100%;
    width: 100%;
    object-fit: contain;
}
.queue-item__name {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    padding: 0;
    font-size: 13px;
    font-weight: 650;
}
.queue-item__name:disabled {
    opacity: 1;
}
.queue-item__name:hover:not(:disabled) {
    text-decoration: underline;
}
.queue-item__path {
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    color: var(--muted);
}
.queue-item__meta {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 10px;
    color: var(--muted);
}
.queue-item__meta strong {
    font-weight: 600;
    color: var(--brand);
}
.queue-item__meta b {
    font-size: 9px;
    font-weight: 650;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--soft);
}
.queue-item__size {
    margin-top: 7px;
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 10px;
    color: var(--muted);
}
.queue-item__size strong {
    color: var(--ink);
    font-weight: 550;
}
.queue-item__error {
    color: var(--danger);
    margin-top: 8px;
    font-size: 12px;
}
.queue-item__note {
    color: var(--muted);
    margin-top: 6px;
    font-size: 11px;
}
.queue-item__notes {
    margin-top: 9px;
    color: var(--warning);
    font-size: 11px;
}
.queue-item__notes summary {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    list-style: none;
}
.queue-item__notes summary::-webkit-details-marker {
    display: none;
}
.queue-item__notes p {
    padding-top: 5px;
    line-height: 1.6;
}
.queue-item__actions {
    grid-column: 2;
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: flex-end;
    margin-top: -7px;
}
.queue-item__status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--muted);
    margin-right: auto;
}
.queue-item__status--done {
    color: var(--success);
}
.queue-item__download {
    background: var(--soft);
    color: var(--brand);
}
@media (min-width: 1100px) {
    .queue-item {
        grid-template-columns: 48px minmax(0, 1fr) auto;
    }
    .queue-item__actions {
        grid-column: 3;
        margin-top: 0;
    }
    .queue-item__status {
        margin-right: 6px;
    }
}
</style>
