'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ChevronDown, Sigma } from 'lucide-react'
import type { ClassItem, SubjectItem, ChapterItem, MCQFormData } from '../types'
import type { StepNumber } from '../types'

interface Step2Props {
  form: MCQFormData
  updateForm: (field: string, value: string | boolean) => void
  currentStep: StepNumber
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  formClassSlug: string
  boardOptions: { value: string; label: string }[]
}

export default function Step2Content({
  form, updateForm, currentStep, classes, subjects, chapters,
  formClassSlug, boardOptions,
}: Step2Props) {
  return (
    <div className="space-y-6">
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-emerald-600" />
            ক্লাস → বিষয় → অধ্যায়
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                ক্লাস <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.classId}
                onValueChange={(v) => {
                  updateForm('classId', v)
                }}
              >
                <SelectTrigger className={cn(!form.classId && currentStep === 2 ? "border-red-400" : "")}>
                  <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formClassSlug && (
                <p className="text-xs text-muted-foreground">
                  Slug: {formClassSlug}
                </p>
              )}
              {!form.classId && currentStep === 2 && (
                <p className="text-xs text-red-500">ক্লাস নির্বাচন করুন</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                বিষয় <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.subjectId}
                onValueChange={(v) => updateForm('subjectId', v)}
                disabled={!form.classId}
              >
                <SelectTrigger className={cn(form.classId && !form.subjectId && currentStep === 2 ? "border-red-400" : "")}>
                  <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.classId && !form.subjectId && currentStep === 2 && (
                <p className="text-xs text-red-500">বিষয় নির্বাচন করুন</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                অধ্যায় <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.chapterId}
                onValueChange={(v) => updateForm('chapterId', v)}
                disabled={!form.subjectId}
              >
                <SelectTrigger className={cn(form.subjectId && !form.chapterId && currentStep === 2 ? "border-red-400" : "")}>
                  <SelectValue placeholder="অধ্যায় নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.subjectId && !form.chapterId && currentStep === 2 && (
                <p className="text-xs text-red-500">অধ্যায় নির্বাচন করুন</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sigma className="h-4 w-4 text-purple-600" />
            মেটাডাটা
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">বোর্ড</Label>
              <Select value={form.board} onValueChange={(v) => updateForm('board', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="বোর্ড নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">কোনোটি নয়</SelectItem>
                  {boardOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">সাল</Label>
              <Input
                type="text"
                placeholder="সাল লিখুন (যেমন: 2024)"
                value={form.year}
                onChange={(e) => updateForm('year', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">টপিক</Label>
              <Input
                placeholder="টপিক লিখুন (ঐচ্ছিক)"
                value={form.topic}
                onChange={(e) => updateForm('topic', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                কঠিনতা <span className="text-destructive">*</span>
              </Label>
              <Select value={form.difficulty} onValueChange={(v) => updateForm('difficulty', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">সহজ</SelectItem>
                  <SelectItem value="medium">মাঝারি</SelectItem>
                  <SelectItem value="hard">কঠিন</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ট্যাগ (কমা দিয়ে আলাদা)</Label>
              <Input
                placeholder="ট্যাগ১, ট্যাগ২..."
                value={form.tags}
                onChange={(e) => updateForm('tags', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
