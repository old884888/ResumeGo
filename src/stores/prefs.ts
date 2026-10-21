import { defineStore } from 'pinia'

export type ThemeMode = 'system' | 'light' | 'dark'

const LS_PREFS = 'pdfgo.prefs'

function readPrefs(): { theme: ThemeMode; printHintSeen: boolean; inlineEdit: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PREFS) ?? '{}')
    return {
      theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
      printHintSeen: Boolean(raw.printHintSeen),
      inlineEdit: raw.inlineEdit !== false,
    }
  } catch {
    return { theme: 'system', printHintSeen: false, inlineEdit: true }
  }
}

export const usePrefsStore = defineStore('prefs', {
  state: () => readPrefs(),

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

    persist() {
      localStorage.setItem(
        LS_PREFS,
        JSON.stringify({
          theme: this.theme,
          printHintSeen: this.printHintSeen,
          inlineEdit: this.inlineEdit,
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
