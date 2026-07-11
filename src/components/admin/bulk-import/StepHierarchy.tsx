import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Check, CheckCircle2, ChevronRight, Layers } from 'lucide-react'
import React from 'react'

export function StepHierarchy({
  classId,
  setClassId,
  subjectId,
  setSubjectId,
  chapterId,
  setChapterId,
  board,
  setBoard,
  year,
  setYear,
  difficulty,
  setDifficulty,
  isBoard,
  metadata,
  subjects,
  chapters,
  availableBoards,
  availableYears,
  selectedClassName,
  selectedSubjectName,
  selectedChapterName,
  selectedBoardName,
  step2Valid,
}: {
  classId: string
  setClassId: (v: string) => void
  subjectId: string
  setSubjectId: (v: string) => void
  chapterId: string
  setChapterId: (v: string) => void
  board: string
  setBoard: (v: string) => void
  year: string
  setYear: (v: string) => void
  difficulty: string
  setDifficulty: (v: string) => void
  isBoard: boolean
  metadata: ReturnType<typeof import('@/hooks/use-hierarchy-metadata').useHierarchyMetadata>['metadata']
  subjects: { id: string; name: string }[]
  chapters: { id: string; name: string }[]
  availableBoards: { value: string; label: string }[]
  availableYears: string[]
  selectedClassName: string
  selectedSubjectName: string
  selectedChapterName: string
  selectedBoardName: string
  step2Valid: boolean
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">হায়ারার্কি নির্বাচন</CardTitle>
            <Badge variant="outline" className="text-[10px] ml-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              হায়ারার্কি থেকে
            </Badge>
          </div>
          <CardDescription>ক্লাস → বিষয় → অধ্যায় নির্বাচন করুন — সব তথ্য হায়ারার্কি ব্যবস্থাপনা থেকে আসছে</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                ক্লাস <span className="text-destructive">*</span>
              </Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {metadata?.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classId && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {selectedClassName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                বিষয় <span className="text-destructive">*</span>
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={classId ? 'বিষয় নির্বাচন' : 'আগে ক্লাস নির্বাচন করুন'} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjectId && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {selectedSubjectName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                অধ্যায় <span className="text-destructive">*</span>
              </Label>
              <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={subjectId ? 'অধ্যায় নির্বাচন' : 'আগে বিষয় নির্বাচন করুন'} />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chapterId && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {selectedChapterName}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                বোর্ড
                {isBoard && <span className="text-destructive">*</span>}
                <Badge variant="outline" className="text-[9px] ml-1">হায়ারার্কি</Badge>
              </Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="বোর্ড নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {availableBoards.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {board && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {selectedBoardName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                সাল
                {isBoard && <span className="text-destructive">*</span>}
              </Label>
              <Input
                type="text"
                placeholder="সাল লিখুন (যেমন: ২০২৫)"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-11"
              />
              {availableYears.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  হায়ারার্কিতে থাকা সাল: {availableYears.join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">কঠিনতা</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 সহজ</SelectItem>
                  <SelectItem value="medium">🟡 মাঝারি</SelectItem>
                  <SelectItem value="hard">🔴 কঠিন</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {step2Valid && (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">নির্বাচন সম্পূর্ণ</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="bg-white dark:bg-background">{selectedClassName}</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                  <Badge variant="outline" className="bg-white dark:bg-background">{selectedSubjectName}</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                  <Badge variant="outline" className="bg-white dark:bg-background">{selectedChapterName}</Badge>
                  {isBoard && board && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                      <Badge variant="outline" className="bg-white dark:bg-background">{selectedBoardName}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                      <Badge variant="outline" className="bg-white dark:bg-background">সাল: {year}</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
