/**
 * 文本简历解析器 —— 把用户粘贴的一大段旧简历文本，解析成结构化简历草稿。
 *
 * 纯函数、无依赖、可单测。策略是「行级状态机 + 关键词表 + 日期正则」：
 * 宁可把内容归进可调整的条目，也绝不丢字。识别不了的地方用 warnings 提示，
 * 用户在编辑器里总能手动修正 —— 解析器只需要做到 80 分，剩下 20 分交给纸上直编。
 */
import type { SectionType } from './types'
import { uid } from './uid'

export interface ParsedItem {
  title: string
  subtitle: string
  dateText: string
  location: string
  bullets: string[]
}

export interface ParsedSection {
  type: SectionType
  title: string
  items: ParsedItem[]
}

export interface ParsedContact {
  label: string
  value: string
}

export interface ParsedResume {
  name: string
  headline: string
  phone: string
  email: string
  extraContacts: ParsedContact[]
  sections: ParsedSection[]
  warnings: string[]
}

/* ================================ 正则工具 ================================ */

const RE_PHONE = /(?:\+?86[-\s]?)?1[3-9]\d{9}/
const RE_TEL = /0\d{2,3}[-\s]?\d{7,8}/
const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/

/**
 * 单个日期（完整写法）：2023.06 / 2023年6月15日 / 2023-06 / 2023/06/15 / 2023年 / 2023。
 * 注意内部不含裸连字符分隔（`-` 只出现在 `-\d{1,2}` 月份写法里），
 * 否则 `2019.09 - 2023.06` 的 " - 20" 会被当成第三段日期，把 2023 截成 20。
 */
const DATE_FULL = String
  .raw`\d{4}\s*(?:[年./]\s*\d{1,2}\s*月?(?:\s*[./]\s*\d{1,2}\s*日?)?|-\s*\d{1,2}(?!\d)|[年月./])?`
/** 日期区间整体（优先于单日期尝试）：A - B / A 至 B / A 到 B */
const RE_DATE_RANGE = new RegExp(
  `${DATE_FULL}\\s*(?:[-–—~→]|至|到)\\s*(?:${DATE_FULL}|\\d{4}|至今|现在|present|now|应届)`,
  'i',
)
/** 任意日期（区间优先） */
const RE_DATE_ANY = new RegExp(`(?:${RE_DATE_RANGE.source}|${DATE_FULL}|\\d{4})`, 'i')
/** 整行就是一个日期 */
const SOLO_DATE_RE = new RegExp(`^(?:${RE_DATE_RANGE.source}|${DATE_FULL}|\\d{4})$`, 'i')

/** 条目符号：- • · ● ◦ ▪ * 1. ① 等 */
const RE_BULLET = /^(?:[-–—•·●◦▪*○□■+]|[①-⑳]|\d{1,2}[.、)）])\s*/
/** 分隔符：竖线 / 中点 / 两个以上空格 */
const RE_SPLIT = /\s*[|｜]\s*|\s*[・·]\s*|\s{2,}|\t+/
/** 句读（出现即视为正文而非条目头） */
const RE_PROSE = /[。，；！？,;!?]/
/** 分隔线：--- === *** 等 */
const RE_RULE = /^[-=_*•·—─\s]{3,}$/

/* ============================ 分区标题关键词表 ============================ */

const SECTION_KEYWORDS: { re: RegExp; type: SectionType }[] = [
  { re: /^(教育|教育背景|教育经历|学历|学业)/, type: 'education' },
  { re: /^(工作经历|工作经验|职业经历|任职经历|从业经历|工作历程)/, type: 'work' },
  { re: /^(实习经历|实习经验|实习实践|实习)/, type: 'work' },
  { re: /^(项目经历|项目经验|项目实践|个人项目|开源项目|项目)/, type: 'project' },
  { re: /^(专业技能|技能特长|核心技能|职业技能|IT技能|技术栈|技能)/, type: 'skill' },
  { re: /^(自我评价|个人评价|自我介绍|关于我|个人简介|个人优势)/, type: 'custom' },
  { re: /^(获奖|奖项|获奖情况|荣誉|所获荣誉|荣誉奖项|证书|资格证书|技能证书)/, type: 'custom' },
  { re: /^(校园经历|社会实践|社团经历|志愿者|学生工作|课外活动)/, type: 'custom' },
  { re: /^(作品|作品集|代表作品|开源|兴趣|兴趣爱好|其他|附加信息)/, type: 'custom' },
]

const RE_FAKE_HEADER = /^(个人简历|简历|resume|curriculum vitae)$/i

