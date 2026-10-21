<script setup lang="ts">
import { ref } from 'vue'
import { Plus, GraduationCap, Briefcase, FolderGit2, Wrench, Sparkles } from 'lucide-vue-next'
import type { Resume, SectionType } from '@/models/types'
import { newSection } from '@/models/defaults'
import BasicsForm from './BasicsForm.vue'
import SectionEditor from './SectionEditor.vue'
import AppMenu from '@/components/ui/AppMenu.vue'

defineProps<{ resume: Resume }>()

const addOpen = ref(false)

const TYPE_OPTIONS: { type: SectionType; label: string; icon: unknown }[] = [
  { type: 'work', label: '工作经历', icon: Briefcase },
  { type: 'project', label: '项目经历', icon: FolderGit2 },
  { type: 'education', label: '教育背景', icon: GraduationCap },
  { type: 'skill', label: '专业技能', icon: Wrench },
  { type: 'custom', label: '自定义分区', icon: Sparkles },
]

function addSection(type: SectionType, resume: Resume) {
  resume.sections.push(newSection(type))
}
</script>

<template>
  <aside class="panel content">
    <div class="panel-scroll">
      <section class="card">
        <h3>基本信息</h3>
        <BasicsForm :resume="resume" />
      </section>

      <SectionEditor v-for="s in resume.sections" :key="s.id" :section="s" :resume="resume" />

      <AppMenu align="left" class="add-sec-wrap">
        <template #trigger>
          <button class="add-sec"><Plus /> 添加分区</button>
        </template>
        <button
          v-for="o in TYPE_OPTIONS"
          :key="o.type"
          class="am-item"
          @click="addSection(o.type, resume)"
        >
          <component :is="o.icon" /> {{ o.label }}
        </button>
      </AppMenu>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* 关键：flex 列容器滚动时子项禁止收缩，否则卡片被压扁、内容被裁 */
.panel-scroll > * {
  flex: none;
}

.card {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-3);
  background: var(--surface);
  padding: 12px 14px 14px;
}
h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.add-sec-wrap {
  align-self: stretch;
}
.add-sec-wrap :deep(.am-trigger) {
  display: flex;
  width: 100%;
}
.add-sec {
  width: 100%;
  border: 1.5px dashed var(--hairline-strong);
  border-radius: var(--radius-2);
  padding: 9px;
  font-size: 13px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: border-color 0.2s var(--ease), color 0.2s var(--ease),
    background-color 0.2s var(--ease);
}
.add-sec:hover {
  border-color: var(--ui-accent);
  color: var(--ui-accent);
  background: var(--ui-accent-soft);
}
.add-sec svg {
  width: 14px;
  height: 14px;
}
</style>
