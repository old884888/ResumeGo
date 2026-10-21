import type { Density, MarginSize, Resume, Section, SectionType, TemplateKey } from './types'
import { uid } from './uid'

export const SECTION_META: Record<
  SectionType,
  { label: string; defaultTitle: string; defaultColumn: 'main' | 'side' }
> = {
  education: { label: '教育背景', defaultTitle: '教育背景', defaultColumn: 'main' },
  work: { label: '工作经历', defaultTitle: '工作经历', defaultColumn: 'main' },
  project: { label: '项目经历', defaultTitle: '项目经历', defaultColumn: 'main' },
  skill: { label: '专业技能', defaultTitle: '专业技能', defaultColumn: 'side' },
  custom: { label: '自定义分区', defaultTitle: '自定义', defaultColumn: 'side' },
}

export const TEMPLATE_META: { key: TemplateKey; label: string; desc: string }[] = [
  { key: 'classic', label: '经典', desc: '单栏 · 横线分区' },
  { key: 'modern', label: '现代', desc: '单栏 · 主题色强调' },
  { key: 'twocolumn', label: '双栏', desc: '侧栏 + 主栏' },
]

export const ACCENTS = [
  '#1D4ED8',
  '#1D1D1F',
  '#15803D',
  '#B91C1C',
  '#6D28D9',
  '#C2410C',
  '#0E7490',
  '#A16207',
]

export const DEFAULT_STYLE = {
  template: 'classic' as TemplateKey,
  accent: ACCENTS[0],
  fontFamily: 'sans' as const,
  density: 'normal' as Density,
  margin: 'normal' as MarginSize,
  showPhoto: true,
  showIcons: true,
}

export function newSection(type: SectionType): Section {
  const meta = SECTION_META[type]
  return {
    id: uid(),
    type,
    title: meta.defaultTitle,
    visible: true,
    column: meta.defaultColumn,
    items: [],
  }
}

export function newItem() {
  return {
    id: uid(),
    title: '',
    subtitle: '',
    dateText: '',
    location: '',
    bullets: [''],
  }
}

export function newResume(name = '未命名简历'): Resume {
  const now = Date.now()
  return {
    id: uid(),
    schemaVersion: 1,
    name,
    createdAt: now,
    updatedAt: now,
    basics: {
      name: '',
      headline: '',
      fields: [
        { id: uid(), label: '电话', value: '' },
        { id: uid(), label: '邮箱', value: '' },
      ],
    },
    sections: [newSection('education'), newSection('work'), newSection('project'), newSection('skill')],
    style: { ...DEFAULT_STYLE },
  }
}

/** 兼容旧数据：补齐缺失字段 */
export function migrateResume(raw: unknown): Resume | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!r.basics || !Array.isArray(r.sections)) return null
  const base = newResume()
  const merged = {
    ...base,
    ...(r as object),
    basics: {
      ...base.basics,
      ...(r.basics as object),
    },
    style: {
      ...DEFAULT_STYLE,
      ...((r.style as object) ?? {}),
    },
    schemaVersion: 1 as const,
  }
  return merged as unknown as Resume
}
