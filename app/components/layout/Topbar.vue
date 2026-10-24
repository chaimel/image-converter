<template>
    <header class="topbar">
        <div class="topbar__inner">
            <NuxtLink class="topbar__brand" to="/" aria-label="Image Converter home">
                <span class="topbar__mark"><ArrowLeftRight :size="19" aria-hidden="true" /></span>
                <strong>image<span>converter</span></strong>
            </NuxtLink>
            <nav class="topbar__nav" aria-label="Workspace navigation">
                <a href="#workspace" aria-current="page">Converter</a>
                <a href="#presets">Presets</a>
            </nav>
            <a
                class="topbar__source"
                href="https://github.com/chaimel/image-converter"
                target="_blank"
                rel="noopener noreferrer"
                title="Get the code on GitHub and run it on your own computer"
            >
                <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
                    />
                </svg>
                Run it locally
            </a>
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
.topbar__source {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--muted);
    font-size: 11px;
    white-space: nowrap;
}
.topbar__source:hover {
    color: var(--ink);
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
