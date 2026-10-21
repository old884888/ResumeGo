import { ref, watch } from 'vue'

/**
 * 文档级快照撤销/重做。
 * getSnap 返回文档的 JSON 字符串，apply 把快照写回响应式对象。
 * 连续输入 300ms 内合并为一步，上限 100 步。
 */
export function useHistory(
  getSnap: () => string,
  apply: (snap: string) => void,
  onSettle?: () => void,
) {
  let past: string[] = []
  let future: string[] = []
  let last = getSnap()
  let timer: number | undefined
  let lock = false
  const LIMIT = 100

  const canUndo = ref(false)
  const canRedo = ref(false)

  const sync = () => {
    canUndo.value = past.length > 0
    canRedo.value = future.length > 0
  }

  const settle = () => {
    const snap = getSnap()
    if (snap === last) return
    if (last !== '') past.push(last)
    if (past.length > LIMIT) past.shift()
    future = []
    last = snap
    sync()
    onSettle?.()
  }

  const flushPending = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
      settle()
    }
  }

  const undo = () => {
    flushPending()
    if (!past.length) return
    future.push(last)
    const target = past.pop()!
    lock = true
    apply(target)
    last = target
    sync()
  }

  const redo = () => {
    flushPending()
    if (!future.length) return
    past.push(last)
    const target = future.pop()!
    lock = true
    apply(target)
    last = target
    sync()
  }

  const reset = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
    }
    past = []
    future = []
    last = getSnap()
    sync()
  }

  /* 监听文档快照变化，防抖合并为一步 */
  watch(getSnap, (snap) => {
    if (lock) {
      last = snap
      lock = false
      return
    }
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = undefined
      settle()
    }, 300)
  })

  return { undo, redo, reset, canUndo, canRedo }
}