/**
 * 剥掉标题行的装饰：`【教育背景】` `■ 工作经历` `01. 教育背景` `教育背景：` `-- 教育背景 --`
 * 返回 null 表示这不是一行候选标题（太长 / 有句读 / 有日期）。
 */
function stripHeaderDecor(line: string): string | null {
  let t = line.trim()
  if (!t || t.length > 16) return null
  if (RE_DATE_RANGE.test(t)) return null
  if (RE_PROSE.test(t)) return null
  t = t
    .replace(/^[【\[（(]\s*/, '')
    .replace(/\s*[】\]）)]$/, '')
    .replace(/^(?:[#!*•·●◦▪○□■+\-–—=|]|\d{1,2}[.、)）]|[①-⑳])+\s*/, '')
    .replace(/\s*(?:[#!*•·●◦▪○□■+\-–—=|])+$/, '')
    .replace(/[：:]\s*$/, '')
    .trim()
  if (!t || t.length > 14) return null
  return t
}

function matchSectionType(title: string): SectionType | null {
  for (const { re, type } of SECTION_KEYWORDS) {
    if (re.test(title)) return type
  }
  return null
}

/** 判定一行是否分区标题；是则返回该行应显示的标题文本 */
function asSectionHeader(line: string): string | null {
  const t = stripHeaderDecor(line)
  if (!t || RE_FAKE_HEADER.test(t)) return null
  // 显式关键词命中（允许「教育培训经历」这类带尾巴的写法）
  if (matchSectionType(t)) return t
  // 【xxx】/ 独立「xxx：」形式的短行也视为自定义标题
  const decorated = /^\s*[【\[#]/.test(line) || /[：:]\s*$/.test(line)
  if (decorated && t.length >= 2 && t.length <= 12 && !/\d/.test(t)) return t
  return null
}

/* ============================== 联系方式提取 ============================== */

const CONTACT_LABELS: { re: RegExp; key: 'phone' | 'email' | 'extra' }[] = [
  { re: /^(电话|手机|联系方式|tel|phone|mobile)[：:]?\s*/i, key: 'phone' },
  { re: /^(邮箱|电子邮件|email|e-mail|mail)[：:]?\s*/i, key: 'email' },
  {
    re: /^(github|gitee|码云|博客|blog|主页|个人主页|个人网站|网站|homepage|site|领英|linkedin|微信|wechat)[：:]?\s*/i,
    key: 'extra',
  },
]

const EXTRA_LABEL_MAP: { re: RegExp; label: string }[] = [
  { re: /^(github|gitee|码云)/i, label: 'GitHub' },
  { re: /^(博客|blog)/i, label: '博客' },
  { re: /^(个人主页|主页|个人网站|网站|homepage|site)/i, label: '主页' },
  { re: /^(领英|linkedin)/i, label: 'LinkedIn' },
  { re: /^(微信|wechat)/i, label: '微信' },
]

/** 尝试从一行提取联系方式；命中返回 true（该行已被消费） */
function tryExtractContact(
  line: string,
  top: boolean,
  out: { phone: string; email: string; extra: ParsedContact[] },
): boolean {
  const m = line.match(/^([^：:]{1,8})[：:]\s*(.+)$/)
  if (m) {
    const label = m[1].trim()
    const value = m[2].trim()
    for (const { re, key } of CONTACT_LABELS) {
      if (re.test(label) && value) {
        if (key === 'phone' && !out.phone) out.phone = value.replace(/^\+?86[-\s]?/, '')
        else if (key === 'email' && !out.email) out.email = value
        else if (key === 'extra') {
          const known = EXTRA_LABEL_MAP.find((e) => e.re.test(label))
          out.extra.push({ label: known?.label ?? label, value })
        }
        return true
      }
    }
    // 「求职意向 / 应聘岗位 / 意向岗位」当作 headline，由调用方处理
    if (top && /^(求职意向|应聘岗位|意向岗位|目标职位|求职状态)[：:]?/i.test(label)) return false
  }
  if (!top) return false
  // 裸手机号 / 邮箱 / 链接
  if (!out.phone && RE_PHONE.test(line) && line.length <= 24 && !RE_EMAIL.test(line)) {
    out.phone = line.match(RE_PHONE)![0].replace(/^\+?86[-\s]?/, '')
    return true
  }
  if (!out.email && RE_EMAIL.test(line)) {
    out.email = line.match(RE_EMAIL)![0]
    return true
  }
  return false
}

/* ================================ 条目解析 ================================ */

interface ItemDraft extends ParsedItem {}

function emptyItem(): ItemDraft {
  return { title: '', subtitle: '', dateText: '', location: '', bullets: [] }
}

function normalizeBullets(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** 从行中拆出日期与剩余部分；纯年份数字 + 大段正文不算日期（那是 bullet 里的数字） */
function splitDate(line: string): { dateText: string; parts: string[] } | null {
  const m = line.match(RE_DATE_ANY)
  if (!m) return null
  const idx = m.index ?? 0
  const before = line.slice(0, idx)
  const after = line.slice(idx + m[0].length)
  const dateText = m[0].replace(/\s+/g, ' ').trim()
  const rest = `${before} ${after}`.trim()
  if (/^\d{4}$/.test(dateText) && rest.length > 16) return null
  if (!rest) return { dateText, parts: [] }
  let parts = rest.split(RE_SPLIT).map(cleanPart).filter(Boolean)
  if (parts.length === 1) {
    const oneSpace = splitOrgRole(parts[0])
    if (oneSpace) parts = oneSpace
  }
  return { dateText, parts }
}

/** 机构后缀特征：命中则倾向判定为条目头（公司/学校/组织名） */
const RE_ORG_SUFFIX =
  /(公司|大学|学院|学校|科技|集团|银行|研究院|研究所|事务所|医院|工作室|厂| Limited| Inc\.?| Corp\.?| University| Group)$/i
/** 职位特征：机构名认不出时，后段像职位也可判定为「机构 + 职位」结构 */
const RE_ROLE =
  /工程师|经理|主管|专员|助理|实习生?|开发|设计|运营|产品|总监|架构师|分析师|顾问|管培生|负责人|合伙人|编辑|翻译|记者|教师|医生|护士/

/** 「A B」单空格结构是否可切成两段（首段像机构 或 次段像职位） */
function splitOrgRole(text: string): [string, string] | null {
  const m = text.match(/^(\S+)\s+(\S.{0,30})$/)
  if (m && (RE_ORG_SUFFIX.test(m[1]) || RE_ROLE.test(m[2]))) return [m[1], m[2].trim()]
  return null
}

/** 清理切出来的片段：压缩空白、剥掉粘在头尾的分隔符 */
function cleanPart(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[|｜・·]\s*/, '')
    .replace(/\s*[|｜・·]+$/, '')
    .trim()
}

/**
 * 无日期行是否为条目头：含分隔符的短行（`项目A | 负责人`），或「机构名 + 职位」结构。
 */
function asItemHeader(line: string): string[] | null {
  const t = line.trim()
  if (!t || t.length > 48 || RE_PROSE.test(t)) return null
  if (RE_BULLET.test(t)) return null
  if (RE_SPLIT.test(t)) {
    const parts = t.split(RE_SPLIT).map(cleanPart).filter(Boolean)
    if (parts.length >= 2) return parts
  }
  // 单空格分隔、首段像机构名（或次段像职位）：`字节跳动 后端开发工程师`
  const oneSpace = splitOrgRole(t)
  if (oneSpace) return oneSpace
  return null
}

/* ================================ 主解析器 ================================ */

export function parseResumeText(rawText: string): ParsedResume {
  const warnings: string[] = []
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter((l) => l && !RE_RULE.test(l))

  const out = { phone: '', email: '', extra: [] as ParsedContact[] }
  let name = ''
  let headline = ''

  // —— 第一遍：顶部信息（联系方式 / 姓名 / 求职意向），只看前 12 行 ——
  // 未被消费的短行（「男 | 25岁 | 本科」这类基本信息碎片）先缓存进 preamble：
  // 若后续识别出真实分区标题则丢弃，否则并回正文，避免凭空捏造「待整理」分区。
  const preamble: string[] = []
  const bodyStart = (() => {
    let i = 0
    for (; i < Math.min(lines.length, 12); i++) {
      const line = lines[i]
      // 求职意向
      const hm = line.match(/^(?:求职意向|应聘岗位|意向岗位|目标职位)[：:]\s*(.+)$/)
      if (hm) {
        headline = hm[1].trim()
        continue
      }
      // 姓名：label 形式
      const nm = line.match(/^姓名[：:]\s*(\S{1,20})$/)
      if (nm) {
        name = nm[1].trim()
        continue
      }
      if (tryExtractContact(line, true, out)) continue
      // 顶部信息区结束（遇到分区标题或长正文）
      if (asSectionHeader(line)) break
      if (line.length > 24) break
      // 姓名：独立短行（2-4 汉字 / 两词英文名），排除「个人简历」这类大标题与分区关键词
      if (!name) {
        const cn = line.match(/^([\u4e00-\u9fa5]{2,4})$/)
        const en = line.match(/^([A-Za-z][a-z]+(?:[-' ][A-Za-z][a-z]+)+)$/)
        const strip = line.match(/^(.{1,20}?)(?:的(?:个人)?简历|[-–—|]\s*简历|个人简历)$/)
        const cand = strip ? strip[1].trim() : cn ? cn[1] : en ? en[1] : ''
        if (cand && !RE_FAKE_HEADER.test(cand) && !matchSectionType(cand) && !RE_PROSE.test(line)) {
          name = cand
          continue
        }
      }
      preamble.push(line)
    }
    return i
  })()

  // —— 第二遍：分区与条目 ——
  const sections: ParsedSection[] = []
  let cur: { type: SectionType; title: string; items: ItemDraft[] } | null = null
  let curItem: ItemDraft | null = null
  let pendingDate = ''
  let orphanCount = 0
  let foundRealSection = false
  let summaryUsed = false

  const ensureSection = (title: string, type: SectionType) => {
    cur = { type, title, items: [] }
    curItem = null
    pendingDate = ''
    if (title !== '待整理') foundRealSection = true
    else summaryUsed = true
    sections.push(cur as (typeof sections)[number])
  }

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i]

    const header = asSectionHeader(line)
    if (header) {
      ensureSection(header, matchSectionType(header) ?? 'custom')
      continue
    }

    if (!cur) {
      // 标题前的游离内容：并入一个「待整理」分区（warning 待循环结束后按实际情况提示）
      ensureSection('待整理', 'custom')
    }

    // 带日期的条目头；整行只有日期时挂起（pendingDate），与下一行内容合并
    const sd = splitDate(line)
    if (sd) {
      if (sd.parts.length === 0) {
        pendingDate = pendingDate ? `${pendingDate} · ${sd.dateText}` : sd.dateText
        continue
      }
      curItem = emptyItem()
      curItem.dateText = pendingDate ? `${pendingDate} · ${sd.dateText}` : sd.dateText
      curItem.title = sd.parts[0] ?? ''
      curItem.subtitle = sd.parts[1] ?? ''
      curItem.location = sd.parts.slice(2).join(' · ')
      pendingDate = ''
      cur!.items.push(curItem)
      continue
    }

    // 无符号条目头（`开源项目 Redis-Shake | 个人维护者`）
    const parts = asItemHeader(line)
    if (parts) {
      curItem = emptyItem()
      curItem.title = parts[0]
      curItem.subtitle = parts[1] ?? ''
      curItem.location = parts.slice(2).join(' · ')
      if (pendingDate) {
        curItem.dateText = pendingDate
        pendingDate = ''
      }
      cur!.items.push(curItem)
      continue
    }

    // bullet（剥掉符号）。item 先入 items 再填内容 —— 内容必然随后跟至少一条
    let bullet = normalizeBullets(line.replace(RE_BULLET, ''))
    if (!bullet) continue
    if (!curItem) {
      curItem = emptyItem()
      if (pendingDate) {
        // 单独日期行之后的首行内容提升为条目标题
        curItem.dateText = pendingDate
        curItem.title = bullet
        pendingDate = ''
        cur!.items.push(curItem)
        continue
      }
      cur!.items.push(curItem)
      orphanCount++
    }
    curItem.bullets.push(bullet)
  }

  // 空分区与空 item 清理
  let cleanSections = sections
    .map((s) => ({
      type: s.type,
      title: s.title,
      items: s.items.filter((it) => it.title || it.subtitle || it.bullets.length),
    }))
    .filter((s) => s.items.length > 0)

  if (!foundRealSection) {
    // 全文没有分区标题：把顶部碎片与正文统一并进「待整理」，不丢字
    if (summaryUsed || preamble.length) {
      let target = sections.find((s) => s.title === '待整理')
      if (!target) {
        target = { type: 'custom', title: '待整理', items: [] }
        sections.push(target)
      }
      if (preamble.length) {
        target.items.unshift({ ...emptyItem(), title: '', bullets: [...preamble] })
      }
      cleanSections = sections
        .map((s) => ({
          type: s.type,
          title: s.title,
          items: s.items.filter((it) => it.title || it.subtitle || it.bullets.length),
        }))
        .filter((s) => s.items.length > 0)
      warnings.push('未能识别出分区标题，内容已放入「待整理」，请在编辑器中手动调整')
    }
  }

  if (!name) warnings.push('未识别到姓名，请补填')
  if (!out.phone) warnings.push('未识别到电话，请补填')
  if (!out.email) warnings.push('未识别到邮箱，请补填')
  if (orphanCount > 2) warnings.push('部分内容未按条目分组，建议在编辑器中检查归属')

  return {
    name,
    headline,
    phone: out.phone,
    email: out.email,
    extraContacts: out.extra,
    sections: cleanSections,
    warnings,
  }
}
