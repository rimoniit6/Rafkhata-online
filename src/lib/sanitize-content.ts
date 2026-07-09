'use client'

export function sanitizeContent(text: string): string {
  if (!text) return ''

  let result = text

  // ── Remove rawmath artifacts ──
  result = result.replace(/raw_?math/gi, '')

  // ── Remove broken/malformed MathML wrappers ──
  result = result.replace(/<\/?rawmath\b[^>]*>/gi, '')

  // ── Remove empty LaTeX delimiters (BEFORE balancing, to avoid false counts) ──
  result = result.replace(/\$\$\s*\$\$/g, '')
  result = result.replace(/\$\s*\$/g, '')

  // ── Balance $ and $$ delimiters (treat $$ as atomic unit) ──
  const lines = result.split('\n')
  result = lines.map(line => {
    let fixed = ''
    let dollarBalance = 0  // 0 = expecting opener, 1 = expecting closer
    for (let i = 0; i < line.length; i++) {
      // Check for $$ as atomic unit first
      if (line[i] === '$' && i + 1 < line.length && line[i + 1] === '$') {
        if (dollarBalance === 0) {
          // Opening $$
          fixed += '$$'
          dollarBalance = 1
        } else {
          // Closing $$
          fixed += '$$'
          dollarBalance = 0
        }
        i++ // skip second $
        continue
      }
      if (line[i] === '$') {
        if (dollarBalance === 0) {
          // Opening $
          dollarBalance = 1
        } else {
          // Closing $
          fixed += '$'
          dollarBalance = 0
        }
        continue
      }
      fixed += line[i]
    }
    // If unbalanced, remove the last opener
    if (dollarBalance !== 0) {
      const lastOpen = fixed.lastIndexOf('$$')
      if (lastOpen !== -1) {
        fixed = fixed.slice(0, lastOpen) + fixed.slice(lastOpen + 2)
      } else {
        const lastSingle = fixed.lastIndexOf('$')
        if (lastSingle !== -1) {
          fixed = fixed.slice(0, lastSingle) + fixed.slice(lastSingle + 1)
        }
      }
    }
    return fixed
  }).join('\n')

  // ── Remove empty LaTeX delimiters ──
  result = result.replace(/\$\$\s*\$\$/g, '')
  result = result.replace(/\$\s*\$/g, '')

  return result
}
