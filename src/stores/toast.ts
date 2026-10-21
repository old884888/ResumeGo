/** 轻量 toast 总线（不依赖组件实例） */
type ToastKind = 'info' | 'success' | 'error'
export interface ToastItem {
  id: number
  msg: string
  kind: ToastKind
}

import { reactive } from 'vue'

export const toastState = reactive<{ list: ToastItem[] }>({ list: [] })
let seq = 0

export function showToast(msg: string, kind: ToastKind = 'success') {
  const id = ++seq
  toastState.list.push({ id, msg, kind })
  setTimeout(() => {
    const i = toastState.list.findIndex((t) => t.id === id)
    if (i >= 0) toastState.list.splice(i, 1)
  }, 3000)
}
