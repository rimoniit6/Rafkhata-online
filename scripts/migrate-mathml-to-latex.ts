/**
 * Migration Script: Convert stored MathML blocks to LaTeX
 *
 * Scans all lectures and suggestions for math blocks containing
 * MathML markup and converts them to LaTeX format.
 *
 * Usage:
 *   bunx tsx scripts/migrate-mathml-to-latex.ts
 *
 * Safe to run multiple times — already-converted blocks are skipped.
 * Blocks where MathML→LaTeX conversion fails keep their MathML content
 * (still renders via MathJax on the frontend).
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Simple regex-based MathML→LaTeX converter (no DOM needed) ────

function convertMathMLNode(match: string): string {
  let result = match
    // Remove <math> wrapper
    .replace(/<\/?math[^>]*>/gi, '')
    .trim()

  // Handle <mfrac> (fractions)
  result = result.replace(/<mfrac>([\s\S]*?)<\/mfrac>/g, (_m, inner: string) => {
    const _parts = inner.split(/<\/?m[^>]*>/).filter(Boolean)
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    const splitPoint = cleaned.search(/[^a-zA-Z0-9{}()]/)
    if (splitPoint > 0) {
      const num = cleaned.slice(0, splitPoint).trim()
      const den = cleaned.slice(splitPoint).trim()
      return `\\frac{${num}}{${den}}`
    }
    return `\\frac{${cleaned}}`
  })

  // Handle <msup> (superscript)
  result = result.replace(/<msup>([\s\S]*?)<\/msup>/g, (_m, inner: string) => {
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    return `{${cleaned}}^{}`
  })

  // Handle <msub> (subscript)
  result = result.replace(/<msub>([\s\S]*?)<\/msub>/g, (_m, inner: string) => {
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    return `{${cleaned}}_{}`
  })

  // Handle <msqrt> (square root)
  result = result.replace(/<msqrt>([\s\S]*?)<\/msqrt>/g, (_m, inner: string) => {
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    return `\\sqrt{${cleaned}}`
  })

  // Handle <mover> (overset)
  result = result.replace(/<mover>([\s\S]*?)<\/mover>/g, (_m, inner: string) => {
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    return `\\overset{}{${cleaned}}`
  })

  // Handle <munder> (underset)
  result = result.replace(/<munder>([\s\S]*?)<\/munder>/g, (_m, inner: string) => {
    const cleaned = inner.replace(/<\/?m[^>]*>/g, '').trim()
    return `\\underset{}{${cleaned}}`
  })

  // Handle <mi> (identifier)
  result = result.replace(/<mi>([\s\S]*?)<\/mi>/g, '$1')

  // Handle <mn> (number)
  result = result.replace(/<mn>([\s\S]*?)<\/mn>/g, '$1')

  // Handle <mo> (operator)
  result = result.replace(/<mo>([\s\S]*?)<\/mo>/g, '$1')

  // Handle <mtext> (text)
  result = result.replace(/<mtext>([\s\S]*?)<\/mtext>/g, '\\text{$1}')

  // Handle <mrow> (group) — just strip tags
  result = result.replace(/<\/?mrow>/gi, '')
  result = result.replace(/<\/?mstyle>/gi, '')

  // Handle <mspace> (space)
  result = result.replace(/<mspace[^>]*\/>/gi, '\\ ')

  // Strip any remaining XML/annotation tags
  result = result.replace(/<\/?annotation[^>]*>/gi, '')
  result = result.replace(/<\/?semantics>/gi, '')
  result = result.replace(/<\/?none>/gi, '')
  result = result.replace(/<mprescripts\s*\/>/gi, '')

  // Strip namespace attributes
  result = result.replace(/\s+xmlns[^=]*="[^"]*"/g, '')
  result = result.replace(/<[a-z]+:/g, '<')
  result = result.replace(/<\/[a-z]+:/g, '</')

  // Collapse whitespace
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

function hasMathML(content: string): boolean {
  return /<math[\s>]/i.test(content) || /<(?:mfrac|mrow|mi|mo|mn|msup|msub|msqrt)[\s>]/i.test(content)
}

interface ContentBlock {
  id: string
  type: string
  content?: string
  [key: string]: unknown
}

function processBlocks(jsonStr: string): string | null {
  try {
    const blocks: ContentBlock[] = JSON.parse(jsonStr)
    if (!Array.isArray(blocks)) return null

    let changed = false
    const processed = blocks.map((block: ContentBlock) => {
      if (block.type !== 'math' || !block.content) return block
      if (!hasMathML(block.content)) return block

      const converted = convertMathMLNode(block.content)
      if (converted && converted !== block.content) {
        changed = true
        return { ...block, content: converted }
      }
      return block
    })

    return changed ? JSON.stringify(processed) : null
  } catch {
    return null
  }
}

// ─── Main Migration ───────────────────────────────────────────────

interface MigrationStats {
  scanned: number
  converted: number
  failed: number
  skipped: number
}

async function migrateRecords(): Promise<void> {
  console.log('🔍 Scanning for MathML content...\n')

  const total: MigrationStats = { scanned: 0, converted: 0, failed: 0, skipped: 0 }

  // 1. Migrate Lectures
  console.log('📚 Processing Lectures...')
  const lectures = await db.lecture.findMany({
    select: { id: true, title: true, content: true },
  })

  for (const lecture of lectures) {
    total.scanned++
    if (!lecture.content || !hasMathML(lecture.content)) {
      total.skipped++
      continue
    }

    const updated = processBlocks(lecture.content)
    if (updated) {
      try {
        await db.lecture.update({
          where: { id: lecture.id },
          data: { content: updated },
        })
        total.converted++
        console.log(`  ✅ Lecture: "${lecture.title?.slice(0, 50)}" — MathML → LaTeX`)
      } catch {
        total.failed++
        console.log(`  ❌ Lecture: "${lecture.title?.slice(0, 50)}" — update failed`)
      }
    } else {
      total.skipped++
    }
  }

  // 2. Migrate Suggestions
  console.log('\n📝 Processing Suggestions...')
  const suggestions = await db.suggestion.findMany({
    select: { id: true, title: true, content: true },
  })

  for (const suggestion of suggestions) {
    total.scanned++
    if (!suggestion.content || !hasMathML(suggestion.content)) {
      total.skipped++
      continue
    }

    const updated = processBlocks(suggestion.content)
    if (updated) {
      try {
        await db.suggestion.update({
          where: { id: suggestion.id },
          data: { content: updated },
        })
        total.converted++
        console.log(`  ✅ Suggestion: "${suggestion.title?.slice(0, 50)}" — MathML → LaTeX`)
      } catch {
        total.failed++
        console.log(`  ❌ Suggestion: "${suggestion.title?.slice(0, 50)}" — update failed`)
      }
    } else {
      total.skipped++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Complete')
  console.log('='.repeat(50))
  console.log(`  Scanned:    ${total.scanned}`)
  console.log(`  Converted:  ${total.converted}`)
  console.log(`  Skipped:    ${total.skipped}`)
  console.log(`  Failed:     ${total.failed}`)
  console.log('='.repeat(50))
}

migrateRecords()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
