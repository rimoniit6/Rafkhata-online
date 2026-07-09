import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { BoardQuestionFilters, FilterChip } from '@/types/board-questions'

const initialState: BoardQuestionFilters = {
  searchQuery: '',
  classLevels: [],
  boards: [],
  years: [],
  subjects: [],
  chapters: [],
  questionTypes: [],
  difficulty: [],
  topics: [],
  status: [],
  contentAccess: 'all',
  sortBy: 'year_desc',
}

interface FilterLabelMap {
  classLevels: Record<string, string>
  boards: Record<string, string>
  years: Record<string, string>
  subjects: Record<string, string>
  chapters: Record<string, string>
  questionTypes: Record<string, string>
  difficulty: Record<string, string>
  topics: Record<string, string>
  status: Record<string, string>
  contentAccess: Record<string, string>
  sortBy: Record<string, string>
}

const DEFAULT_LABELS: FilterLabelMap = {
  classLevels: {},
  boards: {},
  years: {},
  subjects: {},
  chapters: {},
  questionTypes: {
    mcq: 'MCQ',
    cq: 'CQ (সৃজনশীল)',
  },
  difficulty: {
    easy: 'সহজ',
    medium: 'মাঝারি',
    hard: 'কঠিন',
  },
  topics: {},
  status: {
    solved: 'সমাধান করা',
    unsolved: 'সমাধান করা হয়নি',
    bookmarked: 'বুকমার্ক করা',
    attempted: 'চেষ্টা করা',
    not_attempted: 'চেষ্টা করা হয়নি',
    correct: 'সঠিক উত্তর',
    wrong: 'ভুল উত্তর',
    recently_viewed: 'সম্প্রতি দেখা',
    frequently_asked: 'প্রায়শই জিজ্ঞাসিত',
    most_repeated: 'সর্বাধিক পুনরাবৃত্ত',
  },
  contentAccess: {
    all: 'সব প্রশ্ন',
    free: 'ফ্রি প্রশ্ন',
    premium: 'প্রিমিয়াম প্রশ্ন',
    unlocked: 'আনলক করা প্রশ্ন',
  },
  sortBy: {
    year_desc: 'সাল (নতুন→পুরাতন)',
    year_asc: 'সাল (পুরাতন→নতুন)',
    popularity: 'জনপ্রিয়তা',
    recently_viewed: 'সম্প্রতি দেখা',
  },
}

interface BoardFilterState extends BoardQuestionFilters {
  labelMap: FilterLabelMap
  setSearchQuery: (q: string) => void
  setFilter: (key: keyof BoardQuestionFilters, values: string | string[]) => void
  toggleFilter: (key: keyof BoardQuestionFilters, value: string) => void
  clearFilters: () => void
  removeFilterValue: (key: keyof BoardQuestionFilters, value: string) => void
  setLabelMap: (section: keyof FilterLabelMap, map: Record<string, string>) => void
  getActiveChips: () => FilterChip[]
  getFilterCount: () => number
  getActiveFilterKeys: () => string[]
}

export const useBoardFilterStore = create<BoardFilterState>()((set, get) => ({
  ...initialState,
  labelMap: DEFAULT_LABELS,

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setFilter: (key, values) => set({ [key]: values } as unknown as Partial<BoardQuestionFilters>),

  toggleFilter: (key, value) => {
    const current = get()[key] as string[]
    if (Array.isArray(current)) {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      set({ [key]: next } as Partial<BoardQuestionFilters>)
    }
  },

  clearFilters: () => set({ ...initialState, labelMap: get().labelMap }),

  removeFilterValue: (key, value) => {
    const current = get()[key]
    if (Array.isArray(current)) {
      set({ [key]: current.filter((v) => v !== value) } as Partial<BoardQuestionFilters>)
    }
  },

  setLabelMap: (section, map) =>
    set((state) => ({
      labelMap: { ...state.labelMap, [section]: map },
    })),

  getActiveChips: () => {
    const state = get()
    const chips: FilterChip[] = []

    const addChips = (key: keyof BoardQuestionFilters, values: string[], labelSection: keyof FilterLabelMap) => {
      for (const v of values) {
        chips.push({
          key: `${key}:${v}`,
          value: v,
          label: state.labelMap[labelSection][v] || v,
          onRemove: () => get().removeFilterValue(key, v),
        })
      }
    }

    addChips('classLevels', state.classLevels, 'classLevels')
    addChips('boards', state.boards, 'boards')
    addChips('years', state.years, 'years')
    addChips('subjects', state.subjects, 'subjects')
    addChips('chapters', state.chapters, 'chapters')
    addChips('questionTypes', state.questionTypes, 'questionTypes')
    addChips('difficulty', state.difficulty, 'difficulty')
    addChips('topics', state.topics, 'topics')
    addChips('status', state.status, 'status')

    if (state.contentAccess !== 'all') {
      chips.push({
        key: `contentAccess:${state.contentAccess}`,
        value: state.contentAccess,
        label: state.labelMap.contentAccess[state.contentAccess] || state.contentAccess,
        onRemove: () => set({ contentAccess: 'all' }),
      })
    }

    return chips
  },

  getFilterCount: () => {
    const s = get()
    return (
      s.classLevels.length + s.boards.length + s.years.length +
      s.subjects.length + s.chapters.length + s.questionTypes.length +
      s.difficulty.length + s.topics.length + s.status.length +
      (s.contentAccess !== 'all' ? 1 : 0) + (s.searchQuery ? 1 : 0)
    )
  },

  getActiveFilterKeys: () => {
    const keys: string[] = []
    const s = get()
    if (s.classLevels.length) keys.push('classLevels')
    if (s.boards.length) keys.push('boards')
    if (s.years.length) keys.push('years')
    if (s.subjects.length) keys.push('subjects')
    if (s.chapters.length) keys.push('chapters')
    if (s.questionTypes.length) keys.push('questionTypes')
    if (s.difficulty.length) keys.push('difficulty')
    if (s.topics.length) keys.push('topics')
    if (s.status.length) keys.push('status')
    if (s.contentAccess !== 'all') keys.push('contentAccess')
    if (s.searchQuery) keys.push('searchQuery')
    return keys
  },
}))

export const useBoardSearchQuery = () => useBoardFilterStore((s) => s.searchQuery)
export const useBoardClassLevels = () => useBoardFilterStore((s) => s.classLevels)
export const useBoardFilterCount = () => useBoardFilterStore((s) => s.getFilterCount())
export const useShallowBoardFilters = () => useBoardFilterStore(useShallow((s) => ({
  classLevels: s.classLevels,
  boards: s.boards,
  years: s.years,
  subjects: s.subjects,
  chapters: s.chapters,
  questionTypes: s.questionTypes,
  difficulty: s.difficulty,
  topics: s.topics,
  status: s.status,
  contentAccess: s.contentAccess,
  sortBy: s.sortBy,
})))
