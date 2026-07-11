import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ContentBlockEditor, { type ContentBlock } from '@/components/ui/content-block-editor'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Save,
  Sigma,
  Sparkles,
  Table2,
  Video,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'
import type { StepNumber, ClassItem, SubjectItem, ChapterItem } from './types'
import { steps } from './types'
import StepIndicator from './StepIndicator'

interface EditorViewProps {
  editId: string | null
  currentStep: StepNumber
  formTitle: string
  setFormTitle: (v: string) => void
  formClassId: string
  setFormClassId: (v: string) => void
  formSubjectId: string
  setFormSubjectId: (v: string) => void
  formChapterId: string
  setFormChapterId: (v: string) => void
  formBlocks: ContentBlock[]
  setFormBlocks: (v: ContentBlock[]) => void
  formVideoUrl: string
  setFormVideoUrl: (v: string) => void
  formAudioUrl: string
  setFormAudioUrl: (v: string) => void
  formPdfUrl: string
  setFormPdfUrl: (v: string) => void
  formThumbnail: string
  setFormThumbnail: (v: string) => void
  formDuration: string
  setFormDuration: (v: string) => void
  formIsPremium: boolean
  setFormIsPremium: (v: boolean) => void
  formPrice: string
  setFormPrice: (v: string) => void
  formIsActive: boolean
  setFormIsActive: (v: boolean) => void
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  selectedClass: ClassItem | undefined
  selectedSubject: SubjectItem | undefined
  selectedChapter: ChapterItem | undefined
  setViewMode: (v: 'list' | 'editor') => void
  resetForm: () => void
  handleSave: () => Promise<void>
  canGoNext: () => boolean
  goNext: () => void
  goPrev: () => void
  saving: boolean
}

