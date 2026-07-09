'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { fetchCsrfToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AlertCircle,BookOpen,CheckCircle2,ChevronRight,Crown,FlaskConical,GraduationCap,Layers,Loader2,Lock,Sparkles } from 'lucide-react'
import { useEffect,useMemo,useState } from 'react'

interface ClassItem {
  id: string
  name: string
  slug: string
  order: number
}

interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  order: number
}

interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order: number
}

interface HierarchyData {
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
}

export default function CreateExamPage() {
  const { navigate } = useRouterStore()

  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])

  const [examTitle, setExamTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(20)
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false)
  const [negativeMarks, setNegativeMarks] = useState(0.5)
  const [timeLimit, setTimeLimit] = useState(30)

  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    loading: boolean
    hasAccess: boolean
    checking: boolean
  }>({ loading: false, hasAccess: false, checking: false })
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false)

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const res = await fetch('/api/hierarchy/metadata')
        if (res.ok) {
          const json = await res.json()
          setHierarchy(json.data)
        }
      } catch {
        setError('হায়ারার্কি ডাটা লোড করতে সমস্যা হয়েছে')
      } finally {
        setLoading(false)
      }
    }
    fetchHierarchy()
  }, [])

  const { isAuthenticated } = useAuthStore()

  // Check subscription when class changes
  useEffect(() => {
    if (!selectedClassId || !hierarchy) {
      setSubscriptionStatus({ loading: false, hasAccess: false, checking: false })
      return
    }
    const selectedClass = hierarchy.classes.find(c => c.id === selectedClassId)
    if (!selectedClass) return

    let cancelled = false
    const check = async () => {
      setSubscriptionStatus({ loading: true, hasAccess: false, checking: true })
      try {
        const res = await fetch(`/api/create-exam/check-access?classSlug=${selectedClass.slug}`)
        if (res.ok) {
          const json = await res.json()
          if (!cancelled) {
            setSubscriptionStatus({ loading: false, hasAccess: json.data?.hasAccess || false, checking: false })
          }
        } else {
          if (!cancelled) setSubscriptionStatus({ loading: false, hasAccess: false, checking: false })
        }
      } catch {
        if (!cancelled) setSubscriptionStatus({ loading: false, hasAccess: false, checking: false })
      }
    }
    check()
    return () => { cancelled = true }
  }, [selectedClassId, hierarchy])

  const filteredSubjects = useMemo(() => {
    if (!hierarchy) return []
    return hierarchy.subjects.filter(s => s.classId === selectedClassId)
  }, [hierarchy, selectedClassId])

  const filteredChapters = useMemo(() => {
    if (!hierarchy) return []
    return hierarchy.chapters.filter(c => c.subjectId === selectedSubjectId)
  }, [hierarchy, selectedSubjectId])

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const toggleAllChapters = () => {
    if (selectedChapterIds.length === filteredChapters.length) {
      setSelectedChapterIds([])
    } else {
      setSelectedChapterIds(filteredChapters.map(c => c.id))
    }
  }

  const _selectedClass = hierarchy?.classes.find(c => c.id === selectedClassId)
  const _selectedSubject = filteredSubjects.find(s => s.id === selectedSubjectId)

  const doCreateExam = async (freeOnly: boolean) => {
    setCreating(true)
    setError('')
    try {
      const token = await fetchCsrfToken()
      const res = await fetch('/api/create-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({
          chapterIds: selectedChapterIds,
          questionCount: Math.min(questionCount, 30),
          duration: timeLimit,
          negativeMarks: enableNegativeMarking ? negativeMarks : 0,
          title: examTitle || undefined,
          freeOnly,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.examId) {
        navigate('exam-session', { examId: json.data.examId, source: 'custom' })
      } else {
        setError(json.error || 'পরীক্ষা তৈরি করতে সমস্যা হয়েছে')
      }
    } catch {
      setError('সার্ভারে সংযোগ করতে সমস্যা হয়েছে')
    } finally {
      setCreating(false)
    }
  }

  const handleStartExam = async () => {
    if (selectedChapterIds.length === 0) {
      setError('অন্তত একটি অধ্যায় নির্বাচন করুন')
      return
    }
    // If user doesn't have subscription, show purchase prompt
    if (!subscriptionStatus.hasAccess && isAuthenticated) {
      setShowPurchasePrompt(true)
      return
    }
    doCreateExam(false)
  }

  const handleContinueFree = () => {
    setShowPurchasePrompt(false)
    doCreateExam(true)
  }

  const handleBuyPackage = () => {
    setShowPurchasePrompt(false)
    const selectedClass = hierarchy?.classes.find(c => c.id === selectedClassId)
    navigate('premium', { scrollTarget: selectedClass?.slug || '' })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-40 rounded-xl mb-4" />
        <Skeleton className="h-40 rounded-xl mb-4" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">পরীক্ষা তৈরি করুন</h1>
          <p className="text-sm text-muted-foreground">আপনার পছন্দের অধ্যায় থেকে MCQ পরীক্ষা তৈরি করুন</p>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Class */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              ১. ক্লাস নির্বাচন করুন
            </h2>
            {selectedClassId && subscriptionStatus.checking && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Loader2 className="size-3 animate-spin" />
                চেক করা হচ্ছে...
              </Badge>
            )}
            {selectedClassId && !subscriptionStatus.checking && subscriptionStatus.hasAccess && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 text-xs border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="size-3" />
                সাবস্ক্রাইবড
              </Badge>
            )}
            {selectedClassId && !subscriptionStatus.checking && !subscriptionStatus.hasAccess && isAuthenticated && (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                <Lock className="size-3" />
                ফ্রি কন্টেন্ট
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hierarchy?.classes.map(cls => (
              <button
                key={cls.id}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  selectedClassId === cls.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => {
                  setSelectedClassId(cls.id)
                  setSelectedSubjectId('')
                  setSelectedChapterIds([])
                }}
              >
                <p className="font-medium text-sm">{cls.name}</p>
              </button>
            ))}
          </div>
          {selectedClassId && !subscriptionStatus.checking && !subscriptionStatus.hasAccess && (
            <p className="text-xs text-muted-foreground mt-2">
              শুধুমাত্র ফ্রি MCQ ব্যবহার করা যাবে। সম্পূর্ণ ডাটাসেট পেতে প্যাকেজ কিনুন।
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Subject */}
      <Card className={cn('mb-4', !selectedClassId && 'opacity-50 pointer-events-none')}>
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-primary" />
            ২. বিষয় নির্বাচন করুন
          </h2>
          {selectedClassId ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredSubjects.map(sub => (
                <button
                  key={sub.id}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selectedSubjectId === sub.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => {
                    setSelectedSubjectId(sub.id)
                    setSelectedChapterIds([])
                  }}
                >
                  <p className="font-medium text-sm">{sub.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">প্রথমে ক্লাস নির্বাচন করুন</p>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Chapters */}
      <Card className={cn('mb-4', !selectedSubjectId && 'opacity-50 pointer-events-none')}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              ৩. অধ্যায় নির্বাচন করুন
            </h2>
            {selectedSubjectId && filteredChapters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAllChapters} className="text-xs h-7">
                {selectedChapterIds.length === filteredChapters.length ? 'সব বাতিল' : 'সব নির্বাচন'}
              </Button>
            )}
          </div>
          {selectedSubjectId ? (
            filteredChapters.length > 0 ? (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {filteredChapters.map(ch => (
                  <label
                    key={ch.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer',
                      selectedChapterIds.includes(ch.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox
                      checked={selectedChapterIds.includes(ch.id)}
                      onCheckedChange={() => toggleChapter(ch.id)}
                    />
                    <span className="text-sm font-medium">{ch.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">এই বিষয়ে কোনো অধ্যায় নেই</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">প্রথমে বিষয় নির্বাচন করুন</p>
          )}
          {selectedChapterIds.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{selectedChapterIds.length}টি অধ্যায় নির্বাচিত</p>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Config */}
      <Card className={cn('mb-6', selectedChapterIds.length === 0 && 'opacity-50 pointer-events-none')}>
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <FlaskConical className="size-5 text-primary" />
            ৪. পরীক্ষার সেটিংস
          </h2>
          <div className="space-y-4">
            <div>
              <Label>পরীক্ষার নাম (ঐচ্ছিক)</Label>
              <Input
                placeholder="যেমন: অধ্যায় ১-৫ পরীক্ষা"
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>প্রশ্ন সংখ্যা (সর্বোচ্চ ৩০)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>সময় সীমা (মিনিট)</Label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>নেগেটিভ মার্কিং</Label>
                <p className="text-xs text-muted-foreground">ভুল উত্তরের জন্য নম্বর কাটা যাবে</p>
              </div>
              <Switch
                checked={enableNegativeMarking}
                onCheckedChange={setEnableNegativeMarking}
              />
            </div>

            {enableNegativeMarking && (
              <div className="pl-4 border-l-2 border-primary/30">
                <Label>প্রতি ভুল উত্তরে কাটা হবে</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={0.25}
                    max={5}
                    step={0.25}
                    value={negativeMarks}
                    onChange={e => setNegativeMarks(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">নম্বর</span>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <Button
            className="w-full gap-2 h-12 text-base"
            disabled={creating || selectedChapterIds.length === 0}
            onClick={handleStartExam}
          >
            {creating ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                পরীক্ষা শুরু করুন
                <ChevronRight className="size-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      {/* Purchase Prompt Dialog */}
      <Dialog open={showPurchasePrompt} onOpenChange={setShowPurchasePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="size-5 text-amber-500" />
              প্যাকেজ প্রয়োজন
            </DialogTitle>
            <DialogDescription>
              আপনার এই ক্লাসের জন্য সক্রিয় কোনো প্যাকেজ নেই। আপনি চাইলে শুধুমাত্র ফ্রি MCQ দিয়ে পরীক্ষা দিতে পারেন, অথবা সম্পূর্ণ ডাটাসেটের জন্য প্যাকেজ কিনুন।
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleBuyPackage}
              className="gap-2 h-11"
            >
              <Crown className="size-4" />
              প্যাকেজ কিনুন
            </Button>
            <Button
              variant="outline"
              onClick={handleContinueFree}
              className="gap-2 h-11"
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              ফ্রি কন্টেন্ট দিয়ে চালিয়ে যান
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
