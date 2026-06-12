'use client'

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Crown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sigma,
  Check,
  Eye,
  Sparkles,
  Save,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  FileQuestion,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import ImageUploader from '@/components/ui/image-uploader'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'
import BulkImportDialog from '@/components/admin/BulkImportDialog'
import { useMCQAdmin } from './mcq/use-mcq-admin'
import { difficultyLabels, difficultyColors, STEPS, emptyForm } from './mcq/constants'
import type { MCQRecord, StepNumber } from './mcq/types'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'

export default function AdminMCQPage() {
  const admin = useMCQAdmin()

  const {
    loading, mcqs, total, search, setSearch,
    classFilter, setClassFilter, boardFilter, setBoardFilter,
    yearFilter, setYearFilter, difficultyFilter, setDifficultyFilter,
    premiumFilter, setPremiumFilter, page, setPage,
    deleteId, setDeleteId, bulkImportOpen, setBulkImportOpen,
    viewMode, currentStep, setCurrentStep,
    editId, saving, form, setForm,
    classes, subjects, chapters, formClassSlug,
    isStep1Valid, isStep2Valid,
    boardOptions, classLabelMap, boardLabelMap,
    openCreate, openEdit, handleNext, handlePrev, saveMCQ, deleteMCQ,
    fetchMcqs, setViewMode, setSubjects, setChapters, canGoNext,
  } = admin

  const { toast } = useToast()
  const selection = useTableSelection(mcqs)

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/mcq?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        selection.clearSelection()
        fetchMcqs()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }, [selection, fetchMcqs, toast])

  const perPage = 10

  // ─── Helper: update form field ─────────────────────────────
  const updateForm = useCallback((field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [setForm])

  // ─── Step Indicator ────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex flex-wrap items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  // Can only go back to completed steps or current
                  if (step.id <= currentStep) setCurrentStep(step.id as StepNumber)
                }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300',
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
                    : isCompleted
                      ? 'opacity-80 hover:opacity-100 cursor-pointer'
                      : 'opacity-40 cursor-default'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : isCompleted
                        ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:inline',
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {/* Mobile: show short label */}
                <span
                  className={cn(
                    'text-[10px] font-medium sm:hidden',
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.id}
                </span>
              </button>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-6 sm:w-10 sm:w-16 h-0.5 mx-1 rounded-full transition-colors duration-300',
                  currentStep > step.id
                    ? 'bg-emerald-400'
                    : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )

  // ─── Step 1: মৌলিক তথ্য ──────────────────────────────────
  const Step1Content = () => (
    <div className="space-y-6">
      {/* Question */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-emerald-600" />
            প্রশ্ন
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                প্রশ্নের টেক্সট <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sigma className="h-3.5 w-3.5" />
                $...$ দিয়ে ম্যাথ লিখুন
              </div>
            </div>
            <Textarea
              placeholder="প্রশ্ন লিখুন... ম্যাথের জন্য $x^2$ ব্যবহার করুন"
              value={form.question}
              onChange={(e) => updateForm('question', e.target.value)}
              rows={4}
              className={cn("text-base resize-y", !form.question.trim() && currentStep === 1 && form.question !== '' ? "border-red-400 focus:border-red-500" : "")}
            />
            {!form.question.trim() && currentStep === 1 && form.question !== '' && (
              <p className="text-xs text-red-500">প্রশ্নের টেক্সট আবশ্যক</p>
            )}
          </div>
          <ImageUploader
            value={form.questionImage}
            onChange={(url) => updateForm('questionImage', url)}
            label="প্রশ্নের ছবি (ঐচ্ছিক)"
            placeholder="প্রশ্নের ছবি আপলোড করুন"
          />
        </CardContent>
      </Card>

      {/* Options A-D */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-purple-600 text-white text-xs font-bold">
              ?
            </span>
            অপশন এ-ডি
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
              <div
                key={opt}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  form.correctAnswer === opt
                    ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                    : 'border-border/50 bg-card'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold',
                      form.correctAnswer === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt}
                  </div>
                  <Label className="text-sm font-medium flex-1">
                    অপশন {opt} <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => updateForm('correctAnswer', opt)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors',
                      form.correctAnswer === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    সঠিক
                  </button>
                </div>
                <Input
                  placeholder={`অপশন ${opt} লিখুন...`}
                  value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => updateForm(`option${opt}`, e.target.value)}
                  className={cn("mb-3", !form[`option${opt}` as keyof typeof form]?.toString().trim() && currentStep === 1 && form[`option${opt}` as keyof typeof form] !== '' ? "border-red-400 focus:border-red-500" : "")}
                />
                <ImageUploader
                  value={form[`option${opt}Image` as keyof typeof form] as string}
                  onChange={(url) => updateForm(`option${opt}Image`, url)}
                  placeholder="ছবি (ঐচ্ছিক)"
                />
              </div>
            ))}
          </div>

          {/* Correct Answer Radio */}
          <div className="pt-2">
            <Label className="text-sm font-medium mb-2 block">
              সঠিক উত্তর নির্বাচন <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={form.correctAnswer}
              onValueChange={(v) => updateForm('correctAnswer', v)}
              className="flex gap-3"
            >
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`ans-${opt}`} />
                  <Label htmlFor={`ans-${opt}`} className="cursor-pointer font-medium">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            ব্যাখ্যা
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">ব্যাখ্যার টেক্সট (ঐচ্ছিক)</Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sigma className="h-3.5 w-3.5" />
                $...$ ম্যাথ
              </div>
            </div>
            <Textarea
              placeholder="ব্যাখ্যা লিখুন... ম্যাথের জন্য $...$ ব্যবহার করুন"
              value={form.explanation}
              onChange={(e) => updateForm('explanation', e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <ImageUploader
            value={form.explanationImage}
            onChange={(url) => updateForm('explanationImage', url)}
            label="ব্যাখ্যার ছবি (ঐচ্ছিক)"
            placeholder="ব্যাখ্যার ছবি আপলোড করুন"
          />
        </CardContent>
      </Card>
    </div>
  )

  // ─── Step 2: হায়ারার্কি ও মেটাডাটা ──────────────────────
  const Step2Content = () => (
    <div className="space-y-6">
      {/* Hierarchy */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-emerald-600" />
            ক্লাস → বিষয় → অধ্যায়
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Class */}
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

            {/* Subject */}
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

            {/* Chapter */}
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

      {/* Metadata */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-5 py-3.5 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sigma className="h-4 w-4 text-purple-600" />
            মেটাডাটা
          </Label>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Board */}
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

            {/* Year */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">সাল</Label>
              <Input
                type="text"
                placeholder="সাল লিখুন (যেমন: 2024)"
                value={form.year}
                onChange={(e) => updateForm('year', e.target.value)}
              />
            </div>

            {/* Topic */}
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
            {/* Difficulty */}
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

            {/* Tags */}
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

  // ─── Step 3: প্রিভিউ ও প্রকাশ ────────────────────────────
  const Step3Content = () => {
    const className = classes.find((c) => c.id === form.classId)?.name || ''
    const subjectName = subjects.find((s) => s.id === form.subjectId)?.name || ''
    const chapterName = chapters.find((ch) => ch.id === form.chapterId)?.name || ''

    return (
      <div className="space-y-6">
        {/* Preview Card */}
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
              {/* Hierarchy badges */}
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

              {/* Question */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  প্রশ্ন
                </p>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                  <RichContentRenderer content={form.question} className="text-base" />
                </div>
                {form.questionImage && (
                  <div className="rounded-xl overflow-hidden border border-border/30 max-w-md">
                    <img
                      src={form.questionImage}
                      alt="প্রশ্নের ছবি"
                      className="w-full object-contain max-h-64"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
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
                              <img
                                src={optImage}
                                alt={`অপশন ${opt} ছবি`}
                                className="mt-2 max-h-32 object-contain rounded"
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

              {/* Explanation */}
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
                      <img
                        src={form.explanationImage}
                        alt="ব্যাখ্যার ছবি"
                        className="mt-2 max-h-48 object-contain rounded"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premium & Publish */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 border-b border-border/30">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              প্রিমিয়াম ও প্রকাশ
            </Label>
          </div>
          <CardContent className="p-5 space-y-5">
            {/* Premium Toggle */}
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

            {/* Price */}
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

            {/* Summary */}
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

            {/* Publish Button */}
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

  // ─── LIST VIEW ─────────────────────────────────────────────
  const ListView = () => {
    const columns: ColumnDef<MCQRecord>[] = [
      {
        key: 'question',
        header: 'প্রশ্ন',
        render: (mcq) => <RichContentRenderer content={mcq.question} inline />,
        cellClass: 'font-medium max-w-[200px] truncate',
      },
      {
        key: 'classLevel',
        header: 'ক্লাস',
        render: (mcq) => classLabelMap[mcq.classLevel] || mcq.classLevel,
        cellClass: 'hidden sm:table-cell',
      },
      {
        key: 'chapter',
        header: 'অধ্যায়',
        render: (mcq) => mcq.chapter?.name || '-',
        cellClass: 'hidden md:table-cell',
      },
      {
        key: 'board',
        header: 'বোর্ড',
        render: (mcq) => (mcq.board ? boardLabelMap[mcq.board] || mcq.board : '-'),
        cellClass: 'hidden lg:table-cell',
      },
      {
        key: 'year',
        header: 'সাল',
        render: (mcq) => mcq.year || '-',
        cellClass: 'hidden lg:table-cell',
      },
      {
        key: 'difficulty',
        header: 'কঠিনতা',
        render: (mcq) => (
          <Badge className={difficultyColors[mcq.difficulty] || ''}>
            {difficultyLabels[mcq.difficulty] || mcq.difficulty}
          </Badge>
        ),
      },
      {
        key: 'premium',
        header: 'প্রিমিয়াম',
        render: (mcq) =>
          mcq.isPremium ? (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
              <Crown className="h-3 w-3" />
              প্রিমিয়াম
            </Badge>
          ) : (
            <Badge variant="secondary">ফ্রি</Badge>
          ),
      },
      {
        key: 'actions',
        header: 'অ্যাকশন',
        cellClass: 'w-20',
        render: (mcq) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(mcq)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleteId(mcq.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]

    const bulkActions: BulkAction[] = [
      { label: 'মুছুন', variant: 'destructive', handler: handleBulkDelete },
    ]

    const filters = (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="প্রশ্ন দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={classFilter}
              onValueChange={(v) => {
                setClassFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="ক্লাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ক্লাস</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={boardFilter}
              onValueChange={(v) => {
                setBoardFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="বোর্ড" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব বোর্ড</SelectItem>
                {boardOptions.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="সাল"
              value={yearFilter === 'all' ? '' : yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value || 'all')
                setPage(1)
              }}
              className="w-full sm:w-32"
            />
            <Select
              value={difficultyFilter}
              onValueChange={(v) => {
                setDifficultyFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="কঠিনতা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="easy">সহজ</SelectItem>
                <SelectItem value="medium">মাঝারি</SelectItem>
                <SelectItem value="hard">কঠিন</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={premiumFilter}
              onValueChange={(v) => {
                setPremiumFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="প্রিমিয়াম" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                <SelectItem value="free">ফ্রি</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <FileQuestion className="h-5 w-5" />
              </div>
              MCQ ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি MCQ</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              বাল্ক ইম্পোর্ট
            </Button>
            <BulkImportDialog
              open={bulkImportOpen}
              onOpenChange={setBulkImportOpen}
              defaultType="mcq"
              onSuccess={fetchMcqs}
            />
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              নতুন MCQ যোগ করুন
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={mcqs}
          total={total}
          page={page}
          pageSize={perPage}
          onPageChange={setPage}
          loading={loading}
          selectable
          selectedIds={selection.selectedIds}
          onToggleOne={selection.toggleOne}
          onToggleAll={selection.toggleAll}
          allVisibleSelected={selection.allVisibleSelected}
          someVisibleSelected={selection.someVisibleSelected}
          bulkActions={bulkActions}
          emptyMessage="কোনো MCQ পাওয়া যায়নি"
          filters={filters}
        />
      </motion.div>
    )
  }

  // ─── EDITOR VIEW ───────────────────────────────────────────
  const EditorView = () => (
    <div>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setViewMode('list')
              setForm(emptyForm)
              setSubjects([])
              setChapters([])
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <>
                  <Edit className="h-5 w-5 text-emerald-600" /> MCQ সম্পাদনা
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-emerald-600" /> নতুন MCQ যোগ করুন
                </>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentStep === 1 && 'প্রশ্ন ও অপশন লিখুন'}
              {currentStep === 2 && 'ক্লাস, বিষয় ও অধ্যায় নির্বাচন করুন'}
              {currentStep === 3 && 'প্রিভিউ দেখুন ও প্রকাশ করুন'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setViewMode('list')
              setForm(emptyForm)
              setSubjects([])
              setChapters([])
            }}
          >
            <X className="h-4 w-4" /> বাতিল
          </Button>
          {currentStep === 3 && (
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20"
              onClick={saveMCQ}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'প্রকাশ'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Step Content */}
      {currentStep === 1 && Step1Content()}
      {currentStep === 2 && Step2Content()}
      {currentStep === 3 && Step3Content()}

      {/* Step Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          পূর্ববর্তী
        </Button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                currentStep === step.id
                  ? 'bg-emerald-600 w-6'
                  : currentStep > step.id
                    ? 'bg-emerald-300'
                    : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <Button
          onClick={handleNext}
          disabled={!canGoNext() || currentStep === 3}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          পরবর্তী
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // ─── RENDER ────────────────────────────────────────────────
  if (loading && mcqs.length === 0 && viewMode === 'list') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <>
      {viewMode === 'list' ? ListView() : EditorView()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MCQ মুছুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই MCQ মুছে ফেলতে চান? এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={() => deleteMCQ(deleteId!)}>
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
