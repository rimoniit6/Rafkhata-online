import {
  MCQSearchResult,
  MCQExamSetResultRecord,
  MCQExamRetakeRequestRecord,
  ViewMode,
} from '@/features/mcq-exam/types'

interface SubjectOption {
  id: string
  name: string
  slug: string
}

interface ChapterOption {
  id: string
  name: string
}

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════

export type NavigationState = {
  viewMode: ViewMode
  editId: string | null
  selectedPackageId: string | null
  selectedSetId: string | null
  deleteTarget: { type: 'package' | 'set'; id: string; packageId?: string } | null
}

export type NavigationAction =
  | { type: 'SET_VIEW'; viewMode: ViewMode }
  | { type: 'SET_EDIT_ID'; editId: string | null }
  | { type: 'SELECT_PACKAGE'; packageId: string | null }
  | { type: 'SELECT_SET'; setId: string | null }
  | { type: 'SET_DELETE_TARGET'; target: NavigationState['deleteTarget'] }
  | { type: 'RESET' }

export const initialNavigationState: NavigationState = {
  viewMode: 'list',
  editId: null,
  selectedPackageId: null,
  selectedSetId: null,
  deleteTarget: null,
}

export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, viewMode: action.viewMode }
    case 'SET_EDIT_ID':
      return { ...state, editId: action.editId }
    case 'SELECT_PACKAGE':
      return { ...state, selectedPackageId: action.packageId }
    case 'SELECT_SET':
      return { ...state, selectedSetId: action.setId }
    case 'SET_DELETE_TARGET':
      return { ...state, deleteTarget: action.target }
    case 'RESET':
      return initialNavigationState
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Package Form
// ═══════════════════════════════════════════════════════════════════

export type PackageFormState = {
  pkgTitle: string
  pkgDescription: string
  pkgClassId: string
  pkgSubjectIds: string[]
  pkgPrice: string
  pkgOriginalPrice: string
  pkgThumbnail: string
  pkgIsActive: boolean
  pkgOrder: string
  pkgStatus: string
}

export type PackageFormAction =
  | { type: 'SET_FIELD'; field: keyof PackageFormState; value: PackageFormState[keyof PackageFormState] }
  | { type: 'RESET_PKG' }

export const initialPackageFormState: PackageFormState = {
  pkgTitle: '',
  pkgDescription: '',
  pkgClassId: '',
  pkgSubjectIds: [],
  pkgPrice: '',
  pkgOriginalPrice: '',
  pkgThumbnail: '',
  pkgIsActive: true,
  pkgOrder: '',
  pkgStatus: 'draft',
}

export function packageFormReducer(state: PackageFormState, action: PackageFormAction): PackageFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET_PKG':
      return initialPackageFormState
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Set Form
// ═══════════════════════════════════════════════════════════════════

export type SetFormState = {
  setTitle: string
  setDescription: string
  setScheduledDate: string
  setStartTime: string
  setEndTime: string
  setDuration: string
  setMarksPerQ: string
  setNegativeMarks: string
  setInstructions: string
  setAllowRetake: boolean
  setOrder: string
  setStatus: string
}

export type SetFormAction =
  | { type: 'SET_FIELD'; field: keyof SetFormState; value: SetFormState[keyof SetFormState] }
  | { type: 'RESET_SET' }

export const initialSetFormState: SetFormState = {
  setTitle: '',
  setDescription: '',
  setScheduledDate: '',
  setStartTime: '00:00',
  setEndTime: '23:59',
  setDuration: '30',
  setMarksPerQ: '1',
  setNegativeMarks: '0',
  setInstructions: '',
  setAllowRetake: false,
  setOrder: '0',
  setStatus: 'draft',
}

export function setFormReducer(state: SetFormState, action: SetFormAction): SetFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET_SET':
      return initialSetFormState
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Filters
// ═══════════════════════════════════════════════════════════════════

export type FilterState = {
  search: string
  filterClassId: string
  filterStatus: string
}

export type FilterAction =
  | { type: 'SET_FILTER'; field: keyof FilterState; value: string }
  | { type: 'RESET_FILTERS' }

export const initialFilterState: FilterState = {
  search: '',
  filterClassId: '',
  filterStatus: '',
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.field]: action.value }
    case 'RESET_FILTERS':
      return initialFilterState
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Search Dialog
// ═══════════════════════════════════════════════════════════════════

export type SearchDialogState = {
  searchDialogOpen: boolean
  searchMcqs: MCQSearchResult[]
  searchMcqLoading: boolean
  selectedMcqIds: string[]
  searchMcqClassLevel: string
  searchMcqSubjectId: string
  searchMcqChapterId: string
  searchMcqText: string
  searchMcqSubjects: SubjectOption[]
  searchMcqChapters: ChapterOption[]
}

export type SearchDialogAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'SET_RESULTS'; results: MCQSearchResult[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_IDS'; ids: string[] }
  | { type: 'RESET_SELECTED' }

export const initialSearchDialogState: SearchDialogState = {
  searchDialogOpen: false,
  searchMcqs: [],
  searchMcqLoading: false,
  selectedMcqIds: [],
  searchMcqClassLevel: '',
  searchMcqSubjectId: '',
  searchMcqChapterId: '',
  searchMcqText: '',
  searchMcqSubjects: [],
  searchMcqChapters: [],
}

export function searchDialogReducer(state: SearchDialogState, action: SearchDialogAction): SearchDialogState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, searchDialogOpen: true }
    case 'CLOSE':
      return { ...state, searchDialogOpen: false, selectedMcqIds: [] }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_RESULTS':
      return { ...state, searchMcqs: action.results }
    case 'SET_LOADING':
      return { ...state, searchMcqLoading: action.loading }
    case 'SET_SELECTED_IDS':
      return { ...state, selectedMcqIds: action.ids }
    case 'RESET_SELECTED':
      return { ...state, selectedMcqIds: [] }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Result Detail Dialog
