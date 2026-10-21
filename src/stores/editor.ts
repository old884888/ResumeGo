import { defineStore } from 'pinia'

/** 当前编辑会话状态：活动简历 + 自动保存指示（undo 栈在 composable 中维护） */
export const useEditorStore = defineStore('editor', {
  state: () => ({
    activeId: null as string | null,
    saveState: 'saved' as 'saved' | 'pending',
  }),

  actions: {
    open(id: string) {
      this.activeId = id
      this.saveState = 'saved'
    },
    close() {
      this.activeId = null
    },
  },
})
