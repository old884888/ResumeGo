import { defineStore } from 'pinia'

export type ThemeMode = 'system' | 'light' | 'dark'

const LS_PREFS = 'pdfgo.prefs'

export interface PrefsState {
  theme: ThemeMode
  printHintSeen: boolean
  inlineEdit: boolean
  /** 上次备份时间戳（手动导出或自动备份成功都会更新）；0 = 从未 */
  lastBackupAt: number
  /** 上次点掉备份提醒的时间戳；0 = 从未 */
  backupHintDismissedAt: number
}

function readPrefs(): PrefsState {
  const fallback: PrefsState = {
    theme: 'system',
    printHintSeen: false,
    inlineEdit: true,
    lastBackupAt: 0,
    backupHintDismissedAt: 0,
  }
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PREFS) ?? '{}')
    return {
      theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
      printHintSeen: Boolean(raw.printHintSeen),
      inlineEdit: raw.inlineEdit !== false,
      lastBackupAt: Number(raw.lastBackupAt) || 0,
      backupHintDismissedAt: Number(raw.backupHintDismissedAt) || 0,
    }
  } catch {
    return fallback
  }
}

const DAY = 86_400_000

/**
 * 是否该显示「该备份了」提醒（纯函数，可单测）：
 * - 距备份基线已过 3 天（从未备份时以最早一份简历的创建时间为基线，刚上手不打扰）
 * - 已备份过：只有产生新改动（latestUpdatedAt 晚于上次备份）才再次提醒
 *   从未备份：简历存在即提醒 —— 数据躺在没备份的地方本身就是风险
 * - 点掉提醒后没有产生新的编辑则保持安静
 */
export function backupHintDue(
  lastBackupAt: number,
  dismissedAt: number,
  latestUpdatedAt: number,
  earliestCreatedAt: number,
  now = Date.now(),
): boolean {
  if (!latestUpdatedAt) return false
  const baseline = lastBackupAt > 0 ? lastBackupAt : earliestCreatedAt
  if (!baseline) return false
  if (now - baseline < 3 * DAY) return false
  if (lastBackupAt > 0 && latestUpdatedAt <= baseline) return false
  if (dismissedAt > 0 && dismissedAt >= latestUpdatedAt) return false
  return true
}

export const usePrefsStore = defineStore('prefs', {
  state: () => readPrefs(),

  getters: {
    /** 距上次备份的天数（向上取整；从未备份返回 null） */
    daysSinceBackup(state): number | null {
      if (!state.lastBackupAt) return null
      return Math.max(0, Math.floor((Date.now() - state.lastBackupAt) / DAY))
    },
  },

  actions: {
    applyTheme() {
      const dark =
        this.theme === 'dark' ||
        (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    },

    setTheme(mode: ThemeMode) {
      this.theme = mode
      this.persist()
      this.applyTheme()
    },

    setPrintHintSeen() {
      this.printHintSeen = true
      this.persist()
    },

    setInlineEdit(v: boolean) {
      this.inlineEdit = v
      this.persist()
    },

    markBackedUp() {
      this.lastBackupAt = Date.now()
      this.persist()
    },

    dismissBackupHint() {
      this.backupHintDismissedAt = Date.now()
      this.persist()
    },

    persist() {
      localStorage.setItem(
        LS_PREFS,
        JSON.stringify({
          theme: this.theme,
          printHintSeen: this.printHintSeen,
          inlineEdit: this.inlineEdit,
          lastBackupAt: this.lastBackupAt,
          backupHintDismissedAt: this.backupHintDismissedAt,
        }),
      )
    },

    initSystemListener() {
      this.applyTheme()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') this.applyTheme()
      })
    },
  },
})
