<script setup lang="ts">
import { X } from 'lucide-vue-next'
import IconBtn from './IconBtn.vue'

withDefaults(defineProps<{ open: boolean; title?: string; width?: number }>(), {
  title: '',
  width: 420,
})

defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="mask" @click.self="$emit('close')">
        <div class="modal-panel" :style="{ maxWidth: width + 'px' }">
          <header v-if="title">
            <h3>{{ title }}</h3>
            <IconBtn title="关闭" @click="$emit('close')"><X /></IconBtn>
          </header>
          <div class="body">
            <slot />
          </div>
          <footer v-if="$slots.footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-panel {
  background: var(--surface);
  border-radius: var(--radius-4);
  box-shadow: var(--shadow-2);
  width: calc(100vw - 48px);
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}
h3 {
  font-size: 15px;
  font-weight: 600;
}
.body {
  padding: 14px 20px 20px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}
footer {
  padding: 0 20px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
