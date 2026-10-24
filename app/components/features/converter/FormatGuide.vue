<template>
    <MModal v-model="open" title="The right format for your project" eyebrow="FORMAT GUIDE">
        <p class="guide__intro">
            For crisp sticker artwork, start with PNG or lossless WebP. Choose a format below based on where
            your image will go.
        </p>
        <dl class="guide__formats">
            <div v-for="format in formatGuide" :key="format.name">
                <dt>{{ format.name }}</dt>
                <dd>
                    <strong>{{ format.use }}</strong>
                    <p>{{ format.note }}</p>
                </dd>
            </div>
        </dl>
        <div class="guide__note">
            <ScanLine :size="20" />
            <div>
                <strong>Size matters as much as format.</strong>
                <p>
                    Small SVGs render at 2048 px on their longest edge by default. Set a custom size for your
                    project. Enlarging an existing bitmap cannot add missing detail; SVG text also depends on
                    the fonts available to the converter.
                </p>
            </div>
        </div>
        <p class="guide__limits">
            40 MB per file · 40 megapixels per image · 50 files / 200 MB per batch. Images are converted in
            memory and never stored. Animated and multipage files use their first frame or page.
        </p>
        <template #footer
            ><span class="guide__footer"><ShieldCheck :size="15" />Never stored. No watermarks.</span
            ><MButton @click="open = false"
                >Back to creating<template #suffix><ArrowRight :size="15" /></template></MButton
        ></template>
    </MModal>
</template>
<script setup lang="ts">
import { ArrowRight, ScanLine, ShieldCheck } from '@lucide/vue'
import MModal from '~/components/base/MModal.vue'
import MButton from '~/components/base/MButton.vue'
import { formatGuide } from '~/data/features/converter'
const open = defineModel<boolean>({ default: false })
</script>
<style scoped>
.guide__intro {
    font-size: 13px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 20px;
}
.guide__formats {
    margin: 0;
}
.guide__formats > div {
    display: grid;
    grid-template-columns: 58px 1fr;
    gap: 18px;
    padding: 15px 0;
    border-bottom: 1px solid var(--line);
}
.guide__formats dt {
    font-size: 12px;
    font-weight: 750;
    color: var(--brand);
    padding-top: 1px;
}
.guide__formats dd {
    margin: 0;
}
.guide__formats strong {
    font-size: 12px;
    font-weight: 650;
}
.guide__formats p {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.6;
    margin-top: 4px;
}
.guide__note {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--soft);
    border-radius: 10px;
    padding: 16px;
    margin-top: 20px;
    color: var(--brand);
}
.guide__note strong {
    font-size: 12px;
}
.guide__note p {
    font-size: 12px;
    line-height: 1.7;
    margin-top: 5px;
}
.guide__limits {
    margin-top: 16px;
    font-size: 11px;
    line-height: 1.7;
    color: var(--muted);
}
.guide__footer {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    color: var(--muted);
}
</style>
