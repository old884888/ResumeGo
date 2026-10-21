<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import AppToasts from '@/components/ui/AppToasts.vue'
import { useResumeStore } from '@/stores/resumes'
import { useEditorStore } from '@/stores/editor'

const store = useResumeStore()
const editor = useEditorStore()

/* ---------- 全局自动保存：文档变化 → 防抖持久化 ---------- */
let saveTimer: number | undefined

watch(
  () => JSON.stringify(store.map),
  () => {
    editor.saveState = 'pending'
    if (saveTimer) window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      saveTimer = undefined
      store.persistAll()
      editor.saveState = 'saved'
    }, 400)
  },
)

function flushOnLeave() {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
    saveTimer = undefined
  }
  store.persistAll()
}

onMounted(() => {
  window.addEventListener('pagehide', flushOnLeave)
  window.addEventListener('beforeunload', flushOnLeave)
})
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', flushOnLeave)
  window.removeEventListener('beforeunload', flushOnLeave)
  flushOnLeave()
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <AppToasts />
</template>
