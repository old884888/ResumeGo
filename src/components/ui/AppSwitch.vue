<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <button
    class="sw"
    :class="{ on: modelValue }"
    role="switch"
    :aria-checked="modelValue"
    type="button"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.sw {
  width: 40px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-inset);
  border: 1px solid var(--hairline);
  position: relative;
  transition: background-color 0.2s var(--ease), border-color 0.2s var(--ease);
  flex: none;
}
.sw .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.22s var(--spring);
}
.sw.on {
  background: var(--success);
  border-color: transparent;
}
.sw.on .knob {
  transform: translateX(16px);
}
</style>
