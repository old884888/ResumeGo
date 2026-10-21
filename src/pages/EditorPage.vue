<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft,
  Check,
  LoaderCircle,
  Undo2,
  Redo2,
  Download,
  Printer,
  Sun,
  Moon,
} from 'lucide-vue-next'
import type { Resume } from '@/models/types'
import { EDITABLE_KEY } from '@/injectKeys'
import { useResumeStore } from '@/stores/resumes'
import { useEditorStore } from '@/stores/editor'
import { usePrefsStore } from '@/stores/prefs'
import { showToast } from '@/stores/toast'
import { useHistory } from '@/composables/useHistory'
import ContentPanel from '@/components/editor/ContentPanel.vue'
import PreviewPane from '@/components/editor/PreviewPane.vue'
import StylePanel from '@/components/editor/StylePanel.vue'
import RichBoldToolbar from '@/components/editor/RichBoldToolbar.vue'
import Paper from '@/components/preview/Paper.vue'
import IconBtn from '@/components/ui/IconBtn.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'

const route = useRoute()
const router = useRouter()
const store = useResumeStore()
const editor = useEditorStore()
const prefs = usePrefsStore()

const id = String(route.params.id ?? '')
if (!store.map[id]) {
  showToast('简历不存在，可能已被删除', 'error')
  router.replace('/')
}
editor.open(id)

const resume = computed<Resume | null>(() => store.map[editor.activeId ?? ''] ?? null)

/* 纸上直编：预览内直接点击文字编辑（打印出口除外） */
provide(
  EDITABLE_KEY,
  computed(() => prefs.inlineEdit),
)

/* ---------- 撤销/重做（updatedAt 不参与快照，避免时间戳反馈循环） ---------- */
const { undo, redo, canUndo, canRedo } = useHistory(
  () => {
    const r = resume.value
    if (!r) return ''
    const { updatedAt: _u, ...rest } = r
    void _u
    return JSON.stringify(rest)
  },
  (snap) => {
    const r = resume.value
    if (!r) return
    const data = JSON.parse(snap)
    const keep = { updatedAt: r.updatedAt }
    for (const k of Object.keys(r) as (keyof Resume)[]) delete r[k]
    Object.assign(r, data, keep)
  },
  () => {
    const r = resume.value
    if (r) r.updatedAt = Date.now()
  },
)

watch(
  () => editor.activeId,
  () => store.persistAll(),
)

/* ---------- 主题快捷切换 ---------- */
const isDark = ref(document.documentElement.dataset.theme === 'dark')
watch(isDark, () => void 0)

function refreshIsDark() {
  isDark.value = document.documentElement.dataset.theme === 'dark'
}

function toggleTheme() {
  prefs.setTheme(isDark.value ? 'light' : 'dark')
  refreshIsDark()
}

/* ---------- 导出：一键下载 PDF（位图）+ 矢量打印版 ---------- */
const exporting = ref(false)
const showPrintHint = ref(false)

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(msg)), ms)),
  ])
}

/** 一键导出 PDF：渲染纸张为高清位图，智能分页（条目不被拦腰切断），直接下载 */
async function exportPdf() {
  if (exporting.value || !resume.value) return
  exporting.value = true
  try {
    await nextTick()
    const src = document.querySelector('.paper-holder .paper') as HTMLElement | null
    if (!src) throw new Error('纸张未渲染')
    // 克隆纸张到离屏容器，规避预览缩放 transform 与阴影
    const holder = document.createElement('div')
    holder.style.cssText =
      'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;'
    const clone = src.cloneNode(true) as HTMLElement
    clone.classList.remove('paper-shadow')
    clone.style.transform = 'none'
    clone.style.boxShadow = 'none'
    holder.appendChild(clone)
    document.body.appendChild(holder)

    const { toCanvas } = await import('html-to-image')
    const canvas = await withTimeout(
      toCanvas(clone, { pixelRatio: 2.5, backgroundColor: '#ffffff' }),
      60000,
      '渲染超时',
    )
    // 关键：条目边界测量必须在 holder 仍在 DOM 时进行（离场元素 offsetTop 全为 0）
    const blocks = measureItemBlocks(clone, canvas.width / 794)
    const cssPad = parseFloat(getComputedStyle(clone).paddingTop) || 56
    const padTop = cssPad * (canvas.width / 794)
    const padBottom = (parseFloat(getComputedStyle(clone).paddingBottom) || cssPad) * (canvas.width / 794)
    holder.remove()
    await sliceToPdf(canvas, blocks, padTop, padBottom)
    showToast('PDF 已导出')
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : String(err)
    showToast(
      msg === '渲染超时'
        ? '导出超时，请重试；或改用右上角「矢量打印版」'
        : '导出失败：' + msg,
      'error',
    )
  } finally {
    exporting.value = false
  }
}

