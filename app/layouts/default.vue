<template>
    <div class="studio-layout">
        <a class="skip-link" href="#main-content">Skip to converter</a>
        <Topbar />
        <main id="main-content" class="studio-layout__content" tabindex="-1"><slot /></main>
        <footer class="studio-layout__footer">
            <span>Musticker Studio <span aria-hidden="true">/</span> Image tools</span>
            <span>Free. Local. Ready for your next project.</span>
        </footer>
    </div>
</template>
<script setup lang="ts">
import Topbar from '~/components/layout/Topbar.vue'
</script>
<style scoped>
.studio-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
.studio-layout__content {
    width: 100%;
    max-width: 1248px;
    margin: 0 auto;
    padding: 36px 32px 48px;
    flex: 1;
}
.studio-layout__content:focus {
    outline: none;
}
.studio-layout__footer {
    width: 100%;
    max-width: 1248px;
    margin: 0 auto;
    padding: 18px 32px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: var(--muted);
    font-size: 11px;
}
.studio-layout__footer > span:first-child {
    display: flex;
    gap: 10px;
}
@media (max-width: 600px) {
    .studio-layout__content {
        padding: 24px 16px 32px;
    }
    .studio-layout__footer {
        padding: 16px;
        flex-direction: column;
        gap: 5px;
    }
}
</style>
