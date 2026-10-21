<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { richText, htmlToMd } from '@/models/rich'
import { EDITABLE_KEY } from '@/injectKeys'

/**
 * 纸上直编通用组件：
 * 编辑模式下渲染为 contenteditable 元素，点击即改、输入即提交；
 * 显示渲染后的富文本（**加粗** → strong），提交时序列化回 markdown 源。
 * 提交策略：每次输入立即提交（聚焦期间 render 守卫防跳光标，
 * undo 历史由全局快照防抖合并，不会碎片化），blur 时强制规整渲染；
 * 中文输入法组合态不提交，组合结束一次性提交。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    tag?: string
    placeholder?: string
  }>(),
  { tag: 'span', placeholder: '' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editable = inject<Ref<boolean>>(EDITABLE_KEY, ref(false))
const el = ref<HTMLElement>()

let composing = false

function render() {
  if (!el.value) return
  if (document.activeElement === el.value) return
  el.value.innerHTML = richText(props.modelValue)
}

function commit() {
  if (!el.value) return
  const md = htmlToMd(el.value.innerHTML)
  if (md !== props.modelValue) emit('update:modelValue', md)
}

onMounted(render)
watch(() => props.modelValue, render)
watch(editable, (v) => {
  if (!v && el.value && document.activeElement === el.value) el.value.blur()
  render()
})

function onInput() {
  if (composing) return
  commit()
}

function onBlur() {
  commit()
  render()
}

function onKeyDown(e: KeyboardEvent) {
  if (composing) return
  if (e.key === 'Enter') {
    e.preventDefault()
    el.value?.blur()
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text.replace(/\s*\n+\s*/g, ' '))
}

function onCompositionStart() {
  composing = true
}

function onCompositionEnd() {
  composing = false
  commit()
}
</script>

<template>
  <component
    :is="tag"
    ref="el"
    class="edt"
    :contenteditable="editable"
    :data-placeholder="placeholder"
    spellcheck="false"
    @input="onInput"
    @blur="onBlur"
    @keydown.enter="onKeyDown"
    @paste="onPaste"
    @compositionstart="onCompositionStart"
    @compositionend="onCompositionEnd"
  />
</template>
