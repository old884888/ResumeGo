/** 行内富文本：仅支持 **加粗**，先转义防注入再替换 */
export function richText(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

/** contenteditable 的 innerHTML → markdown 源文本（strong/b 还原为 **） */
export function htmlToMd(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node instanceof HTMLBRElement) return ''
    const inner = Array.from(node.childNodes).map(walk).join('')
    if (node instanceof HTMLElement && (node.tagName === 'STRONG' || node.tagName === 'B')) {
      return inner ? `**${inner}**` : ''
    }
    return inner
  }
  return walk(div)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
