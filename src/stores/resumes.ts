import { defineStore } from 'pinia'
import type { Resume } from '@/models/types'
import { newResume, migrateResume } from '@/models/defaults'
import { sampleResume } from '@/models/sample'
import { uid } from '@/models/uid'
import { downloadText, pickTextFile } from '@/models/download'
import { showToast } from '@/stores/toast'

const LS_PREFIX = 'pdfgo.resume.'
const LS_INDEX = 'pdfgo.index'

/** 已持久化的 JSON 缓存，用于避免无意义的重复写入 */
const persistedCache = new Map<string, string>()

export const useResumeStore = defineStore('resumes', {
  state: () => ({
    map: {} as Record<string, Resume>,
    ready: false,
  }),

  getters: {
    /** 按最近编辑排序 */
    list(state): Resume[] {
      return Object.values(state.map).sort((a, b) => b.updatedAt - a.updatedAt)
    },
  },

  actions: {
    init() {
      let ids: string[] = []
      try {
        ids = JSON.parse(localStorage.getItem(LS_INDEX) ?? '[]')
      } catch {
        ids = []
      }
      for (const id of ids) {
        const raw = localStorage.getItem(LS_PREFIX + id)
        if (!raw) continue
        try {
          const r = migrateResume(JSON.parse(raw))
          if (r) {
            this.map[r.id] = r
            persistedCache.set(r.id, JSON.stringify(r))
          }
        } catch {
          /* 单份数据损坏不拖垮全局 */
        }
      }
      if (Object.keys(this.map).length === 0) {
        this.put(sampleResume())
      }
      this.persistAll()
      this.ready = true
    },

    /** 放入一份简历（新建/导入/示例），返回 id */
    put(data?: Partial<Resume>): string {
      const base = newResume()
      const r: Resume = {
        ...base,
        ...(data ?? {}),
        id: uid(),
        schemaVersion: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.map[r.id] = r
      return r.id
    },

    duplicate(id: string): string | null {
      const src = this.map[id]
      if (!src) return null
      const copy: Resume = JSON.parse(JSON.stringify(src))
      copy.id = uid()
      copy.name = `${src.name} 副本`
      copy.createdAt = Date.now()
      copy.updatedAt = Date.now()
      this.map[copy.id] = copy
      return copy.id
    },

    remove(id: string) {
      delete this.map[id]
      localStorage.removeItem(LS_PREFIX + id)
      persistedCache.delete(id)
      this.writeIndex()
    },

    exportOne(id: string) {
      const r = this.map[id]
      if (!r) return
      downloadText(`${r.name || '简历'}.json`, JSON.stringify(r, null, 2))
      showToast('已导出 JSON 文件')
    },

    async importOne(): Promise<boolean> {
      const text = await pickTextFile()
      if (!text) return false
      try {
        const r = migrateResume(JSON.parse(text))
        if (!r) throw new Error('bad format')
        if (r.name) r.name = r.name.replace(/\s*副本$/, '')
        this.put(r)
        showToast('导入成功')
        return true
      } catch {
        showToast('导入失败：不是有效的简历文件', 'error')
        return false
      }
    },

    exportAll() {
      const payload = {
        app: 'pdfgo-resume',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        resumes: Object.values(this.map),
      }
      const d = new Date()
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      downloadText(`pdfgo-backup-${stamp}.json`, JSON.stringify(payload, null, 2))
      showToast('已导出全部备份')
    },

    async importAll(): Promise<boolean> {
      const text = await pickTextFile()
      if (!text) return false
      try {
        const data = JSON.parse(text)
        const list: unknown[] = Array.isArray(data) ? data : data.resumes
        if (!Array.isArray(list)) throw new Error('bad format')
        let count = 0
        for (const raw of list) {
          const r = migrateResume(raw)
          if (r) {
            this.put(r)
            count++
          }
        }
        if (!count) throw new Error('empty')
        showToast(`已从备份恢复 ${count} 份简历`)
        return true
      } catch {
        showToast('恢复失败：不是有效的备份文件', 'error')
        return false
      }
    },

    clearAll() {
      for (const id of Object.keys(this.map)) {
        localStorage.removeItem(LS_PREFIX + id)
        persistedCache.delete(id)
      }
      this.map = {}
      this.writeIndex()
    },

    storageBytes(): number {
      let total = 0
      for (const id of Object.keys(this.map)) {
        total += (localStorage.getItem(LS_PREFIX + id) ?? '').length * 2
      }
      return total
    },

    /** 全量持久化（仅写入有变化的部分），由 App.vue 的防抖监听调用 */
    persistAll(): string[] {
      const changed: string[] = []
      for (const r of Object.values(this.map)) {
        const json = JSON.stringify(r)
        if (persistedCache.get(r.id) !== json) {
          persistedCache.set(r.id, json)
          try {
            localStorage.setItem(LS_PREFIX + r.id, json)
            changed.push(r.id)
          } catch {
            showToast('本地存储空间不足，请导出备份后清理旧简历', 'error')
            break
          }
        }
      }
      if (changed.length) this.writeIndex()
      return changed
    },

    writeIndex() {
      localStorage.setItem(LS_INDEX, JSON.stringify(Object.keys(this.map)))
    },
  },
})
