import { useState, useEffect, useCallback, useRef } from 'react'
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
  ViewMode,
} from '@/features/cq-exam/types'
import type { BulkSubmissionItem } from '@/features/cq-exam/admin/components/CQBulkGradingView'
import { getErrorMessage, createRaceGuard } from '@/features/common/admin-utils'

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

interface ChapterOption {
  id: string
  name: string
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

  // View management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'package' | 'set'; id: string; packageId?: string } | null>(null)

  // Data states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<CQExamPackageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [currentPackage, setCurrentPackage] = useState<CQExamPackageRecord | null>(null)
  const [examSets, setExamSets] = useState<CQExamSetRecord[]>([])
  const [currentSet, setCurrentSet] = useState<(CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null>(null)
  const [submissions, setSubmissions] = useState<CQExamSubmissionRecord[]>([])
  const [submissionDetail, setSubmissionDetail] = useState<CQExamSubmissionRecord | null>(null)

  // Class/subject data
  const [classes, setClasses] = useState<ClassCategory[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [filterClassId, setFilterClassId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search])

  // Populate classes from hierarchy metadata
  useEffect(() => {
    if (hierarchy.metadata?.classes) {
      setClasses(hierarchy.metadata.classes)
    }
  }, [hierarchy.metadata])

  // Package Form Fields
  const [pkgTitle, setPkgTitle] = useState('')
  const [pkgDescription, setPkgDescription] = useState('')
  const [pkgClassId, setPkgClassId] = useState('')
  const [pkgSubjectIds, setPkgSubjectIds] = useState<string[]>([])
  const [pkgPrice, setPkgPrice] = useState('')
  const [pkgOriginalPrice, setPkgOriginalPrice] = useState('')
  const [pkgThumbnail, setPkgThumbnail] = useState('')
  const [pkgIsActive, setPkgIsActive] = useState(true)
  const [pkgIsPremium, setPkgIsPremium] = useState(true)
  const [pkgOrder, setPkgOrder] = useState('')
  const [pkgStatus, setPkgStatus] = useState('draft')

  // Set Form Fields
  const [setTitle, setSetTitle] = useState('')
  const [setDescription, setSetDescription] = useState('')
  const [setScheduledDate, setSetScheduledDate] = useState('')
  const [setStartTime, setSetStartTime] = useState('00:00')
  const [setEndTime, setSetEndTime] = useState('23:59')
  const [setDuration, setSetDuration] = useState('30')
  const [setInstructions, setSetInstructions] = useState('')
  const [setOrder, setSetOrder] = useState('0')
  const [setStatus, setSetStatus] = useState('draft')
  const [setAllowRetake, setSetAllowRetake] = useState(false)
  const [setAnswerMode, setSetAnswerMode] = useState('flexible')
  const [setShowAnnotatedImages, setSetShowAnnotatedImages] = useState(true)
  const [setAutoPublishResults, setSetAutoPublishResults] = useState(false)
  const [setMaxImagesPerAnswer, setSetMaxImagesPerAnswer] = useState('5')
  const [setGradingDeadline, setSetGradingDeadline] = useState('')
  const [setPassMarks, setSetPassMarks] = useState('0')
  const [setShowCorrectAnswers, setSetShowCorrectAnswers] = useState(false)
  const [setEnablePartialGrading, setSetEnablePartialGrading] = useState(true)

  // CQ Search Dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchCqs, setSearchCqs] = useState<CQSearchResult[]>([])
  const [searchCqLoading, setSearchCqLoading] = useState(false)
  const [selectedCqIds, setSelectedCqIds] = useState<string[]>([])
  const [searchCqClassLevel, setSearchCqClassLevel] = useState('')
  const [searchCqSubjectId, setSearchCqSubjectId] = useState('')
  const [searchCqChapterId, setSearchCqChapterId] = useState('')
  const [searchCqText, setSearchCqText] = useState('')
  const [searchCqSubjects, setSearchCqSubjects] = useState<SubjectOption[]>([])
  const [searchCqChapters, setSearchCqChapters] = useState<ChapterOption[]>([])


  // Submissions Viewing
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<CQExamSubmissionRecord | null>(null)

  // Grading
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false)
  const [gradingAnswers, setGradingAnswers] = useState<CQExamAnswerRecord[]>([])
  const [selectedAnswerForGrading, setSelectedAnswerForGrading] = useState<{ answer: CQExamAnswerRecord; index: number } | null>(null)

