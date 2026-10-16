<template>
    <header class="topbar">
        <div class="topbar__inner">
            <NuxtLink class="topbar__brand" to="/" aria-label="Musticker Studio home">
                <span class="topbar__mark"><ArrowLeftRight :size="19" aria-hidden="true" /></span>
                <strong>musticker<span>studio</span></strong>
            </NuxtLink>
            <nav class="topbar__nav" aria-label="Workspace navigation">
                <a href="#workspace" aria-current="page">Converter</a>
                <a href="#presets">Presets</a>
            </nav>
            <span class="topbar__status"><span aria-hidden="true" />Runs locally</span>
        </div>
    </header>
</template>
<script setup lang="ts">
import { ArrowLeftRight } from '@lucide/vue'
</script>
<style scoped>
.topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
}
.topbar__inner {
    min-height: 68px;
    max-width: 1248px;
    padding: 0 32px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 44px;
}
.topbar__brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
.topbar__mark {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--ink);
    color: white;
    display: grid;
    place-items: center;
}
.topbar__brand strong {
    font-family: var(--font-heading);
    font-size: 17px;
    letter-spacing: -0.6px;
}
.topbar__brand strong > span {
    margin-left: 5px;
    font-weight: 450;
    color: var(--muted);
}
.topbar__nav {
    display: flex;
    align-self: stretch;
    gap: 24px;
}
.topbar__nav a {
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    padding-top: 2px;
    color: var(--muted);
    font-size: 12px;
}
.topbar__nav a:hover,
.topbar__nav a[aria-current] {
    color: var(--ink);
}
.topbar__nav a[aria-current] {
    border-bottom-color: var(--ink);
    font-weight: 650;
}
.topbar__status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--muted);
    font-size: 11px;
    white-space: nowrap;
}
.topbar__status > span {
    height: 6px;
    width: 6px;
    border-radius: 50%;
    background: var(--success);
}
@media (max-width: 600px) {
    .topbar__inner {
        padding: 0 16px;
        min-height: 60px;
        gap: 18px;
        flex-wrap: wrap;
    }
    .topbar__nav {
        order: 3;
        width: 100%;
        min-height: 36px;
        margin-top: -12px;
    }
    .topbar__brand strong {
        font-size: 15px;
    }
}
</style>
