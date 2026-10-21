<script setup lang="ts">
defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()

defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="seg">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :class="{ active: o.value === modelValue }"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  background: var(--bg-inset);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  width: 100%;
}
.seg button {
  flex: 1;
  padding: 4px 6px;
  font-size: 12px;
  border-radius: 6px;
  color: var(--text-2);
  transition: background-color 0.18s var(--ease), color 0.18s var(--ease),
    box-shadow 0.18s var(--ease);
  white-space: nowrap;
}
.seg button:hover {
  color: var(--text-1);
}
.seg button.active {
  background: var(--surface);
  color: var(--text-1);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
