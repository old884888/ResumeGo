import { defineStore } from 'pinia'
import {
  loadBackupDir,
  pickBackupDir,
  clearBackupDir,
  queryBackupPerm,
  requestBackupPerm,
  writeBackupFile,
  type FsPerm,
} from '@/models/fsBackup'
import { useResumeStore } from './resumes'
import { usePrefsStore } from './prefs'
import { showToast } from './toast'

/**
 * 自动备份调度：绑定文件夹 → 数据变化后防抖写盘。
 * 手动「导出全部」与自动写盘成功都会推进 prefs.lastBackupAt。
 */
export const useBackupStore = defineStore('backup', {
  state: () => ({
    handle: null as FileSystemDirectoryHandle | null,
    name: '',
    perm: 'prompt' as FsPerm,
    /** 自动备份写盘防抖计时器 */
    writing: false,
    lastWriteAt: 0,
    lastOk: true,
  }),

  actions: {
    async init() {
      const dir = await loadBackupDir()
      if (!dir) return
      this.handle = dir.handle
      this.name = dir.name
      this.perm = await queryBackupPerm(dir.handle)
    },

    /** 绑定文件夹（按钮手势内调用）；成功后立即写一次 */
    async bind(): Promise<boolean> {
      const dir = await pickBackupDir()
      if (!dir) return false
      this.handle = dir.handle
      this.name = dir.name
      this.perm = await queryBackupPerm(dir.handle)
      return this.writeNow()
    },

    async unbind() {
      await clearBackupDir()
      this.handle = null
      this.name = ''
      this.perm = 'prompt'
    },

    /** 重新授权（按钮手势内调用） */
    async reauth(): Promise<boolean> {
      if (!this.handle) return false
      this.perm = await requestBackupPerm(this.handle)
      if (this.perm === 'granted') return this.writeNow()
      return false
    },

    /** 数据有变后的入口：防抖 5s 写盘，静默失败不打扰 */
    scheduleWrite() {
      if (!this.handle || this.perm !== 'granted') return
      if (writeTimer) window.clearTimeout(writeTimer)
      writeTimer = window.setTimeout(() => {
        writeTimer = undefined
        void this.writeNow(true)
      }, 5000)
    },

    /** 立即写盘；quiet = 不弹 toast（自动备份不打扰，设置页按钮操作才反馈） */
    async writeNow(quiet = false): Promise<boolean> {
      if (!this.handle) return false
      this.writing = true
      try {
        const perm = await queryBackupPerm(this.handle)
        this.perm = perm
        if (perm !== 'granted') {
          this.lastOk = false
          if (!quiet) showToast('备份文件夹需要重新授权', 'error')
          return false
        }
        const resumes = useResumeStore()
        const ok = await writeBackupFile(this.handle, resumes.backupPayload())
        this.lastOk = ok
        if (ok) {
          this.lastWriteAt = Date.now()
          usePrefsStore().markBackedUp()
          if (!quiet) showToast(`已写入「${this.name}/${'简白备份.json'}」`)
        } else {
          if (!quiet) showToast('写入备份文件夹失败', 'error')
        }
        return ok
      } finally {
        this.writing = false
      }
    },
  },
})

let writeTimer: number | undefined
