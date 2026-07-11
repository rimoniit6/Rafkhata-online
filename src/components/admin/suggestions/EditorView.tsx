'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import {
  Edit,
  Lightbulb,
  Crown,
  FileText,
  Sigma,
  ImageIcon,
  Table2,
  Eye,
  ArrowLeft,
  Sparkles,
  LayoutGrid,
  Save,
  X,
  BookOpen,
  Hash,
  Power,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import ImageUploader from '@/components/ui/image-uploader'
import ContentBlockEditor, { ContentBlock } from '@/components/ui/content-block-editor'
import type { ClassItem, SubjectItem, ChapterItem } from './types'

interface EditorViewProps {
  editId: string | null
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
  formPdfUrl: string
  setFormPdfUrl: (v: string) => void
  formThumbnail: string
  setFormThumbnail: (v: string) => void
  formIsPremium: boolean
  setFormIsPremium: (v: boolean) => void
  formPrice: string
  setFormPrice: (v: string) => void
  formOrder: string
  setFormOrder: (v: string) => void
  formIsActive: boolean
  setFormIsActive: (v: boolean) => void
  editorTab: 'edit' | 'preview'
  setEditorTab: (v: 'edit' | 'preview') => void
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  saving: boolean
  setViewMode: (v: 'list' | 'editor') => void
  resetForm: () => void
  handleSave: () => void
}

