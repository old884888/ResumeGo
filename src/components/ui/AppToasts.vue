<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
import { toastState } from '@/stores/toast'
</script>

<template>
  <div class="toasts">
    <TransitionGroup name="toast">
      <div v-for="t in toastState.list" :key="t.id" class="toast" :class="t.kind">
        <CheckCircle2 v-if="t.kind === 'success'" />
        <AlertCircle v-else-if="t.kind === 'error'" />
        <Info v-else />
        <span>{{ t.msg }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 200;
  pointer-events: none;
}
.toast {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid var(--hairline);
  color: var(--text-1);
  padding: 9px 16px;
  border-radius: 99px;
  font-size: 13px;
  display: flex;
  gap: 7px;
  align-items: center;
  box-shadow: var(--shadow-1);
}
.toast svg {
  width: 15px;
  height: 15px;
  flex: none;
}
.toast.success svg {
  color: var(--success);
}
.toast.error svg {
  color: var(--danger);
}
.toast.info svg {
  color: var(--ui-accent);
}
</style>
