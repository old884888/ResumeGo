<script setup lang="ts">
defineProps<{ title?: string; danger?: boolean }>()
</script>

<template>
  <button class="ib" :class="{ danger }" :title="title" type="button">
    <slot />
  </button>
</template>

<style scoped>
.ib {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  transition: background-color 0.15s var(--ease), color 0.15s var(--ease),
    transform 0.15s var(--ease);
  flex: none;
}
.ib:hover {
  background: var(--ui-accent-soft);
  color: var(--text-1);
}
.ib:active {
  transform: scale(0.92);
}
.ib.danger:hover {
  background: rgba(255, 59, 48, 0.12);
  color: var(--danger);
}
.ib :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
