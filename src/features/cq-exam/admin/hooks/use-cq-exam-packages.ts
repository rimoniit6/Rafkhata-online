import { useState, useEffect, useCallback, useRef, useReducer } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import {
  CQExamPackageRecord,
  CQExamSetRecord,
  CQExamSetQuestionRecord,
  CQSearchResult,
  CQExamSubmissionRecord,
  CQExamAnswerRecord,
  CQExamRetakeRequestRecord,
} from '@/features/cq-exam/types'
import type { BulkSubmissionItem } from '@/features/cq-exam/admin/components/CQBulkGradingView'
import { getErrorMessage, createRaceGuard } from '@/features/common/admin-utils'
import {
  navigationReducer, initialNavigationState,
  packageFormReducer, initialPackageFormState,
  setFormReducer, initialSetFormState,
  filterReducer, initialFilterState,
  searchDialogReducer, initialSearchDialogState,
  bulkCreateDialogReducer, initialBulkCreateDialogState,
  gradingDialogReducer, initialGradingDialogState,
  submissionViewReducer, initialSubmissionViewState,
  bulkGradingReducer, initialBulkGradingState,
  type NavigationAction,
  type PackageFormAction,
  type SetFormAction,
  type FilterAction,
  type SearchDialogAction,
  type BulkCreateDialogAction,
  type GradingDialogAction,
  type SubmissionViewAction,
  type BulkGradingAction,
  type NavigationState,
  type GradingDialogState,
} from './cq-exam-reducers'

interface ClassCategory {
  id: string
  name: string
  slug: string
}

interface SubjectOption {
  id: string
  name: string
  slug: string
  classId: string
}

type LeaderboardEntry = CQExamSubmissionRecord

type CqPackageListResponse = { packages?: CQExamPackageRecord[]; pagination?: { total?: number } }
type CqPackageDetailResponse = { package?: CQExamPackageRecord; examSets?: CQExamSetRecord[] }
type CqSetDetailResponse = { set?: CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] } }
type CqSubmissionsResponse = { submissions?: CQExamSubmissionRecord[] }
type CqSubmissionDetailResponse = { submission?: CQExamSubmissionRecord }
type CqSearchResponse = { cqs?: CQSearchResult[] }
type BulkSubmissionsResponse = { submissions?: BulkSubmissionItem[] }
type BulkGradeResponse = { gradedCount?: number; defaultMarks?: number }
type RetakeRequestsResponse = { requests?: CQExamRetakeRequestRecord[] }
type RetakeApprovalResponse = Record<string, unknown>
type AllowRetakeResponse = { canRetake?: boolean }

async function unwrapResponse<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  if (json?.error) throw new Error(json.error)
  return json?.data ?? json
}

