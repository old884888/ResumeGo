<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'secondary', size: 'md' },
)
</script>

<template>
  <button class="ab" :class="[variant, size]">
    <slot />
  </button>
</template>

<style scoped>
.ab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s var(--ease), filter 0.15s var(--ease),
    transform 0.15s var(--ease), border-color 0.15s var(--ease), box-shadow 0.15s var(--ease);
}
.ab:disabled {
  opacity: 0.4;
  pointer-events: none;
}
.ab.md {
  padding: 7px 14px;
  font-size: 13px;
}
.ab.sm {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 7px;
}
.ab :deep(svg) {
  width: 14px;
  height: 14px;
}

.ab.primary {
  background: var(--ui-accent);
  color: #fff;
  box-shadow: 0 1px 3px rgba(10, 132, 255, 0.35);
}
.ab.primary:hover {
  filter: brightness(1.07);
}
.ab.primary:active {
  transform: scale(0.97);
}

.ab.secondary {
  background: var(--surface);
  border: 1px solid var(--hairline);
  color: var(--text-1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.ab.secondary:hover {
  border-color: var(--hairline-strong);
  background: var(--bg);
}
.ab.secondary:active {
  transform: scale(0.97);
}

.ab.ghost {
  color: var(--ui-accent);
  background: transparent;
}
.ab.ghost:hover {
  background: var(--ui-accent-soft);
}

.ab.danger {
  background: var(--danger);
  color: #fff;
}
.ab.danger:hover {
  filter: brightness(1.06);
}
.ab.danger:active {
  transform: scale(0.97);
}
</style>
