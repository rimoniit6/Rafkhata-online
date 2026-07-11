import {
  ClassCategory,
  MCQExamPackageRecord,
  MCQExamRetakeRequestRecord,
  MCQExamSetQuestionRecord,
  MCQExamSetRecord,
  MCQExamSetResultRecord,
  SubjectOption,
} from '@/features/mcq-exam/types'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api-client'
import { mcqExamAdminService } from '@/services/api/mcq-exam-admin.service'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { getErrorMessage, unwrap, createRaceGuard } from '@/features/common/admin-utils'
import {
  navigationReducer, initialNavigationState,
  packageFormReducer, initialPackageFormState,
  setFormReducer, initialSetFormState,
  filterReducer, initialFilterState,
  searchDialogReducer, initialSearchDialogState,
  resultDetailReducer, initialResultDetailState,
  bulkCreateDialogReducer, initialBulkCreateDialogState,
  leaderboardReducer, initialLeaderboardState,
  retakeRequestsReducer, initialRetakeRequestsState,
  bulkUploadReducer, initialBulkUploadState,
} from './mcq-exam-reducers'

type AdminQueryParams = Record<string, string | number | boolean | undefined | null>
type PackageListResponse = { packages?: MCQExamPackageRecord[]; pagination?: { total?: number } }
type PackageDetailResponse = { package?: MCQExamPackageRecord & { examSets?: MCQExamSetRecord[] } }
type SetDetailResponse = { set?: MCQExamSetRecord & { questions?: MCQExamSetQuestionRecord[] } }
type ResultsResponse = { results?: MCQExamSetResultRecord[] }
type BulkCreateResponse = { count?: number }
type SearchMcqsResponse = { mcqs?: import('@/features/mcq-exam/types').MCQSearchResult[] }
type LeaderboardResponse = { leaderboard?: MCQExamSetResultRecord[] }
type RetakeRequestsResponse = { requests?: MCQExamRetakeRequestRecord[] }