export default function EditorView({
  editId,
  currentStep,
  formTitle,
  setFormTitle,
  formClassId,
  setFormClassId,
  formSubjectId,
  setFormSubjectId,
  formChapterId,
  setFormChapterId,
  formBlocks,
  setFormBlocks,
  formVideoUrl,
  setFormVideoUrl,
  formAudioUrl,
  setFormAudioUrl,
  formPdfUrl,
  setFormPdfUrl,
  formThumbnail,
  setFormThumbnail,
  formDuration,
  setFormDuration,
  formIsPremium,
  setFormIsPremium,
  formPrice,
  setFormPrice,
  formIsActive,
  setFormIsActive,
  classes,
  subjects,
  chapters,
  selectedClass,
  selectedSubject,
  selectedChapter,
  setViewMode,
  resetForm,
  handleSave,
  canGoNext,
  goNext,
  goPrev,
  saving,
}: EditorViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setViewMode('list'); resetForm() }} aria-label="ফিরে যান">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {editId ? 'লেকচার সম্পাদনা' : 'নতুন লেকচার যোগ করুন'}
            </h1>
            <p className="text-sm text-muted-foreground">ধাপ {currentStep}/৩</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editId && (
            <Badge variant="outline" className="text-xs">ID: {editId.slice(-8)}</Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      {currentStep === 1 && (
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                মৌলিক তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-base font-semibold">শিরোনাম *</Label>
                <Input
                  placeholder="লেকচারের শিরোনাম লিখুন..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={cn("h-11 text-base", !formTitle.trim() && currentStep === 1 && formTitle !== '' ? "border-red-400 focus:border-red-500" : "")}
                />
                {!formTitle.trim() && currentStep === 1 && formTitle !== '' && (
                  <p className="text-xs text-red-500">শিরোনাম আবশ্যক</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">ক্লাস *</Label>
                  <Select value={formClassId} onValueChange={setFormClassId}>
                    <SelectTrigger className={cn("h-11 text-base", !formClassId && currentStep === 1 ? "border-red-400" : "")}>
                      <SelectValue placeholder="ক্লাস নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formClassId && currentStep === 1 && (
                    <p className="text-xs text-red-500">ক্লাস নির্বাচন করুন</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">বিষয় *</Label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId}>
                    <SelectTrigger className={cn("h-11 text-base", formClassId && !formSubjectId && currentStep === 1 ? "border-red-400" : "")}>
                      <SelectValue placeholder="বিষয় নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formClassId && !formSubjectId && currentStep === 1 && (
                    <p className="text-xs text-red-500">বিষয় নির্বাচন করুন</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">অধ্যায় *</Label>
                  <Select value={formChapterId} onValueChange={setFormChapterId} disabled={!formSubjectId}>
                    <SelectTrigger className={cn("h-11 text-base", formSubjectId && !formChapterId && currentStep === 1 ? "border-red-400" : "")}>
                      <SelectValue placeholder="অধ্যায় নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formSubjectId && !formChapterId && currentStep === 1 && (
                    <p className="text-xs text-red-500">অধ্যায় নির্বাচন করুন</p>
                  )}
                </div>
              </div>

              <ImageUploader
                value={formThumbnail}
                onChange={setFormThumbnail}
                label="থাম্বনেইল"
                placeholder="লেকচারের থাম্বনেইল ছবি আপলোড করুন"
              />
            </CardContent>
          </Card>

          {(!formTitle || !formChapterId) && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              * শিরোনাম ও অধ্যায় আবশ্যক
            </p>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LayoutGrid className="h-5 w-5 text-emerald-600" />
                  কন্টেন্ট ব্লকসমূহ
                </CardTitle>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Sigma className="h-3 w-3" /> $...$ ম্যাথ
                  <span className="opacity-40">|</span>
                  <ImageIcon className="h-3 w-3" /> ছবি
                  <span className="opacity-40">|</span>
                  <Table2 className="h-3 w-3" /> ডাটা
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ContentBlockEditor
                blocks={formBlocks}
                onChange={setFormBlocks}
              />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5 text-emerald-600" />
                মিডিয়া ও সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">ভিডিও URL</Label>
                  <Input placeholder="https://youtube.com/watch?v=..." value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} className="h-11 text-base" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">অডিও URL</Label>
                  <Input placeholder="https://...mp3" value={formAudioUrl} onChange={(e) => setFormAudioUrl(e.target.value)} className="h-11 text-base" />
                </div>
                <ImageUploader
                  value={formPdfUrl}
                  onChange={setFormPdfUrl}
                  label="PDF ফাইল"
                  placeholder="PDF ফাইল আপলোড করুন বা টেনে আনুন"
                  allowPdf
                  maxSize={10 * 1024 * 1024}
                />
                <div className="space-y-2">
                  <Label className="text-base font-semibold">সময়কাল (মিনিট)</Label>
                  <Input type="number" placeholder="0" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="h-11 text-base" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Card className="border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  লেকচার প্রিভিউ
                </CardTitle>
                <div className="flex items-center gap-2">
                  {formIsPremium && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                      <Crown className="h-3 w-3" /> প্রিমিয়াম {formPrice ? `৳${formPrice}` : ''}
                    </Badge>
                  )}
                  {formVideoUrl && (
                    <Badge variant="secondary" className="gap-1">
                      <Video className="h-3 w-3" /> ভিডিও
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap gap-2 text-sm">
                {selectedClass && <Badge variant="outline">{selectedClass.name}</Badge>}
                {selectedSubject && <Badge variant="outline">{selectedSubject.name}</Badge>}
                {selectedChapter && <Badge variant="outline">{selectedChapter.name}</Badge>}
                {parseInt(formDuration) > 0 && (
                  <Badge variant="outline">{formDuration} মিনিট</Badge>
                )}
              </div>

              <Separator />

              <div>
                <h2 className="text-xl font-bold">{formTitle || '(শিরোনাম)'}</h2>
              </div>

              {formThumbnail && (
                <div className="rounded-lg overflow-hidden border">
                  <Image src={formThumbnail} alt="থাম্বনেইল" width={800} height={400} className="w-full max-h-64 object-cover" unoptimized />
                </div>
              )}

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ContentBlockEditor
                  blocks={formBlocks}
                  onChange={setFormBlocks}
                  previewMode
                />
              </div>

              {formBlocks.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg border-border/30">
                  <p className="text-sm text-muted-foreground">কন্টেন্ট ব্লক যোগ করা হয়নি</p>
                </div>
              )}

              {formVideoUrl && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2 border border-emerald-200/30 dark:border-emerald-800/20">
                  <Video className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium">ভিডিও লেকচার ({formDuration || 0} মিনিট)</span>
                </div>
              )}
              {formAudioUrl && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center gap-2 border border-blue-200/30 dark:border-blue-800/20">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium">অডিও রিসোর্স উপলব্ধ</span>
                </div>
              )}
              {formPdfUrl && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center gap-2 border border-red-200/30 dark:border-red-800/20">
                  <FileText className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium">PDF রিসোর্স উপলব্ধ</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Crown className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">প্রিমিয়াম কন্টেন্ট</Label>
                    <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
                  </div>
                </div>
                <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
              </div>
              {formIsPremium && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">মূল্য (৳)</Label>
                  <Input placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="h-11 text-base" type="number" />
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Eye className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">প্রকাশিত</Label>
                    <p className="text-xs text-muted-foreground">{formIsActive ? 'শিক্ষার্থীরা এই লেকচার দেখতে পাবে' : 'লেকচারটি লুকানো আছে, শিক্ষার্থীরা দেখতে পাবে না'}</p>
                  </div>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{editId ? 'লেকচার আপডেট করুন' : 'লেকচার প্রকাশ করুন'}</p>
                    <p className="text-xs text-muted-foreground">
                      {editId ? 'পরিবর্তনগুলো সংরক্ষণ করুন' : 'সব তথ্য ঠিক থাকলে প্রকাশ করুন'}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
                  ) : (
                    <><Save className="h-4 w-4" /> {editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={goPrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4" /> আগের ধাপ
        </Button>

        <div className="flex items-center gap-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                step.num === currentStep
                  ? 'bg-emerald-500 w-6'
                  : step.num < currentStep
                  ? 'bg-emerald-400'
                  : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {currentStep < 3 ? (
          <Button
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={goNext}
            disabled={!canGoNext()}
          >
            পরবর্তী ধাপ <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-[120px]" />
        )}
      </div>
    </div>
  )
}
