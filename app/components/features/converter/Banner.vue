<template>
  <header class="banner">
    <div class="banner__heading">
      <div>
        <span class="eyebrow">YOUR EVERYDAY IMAGE TOOLKIT</span>
        <h1>Image converter<span>.</span></h1>
        <p>A new format, the right size, ready for your next project.</p>
      </div>
      <MButton variant="secondary" size="sm" @click="emit('guide')"
        ><template #prefix><CircleHelp :size="15" /></template>Format guide<template #suffix
          ><ArrowUpRight :size="14" /></template
      ></MButton>
    </div>
    <ol class="banner__steps" aria-label="Conversion workflow">
      <li :class="{ 'banner__step--done': count > 0 }">
        <span><Check v-if="count" :size="12" /><template v-else>1</template></span
        >Add images
      </li>
      <li :class="{ 'banner__step--current': count > 0 && !completed }"><span>2</span>Choose your output</li>
      <li :class="{ 'banner__step--current': completed > 0 }">
        <span><Check v-if="completed" :size="12" /><template v-else>3</template></span
        >Convert & download
      </li>
    </ol>
  </header>
</template>
<script setup lang="ts">
import { ArrowUpRight, Check, CircleHelp } from '@lucide/vue'
import MButton from '~/components/base/MButton.vue'
defineProps<{ count: number; completed: number }>()
const emit = defineEmits<{ guide: [] }>()
</script>
<style scoped>
.banner__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.banner h1 {
  font-size: clamp(29px, 3vw, 40px);
  letter-spacing: -1.8px;
  margin: 8px 0 10px;
  font-weight: 750;
}
.banner h1 > span {
  color: #729351;
}
.banner p {
  color: var(--muted);
  font-size: 13px;
}
.banner__steps {
  display: flex;
  align-items: center;
  gap: 26px;
  list-style: none;
  padding: 0;
  margin: 24px 0 28px;
}
.banner__steps li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
}
.banner__steps li > span {
  width: 23px;
  height: 23px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  display: grid;
  place-items: center;
  font-size: 10px;
}
.banner__steps .banner__step--done,
.banner__steps .banner__step--current {
  color: var(--brand);
  font-weight: 600;
}
.banner__step--done > span,
.banner__step--current > span {
  background: var(--accent);
  border-color: var(--accent) !important;
}
@media (max-width: 600px) {
  .banner__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
  .banner__steps {
    gap: 14px;
    margin: 22px 0;
  }
  .banner__steps li {
    gap: 5px;
    font-size: 10px;
  }
  .banner__steps li > span {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  .banner h1 {
    letter-spacing: -1px;
  }
}
</style>
