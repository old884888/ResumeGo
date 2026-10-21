import { describe, expect, it } from 'vitest'
import { backupHintDue } from '../prefs'

const DAY = 86_400_000
// 固定"现在"，避免测试依赖真实时钟
const NOW = 1_800_000_000_000

describe('backupHintDue · 备份提醒规则', () => {
  it('从未备份 + 简历存在超过 3 天 → 提醒', () => {
    expect(backupHintDue(0, 0, NOW - DAY, NOW - 10 * DAY, NOW)).toBe(true)
  })

  it('从未备份 + createdAt 与 updatedAt 相同（迁移数据）→ 也提醒', () => {
    const t = NOW - 10 * DAY
    expect(backupHintDue(0, 0, t, t, NOW)).toBe(true)
  })

  it('简历创建未满 3 天（刚上手）→ 不打扰', () => {
    expect(backupHintDue(0, 0, NOW - DAY, NOW - 2 * DAY, NOW)).toBe(false)
  })

  it('已备份 + 备份后无新改动 → 不提醒', () => {
    expect(backupHintDue(NOW - 10 * DAY, 0, NOW - 11 * DAY, NOW - 20 * DAY, NOW)).toBe(false)
  })

  it('已备份 + 备份后 3 天内无改动 → 不打扰', () => {
    expect(backupHintDue(NOW - 2 * DAY, 0, NOW - DAY, NOW - 20 * DAY, NOW)).toBe(false)
  })

  it('已备份 + 备份后有新改动且超过 3 天 → 提醒', () => {
    expect(backupHintDue(NOW - 10 * DAY, 0, NOW - 5 * DAY, NOW - 20 * DAY, NOW)).toBe(true)
  })

  it('点掉提醒后无新编辑 → 保持安静', () => {
    const t = NOW - 10 * DAY
    expect(backupHintDue(0, NOW - HOUR(), t, t, NOW)).toBe(false)
  })

  it('点掉提醒后又编辑了 → 再次提醒', () => {
    const t = NOW - 10 * DAY
    expect(backupHintDue(0, t - DAY, t + DAY, t, NOW)).toBe(true)
  })

  it('没有任何简历 → 不提醒', () => {
    expect(backupHintDue(0, 0, 0, 0, NOW)).toBe(false)
  })
})

function HOUR() {
  return 3_600_000
}
