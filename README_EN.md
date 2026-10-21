<div align="center">

# JianBai 简白

**Free · No watermark · Your data never leaves this machine — a local-first resume studio**

*Content & style separated · WYSIWYG · Edit directly on the page · One-click PDF export*

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Storage](https://img.shields.io/badge/Storage-100%25_local-30d158)](#data--privacy)

**[Get started](#getting-started) · [Features](#features) · [Exporting PDF](#exporting-pdf)**

[简体中文](README.md) | [English](README_EN.md)

</div>

---

## Why JianBai

Most resume builders out there: free to edit, paywalled to save, watermarked on export, and your content quietly uploaded to their cloud.

JianBai does the opposite — **everything stays in your own browser**. No account, no membership, no watermark. Open it and there's an A4 page waiting: fill in content on the left, tweak styling on the right, watch it render live in the middle. One click and it's a PDF.

## Features

| | |
|---|---|
| ![Editor](docs/screenshots/editor.png) | ![Home](docs/screenshots/home.png) |
| **Three-pane editor**: content form on the left, live A4 preview in the middle, templates & styling on the right | **Multi-resume manager**: cards with live thumbnail rendering, rename / duplicate / JSON import & export |
| ![Two-column](docs/screenshots/twocolumn.png) | ![Dark](docs/screenshots/dark.png) |
| **Three templates**: Classic / Modern / Two-column (sections can be assigned to the main or side column) | **Dark mode**: follow the system or toggle manually — the paper stays white either way |

### More highlights

- **Paste-to-import**: paste the raw text of an old resume (plain text / Word / PDF / web page — anything), and a fully local parser recognizes your name, contact info, sections and entries. Preview the result, confirm, and start editing
- **Tougher storage**: upgraded to IndexedDB (hundreds of MB to start — photos galore won't hurt); legacy localStorage data is migrated automatically on first run
- **Backup, twice over**: the home page reminds you when it's time to back up (never backed up, or 3+ days of unbacked-up changes); bind a local folder in Settings and every save writes a full backup there automatically via the File System Access API — your data still never leaves this machine
- **Edit on the paper**: click any text on the live preview to edit it in place; select text for a bold toolbar. What you see is what you edit
- **Drag to reorder**: sections and entries with a drop indicator line
- **Dual export channels**: one-click PDF download (no print dialog, no headers/footers, smart A4 pagination that never cuts an entry in half); plus a vector print version (selectable text — friendlier for ATS parsing)
- **Undo & redo**: Ctrl+Z / Ctrl+Shift+Z with a 100-step history
- **Autosave**: saves as you type — refreshing or closing the browser loses nothing
- **Styling system**: 8 accent colors × 2 fonts × 3 density levels × 3 margin widths, freely combinable without losing content

## Getting started

### Option one: use it directly (recommended)

```bash
git clone https://github.com/old884888/ResumeGo.git
```

Open **`dist/index.html`** from the repo — double-click and go. Single file, works offline, nothing to install.

### Option two: local development

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # production build → dist/index.html (single file)
npm run typecheck  # type checking
npm test           # unit tests (parser / backup rules)
```

> Node.js 18+. Chrome / Edge recommended (the auto-backup folder relies on the File System Access API).

## Exporting PDF

**「Export PDF」(main button)**: downloads a PDF directly — no dialog, no headers/footers, content paginated intelligently onto A4 so entries never get sliced in half.

**「Vector print version」(printer icon)**: goes through the browser print pipeline, producing selectable text (friendlier for resume-parsing systems). When printing:

1. Set the destination printer to "Save as PDF"
2. Uncheck "Headers and footers"
3. Set margins to "None"
4. Enable "Background graphics"

## Data & privacy

- Everything is stored **locally in your browser** (IndexedDB) — no server ever sees it
- Bind a local folder in Settings and every save writes a full backup there — even if the browser data gets wiped, the backup survives
- The home page reminds you when a backup is due, one click to export JSON
- Photos are compressed locally on upload
- The built-in sample resume is **entirely fictional** — edit or delete freely
- ⚠️ Without the auto-backup folder bound, clearing your browser data = deleting your resumes. Keep an eye on the backup reminder

## Tech stack

Vue 3.5 · TypeScript · Vite 5 · Pinia · Vue Router · lucide-icons · vitest

> Deliberately no UI component library — the design language (whitespace, frosted glass, restrained motion) is all hand-rolled, for that one bit of fruit-flavored polish.

```
src/
├── models/       # Data models, sample data, rich-text & file utils, IndexedDB, text-import parser
├── stores/       # Pinia: resume collection / editing session / preferences / backup scheduler
├── composables/  # Snapshot-based undo & redo
├── components/
│   ├── preview/  # A4 paper + three templates + on-paper editing
│   ├── editor/   # Three panes: content form / preview / style panel
│   ├── home/     # Home page cards + paste-to-import modal
│   └── ui/       # Hand-rolled components (buttons / segmented controls / switches / modals / menus)
├── pages/        # Home / Editor / Settings
└── styles/       # Design tokens, paper typography, print pipeline
```

---

<div align="center">

**If JianBai saved you some time, a star goes a long way. ⭐**

</div>
