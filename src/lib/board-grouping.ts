import type { BoardQuestionItem } from '@/types/board-questions'

export interface BoardOccurrence {
  board: string
  year: string
}

export interface GroupedBoardItem extends BoardQuestionItem {
  occurrences: BoardOccurrence[]
  boards: string[]
  years: string[]
  boardCount: number
  yearCount: number
}

function n(v: string | null | undefined): string {
  if (v == null) return ''
  return v.trim().toLowerCase()
}

function makeMcqKey(item: BoardQuestionItem): string {
  return [
    'mcq',
    n(item.question),
    n(item.questionImage),
    n(item.optionA),
    n(item.optionB),
    n(item.optionC),
    n(item.optionD),
    n(item.optionAImage),
    n(item.optionBImage),
    n(item.optionCImage),
    n(item.optionDImage),
    n(item.correctAnswer),
    n(item.explanation),
    n(item.explanationImage),
    n(item.difficulty),
  ].join('|||')
}

function makeCqKey(item: BoardQuestionItem): string {
  return [
    'cq',
    n(item.question),
    n(item.questionImage),
    n(item.question1),
    n(item.question2),
    n(item.question3),
    n(item.question4),
    n(item.question1Image),
    n(item.question2Image),
    n(item.question3Image),
    n(item.question4Image),
    n(item.answer1),
    n(item.answer1Image),
    n(item.answer2),
    n(item.answer2Image),
    n(item.answer3),
    n(item.answer3Image),
    n(item.answer4),
    n(item.answer4Image),
    n(item.difficulty),
  ].join('|||')
}

function getKey(item: BoardQuestionItem, type: 'mcq' | 'cq'): string {
  return type === 'mcq' ? makeMcqKey(item) : makeCqKey(item)
}

/** Access group for ownership-aware grouping. */
function accessGroup(
  item: BoardQuestionItem,
  accessMap?: Record<string, { accessType: string }>,
): 'free' | 'purchased' | 'locked' {
  if (!item.isPremium) return 'free'
  if (!accessMap) return 'locked'
  const state = accessMap[item.id]
  if (!state) return 'locked'
  if (state.accessType === 'purchased') return 'purchased'
  return 'locked'
}

export function groupBoardItems(
  items: BoardQuestionItem[],
  type: 'mcq' | 'cq',
  accessMap?: Record<string, { accessType: string }>,
): GroupedBoardItem[] {
  // First pass: bucket by content key
  const buckets = new Map<string, BoardQuestionItem[]>()

  for (const item of items) {
    if (item.type !== type) continue
    const key = getKey(item, type)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }

  const result: GroupedBoardItem[] = []

  for (const group of buckets.values()) {
    if (group.length === 1) {
      const item = group[0]
      result.push(toGrouped(item))
      continue
    }

    // Check ownership consistency across premium items
    const premiumItems = group.filter((i) => i.isPremium)
    const hasMixedAccess =
      premiumItems.length > 0 &&
      new Set(premiumItems.map((i) => accessGroup(i, accessMap))).size > 1

    if (hasMixedAccess) {
      // Mixed ownership → render as individual cards
      for (const item of group) {
        result.push(toGrouped(item))
      }
    } else {
      // Same access state (or all free) → group
      result.push(mergeGroup(group))
    }
  }

  return result
}

function toGrouped(item: BoardQuestionItem): GroupedBoardItem {
  return {
    ...item,
    occurrences: [{ board: item.board, year: item.year }],
    boards: [item.board],
    years: [item.year],
    boardCount: 1,
    yearCount: 1,
  }
}

function mergeGroup(items: BoardQuestionItem[]): GroupedBoardItem {
  const first = items[0]
  const occurrences = items.map((i) => ({ board: i.board, year: i.year }))
  const boards = [...new Set(items.map((i) => i.board))].sort()
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => Number(a) - Number(b))

  const grouped: GroupedBoardItem = {
    ...first,
    occurrences,
    boards,
    years,
    boardCount: boards.length,
    yearCount: years.length,
  }

  for (const item of items) {
    if (item.isPremium) grouped.isPremium = true
    if (item.price > grouped.price) grouped.price = item.price
  }

  return grouped
}

export function formatBoardsYears(
  boards: string[],
  years: string[],
  _occurrences?: BoardOccurrence[],
): {
  label: string
  sublabel?: string
  type: 'single-single' | 'single-multi' | 'multi-single' | 'multi-multi'
} {
  const sortedBoards = [...boards].sort()
  const sortedYears = [...years].sort((a, b) => Number(a) - Number(b))

  if (boards.length === 1 && years.length === 1) {
    return { label: `${sortedBoards[0]} · ${sortedYears[0]}`, type: 'single-single' }
  }

  if (boards.length === 1) {
    return { label: `Board: ${sortedBoards[0]}`, sublabel: `Year: ${sortedYears.join(', ')}`, type: 'single-multi' }
  }

  if (years.length === 1) {
    return { label: `Board: ${sortedBoards.join(', ')}`, sublabel: `Year: ${sortedYears[0]}`, type: 'multi-single' }
  }

  return {
    label: `Board: ${sortedBoards.join(', ')}`,
    sublabel: `Year: ${sortedYears.join(', ')}`,
    type: 'multi-multi',
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const BOARD_PREFIX_PATTERNS = [
  (b: string, y: string) => new RegExp(`^${escapeRegex(b)}\\s+Board\\s+${escapeRegex(y)}\\s*[-:]\\s*`, 'i'),
  (b: string, y: string) => new RegExp(`^${escapeRegex(b)}\\s+${escapeRegex(y)}\\s*[-:]\\s*`, 'i'),
  (b: string, _y: string) => new RegExp(`^${escapeRegex(b)}\\s+Board\\s*[-:]\\s*`, 'i'),
]

export function stripBoardPrefix(text: string, board: string | null | undefined, year: string | null | undefined): string {
  if (!board && !year) return text
  for (const makeRegex of BOARD_PREFIX_PATTERNS) {
    try {
      const regex = makeRegex(board || '', year || '')
      const stripped = text.replace(regex, '')
      if (stripped !== text) return stripped
    } catch {
      continue
    }
  }
  return text
}
