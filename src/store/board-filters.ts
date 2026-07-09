import { create } from 'zustand'
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

export const useBoardFilterStore = create<BoardFilterState>((set, get) => ({
  ...initialState,
  labelMap: DEFAULT_LABELS,

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setFilter: (key, values) => set({ [key]: values } as unknown as Partial<BoardQuestionFilters>),

  toggleFilter: (key, value) => {
    const current = get()[key] as string[]
    const isArray = Array.isArray(current)
    if (isArray) {
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
        const labelMap = state.labelMap[labelSection]
        chips.push({
          key: `${key}:${v}`,
          value: v,
          label: labelMap[v] || v,
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
    const state = get()
    return (
      state.classLevels.length +
      state.boards.length +
      state.years.length +
      state.subjects.length +
      state.chapters.length +
      state.questionTypes.length +
      state.difficulty.length +
      state.topics.length +
      state.status.length +
      (state.contentAccess !== 'all' ? 1 : 0) +
      (state.searchQuery ? 1 : 0)
    )
  },

  getActiveFilterKeys: () => {
    const state = get()
    const keys: string[] = []
    if (state.classLevels.length) keys.push('classLevels')
    if (state.boards.length) keys.push('boards')
    if (state.years.length) keys.push('years')
    if (state.subjects.length) keys.push('subjects')
    if (state.chapters.length) keys.push('chapters')
    if (state.questionTypes.length) keys.push('questionTypes')
    if (state.difficulty.length) keys.push('difficulty')
    if (state.topics.length) keys.push('topics')
    if (state.status.length) keys.push('status')
    if (state.contentAccess !== 'all') keys.push('contentAccess')
    if (state.searchQuery) keys.push('searchQuery')
    return keys
  },
}))
