<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{ align?: 'left' | 'right' }>(), { align: 'left' })

const open = ref(false)
const root = ref<HTMLElement>()
const pop = ref<HTMLElement>()
const pos = ref({ top: 0, left: 0 })

async function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  open.value = true
  await nextTick()
  const r = root.value?.getBoundingClientRect()
  if (!r) return
  const pw = pop.value?.offsetWidth ?? 150
  pos.value = {
    top: r.bottom + 6,
    left: props.align === 'right' ? r.right - pw : r.left,
  }
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (pop.value?.contains(t) || root.value?.contains(t)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="root" class="am">
    <div class="am-trigger" @click.stop="toggle">
      <slot name="trigger" />
    </div>
    <Teleport to="body">
      <Transition name="menu">
        <div
          v-if="open"
          ref="pop"
          class="am-pop"
          :style="{ top: pos.top + 'px', left: pos.left + 'px' }"
          @click="open = false"
        >
          <slot />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.am {
  display: inline-flex;
}
.am-trigger {
  display: inline-flex;
}
</style>

<style>
.am-pop {
  position: fixed;
  z-index: 150;
  min-width: 148px;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-2);
  box-shadow: var(--shadow-2);
  padding: 4px;
}
.am-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 13px;
  border-radius: 7px;
  color: var(--text-1);
  transition: background-color 0.12s var(--ease);
  text-align: left;
  white-space: nowrap;
}
.am-item:hover {
  background: var(--ui-accent-soft);
}
.am-item.danger {
  color: var(--danger);
}
.am-item.danger:hover {
  background: rgba(255, 59, 48, 0.1);
}
.am-item svg {
  width: 14px;
  height: 14px;
  flex: none;
}
.am-sep {
  height: 1px;
  background: var(--hairline);
  margin: 4px 6px;
}
</style>
