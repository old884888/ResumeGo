<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Settings,
  FileText,
  Sparkles,
  Upload,
  FilePlus2,
  Trash2,
} from 'lucide-vue-next'
import { useResumeStore } from '@/stores/resumes'
import { useEditorStore } from '@/stores/editor'
import ResumeCard from '@/components/home/ResumeCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppMenu from '@/components/ui/AppMenu.vue'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const store = useResumeStore()
const editor = useEditorStore()

const renameTarget = ref<string | null>(null)
const renameText = ref('')
const deleteTarget = ref<string | null>(null)

function open(id: string) {
  editor.open(id)
  router.push(`/editor/${id}`)
}

function createBlank() {
  const id = store.put()
  open(id)
}

function quickSample() {
  import('@/models/sample').then(({ sampleResume }) => {
    const id = store.put(sampleResume())
    open(id)
  })
}

function doRename() {
  if (renameTarget.value && renameText.value.trim()) {
    const r = store.map[renameTarget.value]
    if (r) r.name = renameText.value.trim()
  }
  renameTarget.value = null
}

function doDelete() {
  if (deleteTarget.value) store.remove(deleteTarget.value)
  deleteTarget.value = null
}
</script>

<template>
  <div class="home">
    <header class="home-top">
      <div class="brand">
        <div class="brand-mark">
          <FileText />
        </div>
        <div>
          <div class="brand-name">简白</div>
          <div class="brand-sub">本地简历工坊 · 数据不出本机</div>
        </div>
      </div>
      <router-link to="/settings" class="settings-link" title="设置">
        <Settings />
      </router-link>
    </header>

    <main class="home-main">
      <div class="grid">
        <AppMenu align="left" class="new-wrap">
          <template #trigger>
            <button class="new-card">
              <div class="new-icon"><Plus /></div>
              <div class="new-label">新建简历</div>
            </button>
          </template>
          <button class="am-item" @click="createBlank"><FilePlus2 /> 空白简历</button>
          <button class="am-item" @click="quickSample"><Sparkles /> 从示例开始</button>
          <button class="am-item" @click="store.importOne()"><Upload /> 导入 JSON</button>
        </AppMenu>

        <ResumeCard
          v-for="(r, i) in store.list"
          :key="r.id"
          :resume="r"
          :index="i"
          @open="open(r.id)"
          @rename="((renameTarget = r.id), (renameText = r.name))"
          @duplicate="store.duplicate(r.id)"
          @export="store.exportOne(r.id)"
          @delete="deleteTarget = r.id"
        />
      </div>

      <div v-if="store.list.length === 0" class="empty">
        <div class="empty-icon"><FileText /></div>
        <p>还没有简历，点上面「新建简历」开始</p>
        <AppButton variant="primary" @click="quickSample"><Sparkles /> 用示例试试手</AppButton>
      </div>
    </main>

    <AppModal :open="!!renameTarget" title="重命名简历" @close="renameTarget = null">
      <input v-model="renameText" class="ti" placeholder="简历名称" @keyup.enter="doRename" />
      <template #footer>
        <AppButton @click="renameTarget = null">取消</AppButton>
        <AppButton variant="primary" @click="doRename">确定</AppButton>
      </template>
    </AppModal>

    <AppModal :open="!!deleteTarget" title="删除简历" :width="380" @close="deleteTarget = null">
      <p>删除后无法恢复（除非你导出过 JSON 备份）。真要删？</p>
      <template #footer>
        <AppButton @click="deleteTarget = null">取消</AppButton>
        <AppButton variant="danger" @click="doDelete"><Trash2 /> 删除</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.home-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 48px 10px;
  flex: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--ui-accent), #5ac8fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(10, 132, 255, 0.35);
}
.brand-mark svg {
  width: 20px;
  height: 20px;
}
.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.brand-sub {
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 1px;
}

.settings-link {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  transition: background-color 0.15s var(--ease), transform 0.3s var(--ease);
}
.settings-link:hover {
  background: var(--ui-accent-soft);
  transform: rotate(30deg);
}
.settings-link svg {
  width: 18px;
  height: 18px;
}

.home-main {
  flex: 1;
  overflow-y: auto;
  padding: 18px 48px 48px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 20px;
  max-width: 1280px;
}

.new-wrap {
  height: 100%;
}
.new-wrap :deep(.am-trigger) {
  display: flex;
  width: 100%;
  height: 100%;
}
.new-card {
  width: 100%;
  height: 100%;
  min-height: 308px;
  border: 1.5px dashed var(--hairline-strong);
  border-radius: var(--radius-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  background: transparent;
  transition: border-color 0.2s var(--ease), color 0.2s var(--ease),
    background-color 0.2s var(--ease), transform 0.25s var(--ease);
  animation: card-rise 0.4s var(--ease) backwards;
}
.new-card:hover {
  border-color: var(--ui-accent);
  color: var(--ui-accent);
  background: var(--ui-accent-soft);
  transform: translateY(-4px);
}
.new-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--ui-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.new-icon svg {
  width: 20px;
  height: 20px;
}
.new-label {
  font-size: 13px;
  font-weight: 500;
}

.empty {
  margin-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--text-3);
  animation: card-rise 0.4s var(--ease) backwards;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--ui-accent-soft);
  color: var(--ui-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 6s ease-in-out infinite;
}
.empty-icon svg {
  width: 28px;
  height: 28px;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
.empty p {
  font-size: 14px;
}
</style>
