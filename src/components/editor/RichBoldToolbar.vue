<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Bold } from 'lucide-vue-next'

/**
 * 选词快捷工具条（双模式）：
 * - 左栏表单：input/textarea 选中文字 → 包裹 / 解除 ** 标记
 * - 纸上直编：contenteditable 选中文字 → execCommand 加粗（工具条跟随选区）
 */
type Mode = 'field' | 'paper' | null

const visible = ref(false)
const pos = ref({ top: 0, left: 0 })
const mode = ref<Mode>(null)
let fieldEl: HTMLInputElement | HTMLTextAreaElement | null = null

function update() {
  const active = document.activeElement
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    if (active.readOnly || active.disabled) return hide()
    const s = active.selectionStart
    const e = active.selectionEnd
    if (s === null || e === null || s >= e) return hide()
    if (!active.closest('.panel-scroll')) return hide()
    mode.value = 'field'
    fieldEl = active
    const r = active.getBoundingClientRect()
    const above = r.top > 72
    pos.value = {
      top: above ? r.top - 38 : r.bottom + 8,
      left: r.left + Math.min(r.width / 2 - 40, 240),
    }
    visible.value = true
    return
  }

  if (active instanceof HTMLElement && active.isContentEditable) {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return hide()
    const text = sel.toString()
    if (!text.trim()) return hide()
    const range = sel.getRangeAt(0)
    const anchor =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
    const paper = anchor?.closest('.paper')
    if (!paper || paper.getAttribute('data-edit') !== 'on') return hide()
    mode.value = 'paper'
    fieldEl = null
    const r = range.getBoundingClientRect()
    pos.value = {
      top: r.top > 60 ? r.top - 40 : r.bottom + 8,
      left: r.left + r.width / 2 - 40,
    }
    visible.value = true
    return
  }

  hide()
}

function hide() {
  visible.value = false
  mode.value = null
  fieldEl = null
}

function applyBold() {
  if (mode.value === 'field' && fieldEl) {
    const el = fieldEl
    if (el.selectionStart === null || el.selectionEnd === null) return hide()
    const s = el.selectionStart
    const e = el.selectionEnd
    const v = el.value
    const sel = v.slice(s, e)
    if (!sel.trim()) return hide()

    const outside = v.slice(s - 2, s) === '**' && v.slice(e, e + 2) === '**'
    const inside = sel.length > 4 && sel.startsWith('**') && sel.endsWith('**')
    let nv: string
    let ns: number
    let ne: number
    if (outside) {
      nv = v.slice(0, s - 2) + sel + v.slice(e + 2)
      ns = s - 2
      ne = e - 2
    } else if (inside) {
      nv = v.slice(0, s) + sel.slice(2, -2) + v.slice(e)
      ns = s
      ne = e - 4
    } else {
      nv = v.slice(0, s) + '**' + sel + '**' + v.slice(e)
      ns = s
      ne = e + 4
    }
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, nv)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.focus()
    el.setSelectionRange(ns, ne)
    return
  }

  if (mode.value === 'paper') {
    // execCommand('bold') 会派发 input 事件，EditableText 自动提交并序列化
    document.execCommand('bold')
  }
}

function onDocMouseDown(e: MouseEvent) {
  if (!visible.value) return
  if ((e.target as HTMLElement).closest('.bold-tb')) return
  hide()
}

function onScroll() {
  if (visible.value) hide()
}

onMounted(() => {
  document.addEventListener('selectionchange', update)
  document.addEventListener('mousedown', onDocMouseDown, true)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', update)
  document.removeEventListener('mousedown', onDocMouseDown, true)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="menu">
      <div
        v-if="visible"
        class="bold-tb"
        :style="{ top: pos.top + 'px', left: pos.left + 'px' }"
      >
        <button class="bold-btn" title="加粗 / 取消加粗" @mousedown.prevent @click="applyBold">
          <Bold />
          <span>加粗</span>
          <kbd>**</kbd>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.bold-tb {
  position: fixed;
  z-index: 120;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  padding: 3px;
}
.bold-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-1);
  border-radius: 7px;
  transition: background-color 0.12s var(--ease);
}
.bold-btn:hover {
  background: var(--ui-accent-soft);
}
.bold-btn svg {
  width: 13px;
  height: 13px;
  color: var(--ui-accent);
}
.bold-btn kbd {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-3);
  background: var(--bg-inset);
  border-radius: 4px;
  padding: 1px 4px;
}
</style>
