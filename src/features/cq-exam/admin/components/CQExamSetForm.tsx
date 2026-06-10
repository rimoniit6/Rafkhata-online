'use client'

import { useState } from 'react'
import { ArrowLeft, Timer, Calendar, Tag, Loader2, Save, RefreshCw, Settings2, Image, Eye, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CQExamSetRecord, CQExamSetQuestionRecord } from '@/features/cq-exam/types'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

interface CQExamSetFormProps {
  editId: string | null
  currentSet: (CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null
  setTitle: string
  setSetTitle: (v: string) => void
  setDescription: string
  setSetDescription: (v: string) => void
  setScheduledDate: string
  setSetScheduledDate: (v: string) => void
  setStartTime: string
  setSetStartTime: (v: string) => void
  setEndTime: string
  setSetEndTime: (v: string) => void
  setDuration: string
  setSetDuration: (v: string) => void
  setMarksPerQ: string
  setSetMarksPerQ: (v: string) => void
  setInstructions: string
  setSetInstructions: (v: string) => void
  setOrder: string
  setSetOrder: (v: string) => void
  setStatus: string
  setSetStatus: (v: string) => void
  setAllowRetake: boolean
  setSetAllowRetake: (v: boolean) => void
  setAnswerMode: string
  setSetAnswerMode: (v: string) => void
  setShowAnnotatedImages: boolean
  setSetShowAnnotatedImages: (v: boolean) => void
  setAutoPublishResults: boolean
  setSetAutoPublishResults: (v: boolean) => void
  setMaxImagesPerAnswer: string
  setSetMaxImagesPerAnswer: (v: string) => void
  setGradingDeadline: string
  setSetGradingDeadline: (v: string) => void
  setPassMarks: string
  setSetPassMarks: (v: string) => void
  setShowCorrectAnswers: boolean
  setSetShowCorrectAnswers: (v: boolean) => void
  setEnablePartialGrading: boolean
  setSetEnablePartialGrading: (v: boolean) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export function CQExamSetForm({
  editId, currentSet, setTitle, setSetTitle, setDescription, setSetDescription,
  setScheduledDate, setSetScheduledDate, setStartTime, setSetStartTime,
  setEndTime, setSetEndTime, setDuration, setSetDuration, setMarksPerQ, setSetMarksPerQ,
  setInstructions, setSetInstructions, setOrder, setSetOrder, setStatus, setSetStatus,
  setAllowRetake, setSetAllowRetake,
  setAnswerMode, setSetAnswerMode,
  setShowAnnotatedImages, setSetShowAnnotatedImages,
  setAutoPublishResults, setSetAutoPublishResults,
  setMaxImagesPerAnswer, setSetMaxImagesPerAnswer,
  setGradingDeadline, setSetGradingDeadline,
  setPassMarks, setSetPassMarks,
  setShowCorrectAnswers, setSetShowCorrectAnswers,
  setEnablePartialGrading, setSetEnablePartialGrading,
  saving, onSave, onCancel
}: CQExamSetFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const questionCount = currentSet?.totalQuestions || 0
  const autoTotalMarks = parseFloat(setMarksPerQ || '1') * questionCount

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{editId ? 'এক্সাম সেট সম্পাদনা' : 'নতুন এক্সাম সেট'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">সেটের তথ্য পূরণ করুন</p>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4 text-emerald-600" /> সেটের তথ্য
          </Label>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>শিরোনাম *</Label>
            <Input
              placeholder="যেমন: মডেল টেস্ট ১"
              value={setTitle}
              onChange={(e) => setSetTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea
              placeholder="সেটের বিবরণ লিখুন..."
              value={setDescription}
              onChange={(e) => setSetDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> নির্ধারিত তারিখ *
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !setScheduledDate && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {setScheduledDate ? formatDate(setScheduledDate) : 'তারিখ নির্বাচন করুন'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={setScheduledDate ? new Date(setScheduledDate) : undefined}
                    onSelect={(date) => {
                      setSetScheduledDate(date ? date.toISOString().split('T')[0] : '')
                      setDatePickerOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>স্ট্যাটাস</Label>
              <Select value={setStatus} onValueChange={setSetStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">ড্রাফট</SelectItem>
                  <SelectItem value="published">প্রকাশিত</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <RefreshCw className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="allow-retake" className="text-sm font-medium cursor-pointer">
                পুনরায় পরীক্ষা দেওয়ার অনুমতি দিন
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                সক্রিয় থাকলে ব্যবহারকারী একাধিকবার পরীক্ষা দিতে পারবেন
              </p>
            </div>
            <Switch
              id="allow-retake"
              checked={setAllowRetake}
              onCheckedChange={setSetAllowRetake}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>শুরুর সময়</Label>
              <Input type="time" value={setStartTime} onChange={(e) => setSetStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>শেষ সময়</Label>
              <Input type="time" value={setEndTime} onChange={(e) => setSetEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-emerald-600" /> সময়কাল (মিনিট)
              </Label>
              <Input type="number" placeholder="30" value={setDuration} onChange={(e) => setSetDuration(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" /> নম্বর বিবরণ
            </Label>
            <div className="space-y-2">
              <Label>প্রতি প্রশ্নে নম্বর</Label>
              <Input type="number" step="0.5" value={setMarksPerQ} onChange={(e) => setSetMarksPerQ(e.target.value)} />
            </div>

            {questionCount > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">প্রশ্ন সংখ্যা: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{questionCount}</span></span>
                  <span className="text-muted-foreground">মোট নম্বর: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{autoTotalMarks}</span></span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>নির্দেশনা</Label>
            <Textarea placeholder="পরীক্ষার্থীদের জন্য নির্দেশনা লিখুন..." value={setInstructions} onChange={(e) => setSetInstructions(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>ক্রম (Order)</Label>
            <Input type="number" placeholder="0" value={setOrder} onChange={(e) => setSetOrder(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Answer & Evaluation Settings ─── */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-violet-600" /> উত্তর ও মূল্যায়ন সেটিংস
          </Label>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Answer Mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5 text-violet-600" /> উত্তর মোড
            </Label>
            <Select value={setAnswerMode} onValueChange={setSetAnswerMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">টেক্সট + ছবি + সম্পূর্ণ ছবি</SelectItem>
                <SelectItem value="text-only">শুধু টেক্সট</SelectItem>
                <SelectItem value="image-only">শুধু ছবি</SelectItem>
                <SelectItem value="complete-image-only">শুধু সম্পূর্ণ উত্তরের ছবি</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              শিক্ষার্থীরা কিভাবে উত্তর জমা দিতে পারবে তা নির্ধারণ করুন
            </p>
          </div>

          {/* Show Annotated Images */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Eye className="h-4 w-4 text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="show-annotated-images" className="text-sm font-medium cursor-pointer">
                শিক্ষার্থীদের মার্ক করা ছবি দেখান
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                ফলাফলে অ্যাডমিনের মার্ক/অ্যানোটেশন সহ ছবি প্রদর্শন
              </p>
            </div>
            <Switch
              id="show-annotated-images"
              checked={setShowAnnotatedImages}
              onCheckedChange={setSetShowAnnotatedImages}
            />
          </div>

          {/* Auto Publish Results */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Award className="h-4 w-4 text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="auto-publish-results" className="text-sm font-medium cursor-pointer">
                গ্রেডিং শেষে স্বয়ংক্রিয়ভাবে ফলাফল প্রকাশ
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                সকল উত্তর মূল্যায়ন সম্পন্ন হলে ফলাফল স্বয়ংক্রিয়ভাবে প্রকাশিত হবে
              </p>
            </div>
            <Switch
              id="auto-publish-results"
              checked={setAutoPublishResults}
              onCheckedChange={setSetAutoPublishResults}
            />
          </div>

          {/* Max Images Per Answer & Pass Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>প্রতি উত্তরে সর্বোচ্চ ছবি</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={setMaxImagesPerAnswer}
                onChange={(e) => setSetMaxImagesPerAnswer(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                প্রতিটি উত্তর স্লটে শিক্ষার্থী সর্বোচ্চ যতটি ছবি আপলোড করতে পারবে
              </p>
            </div>

            <div className="space-y-2">
              <Label>পাসের নম্বর (০ = নেই)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={setPassMarks}
                onChange={(e) => setSetPassMarks(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                পাস করতে প্রয়োজনীয় ন্যূনতম নম্বর, ০ মানে পাস মার্ক নেই
              </p>
            </div>
          </div>

          {/* Grading Deadline */}
          <div className="space-y-2">
            <Label>মূল্যায়নের শেষ তারিখ</Label>
            <Input
              type="datetime-local"
              value={setGradingDeadline}
              onChange={(e) => setSetGradingDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              মূল্যায়নের জন্য সর্বোচ্চ সময়সীমা (ঐচ্ছিক)
            </p>
          </div>

          <Separator />

          {/* Show Correct Answers */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="show-correct-answers" className="text-sm font-medium cursor-pointer">
                মূল্যায়নের পর সঠিক উত্তর দেখান
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                শিক্ষার্থীরা তাদের উত্তর মূল্যায়নের পর মডেল উত্তর দেখতে পারবে
              </p>
            </div>
            <Switch
              id="show-correct-answers"
              checked={setShowCorrectAnswers}
              onCheckedChange={setSetShowCorrectAnswers}
            />
          </div>

          {/* Enable Partial Grading */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Tag className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="enable-partial-grading" className="text-sm font-medium cursor-pointer">
                আংশিক নম্বর প্রদান
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                উপ-প্রশ্নের জন্য আংশিক নম্বর দেওয়ার অনুমতি
              </p>
            </div>
            <Switch
              id="enable-partial-grading"
              checked={setEnablePartialGrading}
              onCheckedChange={setSetEnablePartialGrading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
            <Button variant="outline" onClick={onCancel}>বাতিল</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
