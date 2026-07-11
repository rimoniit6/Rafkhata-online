import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlignLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Sigma,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import type { StepNumber, ViewMode, CQForm, ClassItem, SubjectItem, ChapterItem } from './types'
import { difficultyLabels, difficultyColors } from './types'
import StepIndicator from './StepIndicator'
import QAPairCard from './QAPairCard'

interface CQEditorViewProps {
  editId: string | null
  currentStep: StepNumber
  form: CQForm
  setForm: React.Dispatch<React.SetStateAction<CQForm>>
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  boardOptions: { value: string; label: string }[]
  boardLabelMap: Record<string, string>
  classSlug: string
  setViewMode: (mode: ViewMode) => void
  handleSave: () => Promise<void>
  canGoNext: () => boolean
  goNext: () => void
  goPrev: () => void
  saving: boolean
}

export default function CQEditorView({
  editId,
  currentStep,
  form,
  setForm,
  classes,
  subjects,
  chapters,
  boardOptions,
  boardLabelMap,
  classSlug,
  setViewMode,
  handleSave,
  canGoNext,
  goNext,
  goPrev,
  saving,
}: CQEditorViewProps) {
  const bengaliNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }
  const selectedSubject = subjects.find((s) => s.id === form.subjectId)
  const selectedChapter = chapters.find((ch) => ch.id === form.chapterId)
  const selectedClass = classes.find((c) => c.id === form.classId)

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode('list')} aria-label="ফিরে যান">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {editId ? 'CQ সম্পাদনা' : 'নতুন CQ যোগ করুন'}
            </h1>
            <p className="text-sm text-muted-foreground">ধাপ {currentStep}/৩</p>
          </div>
        </div>
        {editId && (
          <Badge variant="outline" className="text-xs">ID: {editId.slice(-8)}</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlignLeft className="h-5 w-5 text-emerald-600" />
                  উদ্দীপক
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">উদ্দীপক লিখুন *</Label>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Sigma className="h-3 w-3" /> $...$ দিয়ে ম্যাথ লিখুন
                    </span>
                  </div>
                  <Textarea
                    placeholder="উদ্দীপক লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)"
                    value={form.uddeepok}
                    onChange={(e) => setForm({ ...form, uddeepok: e.target.value })}
                    rows={6}
                    className="text-base min-h-[150px]"
                  />
                </div>
                <ImageUploader
                  value={form.uddeepokImage}
                  onChange={(url) => setForm({ ...form, uddeepokImage: url })}
                  label="উদ্দীপকের ছবি"
                  placeholder="উদ্দীপকের ছবি আপলোড করুন"
                />
              </CardContent>
            </Card>

            {[1, 2, 3, 4].map((n) => (
              <QAPairCard
                key={n}
                number={n as 1 | 2 | 3 | 4}
                question={form[`question${n}` as keyof typeof form] as string}
                questionImage={form[`question${n}Image` as keyof typeof form] as string}
                answer={form[`answer${n}` as keyof typeof form] as string}
                answerImage={form[`answer${n}Image` as keyof typeof form] as string}
                onQuestionChange={(v) => setForm({ ...form, [`question${n}`]: v })}
                onQuestionImageChange={(v) => setForm({ ...form, [`question${n}Image`]: v })}
                onAnswerChange={(v) => setForm({ ...form, [`answer${n}`]: v })}
                onAnswerImageChange={(v) => setForm({ ...form, [`answer${n}Image`]: v })}
              />
            ))}

            {!form.uddeepok && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                * উদ্দীপক, প্রশ্ন ১ ও উত্তর ১ আবশ্যক
              </p>
            )}
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  শ্রেণি, বিষয় ও অধ্যায়
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">শ্রেণি *</Label>
                    <Select
                      value={form.classId}
                      onValueChange={(v) => setForm({ ...form, classId: v, subjectId: '', chapterId: '' })}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue placeholder="শ্রেণি নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.classId && classSlug && (
                      <p className="text-xs text-muted-foreground">Slug: {classSlug}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">বিষয় *</Label>
                    <Select
                      value={form.subjectId}
                      onValueChange={(v) => setForm({ ...form, subjectId: v, chapterId: '' })}
                      disabled={!form.classId}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue placeholder="বিষয় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">অধ্যায় *</Label>
                    <Select
                      value={form.chapterId}
                      onValueChange={(v) => setForm({ ...form, chapterId: v })}
                      disabled={!form.subjectId}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue placeholder="অধ্যায় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  মেটাডাটা
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">বোর্ড</Label>
                    <Select
                      value={form.board}
                      onValueChange={(v) => setForm({ ...form, board: v })}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue placeholder="বোর্ড নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">কোনোটি নয়</SelectItem>
                        {boardOptions.map((b) => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">সাল</Label>
                    <Input
                      type="text"
                      placeholder="সাল লিখুন (যেমন: 2024)"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      className="h-11 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">টপিক</Label>
                    <Input
                      placeholder="টপিক লিখুন (ঐচ্ছিক)"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="h-11 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">কঠিনতা *</Label>
                    <Select
                      value={form.difficulty}
                      onValueChange={(v) => setForm({ ...form, difficulty: v as 'easy' | 'medium' | 'hard' })}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">সহজ</SelectItem>
                        <SelectItem value="medium">মাঝারি</SelectItem>
                        <SelectItem value="hard">কঠিন</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">প্রিমিয়াম</Label>
                      <Switch
                        checked={form.isPremium}
                        onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                      />
                    </div>
                    {form.isPremium && (
                      <Input
                        placeholder="মূল্য (৳)"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="h-11 text-base"
                        type="number"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {(!form.classId || !form.subjectId || !form.chapterId) && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                * শ্রেণি, বিষয় ও অধ্যায় আবশ্যক
              </p>
            )}
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-2 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5 text-emerald-600" />
                    CQ প্রিভিউ
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {form.isPremium && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                        <Crown className="h-3 w-3" /> প্রিমিয়াম {form.price ? `৳${form.price}` : ''}
                      </Badge>
                    )}
                    <Badge className={difficultyColors[form.difficulty] || ''}>
                      {difficultyLabels[form.difficulty] || form.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="flex flex-wrap gap-2 text-sm">
                  {selectedClass && <Badge variant="outline">{selectedClass.name}</Badge>}
                  {selectedSubject && <Badge variant="outline">{selectedSubject.name}</Badge>}
                  {selectedChapter && <Badge variant="outline">{selectedChapter.name}</Badge>}
                  {form.board && form.board !== 'none' && (
                    <Badge variant="outline">{boardLabelMap[form.board] || form.board}</Badge>
                  )}
                  {form.year && (
                    <Badge variant="outline">{form.year}</Badge>
                  )}
                  {form.topic && <Badge variant="outline">{form.topic}</Badge>}
                </div>

                <Separator />

                {form.uddeepok && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">উদ্দীপক</h3>
                    <div className="rounded-lg bg-muted/50 p-4 border">
                      <RichContentRenderer content={form.uddeepok} className="text-base leading-relaxed" />
                    </div>
                    {form.uddeepokImage && (
                      <div className="rounded-lg overflow-hidden border bg-muted/30">
                        <Image src={form.uddeepokImage} alt="উদ্দীপকের ছবি" width={500} height={400} className="max-h-64 object-contain mx-auto" unoptimized />
                      </div>
                    )}
                  </div>
                )}

                {[1, 2, 3, 4].map((n) => {
                  const q = form[`question${n}` as keyof typeof form] as string
                  const qImg = form[`question${n}Image` as keyof typeof form] as string
                  const a = form[`answer${n}` as keyof typeof form] as string
                  const aImg = form[`answer${n}Image` as keyof typeof form] as string
                  if (!q && !a) return null

                  return (
                    <div key={n} className="space-y-3">
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          প্রশ্ন {bengaliNums[n]}
                        </h4>
                        {q && (
                          <div className="rounded-lg bg-muted/50 p-3 border">
                            <RichContentRenderer content={q} className="text-base" />
                          </div>
                        )}
                        {qImg && (
                          <div className="rounded-lg overflow-hidden border bg-muted/30">
                            <Image src={qImg} alt={`প্রশ্ন ${bengaliNums[n]}-এর ছবি`} width={400} height={300} className="max-h-48 object-contain mx-auto" unoptimized />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          উত্তর {bengaliNums[n]}
                        </h4>
                        {a && (
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800">
                            <RichContentRenderer content={a} className="text-base" />
                          </div>
                        )}
                        {aImg && (
                          <div className="rounded-lg overflow-hidden border bg-muted/30">
                            <Image src={aImg} alt={`উত্তর ${bengaliNums[n]}-এর ছবি`} width={400} height={300} className="max-h-48 object-contain mx-auto" unoptimized />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  প্রকাশনা সেটিংস
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={form.isPremium}
                      onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                    />
                    <div>
                      <Label className="text-base font-semibold cursor-pointer">প্রিমিয়াম কন্টেন্ট</Label>
                      <p className="text-xs text-muted-foreground">প্রিমিয়াম সক্রিয় করলে শুধুমাত্র অর্থপ্রদানকারী ব্যবহারকারী দেখতে পাবেন</p>
                    </div>
                  </div>
                  {form.isPremium && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">মূল্য:</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                        <Input
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="pl-7 h-11 w-32 text-base"
                          type="number"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {form.isPremium && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      এই CQ টি প্রিমিয়াম হিসেবে প্রকাশিত হবে {form.price ? `(৳${form.price})` : '(মূল্য নির্ধারণ করুন)'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-2 pb-6">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={goPrev} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            বাতিল
          </Button>
          {currentStep < 3 ? (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={goNext}
              disabled={!canGoNext()}
            >
              পরবর্তী <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[160px]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