/** 测量条目块边界（相对纸张顶部的画布像素），供分页避让；必须在元素仍在 DOM 中时调用 */
function measureItemBlocks(paperEl: HTMLElement, scale: number) {
  const k = scale
  return Array.from(paperEl.querySelectorAll<HTMLElement>('.p-item')).map((el) => ({
    top: el.offsetTop * k,
    bottom: (el.offsetTop + el.offsetHeight) * k,
  }))
}

async function sliceToPdf(
  canvas: HTMLCanvasElement,
  blocks: { top: number; bottom: number }[],
  padTop: number,
  padBottom: number,
) {
  const { jsPDF } = await import('jspdf')
  const PAGE_W = 794
  const PAGE_H = 1123
  const scale = canvas.width / PAGE_W
  const pageHpx = PAGE_H * scale
  const k = scale

  /* 分页窗口模型：
     - 首页窗口 = 整页 - 页底留白（长图自带纸张顶部内边距）
     - 后续页窗口 = 整页 - 页顶留白 - 页底留白，内容绘制在 y = padTop 处
     - 切割线落在条目内部时上移到条目上方 */
  const firstWindow = pageHpx - padBottom
  const windowH = pageHpx - padTop - padBottom

  const cuts: number[] = [0]
  const draws: { top: number; h: number; offset: number }[] = [{ top: 0, h: firstWindow, offset: 0 }]
  let y = firstWindow
  while (y < canvas.height - 4) {
    let cut = y
    for (const b of blocks) {
      if (b.top + 12 * k < y && y < b.bottom - 12 * k) {
        cut = b.top - 6 * k
        break
      }
    }
    const prev = cuts[cuts.length - 1]
    if (cut - prev < windowH * 0.35) cut = y // 单块超过整页 65%，硬切
    cuts.push(cut)
    draws.push({ top: cut, h: Math.min(windowH, canvas.height - cut), offset: padTop })
    y = cut + windowH
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const mmPerPx = 210 / canvas.width
  for (let i = 0; i < draws.length; i++) {
    const { top, h, offset } = draws[i]
    if (h <= 0) continue
    const part = document.createElement('canvas')
    part.width = canvas.width
    part.height = Math.ceil(pageHpx)
    const ctx = part.getContext('2d')
    if (!ctx) continue
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, part.width, part.height)
    ctx.drawImage(canvas, 0, top, canvas.width, h, 0, offset, canvas.width, h)
    const img = part.toDataURL('image/jpeg', 0.95)
    if (i > 0) pdf.addPage()
    pdf.addImage(img, 'JPEG', 0, 0, 210, 297)
  }
  pdf.save(`${resume.value?.name || '简历'}.pdf`)
}

/** 矢量打印版：走浏览器打印管线，文字可选中（ATS 友好） */
function printVector() {
  if (!prefs.printHintSeen) {
    showPrintHint.value = true
    return
  }
  doPrint()
}

function doPrint() {
  store.persistAll()
  window.print()
}

/* ---------- 快捷键 ---------- */
function onKey(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  const k = e.key.toLowerCase()
  if (k === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  } else if ((k === 'z' && e.shiftKey) || k === 'y') {
    e.preventDefault()
    redo()
  } else if (k === 's') {
    e.preventDefault()
    exportPdf()
  } else if (k === 'p') {
    e.preventDefault()
    printVector()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  refreshIsDark()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  editor.close()
})
</script>

