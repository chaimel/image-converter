<template>
  <dialog
    ref="dialog"
    class="m-modal"
    :aria-labelledby="titleId"
    @close="open = false"
    @cancel="open = false"
    @click="closeOnBackdrop"
  >
    <div class="m-modal__heading">
      <div>
        <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Close dialog" @click="open = false">
        <X :size="20" />
      </button>
    </div>
    <div class="m-modal__body"><slot /></div>
    <div v-if="$slots.footer" class="m-modal__footer"><slot name="footer" /></div>
  </dialog>
</template>
<script setup lang="ts">
import { X } from '@lucide/vue'
const open = defineModel<boolean>({ default: false })
defineProps<{ title: string; eyebrow?: string }>()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
function syncDialog() {
  if (!dialog.value) return
  if (open.value && !dialog.value.open) dialog.value.showModal()
  else if (!open.value && dialog.value.open) dialog.value.close()
}
watch(open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
function closeOnBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const bounds = dialog.value!.getBoundingClientRect()
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    open.value = false
}
</script>
<style scoped>
.m-modal {
  width: min(780px, calc(100% - 32px));
  max-height: min(90dvh, 900px);
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 24px 100px #14251633;
}
.m-modal::backdrop {
  background: #12251dc0;
  backdrop-filter: blur(4px);
}
.m-modal__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px;
  border-bottom: 1px solid var(--line);
}
.m-modal__heading h2 {
  font-size: 21px;
  font-family: var(--font-heading);
  overflow-wrap: anywhere;
}
.m-modal__heading .eyebrow {
  display: block;
  margin-bottom: 8px;
}
.m-modal__body {
  padding: 24px 26px;
}
.m-modal__footer {
  padding: 18px 26px;
  background: var(--soft);
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
@media (max-width: 600px) {
  .m-modal__heading,
  .m-modal__body,
  .m-modal__footer {
    padding: 18px;
  }
  .m-modal__footer {
    flex-wrap: wrap;
  }
}
</style>