export function EditorView({
  editId,
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
  formPdfUrl,
  setFormPdfUrl,
  formThumbnail,
  setFormThumbnail,
  formIsPremium,
  setFormIsPremium,
  formPrice,
  setFormPrice,
  formOrder,
  setFormOrder,
  formIsActive,
  setFormIsActive,
  editorTab,
  setEditorTab,
  classes,
  subjects,
  chapters,
  saving,
  setViewMode,
  resetForm,
  handleSave,
}: EditorViewProps) {
  return (
    <div className="space-y-0">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => { setViewMode('list'); resetForm() }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <><Edit className="h-5 w-5 text-violet-600" /> সাজেশন সম্পাদনা</>
              ) : (
                <><Sparkles className="h-5 w-5 text-violet-600" /> নতুন সাজেশন যোগ করুন</>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ব্লক-ভিত্তিক কন্টেন্ট এডিটর দিয়ে সাজেশন তৈরি করুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-600/20"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'তৈরি করুন'}</>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Body - Two Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Title Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-violet-600" /> মৌলিক তথ্য
              </Label>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>শিরোনাম *</Label>
                <Input
                  placeholder="সাজেশনের শিরোনাম লিখুন..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">ক্লাস (ঐচ্ছিক)</Label>
                  <Select value={formClassId} onValueChange={setFormClassId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">বিষয় (ঐচ্ছিক)</Label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId || formClassId === 'none'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">অধ্যায় (ঐচ্ছিক)</Label>
                  <Select value={formChapterId} onValueChange={setFormChapterId} disabled={!formSubjectId || formSubjectId === 'none'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {chapters.map((ch) => (<SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageUploader
                value={formThumbnail}
                onChange={setFormThumbnail}
                label="থাম্বনেইল"
                placeholder="সাজেশনের থাম্বনেইল ছবি আপলোড করুন"
              />
            </CardContent>
          </Card>

          {/* Content Blocks Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-4 py-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-purple-600" /> কন্টেন্ট ব্লকসমূহ
                </Label>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Sigma className="h-3 w-3" /> $...$ ম্যাথ
                  <span className="opacity-40">|</span>
                  <ImageIcon className="h-3 w-3" /> ছবি
                  <span className="opacity-40">|</span>
                  <Table2 className="h-3 w-3" /> ডাটা
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="lg:hidden mb-4">
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'edit' | 'preview')}>
                  <TabsList className="w-full grid grid-cols-2 h-9">
                    <TabsTrigger value="edit" className="text-xs gap-1">
                      <Edit className="h-3 w-3" /> সম্পাদনা
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1">
                      <Eye className="h-3 w-3" /> প্রিভিউ
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className={cn(
                editorTab === 'preview' ? 'lg:hidden' : '',
                editorTab === 'edit' ? '' : 'hidden lg:block',
              )}>
                <ContentBlockEditor
                  blocks={formBlocks}
                  onChange={setFormBlocks}
                />
              </div>

              <div className={cn(
                editorTab === 'edit' ? 'hidden lg:block' : '',
                editorTab === 'preview' ? 'lg:hidden' : '',
              )}>
                <div className="lg:hidden prose prose-sm dark:prose-invert max-w-none">
                  <h2 className="text-lg font-bold mb-3">{formTitle || '(শিরোনাম)'}</h2>
                  {formThumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <Image src={formThumbnail} alt={formTitle || 'সাজেশন থাম্বনেইল'} width={800} height={300} className="w-full max-h-48 object-cover" unoptimized />
                  </div>
                  )}
                  <ContentBlockEditor blocks={formBlocks} onChange={setFormBlocks} previewMode />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 px-4 py-3 border-b border-border/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-600" /> সেটিংস
              </Label>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ImageUploader
                    value={formPdfUrl}
                    onChange={setFormPdfUrl}
                    label="PDF ফাইল"
                    placeholder="PDF ফাইল আপলোড করুন"
                    allowPdf
                    maxSize={10 * 1024 * 1024}
                  />
                <div className="space-y-2">
                  <Label className="text-xs">ক্রম (Order)</Label>
                  <Input type="number" placeholder="0" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} className="h-9" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Crown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">প্রিমিয়াম কন্টেন্ট</Label>
                    <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
                  </div>
                </div>
                <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
              </div>
              {formIsPremium && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label className="text-xs">মূল্য (৳)</Label>
                  <Input placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="h-9" />
                </motion.div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Power className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">সক্রিয়</Label>
                    <p className="text-xs text-muted-foreground">সাজেশনটি প্রকাশিত থাকবে</p>
                  </div>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview (2 cols, desktop only) */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-20">
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-violet-600" /> লাইভ প্রিভিউ
                </Label>
              </div>
              <ScrollArea className="max-h-[75vh]">
                <div className="p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h2 className="text-xl font-bold mb-3">{formTitle || '(শিরোনাম)'}</h2>

                    {formThumbnail && (
                      <div className="mb-4 rounded-lg overflow-hidden">
<Image src={formThumbnail} alt={formTitle || 'সাজেশন থাম্বনেইল'} width={800} height={300} className="w-full max-h-48 object-cover" unoptimized />
                      </div>
                    )}

                    {(formClassId || formSubjectId || formChapterId) && (
                      <div className="flex items-center gap-2 mb-4">
                        {formClassId && formClassId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {classes.find(c => c.slug === formClassId)?.name || formClassId}
                          </Badge>
                        )}
                        {formSubjectId && formSubjectId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {subjects.find(s => s.id === formSubjectId)?.name || ''}
                          </Badge>
                        )}
                        {formChapterId && formChapterId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {chapters.find(c => c.id === formChapterId)?.name || ''}
                          </Badge>
                        )}
                      </div>
                    )}

                    <ContentBlockEditor
                      blocks={formBlocks}
                      onChange={setFormBlocks}
                      previewMode
                    />

                    {formBlocks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg border-border/30">
                        <p className="text-sm text-muted-foreground">ব্লক যোগ করলে এখানে প্রিভিউ দেখা যাবে</p>
                      </div>
                    )}

                    {formPdfUrl && (
                      <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center gap-2 border border-red-200/30 dark:border-red-800/20">
                        <FileText className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium">PDF সংযুক্তি উপলব্ধ</span>
                      </div>
                    )}

                    {formIsPremium && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2 border border-amber-200/30 dark:border-amber-800/20">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium">প্রিমিয়াম কন্টেন্ট — ৳{formPrice || 0}</span>
                      </div>
                    )}

                    {!formIsActive && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/30 flex items-center gap-2 border border-gray-200/30 dark:border-gray-800/20">
                        <Power className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">নিষ্ক্রিয় — প্রকাশিত হবে না</span>
                      </div>
                    )}

                    {parseInt(formOrder) > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center gap-2 border border-blue-200/30 dark:border-blue-800/20">
                        <Hash className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">ক্রম: {formOrder}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
