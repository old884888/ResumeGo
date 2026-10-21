<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ZoomIn, ZoomOut, Scan, PencilLine } from 'lucide-vue-next'
import type { Resume } from '@/models/types'
import { usePrefsStore } from '@/stores/prefs'
import Paper from '@/components/preview/Paper.vue'
import IconBtn from '@/components/ui/IconBtn.vue'

const props = defineProps<{ resume: Resume }>()

const prefs = usePrefsStore()

const PAGE_H = 1123
const wrapEl = ref<HTMLElement>()
const paperEl = ref<HTMLElement>()
const scale = ref(0.62)
const paperH = ref(PAGE_H)
const padTop = ref(58)
const padBottom = ref(58)

const pageCount = computed(() => Math.max(1, Math.ceil(paperH.value / PAGE_H)))

let ro: ResizeObserver | undefined
let roPaper: ResizeObserver | undefined

function fitWidth() {
  if (!wrapEl.value) return
  const avail = wrapEl.value.clientWidth - 72
  scale.value = Math.min(1.4, Math.max(0.35, avail / 794))
}

function measurePad() {
  if (!paperEl.value) return
  const el = paperEl.value.firstElementChild as HTMLElement | null
  if (!el) return
  const cs = getComputedStyle(el)
  padTop.value = parseFloat(cs.paddingTop) || 58
  padBottom.value = parseFloat(cs.paddingBottom) || 58
}

onMounted(() => {
  fitWidth()
  ro = new ResizeObserver(() => fitWidth())
  if (wrapEl.value) ro.observe(wrapEl.value)
  roPaper = new ResizeObserver(() => {
    if (paperEl.value) paperH.value = paperEl.value.offsetHeight
    measurePad()
  })
  if (paperEl.value) roPaper.observe(paperEl.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  roPaper?.disconnect()
})

function zoomIn() {
  scale.value = Math.min(2, +(scale.value + 0.1).toFixed(2))
}
function zoomOut() {
  scale.value = Math.max(0.3, +(scale.value - 0.1).toFixed(2))
}

const guides = computed(() => {
  const arr: { top: number; height: number }[] = []
  for (let i = 1; i < pageCount.value; i++) {
    arr.push({
      top: i * PAGE_H - padBottom.value,
      height: padBottom.value + padTop.value,
    })
  }
  return arr
})

void props
</script>

<template>
  <div ref="wrapEl" class="preview">
    <div class="paper-outer" :style="{ width: 794 * scale + 'px', height: paperH * scale + 'px' }">
      <div class="paper-scale" :style="{ transform: `scale(${scale})` }">
        <div ref="paperEl" class="paper-holder">
          <Paper :resume="resume" class="paper-shadow" />
        </div>
        <div
          v-for="(g, gi) in guides"
          :key="gi"
          class="guide"
          :style="{ top: g.top + 'px', height: g.height + 'px' }"
        ></div>
      </div>
    </div>

    <div class="zoom-dock">
      <IconBtn
        :title="prefs.inlineEdit ? '纸上编辑：开 — 点击纸张文字直接修改' : '纸上编辑：关'"
        :class="{ 'edit-on': prefs.inlineEdit }"
        @click="prefs.setInlineEdit(!prefs.inlineEdit)"
      >
        <PencilLine />
      </IconBtn>
      <span class="zoom-sep"></span>
      <IconBtn title="缩小" @click="zoomOut"><ZoomOut /></IconBtn>
      <span class="zoom-val">{{ Math.round(scale * 100) }}%</span>
      <IconBtn title="放大" @click="zoomIn"><ZoomIn /></IconBtn>
      <span class="zoom-sep"></span>
      <IconBtn title="适应宽度" @click="fitWidth"><Scan /></IconBtn>
      <span class="zoom-sep"></span>
      <span class="page-count" :class="{ warn: pageCount > 1 }">{{ pageCount }} 页</span>
    </div>
  </div>
</template>

<style scoped>
.preview {
  height: 100%;
  overflow: auto;
  background: var(--bg-inset);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 24px 90px;
  position: relative;
}

.paper-outer {
  position: relative;
  flex: none;
}
.paper-scale {
  position: absolute;
  top: 0;
  left: 0;
  width: 794px;
  transform-origin: 0 0;
}
.paper-holder {
  position: relative;
}
.paper-shadow {
  box-shadow: var(--shadow-2);
  border-radius: 2px;
}

/* 分页留白带：模拟真实分页的页边距区域，虚线居中 */
.guide {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    #ffffff 14%,
    #ffffff 86%,
    rgba(255, 255, 255, 0) 100%
  );
}
.guide::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1.5px dashed rgba(10, 132, 255, 0.45);
}

.zoom-dock {
  position: sticky;
  bottom: 16px;
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid var(--hairline);
  border-radius: 99px;
  padding: 4px 10px;
  box-shadow: var(--shadow-1);
  z-index: 20;
  flex: none;
}
.zoom-dock .zoom-val {
  font-size: 12px;
  color: var(--text-2);
  min-width: 42px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.zoom-dock .zoom-sep {
  width: 1px;
  height: 16px;
  background: var(--hairline);
  margin: 0 6px;
}
.zoom-dock .page-count {
  font-size: 12px;
  color: var(--text-2);
  padding: 0 8px;
  white-space: nowrap;
}
.zoom-dock .page-count.warn {
  color: var(--warning);
  font-weight: 600;
}
.zoom-dock .ib.edit-on {
  background: var(--ui-accent-soft);
  color: var(--ui-accent);
}
</style>
