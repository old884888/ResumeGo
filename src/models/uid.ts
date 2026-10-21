/** 轻量 id 生成：优先 crypto.randomUUID，退化到随机串 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
