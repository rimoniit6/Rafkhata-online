import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import React from 'react'
import {
  AlignLeft,
  Check,
  Crown,
  FileQuestion,
  ListChecks,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ChapterCount, ContentItem, HierarchyData, SelectedContentItem } from './types'

export interface StepAddContentProps {
  hierarchyClassId: string
  setHierarchyClassId: (v: string) => void
  hierarchySubjectId: string
  setHierarchySubjectId: (v: string) => void
  hierarchyChapterId: string
  setHierarchyChapterId: (v: string) => void
  hierarchyData: HierarchyData
  chapterCounts: ChapterCount[]
  filteredSubjects: { id: string; name: string; slug: string; classId: string }[]
  filteredChapters: { id: string; name: string; slug: string; subjectId: string }[]
  selectAllTypeFromChapter: (type: 'mcq' | 'cq') => void
  selectAllFromChapter: (type: 'mcq' | 'cq', chapId: string) => void
  contentTab: string
  setContentTab: (v: string) => void
  contentSearch: string
  setContentSearch: (v: string) => void
  contentItems: ContentItem[]
  loadingContent: boolean
  selectedItems: SelectedContentItem[]
  isItemSelected: (contentType: string, contentId: string) => boolean
  toggleItem: (contentType: string, item: ContentItem) => void
  removeItem: (contentType: string, contentId: string) => void
  calculateOriginalPrice: () => number
  getIcon: (type: string) => LucideIcon
  getLabel: (type: string) => string
  classLevelLabels: Record<string, string>
}

