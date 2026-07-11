import {
  CQSearchResult,
  CQExamSubmissionRecord,
  CQExamAnswerRecord,
  ViewMode,
} from '@/features/cq-exam/types'
import type { BulkSubmissionItem } from '@/features/cq-exam/admin/components/CQBulkGradingView'

interface SubjectOption {
  id: string
  name: string
  slug: string
  classId: string
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
  pkgIsPremium: boolean
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
  pkgIsPremium: true,
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
  setInstructions: string
  setOrder: string
  setStatus: string
  setAllowRetake: boolean
  setAnswerMode: string
  setShowAnnotatedImages: boolean
  setAutoPublishResults: boolean
  setMaxImagesPerAnswer: string
  setGradingDeadline: string
  setPassMarks: string
  setShowCorrectAnswers: boolean
  setEnablePartialGrading: boolean
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
  setInstructions: '',
  setOrder: '0',
  setStatus: 'draft',
  setAllowRetake: false,
  setAnswerMode: 'flexible',
  setShowAnnotatedImages: true,
  setAutoPublishResults: false,
  setMaxImagesPerAnswer: '5',
  setGradingDeadline: '',
  setPassMarks: '0',
  setShowCorrectAnswers: false,
  setEnablePartialGrading: true,
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
  searchCqs: CQSearchResult[]
  searchCqLoading: boolean
  selectedCqIds: string[]
  searchCqClassLevel: string
  searchCqSubjectId: string
  searchCqChapterId: string
  searchCqText: string
  searchCqSubjects: SubjectOption[]
  searchCqChapters: ChapterOption[]
}

export type SearchDialogAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'SET_RESULTS'; results: CQSearchResult[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_IDS'; ids: string[] }
  | { type: 'RESET_SELECTED' }

export const initialSearchDialogState: SearchDialogState = {
  searchDialogOpen: false,
  searchCqs: [],
  searchCqLoading: false,
  selectedCqIds: [],
  searchCqClassLevel: '',
  searchCqSubjectId: '',
  searchCqChapterId: '',
  searchCqText: '',
  searchCqSubjects: [],
  searchCqChapters: [],
}

export function searchDialogReducer(state: SearchDialogState, action: SearchDialogAction): SearchDialogState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, searchDialogOpen: true }
    case 'CLOSE':
      return { ...state, searchDialogOpen: false, selectedCqIds: [] }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_RESULTS':
      return { ...state, searchCqs: action.results }
    case 'SET_LOADING':
      return { ...state, searchCqLoading: action.loading }
    case 'SET_SELECTED_IDS':
      return { ...state, selectedCqIds: action.ids }
    case 'RESET_SELECTED':
      return { ...state, selectedCqIds: [] }
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
// Grading Dialog
// ═══════════════════════════════════════════════════════════════════

export type GradingDialogState = {
  gradingDialogOpen: boolean
  gradingAnswers: CQExamAnswerRecord[]
  selectedAnswerForGrading: { answer: CQExamAnswerRecord; index: number } | null
}

export type GradingDialogAction =
  | { type: 'OPEN'; answers: CQExamAnswerRecord[] }
  | { type: 'CLOSE' }
  | { type: 'SET_ANSWERS'; answers: CQExamAnswerRecord[] }
  | { type: 'SET_SELECTED_ANSWER'; selected: GradingDialogState['selectedAnswerForGrading'] }

export const initialGradingDialogState: GradingDialogState = {
  gradingDialogOpen: false,
  gradingAnswers: [],
  selectedAnswerForGrading: null,
}

export function gradingDialogReducer(state: GradingDialogState, action: GradingDialogAction): GradingDialogState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, gradingDialogOpen: true, gradingAnswers: action.answers }
    case 'CLOSE':
      return initialGradingDialogState
    case 'SET_ANSWERS':
      return { ...state, gradingAnswers: action.answers }
    case 'SET_SELECTED_ANSWER':
      return { ...state, selectedAnswerForGrading: action.selected }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Submission Viewing
// ═══════════════════════════════════════════════════════════════════

export type SubmissionViewState = {
  submissionDetailOpen: boolean
  selectedSubmission: CQExamSubmissionRecord | null
}

export type SubmissionViewAction =
  | { type: 'OPEN'; submission: CQExamSubmissionRecord }
  | { type: 'CLOSE' }
  | { type: 'SET_SUBMISSION'; submission: CQExamSubmissionRecord | null }

export const initialSubmissionViewState: SubmissionViewState = {
  submissionDetailOpen: false,
  selectedSubmission: null,
}

export function submissionViewReducer(state: SubmissionViewState, action: SubmissionViewAction): SubmissionViewState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, submissionDetailOpen: true, selectedSubmission: action.submission }
    case 'CLOSE':
      return { ...state, submissionDetailOpen: false }
    case 'SET_SUBMISSION':
      return { ...state, selectedSubmission: action.submission }
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// Bulk Grading
// ═══════════════════════════════════════════════════════════════════

export type BulkGradingState = {
  bulkSubmissions: BulkSubmissionItem[]
  bulkGradingLoading: boolean
}

export type BulkGradingAction =
  | { type: 'SET_SUBMISSIONS'; submissions: BulkSubmissionItem[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET' }

export const initialBulkGradingState: BulkGradingState = {
  bulkSubmissions: [],
  bulkGradingLoading: false,
}

export function bulkGradingReducer(state: BulkGradingState, action: BulkGradingAction): BulkGradingState {
  switch (action.type) {
    case 'SET_SUBMISSIONS':
      return { ...state, bulkSubmissions: action.submissions }
    case 'SET_LOADING':
      return { ...state, bulkGradingLoading: action.loading }
    case 'RESET':
      return initialBulkGradingState
    default:
      return state
  }
}
