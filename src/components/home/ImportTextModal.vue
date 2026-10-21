<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ClipboardPaste, Sparkles, TriangleAlert, Check } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { parseResumeText, type ParsedResume } from '@/models/importParse'
import { useResumeStore } from '@/stores/resumes'

const emit = defineEmits<{ (e: 'close'): void; (e: 'created', id: string): void }>()

const open = defineModel<boolean>({ default: false })

const text = ref('')
const parsed = ref<ParsedResume | null>(null)
let parseTimer: number | undefined

/* 输入防抖解析 */
watch(text, (v) => {
  if (parseTimer) window.clearTimeout(parseTimer)
  parseTimer = window.setTimeout(() => {
    parseTimer = undefined
    parsed.value = v.trim() ? parseResumeText(v) : null
  }, 250)
})

const hasContent = computed(() => !!parsed.value && parsed.value.sections.length > 0)

const SAMPLE = `李明
求职意向：前端开发工程师
电话：13900001111
邮箱：liming@example.com
GitHub：github.com/liming

教育背景
2018.09 - 2022.06  武汉大学  软件工程（本科）
- GPA 3.6/4.0，连续三年校奖学金
- 参加全国大学生数学建模竞赛获省级二等奖

工作经历
2022.07 - 至今  字节跳动  前端开发工程师
• 负责抖音网页版播放器模块，覆盖日活 3000 万用户
• 推动首屏加载优化，加载时间从 2.4s 降至 1.1s

项目经历
低代码搭建平台 | 核心开发 | 2023.03 - 2023.12
1. 设计组件协议与物料体系，落地 40+ 业务组件
2. 支撑内部 6 个团队产出活动页面 200+ 张

专业技能
熟悉 TypeScript、Vue、React 技术栈
了解 Node.js 与 CI/CD 流水线搭建

自我评价
对交互细节敏感，追求极致的用户体验
乐于分享，团队协作顺畅`

function fillSample() {
  text.value = SAMPLE
}

function clearText() {
  text.value = ''
  parsed.value = null
}

function confirmImport() {
  if (!parsed.value || !hasContent.value) return
  const store = useResumeStore()
  const id = store.putFromParsed(parsed.value)
  open.value = false
  emit('created', id)
}
</script>

<template>
  <AppModal :open="open" title="从文本导入简历" :width="760" @close="emit('close')">
    <p class="hint">
      把旧简历的文字<b>整段复制粘贴</b>到左边 —— 纯文本、Word、PDF、网页里的都行。
      解析完全在本机进行，识别结果可先预览，进编辑器后还能随意调整。
    </p>
    <div class="cols">
      <div class="pane">
        <textarea
          v-model="text"
          class="paste-area"
          placeholder="在此粘贴简历文本…&#10;&#10;例如：&#10;张三&#10;电话：13800000000&#10;教育背景&#10;2018.09 - 2022.06  XX大学  XX专业&#10;…"
          spellcheck="false"
        ></textarea>
        <div class="pane-tools">
          <AppButton size="sm" @click="fillSample"><Sparkles /> 填入示例</AppButton>
          <AppButton size="sm" variant="ghost" @click="clearText">清空</AppButton>
        </div>
      </div>

      <div class="pane preview">
        <template v-if="parsed">
          <div class="pv-head">
            <div class="pv-name">{{ parsed.name || '（未识别姓名）' }}</div>
            <div v-if="parsed.headline" class="pv-headline">{{ parsed.headline }}</div>
            <div class="pv-contacts">
              <span v-if="parsed.phone" class="pv-chip ok"><Check /> 电话</span>
              <span v-else class="pv-chip miss">缺电话</span>
              <span v-if="parsed.email" class="pv-chip ok"><Check /> 邮箱</span>
              <span v-else class="pv-chip miss">缺邮箱</span>
              <span v-for="c in parsed.extraContacts" :key="c.label" class="pv-chip ok">
                <Check /> {{ c.label }}
              </span>
            </div>
          </div>

          <div class="pv-sections">
            <div v-for="s in parsed.sections" :key="s.title" class="pv-section">
              <div class="pv-section-title">{{ s.title }}</div>
              <div v-for="(it, i) in s.items" :key="i" class="pv-item">
                <div class="pv-item-line">
                  <span class="pv-item-title">{{ it.title || '（未命名条目）' }}</span>
                  <span v-if="it.subtitle" class="pv-item-sub">{{ it.subtitle }}</span>
                  <span v-if="it.dateText" class="pv-item-date">{{ it.dateText }}</span>
                </div>
                <ul class="pv-bullets">
                  <li v-for="(b, j) in it.bullets" :key="j">{{ b }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="parsed.warnings.length" class="pv-warnings">
            <div v-for="(w, i) in parsed.warnings" :key="i" class="pv-warning">
              <TriangleAlert /> {{ w }}
            </div>
          </div>
        </template>
        <div v-else class="pv-empty">
          <ClipboardPaste />
          <p>解析预览会出现在这里</p>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton @click="emit('close')">取消</AppButton>
      <AppButton variant="primary" :disabled="!hasContent" @click="confirmImport">
        <ClipboardPaste /> 创建简历
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.hint {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-2);
  margin-bottom: 12px;
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  min-height: 380px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.paste-area {
  flex: 1;
  resize: none;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-2, 10px);
  background: var(--bg);
  color: var(--text-1);
  padding: 12px;
  font-size: 12.5px;
  line-height: 1.7;
  font-family: inherit;
  min-height: 300px;
}
.paste-area:focus {
  outline: none;
  border-color: var(--ui-accent);
}

.pane-tools {
  display: flex;
  gap: 8px;
}

.preview {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-2, 10px);
  background: var(--surface);
  padding: 14px;
  overflow-y: auto;
  max-height: 420px;
}

.pv-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 13px;
}
.pv-empty svg {
  width: 30px;
  height: 30px;
  opacity: 0.6;
}

.pv-name {
  font-size: 17px;
  font-weight: 700;
}
.pv-headline {
  font-size: 12.5px;
  color: var(--text-2);
  margin-top: 2px;
}
.pv-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.pv-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
}
.pv-chip svg {
  width: 11px;
  height: 11px;
}
.pv-chip.ok {
  background: rgba(52, 199, 89, 0.12);
  color: #1d8a3c;
}
.pv-chip.miss {
  background: rgba(255, 159, 10, 0.14);
  color: #b26a00;
}

.pv-sections {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pv-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-accent);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 4px;
}
.pv-item {
  margin-top: 8px;
}
.pv-item-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 12.5px;
}
.pv-item-title {
  font-weight: 600;
}
.pv-item-sub {
  color: var(--text-2);
}
.pv-item-date {
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
}
.pv-bullets {
  margin: 4px 0 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-2);
}

.pv-warnings {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pv-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #b26a00;
}
.pv-warning svg {
  width: 12px;
  height: 12px;
  flex: none;
}
</style>