  // Bulk Create Sets Dialog
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false)
  const [bulkPrefix, setBulkPrefix] = useState('এক্সাম সেট')
  const [bulkStartDate, setBulkStartDate] = useState('')
  const [bulkIntervalDays, setBulkIntervalDays] = useState('7')
  const [bulkCount, setBulkCount] = useState('10')
  const [bulkDuration, setBulkDuration] = useState('30')

  // Retake Requests
  const [retakeRequests, setRetakeRequests] = useState<CQExamRetakeRequestRecord[]>([])
  const [retakeRequestsLoading, setRetakeRequestsLoading] = useState(false)

  // Leaderboard
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [leaderboardSetTitle, setLeaderboardSetTitle] = useState('')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Bulk Grading
  const [bulkSubmissions, setBulkSubmissions] = useState<BulkSubmissionItem[]>([])
  const [bulkGradingLoading, setBulkGradingLoading] = useState(false)

  // ─── Data Fetching ────────────────────────────────────────────────

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
      if (filterClassId) params.set('classId', filterClassId)
      if (filterStatus) params.set('status', filterStatus)
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
  }, [debouncedSearch, filterClassId, filterStatus])

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
        // examSets is returned INSIDE the package object (via Prisma include)
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
    if (!pkgTitle || !pkgClassId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং শ্রেণি আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        action: editId ? 'update-package' : 'create-package',
        title: pkgTitle,
        description: pkgDescription || undefined,
        classId: pkgClassId,
        subjectIds: pkgSubjectIds,
        price: parseFloat(pkgPrice) || 0,
        originalPrice: parseFloat(pkgOriginalPrice) || 0,
        thumbnail: pkgThumbnail || undefined,
        isPremium: pkgIsPremium,
        isActive: pkgIsActive,
        order: parseInt(pkgOrder) || 0,
        status: pkgStatus,
      }
      if (editId) body.id = editId

      const method = editId ? 'PUT' : 'POST'
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method,
        body: JSON.stringify(body),
      })
      toast({ title: editId ? 'প্যাকেজ আপডেট হয়েছে' : 'প্যাকেজ তৈরি হয়েছে' })
      setViewMode('list')
      fetchPackages()
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSet = async () => {
    if (!setTitle || !setScheduledDate || !selectedPackageId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং তারিখ আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        action: editId ? 'update-set' : 'create-set',
        title: setTitle,
        description: setDescription || undefined,
        scheduledDate: setScheduledDate,
        startTime: setStartTime,
        endTime: setEndTime,
        duration: parseInt(setDuration) || 30,
        instructions: setInstructions || undefined,
        allowRetake: setAllowRetake,
        order: parseInt(setOrder) || 0,
        status: setStatus,
        answerMode: setAnswerMode,
        showAnnotatedImages: setShowAnnotatedImages,
        autoPublishResults: setAutoPublishResults,
        maxImagesPerAnswer: parseInt(setMaxImagesPerAnswer) || 5,
        gradingDeadline: setGradingDeadline || undefined,
        passMarks: parseFloat(setPassMarks) || 0,
        showCorrectAnswers: setShowCorrectAnswers,
        enablePartialGrading: setEnablePartialGrading,
      }
      if (editId) {
        body.id = editId
      } else {
        body.packageId = selectedPackageId
      }

      const method = editId ? 'PUT' : 'POST'
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method,
        body: JSON.stringify(body),
      })
      toast({ title: editId ? 'এক্সাম সেট আপডেট হয়েছে' : 'এক্সাম সেট তৈরি হয়েছে' })
      fetchPackageDetail(selectedPackageId)
      setViewMode('package-detail')
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Handler ───────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'package') {
        await unwrapResponse(`/api/admin/cq-exam-packages?action=delete-package&id=${deleteTarget.id}`, { method: 'DELETE' })
        toast({ title: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        fetchPackages()
      } else {
        const params = new URLSearchParams({ action: 'delete-set', id: deleteTarget.id })
        if (deleteTarget.packageId) params.set('packageId', deleteTarget.packageId)
        await unwrapResponse(`/api/admin/cq-exam-packages?${params}`, { method: 'DELETE' })
        toast({ title: 'এক্সাম সেট মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        if (selectedPackageId) fetchPackageDetail(selectedPackageId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  // ─── CQ Search Handlers ───────────────────────────────────────────

  const handleSearchCqs = useCallback(async () => {
    setSearchCqLoading(true)
    try {
      const params = new URLSearchParams({ action: 'search-cqs', page: '1', limit: '30' })
      if (searchCqClassLevel) params.set('classLevel', searchCqClassLevel)
      if (searchCqSubjectId) params.set('subjectId', searchCqSubjectId)
      if (searchCqChapterId) params.set('chapterId', searchCqChapterId)
      if (searchCqText) params.set('q', searchCqText)
      const data = await unwrapResponse<CqSearchResponse>(`/api/admin/cq-exam-packages?${params}`)
      setSearchCqs(data.cqs || [])
    } catch (err) {
      console.error('[CQExam] Failed to search CQs:', err)
    } finally {
      setSearchCqLoading(false)
    }
  }, [searchCqClassLevel, searchCqSubjectId, searchCqChapterId, searchCqText])

  const fetchSearchCqSubjects = useCallback(
    (classLevel: string) => {
      if (!classLevel) {
        setSearchCqSubjects([])
        return
      }
      const cls = hierarchy.metadata?.classes.find((c) => c.slug === classLevel)
      if (!cls) {
        setSearchCqSubjects([])
        return
      }
      const filtered = hierarchy.subjects
        .filter((s) => s.classId === cls.id)
        .map((s) => ({ id: s.id, name: s.name, slug: s.slug, classId: s.classId }))
      setSearchCqSubjects(filtered)
    },
    [hierarchy.metadata, hierarchy.subjects],
  )

  const fetchSearchCqChapters = useCallback(
    (subjectId: string) => {
      if (!subjectId) {
        setSearchCqChapters([])
        return
      }
      const filtered = hierarchy.chapters
        .filter((c) => c.subjectId === subjectId)
        .map((c) => ({ id: c.id, name: c.name }))
      setSearchCqChapters(filtered)
    },
    [hierarchy.chapters],
  )

  const handleAddCqs = async () => {
    if (selectedCqIds.length === 0 || !selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add-questions',
          setId: selectedSetId,
          cqIds: selectedCqIds,
        }),
      })
      toast({ title: `${selectedCqIds.length}টি প্রশ্ন যোগ করা হয়েছে` })
      setSelectedCqIds([])
      setSearchDialogOpen(false)
      fetchSetDetail(selectedSetId)
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
    if (!selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-typed-question',
          setId: selectedSetId,
          ...data,
        }),
      })
      toast({ title: 'প্রশ্ন তৈরি করা হয়েছে' })
      if (selectedSetId) await fetchSetDetail(selectedSetId)
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
    if (!selectedSetId) return
    setSaving(true)
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-non-cq-question',
          setId: selectedSetId,
          ...data,
        }),
      })
      toast({ title: 'প্রশ্ন তৈরি করা হয়েছে' })
      if (selectedSetId) await fetchSetDetail(selectedSetId)
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
      if (selectedSetId) await fetchSetDetail(selectedSetId)
      return true
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'প্রশ্ন আপডেট করতে সমস্যা হয়েছে'), variant: 'destructive' })
      return false
    } finally {
      setSaving(false)
    }
  }

  // Question editing state
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
      if (selectedSetId) await fetchSetDetail(selectedSetId)
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
      if (selectedSetId) await fetchSetDetail(selectedSetId)
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveQuestion = async (id: string, isTyped: boolean) => {
    if (!selectedSetId) return
    try {
      await unwrapResponse('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'remove-question',
          setId: selectedSetId,
          ...(isTyped ? { questionId: id } : { cqId: id }),
        }),
      })
      toast({ title: 'প্রশ্ন সরানো হয়েছে' })
      fetchSetDetail(selectedSetId)
    } catch (err) {
      console.error('[CQExam] Failed to remove question:', err)
    }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!currentSet?.questions || !selectedSetId) return
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
        body: JSON.stringify({ action: 'reorder-questions', setId: selectedSetId, questionOrders }),
      })
      fetchSetDetail(selectedSetId)
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
      fetchSubmissions(selectedSubmission?.setId || '')
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Bulk Grading By Question ────────────────────────────────────

  const handleFetchBulkSubmissions = useCallback(async (questionId: string) => {
    if (!selectedSetId) return
    setBulkGradingLoading(true)
    try {
      const data = await unwrapResponse<BulkSubmissionsResponse>(
        `/api/admin/cq-exam-packages?action=bulk-grade-by-question&setId=${selectedSetId}&questionId=${questionId}`
      )
      setBulkSubmissions(data.submissions || [])
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
      setBulkSubmissions([])
    } finally {
      setBulkGradingLoading(false)
    }
  }, [selectedSetId, toast])

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
      if (selectedSetId) fetchSubmissions(selectedSetId)
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
      if (selectedSetId) fetchSubmissions(selectedSetId)
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
      if (selectedSetId) {
        fetchRetakeRequests(selectedSetId)
        fetchSubmissions(selectedSetId)
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
    if (!bulkStartDate || !selectedPackageId) return

    const count = parseInt(bulkCount) || 10
    const interval = parseInt(bulkIntervalDays) || 7
    const baseDate = new Date(bulkStartDate)

    setSaving(true)
    try {
      for (let i = 0; i < count; i++) {
        const date = new Date(baseDate)
        date.setDate(date.getDate() + i * interval)

        await unwrapResponse('/api/admin/cq-exam-packages', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-set',
            packageId: selectedPackageId,
            title: `${bulkPrefix} ${i + 1}`,
            scheduledDate: date.toISOString().split('T')[0],
            startTime: '00:00',
            endTime: '23:59',
            duration: parseInt(bulkDuration) || 30,
            order: i,
            status: 'draft',
          }),
        })
      }
      toast({ title: `${count}টি সেট তৈরি হয়েছে` })
      setBulkCreateDialogOpen(false)
      fetchPackageDetail(selectedPackageId)
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
    setViewMode('leaderboard')
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
    viewMode, setViewMode,
    editId, setEditId,
    selectedPackageId, setSelectedPackageId,
    selectedSetId, setSelectedSetId,
    deleteTarget, setDeleteTarget,

    loading, saving,
    packages, total,
    currentPackage, setCurrentPackage,
    examSets, currentSet, setCurrentSet,
    submissions, submissionDetail,

    classes, subjects, setSubjects,

    search, setSearch,
    filterClassId, setFilterClassId,
    filterStatus, setFilterStatus,

    pkgTitle, setPkgTitle,
    pkgDescription, setPkgDescription,
    pkgClassId, setPkgClassId,
    pkgSubjectIds, setPkgSubjectIds,
    pkgPrice, setPkgPrice,
    pkgOriginalPrice, setPkgOriginalPrice,
    pkgThumbnail, setPkgThumbnail,
    pkgIsActive, setPkgIsActive,
    pkgIsPremium, setPkgIsPremium,
    pkgOrder, setPkgOrder,
    pkgStatus, setPkgStatus,

    setTitle, setSetTitle,
    setDescription, setSetDescription,
    setScheduledDate, setSetScheduledDate,
    setStartTime, setSetStartTime,
    setEndTime, setSetEndTime,
    setDuration, setSetDuration,
    setInstructions, setSetInstructions,
    setOrder, setSetOrder,
    setStatus, setSetStatus,
    setAllowRetake, setSetAllowRetake,
    setAnswerMode, setSetAnswerMode,
    setShowAnnotatedImages, setSetShowAnnotatedImages,
    setAutoPublishResults, setSetAutoPublishResults,
    setMaxImagesPerAnswer, setSetMaxImagesPerAnswer,
    setGradingDeadline, setSetGradingDeadline,
    setPassMarks, setSetPassMarks,
    setShowCorrectAnswers, setSetShowCorrectAnswers,
    setEnablePartialGrading, setSetEnablePartialGrading,

    searchDialogOpen, setSearchDialogOpen,
    searchCqs, setSearchCqs, searchCqLoading,
    selectedCqIds, setSelectedCqIds,
    searchCqClassLevel, setSearchCqClassLevel,
    searchCqSubjectId, setSearchCqSubjectId,
    searchCqChapterId, setSearchCqChapterId,
    searchCqText, setSearchCqText,
    searchCqSubjects, setSearchCqSubjects,
    searchCqChapters,

    submissionDetailOpen, setSubmissionDetailOpen,
    selectedSubmission, setSelectedSubmission,
    selectedAnswerForGrading, setSelectedAnswerForGrading,

    gradingDialogOpen, setGradingDialogOpen,
    gradingAnswers, setGradingAnswers,

    bulkCreateDialogOpen, setBulkCreateDialogOpen,
    bulkPrefix, setBulkPrefix,
    bulkStartDate, setBulkStartDate,
    bulkIntervalDays, setBulkIntervalDays,
    bulkCount, setBulkCount,
    bulkDuration, setBulkDuration,

    retakeRequests, retakeRequestsLoading,

    leaderboardData, leaderboardSetTitle, leaderboardLoading,

    bulkSubmissions, bulkGradingLoading,

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
