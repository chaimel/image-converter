<template>
    <section class="accuracy" aria-labelledby="accuracy-title">
        <div class="accuracy__intro">
            <h2 id="accuracy-title">Why it's more accurate</h2>
            <p>
                Many converters quietly shrink color, blur edges, or recompress your images. This one keeps
                the detail unless you ask for a smaller file.
            </p>
        </div>
        <ul class="accuracy__points">
            <li v-for="point in accuracyPoints" :key="point.title">
                <component :is="icons[point.icon]" :size="18" aria-hidden="true" />
                <strong>{{ point.title }}</strong>
                <p>{{ point.detail }}</p>
            </li>
        </ul>
    </section>
</template>
<script setup lang="ts">
import { Contrast, Eye, Palette, PenTool, ScanLine, SwatchBook } from '@lucide/vue'
import { accuracyPoints } from '~/data/features/converter'

const icons = {
    scan: ScanLine,
    palette: Palette,
    contrast: Contrast,
    swatch: SwatchBook,
    pen: PenTool,
    eye: Eye,
}
</script>
<style scoped>
.accuracy {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
    display: grid;
    grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
    gap: 32px;
}
.accuracy h2 {
    font-family: var(--font-heading);
    font-size: clamp(20px, 2.4vw, 24px);
    font-weight: 750;
    letter-spacing: -0.8px;
}
.accuracy__intro p {
    margin-top: 10px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.7;
}
.accuracy__points {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.accuracy__points li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
}
.accuracy__points svg {
    color: var(--brand);
    margin-bottom: 4px;
}
.accuracy__points strong {
    font-size: 12px;
    font-weight: 650;
}
.accuracy__points p {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.6;
}
@media (max-width: 1000px) {
    .accuracy {
        grid-template-columns: minmax(0, 1fr);
        gap: 18px;
    }
}
@media (max-width: 700px) {
    .accuracy__points {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 480px) {
    .accuracy {
        margin-top: 28px;
        padding-top: 24px;
    }
    .accuracy__points {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
