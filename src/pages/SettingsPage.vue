<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, Download, Upload, Trash2, HardDrive, Info } from 'lucide-vue-next'
import { useResumeStore } from '@/stores/resumes'
import { usePrefsStore, type ThemeMode } from '@/stores/prefs'
import { showToast } from '@/stores/toast'
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppModal from '@/components/ui/AppModal.vue'

const store = useResumeStore()
const prefs = usePrefsStore()

const confirmClear = ref(false)

const storageText = computed(() => {
  const bytes = store.storageBytes()
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
})

async function restore() {
  await store.importAll()
}

function doClear() {
  store.clearAll()
  confirmClear.value = false
  showToast('已清空全部本地数据')
}
</script>

<template>
  <div class="settings">
    <header class="top">
      <router-link to="/" class="back"><ChevronLeft /></router-link>
      <h2>设置</h2>
    </header>

    <main class="body">
      <section class="group">
        <h3>外观</h3>
        <div class="row">
          <span class="row-label">主题模式</span>
          <div class="row-ctrl">
            <AppSegmented
              :options="[
                { value: 'system', label: '跟随系统' },
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
              ]"
              :model-value="prefs.theme"
              @update:model-value="(v: string) => prefs.setTheme(v as ThemeMode)"
            />
          </div>
        </div>
      </section>

      <section class="group">
        <h3>数据</h3>
        <div class="row">
          <span class="row-label">
            <HardDrive class="rl-icon" />
            本地占用
          </span>
          <span class="row-value">{{ storageText }}</span>
        </div>
        <div class="row">
          <span class="row-label">备份</span>
          <div class="row-btns">
            <AppButton size="sm" @click="store.exportAll()"><Download /> 导出全部</AppButton>
            <AppButton size="sm" @click="restore"><Upload /> 恢复备份</AppButton>
          </div>
        </div>
        <div class="row">
          <span class="row-label danger-label">危险区</span>
          <AppButton size="sm" variant="danger" @click="confirmClear = true">
            <Trash2 /> 清空全部数据
          </AppButton>
        </div>
      </section>

      <section class="group">
        <h3>关于</h3>
        <div class="about">
          <Info class="rl-icon" />
          <p>
            <b>简白 JianBai</b> · v0.1.0 — 免费、无水印的本地简历工坊。
            所有数据仅保存在浏览器本地（localStorage），导出 PDF 走浏览器打印管线。
            建议使用 Chrome / Edge。
          </p>
        </div>
      </section>
    </main>

    <AppModal :open="confirmClear" title="清空全部数据" :width="380" @close="confirmClear = false">
      <p>将删除本地保存的全部简历，且无法恢复。确定执行驱邪仪式？</p>
      <template #footer>
        <AppButton @click="confirmClear = false">取消</AppButton>
        <AppButton variant="danger" @click="doClear"><Trash2 /> 清空</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.settings {
  height: 100%;
  overflow-y: auto;
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 48px 8px;
}
.back {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  transition: background-color 0.15s var(--ease), transform 0.15s var(--ease);
}
.back:hover {
  background: var(--ui-accent-soft);
  transform: translateX(-2px);
}
.back svg {
  width: 18px;
  height: 18px;
}
h2 {
  font-size: 18px;
  font-weight: 700;
}

.body {
  padding: 10px 48px 48px;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.group {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-3);
  padding: 16px 18px;
}
.group h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 12px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
}
.row-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.row-ctrl {
  width: 260px;
}
.row-value {
  font-size: 13px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.row-btns {
  display: flex;
  gap: 8px;
}
.danger-label {
  color: var(--danger);
}

.rl-icon {
  width: 15px;
  height: 15px;
  color: var(--text-3);
}

.about {
  display: flex;
  gap: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-2);
}
.about .rl-icon {
  margin-top: 4px;
  flex: none;
}
</style>
