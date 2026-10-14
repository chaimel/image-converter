<template>
  <header class="topbar">
    <div class="topbar__breadcrumb">
      <span>Studio</span><ChevronRight :size="13" /><strong>Image converter</strong>
    </div>
    <span class="topbar__status"><span /> Local workspace <Monitor :size="14" /></span>
  </header>
</template>
<script setup lang="ts">
import { ChevronRight, Monitor } from '@lucide/vue'
</script>
<style scoped>
.topbar {
  min-height: 65px;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.topbar__breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
}
.topbar__breadcrumb strong {
  font-weight: 550;
  color: var(--ink);
}
.topbar__status {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
}
.topbar__status > span {
  height: 6px;
  width: 6px;
  border-radius: 50%;
  background: #698b51;
}
@media (max-width: 1200px) {
  .topbar {
    padding-inline: 24px;
  }
}
@media (max-width: 600px) {
  .topbar {
    padding-inline: 16px;
    min-height: 50px;
  }
  .topbar__status {
    font-size: 0;
    gap: 0;
  }
  .topbar__status > span {
    display: none;
  }
}
</style>
