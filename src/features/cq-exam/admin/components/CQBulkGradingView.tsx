'use client'

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, CheckCircle2, User, Image as ImageIcon, Edit3, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import ImageLightbox from '@/components/ui/image-lightbox'
import ImageAnnotator from '@/components/ui/image-annotator'
import { CQExamSetRecord, CQExamSetQuestionRecord, CQExamSubmissionRecord, CQExamAnswerRecord } from '../../types'

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

interface CQExamAnswerRecordWithSubMarks extends CQExamAnswerRecord {
  subMarks?: number[]
}

interface BulkSubmissionItem {
  id: string
  user: { id: string; name: string | null; email: string; classLevel: string | null }
  status: string
  answers: CQExamAnswerRecordWithSubMarks[]
}

// Memoized submission card to prevent unnecessary re-renders
const SubmissionCard = memo(function SubmissionCard({
  sub,
  selectedQuestion,
  grades,
  bengaliLabels,
  saving,
  annotatingImage,
  setAnnotatingImage,
  setLightboxImages,
  setLightboxIndex,
  setLightboxOpen,
  lightboxImages,
  lightboxIndex,
  handleQuickMark,
  syncedAnswerIds,
  handleAnnotationSave,
  quickMarkButtons,
  cn,
  ImageAnnotator,
  SafeImage,
  RichContentRenderer,
  ImageLightbox,
  User,
  Badge,
  Separator,
  Card,
  CardContent,
  CheckCircle2,
  Clock,
  Edit3,
  ImageIcon,
}: {
  sub: BulkSubmissionItem
  [key: string]: any
}) {
  const userName = sub.user.name || sub.user.email || 'অজানা'
  const classLevel = sub.user.classLevel || ''

  return (
    <Card key={sub.id} className="flex flex-col">
      <CardContent className="p-3 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{sub.user.name || sub.user.email || 'অজানা'}</span>
          {sub.user.classLevel && <Badge variant="outline" className="text-[10px]">{sub.user.classLevel}</Badge>}
        </div>

        <Separator />

        <div className="space-y-2 flex-1">
          {sub.answers.length === 0 ? (
            <p className="text-xs text-muted-foreground">উত্তর দেওয়া হয়নি</p>
          ) : (
            sub.answers.map((ans) => {
              const maxM = ans.maxMarks ?? (selectedQuestion?.marks ?? 5) / 4
              const currentGrade = grades[ans.id]?.obtainedMarks ?? ans.obtainedMarks ?? 0

              return (
                <div key={ans.id} className="space-y-1.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-semibold">{bengaliLabels[ans.subIndex] ?? ans.subIndex}</span>
                  </div>
                  {ans.answerText ? (
                    <RichContentRenderer content={ans.answerText} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">—</p>
                  )}

                  {ans.images.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {ans.images.map((img, imgIdx) => {
                        const isAnnotating = annotatingImage === img.id
                        const allImgs = ans.images.map(i => ({
                          id: i.id, url: i.imageUrl, alt: 'উত্তর',
                        }))
                        return (
                          <div key={img.id} className="relative group">
                            <SafeImage
                              src={img.imageUrl}
                              alt="উত্তর"
                              className={cn(
                                'w-16 h-16 object-cover rounded border cursor-pointer',
                                isAnnotating && 'ring-2 ring-emerald-500'
                              )}
                              onClick={() => {
                                setLightboxImages(allImgs)
                                setLightboxIndex(imgIdx)
                                setLightboxOpen(true)
                              }}
                            />
                            <button
                              type="button"
                              className={cn(
                                'absolute top-0.5 right-0.5 p-0.5 rounded-full text-white transition-all text-[10px]',
                                isAnnotating
                                  ? 'bg-emerald-500 opacity-100'
                                  : 'bg-black/50 opacity-80 hover:opacity-100 hover:bg-emerald-600'
                              )}
                              onClick={(e) => { e.stopPropagation(); setAnnotatingImage(isAnnotating ? null : img.id) }}
                              title="ছবিতে মার্ক করুন"
                            >
                              <Edit3 className="size-3" />
                            </button>
                            {img.annotations && !isAnnotating && (
                              <div className="absolute bottom-0.5 left-0.5 bg-emerald-600/80 text-white text-[8px] px-1 rounded">মার্ক</div>
                            )}
                            {isAnnotating && (
                              <div className="mt-1">
                                <ImageAnnotator
                                  imageUrl={img.imageUrl}
                                  annotations={img.annotations || undefined}
                                  onSave={(ann: string) => handleAnnotationSave(img.id, ann)}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {quickMarkButtons(maxM).map((m: number) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleQuickMark(ans.id, m)}
                        className={cn(
                          'text-[11px] px-1.5 py-0.5 rounded border transition-colors',
                          currentGrade === m
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-border'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {(() => {
          const rawObtained = sub.answers.reduce((s, a) => s + (grades[a.id]?.obtainedMarks ?? a.obtainedMarks ?? 0), 0)
          const questionMarks = selectedQuestion?.marks ?? sub.answers.reduce((s, a) => s + a.maxMarks, 0)
          const isOver = rawObtained > questionMarks
          const hasDirty = sub.answers.some(a => grades[a.id] !== undefined && !syncedAnswerIds.has(a.id))
          const allSynced = sub.answers.length > 0 && sub.answers.every(a => syncedAnswerIds.has(a.id))
          return (
            <div className="pt-1 border-t space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  {hasDirty ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock className="size-3" /> অপরিবর্তিত
                    </span>
                  ) : allSynced ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> সংরক্ষিত
                    </span>
                  ) : null}
                </div>
                <span className={isOver ? 'text-amber-500 font-semibold' : 'text-muted-foreground'}>
                  {rawObtained.toFixed(1)} / {questionMarks}
                </span>
              </div>
              {isOver && <p className="text-[10px] text-amber-500 text-right">সর্বোচ্চ {questionMarks}</p>}
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
})
interface CQBulkGradingViewProps {
  saving: boolean
  set: (CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null
  bulkSubmissions: BulkSubmissionItem[]
  onBulkFetch: (questionId: string) => void
  onSaveBulk: (questionId: string, grades: { submissionId: string; answers: { id: string; obtainedMarks: number }[] }[]) => void
  onBack: () => void
}

function quickMarkButtons(maxMarks: number): number[] {
  if (maxMarks <= 0) return []
  const step = Math.max(0.5, maxMarks / 10)
  const steps: number[] = []
  for (let m = 0; m <= maxMarks; m += step) {
    steps.push(Math.round(m * 10) / 10)
  }
  return steps
}

export function CQBulkGradingView({ saving, set: setData, bulkSubmissions, onBulkFetch, onSaveBulk, onBack }: CQBulkGradingViewProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<{ id: string; url: string; alt?: string }[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [annotatingImage, setAnnotatingImage] = useState<string | null>(null)

  // Track which answer IDs have been saved to DB (not dirty)
  const [syncedAnswerIds, setSyncedAnswerIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    const ids = new Set<string>()
    bulkSubmissions.forEach(sub => sub.answers.forEach(a => { if (a.obtainedMarks != null) ids.add(a.id) }))
    setSyncedAnswerIds(ids)
  }, [bulkSubmissions])

  const handleAnnotationSave = useCallback(async (imageId: string, annotationsJson: string) => {
    try {
      await fetch('/api/admin/cq-exam-packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-annotation', imageId, annotations: annotationsJson }),
      })
      setAnnotatingImage(null)
    } catch {
      /* */
    }
  }, [])

  const questions = setData?.questions || []

  const handleQuestionChange = (qId: string) => {
    setSelectedQuestionId(qId)
    setGrades({})
    onBulkFetch(qId)
  }

  const handleQuickMark = (answerId: string, marks: number) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: { ...prev[answerId], obtainedMarks: marks },
    }))
  }

  const handleSave = () => {
    if (!selectedQuestionId) return
    const gradeKeys = Object.keys(grades)
    if (gradeKeys.length === 0) return
    const payload = bulkSubmissions.map(sub => ({
      submissionId: sub.id,
      answers: sub.answers
        .filter(a => grades[a.id] !== undefined)
        .map(a => ({ id: a.id, obtainedMarks: grades[a.id].obtainedMarks ?? 0 })),
    })).filter(item => item.answers.length > 0)
    onSaveBulk(selectedQuestionId, payload)
    setSyncedAnswerIds(prev => { const n = new Set(prev); gradeKeys.forEach(id => n.add(id)); return n })
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background py-2 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">বাল্ক গ্রেডিং — {setData?.title}</h2>
          <p className="text-sm text-muted-foreground">একই প্রশ্নের জন্য সব শিক্ষার্থীর উত্তর পাশাপাশি দেখুন</p>
        </div>
        {selectedQuestionId && (
          <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            সব সংরক্ষণ করুন
          </Button>
        )}
      </div>

      <div className="max-w-md">
        <label className="text-sm font-medium mb-1 block">প্রশ্ন নির্বাচন করুন</label>
        <Select value={selectedQuestionId} onValueChange={handleQuestionChange}>
          <SelectTrigger>
            <SelectValue placeholder="একটি প্রশ্ন বাছাই করুন..." />
          </SelectTrigger>
          <SelectContent>
            {questions.map((q, idx) => (
              <SelectItem key={q.id} value={q.id}>
                প্রশ্ন {idx + 1} ({q.type === 'typed' ? 'টাইপড' : 'CQ'} — {q.marks} নম্বর)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedQuestion && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">প্রশ্ন বিবরণ:</p>
              <Badge variant="outline" className="text-xs">{selectedQuestion.marks} নম্বর</Badge>
            </div>
            {selectedQuestion.type === 'cq' && selectedQuestion.cq ? (
              <div className="text-sm space-y-1">
                <RichContentRenderer content={selectedQuestion.cq.uddeepok} />
                {[selectedQuestion.cq.question1, selectedQuestion.cq.question2, selectedQuestion.cq.question3, selectedQuestion.cq.question4].map((q, i) => (
                  q ? <p key={i} className="text-xs text-muted-foreground">{bengaliLabels[i]}) {q}</p> : null
                ))}
              </div>
            ) : selectedQuestion.type === 'typed' ? (
              <div className="text-sm space-y-1">
                {selectedQuestion.typedUddeepok && <RichContentRenderer content={selectedQuestion.typedUddeepok} />}
                {[selectedQuestion.typedQuestion1, selectedQuestion.typedQuestion2, selectedQuestion.typedQuestion3, selectedQuestion.typedQuestion4].map((q, i) => (
                  q ? <p key={i} className="text-xs text-muted-foreground">{bengaliLabels[i]}) {q}</p> : null
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">প্রশ্নের বিবরণ পাওয়া যায়নি</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedQuestionId && bulkSubmissions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>এই প্রশ্নের জন্য এখনো কোনো উত্তর জমা পড়েনি</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bulkSubmissions.map(sub => (
          <SubmissionCard
            key={sub.id}
            sub={sub}
            selectedQuestion={selectedQuestion}
            grades={grades}
            bengaliLabels={bengaliLabels}
            saving={saving}
            annotatingImage={annotatingImage}
            setAnnotatingImage={setAnnotatingImage}
            setLightboxImages={setLightboxImages}
            setLightboxIndex={setLightboxIndex}
            setLightboxOpen={setLightboxOpen}
            lightboxImages={lightboxImages}
            lightboxIndex={lightboxIndex}
            handleQuickMark={handleQuickMark}
            syncedAnswerIds={syncedAnswerIds}
            handleAnnotationSave={handleAnnotationSave}
            quickMarkButtons={quickMarkButtons}
            cn={cn}
            ImageAnnotator={ImageAnnotator}
            SafeImage={SafeImage}
            RichContentRenderer={RichContentRenderer}
            ImageLightbox={ImageLightbox}
            User={User}
            Badge={Badge}
            Separator={Separator}
            Card={Card}
            CardContent={CardContent}
            CheckCircle2={CheckCircle2}
            Clock={Clock}
            Edit3={Edit3}
            ImageIcon={ImageIcon}
          />
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setLightboxImages([]); setLightboxIndex(0) }}
        onAnnotate={(imageId) => { setLightboxOpen(false); setAnnotatingImage(imageId) }}
      />
    </motion.div>
  )
}
