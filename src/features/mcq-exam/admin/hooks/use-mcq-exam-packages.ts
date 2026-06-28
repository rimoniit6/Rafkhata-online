import {
ClassCategory,
MCQExamPackageRecord,
MCQExamRetakeRequestRecord,
MCQExamSetQuestionRecord,
MCQExamSetRecord,
MCQExamSetResultRecord,
MCQSearchResult,
SubjectOption,
ViewMode
} from '@/features/mcq-exam/types'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api-client'
import { mcqExamAdminService } from '@/services/api/mcq-exam-admin.service'
import { useCallback,useEffect,useRef,useState } from 'react'

// Helper to unwrap apiResponse wrapper: { success: true, data: T } → T
function unwrap<T = unknown>(response: unknown): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data?: T }).data ?? response as T
  }
  return response as T
}

type AdminQueryParams = Record<string, string | number | boolean | undefined | null>
type PackageListResponse = { packages?: MCQExamPackageRecord[]; pagination?: { total?: number } }
type PackageDetailResponse = { package?: MCQExamPackageRecord & { examSets?: MCQExamSetRecord[] } }
type SetDetailResponse = { set?: MCQExamSetRecord & { questions?: MCQExamSetQuestionRecord[] } }
type ResultsResponse = { results?: MCQExamSetResultRecord[] }
type BulkCreateResponse = { count?: number }
type SearchMcqsResponse = { mcqs?: MCQSearchResult[] }
type LeaderboardResponse = { leaderboard?: MCQExamSetResultRecord[] }
type RetakeRequestsResponse = { requests?: MCQExamRetakeRequestRecord[] }

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function useMCQExamPackages() {
  const { toast } = useToast()

  // View management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'package' | 'set'; id: string; packageId?: string } | null>(null)

  // Data states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<MCQExamPackageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [currentPackage, setCurrentPackage] = useState<MCQExamPackageRecord | null>(null)
  const [examSets, setExamSets] = useState<MCQExamSetRecord[]>([])
  const [currentSet, setCurrentSet] = useState<(MCQExamSetRecord & { questions?: MCQExamSetQuestionRecord[] }) | null>(null)
  const [setResults, setSetResults] = useState<MCQExamSetResultRecord[]>([])

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
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  // Package Form Fields
  const [pkgTitle, setPkgTitle] = useState('')
  const [pkgDescription, setPkgDescription] = useState('')
  const [pkgClassId, setPkgClassId] = useState('')
  const [pkgSubjectIds, setPkgSubjectIds] = useState<string[]>([])
  const [pkgPrice, setPkgPrice] = useState('')
  const [pkgOriginalPrice, setPkgOriginalPrice] = useState('')
  const [pkgThumbnail, setPkgThumbnail] = useState('')
  const [pkgIsActive, setPkgIsActive] = useState(true)
  const [pkgOrder, setPkgOrder] = useState('')
  const [pkgStatus, setPkgStatus] = useState('draft')

  // Set Form Fields
  const [setTitle, setSetTitle] = useState('')
  const [setDescription, setSetDescription] = useState('')
  const [setScheduledDate, setSetScheduledDate] = useState('')
  const [setStartTime, setSetStartTime] = useState('00:00')
  const [setEndTime, setSetEndTime] = useState('23:59')
  const [setDuration, setSetDuration] = useState('30')
  const [setMarksPerQ, setSetMarksPerQ] = useState('1')
  const [setNegativeMarks, setSetNegativeMarks] = useState('0')
  const [setInstructions, setSetInstructions] = useState('')
  const [setAllowRetake, setSetAllowRetake] = useState(false)
  const [setOrder, setSetOrder] = useState('0')
  const [setStatus, setSetStatus] = useState('draft')

  // Question Search Dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchMcqs, setSearchMcqs] = useState<MCQSearchResult[]>([])
  const [searchMcqLoading, setSearchMcqLoading] = useState(false)
  const [selectedMcqIds, setSelectedMcqIds] = useState<string[]>([])
  const [searchMcqClassLevel, setSearchMcqClassLevel] = useState('')
  const [searchMcqSubjectId, setSearchMcqSubjectId] = useState('')
  const [searchMcqChapterId, setSearchMcqChapterId] = useState('')
  const [searchMcqText, setSearchMcqText] = useState('')
  const [searchMcqSubjects, setSearchMcqSubjects] = useState<SubjectOption[]>([])
  const [searchMcqChapters, setSearchMcqChapters] = useState<{ id: string; name: string }[]>([])

  // Result Detail Dialog
  const [resultDetailOpen, setResultDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<MCQExamSetResultRecord | null>(null)

  // Bulk Create Sets Dialog
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false)
  const [bulkPrefix, setBulkPrefix] = useState('এক্সাম সেট')
  const [bulkStartDate, setBulkStartDate] = useState('')
  const [bulkIntervalDays, setBulkIntervalDays] = useState('7')
  const [bulkCount, setBulkCount] = useState('10')
  const [bulkDuration, setBulkDuration] = useState('30')
  const [bulkMarksPerQ, setBulkMarksPerQ] = useState('1')
  const [bulkNegativeMarks, setBulkNegativeMarks] = useState('0')

  // Leaderboard
  const [leaderboardData, setLeaderboardData] = useState<MCQExamSetResultRecord[]>([])
  const [_leaderboardSetId, setLeaderboardSetId] = useState<string | null>(null)
  const [leaderboardSetTitle, setLeaderboardSetTitle] = useState('')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Retake Requests
  const [retakeRequests, setRetakeRequests] = useState<MCQExamRetakeRequestRecord[]>([])
  const [retakeRequestsLoading, setRetakeRequestsLoading] = useState(false)

  // Bulk Upload MCQs Dialog
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
    message: string
    totalInSet?: number
  } | null>(null)
  const [bulkUploadSubjectId, setBulkUploadSubjectId] = useState('')
  const [bulkUploadSubjects, setBulkUploadSubjects] = useState<SubjectOption[]>([])

  const fetchClasses = useCallback(async () => {
    try {
      const json = await api.get<{ data: ClassCategory[] }>('admin/classes', { isActive: true })
      const data = unwrap(json)
      setClasses(Array.isArray(data) ? data : [])
    } catch { /* */ }
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const json = await api.get<{ data: SubjectOption[] }>('admin/subjects', { classId, isActive: true })
      const data = unwrap(json)
      setSubjects(Array.isArray(data) ? data : [])
    } catch { /* */ }
  }, [])

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const params: AdminQueryParams = { action: 'list', page: '1', limit: '50' }
      if (debouncedSearch) params.search = debouncedSearch
      if (filterClassId) params.classId = filterClassId
      if (filterStatus) params.status = filterStatus
      const json = await mcqExamAdminService.listPackages(params)
      const data = unwrap<PackageListResponse>(json)
      setPackages(data.packages || [])
      setTotal(data.pagination?.total || 0)
    } catch { /* */ }
    finally { setLoading(false) }
  }, [debouncedSearch, filterClassId, filterStatus])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const fetchPackageDetail = useCallback(async (packageId: string) => {
    setLoading(true)
    try {
      const json = await mcqExamAdminService.getPackageDetail(packageId)
      const data = unwrap<PackageDetailResponse>(json)
      setCurrentPackage(data.package ?? null)
      setExamSets(data.package?.examSets || [])
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  const fetchSetDetail = useCallback(async (setId: string) => {
    setLoading(true)
    try {
      const json = await mcqExamAdminService.getSetDetail(setId)
      const data = unwrap<SetDetailResponse>(json)
      setCurrentSet(data.set ?? null)
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  const fetchResults = useCallback(async (setId: string) => {
    setLoading(true)
    try {
      const json = await mcqExamAdminService.getResults(setId)
      const data = unwrap<ResultsResponse>(json)
      setSetResults(data.results || [])
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  const handleSavePackage = async () => {
    if (!pkgTitle || !pkgClassId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং শ্রেণি আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const data = {
        title: pkgTitle,
        description: pkgDescription || undefined,
        classId: pkgClassId,
        subjectIds: pkgSubjectIds,
        price: parseFloat(pkgPrice) || 0,
        originalPrice: parseFloat(pkgOriginalPrice) || 0,
        thumbnail: pkgThumbnail || undefined,
        isActive: pkgIsActive,
        order: parseInt(pkgOrder) || 0,
        status: pkgStatus,
      }

      if (editId) {
        await mcqExamAdminService.updatePackage(editId, data)
        toast({ title: 'প্যাকেজ আপডেট হয়েছে' })
      } else {
        await mcqExamAdminService.createPackage(data)
        toast({ title: 'প্যাকেজ তৈরি হয়েছে' })
      }
      setViewMode('list')
      fetchPackages()
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleSaveSet = async () => {
    if (!setTitle || !setScheduledDate || !selectedPackageId) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং তারিখ আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const data = {
        title: setTitle,
        description: setDescription || undefined,
        scheduledDate: setScheduledDate,
        startTime: setStartTime,
        endTime: setEndTime,
        duration: parseInt(setDuration) || 30,
        marksPerQ: parseFloat(setMarksPerQ) || 1,
        negativeMarks: parseFloat(setNegativeMarks) || 0,
        allowRetake: setAllowRetake,
        instructions: setInstructions || undefined,
        order: parseInt(setOrder) || 0,
        status: setStatus,
        ...(editId ? {} : { packageId: selectedPackageId }),
      }

      if (editId) {
        await mcqExamAdminService.updateSet(editId, data)
        toast({ title: 'এক্সাম সেট আপডেট হয়েছে' })
      } else {
        await mcqExamAdminService.createSet(data)
        toast({ title: 'এক্সাম সেট তৈরি হয়েছে' })
      }
      fetchPackageDetail(selectedPackageId)
      setViewMode('detail')
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'package') {
        await mcqExamAdminService.deletePackage(deleteTarget.id)
        toast({ title: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        fetchPackages()
      } else {
        await mcqExamAdminService.deleteSet(deleteTarget.id)
        toast({ title: 'এক্সাম সেট মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        if (selectedPackageId) fetchPackageDetail(selectedPackageId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const handleBulkCreateSets = async () => {
    if (!bulkStartDate || !selectedPackageId) {
      if (!selectedPackageId) toast({ title: 'ত্রুটি', description: 'কোনো প্যাকেজ নির্বাচিত নেই', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const json = await mcqExamAdminService.bulkCreateSets({
        packageId: selectedPackageId,
        prefix: bulkPrefix,
        startDate: bulkStartDate,
        intervalDays: parseInt(bulkIntervalDays) || 7,
        count: parseInt(bulkCount) || 10,
        duration: parseInt(bulkDuration) || 30,
        marksPerQ: parseFloat(bulkMarksPerQ) || 1,
        negativeMarks: parseFloat(bulkNegativeMarks) || 0,
      })
      const data = unwrap<BulkCreateResponse>(json)
      toast({ title: `${data.count || 0}টি এক্সাম সেট তৈরি হয়েছে` })
      setBulkCreateDialogOpen(false)
      fetchPackageDetail(selectedPackageId)
    } catch (err: unknown) {
      toast({ title: 'ত্রুটি', description: getErrorMessage(err, 'নেটওয়ার্ক সমস্যা'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleSearchMcqs = useCallback(async () => {
    setSearchMcqLoading(true)
    try {
      const params: AdminQueryParams = { action: 'search-mcqs', page: '1', limit: '30' }
      if (searchMcqClassLevel) params.classLevel = searchMcqClassLevel
      if (searchMcqSubjectId) params.subjectId = searchMcqSubjectId
      if (searchMcqChapterId) params.chapterId = searchMcqChapterId
      if (searchMcqText) params.search = searchMcqText
      const json = await mcqExamAdminService.searchMcqs(params)
      const data = unwrap<SearchMcqsResponse>(json)
      setSearchMcqs(data.mcqs || [])
    } catch { /* */ }
    finally { setSearchMcqLoading(false) }
  }, [searchMcqClassLevel, searchMcqSubjectId, searchMcqChapterId, searchMcqText])

  const fetchSearchMcqSubjects = useCallback(async (classLevel: string) => {
    if (!classLevel) { setSearchMcqSubjects([]); return }
    const cls = classes.find(c => c.slug === classLevel)
    if (!cls) { setSearchMcqSubjects([]); return }
    try {
      const json = await api.get<{ data: SubjectOption[] }>('admin/subjects', { classId: cls.id, isActive: true })
      const data = unwrap(json)
      setSearchMcqSubjects(Array.isArray(data) ? data : [])
    } catch { /* */ }
  }, [classes])

  const fetchSearchMcqChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setSearchMcqChapters([]); return }
    try {
      const json = await api.get<{ data: { id: string; name: string }[] }>('admin/chapters', { subjectId, isActive: true })
      const data = unwrap(json)
      setSearchMcqChapters(Array.isArray(data) ? data : [])
    } catch { /* */ }
  }, [])

  const handleAddMcqs = async () => {
    if (selectedMcqIds.length === 0 || !selectedSetId) return
    setSaving(true)
    try {
      await mcqExamAdminService.addQuestions(selectedSetId, selectedMcqIds)
      toast({ title: `${selectedMcqIds.length}টি প্রশ্ন যোগ করা হয়েছে` })
      setSelectedMcqIds([])
      setSearchDialogOpen(false)
      fetchSetDetail(selectedSetId)
    } catch { /* */ }
    finally { setSaving(false) }
  }

  const handleRemoveQuestion = async (mcqId: string) => {
    if (!selectedSetId) return
    try {
      await mcqExamAdminService.removeQuestion(selectedSetId, mcqId)
      toast({ title: 'প্রশ্ন সরানো হয়েছে' })
      fetchSetDetail(selectedSetId)
    } catch { /* */ }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!currentSet?.questions || !selectedSetId) return
    const questions = [...currentSet.questions]
    const idx = questions.findIndex(q => q.id === questionId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= questions.length) return

    ;[questions[idx], questions[swapIdx]] = [questions[swapIdx], questions[idx]]
    const questionOrders = questions.map((q, i) => ({ id: q.id, order: i }))

    try {
      await mcqExamAdminService.reorderQuestions(selectedSetId, questionOrders)
      fetchSetDetail(selectedSetId)
    } catch { /* */ }
  }

  const handleBulkUploadMcqs = async () => {
    if (!bulkUploadFile || !selectedSetId) return
    setBulkUploadLoading(true)
    setBulkUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', bulkUploadFile)
      formData.append('setId', selectedSetId)
      formData.append('classLevel', currentPackage?.class?.slug || '')
      if (bulkUploadSubjectId && bulkUploadSubjectId !== 'all') {
        formData.append('subjectId', bulkUploadSubjectId)
      }

      const res = await fetch('/api/admin/mcq-exam-packages/bulk-upload-questions', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        toast({ title: json.data?.message || '' })
        setBulkUploadDialogOpen(false)
        setBulkUploadFile(null)
        setBulkUploadResult(null)
        fetchSetDetail(selectedSetId)
      }
    } catch { /* */ }
    finally { setBulkUploadLoading(false) }
  }

  const openLeaderboard = async (setId: string, setTitle: string) => {
    setLeaderboardSetId(setId)
    setLeaderboardSetTitle(setTitle)
    setLeaderboardData([])
    setLeaderboardLoading(true)
    setViewMode('leaderboard')
    try {
      const json = await mcqExamAdminService.getLeaderboard(setId)
      const data = unwrap<LeaderboardResponse>(json)
      setLeaderboardData(data.leaderboard || [])
    } catch { /* */ }
    finally { setLeaderboardLoading(false) }
  }

  const togglePackageActive = async (pkg: MCQExamPackageRecord) => {
    try {
      await mcqExamAdminService.updatePackage(pkg.id, { isActive: !pkg.isActive })
      toast({ title: pkg.isActive ? 'নিষ্ক্রিয় করা হয়েছে' : 'প্যাকেজ সক্রিয় করা হয়েছে' })
      fetchPackages()
    } catch { /* */ }
  }

  const fetchRetakeRequests = useCallback(async (setId: string) => {
    setRetakeRequestsLoading(true)
    try {
      const json = await api.put('admin/mcq-exam-packages', { action: 'list-retake-requests', setId })
      const data = unwrap<RetakeRequestsResponse>(json)
      setRetakeRequests(data.requests || [])
    } catch {
      setRetakeRequests([])
    } finally {
      setRetakeRequestsLoading(false)
    }
  }, [])

  const handleApproveRetakeRequest = async (requestId: string, approve: boolean) => {
    setSaving(true)
    try {
      await api.put('admin/mcq-exam-packages', { action: 'approve-retake-request', requestId, approve })
      toast({ title: approve ? 'অনুরোধ অনুমোদিত হয়েছে' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে' })
      if (selectedSetId) {
        fetchRetakeRequests(selectedSetId)
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

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
    setResults,
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
    pkgOrder, setPkgOrder,
    pkgStatus, setPkgStatus,
    setTitle, setSetTitle,
    setDescription, setSetDescription,
    setScheduledDate, setSetScheduledDate,
    setStartTime, setSetStartTime,
    setEndTime, setSetEndTime,
    setDuration, setSetDuration,
    setMarksPerQ, setSetMarksPerQ,
    setNegativeMarks, setSetNegativeMarks,
    setInstructions, setSetInstructions,
    setAllowRetake, setSetAllowRetake,
    setOrder, setSetOrder,
    setStatus, setSetStatus,
    searchDialogOpen, setSearchDialogOpen,
    searchMcqs, setSearchMcqs, searchMcqLoading,
    selectedMcqIds, setSelectedMcqIds,
    searchMcqClassLevel, setSearchMcqClassLevel,
    searchMcqSubjectId, setSearchMcqSubjectId,
    searchMcqChapterId, setSearchMcqChapterId,
    searchMcqText, setSearchMcqText,
    searchMcqSubjects, setSearchMcqSubjects,
    searchMcqChapters,
    resultDetailOpen, setResultDetailOpen,
    selectedResult, setSelectedResult,
    bulkCreateDialogOpen, setBulkCreateDialogOpen,
    bulkPrefix, setBulkPrefix,
    bulkStartDate, setBulkStartDate,
    bulkIntervalDays, setBulkIntervalDays,
    bulkCount, setBulkCount,
    bulkDuration, setBulkDuration,
    bulkMarksPerQ, setBulkMarksPerQ,
    bulkNegativeMarks, setBulkNegativeMarks,
    leaderboardData, leaderboardSetTitle, leaderboardLoading,
    bulkUploadDialogOpen, setBulkUploadDialogOpen,
    bulkUploadFile, setBulkUploadFile,
    bulkUploadLoading, bulkUploadResult,
    bulkUploadSubjectId, setBulkUploadSubjectId,
    bulkUploadSubjects, setBulkUploadSubjects,
    retakeRequests, retakeRequestsLoading,
    fetchPackages, fetchPackageDetail, fetchSetDetail, fetchResults,
    fetchSubjectsForClass, fetchSearchMcqSubjects, fetchSearchMcqChapters,
    handleSavePackage, handleSaveSet, handleDelete,
    handleBulkCreateSets, handleSearchMcqs, handleAddMcqs,
    handleRemoveQuestion, handleMoveQuestion, handleBulkUploadMcqs,
    openLeaderboard, togglePackageActive,
    fetchRetakeRequests, handleApproveRetakeRequest
  }
}
