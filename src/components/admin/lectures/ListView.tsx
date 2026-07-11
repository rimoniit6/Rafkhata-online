import DataTable, { type BulkAction, type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Crown, Edit, FileText, LayoutGrid, List, MoreVertical, Plus, Search, Trash2, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'
import type { LectureRecord } from './types'
import { blockTypeIcons } from './types'

interface ListViewProps {
  loading: boolean
  lectures: LectureRecord[]
  total: number
  search: string
  setSearch: (v: string) => void
  page: number
  setPage: (v: number) => void
  perPage: number
  viewStyle: 'grid' | 'list'
  setViewStyle: (v: 'grid' | 'list') => void
  classLevelLabels: Record<string, string>
  selection: {
    selectedIds: string[]
    toggleOne: (id: string) => void
    toggleAll: () => void
    allVisibleSelected: boolean
    someVisibleSelected: boolean
  }
  openEdit: (lec: LectureRecord) => void
  openCreate: () => void
  setDeleteId: (id: string) => void
  handleBulkDelete: (ids: string[]) => Promise<void>
  getContentPreview: (content: string) => string
  getBlockTypeBadges: (content: string) => string[]
}

export default function ListView({
  loading,
  lectures,
  total,
  search,
  setSearch,
  page,
  setPage,
  perPage,
  viewStyle,
  setViewStyle,
  classLevelLabels,
  selection,
  openEdit,
  openCreate,
  setDeleteId,
  handleBulkDelete,
  getContentPreview,
  getBlockTypeBadges,
}: ListViewProps) {
  if (loading && lectures.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const columns: ColumnDef<LectureRecord>[] = [
    {
      key: 'title',
      header: 'শিরোনাম',
      render: (lec) => <span className="font-medium">{lec.title}</span>,
      cellClass: 'max-w-[220px] truncate',
    },
    {
      key: 'class',
      header: 'ক্লাস',
      render: (lec) => {
        const cls = lec.chapter?.subject?.class
        return cls ? (classLevelLabels[cls.slug] || cls.name) : '-'
      },
      cellClass: 'hidden sm:table-cell',
    },
    {
      key: 'chapter',
      header: 'অধ্যায়',
      render: (lec) => lec.chapter?.name || '-',
      cellClass: 'hidden md:table-cell',
    },
    {
      key: 'duration',
      header: 'সময়',
      render: (lec) => (lec.duration > 0 ? `${lec.duration} মিনিট` : '-'),
      cellClass: 'hidden lg:table-cell',
    },
    {
      key: 'premium',
      header: 'প্রিমিয়াম',
      render: (lec) =>
        lec.isPremium ? (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
            <Crown className="h-3 w-3" />প্রিমিয়াম
          </Badge>
        ) : (
          <Badge variant="secondary">ফ্রি</Badge>
        ),
    },
    {
      key: 'status',
      header: 'স্ট্যাটাস',
      render: (lec) =>
        lec.isActive ? (
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
            সক্রিয়
          </Badge>
        ) : (
          <Badge variant="outline" className="text-destructive border-destructive/50">
            লুকানো
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: 'অ্যাকশন',
      cellClass: 'w-20',
      render: (lec) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(lec)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleteId(lec.id)}
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
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="লেকচার খুঁজুন..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 h-10 bg-card border-border/50"
        />
      </div>
      <div className="flex items-center bg-card border border-border/50 rounded-lg p-0.5">
        <Button
          variant={viewStyle === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewStyle('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewStyle === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewStyle('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            লেকচার ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি লেকচার</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" /> নতুন লেকচার যোগ করুন
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="লেকচার খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card border-border/50"
          />
        </div>
        <div className="flex items-center bg-card border border-border/50 rounded-lg p-0.5">
          <Button
            variant={viewStyle === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewStyle('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewStyle === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewStyle('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewStyle === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lectures.map((lecture, _idx) => (
              <div key={lecture.id} className="group">
                  <Card className="hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 border-border/50 h-full overflow-hidden">
                    {lecture.thumbnail ? (
                      <div className="relative h-36 overflow-hidden">
                        <Image src={lecture.thumbnail} alt={lecture.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-md">{lecture.title}</h3>
                        </div>
                        {lecture.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className={cn(
                        'h-28 relative flex items-center justify-center',
                        'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
                      )}>
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                          {lecture.videoUrl ? <Video className="h-8 w-8 text-emerald-600/60" /> : <FileText className="h-8 w-8 text-emerald-600/60" />}
                        </div>
                        {lecture.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                      </div>
                    )}

                    <CardContent className="p-4">
                      {!lecture.thumbnail && (
                        <h3 className="font-semibold text-sm line-clamp-1 mb-2">{lecture.title}</h3>
                      )}

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                        {getContentPreview(lecture.content)}
                      </p>

                      {(() => {
                        const types = getBlockTypeBadges(lecture.content)
                        if (types.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {types.map(t => {
                                const BIcon = blockTypeIcons[t]
                                return (
                                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 bg-muted/80">
                                    {BIcon && <BIcon className="h-2.5 w-2.5" />}
                                    {t === 'math' && 'ম্যাথ'}
                                    {t === 'image' && 'ছবি'}
                                    {t === 'data' && 'ডাটা'}
                                    {t === 'code' && 'কোড'}
                                    {t === 'heading' && 'হেডিং'}
                                    {t === 'text' && 'টেক্সট'}
                                    {t === 'divider' && 'বিভাজক'}
                                  </Badge>
                                )
                              })}
                            </div>
                          )
                        }
                        return null
                      })()}

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                        {lecture.chapter?.subject?.class && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {classLevelLabels[lecture.chapter.subject.class.slug] || lecture.chapter.subject.class.name}
                          </Badge>
                        )}
                        {lecture.duration > 0 && <span>{lecture.duration} মিনিট</span>}
                        <span>{lecture.viewCount} ভিউ</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {lecture.videoUrl ? 'ভিডিও' : lecture.content ? 'কন্টেন্ট' : 'ড্রাফট'}
                          </Badge>
                          {!lecture.isActive && (
                            <Badge className="text-[10px] h-5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                              লুকানো
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => openEdit(lecture)} title="সম্পাদনা">
                            <Edit className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="আরো অ্যাকশন">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(lecture)}>
                                <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(lecture.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> মুছুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {lectures.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো লেকচার পাওয়া যায়নি</p>
                  <p className="text-sm mt-1">নতুন লেকচার তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
                </div>
              )}
            </div>
        </>
      ) : (
        <DataTable
          columns={columns}
          data={lectures}
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
          emptyMessage="কোনো লেকচার পাওয়া যায়নি"
          filters={filters}
        />
      )}
    </div>
  )
}
