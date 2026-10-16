<template>
    <header class="banner">
        <div class="banner__heading">
            <div>
                <div class="banner__title">
                    <h1>Image converter</h1>
                    <span>LOCAL TOOL</span>
                </div>
                <p>Convert, resize, and prepare images for your projects.</p>
            </div>
            <MButton variant="secondary" size="sm" @click="emit('guide')">
                <template #prefix><CircleHelp :size="15" /></template>Format guide
            </MButton>
        </div>
        <ol class="banner__steps" aria-label="Conversion workflow">
            <li :class="{ 'banner__step--active': !count, 'banner__step--done': count > 0 }">
                <span><Check v-if="count" :size="12" /><template v-else>1</template></span
                >Add images
            </li>
            <li
                :class="{
                    'banner__step--active': count > 0 && !completed,
                    'banner__step--done': completed > 0,
                }"
            >
                <span><Check v-if="completed" :size="12" /><template v-else>2</template></span
                >Choose output
            </li>
            <li :class="{ 'banner__step--active': completed > 0 }"><span>3</span>Convert & download</li>
        </ol>
    </header>
</template>
<script setup lang="ts">
import { Check, CircleHelp } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
defineProps<{ count: number; completed: number }>()
const emit = defineEmits<{ guide: [] }>()
</script>
<style scoped>
.banner {
    margin-bottom: 26px;
}
.banner__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}
.banner__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}
.banner h1 {
    font-size: clamp(25px, 3vw, 31px);
    letter-spacing: -1.2px;
    font-weight: 750;
}
.banner__title > span {
    padding: 3px 6px;
    border: 1px solid var(--line);
    border-radius: 5px;
    font-size: 8px;
    font-weight: 650;
    letter-spacing: 0.8px;
    color: var(--muted);
    background: var(--surface);
}
.banner p {
    color: var(--muted);
    font-size: 13px;
    margin-top: 8px;
}
.banner__steps {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
    padding: 20px 0 0;
    margin: 0;
    list-style: none;
}
.banner__steps li {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--muted);
    font-size: 11px;
}
.banner__steps li > span {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 1px solid var(--line-strong);
    border-radius: 6px;
    font-size: 10px;
}
.banner__steps .banner__step--active {
    color: var(--ink);
    font-weight: 600;
}
.banner__step--active > span {
    background: var(--ink);
    color: white;
    border-color: var(--ink) !important;
}
.banner__step--done > span {
    background: var(--brand-soft);
    color: var(--brand);
    border-color: var(--accent) !important;
}
@media (max-width: 600px) {
    .banner__heading {
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 14px;
    }
    .banner__steps {
        gap: 12px;
    }
    .banner__steps li {
        font-size: 10px;
        gap: 5px;
    }
}
</style>