export function useCQExamPackages() {
  const { toast } = useToast()
  const hierarchy = useHierarchyMetadata()
  const raceRef = useRef(createRaceGuard())

  useEffect(() => () => raceRef.current.dispose(), [])

  const [nav, navDispatch] = useReducer(navigationReducer, initialNavigationState)
  const [pkgForm, dispatchPkgForm] = useReducer(packageFormReducer, initialPackageFormState)
  const [setForm, dispatchSetForm] = useReducer(setFormReducer, initialSetFormState)
  const [filters, dispatchFilter] = useReducer(filterReducer, initialFilterState)
  const [searchDlg, dispatchSearchDlg] = useReducer(searchDialogReducer, initialSearchDialogState)
  const [bulkCreateDlg, dispatchBulkCreate] = useReducer(bulkCreateDialogReducer, initialBulkCreateDialogState)
  const [gradingDlg, dispatchGradingDlg] = useReducer(gradingDialogReducer, initialGradingDialogState)
  const [submissionView, dispatchSubmissionView] = useReducer(submissionViewReducer, initialSubmissionViewState)
  const [bulkGrade, dispatchBulkGrade] = useReducer(bulkGradingReducer, initialBulkGradingState)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<CQExamPackageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [currentPackage, setCurrentPackage] = useState<CQExamPackageRecord | null>(null)
  const [examSets, setExamSets] = useState<CQExamSetRecord[]>([])
  const [currentSet, setCurrentSet] = useState<(CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null>(null)
  const [submissions, setSubmissions] = useState<CQExamSubmissionRecord[]>([])
  const [submissionDetail, setSubmissionDetail] = useState<CQExamSubmissionRecord | null>(null)
  const [classes, setClasses] = useState<ClassCategory[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [retakeRequests, setRetakeRequests] = useState<CQExamRetakeRequestRecord[]>([])
  const [retakeRequestsLoading, setRetakeRequestsLoading] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [leaderboardSetTitle, setLeaderboardSetTitle] = useState('')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [editQuestionData, setEditQuestionData] = useState<{
    id: string
    typedUddeepok: string
    typedUddeepokImage: string
    typedQuestion1: string
    typedQuestion1Image: string
    typedQuestion2: string
    typedQuestion2Image: string
    typedQuestion3: string
    typedQuestion3Image: string
    typedQuestion4: string
    typedQuestion4Image: string
    subMarks: number[]
  } | null>(null)

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [filters.search])

  useEffect(() => {
    if (hierarchy.metadata?.classes) {
      setClasses(hierarchy.metadata.classes)
    }
  }, [hierarchy.metadata])

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId) {
      setSubjects([])
      return
    }
    try {
      const data = await unwrapResponse<SubjectOption[]>(`/api/admin/subjects?classId=${classId}&isActive=true`)
      setSubjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[CQExam] Failed to fetch subjects:', err)
    }
  }, [])

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const params = new URLSearchParams({ action: 'list', page: '1', limit: '50' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filters.filterClassId) params.set('classId', filters.filterClassId)
      if (filters.filterStatus) params.set('status', filters.filterStatus)
      const data = await unwrapResponse<CqPackageListResponse>(`/api/admin/cq-exam-packages?${params}`)
      if (!isStale()) {
        setPackages(data.packages || [])
        setTotal(data.pagination?.total || 0)
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[CQExamPackages] Failed to fetch:', err)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [debouncedSearch, filters.filterClassId, filters.filterStatus])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const fetchPackageDetail = useCallback(async (packageId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const data = await unwrapResponse<CqPackageDetailResponse>(`/api/admin/cq-exam-packages?action=detail&id=${packageId}`)
      const pkg = data.package ?? null
      if (!isStale()) {
        setCurrentPackage(pkg)
        setExamSets((pkg as any)?.examSets || [])
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[CQExamPackages] Failed to fetch package detail:', err)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [])

  const fetchSetDetail = useCallback(async (setId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const data = await unwrapResponse<CqSetDetailResponse>(`/api/admin/cq-exam-packages?action=set-detail&setId=${setId}`)
      if (!isStale()) setCurrentSet(data.set ?? null)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[CQExamPackages] Failed to fetch set detail:', err)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [])

  const fetchSubmissions = useCallback(async (setId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const data = await unwrapResponse<CqSubmissionsResponse>(`/api/admin/cq-exam-packages?action=submissions&setId=${setId}`)
      if (!isStale()) setSubmissions(data.submissions || [])
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[CQExamPackages] Failed to fetch submissions:', err)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [])

  const fetchSubmissionDetail = useCallback(async (submissionId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const data = await unwrapResponse<CqSubmissionDetailResponse>(`/api/admin/cq-exam-packages?action=submission-detail&submissionId=${submissionId}`)
      if (!isStale()) setSubmissionDetail(data.submission ?? null)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[CQExamPackages] Failed to fetch submission detail:', err)
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [])

  // ─── Save Handlers ────────────────────────────────────────────────

  const handleSavePackage = async () => {
    if (!pkgForm.pkgTitle || !pkgForm.pkgClassId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং শ্রেণি আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        action: nav.editId ? 'update-package' : 'create-package',
        title: pkgForm.pkgTitle,
        description: pkgForm.pkgDescription || undefined,
        classId: pkgForm.pkgClassId,
        subjectIds: pkgForm.pkgSubjectIds,
        price: parseFloat(pkgForm.pkgPrice) || 0,
        originalPrice: parseFloat(pkgForm.pkgOriginalPrice) || 0,
        thumbnail: pkgForm.pkgThumbnail || undefined,
        isPremium: pkgForm.pkgIsPremium,
        isActive: pkgForm.pkgIsActive,
        order: parseInt(pkgForm.pkgOrder) || 0,
        status: pkgForm.pkgStatus,
      }
      if (nav.editId) body.id = nav.editId

      const method = nav.editId ? 'PUT' : 'POST'
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method,
        body: JSON.stringify(body),
      })
      toast({ title: nav.editId ? 'প্যাকেজ আপডেট হয়েছে' : 'প্যাকেজ তৈরি হয়েছে' })
      navDispatch({ type: 'SET_VIEW', viewMode: 'list' })
      fetchPackages()
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSet = async () => {
    if (!setForm.setTitle || !setForm.setScheduledDate || !nav.selectedPackageId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং তারিখ আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        action: nav.editId ? 'update-set' : 'create-set',
        title: setForm.setTitle,
        description: setForm.setDescription || undefined,
        scheduledDate: setForm.setScheduledDate,
        startTime: setForm.setStartTime,
        endTime: setForm.setEndTime,
        duration: parseInt(setForm.setDuration) || 30,
        instructions: setForm.setInstructions || undefined,
        allowRetake: setForm.setAllowRetake,
        order: parseInt(setForm.setOrder) || 0,
        status: setForm.setStatus,
        answerMode: setForm.setAnswerMode,
        showAnnotatedImages: setForm.setShowAnnotatedImages,
        autoPublishResults: setForm.setAutoPublishResults,
        maxImagesPerAnswer: parseInt(setForm.setMaxImagesPerAnswer) || 5,
        gradingDeadline: setForm.setGradingDeadline || undefined,
        passMarks: parseFloat(setForm.setPassMarks) || 0,
        showCorrectAnswers: setForm.setShowCorrectAnswers,
        enablePartialGrading: setForm.setEnablePartialGrading,
      }
      if (nav.editId) {
        body.id = nav.editId
      } else {
        body.packageId = nav.selectedPackageId
      }

      const method = nav.editId ? 'PUT' : 'POST'
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method,
        body: JSON.stringify(body),
      })
      toast({ title: nav.editId ? 'এক্সাম সেট আপডেট হয়েছে' : 'এক্সাম সেট তৈরি হয়েছে' })
      fetchPackageDetail(nav.selectedPackageId)
      navDispatch({ type: 'SET_VIEW', viewMode: 'package-detail' })
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Handler ───────────────────────────────────────────────

  const handleDelete = async () => {
    if (!nav.deleteTarget) return
    try {
      if (nav.deleteTarget.type === 'package') {
        await unwrapResponse(`/api/admin/cq-exam-packages?action=delete-package&id=${nav.deleteTarget.id}`, { method: 'DELETE' })
        toast({ title: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        navDispatch({ type: 'SET_DELETE_TARGET', target: null })
        fetchPackages()
      } else {
        const params = new URLSearchParams({ action: 'delete-set', id: nav.deleteTarget.id })
        if (nav.deleteTarget.packageId) params.set('packageId', nav.deleteTarget.packageId)
        await unwrapResponse(`/api/admin/cq-exam-packages?${params}`, { method: 'DELETE' })
        toast({ title: 'এক্সাম সেট মুছে ফেলা হয়েছে' })
        navDispatch({ type: 'SET_DELETE_TARGET', target: null })
        if (nav.selectedPackageId) fetchPackageDetail(nav.selectedPackageId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  // ─── CQ Search Handlers ───────────────────────────────────────────

  const handleSearchCqs = useCallback(async () => {
    dispatchSearchDlg({ type: 'SET_LOADING', loading: true })
    try {
      const params = new URLSearchParams({ action: 'search-cqs', page: '1', limit: '30' })
      if (searchDlg.searchCqClassLevel) params.set('classLevel', searchDlg.searchCqClassLevel)
      if (searchDlg.searchCqSubjectId) params.set('subjectId', searchDlg.searchCqSubjectId)
      if (searchDlg.searchCqChapterId) params.set('chapterId', searchDlg.searchCqChapterId)
      if (searchDlg.searchCqText) params.set('q', searchDlg.searchCqText)
      const data = await unwrapResponse<CqSearchResponse>(`/api/admin/cq-exam-packages?${params}`)
      dispatchSearchDlg({ type: 'SET_RESULTS', results: data.cqs || [] })
    } catch (err) {
      console.error('[CQExam] Failed to search CQs:', err)
    } finally {
      dispatchSearchDlg({ type: 'SET_LOADING', loading: false })
    }
  }, [searchDlg.searchCqClassLevel, searchDlg.searchCqSubjectId, searchDlg.searchCqChapterId, searchDlg.searchCqText])

  const fetchSearchCqSubjects = useCallback(
    (classLevel: string) => {
      if (!classLevel) {
        dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjects', value: [] })
        return
      }
      const cls = hierarchy.metadata?.classes.find((c) => c.slug === classLevel)
      if (!cls) {
        dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjects', value: [] })
        return
      }
      const filtered = hierarchy.subjects
        .filter((s) => s.classId === cls.id)
        .map((s) => ({ id: s.id, name: s.name, slug: s.slug, classId: s.classId }))
      dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjects', value: filtered })
    },
    [hierarchy.metadata, hierarchy.subjects],
  )

  const fetchSearchCqChapters = useCallback(
    (subjectId: string) => {
      if (!subjectId) {
        dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqChapters', value: [] })
        return
      }
      const filtered = hierarchy.chapters
        .filter((c) => c.subjectId === subjectId)
        .map((c) => ({ id: c.id, name: c.name }))
      dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqChapters', value: filtered })
    },
    [hierarchy.chapters],
  )

  const handleAddCqs = async () => {
    if (searchDlg.selectedCqIds.length === 0 || !nav.selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add-questions',
          setId: nav.selectedSetId,
          cqIds: searchDlg.selectedCqIds,
        }),
      })
      toast({ title: `${searchDlg.selectedCqIds.length}টি প্রশ্ন যোগ করা হয়েছে` })
      dispatchSearchDlg({ type: 'RESET_SELECTED' })
      dispatchSearchDlg({ type: 'CLOSE' })
      fetchSetDetail(nav.selectedSetId)
    } catch (err) {
      console.error('[CQExam] Failed to add CQs:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTypedQuestion = async (data: {
    typedUddeepok: string
    typedUddeepokImage: string
    typedQuestion1: string
    typedQuestion1Image: string
    typedQuestion2: string
    typedQuestion2Image: string
    typedQuestion3: string
    typedQuestion3Image: string
    typedQuestion4: string
    typedQuestion4Image: string
    subMarks: number[]
  }) => {
    if (!nav.selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-typed-question',
          setId: nav.selectedSetId,
          ...data,
        }),
      })
      toast({ title: 'প্রশ্ন তৈরি করা হয়েছে' })
      if (nav.selectedSetId) await fetchSetDetail(nav.selectedSetId)
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে')
      toast({ title: 'ত্রুটি', description: msg, variant: 'destructive' })
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNonCqQuestion = async (data: {
    questionType: string
    stem: string
    stemImage: string
    config: Record<string, unknown>
    marks: number
  }) => {
    if (!nav.selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-non-cq-question',
          setId: nav.selectedSetId,
          ...data,
        }),
      })
      toast({ title: 'প্রশ্ন তৈরি করা হয়েছে' })
      if (nav.selectedSetId) await fetchSetDetail(nav.selectedSetId)
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে'), variant: 'destructive' })
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNonCqQuestion = async (data: {
    questionId: string
    stem?: string
    stemImage?: string
    config?: Record<string, unknown>
    marks?: number
  }) => {
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'update-non-cq-question', ...data }),
      })
      toast({ title: 'প্রশ্ন আপডেট করা হয়েছে' })
      if (nav.selectedSetId) await fetchSetDetail(nav.selectedSetId)
      return true
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'প্রশ্ন আপডেট করতে সমস্যা হয়েছে'), variant: 'destructive' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTypedQuestion = async (data: {
    questionId: string
    typedUddeepok: string
    typedUddeepokImage: string
    typedQuestion1: string
    typedQuestion1Image: string
    typedQuestion2: string
    typedQuestion2Image: string
    typedQuestion3: string
    typedQuestion3Image: string
    typedQuestion4: string
    typedQuestion4Image: string
    subMarks: number[]
  }) => {
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'update-typed-question', ...data }),
      })
      toast({ title: 'প্রশ্ন আপডেট করা হয়েছে' })
      if (nav.selectedSetId) await fetchSetDetail(nav.selectedSetId)
      return true
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'প্রশ্ন আপডেট করতে সমস্যা হয়েছে'), variant: 'destructive' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuestionMarks = async (questionId: string, marks: number) => {
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'update-question-marks', questionId, marks }),
      })
      toast({ title: 'নম্বর আপডেট করা হয়েছে' })
      if (nav.selectedSetId) await fetchSetDetail(nav.selectedSetId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveQuestion = async (id: string, isTyped: boolean) => {
    if (!nav.selectedSetId) return
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'remove-question',
          setId: nav.selectedSetId,
          ...(isTyped ? { questionId: id } : { cqId: id }),
        }),
      })
      toast({ title: 'প্রশ্ন সরানো হয়েছে' })
      fetchSetDetail(nav.selectedSetId)
    } catch (err) {
      console.error('[CQExam] Failed to remove question:', err)
    }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!currentSet?.questions || !nav.selectedSetId) return
    const questions = [...currentSet.questions]
    const idx = questions.findIndex((q) => q.id === questionId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= questions.length) return

    ;[questions[idx], questions[swapIdx]] = [questions[swapIdx], questions[idx]]
    const questionOrders = questions.map((q, i) => ({ id: q.id, order: i }))

    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'reorder-questions', setId: nav.selectedSetId, questionOrders }),
      })
      fetchSetDetail(nav.selectedSetId)
    } catch (err) {
      console.error('[CQExam] Failed to reorder questions:', err)
    }
  }

  // ─── Grading Handlers ─────────────────────────────────────────────

  const handleGradeSubmission = async (submissionId: string, answers: { answerId: string; obtainedMarks: number; feedback: string }[]) => {
    if (!submissionId || !answers.length) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'grade-submission',
          submissionId,
          answers: answers.map((a) => ({
            id: a.answerId,
            obtainedMarks: a.obtainedMarks ?? 0,
            feedback: a.feedback || null,
          })),
        }),
      })
      toast({ title: 'উত্তর মূল্যায়ন সংরক্ষিত হয়েছে' })
      fetchSubmissions(submissionView.selectedSubmission?.setId || '')
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Bulk Grading By Question ────────────────────────────────────

  const handleFetchBulkSubmissions = useCallback(async (questionId: string) => {
    if (!nav.selectedSetId) return
    dispatchBulkGrade({ type: 'SET_LOADING', loading: true })
    try {
      const data = await unwrapResponse<BulkSubmissionsResponse>(
        `/api/admin/cq-exam-packages?action=bulk-grade-by-question&setId=${nav.selectedSetId}&questionId=${questionId}`
      )
      dispatchBulkGrade({ type: 'SET_SUBMISSIONS', submissions: data.submissions || [] })
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
      dispatchBulkGrade({ type: 'SET_SUBMISSIONS', submissions: [] })
    } finally {
      dispatchBulkGrade({ type: 'SET_LOADING', loading: false })
    }
  }, [nav.selectedSetId, toast])

  const handleSaveBulkGrades = async (
    questionId: string,
    grades: { submissionId: string; answers: { id: string; obtainedMarks: number }[] }[]
  ) => {
    if (!grades.length) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'save-bulk-grades-by-question',
          submissions: grades,
        }),
      })
      toast({ title: 'গ্রেড সংরক্ষিত হয়েছে' })
      handleFetchBulkSubmissions(questionId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Bulk Grade ───────────────────────────────────────────────────

  const handleBulkGrade = async (setId: string, defaultMarks: number = 0) => {
    setSaving(true)
    try {
      const data = await unwrapResponse<BulkGradeResponse>('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'bulk-grade', setId, defaultMarks }),
      })
      toast({
        title: `সকল জমা মূল্যায়ন করা হয়েছে`,
        description: `${data.gradedCount}টি জমা গ্রেডেড • ${data.defaultMarks} নম্বর করে দেওয়া হয়েছে`,
      })
      fetchSubmissions(setId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handlePublishResults = async (setId: string) => {
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'publish-results', setId }),
      })
      toast({ title: 'ফলাফল প্রকাশিত হয়েছে' })
      fetchSubmissions(setId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Allow Retake ──────────────────────────────────────────────────

  const handleAllowRetake = async (submissionId: string) => {
    setSaving(true)
    try {
      const data = await unwrapResponse<AllowRetakeResponse>('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'allow-retake', submissionId }),
      })
      const canRetake = data.canRetake
      toast({
        title: canRetake ? 'পুনরায় পরীক্ষার অনুমতি দেওয়া হয়েছে' : 'পুনরায় পরীক্ষার অনুমতি সরানো হয়েছে',
      })
      if (nav.selectedSetId) fetchSubmissions(nav.selectedSetId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleReopenGrading = async (submissionId: string) => {
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'reopen-grading', submissionId }),
      })
      toast({ title: 'গ্রেডিং পুনরায় খোলা হয়েছে', description: 'এখন আবার গ্রেড করতে পারবেন' })
      if (nav.selectedSetId) fetchSubmissions(nav.selectedSetId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAnnotation = async (imageId: string, annotations: unknown) => {
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'save-annotation', imageId, annotations }),
      })
    } catch (err) {
      console.error('[CQExam] Failed to save annotation:', err)
    }
  }

  // ─── Retake Requests ──────────────────────────────────────────────

  const fetchRetakeRequests = useCallback(async (setId: string) => {
    setRetakeRequestsLoading(true)
    try {
      const data = await unwrapResponse<RetakeRequestsResponse>('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'list-retake-requests', setId }),
      })
      setRetakeRequests(data.requests || [])
    } catch (err) {
      console.error('[CQExam] Failed to fetch retake requests:', err)
      setRetakeRequests([])
    } finally {
      setRetakeRequestsLoading(false)
    }
  }, [])

  const handleApproveRetakeRequest = async (requestId: string, approve: boolean) => {
    setSaving(true)
    try {
      const data = await unwrapResponse<RetakeApprovalResponse>('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'approve-retake-request', requestId, approve }),
      })
      toast({
        title: approve ? 'অনুরোধ অনুমোদিত হয়েছে' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে',
      })
      if (nav.selectedSetId) {
        fetchRetakeRequests(nav.selectedSetId)
        fetchSubmissions(nav.selectedSetId)
      }
      return data
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
      return null
    } finally {
      setSaving(false)
    }
  }

  // ─── Bulk Create ──────────────────────────────────────────────────

  const handleBulkCreateSets = async () => {
    if (!bulkCreateDlg.bulkStartDate || !nav.selectedPackageId) return

    const count = parseInt(bulkCreateDlg.bulkCount) || 10
    const interval = parseInt(bulkCreateDlg.bulkIntervalDays) || 7
    const baseDate = new Date(bulkCreateDlg.bulkStartDate)

    setSaving(true)
    try {
      for (let i = 0; i < count; i++) {
        const date = new Date(baseDate)
        date.setDate(date.getDate() + i * interval)

        await unwrapResponse('/api/admin/cq-exam-packages', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-set',
            packageId: nav.selectedPackageId,
            title: `${bulkCreateDlg.bulkPrefix} ${i + 1}`,
            scheduledDate: date.toISOString().split('T')[0],
            startTime: '00:00',
            endTime: '23:59',
            duration: parseInt(bulkCreateDlg.bulkDuration) || 30,
            order: i,
            status: 'draft',
          }),
        })
      }
      toast({ title: `${count}টি সেট তৈরি হয়েছে` })
      dispatchBulkCreate({ type: 'CLOSE' })
      fetchPackageDetail(nav.selectedPackageId)
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Leaderboard ──────────────────────────────────────────────────

  const openLeaderboard = async (setId: string, setTitle: string) => {
    setLeaderboardSetTitle(setTitle)
    setLeaderboardData([])
    setLeaderboardLoading(true)
    navDispatch({ type: 'SET_VIEW', viewMode: 'leaderboard' })
    try {
      const data = await unwrapResponse<CqSubmissionsResponse>(`/api/admin/cq-exam-packages?action=submissions&setId=${setId}`)
      const sorted = [...(data.submissions || [])].sort((a, b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0))
      setLeaderboardData(sorted)
    } catch (err) {
      console.error('[CQExam] Failed to fetch leaderboard:', err)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  // ─── Toggle Active ────────────────────────────────────────────────

  const togglePackageActive = async (pkg: CQExamPackageRecord) => {
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'update-package', id: pkg.id, isActive: !pkg.isActive }),
      })
      toast({ title: pkg.isActive ? 'নিষ্ক্রিয় করা হয়েছে' : 'প্যাকেজ সক্রিয় করা হয়েছে' })
      fetchPackages()
    } catch (err) {
      console.error('[CQExam] Failed to toggle package:', err)
    }
  }

  // ─── Return ───────────────────────────────────────────────────────

  return {
    viewMode: nav.viewMode,
    setViewMode: (v: NavigationState['viewMode'] | ((prev: NavigationState['viewMode']) => NavigationState['viewMode'])) => {
      if (typeof v === 'function') { navDispatch({ type: 'SET_VIEW', viewMode: v(nav.viewMode) }) } else { navDispatch({ type: 'SET_VIEW', viewMode: v }) }
    },
    editId: nav.editId,
    setEditId: (v: string | null | ((prev: string | null) => string | null)) => {
      if (typeof v === 'function') { navDispatch({ type: 'SET_EDIT_ID', editId: v(nav.editId) }) } else { navDispatch({ type: 'SET_EDIT_ID', editId: v }) }
    },
    selectedPackageId: nav.selectedPackageId,
    setSelectedPackageId: (v: string | null | ((prev: string | null) => string | null)) => {
      if (typeof v === 'function') { navDispatch({ type: 'SELECT_PACKAGE', packageId: v(nav.selectedPackageId) }) } else { navDispatch({ type: 'SELECT_PACKAGE', packageId: v }) }
    },
    selectedSetId: nav.selectedSetId,
    setSelectedSetId: (v: string | null | ((prev: string | null) => string | null)) => {
      if (typeof v === 'function') { navDispatch({ type: 'SELECT_SET', setId: v(nav.selectedSetId) }) } else { navDispatch({ type: 'SELECT_SET', setId: v }) }
    },
    deleteTarget: nav.deleteTarget,
    setDeleteTarget: (v: typeof nav.deleteTarget | ((prev: typeof nav.deleteTarget) => typeof nav.deleteTarget)) => {
      if (typeof v === 'function') { navDispatch({ type: 'SET_DELETE_TARGET', target: v(nav.deleteTarget) }) } else { navDispatch({ type: 'SET_DELETE_TARGET', target: v }) }
    },

    loading, saving,
    packages, total,
    currentPackage, setCurrentPackage,
    examSets, currentSet, setCurrentSet,
    submissions, submissionDetail,

    classes, subjects, setSubjects,

    search: filters.search,
    setSearch: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchFilter({ type: 'SET_FILTER', field: 'search', value: v(filters.search) }) } else { dispatchFilter({ type: 'SET_FILTER', field: 'search', value: v }) }
    },
    filterClassId: filters.filterClassId,
    setFilterClassId: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchFilter({ type: 'SET_FILTER', field: 'filterClassId', value: v(filters.filterClassId) }) } else { dispatchFilter({ type: 'SET_FILTER', field: 'filterClassId', value: v }) }
    },
    filterStatus: filters.filterStatus,
    setFilterStatus: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchFilter({ type: 'SET_FILTER', field: 'filterStatus', value: v(filters.filterStatus) }) } else { dispatchFilter({ type: 'SET_FILTER', field: 'filterStatus', value: v }) }
    },

    pkgTitle: pkgForm.pkgTitle,
    setPkgTitle: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgTitle', value: v(pkgForm.pkgTitle) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgTitle', value: v }) }
    },
    pkgDescription: pkgForm.pkgDescription,
    setPkgDescription: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgDescription', value: v(pkgForm.pkgDescription) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgDescription', value: v }) }
    },
    pkgClassId: pkgForm.pkgClassId,
    setPkgClassId: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgClassId', value: v(pkgForm.pkgClassId) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgClassId', value: v }) }
    },
    pkgSubjectIds: pkgForm.pkgSubjectIds,
    setPkgSubjectIds: (v: string[] | ((prev: string[]) => string[])) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgSubjectIds', value: v(pkgForm.pkgSubjectIds) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgSubjectIds', value: v }) }
    },
    pkgPrice: pkgForm.pkgPrice,
    setPkgPrice: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgPrice', value: v(pkgForm.pkgPrice) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgPrice', value: v }) }
    },
    pkgOriginalPrice: pkgForm.pkgOriginalPrice,
    setPkgOriginalPrice: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgOriginalPrice', value: v(pkgForm.pkgOriginalPrice) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgOriginalPrice', value: v }) }
    },
    pkgThumbnail: pkgForm.pkgThumbnail,
    setPkgThumbnail: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgThumbnail', value: v(pkgForm.pkgThumbnail) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgThumbnail', value: v }) }
    },
    pkgIsActive: pkgForm.pkgIsActive,
    setPkgIsActive: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgIsActive', value: v(pkgForm.pkgIsActive) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgIsActive', value: v }) }
    },
    pkgIsPremium: pkgForm.pkgIsPremium,
    setPkgIsPremium: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgIsPremium', value: v(pkgForm.pkgIsPremium) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgIsPremium', value: v }) }
    },
    pkgOrder: pkgForm.pkgOrder,
    setPkgOrder: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgOrder', value: v(pkgForm.pkgOrder) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgOrder', value: v }) }
    },
    pkgStatus: pkgForm.pkgStatus,
    setPkgStatus: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgStatus', value: v(pkgForm.pkgStatus) }) } else { dispatchPkgForm({ type: 'SET_FIELD', field: 'pkgStatus', value: v }) }
    },

    setTitle: setForm.setTitle,
    setSetTitle: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setTitle', value: v(setForm.setTitle) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setTitle', value: v }) }
    },
    setDescription: setForm.setDescription,
    setSetDescription: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setDescription', value: v(setForm.setDescription) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setDescription', value: v }) }
    },
    setScheduledDate: setForm.setScheduledDate,
    setSetScheduledDate: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setScheduledDate', value: v(setForm.setScheduledDate) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setScheduledDate', value: v }) }
    },
    setStartTime: setForm.setStartTime,
    setSetStartTime: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setStartTime', value: v(setForm.setStartTime) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setStartTime', value: v }) }
    },
    setEndTime: setForm.setEndTime,
    setSetEndTime: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setEndTime', value: v(setForm.setEndTime) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setEndTime', value: v }) }
    },
    setDuration: setForm.setDuration,
    setSetDuration: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setDuration', value: v(setForm.setDuration) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setDuration', value: v }) }
    },
    setInstructions: setForm.setInstructions,
    setSetInstructions: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setInstructions', value: v(setForm.setInstructions) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setInstructions', value: v }) }
    },
    setOrder: setForm.setOrder,
    setSetOrder: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setOrder', value: v(setForm.setOrder) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setOrder', value: v }) }
    },
    setStatus: setForm.setStatus,
    setSetStatus: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setStatus', value: v(setForm.setStatus) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setStatus', value: v }) }
    },
    setAllowRetake: setForm.setAllowRetake,
    setSetAllowRetake: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setAllowRetake', value: v(setForm.setAllowRetake) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setAllowRetake', value: v }) }
    },
    setAnswerMode: setForm.setAnswerMode,
    setSetAnswerMode: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setAnswerMode', value: v(setForm.setAnswerMode) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setAnswerMode', value: v }) }
    },
    setShowAnnotatedImages: setForm.setShowAnnotatedImages,
    setSetShowAnnotatedImages: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setShowAnnotatedImages', value: v(setForm.setShowAnnotatedImages) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setShowAnnotatedImages', value: v }) }
    },
    setAutoPublishResults: setForm.setAutoPublishResults,
    setSetAutoPublishResults: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setAutoPublishResults', value: v(setForm.setAutoPublishResults) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setAutoPublishResults', value: v }) }
    },
    setMaxImagesPerAnswer: setForm.setMaxImagesPerAnswer,
    setSetMaxImagesPerAnswer: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setMaxImagesPerAnswer', value: v(setForm.setMaxImagesPerAnswer) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setMaxImagesPerAnswer', value: v }) }
    },
    setGradingDeadline: setForm.setGradingDeadline,
    setSetGradingDeadline: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setGradingDeadline', value: v(setForm.setGradingDeadline) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setGradingDeadline', value: v }) }
    },
    setPassMarks: setForm.setPassMarks,
    setSetPassMarks: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setPassMarks', value: v(setForm.setPassMarks) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setPassMarks', value: v }) }
    },
    setShowCorrectAnswers: setForm.setShowCorrectAnswers,
    setSetShowCorrectAnswers: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setShowCorrectAnswers', value: v(setForm.setShowCorrectAnswers) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setShowCorrectAnswers', value: v }) }
    },
    setEnablePartialGrading: setForm.setEnablePartialGrading,
    setSetEnablePartialGrading: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { dispatchSetForm({ type: 'SET_FIELD', field: 'setEnablePartialGrading', value: v(setForm.setEnablePartialGrading) }) } else { dispatchSetForm({ type: 'SET_FIELD', field: 'setEnablePartialGrading', value: v }) }
    },

    searchDialogOpen: searchDlg.searchDialogOpen,
    setSearchDialogOpen: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { v(searchDlg.searchDialogOpen) ? dispatchSearchDlg({ type: 'OPEN' }) : dispatchSearchDlg({ type: 'CLOSE' }) } else { v ? dispatchSearchDlg({ type: 'OPEN' }) : dispatchSearchDlg({ type: 'CLOSE' }) }
    },
    searchCqs: searchDlg.searchCqs,
    setSearchCqs: (v: CQSearchResult[] | ((prev: CQSearchResult[]) => CQSearchResult[])) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_RESULTS', results: v(searchDlg.searchCqs) }) } else { dispatchSearchDlg({ type: 'SET_RESULTS', results: v }) }
    },
    searchCqLoading: searchDlg.searchCqLoading,
    selectedCqIds: searchDlg.selectedCqIds,
    setSelectedCqIds: (v: string[] | ((prev: string[]) => string[])) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_SELECTED_IDS', ids: v(searchDlg.selectedCqIds) }) } else { dispatchSearchDlg({ type: 'SET_SELECTED_IDS', ids: v }) }
    },
    searchCqClassLevel: searchDlg.searchCqClassLevel,
    setSearchCqClassLevel: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqClassLevel', value: v(searchDlg.searchCqClassLevel) }) } else { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqClassLevel', value: v }) }
    },
    searchCqSubjectId: searchDlg.searchCqSubjectId,
    setSearchCqSubjectId: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjectId', value: v(searchDlg.searchCqSubjectId) }) } else { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjectId', value: v }) }
    },
    searchCqChapterId: searchDlg.searchCqChapterId,
    setSearchCqChapterId: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqChapterId', value: v(searchDlg.searchCqChapterId) }) } else { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqChapterId', value: v }) }
    },
    searchCqText: searchDlg.searchCqText,
    setSearchCqText: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqText', value: v(searchDlg.searchCqText) }) } else { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqText', value: v }) }
    },
    searchCqSubjects: searchDlg.searchCqSubjects,
    setSearchCqSubjects: (v: SubjectOption[] | ((prev: SubjectOption[]) => SubjectOption[])) => {
      if (typeof v === 'function') { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjects', value: v(searchDlg.searchCqSubjects) }) } else { dispatchSearchDlg({ type: 'SET_FIELD', field: 'searchCqSubjects', value: v }) }
    },
    searchCqChapters: searchDlg.searchCqChapters,

    submissionDetailOpen: submissionView.submissionDetailOpen,
    setSubmissionDetailOpen: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { v(submissionView.submissionDetailOpen) ? dispatchSubmissionView({ type: 'OPEN', submission: submissionView.selectedSubmission! }) : dispatchSubmissionView({ type: 'CLOSE' }) } else { v ? dispatchSubmissionView({ type: 'OPEN', submission: submissionView.selectedSubmission! }) : dispatchSubmissionView({ type: 'CLOSE' }) }
    },
    selectedSubmission: submissionView.selectedSubmission,
    setSelectedSubmission: (v: CQExamSubmissionRecord | null | ((prev: CQExamSubmissionRecord | null) => CQExamSubmissionRecord | null)) => {
      if (typeof v === 'function') { dispatchSubmissionView({ type: 'SET_SUBMISSION', submission: v(submissionView.selectedSubmission) }) } else { dispatchSubmissionView({ type: 'SET_SUBMISSION', submission: v }) }
    },
    selectedAnswerForGrading: gradingDlg.selectedAnswerForGrading,
    setSelectedAnswerForGrading: (v: GradingDialogState['selectedAnswerForGrading'] | ((prev: GradingDialogState['selectedAnswerForGrading']) => GradingDialogState['selectedAnswerForGrading'])) => {
      if (typeof v === 'function') { dispatchGradingDlg({ type: 'SET_SELECTED_ANSWER', selected: v(gradingDlg.selectedAnswerForGrading) }) } else { dispatchGradingDlg({ type: 'SET_SELECTED_ANSWER', selected: v }) }
    },

    gradingDialogOpen: gradingDlg.gradingDialogOpen,
    setGradingDialogOpen: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { v(gradingDlg.gradingDialogOpen) ? dispatchGradingDlg({ type: 'OPEN', answers: gradingDlg.gradingAnswers }) : dispatchGradingDlg({ type: 'CLOSE' }) } else { v ? dispatchGradingDlg({ type: 'OPEN', answers: gradingDlg.gradingAnswers }) : dispatchGradingDlg({ type: 'CLOSE' }) }
    },
    gradingAnswers: gradingDlg.gradingAnswers,
    setGradingAnswers: (v: CQExamAnswerRecord[] | ((prev: CQExamAnswerRecord[]) => CQExamAnswerRecord[])) => {
      if (typeof v === 'function') { dispatchGradingDlg({ type: 'SET_ANSWERS', answers: v(gradingDlg.gradingAnswers) }) } else { dispatchGradingDlg({ type: 'SET_ANSWERS', answers: v }) }
    },

    bulkCreateDialogOpen: bulkCreateDlg.bulkCreateDialogOpen,
    setBulkCreateDialogOpen: (v: boolean | ((prev: boolean) => boolean)) => {
      if (typeof v === 'function') { v(bulkCreateDlg.bulkCreateDialogOpen) ? dispatchBulkCreate({ type: 'OPEN' }) : dispatchBulkCreate({ type: 'CLOSE' }) } else { v ? dispatchBulkCreate({ type: 'OPEN' }) : dispatchBulkCreate({ type: 'CLOSE' }) }
    },
    bulkPrefix: bulkCreateDlg.bulkPrefix,
    setBulkPrefix: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkPrefix', value: v(bulkCreateDlg.bulkPrefix) }) } else { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkPrefix', value: v }) }
    },
    bulkStartDate: bulkCreateDlg.bulkStartDate,
    setBulkStartDate: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkStartDate', value: v(bulkCreateDlg.bulkStartDate) }) } else { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkStartDate', value: v }) }
    },
    bulkIntervalDays: bulkCreateDlg.bulkIntervalDays,
    setBulkIntervalDays: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkIntervalDays', value: v(bulkCreateDlg.bulkIntervalDays) }) } else { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkIntervalDays', value: v }) }
    },
    bulkCount: bulkCreateDlg.bulkCount,
    setBulkCount: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkCount', value: v(bulkCreateDlg.bulkCount) }) } else { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkCount', value: v }) }
    },
    bulkDuration: bulkCreateDlg.bulkDuration,
    setBulkDuration: (v: string | ((prev: string) => string)) => {
      if (typeof v === 'function') { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkDuration', value: v(bulkCreateDlg.bulkDuration) }) } else { dispatchBulkCreate({ type: 'SET_FIELD', field: 'bulkDuration', value: v }) }
    },

    retakeRequests, retakeRequestsLoading,

    leaderboardData, leaderboardSetTitle, leaderboardLoading,

    bulkSubmissions: bulkGrade.bulkSubmissions,
    bulkGradingLoading: bulkGrade.bulkGradingLoading,

    fetchPackages, fetchPackageDetail, fetchSetDetail,
    fetchSubmissions, fetchSubmissionDetail,
    fetchSubjectsForClass, fetchSearchCqSubjects, fetchSearchCqChapters,

    handleSavePackage, handleSaveSet, handleDelete,
    handleBulkCreateSets, handleSearchCqs, handleAddCqs,
    handleCreateTypedQuestion, handleUpdateTypedQuestion, handleCreateNonCqQuestion, handleUpdateNonCqQuestion,
    handleUpdateQuestionMarks, handleRemoveQuestion, handleMoveQuestion,
    editQuestionData, setEditQuestionData,
    handleGradeSubmission, handleBulkGrade, handlePublishResults, handleAllowRetake, handleReopenGrading, handleSaveAnnotation,
    handleFetchBulkSubmissions, handleSaveBulkGrades,
    fetchRetakeRequests, handleApproveRetakeRequest,
    openLeaderboard, togglePackageActive,
  }
}
