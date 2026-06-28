/**
 * MathML to LaTeX Converter
 *
 * Converts MathML markup to LaTeX notation for rendering with KaTeX.
 * Handles all common MathML elements used in educational content.
 *
 * Usage:
 *   convertMathMLToLatex('<math><mfrac><mn>1</mn><msqrt><mn>2</mn></msqrt></mfrac></math>')
 *   → '\frac{1}{\sqrt{2}}'
 */

// ─── DOM Parser (client-side only) ──────────────────────────────────

function parseMathML(mathmlString: string): Element | null {
  if (typeof DOMParser === 'undefined') return null

  try {
    const parser = new DOMParser()

    // First try XML parsing — this properly preserves MathML element structure
    // including msqrt, mfrac, msub, etc. without HTML parser mangling.
    // Add XML namespace declaration for proper MathML parsing.
    let xmlContent = mathmlString
    if (!xmlContent.includes('xmlns')) {
      xmlContent = xmlContent.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"')
    }
    try {
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml')
      const parseError = xmlDoc.querySelector('parsererror')
      if (!parseError) {
        // Query by local name to handle namespace
        const mathElement = xmlDoc.querySelector('math') || xmlDoc.getElementsByTagName('math')[0]
        if (mathElement) return mathElement
      }
    } catch {
      // XML parsing failed, fall through to HTML parsing
    }

    // Fallback: HTML parsing (may mangle some MathML structures)
    const doc = parser.parseFromString(mathmlString, 'text/html')
    const mathElement = doc.querySelector('math')
    return mathElement
  } catch {
    return null
  }
}

// ─── Text Content Extraction ────────────────────────────────────────

function getTextContent(node: Element): string {
  return node.textContent?.trim() || ''
}

// ─── Main Conversion Function ───────────────────────────────────────