export function useMCQExamPackages() {
  const { toast } = useToast()
  const raceRef = useRef(createRaceGuard())

  useEffect(() => () => raceRef.current.dispose(), [])

  const [nav, navDispatch] = useReducer(navigationReducer, initialNavigationState)
  const [pkgForm, pkgFormDispatch] = useReducer(packageFormReducer, initialPackageFormState)
  const [setForm, setFormDispatch] = useReducer(setFormReducer, initialSetFormState)
  const [filters, filterDispatch] = useReducer(filterReducer, initialFilterState)
  const [searchDialog, searchDialogDispatch] = useReducer(searchDialogReducer, initialSearchDialogState)
  const [resultDetail, resultDetailDispatch] = useReducer(resultDetailReducer, initialResultDetailState)
  const [bulkCreate, bulkCreateDispatch] = useReducer(bulkCreateDialogReducer, initialBulkCreateDialogState)
  const [leaderboard, leaderboardDispatch] = useReducer(leaderboardReducer, initialLeaderboardState)
  const [retakeState, retakeDispatch] = useReducer(retakeRequestsReducer, initialRetakeRequestsState)
  const [bulkUpload, bulkUploadDispatch] = useReducer(bulkUploadReducer, initialBulkUploadState)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<MCQExamPackageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [currentPackage, setCurrentPackage] = useState<MCQExamPackageRecord | null>(null)
  const [examSets, setExamSets] = useState<MCQExamSetRecord[]>([])
  const [currentSet, setCurrentSet] = useState<(MCQExamSetRecord & { questions?: MCQExamSetQuestionRecord[] }) | null>(null)
  const [setResults, setSetResults] = useState<MCQExamSetResultRecord[]>([])
  const [classes, setClasses] = useState<ClassCategory[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [filters.search])

  const fetchClasses = useCallback(async () => {
    try {
      const json = await api.get<{ data: ClassCategory[] }>('admin/classes', { isActive: true })
      const data = unwrap(json)
      setClasses(Array.isArray(data) ? data : [])
    } catch (err) { console.error('[MCQExam] Failed to fetch classes:', err) }
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const json = await api.get<{ data: SubjectOption[] }>('admin/subjects', { classId, isActive: true })
      const data = unwrap(json)
      setSubjects(Array.isArray(data) ? data : [])
    } catch (err) { console.error('[MCQExam] Failed to fetch subjects:', err) }
  }, [])

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const params: AdminQueryParams = { action: 'list', page: '1', limit: '50' }
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.filterClassId) params.classId = filters.filterClassId
      if (filters.filterStatus) params.status = filters.filterStatus
      const json = await mcqExamAdminService.listPackages(params)
      const data = unwrap<PackageListResponse>(json)
      if (!isStale()) {
        setPackages(data.packages || [])
        setTotal(data.pagination?.total || 0)
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[MCQExamPackages] Failed to fetch:', err)
    }
    finally { if (!isStale()) setLoading(false) }
  }, [debouncedSearch, filters.filterClassId, filters.filterStatus])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const fetchPackageDetail = useCallback(async (packageId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const json = await mcqExamAdminService.getPackageDetail(packageId)
      const data = unwrap<PackageDetailResponse>(json)
      if (!isStale()) {
        setCurrentPackage(data.package ?? null)
        setExamSets(data.package?.examSets || [])
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[MCQExamPackages] Failed to fetch package detail:', err)
    }
    finally { if (!isStale()) setLoading(false) }
  }, [])

  const fetchSetDetail = useCallback(async (setId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const json = await mcqExamAdminService.getSetDetail(setId)
      const data = unwrap<SetDetailResponse>(json)
      if (!isStale()) setCurrentSet(data.set ?? null)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[MCQExamPackages] Failed to fetch set detail:', err)
    }
    finally { if (!isStale()) setLoading(false) }
  }, [])

  const fetchResults = useCallback(async (setId: string) => {
    setLoading(true)
    const { isStale } = raceRef.current.next()
    try {
      const json = await mcqExamAdminService.getResults(setId)
      const data = unwrap<ResultsResponse>(json)
      if (!isStale()) setSetResults(data.results || [])
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) console.error('[MCQExamPackages] Failed to fetch results:', err)
    }
    finally { if (!isStale()) setLoading(false) }
  }, [])

  const handleSavePackage = async () => {
    if (!pkgForm.pkgTitle || !pkgForm.pkgClassId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং শ্রেণি আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const data = {
        title: pkgForm.pkgTitle,
        description: pkgForm.pkgDescription || undefined,
        classId: pkgForm.pkgClassId,
        subjectIds: pkgForm.pkgSubjectIds,
        price: parseFloat(pkgForm.pkgPrice) || 0,
        originalPrice: parseFloat(pkgForm.pkgOriginalPrice) || 0,
        thumbnail: pkgForm.pkgThumbnail || undefined,
        isActive: pkgForm.pkgIsActive,
        order: parseInt(pkgForm.pkgOrder) || 0,
        status: pkgForm.pkgStatus,
      }

      if (nav.editId) {
        await mcqExamAdminService.updatePackage(nav.editId, data)
        toast({ title: 'প্যাকেজ আপডেট হয়েছে' })
      } else {
        await mcqExamAdminService.createPackage(data)
        toast({ title: 'প্যাকেজ তৈরি হয়েছে' })
      }
      navDispatch({ type: 'SET_VIEW', viewMode: 'list' })
      fetchPackages()
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleSaveSet = async () => {
    if (!setForm.setTitle || !setForm.setScheduledDate || !nav.selectedPackageId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং তারিখ আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const data = {
        title: setForm.setTitle,
        description: setForm.setDescription || undefined,
        scheduledDate: setForm.setScheduledDate,
        startTime: setForm.setStartTime,
        endTime: setForm.setEndTime,
        duration: parseInt(setForm.setDuration) || 30,
        marksPerQ: parseFloat(setForm.setMarksPerQ) || 1,
        negativeMarks: parseFloat(setForm.setNegativeMarks) || 0,
        allowRetake: setForm.setAllowRetake,
        instructions: setForm.setInstructions || undefined,
        order: parseInt(setForm.setOrder) || 0,
        status: setForm.setStatus,
        ...(nav.editId ? {} : { packageId: nav.selectedPackageId }),
      }

      if (nav.editId) {
        await mcqExamAdminService.updateSet(nav.editId, data)
        toast({ title: 'এক্সাম সেট আপডেট হয়েছে' })
      } else {
        await mcqExamAdminService.createSet(data)
        toast({ title: 'এক্সাম সেট তৈরি হয়েছে' })
      }
      fetchPackageDetail(nav.selectedPackageId)
      navDispatch({ type: 'SET_VIEW', viewMode: 'detail' })
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!nav.deleteTarget) return
    try {
      if (nav.deleteTarget.type === 'package') {
        await mcqExamAdminService.deletePackage(nav.deleteTarget.id)
        toast({ title: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        navDispatch({ type: 'SET_DELETE_TARGET', target: null })
        fetchPackages()
      } else {
        await mcqExamAdminService.deleteSet(nav.deleteTarget.id)
        toast({ title: 'এক্সাম সেট মুছে ফেলা হয়েছে' })
        navDispatch({ type: 'SET_DELETE_TARGET', target: null })
        if (nav.selectedPackageId) fetchPackageDetail(nav.selectedPackageId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const handleBulkCreateSets = async () => {
    if (!bulkCreate.bulkStartDate || !nav.selectedPackageId) {
      if (!nav.selectedPackageId) toast({ title: 'ত্রুটি', description: 'কোনো প্যাকেজ নির্বাচিত নেই', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const json = await mcqExamAdminService.bulkCreateSets({
        packageId: nav.selectedPackageId,
        prefix: bulkCreate.bulkPrefix,
        startDate: bulkCreate.bulkStartDate,
        intervalDays: parseInt(bulkCreate.bulkIntervalDays) || 7,
        count: parseInt(bulkCreate.bulkCount) || 10,
        duration: parseInt(bulkCreate.bulkDuration) || 30,
        marksPerQ: parseFloat(bulkCreate.bulkMarksPerQ) || 1,
        negativeMarks: parseFloat(bulkCreate.bulkNegativeMarks) || 0,
      })
      const data = unwrap<BulkCreateResponse>(json)
      toast({ title: `${data.count || 0}টি এক্সাম সেট তৈরি হয়েছে` })
      bulkCreateDispatch({ type: 'CLOSE' })
      fetchPackageDetail(nav.selectedPackageId)
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleSearchMcqs = useCallback(async () => {
    searchDialogDispatch({ type: 'SET_LOADING', loading: true })
    try {
      const params: AdminQueryParams = { action: 'search-mcqs', page: '1', limit: '30' }
      if (searchDialog.searchMcqClassLevel) params.classLevel = searchDialog.searchMcqClassLevel
      if (searchDialog.searchMcqSubjectId) params.subjectId = searchDialog.searchMcqSubjectId
      if (searchDialog.searchMcqChapterId) params.chapterId = searchDialog.searchMcqChapterId
      if (searchDialog.searchMcqText) params.search = searchDialog.searchMcqText
      const json = await mcqExamAdminService.searchMcqs(params)
      const data = unwrap<SearchMcqsResponse>(json)
      searchDialogDispatch({ type: 'SET_RESULTS', results: data.mcqs || [] })
    } catch (err) { console.error('[MCQExam] Failed to search MCQs:', err) }
    finally { searchDialogDispatch({ type: 'SET_LOADING', loading: false }) }
  }, [searchDialog.searchMcqClassLevel, searchDialog.searchMcqSubjectId, searchDialog.searchMcqChapterId, searchDialog.searchMcqText])

  const fetchSearchMcqSubjects = useCallback(async (classLevel: string) => {
    if (!classLevel) { searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqSubjects', value: [] }); return }
    const cls = classes.find(c => c.slug === classLevel)
    if (!cls) { searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqSubjects', value: [] }); return }
    try {
      const json = await api.get<{ data: SubjectOption[] }>('admin/subjects', { classId: cls.id, isActive: true })
      const data = unwrap(json)
      searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqSubjects', value: Array.isArray(data) ? data : [] })
    } catch (err) { console.error('[MCQExam] Failed to fetch search subjects:', err) }
  }, [classes])

  const fetchSearchMcqChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqChapters', value: [] }); return }
    try {
      const json = await api.get<{ data: { id: string; name: string }[] }>('admin/chapters', { subjectId, isActive: true })
      const data = unwrap(json)
      searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqChapters', value: Array.isArray(data) ? data : [] })
    } catch (err) { console.error('[MCQExam] Failed to fetch search chapters:', err) }
  }, [])

  const handleAddMcqs = async () => {
    if (searchDialog.selectedMcqIds.length === 0 || !nav.selectedSetId) return
    setSaving(true)
    try {
      await mcqExamAdminService.addQuestions(nav.selectedSetId, searchDialog.selectedMcqIds)
      toast({ title: `${searchDialog.selectedMcqIds.length}টি প্রশ্ন যোগ করা হয়েছে` })
      searchDialogDispatch({ type: 'RESET_SELECTED' })
      searchDialogDispatch({ type: 'CLOSE' })
      fetchSetDetail(nav.selectedSetId)
    } catch (err) { console.error('[MCQExam] Failed to add MCQs:', err) }
    finally { setSaving(false) }
  }

  const handleRemoveQuestion = async (mcqId: string) => {
    if (!nav.selectedSetId) return
    try {
      await mcqExamAdminService.removeQuestion(nav.selectedSetId, mcqId)
      toast({ title: 'প্রশ্ন সরানো হয়েছে' })
      fetchSetDetail(nav.selectedSetId)
    } catch (err) { console.error('[MCQExam] Failed to remove question:', err) }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!currentSet?.questions || !nav.selectedSetId) return
    const questions = [...currentSet.questions]
    const idx = questions.findIndex(q => q.id === questionId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= questions.length) return

    ;[questions[idx], questions[swapIdx]] = [questions[swapIdx], questions[idx]]
    const questionOrders = questions.map((q, i) => ({ id: q.id, order: i }))

    try {
      await mcqExamAdminService.reorderQuestions(nav.selectedSetId, questionOrders)
      fetchSetDetail(nav.selectedSetId)
    } catch (err) { console.error('[MCQExam] Failed to reorder questions:', err) }
  }

  const handleBulkUploadMcqs = async () => {
    if (!bulkUpload.bulkUploadFile || !nav.selectedSetId) return
    bulkUploadDispatch({ type: 'SET_LOADING', loading: true })
    bulkUploadDispatch({ type: 'SET_RESULT', result: null })
    try {
      const formData = new FormData()
      formData.append('file', bulkUpload.bulkUploadFile)
      formData.append('setId', nav.selectedSetId)
      formData.append('classLevel', currentPackage?.class?.slug || '')
      if (bulkUpload.bulkUploadSubjectId && bulkUpload.bulkUploadSubjectId !== 'all') {
        formData.append('subjectId', bulkUpload.bulkUploadSubjectId)
      }

      const res = await fetch('/api/admin/mcq-exam-packages/bulk-upload-questions', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        toast({ title: json.data?.message || '' })
        bulkUploadDispatch({ type: 'CLOSE' })
        fetchSetDetail(nav.selectedSetId)
      }
    } catch (err) { console.error('[MCQExam] Failed to bulk upload MCQs:', err) }
    finally { bulkUploadDispatch({ type: 'SET_LOADING', loading: false }) }
  }

  const openLeaderboard = async (setId: string, setTitle: string) => {
    leaderboardDispatch({ type: 'OPEN', setId, setTitle })
    navDispatch({ type: 'SET_VIEW', viewMode: 'leaderboard' })
    try {
      const json = await mcqExamAdminService.getLeaderboard(setId)
      const data = unwrap<LeaderboardResponse>(json)
      leaderboardDispatch({ type: 'SET_DATA', data: data.leaderboard || [] })
    } catch (err) { console.error('[MCQExam] Failed to fetch leaderboard:', err) }
    finally { leaderboardDispatch({ type: 'SET_LOADING', loading: false }) }
  }

  const togglePackageActive = async (pkg: MCQExamPackageRecord) => {
    try {
      await mcqExamAdminService.updatePackage(pkg.id, { isActive: !pkg.isActive })
      toast({ title: pkg.isActive ? 'নিষ্ক্রিয় করা হয়েছে' : 'প্যাকেজ সক্রিয় করা হয়েছে' })
      fetchPackages()
    } catch (err) { console.error('[MCQExam] Failed to toggle package:', err) }
  }

  const fetchRetakeRequests = useCallback(async (setId: string) => {
    retakeDispatch({ type: 'SET_LOADING', loading: true })
    try {
      const json = await api.put('admin/mcq-exam-packages', { action: 'list-retake-requests', setId })
      const data = unwrap<RetakeRequestsResponse>(json)
      retakeDispatch({ type: 'SET_REQUESTS', requests: data.requests || [] })
    } catch {
      retakeDispatch({ type: 'SET_REQUESTS', requests: [] })
    } finally {
      retakeDispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [])

  const handleApproveRetakeRequest = async (requestId: string, approve: boolean) => {
    setSaving(true)
    try {
      await api.put('admin/mcq-exam-packages', { action: 'approve-retake-request', requestId, approve })
      toast({ title: approve ? 'অনুরোধ অনুমোদিত হয়েছে' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে' })
      if (nav.selectedSetId) {
        fetchRetakeRequests(nav.selectedSetId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return {
    viewMode: nav.viewMode, setViewMode: (v: typeof nav.viewMode) => navDispatch({ type: 'SET_VIEW', viewMode: v }),
    editId: nav.editId, setEditId: (v: typeof nav.editId) => navDispatch({ type: 'SET_EDIT_ID', editId: v }),
    selectedPackageId: nav.selectedPackageId, setSelectedPackageId: (v: typeof nav.selectedPackageId) => navDispatch({ type: 'SELECT_PACKAGE', packageId: v }),
    selectedSetId: nav.selectedSetId, setSelectedSetId: (v: typeof nav.selectedSetId) => navDispatch({ type: 'SELECT_SET', setId: v }),
    deleteTarget: nav.deleteTarget, setDeleteTarget: (v: typeof nav.deleteTarget) => navDispatch({ type: 'SET_DELETE_TARGET', target: v }),
    loading, saving,
    packages, total,
    currentPackage, setCurrentPackage,
    examSets, currentSet, setCurrentSet,
    setResults,
    classes, subjects, setSubjects,
    search: filters.search, setSearch: (v: string) => filterDispatch({ type: 'SET_FILTER', field: 'search', value: v }),
    filterClassId: filters.filterClassId, setFilterClassId: (v: string) => filterDispatch({ type: 'SET_FILTER', field: 'filterClassId', value: v }),
    filterStatus: filters.filterStatus, setFilterStatus: (v: string) => filterDispatch({ type: 'SET_FILTER', field: 'filterStatus', value: v }),
    pkgTitle: pkgForm.pkgTitle, setPkgTitle: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgTitle', value: v }),
    pkgDescription: pkgForm.pkgDescription, setPkgDescription: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgDescription', value: v }),
    pkgClassId: pkgForm.pkgClassId, setPkgClassId: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgClassId', value: v }),
    pkgSubjectIds: pkgForm.pkgSubjectIds, setPkgSubjectIds: (v: string[]) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgSubjectIds', value: v }),
    pkgPrice: pkgForm.pkgPrice, setPkgPrice: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgPrice', value: v }),
    pkgOriginalPrice: pkgForm.pkgOriginalPrice, setPkgOriginalPrice: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgOriginalPrice', value: v }),
    pkgThumbnail: pkgForm.pkgThumbnail, setPkgThumbnail: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgThumbnail', value: v }),
    pkgIsActive: pkgForm.pkgIsActive, setPkgIsActive: (v: boolean) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgIsActive', value: v }),
    pkgOrder: pkgForm.pkgOrder, setPkgOrder: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgOrder', value: v }),
    pkgStatus: pkgForm.pkgStatus, setPkgStatus: (v: string) => pkgFormDispatch({ type: 'SET_FIELD', field: 'pkgStatus', value: v }),
    setTitle: setForm.setTitle, setSetTitle: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setTitle', value: v }),
    setDescription: setForm.setDescription, setSetDescription: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setDescription', value: v }),
    setScheduledDate: setForm.setScheduledDate, setSetScheduledDate: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setScheduledDate', value: v }),
    setStartTime: setForm.setStartTime, setSetStartTime: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setStartTime', value: v }),
    setEndTime: setForm.setEndTime, setSetEndTime: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setEndTime', value: v }),
    setDuration: setForm.setDuration, setSetDuration: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setDuration', value: v }),
    setMarksPerQ: setForm.setMarksPerQ, setSetMarksPerQ: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setMarksPerQ', value: v }),
    setNegativeMarks: setForm.setNegativeMarks, setSetNegativeMarks: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setNegativeMarks', value: v }),
    setInstructions: setForm.setInstructions, setSetInstructions: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setInstructions', value: v }),
    setAllowRetake: setForm.setAllowRetake, setSetAllowRetake: (v: boolean) => setFormDispatch({ type: 'SET_FIELD', field: 'setAllowRetake', value: v }),
    setOrder: setForm.setOrder, setSetOrder: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setOrder', value: v }),
    setStatus: setForm.setStatus, setSetStatus: (v: string) => setFormDispatch({ type: 'SET_FIELD', field: 'setStatus', value: v }),
    searchDialogOpen: searchDialog.searchDialogOpen, setSearchDialogOpen: (v: boolean) => searchDialogDispatch({ type: v ? 'OPEN' : 'CLOSE' }),
    searchMcqs: searchDialog.searchMcqs, setSearchMcqs: (v: import('@/features/mcq-exam/types').MCQSearchResult[]) => searchDialogDispatch({ type: 'SET_RESULTS', results: v }), searchMcqLoading: searchDialog.searchMcqLoading,
    selectedMcqIds: searchDialog.selectedMcqIds, setSelectedMcqIds: (v: string[]) => searchDialogDispatch({ type: 'SET_SELECTED_IDS', ids: v }),
    searchMcqClassLevel: searchDialog.searchMcqClassLevel, setSearchMcqClassLevel: (v: string) => searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqClassLevel', value: v }),
    searchMcqSubjectId: searchDialog.searchMcqSubjectId, setSearchMcqSubjectId: (v: string) => searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqSubjectId', value: v }),
    searchMcqChapterId: searchDialog.searchMcqChapterId, setSearchMcqChapterId: (v: string) => searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqChapterId', value: v }),
    searchMcqText: searchDialog.searchMcqText, setSearchMcqText: (v: string) => searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqText', value: v }),
    searchMcqSubjects: searchDialog.searchMcqSubjects, setSearchMcqSubjects: (v: SubjectOption[]) => searchDialogDispatch({ type: 'SET_FIELD', field: 'searchMcqSubjects', value: v }),
    searchMcqChapters: searchDialog.searchMcqChapters,
    resultDetailOpen: resultDetail.resultDetailOpen, setResultDetailOpen: (v: boolean) => { if (v) resultDetailDispatch({ type: 'OPEN', result: resultDetail.selectedResult! }); else resultDetailDispatch({ type: 'CLOSE' }) },
    selectedResult: resultDetail.selectedResult, setSelectedResult: (v: MCQExamSetResultRecord | null) => resultDetailDispatch({ type: 'SET_RESULT', result: v }),
    bulkCreateDialogOpen: bulkCreate.bulkCreateDialogOpen, setBulkCreateDialogOpen: (v: boolean) => bulkCreateDispatch({ type: v ? 'OPEN' : 'CLOSE' }),
    bulkPrefix: bulkCreate.bulkPrefix, setBulkPrefix: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkPrefix', value: v }),
    bulkStartDate: bulkCreate.bulkStartDate, setBulkStartDate: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkStartDate', value: v }),
    bulkIntervalDays: bulkCreate.bulkIntervalDays, setBulkIntervalDays: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkIntervalDays', value: v }),
    bulkCount: bulkCreate.bulkCount, setBulkCount: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkCount', value: v }),
    bulkDuration: bulkCreate.bulkDuration, setBulkDuration: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkDuration', value: v }),
    bulkMarksPerQ: bulkCreate.bulkMarksPerQ, setBulkMarksPerQ: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkMarksPerQ', value: v }),
    bulkNegativeMarks: bulkCreate.bulkNegativeMarks, setBulkNegativeMarks: (v: string) => bulkCreateDispatch({ type: 'SET_FIELD', field: 'bulkNegativeMarks', value: v }),
    leaderboardData: leaderboard.leaderboardData, leaderboardSetTitle: leaderboard.leaderboardSetTitle, leaderboardLoading: leaderboard.leaderboardLoading,
    bulkUploadDialogOpen: bulkUpload.bulkUploadDialogOpen, setBulkUploadDialogOpen: (v: boolean) => bulkUploadDispatch({ type: v ? 'OPEN' : 'CLOSE' }),
    bulkUploadFile: bulkUpload.bulkUploadFile, setBulkUploadFile: (v: File | null) => bulkUploadDispatch({ type: 'SET_FILE', file: v }),
    bulkUploadLoading: bulkUpload.bulkUploadLoading, bulkUploadResult: bulkUpload.bulkUploadResult,
    bulkUploadSubjectId: bulkUpload.bulkUploadSubjectId, setBulkUploadSubjectId: (v: string) => bulkUploadDispatch({ type: 'SET_SUBJECT_ID', subjectId: v }),
    bulkUploadSubjects: bulkUpload.bulkUploadSubjects, setBulkUploadSubjects: (v: SubjectOption[]) => bulkUploadDispatch({ type: 'SET_SUBJECTS', subjects: v }),
    retakeRequests: retakeState.retakeRequests, retakeRequestsLoading: retakeState.retakeRequestsLoading,
    fetchPackages, fetchPackageDetail, fetchSetDetail, fetchResults,
    fetchSubjectsForClass, fetchSearchMcqSubjects, fetchSearchMcqChapters,
    handleSavePackage, handleSaveSet, handleDelete,
    handleBulkCreateSets, handleSearchMcqs, handleAddMcqs,
    handleRemoveQuestion, handleMoveQuestion, handleBulkUploadMcqs,
    openLeaderboard, togglePackageActive,
    fetchRetakeRequests, handleApproveRetakeRequest
  }
}