// ═══════════════════════════════════════════════════════════════════

export type ResultDetailState = {
  resultDetailOpen: boolean
  selectedResult: MCQExamSetResultRecord | null
}

export type ResultDetailAction =
  | { type: 'OPEN'; result: MCQExamSetResultRecord }
  | { type: 'CLOSE' }
  | { type: 'SET_RESULT'; result: MCQExamSetResultRecord | null }

export const initialResultDetailState: ResultDetailState = {
  resultDetailOpen: false,
  selectedResult: null,
}

export function resultDetailReducer(state: ResultDetailState, action: ResultDetailAction): ResultDetailState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, resultDetailOpen: true, selectedResult: action.result }
    case 'CLOSE':
      return { ...state, resultDetailOpen: false }
    case 'SET_RESULT':
      return { ...state, selectedResult: action.result }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Bulk Create Dialog
// ═══════════════════════════════════════════════════════════════════

export type BulkCreateDialogState = {
  bulkCreateDialogOpen: boolean
  bulkPrefix: string
  bulkStartDate: string
  bulkIntervalDays: string
  bulkCount: string
  bulkDuration: string
  bulkMarksPerQ: string
  bulkNegativeMarks: string
}

export type BulkCreateDialogAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; field: string; value: string }

export const initialBulkCreateDialogState: BulkCreateDialogState = {
  bulkCreateDialogOpen: false,
  bulkPrefix: 'এক্সাম সেট',
  bulkStartDate: '',
  bulkIntervalDays: '7',
  bulkCount: '10',
  bulkDuration: '30',
  bulkMarksPerQ: '1',
  bulkNegativeMarks: '0',
}

export function bulkCreateDialogReducer(state: BulkCreateDialogState, action: BulkCreateDialogAction): BulkCreateDialogState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, bulkCreateDialogOpen: true }
    case 'CLOSE':
      return { ...state, bulkCreateDialogOpen: false }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Leaderboard
// ═══════════════════════════════════════════════════════════════════

export type LeaderboardState = {
  leaderboardData: MCQExamSetResultRecord[]
  leaderboardSetTitle: string
  leaderboardLoading: boolean
}

export type LeaderboardAction =
  | { type: 'OPEN'; setId: string; setTitle: string }
  | { type: 'SET_DATA'; data: MCQExamSetResultRecord[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'CLOSE' }

export const initialLeaderboardState: LeaderboardState = {
  leaderboardData: [],
  leaderboardSetTitle: '',
  leaderboardLoading: false,
}

export function leaderboardReducer(state: LeaderboardState, action: LeaderboardAction): LeaderboardState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, leaderboardData: [], leaderboardSetTitle: action.setTitle, leaderboardLoading: true }
    case 'SET_DATA':
      return { ...state, leaderboardData: action.data }
    case 'SET_LOADING':
      return { ...state, leaderboardLoading: action.loading }
    case 'CLOSE':
      return initialLeaderboardState
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Retake Requests
// ═══════════════════════════════════════════════════════════════════

export type RetakeRequestsState = {
  retakeRequests: MCQExamRetakeRequestRecord[]
  retakeRequestsLoading: boolean
}

export type RetakeRequestsAction =
  | { type: 'SET_REQUESTS'; requests: MCQExamRetakeRequestRecord[] }
  | { type: 'SET_LOADING'; loading: boolean }

export const initialRetakeRequestsState: RetakeRequestsState = {
  retakeRequests: [],
  retakeRequestsLoading: false,
}

export function retakeRequestsReducer(state: RetakeRequestsState, action: RetakeRequestsAction): RetakeRequestsState {
  switch (action.type) {
    case 'SET_REQUESTS':
      return { ...state, retakeRequests: action.requests }
    case 'SET_LOADING':
      return { ...state, retakeRequestsLoading: action.loading }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Bulk Upload
// ═══════════════════════════════════════════════════════════════════

export type BulkUploadState = {
  bulkUploadDialogOpen: boolean
  bulkUploadFile: File | null
  bulkUploadLoading: boolean
  bulkUploadResult: {
    success: number
    failed: number
    skipped: number
    errors: string[]
    message: string
    totalInSet?: number
  } | null
  bulkUploadSubjectId: string
  bulkUploadSubjects: SubjectOption[]
}

export type BulkUploadAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FILE'; file: File | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_RESULT'; result: BulkUploadState['bulkUploadResult'] }
  | { type: 'SET_SUBJECT_ID'; subjectId: string }
  | { type: 'SET_SUBJECTS'; subjects: SubjectOption[] }

export const initialBulkUploadState: BulkUploadState = {
  bulkUploadDialogOpen: false,
  bulkUploadFile: null,
  bulkUploadLoading: false,
  bulkUploadResult: null,
  bulkUploadSubjectId: '',
  bulkUploadSubjects: [],
}

export function bulkUploadReducer(state: BulkUploadState, action: BulkUploadAction): BulkUploadState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, bulkUploadDialogOpen: true }
    case 'CLOSE':
      return { ...initialBulkUploadState, bulkUploadSubjects: state.bulkUploadSubjects }
    case 'SET_FILE':
      return { ...state, bulkUploadFile: action.file }
    case 'SET_LOADING':
      return { ...state, bulkUploadLoading: action.loading }
    case 'SET_RESULT':
      return { ...state, bulkUploadResult: action.result }
    case 'SET_SUBJECT_ID':
      return { ...state, bulkUploadSubjectId: action.subjectId }
    case 'SET_SUBJECTS':
      return { ...state, bulkUploadSubjects: action.subjects }
    default:
      return state
  }
}
