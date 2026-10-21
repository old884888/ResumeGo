<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import AppToasts from '@/components/ui/AppToasts.vue'
import { useResumeStore } from '@/stores/resumes'
import { useEditorStore } from '@/stores/editor'
import { useBackupStore } from '@/stores/backup'

const store = useResumeStore()
const editor = useEditorStore()
const backup = useBackupStore()

/* ---------- 全局自动保存：文档变化 → 防抖持久化 → 防抖自动备份 ---------- */
let saveTimer: number | undefined

watch(
  () => JSON.stringify(store.map),
  () => {
    editor.saveState = 'pending'
    if (saveTimer) window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      saveTimer = undefined
      void store.persistAll().then((changed) => {
        editor.saveState = 'saved'
        if (changed.length && !changed.includes('!')) backup.scheduleWrite()
      })
    }, 400)
  },
)

function flushOnLeave() {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
    saveTimer = undefined
  }
  void store.persistAll()
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
    <!-- 显式 duration：后台标签/省电模式下 transitionend 不触发，靠计时器摘类防止页面切换假死 -->
    <transition name="page" mode="out-in" :duration="{ enter: 260, leave: 240 }">
      <component :is="Component" />
    </transition>
  </router-view>
  <AppToasts />
</template>
