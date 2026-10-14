<template>
  <div class="studio-layout">
    <a class="skip-link" href="#main-content">Skip to converter</a>
    <Sidebar />
    <div class="studio-layout__body">
      <Topbar />
      <main id="main-content" class="studio-layout__content" tabindex="-1"><slot /></main>
      <footer class="studio-layout__footer">
        <span>Made for Musticker projects.</span><span>Free to use. Files stay on your computer.</span>
      </footer>
    </div>
  </div>
</template>
<script setup lang="ts">
import Sidebar from '~/components/layout/Sidebar.vue'
import Topbar from '~/components/layout/Topbar.vue'
</script>
<style scoped>
.studio-layout {
  min-height: 100vh;
}
.studio-layout__body {
  margin-left: 224px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.studio-layout__content {
  width: 100%;
  max-width: 1520px;
  margin: 0 auto;
  padding: 36px 40px 48px;
  flex: 1;
}
.studio-layout__content:focus {
  outline: none;
}
.studio-layout__footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 40px;
  color: var(--muted);
  border-top: 1px solid var(--line);
  font-size: 12px;
}
@media (max-width: 1200px) {
  .studio-layout__content {
    padding: 28px 24px 36px;
  }
}
@media (max-width: 1000px) {
  .studio-layout__body {
    margin-left: 0;
  }
}
@media (max-width: 600px) {
  .studio-layout__content {
    padding: 24px 16px 32px;
  }
  .studio-layout__footer {
    padding: 18px 16px;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