function convertNode(node: Element): string {
  const tag = node.tagName.toLowerCase()

  switch (tag) {
    // ── Root ──
    case 'math':
      return convertChildren(node)

    // ── Grouping ──
    case 'mrow':
      return convertChildren(node)

    case 'mstyle':
      return convertChildren(node)

    case 'semantics':
      return convertChildren(node)

    case 'mpadded':
      return convertChildren(node)

    case 'mphantom':
      return `\\phantom{${convertChildren(node)}}`

    // ── Token Elements ──
    case 'mi': {
      const text = getTextContent(node)
      if (!text) return ''
      // Multi-char identifiers are usually function names
      if (text.length > 1) {
        return `\\mathrm{${text}}`
      }
      // Handle special mathvariant
      const variant = node.getAttribute('mathvariant')
      if (variant === 'normal') {
        return text
      }
      // Single char identifiers are italic by default in LaTeX
      return text
    }

    case 'mn': {
      return getTextContent(node)
    }

    case 'mo': {
      const text = getTextContent(node)
      return convertOperator(text)
    }

    case 'ms': {
      const text = getTextContent(node)
      return `"${text}"`
    }

    case 'mtext': {
      const text = getTextContent(node)
      return `\\text{${text}}`
    }

    case 'mspace': {
      const width = node.getAttribute('width')
      if (width) {
        // Parse width value (e.g., "1em", "0.5em")
        const match = width.match(/^([\d.]+)\s*(em|ex|px|pt)$/)
        if (match) {
          const val = parseFloat(match[1])
          const unit = match[2]
          if (unit === 'em') return `\\quad `.repeat(Math.round(val))
          if (unit === 'ex') return `\\ `.repeat(Math.round(val))
        }
      }
      return '\\ '
    }

    // ── Fractions ──
    case 'mfrac': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const num = convertNode(children[0])
        const den = convertNode(children[1])
        const linethickness = node.getAttribute('linethickness')
        if (linethickness === '0' || linethickness === '0pt') {
          // No line → binomial coefficient style
          return `\\binom{${num}}{${den}}`
        }
        const bevelled = node.getAttribute('bevelled')
        if (bevelled === 'true') {
          return `\\nicefrac{${num}}{${den}}`
        }
        return `\\frac{${num}}{${den}}`
      }
      return convertChildren(node)
    }

    // ── Radicals ──
    case 'msqrt': {
      const content = convertChildren(node)
      return `\\sqrt{${content}}`
    }

    case 'mroot': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const base = convertNode(children[0])
        const index = convertNode(children[1])
        return `\\sqrt[${index}]{${base}}`
      }
      return convertChildren(node)
    }

    // ── Scripts ──
    case 'msup': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const base = convertNode(children[0])
        const sup = convertNode(children[1])
        return `{${base}}^{${sup}}`
      }
      return convertChildren(node)
    }

    case 'msub': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const base = convertNode(children[0])
        const sub = convertNode(children[1])
        return `{${base}}_{${sub}}`
      }
      return convertChildren(node)
    }

    case 'msubsup': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 3) {
        const base = convertNode(children[0])
        const sub = convertNode(children[1])
        const sup = convertNode(children[2])
        return `{${base}}_{${sub}}^{${sup}}`
      }
      return convertChildren(node)
    }

    // ── Under/Over ──
    case 'mover': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const base = convertNode(children[0])
        const over = convertNode(children[1])
        const accent = node.getAttribute('accent')

        // Common over decorations
        if (over === '¯' || over === '‾' || over === '\\mathrm{\\u00AF}') {
          return `\\overline{${base}}`
        }
        if (over === '→' || over === '→' || over === '→') {
          return `\\overrightarrow{${base}}`
        }
        if (over === '←' || over === '←') {
          return `\\overleftarrow{${base}}`
        }
        if (over === '^' || over === 'ˆ') {
          return `\\hat{${base}}`
        }
        if (over === '~' || over === '˜') {
          return `\\tilde{${base}}`
        }
        if (over === '·' || over === '˙') {
          return `\\dot{${base}}`
        }
        if (over === '¨' || over === '˙˙') {
          return `\\ddot{${base}}`
        }

        if (accent === 'true') {
          return `\\overset{${over}}{${base}}`
        }
        return `\\overset{${over}}{${base}}`
      }
      return convertChildren(node)
    }

    case 'munder': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 2) {
        const base = convertNode(children[0])
        const under = convertNode(children[1])
        const accentunder = node.getAttribute('accentunder')

        if (under === '_' || under === '＿') {
          return `\\underline{${base}}`
        }

        if (accentunder === 'true') {
          return `\\underset{${under}}{${base}}`
        }
        return `\\underset{${under}}{${base}}`
      }
      return convertChildren(node)
    }

    case 'munderover': {
      const children = getNonAnnotationChildren(node)
      if (children.length === 3) {
        const base = convertNode(children[0])
        const under = convertNode(children[1])
        const over = convertNode(children[2])
        return `\\underset{${under}}{\\overset{${over}}{${base}}}`
      }
      return convertChildren(node)
    }

    // ── Tables / Matrices ──
    case 'mtable': {
      const rows = getNonAnnotationChildren(node).filter(
        (c) => c.tagName.toLowerCase() === 'mtr' || c.tagName.toLowerCase() === 'mlabeledtr'
      )
      if (rows.length === 0) return ''

      const latexRows = rows.map((row) => {
        const cells = getNonAnnotationChildren(row).filter(
          (c) => c.tagName.toLowerCase() === 'mtd'
        )
        return cells.map((cell) => convertNode(cell)).join(' & ')
      })

      return `\\begin{matrix}${latexRows.join(' \\\\ ')}\\end{matrix}`
    }

    case 'mtr':
    case 'mlabeledtr': {
      // If mtr is encountered outside mtable context
      const cells = getNonAnnotationChildren(node).filter(
        (c) => c.tagName.toLowerCase() === 'mtd'
      )
      return cells.map((cell) => convertNode(cell)).join(' & ')
    }

    case 'mtd': {
      return convertChildren(node)
    }

    // ── Enclose ──
    case 'menclose': {
      const content = convertChildren(node)
      const notation = node.getAttribute('notation') || 'longdiv'

      if (notation.includes('box')) {
        return `\\boxed{${content}}`
      }
      if (notation.includes('circle')) {
        return `\\cancel{${content}}`
      }
      if (notation.includes('longdiv')) {
        return `\\overline{\\smash{${content}}\\,}`
      }
      if (notation.includes('actuarial')) {
        return `\\overline{${content}\\,\\vert}`
      }
      if (notation.includes('radical')) {
        return `\\sqrt{${content}}`
      }
      if (notation.includes('updiagonalstrike') || notation.includes('downdiagonalstrike')) {
        return `\\cancel{${content}}`
      }
      if (notation.includes('horizontalstrike')) {
        return `\\cancel{${content}}`
      }
      // Default fallback
      return `\\boxed{${content}}`
    }

    // ── Multiscripts (prescripts and tensor) ──
    case 'mmultiscripts': {
      const children = getNonAnnotationChildren(node)
      if (children.length < 1) return ''

      const base = convertNode(children[0])
      let result = base

      // Process sub/sup pairs after base
      let i = 1
      const subScripts: string[] = []
      const supScripts: string[] = []

      while (i < children.length) {
        const child = children[i]
        if (child.tagName.toLowerCase() === 'mprescripts') {
          i++
          break
        }
        if (i % 2 === 1) {
          subScripts.push(convertNode(child))
        } else {
          supScripts.push(convertNode(child))
        }
        i++
      }

      // Post-scripts
      if (subScripts.length > 0 || supScripts.length > 0) {
        const sub = subScripts.length > 0 ? subScripts.join('') : ''
        const sup = supScripts.length > 0 ? supScripts.join('') : ''
        if (sub && sup) {
          result = `{${result}}_{${sub}}^{${sup}}`
        } else if (sub) {
          result = `{${result}}_{${sub}}`
        } else if (sup) {
          result = `{${result}}^{${sup}}`
        }
      }

      return result
    }

    // ── Error ──
    case 'merror': {
      const content = convertChildren(node)
      return `\\color{red}{${content}}`
    }

    // ── Action ──
    case 'maction': {
      // Render the selected child (default: first)
      const children = getNonAnnotationChildren(node)
      const selection = parseInt(node.getAttribute('selection') || '1', 10)
      const idx = Math.max(0, Math.min(selection - 1, children.length - 1))
      return children.length > 0 ? convertNode(children[idx]) : ''
    }

    // ── Annotation (skip — not rendered) ──
    case 'annotation':
    case 'annotation-xml':
      return ''

    // ── None (empty placeholder) ──
    case 'none':
      return ''

    // ── Fallback: process children ──
    default: {
      return convertChildren(node)
    }
  }
}

