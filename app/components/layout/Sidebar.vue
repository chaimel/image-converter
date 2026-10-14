<template>
  <aside class="sidebar" aria-label="Workspace navigation">
    <NuxtLink class="sidebar__brand" to="/" aria-label="Musticker Studio home"
      ><span class="sidebar__mark">m<ArrowUpRight :size="17" /></span
      ><span>musticker<small>STUDIO</small></span></NuxtLink
    >
    <div class="sidebar__workspace">
      <span class="sidebar__avatar">M</span>
      <div>Personal workspace<small>Local tools for your projects</small></div>
    </div>
    <nav class="sidebar__nav" aria-label="Tools">
      <span class="sidebar__label">CREATE & PREPARE</span>
      <a class="sidebar__link sidebar__link--active" href="#workspace" aria-current="page"
        ><ArrowLeftRight :size="18" />Image converter<span class="sidebar__dot"
      /></a>
      <a class="sidebar__link" href="#presets"><SlidersHorizontal :size="18" />Export presets</a>
    </nav>
    <div class="sidebar__bottom">
      <ShieldCheck :size="24" /><strong>Your files. Your computer.</strong>
      <p>Convert locally with no accounts, subscriptions, or cloud uploads.</p>
      <span><span class="sidebar__dot" /> Offline ready</span>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { ArrowLeftRight, ArrowUpRight, ShieldCheck, SlidersHorizontal } from '@lucide/vue'
</script>
<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 224px;
  display: flex;
  flex-direction: column;
  padding: 30px 18px 24px;
  background: #243c31;
  color: #f3f7ed;
  z-index: 20;
  overflow-y: auto;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  font-family: var(--font-heading);
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -1px;
}
.sidebar__mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent);
  color: #243c31;
  font-size: 31px;
  line-height: 1;
  padding-right: 3px;
}
.sidebar__mark svg {
  position: absolute;
  right: 1px;
  top: 2px;
}
.sidebar__brand small {
  display: block;
  font: 500 9px var(--font-ui);
  letter-spacing: 3px;
  margin-top: 3px;
  color: #bdcbbf;
}
.sidebar__workspace {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 20px 8px 22px;
  margin: 24px 0;
  border-block: 1px solid #ffffff20;
  font-size: 12px;
  font-weight: 600;
}
.sidebar__workspace small {
  display: block;
  font-weight: 400;
  font-size: 10px;
  margin-top: 4px;
  color: #bbcabe;
}
.sidebar__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 32px;
  border: 1px solid #8a9c8c;
  border-radius: 8px;
}
.sidebar__nav {
  display: grid;
  gap: 7px;
}
.sidebar__label {
  font-size: 9px;
  font-weight: 600;
  color: #aebeaf;
  letter-spacing: 1.6px;
  padding: 0 12px 10px;
}
.sidebar__link {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 12px;
  color: #dbe6da;
}
.sidebar__link:hover {
  background: #ffffff0d;
}
.sidebar__link--active {
  background: #d5eba71c;
  color: #e4f1c4;
  font-weight: 650;
}
.sidebar__link--active:hover {
  background: #d5eba728;
}
.sidebar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}
.sidebar__link .sidebar__dot {
  margin-left: auto;
}
.sidebar__bottom {
  margin: auto 10px 0;
  padding-top: 60px;
}
.sidebar__bottom > svg {
  color: var(--accent);
  margin-bottom: 12px;
}
.sidebar__bottom strong {
  display: block;
  font-size: 13px;
}
.sidebar__bottom p {
  color: #bdcbbf;
  font-size: 12px;
  line-height: 1.7;
  margin: 8px 0 18px;
}
.sidebar__bottom > span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: #dce9cf;
}
@media (max-width: 1000px) {
  .sidebar {
    position: relative;
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    overflow: visible;
  }
  .sidebar__workspace,
  .sidebar__label,
  .sidebar__bottom {
    display: none;
  }
  .sidebar__nav {
    display: flex;
  }
  .sidebar__brand {
    font-size: 20px;
    padding: 0;
  }
  .sidebar__mark {
    width: 34px;
    height: 34px;
    font-size: 27px;
  }
}
@media (max-width: 600px) {
  .sidebar {
    padding: 14px 16px;
  }
  .sidebar__nav {
    display: none;
  }
}
</style>
