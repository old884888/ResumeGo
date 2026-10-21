/** 核心数据模型 —— 与《产品设计文档》§5 保持一致 */

export type SectionType = 'education' | 'work' | 'project' | 'skill' | 'custom'
export type Column = 'main' | 'side'
export type TemplateKey = 'classic' | 'modern' | 'twocolumn'
export type Density = 'compact' | 'normal' | 'relaxed'
export type MarginSize = 'narrow' | 'normal' | 'wide'
export type FontFamily = 'sans' | 'serif'

export interface KV {
  id: string
  label: string
  value: string
}

export interface ItemLink {
  label: string
  url: string
}

export interface Item {
  id: string
  title: string
  subtitle?: string
  dateText?: string
  location?: string
  bullets: string[]
  link?: ItemLink
}

export interface Section {
  id: string
  type: SectionType
  title: string
  visible: boolean
  column: Column
  items: Item[]
}

export interface Basics {
  name: string
  headline?: string
  photo?: string
  fields: KV[]
}

export interface ResumeStyle {
  template: TemplateKey
  accent: string
  fontFamily: FontFamily
  density: Density
  margin: MarginSize
  showPhoto: boolean
  showIcons: boolean
}

export interface Resume {
  id: string
  schemaVersion: 1
  name: string
  createdAt: number
  updatedAt: number
  basics: Basics
  sections: Section[]
  style: ResumeStyle
}

/** AI 预留接口（本版本不实现）—— 见文档 §6.5 */
export interface ResumeContext {
  sectionType?: SectionType
  itemTitle?: string
}

export interface Suggestion {
  original: string
  polished: string
  reason?: string
}

export interface AiService {
  polishBullet(text: string, ctx: ResumeContext): Promise<string>
  optimizeForJD(resume: Resume, jd: string): Promise<Suggestion[]>
  generateSummary(resume: Resume): Promise<string>
}
