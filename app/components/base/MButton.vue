<template>
  <button
    :type="type"
    :disabled="disabled || isLoading"
    :aria-busy="isLoading || undefined"
    class="m-button"
    :class="[`m-button--${variant}`, `m-button--${size}`, { 'm-button--block': block }]"
  >
    <LoaderCircle v-if="isLoading" :size="16" class="spin" aria-hidden="true" /><slot
      v-else
      name="prefix"
    /><slot /><slot name="suffix" />
  </button>
</template>
<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md'
    disabled?: boolean
    isLoading?: boolean
    block?: boolean
  }>(),
  { type: 'button', variant: 'primary', size: 'md', disabled: false, isLoading: false, block: false },
)
</script>
<style scoped>
.m-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 11px 17px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 650;
  transition:
    background 0.15s,
    border-color 0.15s;
  white-space: nowrap;
}
.m-button--primary {
  background: var(--brand);
  color: #fff;
}
.m-button--primary:hover:not(:disabled) {
  background: #2b4627;
}
.m-button--secondary {
  background: var(--surface);
  border-color: var(--line-strong);
  color: var(--ink);
}
.m-button--secondary:hover:not(:disabled) {
  background: var(--soft);
  border-color: #abbda2;
}
.m-button--ghost {
  background: transparent;
  color: var(--muted);
}
.m-button--ghost:hover:not(:disabled) {
  background: var(--soft);
  color: var(--ink);
}
.m-button--sm {
  min-height: 36px;
  padding: 8px 11px;
  font-size: 12px;
}
.m-button--block {
  width: 100%;
}
</style>