// ─── Helper: Get children excluding annotation elements ──────────────

function getNonAnnotationChildren(node: Element): Element[] {
  return Array.from(node.children).filter((child) => {
    const tag = child.tagName.toLowerCase()
    return tag !== 'annotation' && tag !== 'annotation-xml'
  })
}

// ─── Helper: Convert all children ────────────────────────────────────

function convertChildren(node: Element): string {
  const children = getNonAnnotationChildren(node)
  return children.map((child) => convertNode(child)).join('')
}

// ─── Helper: Convert operator text ───────────────────────────────────

function convertOperator(op: string): string {
  const operatorMap: Record<string, string> = {
    '+': '+',
    '-': '-',
    '−': '-',
    '±': '\\pm ',
    '∓': '\\mp ',
    '×': '\\times ',
    '÷': '\\div ',
    '=': '=',
    '≠': '\\neq ',
    '<': '<',
    '>': '>',
    '≤': '\\leq ',
    '≥': '\\geq ',
    '≪': '\\ll ',
    '≫': '\\gg ',
    '≈': '\\approx ',
    '≅': '\\cong ',
    '≡': '\\equiv ',
    '∼': '\\sim ',
    '≃': '\\simeq ',
    '∝': '\\propto ',
    '∈': '\\in ',
    '∉': '\\notin ',
    '⊂': '\\subset ',
    '⊃': '\\supset ',
    '⊆': '\\subseteq ',
    '⊇': '\\supseteq ',
    '⊄': '\\not\\subset ',
    '∪': '\\cup ',
    '∩': '\\cap ',
    '∅': '\\emptyset ',
    '∀': '\\forall ',
    '∃': '\\exists ',
    '¬': '\\neg ',
    '∧': '\\wedge ',
    '∨': '\\vee ',
    '⇒': '\\Rightarrow ',
    '⇐': '\\Leftarrow ',
    '⇔': '\\Leftrightarrow ',
    '→': '\\rightarrow ',
    '←': '\\leftarrow ',
    '↔': '\\leftrightarrow ',
    '∂': '\\partial ',
    '∞': '\\infty ',
    '∇': '\\nabla ',
    '…': '\\ldots ',
    '⋯': '\\cdots ',
    '⋮': '\\vdots ',
    '⋱': '\\ddots ',
    '∑': '\\sum',
    '∏': '\\prod',
    '∫': '\\int',
    '∬': '\\iint',
    '∭': '\\iiint',
    '∮': '\\oint',
    '√': '\\sqrt',
    '⊥': '\\perp ',
    '∥': '\\parallel ',
    '∠': '\\angle ',
    '°': '^{\\circ}',
    '′': "'",
    '″': "''",
    '‴': "'''",
    '·': '\\cdot ',
    '∘': '\\circ ',
    '⊗': '\\otimes ',
    '⊕': '\\oplus ',
    '⊙': '\\odot ',
    '†': '\\dagger ',
    '‡': '\\ddagger ',
    '|': '|',
    '⌊': '\\lfloor ',
    '⌋': '\\rfloor ',
    '⌈': '\\lceil ',
    '⌉': '\\rceil ',
    '⟨': '\\langle ',
    '⟩': '\\rangle ',
  }

  return operatorMap[op] ?? op
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Convert a MathML string to LaTeX notation.
 *
 * @param mathml - The MathML string (must include <math> root element)
 * @returns LaTeX string, or empty string if conversion fails
 *
 * @example
 * convertMathMLToLatex('<math><mfrac><mn>1</mn><msqrt><mn>2</mn></msqrt></mfrac></math>')
 * // Returns: '\frac{1}{\sqrt{2}}'
 */
export function convertMathMLToLatex(mathml: string): string {
  if (!mathml || typeof DOMParser === 'undefined') return ''

  // Quick check: must contain <math tag
  if (!mathml.includes('<math')) return ''

  try {
    const mathElement = parseMathML(mathml)
    if (!mathElement) return ''

    const latex = convertNode(mathElement)
    return latex.trim()
  } catch (e) {
    console.warn('MathML to LaTeX conversion failed:', e)
    return ''
  }
}

/**
 * Check if a string contains MathML markup.
 */
export function containsMathML(content: string): boolean {
  return /<math[\s>]/i.test(content) ||
    /<(?:mfrac|mrow|mi|mo|mn|msup|msub|msubsup|msqrt|mroot|mover|munder|munderover|mtext|mspace|mtable|mtr|mtd|mlabeledtr|mstyle|mpadded|mphantom|menclose|merror|maction|mmultiscripts|mprescripts|none|semantics|annotation)[\s>]/i.test(content)
}

/**
 * Extract all MathML blocks from content, converting each to LaTeX.
 * Returns the content with MathML blocks replaced by LaTeX delimiters.
 *
 * Respects the `display` attribute on the <math> element:
 * - display="block" → $$...$$ (block/display mode)
 * - display="inline" or absent → $...$ (inline mode)
 *
 * @param content - Content string that may contain MathML blocks
 * @returns Content with MathML replaced by LaTeX delimiters
 */
export function replaceMathMLWithLatex(content: string): string {
  if (!containsMathML(content)) return content

  // Match <math...>...</math> blocks (including nested tags)
  // Using a non-greedy match that handles the closing </math> tag
  const mathMLRegex = /<math[^>]*>[\s\S]*?<\/math>/gi

  return content.replace(mathMLRegex, (match) => {
    const latex = convertMathMLToLatex(match)
    if (latex) {
      // Check if the <math> element has display="block" attribute
      const isBlockDisplay = /<math[^>]*\bdisplay\s*=\s*["']block["']/i.test(match)
      if (isBlockDisplay) {
        // Block display → $$...$$
        return `$$${latex}$$`
      }
      // Default/inline → $...$
      return `$${latex}$`
    }
    // Conversion failed — preserve MathML for MathJax fallback rendering
    return match
  })
}
