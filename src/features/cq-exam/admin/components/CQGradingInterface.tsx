'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import ImageAnnotator from '@/components/ui/image-annotator'
import ImageLightbox from '@/components/ui/image-lightbox'
import { Input } from '@/components/ui/input'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn,toBengaliNumerals } from '@/lib/utils'
import {
ArrowLeft,
BookOpen,
CheckCircle2,
Edit3,
ImageIcon,
Loader2,
MessageSquare,
Save,
Star,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useMemo,useRef,useState } from 'react'
import { CQExamAnswerRecord,CQExamSetQuestionRecord,CQExamSetRecord,CQExamSubmissionRecord } from '../../types'

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

interface CQGradingInterfaceProps {
  submission: CQExamSubmissionRecord | null
  set: (CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null
  saving: boolean
  onGrade: (submissionId: string, answers: { answerId: string; obtainedMarks: number; feedback: string }[]) => void
  onBack: () => void
}

export function CQGradingInterface({ submission, set: setData, saving, onGrade, onBack }: CQGradingInterfaceProps) {
  const [answerGrades, setAnswerGrades] = useState<Record<string, { obtainedMarks: number; feedback: string }>>({})
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set())
  const [annotatingImage, setAnnotatingImage] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<{ id: string; url: string; alt?: string; annotations?: string | null }[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = useCallback((images: { id: string; url: string; alt?: string; annotations?: string | null }[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const handleAnnotationSave = useCallback(async (imageId: string, annotations: unknown) => {
    try {
      await fetch('/api/admin/cq-exam-packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-annotation', imageId, annotations }),
      })
      setAnnotatingImage(null)
    } catch {
      /* */
    }
  }, [])

  const submissionIdRef = useRef<string | undefined>(submission?.id)
  if (submission?.id !== submissionIdRef.current) {
    submissionIdRef.current = submission?.id
    if (!submission) {
      setAnswerGrades({})
      setSavedAnswers(new Set())
    } else {
      setAnswerGrades(
        Object.fromEntries(
          submission.answers.map((a) => [
            a.id,
            { obtainedMarks: a.obtainedMarks ?? 0, feedback: a.feedback ?? '' },
          ])
        )
      )
      setSavedAnswers(new Set())
    }
  }

  const handleMarksChange = useCallback((answerId: string, value: string) => {
    const num = parseFloat(value)
    setAnswerGrades(prev => ({
      ...prev,
      [answerId]: {
        obtainedMarks: isNaN(num) ? 0 : num,
        feedback: prev[answerId]?.feedback ?? '',
      },
    }))
    setSavedAnswers(prev => { const next = new Set(prev); next.delete(answerId); return next })
  }, [])

  const handleFeedbackChange = useCallback((answerId: string, value: string) => {
    setAnswerGrades(prev => ({
      ...prev,
      [answerId]: {
        obtainedMarks: prev[answerId]?.obtainedMarks ?? 0,
        feedback: value,
      },
    }))
  }, [])

  const handleSaveAnswer = useCallback((answerId: string) => {
    setSavedAnswers(prev => { const next = new Set(prev); next.add(answerId); return next })
  }, [])

  const handleSubmitGrade = useCallback(async () => {
    if (!submission) return
    const answers = submission.answers.map(a => {
      const grade = answerGrades[a.id]
      return {
        answerId: a.id,
        obtainedMarks: grade?.obtainedMarks ?? a.obtainedMarks ?? 0,
        feedback: grade?.feedback ?? a.feedback ?? '',
      }
    })
    await onGrade(submission.id, answers)
    onBack()
  }, [submission, answerGrades, onGrade, onBack])

  // Build a map of questionId -> question data
  const questionsMap = useMemo(() => {
    const map = new Map<string, CQExamSetQuestionRecord>()
    if (setData?.questions) {
      for (const q of setData.questions) {
        map.set(q.id, q)
      }
    }
    return map
  }, [setData])

  // Group answers by questionId for easier rendering
  const answersByQuestion = useMemo(() => {
    if (!submission) return new Map<string, CQExamAnswerRecord[]>()
    const groups = new Map<string, CQExamAnswerRecord[]>()
    for (const a of submission.answers) {
      if (!groups.has(a.questionId)) groups.set(a.questionId, [])
      groups.get(a.questionId)!.push(a)
    }
    return groups
  }, [submission])

  // Get questions in order
  const orderedQuestionIds = useMemo(() => {
    if (setData?.questions) {
      return setData.questions.map(q => q.id)
    }
    return Array.from(answersByQuestion.keys())
  }, [setData, answersByQuestion])

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">কোনো জমা নির্বাচন করা হয়নি</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>ফিরে যান</Button>
      </div>
    )
  }

  const totalObtained = submission.answers.reduce((sum, a) => {
    const grade = answerGrades[a.id]
    return sum + (grade?.obtainedMarks ?? a.obtainedMarks ?? 0)
  }, 0)

  const totalMax = submission.answers.reduce((sum, a) => sum + (a.maxMarks || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-emerald-600" /> গ্রেডিং ইন্টারফেস
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submission.user?.name || 'অজানা'} • {submission.answers.length}টি উত্তর
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Card className="flex-1 border-border/50">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">মোট নম্বর</span>
            <span className="text-xl font-bold text-emerald-600">
              {totalObtained.toFixed(1)}<span className="text-sm text-muted-foreground">/{totalMax.toFixed(1)}</span>
            </span>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmitGrade}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? 'প্রক্রিয়াধীন...' : 'গ্রেড জমা দিন'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {orderedQuestionIds.map((questionId, qIdx) => {
          const question = questionsMap.get(questionId)
          const answers = answersByQuestion.get(questionId) || []
          const questionType = question?.type || 'cq'
          const isTyped = questionType === 'typed'
          const isNonCq = ['mcq-single', 'mcq-multiple', 'fill-blanks', 'written'].includes(questionType)
          const cq = question?.cq
          const isExpanded = expandedQuestions[questionId] ?? true

          // Parse non-CQ config
          let config: any = {}
          if (isNonCq) {
            config = question?.config || {}
          }

          // Non-CQ question grading interface
          if (isNonCq) {
            const getTypeLabel = () => {
              switch (questionType) {
                case 'mcq-single': return 'MCQ (একক উত্তর)'
                case 'mcq-multiple': return 'MCQ (একাধিক উত্তর)'
                case 'fill-blanks': return 'শূন্যস্থান পূরণ'
                case 'written': return 'রচনামূলক'
                default: return questionType
              }
            }

            return (
              <div key={questionId} className="animate-fade-in-up" style={{ animationDelay: `${qIdx * 0.05}s` }}>
                <Card className="border-border/50 overflow-hidden">
                  <button type="button" onClick={() => setExpandedQuestions(prev => ({ ...prev, [questionId]: !isExpanded }))} className="w-full text-left">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 px-4 py-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{getTypeLabel()}</Badge>
                        <span className="text-xs text-muted-foreground">{question?.marks || 0} নম্বর</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn('text-[10px]', answers.some(a => a.answerText?.trim() || (a.images?.length ?? 0) > 0) ? 'text-emerald-600' : 'text-amber-600')}>
                          {answers.filter(a => a.answerText?.trim() || (a.images?.length ?? 0) > 0).length}/{answers.length} উত্তর
                        </Badge>
                        <span className="text-xs text-muted-foreground">{isExpanded ? 'সংকুচিত' : 'বিস্তারিত'}</span>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <CardContent className="p-4 sm:p-6 space-y-6">
                      {/* Question stem */}
                      {question?.stem && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <BookOpen className="h-3.5 w-3.5" /> প্রশ্ন
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3 border text-sm leading-relaxed">
                            <RichContentRenderer content={question.stem} />
                          </div>
                          {question.stemImage && (
                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                              <SafeImage src={question.stemImage} alt="প্রশ্নের ছবি" className="max-h-40 object-contain mx-auto" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* MCQ answers */}
                      {(questionType === 'mcq-single' || questionType === 'mcq-multiple') && answers.map((answer) => {
                        const maxMarks = answer.maxMarks || 0
                        const grade = answerGrades[answer.id] || { obtainedMarks: answer.obtainedMarks ?? 0, feedback: answer.feedback ?? '' }
                        const isSaved = savedAnswers.has(answer.id)
                        let selectedIdx: number | null = null
                        let selectedIndices: number[] = []
                        try {
                          const ansData = JSON.parse(answer.answerText || '{}')
                          if (questionType === 'mcq-single') selectedIdx = ansData.selectedIndex
                          else selectedIndices = ansData.selectedIndices || []
                        } catch (err) {
                          console.warn('[CQGrading] Failed to parse answer data:', err)
                        }

                        return (
                          <div key={answer.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">ছাত্রের উত্তর</span>
                              <span className="text-xs text-muted-foreground">({maxMarks} নম্বর)</span>
                              {isSaved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                            </div>
                            <div className="space-y-1.5">
                              {config.options?.map((opt: string, oi: number) => {
                                const isSelected = questionType === 'mcq-single' ? selectedIdx === oi : selectedIndices.includes(oi)
                                return (
                                  <div key={oi} className={cn(
                                    'flex items-center gap-3 p-2.5 rounded-lg border text-sm transition-colors',
                                    isSelected ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : 'bg-muted/10'
                                  )}>
                                    <span className={cn(
                                      'size-4 flex items-center justify-center shrink-0 rounded',
                                      questionType === 'mcq-single' ? 'rounded-full' : 'rounded',
                                      isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/30'
                                    )}>
                                      {isSelected && <CheckCircle2 className="size-3" />}
                                    </span>
                                    <span className={isSelected ? 'font-medium' : ''}>{opt}</span>
                                    {isSelected && <Badge variant="secondary" className="text-[10px] ml-auto">নির্বাচিত</Badge>}
                                  </div>
                                )
                              })}
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Star className="h-3 w-3 text-amber-500" /> প্রাপ্ত নম্বর (সর্বোচ্চ {maxMarks})
                                </label>
                                <Input type="number" step="0.5" min={0} max={maxMarks} value={grade.obtainedMarks ?? 0} onChange={(e) => handleMarksChange(answer.id, e.target.value)} className="h-9" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-blue-500" /> মন্তব্য / ফিডব্যাক
                                </label>
                                <Textarea rows={2} value={grade.feedback ?? ''} onChange={(e) => handleFeedbackChange(answer.id, e.target.value)} placeholder="ছাত্রের উত্তরের উপর মন্তব্য..." className="resize-none text-sm min-h-[36px]" />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button size="sm" variant={isSaved ? 'ghost' : 'default'} className={cn('gap-1.5 text-xs', !isSaved && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => handleSaveAnswer(answer.id)} disabled={saving}>
                                {isSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> সংরক্ষিত</> : <><Save className="h-3.5 w-3.5" /> সংরক্ষণ</>}
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Fill-blanks answers */}
                      {questionType === 'fill-blanks' && (
                        <div className="space-y-4">
                          {answers.map((answer, ai) => {
                            const maxMarks = answer.maxMarks || 0
                            const grade = answerGrades[answer.id] || { obtainedMarks: answer.obtainedMarks ?? 0, feedback: answer.feedback ?? '' }
                            const isSaved = savedAnswers.has(answer.id)
                            const blankIdx = answer.subIndex ?? ai

                            return (
                              <div key={answer.id} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center size-7 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0">{toBengaliNumerals(blankIdx + 1)}</span>
                                  <span className="font-semibold text-sm">শূন্যস্থান {toBengaliNumerals(blankIdx + 1)}</span>
                                  <span className="text-xs text-muted-foreground">({maxMarks} নম্বর)</span>
                                  {isSaved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                                </div>
                                <div className="rounded-lg bg-muted/20 p-3 border">
                                  {answer.answerText?.trim() ? (
                                    <p className="text-sm">{answer.answerText}</p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">কোনো উত্তর দেওয়া হয়নি</p>
                                  )}
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Star className="h-3 w-3 text-amber-500" /> প্রাপ্ত নম্বর (সর্বোচ্চ {maxMarks})
                                    </label>
                                    <Input type="number" step="0.5" min={0} max={maxMarks} value={grade.obtainedMarks ?? 0} onChange={(e) => handleMarksChange(answer.id, e.target.value)} className="h-9" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3 text-blue-500" /> মন্তব্য / ফিডব্যাক
                                    </label>
                                    <Textarea rows={2} value={grade.feedback ?? ''} onChange={(e) => handleFeedbackChange(answer.id, e.target.value)} placeholder="ছাত্রের উত্তরের উপর মন্তব্য..." className="resize-none text-sm min-h-[36px]" />
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button size="sm" variant={isSaved ? 'ghost' : 'default'} className={cn('gap-1.5 text-xs', !isSaved && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => handleSaveAnswer(answer.id)} disabled={saving}>
                                    {isSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> সংরক্ষিত</> : <><Save className="h-3.5 w-3.5" /> সংরক্ষণ</>}
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Written answer */}
                      {questionType === 'written' && answers.map((answer) => {
                        const maxMarks = answer.maxMarks || 0
                        const grade = answerGrades[answer.id] || { obtainedMarks: answer.obtainedMarks ?? 0, feedback: answer.feedback ?? '' }
                        const isSaved = savedAnswers.has(answer.id)
                        const hasImages = (answer.images?.length ?? 0) > 0
                        const hasAnnotation = answer.images?.some(img => img.annotations)

                        return (
                          <div key={answer.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{answer.subIndex === 1 ? 'ছবি' : 'লিখিত উত্তর'}</span>
                              <span className="text-xs text-muted-foreground">({maxMarks} নম্বর)</span>
                              {isSaved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                            </div>

                            {/* Text answer (subIndex 0) */}
                            {answer.subIndex === 0 && (
                              <div className={cn('rounded-lg p-3 border', answer.answerText?.trim() ? 'bg-white dark:bg-muted/10' : 'bg-muted/10 border-dashed')}>
                                {answer.answerText?.trim() ? (
                                  <RichContentRenderer content={answer.answerText} className="text-sm leading-relaxed" />
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">কোনো উত্তর দেওয়া হয়নি</p>
                                )}
                              </div>
                            )}

                            {/* Images (subIndex 1) */}
                            {hasImages && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  ছাত্রের আপলোড করা ছবি ({answer.images.length}টি)
                                  {hasAnnotation && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 ml-1">মার্ক করা আছে</Badge>}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {answer.images.map((img, imgIdx) => {
                                    const isAnnotating = annotatingImage === img.id
                                    const allImages = answer.images.map(i => ({ id: i.id, url: i.imageUrl, alt: `উত্তর ছবি ${i.order + 1}` }))
                                    return (
                                      <div key={img.id} className="space-y-1">
                                        <div className={cn('relative group rounded-lg overflow-hidden border transition-all', isAnnotating && 'ring-2 ring-emerald-500', img.annotations && !isAnnotating && 'ring-1 ring-amber-400')}>
                                          <Image src={img.imageUrl} alt={`উত্তর ছবি ${img.order + 1}`} width={400} height={112} className="w-full h-28 object-cover cursor-pointer" onClick={() => openLightbox(allImages, imgIdx)} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} unoptimized />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
<button className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600" onClick={(e) => { e.stopPropagation(); setAnnotatingImage(isAnnotating ? null : img.id) }} aria-label="ছবিতে মার্ক করুন" title="ছবিতে মার্ক করুন"><Edit3 className="h-3.5 w-3.5" /></button>
                                          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">বড় করে দেখুন</div>
                                          {img.annotations && !isAnnotating && <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] px-1.5 py-0.5 rounded-full"><CheckCircle2 className="h-2.5 w-2.5" /> মার্ক করা আছে</div>}
                                          {!img.annotations && !isAnnotating && <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100"><Edit3 className="h-2.5 w-2.5 inline mr-0.5" /> মার্ক করুন</div>}
                                        </div>
                                        {isAnnotating && <ImageAnnotator imageUrl={img.imageUrl} annotations={img.annotations || undefined} onSave={(ann) => handleAnnotationSave(img.id, ann)} />}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {(answer.subIndex === 0 || hasImages) && <Separator />}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> প্রাপ্ত নম্বর (সর্বোচ্চ {maxMarks})</label>
                                <Input type="number" step="0.5" min={0} max={maxMarks} value={grade.obtainedMarks ?? 0} onChange={(e) => handleMarksChange(answer.id, e.target.value)} className="h-9" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3 text-blue-500" /> মন্তব্য / ফিডব্যাক</label>
                                <Textarea rows={2} value={grade.feedback ?? ''} onChange={(e) => handleFeedbackChange(answer.id, e.target.value)} placeholder="ছাত্রের উত্তরের উপর মন্তব্য..." className="resize-none text-sm min-h-[36px]" />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button size="sm" variant={isSaved ? 'ghost' : 'default'} className={cn('gap-1.5 text-xs', !isSaved && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => handleSaveAnswer(answer.id)} disabled={saving}>
                                {isSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> সংরক্ষিত</> : <><Save className="h-3.5 w-3.5" /> সংরক্ষণ</>}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  )}
                </Card>
              </div>
            )
          }

          // CQ / Typed question grading (existing logic)
          let stimulus = ''
          let stimulusImage: string | null = null
          let subQuestions: { text: string; image: string | null }[] = []

          if (isTyped) {
            stimulus = question?.typedUddeepok || ''
            stimulusImage = question?.typedUddeepokImage || null
            subQuestions = [
              { text: question?.typedQuestion1 || '', image: question?.typedQuestion1Image || null },
              { text: question?.typedQuestion2 || '', image: question?.typedQuestion2Image || null },
              { text: question?.typedQuestion3 || '', image: question?.typedQuestion3Image || null },
              { text: question?.typedQuestion4 || '', image: question?.typedQuestion4Image || null },
            ]
          } else if (cq) {
            stimulus = cq.uddeepok
            stimulusImage = cq.uddeepokImage
            subQuestions = [
              { text: cq.question1, image: cq.question1Image },
              { text: cq.question2, image: cq.question2Image },
              { text: cq.question3, image: cq.question3Image },
              { text: cq.question4, image: cq.question4Image },
            ]
          }

          return (
            <div key={questionId} className="animate-fade-in-up" style={{ animationDelay: `${qIdx * 0.05}s` }}>
              <Card className="border-border/50 overflow-hidden">
                <button type="button" onClick={() => setExpandedQuestions(prev => ({ ...prev, [questionId]: !isExpanded }))} className="w-full text-left">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">CQ {toBengaliNumerals(qIdx + 1)}</Badge>
                      {isTyped && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">টাইপকৃত</Badge>}
                      <span className="text-xs text-muted-foreground">{question?.marks || 0} নম্বর</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const answeredCount = answers.filter(a => a.subIndex < 4 && (a.answerText?.trim() || (a.images?.length ?? 0) > 0)).length
                        return <Badge variant="secondary" className={cn('text-[10px]', answeredCount === 4 ? 'text-emerald-600' : 'text-amber-600')}>{answeredCount}/4 উত্তর</Badge>
                      })()}
                      <span className="text-xs text-muted-foreground">{isExpanded ? 'সংকুচিত' : 'বিস্তারিত'}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {stimulus && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><BookOpen className="h-3.5 w-3.5" /> উদ্দীপক</div>
                        <div className="rounded-lg bg-muted/40 p-3 border text-sm leading-relaxed"><RichContentRenderer content={stimulus} /></div>
                        {stimulusImage && <div className="rounded-lg overflow-hidden border bg-muted/30"><SafeImage src={stimulusImage} alt="উদ্দীপকের ছবি" className="max-h-40 object-contain mx-auto" /></div>}
                        <Separator />
                      </div>
                    )}

                    {subQuestions.map((sq, si) => {
                      const actualAnswer = answers.find(a => a.subIndex === si)
                      if (!actualAnswer) return null

                      const maxMarks = actualAnswer.maxMarks || 0
                      const grade = answerGrades[actualAnswer.id] || { obtainedMarks: actualAnswer.obtainedMarks ?? 0, feedback: actualAnswer.feedback ?? '' }
                      const isSaved = savedAnswers.has(actualAnswer.id)
                      const hasImages = (actualAnswer.images?.length ?? 0) > 0
                      const hasAnnotation = actualAnswer.images?.some(img => img.annotations)

                      return (
                        <div key={si} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">{bengaliLabels[si]}</span>
                            <span className="font-semibold text-sm">প্রশ্ন {bengaliLabels[si]}</span>
                            <span className="text-xs text-muted-foreground">({maxMarks} নম্বর)</span>
                            {isSaved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                          </div>

                          {sq.text && <div className="rounded-lg bg-muted/20 p-2.5 border text-sm"><RichContentRenderer content={sq.text} /></div>}
                          {sq.image && <div className="rounded-lg overflow-hidden border bg-muted/30 w-fit max-w-full"><SafeImage src={sq.image} alt={`প্রশ্ন ${bengaliLabels[si]}-এর ছবি`} className="max-h-32 object-contain" /></div>}

                          <div className={cn('rounded-lg p-3 border', actualAnswer.answerText?.trim() ? 'bg-white dark:bg-muted/10 border-muted-foreground/20' : 'bg-muted/10 border-dashed border-muted-foreground/20')}>
                            {actualAnswer.answerText?.trim() ? <RichContentRenderer content={actualAnswer.answerText} className="text-sm leading-relaxed" /> : <p className="text-sm text-muted-foreground italic">কোনো উত্তর দেওয়া হয়নি</p>}
                          </div>

                          {hasImages && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" />
                                ছাত্রের আপলোড করা ছবি ({actualAnswer.images.length}টি)
                                {hasAnnotation && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ml-1">মার্ক করা আছে</Badge>}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {actualAnswer.images.map((img, imgIdx) => {
                                  const isAnnotating = annotatingImage === img.id
                                  const allImages = actualAnswer.images.map(i => ({ id: i.id, url: i.imageUrl, alt: `উত্তর ছবি ${i.order + 1}` }))
                                  return (
                                    <div key={img.id} className="space-y-1">
                                      <div className={cn('relative group rounded-lg overflow-hidden border transition-all', isAnnotating && 'ring-2 ring-emerald-500', img.annotations && !isAnnotating && 'ring-1 ring-amber-400')}>
                                        <Image src={img.imageUrl} alt={`উত্তর ছবি ${img.order + 1}`} width={400} height={112} className="w-full h-28 object-cover cursor-pointer" onClick={() => openLightbox(allImages, imgIdx)} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} unoptimized />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                        <button className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600" onClick={(e) => { e.stopPropagation(); setAnnotatingImage(isAnnotating ? null : img.id) }} aria-label="ছবিতে মার্ক করুন" title="ছবিতে মার্ক করুন"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">বড় করে দেখুন</div>
                                        {img.annotations && !isAnnotating && <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] px-1.5 py-0.5 rounded-full"><CheckCircle2 className="h-2.5 w-2.5" /> মার্ক করা আছে</div>}
                                        {!img.annotations && !isAnnotating && <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100"><Edit3 className="h-2.5 w-2.5 inline mr-0.5" /> মার্ক করুন</div>}
                                      </div>
                                      {isAnnotating && <ImageAnnotator imageUrl={img.imageUrl} annotations={img.annotations || undefined} onSave={(ann) => handleAnnotationSave(img.id, ann)} />}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <Separator />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> প্রাপ্ত নম্বর (সর্বোচ্চ {maxMarks})</label>
                              <Input type="number" step="0.5" min={0} max={maxMarks} value={grade.obtainedMarks ?? 0} onChange={(e) => handleMarksChange(actualAnswer.id, e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3 text-blue-500" /> মন্তব্য / ফিডব্যাক</label>
                              <Textarea rows={2} value={grade.feedback ?? ''} onChange={(e) => handleFeedbackChange(actualAnswer.id, e.target.value)} placeholder="ছাত্রের উত্তরের উপর মন্তব্য... যেমন: ভালো উত্তর, কিন্তু আরও বিস্তারিত প্রয়োজন" className="resize-none text-sm min-h-[36px]" />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button size="sm" variant={isSaved ? 'ghost' : 'default'} className={cn('gap-1.5 text-xs', !isSaved && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => handleSaveAnswer(actualAnswer.id)} disabled={saving}>
                              {isSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> সংরক্ষিত</> : <><Save className="h-3.5 w-3.5" /> সংরক্ষণ</>}
                            </Button>
                          </div>
                        </div>
                      )
                    })}

                    {(() => {
                      const globalAnswer = answers.find(a => a.subIndex === 4)
                      if (!globalAnswer || !globalAnswer.images?.length) return null
                      const isSaved = savedAnswers.has(globalAnswer.id)
                      return (
                        <div className="space-y-3 pt-2 border-t border-dashed border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><ImageIcon className="size-4" /> সম্পূর্ণ প্রশ্নের জন্য ছবি</span>
                            {isSaved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {globalAnswer.images.map((img, gi) => {
                              const globalImgs = globalAnswer.images.map(i => ({ id: i.id, url: i.imageUrl, alt: 'সম্পূর্ণ উত্তরের ছবি' }))
                              return (
                                <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-muted/30">
                                  <SafeImage src={img.imageUrl} alt="সম্পূর্ণ উত্তরের ছবি" className="w-full h-24 object-cover cursor-pointer" onClick={() => openLightbox(globalImgs, gi)} />
                                  <button className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600" aria-label="ছবিতে মার্ক করুন" onClick={(e) => { e.stopPropagation(); setAnnotatingImage(annotatingImage === img.id ? null : img.id) }}><Edit3 className="h-3 w-3" /></button>
                                  {img.annotations && <div className="absolute bottom-1 left-1 bg-emerald-600/80 text-white text-[10px] px-1.5 py-0.5 rounded">মার্ক করা আছে</div>}
                                </div>
                              )
                            })}
                          </div>
                          {annotatingImage && globalAnswer.images.some(img => img.id === annotatingImage) && (
                            <ImageAnnotator imageUrl={globalAnswer.images.find(img => img.id === annotatingImage)!.imageUrl} annotations={globalAnswer.images.find(img => img.id === annotatingImage)!.annotations || undefined} onSave={(ann) => handleAnnotationSave(annotatingImage, ann)} />
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => {
        setLightboxOpen(false)
        setLightboxImages([])
        setLightboxIndex(0)
      }}
      />
    </div>
  )
}
