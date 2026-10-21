import { defineStore } from 'pinia'
import type { Resume, Section } from '@/models/types'
import { newResume, migrateResume, SECTION_META } from '@/models/defaults'
import { sampleResume } from '@/models/sample'
import { uid } from '@/models/uid'
import { downloadText, pickTextFile } from '@/models/download'
import { idbGet, idbSet, idbDel } from '@/models/idb'
import type { ParsedResume } from '@/models/importParse'
import { showToast } from '@/stores/toast'

/* ---------- 存储键 ---------- */
/** 旧版 localStorage 键（仅迁移时读取） */
const LS_PREFIX = 'pdfgo.resume.'
const LS_INDEX = 'pdfgo.index'
/** IndexedDB 内的键 */
const K_INDEX = 'index'
const K_PREFIX = 'resume.'

const readLsIndex = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_INDEX) ?? '[]')
  } catch {
    return []
  }
}

/** 已持久化的 JSON 缓存，用于避免无意义的重复写入 */
const persistedCache = new Map<string, string>()

export const useResumeStore = defineStore('resumes', {
  state: () => ({
    map: {} as Record<string, Resume>,
    ready: false,
    /** IndexedDB 不可用（隐私模式等）时为 true —— 数据仅存于内存，会话结束即失 */
    volatile: false,
  }),

  getters: {
    /** 按最近编辑排序 */
    list(state): Resume[] {
      return Object.values(state.map).sort((a, b) => b.updatedAt - a.updatedAt)
    },
  },

  actions: {
    /**
     * 启动加载：IndexedDB 为主存储；首次运行（IDB 无索引）时把旧 localStorage
     * 数据一次性迁移过来。迁移确认写成功后才清掉 localStorage 旧键。
     */
    async init() {
      let ids = await idbGet<string[]>(K_INDEX)
      let fromLs = false
      // IDB 无键或索引为空都翻一遍 localStorage —— 空 index 不该堵死旧数据迁移
      if (!ids?.length) {
        const lsIds = readLsIndex()
        if (lsIds.length) {
          ids = lsIds
          fromLs = true
        }
      }
      ids = ids ?? []

      for (const id of ids) {
        const raw = fromLs ? localStorage.getItem(LS_PREFIX + id) : await idbGet<string>(K_PREFIX + id)
        if (!raw) continue
        try {
          const r = migrateResume(JSON.parse(raw))
          if (r) {
            this.map[r.id] = r
            // 迁移场景严禁预填持久化缓存：数据还在 localStorage，缓存会让 persistAll
            // 误以为已写入 IndexedDB 而跳过，随后 purge 把唯一副本删掉 —— 数据凭空蒸发
            if (!fromLs) persistedCache.set(r.id, JSON.stringify(r))
          }
        } catch {
          /* 单份数据损坏不拖垮全局 */
        }
      }
      if (Object.keys(this.map).length === 0) {
        this.put(sampleResume())
      }
      const persisted = await this.persistAll()
      if (fromLs && !persisted.includes('!')) {
        // IDB 已确认接住数据，旧 localStorage 副本功成身退（两者同生共死，留着只占 5MB 配额）
        for (const id of ids) localStorage.removeItem(LS_PREFIX + id)
        localStorage.removeItem(LS_INDEX)
      }
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

    /** 把文本解析结果落成一份新简历，返回 id */
    putFromParsed(p: ParsedResume, resumeName?: string): string {
      const base = newResume()
      const fields = base.basics.fields
      if (fields[0]) fields[0].value = p.phone
      if (fields[1]) fields[1].value = p.email
      for (const c of p.extraContacts) {
        fields.push({ id: uid(), label: c.label, value: c.value })
      }
      const sections: Section[] = p.sections.map((s) => ({
        id: uid(),
        type: s.type,
        title: s.title,
        visible: true,
        column: SECTION_META[s.type].defaultColumn,
        items: s.items.map((it) => ({
          id: uid(),
          title: it.title,
          subtitle: it.subtitle || undefined,
          dateText: it.dateText || undefined,
          location: it.location || undefined,
          bullets: it.bullets.length ? [...it.bullets] : [''],
        })),
      }))
      const id = this.put({
        name: resumeName || (p.name ? `${p.name}的简历` : '导入的简历'),
        basics: {
          ...base.basics,
          name: p.name,
          headline: p.headline || undefined,
          fields,
        },
        sections,
      })
      return id
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

    async remove(id: string) {
      delete this.map[id]
      persistedCache.delete(id)
      await idbDel(K_PREFIX + id).catch(() => {})
      await this.persistAll()
    },

    /** 全量备份 JSON（手动导出与自动写盘共用一份内容） */
    backupPayload(): string {
      const payload = {
        app: 'pdfgo-resume',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        resumes: Object.values(this.map),
      }
      return JSON.stringify(payload, null, 2)
    },

    backupFilename(): string {
      const d = new Date()
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      return `pdfgo-backup-${stamp}.json`
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
      downloadText(this.backupFilename(), this.backupPayload())
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

    async clearAll() {
      for (const id of Object.keys(this.map)) {
        persistedCache.delete(id)
        await idbDel(K_PREFIX + id).catch(() => {})
      }
      this.map = {}
      await this.persistAll()
    },

    storageBytes(): number {
      let total = 0
      for (const id of Object.keys(this.map)) {
        total += (persistedCache.get(id) ?? JSON.stringify(this.map[id] ?? '')).length * 2
      }
      return total
    },

    /**
     * 全量持久化到 IndexedDB（仅写入有变化的部分），由 App.vue 的防抖监听调用。
     * 返回本轮真正落盘的简历 id 列表（含 index 变化时为空串结尾）；
     * 写入失败返回 ['!']，上层据此跳过自动备份。
     */
    async persistAll(): Promise<string[]> {
      if (this.volatile) return ['!']
      const changed: string[] = []
      for (const r of Object.values(this.map)) {
        const json = JSON.stringify(r)
        if (persistedCache.get(r.id) !== json) {
          try {
            await idbSet(K_PREFIX + r.id, json)
            persistedCache.set(r.id, json)
            changed.push(r.id)
          } catch {
            this.volatile = true
            showToast('本地数据库不可用，本次改动仅保存在内存中，请尽快导出备份', 'error')
            return ['!']
          }
        }
      }
      try {
        await idbSet(K_INDEX, Object.keys(this.map))
      } catch {
        return ['!']
      }
      return changed
    },
  },
})
