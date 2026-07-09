'use client'

import { useState } from 'react'
import { ArrowLeft, Timer, Calendar, Tag, Loader2, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { MCQExamSetRecord } from '@/types/admin-mcq-exam'
import { formatDate } from './MCQExamConstants'

interface ExamSetFormProps {
  editId: string | null
  currentSet: (MCQExamSetRecord & { questions?: any[] }) | null
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
  setNegativeMarks: string
  setSetNegativeMarks: (v: string) => void
  setInstructions: string
  setSetInstructions: (v: string) => void
  setAllowRetake: boolean
  setSetAllowRetake: (v: boolean) => void
  setOrder: string
  setSetOrder: (v: string) => void
  setStatus: string
  setSetStatus: (v: string) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export function ExamSetForm({
  editId, currentSet, setTitle, setSetTitle, setDescription, setSetDescription,
  setScheduledDate, setSetScheduledDate, setStartTime, setSetStartTime,
  setEndTime, setSetEndTime, setDuration, setSetDuration, setMarksPerQ, setSetMarksPerQ,
  setNegativeMarks, setSetNegativeMarks, setInstructions, setSetInstructions,
  setAllowRetake, setSetAllowRetake, setOrder, setSetOrder, setStatus, setSetStatus,
  saving, onSave, onCancel
}: ExamSetFormProps) {
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>প্রতি প্রশ্নে নম্বর</Label>
                <Input type="number" step="0.5" value={setMarksPerQ} onChange={(e) => setSetMarksPerQ(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>নেগেটিভ মার্কস</Label>
                <Input type="number" step="0.25" value={setNegativeMarks} onChange={(e) => setSetNegativeMarks(e.target.value)} />
              </div>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowRetake"
              checked={setAllowRetake}
              onChange={(e) => setSetAllowRetake(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="allowRetake" className="cursor-pointer">পুনরায় পরীক্ষা অনুমতি দিন (Retake)</Label>
          </div>

          <div className="space-y-2">
            <Label>ক্রম (Order)</Label>
            <Input type="number" placeholder="0" value={setOrder} onChange={(e) => setSetOrder(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
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