export default function StepAddContent({
  hierarchyClassId, setHierarchyClassId,
  hierarchySubjectId, setHierarchySubjectId,
  hierarchyChapterId, setHierarchyChapterId,
  hierarchyData, chapterCounts,
  filteredSubjects, filteredChapters,
  selectAllTypeFromChapter, selectAllFromChapter,
  contentTab, setContentTab,
  contentSearch, setContentSearch,
  contentItems, loadingContent,
  selectedItems, isItemSelected, toggleItem, removeItem,
  calculateOriginalPrice,
  getIcon, getLabel, classLevelLabels,
}: StepAddContentProps) {
  const contentTypes = ['mcq', 'cq', 'lecture', 'suggestion', 'exam'] as const

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" /> দ্রুত নির্বাচন
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">অধ্যায় ভিত্তিক দ্রুত MCQ/CQ সিলেকশন — সব একসাথে যোগ করুন</p>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ক্লাস</Label>
              <Select value={hierarchyClassId} onValueChange={(v) => { setHierarchyClassId(v); setHierarchySubjectId(''); setHierarchyChapterId('') }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="ক্লাস নির্বাচন" /></SelectTrigger>
                <SelectContent>
                  {hierarchyData.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">বিষয়</Label>
              <Select value={hierarchySubjectId} onValueChange={(v) => { setHierarchySubjectId(v); setHierarchyChapterId('') }} disabled={!hierarchyClassId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={hierarchyClassId ? 'বিষয় নির্বাচন' : 'আগে ক্লাস নির্বাচন'} /></SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">অধ্যায়</Label>
              <Select value={hierarchyChapterId} onValueChange={setHierarchyChapterId} disabled={!hierarchySubjectId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={hierarchySubjectId ? 'অধ্যায় নির্বাচন' : 'আগে বিষয় নির্বাচন'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">সব অধ্যায়</SelectItem>
                  {filteredChapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hierarchySubjectId && chapterCounts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">অধ্যায় ভিত্তিক কাউন্ট</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                    onClick={() => selectAllTypeFromChapter('mcq')}
                    disabled={!hierarchySubjectId}
                  >
                    <FileQuestion className="h-3 w-3" />
                    সব MCQ যোগ করুন
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400"
                    onClick={() => selectAllTypeFromChapter('cq')}
                    disabled={!hierarchySubjectId}
                  >
                    <AlignLeft className="h-3 w-3" />
                    সব CQ যোগ করুন
                  </Button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {(hierarchyChapterId && hierarchyChapterId !== '__all__'
                  ? chapterCounts.filter(c => c.chapterId === hierarchyChapterId)
                  : chapterCounts.filter(c => filteredChapters.some(ch => ch.id === c.chapterId))
                ).map((chap) => (
                  <div key={chap.chapterId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chap.chapterName}</p>
                      <p className="text-[10px] text-muted-foreground">{chap.subjectName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5 border-emerald-200 dark:border-emerald-800">
                          <FileQuestion className="h-2.5 w-2.5 text-emerald-600" />
                          {chap.mcqTotal > 0 ? (
                            <span>
                              <span className="text-emerald-600 font-semibold">{chap.mcqFree}</span>
                              <span className="text-muted-foreground mx-0.5">/</span>
                              <span className="text-amber-600 font-semibold">{chap.mcqPremium}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </Badge>
                        {chap.mcqPremium > 0 && (
                          <button
                            type="button"
                            className="h-5 px-1.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 transition-colors"
                            onClick={() => selectAllFromChapter('mcq', chap.chapterId)}
                          >
                            সব MCQ
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5 border-teal-200 dark:border-teal-800">
                          <AlignLeft className="h-2.5 w-2.5 text-teal-600" />
                          {chap.cqTotal > 0 ? (
                            <span>
                              <span className="text-teal-600 font-semibold">{chap.cqFree}</span>
                              <span className="text-muted-foreground mx-0.5">/</span>
                              <span className="text-amber-600 font-semibold">{chap.cqPremium}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </Badge>
                        {chap.cqPremium > 0 && (
                          <button
                            type="button"
                            className="h-5 px-1.5 rounded text-[9px] font-medium bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:hover:bg-teal-900 transition-colors"
                            onClick={() => selectAllFromChapter('cq', chap.chapterId)}
                          >
                            সব CQ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  ফ্রি
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  প্রিমিয়াম
                </div>
                <span className="mx-1">|</span>
                <span>ফরম্যাট: ফ্রি / প্রিমিয়াম</span>
              </div>
            </div>
          )}

          {hierarchySubjectId && chapterCounts.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              এই বিষয়ে কোনো কন্টেন্ট নেই
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-violet-600" /> কন্টেন্ট যোগ করুন
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">বিভিন্ন কন্টেন্ট থেকে আইটেম বাছাই করুন</p>
              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-800/30">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">শুধুমাত্র প্রিমিয়াম কন্টেন্ট যোগ করা যাবে</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                  <Check className="h-3 w-3" /> {selectedItems.length} আইটেম
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                মূল্য: ৳{calculateOriginalPrice()}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-4 space-y-4">
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="w-full grid grid-cols-5 h-9">
                {contentTypes.map((type) => {
                  const Icon = getIcon(type) as React.FC<{ className?: string }>
                  const count = selectedItems.filter(i => i.contentType === type).length
                return (
                  <TabsTrigger key={type} value={type} className="text-xs gap-1 relative">
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{getLabel(type)}</span>
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {contentTypes.map((type) => (
              <TabsContent key={type} value={type} className="mt-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`${getLabel(type) || type} খুঁজুন...`}
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {selectedItems.filter(i => i.contentType === type).length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> নির্বাচিত {getLabel(type) || type} ({selectedItems.filter(i => i.contentType === type).length})
                    </p>
                    <div className="space-y-1">
                      {selectedItems.filter(i => i.contentType === type).map((item) => (
                        <div key={`${item.contentType}-${item.contentId}`} className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-white/60 dark:bg-white/5 text-xs">
                          <span className="truncate flex-1 min-w-0">{item.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[9px] h-4 px-1">৳{item.price}</Badge>
                            <button
                              type="button"
                              className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              onClick={() => removeItem(item.contentType, item.contentId)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingContent ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : contentItems.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {contentItems.map((item) => {
                      const selected = isItemSelected(type, item.id)
                      const itemTitle = item.title || item.question?.slice(0, 80) || item.uddeepok?.slice(0, 80) || `${getLabel(type) || type} #${item.id.slice(0, 8)}`
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            'w-full text-left p-3 rounded-xl border transition-all',
                            selected
                              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                              : 'border-border/40 hover:border-border hover:bg-muted/30',
                          )}
                          onClick={() => toggleItem(type, item)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              'mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                              selected
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-muted-foreground/30',
                            )}>
                              {selected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">{itemTitle}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {item.classLevel && (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                                    {classLevelLabels[item.classLevel] || item.classLevel}
                                  </Badge>
                                )}
                                {item.chapter && (
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                    {item.chapter.name}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                  ৳{item.price || 0}
                                </Badge>
                                {item.isPremium && (
                                  <Crown className="h-3 w-3 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">কোনো {getLabel(type) || type} পাওয়া যায়নি</p>
                    <p className="text-xs mt-1">অন্য সার্চ টার্ম দিয়ে চেষ্টা করুন</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
