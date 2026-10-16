<template>
    <section class="queue" aria-labelledby="queue-heading">
        <header class="queue__heading">
            <div>
                <h2 id="queue-heading">Conversion queue</h2>
                <span
                    >{{ items.length }} {{ items.length === 1 ? 'image' : 'images' }}<i>·</i
                    >{{ formatBytes(totalBytes) }}</span
                >
            </div>
            <MButton variant="ghost" size="sm" :disabled="busy" @click="emit('clear')"
                ><template #prefix><Trash2 :size="14" /></template>Clear all</MButton
            >
        </header>
        <ul class="queue__list">
            <QueueItem
                v-for="item in items"
                :key="item.id"
                :item="item"
                :busy="busy"
                :export-size="outputSize(item)"
                @preview="emit('preview', item)"
                @remove="emit('remove', item)"
            />
        </ul>
    </section>
</template>
<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
import type { Item } from '~/types/features/converter'
import { formatBytes } from '~/utils/format'
import QueueItem from './Item.vue'
defineProps<{ items: Item[]; busy: boolean; totalBytes: number; outputSize: (item: Item) => string }>()
const emit = defineEmits<{ clear: []; remove: [item: Item]; preview: [item: Item] }>()
</script>
<style scoped>
.queue {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
}
.queue__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
}
.queue__heading h2 {
    font-size: 14px;
}
.queue__heading span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    margin-top: 5px;
    color: var(--muted);
}
.queue__heading i {
    font-style: normal;
}
.queue__list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