<template>
  <div v-if="resume" class="editor">
    <header class="topbar">
      <div class="tb-left">
        <router-link to="/" class="back" title="返回列表">
          <ChevronLeft />
        </router-link>
        <input v-model="resume.name" class="ti-bare tb-name" placeholder="简历名称" />
        <span class="save-state" :class="editor.saveState">
          <LoaderCircle v-if="editor.saveState === 'pending'" class="spin" />
          <Check v-else />
          {{ editor.saveState === 'pending' ? '保存中' : '已保存' }}
        </span>
      </div>

      <div class="tb-right">
        <IconBtn title="撤销 (Ctrl+Z)" :disabled="!canUndo" @click="undo"><Undo2 /></IconBtn>
        <IconBtn title="重做 (Ctrl+Shift+Z)" :disabled="!canRedo" @click="redo"><Redo2 /></IconBtn>
        <span class="tb-sep"></span>
        <IconBtn title="矢量打印版（文字可选中，ATS 友好）" @click="printVector">
          <Printer />
        </IconBtn>
        <IconBtn :title="isDark ? '切换浅色' : '切换深色'" @click="toggleTheme">
          <Sun v-if="isDark" />
          <Moon v-else />
        </IconBtn>
        <AppButton variant="primary" :disabled="exporting" @click="exportPdf">
          <LoaderCircle v-if="exporting" class="spin" />
          <Download v-else />
          {{ exporting ? '导出中…' : '导出 PDF' }}
        </AppButton>
      </div>
    </header>

    <main class="cols">
      <div class="col col-left"><ContentPanel :resume="resume" /></div>
      <div class="col col-mid"><PreviewPane :resume="resume" /></div>
      <div class="col col-right"><StylePanel :resume="resume" /></div>
    </main>

    <RichBoldToolbar />

    <Teleport to="body">
      <div id="print-root">
        <Paper :resume="resume" print-mode />
      </div>
    </Teleport>

    <AppModal
      :open="showPrintHint"
      title="矢量打印版 · 设置四步"
      :width="420"
      @close="showPrintHint = false"
    >
      <p class="print-lead">矢量版文字可选中复制（求职系统解析友好）。打印对话框中请确认：</p>
      <ol class="print-steps">
        <li>目标打印机选择 <b>「另存为 PDF」</b></li>
        <li>更多设置中<b>取消勾选「页眉和页脚」</b>（去掉日期、网址、页码）</li>
        <li>边距选择 <b>「无」</b>（排版留白已由纸张内边距承担）</li>
        <li>勾选 <b>「背景图形」</b>（否则主题色和底色不打印）</li>
      </ol>
      <template #footer>
        <label class="no-more">
          <input v-model="prefs.printHintSeen" type="checkbox" />
          不再提示
        </label>
        <AppButton
          variant="primary"
          @click="((prefs.setPrintHintSeen()), (showPrintHint = false), doPrint())"
        >
          继续打印
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.editor {
  height: 100%;
  display: grid;
  grid-template-rows: 52px 1fr;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  z-index: 30;
}

.tb-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
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
  flex: none;
}
.back:hover {
  background: var(--ui-accent-soft);
  transform: translateX(-2px);
}
.back svg {
  width: 18px;
  height: 18px;
}
.tb-name {
  font-size: 14px;
  font-weight: 600;
  max-width: 320px;
  width: 100%;
}

.save-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
  flex: none;
}
.save-state svg {
  width: 12px;
  height: 12px;
}
.save-state.saved svg {
  color: var(--success);
}
.save-state.pending svg {
  color: var(--ui-accent);
  animation: pulse 1.2s var(--ease) infinite;
}
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.tb-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tb-sep {
  width: 1px;
  height: 18px;
  background: var(--hairline);
  margin: 0 4px;
}

.cols {
  display: grid;
  grid-template-columns: 302px 1fr 268px;
  min-height: 0;
}
.col {
  min-height: 0;
  animation: col-in 0.4s var(--ease) backwards;
}
.col-left {
  animation-delay: 0ms;
  border-right: 1px solid var(--hairline);
}
.col-mid {
  animation-delay: 60ms;
}
.col-right {
  animation-delay: 120ms;
  border-left: 1px solid var(--hairline);
}
@keyframes col-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

.print-lead {
  margin-bottom: 10px;
}
.print-steps {
  margin: 4px 0 4px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-1);
}
.print-steps b {
  color: var(--ui-accent);
}
.no-more {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
  margin-right: auto;
  cursor: pointer;
}
</style>
