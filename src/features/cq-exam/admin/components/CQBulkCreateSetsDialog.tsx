'use client'

import { useState } from 'react'
import { ListOrdered, Calendar, Timer, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { formatDate } from '@/features/mcq-exam/admin/components/MCQExamConstants'

interface CQBulkCreateSetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bulkPrefix: string
  setBulkPrefix: (v: string) => void
  bulkStartDate: string
  setBulkStartDate: (v: string) => void
  bulkIntervalDays: string
  setBulkIntervalDays: (v: string) => void
  bulkCount: string
  setBulkCount: (v: string) => void
  bulkDuration: string
  setBulkDuration: (v: string) => void
  onSave: () => void
  saving: boolean
}

export function CQBulkCreateSetsDialog({
  open, onOpenChange, bulkPrefix, setBulkPrefix, bulkStartDate, setBulkStartDate,
  bulkIntervalDays, setBulkIntervalDays, bulkCount, setBulkCount,
  bulkDuration, setBulkDuration, onSave, saving
}: CQBulkCreateSetsDialogProps) {
  const [bulkDatePickerOpen, setBulkDatePickerOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-emerald-600" /> দ্রুত সেট তৈরি করুন
          </DialogTitle>
          <DialogDescription>
            একসাথে একাধিক CQ এক্সাম সেট তৈরি করুন। সেটগুলো ক্রমানুসারে তারিখ অনুযায়ী তৈরি হবে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>প্রিফিক্স</Label>
              <Input placeholder="এক্সাম সেট" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> শুরুর তারিখ *
              </Label>
              <Popover open={bulkDatePickerOpen} onOpenChange={setBulkDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !bulkStartDate && 'text-muted-foreground')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {bulkStartDate ? formatDate(bulkStartDate) : 'তারিখ নির্বাচন করুন'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={bulkStartDate ? new Date(bulkStartDate) : undefined}
                    onSelect={(date) => {
                      setBulkStartDate(date ? date.toISOString().split('T')[0] : '')
                      setBulkDatePickerOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>ব্যবধান (দিন)</Label>
              <Input type="number" value={bulkIntervalDays} onChange={(e) => setBulkIntervalDays(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>সংখ্যা</Label>
              <Input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-emerald-600" /> সময়কাল (মিনিট)
              </Label>
              <Input type="number" value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onSave} disabled={saving || !bulkStartDate}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'তৈরি হচ্ছে...' : `${parseInt(bulkCount) || 10}টি সেট তৈরি করুন`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
