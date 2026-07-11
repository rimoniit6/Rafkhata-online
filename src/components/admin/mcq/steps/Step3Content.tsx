'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { Crown, Eye, Save } from 'lucide-react'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { difficultyColors, difficultyLabels } from '../constants'
import type { ClassItem, SubjectItem, ChapterItem, MCQFormData } from '../types'

interface Step3Props {
  form: MCQFormData
  updateForm: (field: string, value: string | boolean) => void
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  boardLabelMap: Record<string, string>
  editId: string | null
  saving: boolean
  saveMCQ: () => Promise<void>
}

export default function Step3Content({
  form, updateForm, classes, subjects, chapters,
  boardLabelMap, editId, saving, saveMCQ,
}: Step3Props) {
  const className = classes.find((c) => c.id === form.classId)?.name || ''
  const subjectName = subjects.find((s) => s.id === form.subjectId)?.name || ''
  const chapterName = chapters.find((ch) => ch.id === form.chapterId)?.name || ''

  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              MCQ প্রিভিউ
            </Label>
            <div className="flex items-center gap-2">
              {form.isPremium && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                  <Crown className="h-3 w-3" />
                  প্রিমিয়াম
                </Badge>
              )}
              <Badge className={difficultyColors[form.difficulty] || ''}>
                {difficultyLabels[form.difficulty] || form.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {className && (
                <Badge variant="outline" className="text-xs">
                  {className}
                </Badge>
              )}
              {subjectName && (
                <Badge variant="outline" className="text-xs">
                  {subjectName}
                </Badge>
              )}
              {chapterName && (
                <Badge variant="outline" className="text-xs">
                  {chapterName}
                </Badge>
              )}
              {form.board && form.board !== 'none' && (
                <Badge variant="outline" className="text-xs">
                  {boardLabelMap[form.board] || form.board}
                </Badge>
              )}
              {form.year && (
                <Badge variant="outline" className="text-xs">
                  {form.year}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                প্রশ্ন
              </p>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <RichContentRenderer content={form.question} className="text-base" />
              </div>
              {form.questionImage && (
                <div className="rounded-xl overflow-hidden border border-border/30 max-w-md">
                  <Image
                    src={form.questionImage}
                    alt="প্রশ্নের ছবি"
                    width={500}
                    height={400}
                    className="w-full object-contain max-h-64"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                অপশন
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optText = form[`option${opt}` as keyof typeof form] as string
                  const optImage = form[`option${opt}Image` as keyof typeof form] as string
                  const isCorrect = form.correctAnswer === opt
                  return (
                    <div
                      key={opt}
                      className={cn(
                        'p-3.5 rounded-xl border-2 transition-all',
                        isCorrect
                          ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                          : 'border-border/50 bg-card'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mt-0.5',
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {opt}
                        </div>
                        <div className="flex-1 min-w-0">
                          {optText && (
                            <RichContentRenderer content={optText} className="text-sm" inline />
                          )}
                          {optImage && (
                            <Image
                              src={optImage}
                              alt={`অপশন ${opt} ছবি`}
                              width={256}
                              height={128}
                              className="mt-2 max-h-32 object-contain rounded"
                              unoptimized
                            />
                          )}
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {(form.explanation || form.explanationImage) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  ব্যাখ্যা
                </p>
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
                  {form.explanation && (
                    <RichContentRenderer content={form.explanation} className="text-sm" />
                  )}
                  {form.explanationImage && (
                    <Image
                      src={form.explanationImage}
                      alt="ব্যাখ্যার ছবি"
                      width={400}
                      height={300}
                      className="mt-2 max-h-48 object-contain rounded"
                      unoptimized
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            প্রিমিয়াম ও প্রকাশ
          </Label>
        </div>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">প্রিমিয়াম কন্টেন্ট</Label>
                <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
              </div>
            </div>
            <Switch
              checked={form.isPremium}
              onCheckedChange={(v) => updateForm('isPremium', v)}
            />
          </div>

          {form.isPremium && (
            <div className="space-y-2">
                <Label className="text-sm font-medium">মূল্য (৳)</Label>
                <Input
                  placeholder="মূল্য লিখুন"
                  value={form.price}
                  onChange={(e) => updateForm('price', e.target.value)}
                  className="max-w-xs"
                />
                {form.price && (
                  <p className="text-xs text-muted-foreground">
                    মূল্য: ৳{form.price}
                  </p>
                )}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">সারসংক্ষেপ</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-xs text-muted-foreground">ক্লাস</p>
                <p className="text-sm font-medium mt-0.5">{className || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-xs text-muted-foreground">বিষয়</p>
                <p className="text-sm font-medium mt-0.5">{subjectName || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-xs text-muted-foreground">অধ্যায়</p>
                <p className="text-sm font-medium mt-0.5">{chapterName || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-xs text-muted-foreground">কঠিনতা</p>
                <p className="text-sm font-medium mt-0.5">
                  {difficultyLabels[form.difficulty] || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 min-w-[160px]"
              onClick={saveMCQ}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
