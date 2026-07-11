'use client'

import Image from 'next/image'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Lightbulb,
  Crown,
  FileText,
  Eye,
  LayoutGrid,
  List,
  MoreVertical,
  Hash,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { deserializeBlocks } from '@/components/ui/content-block-editor'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { blockTypeIcons, blockTypeLabels } from './constants'
import type { SuggestionRecord, ClassItem } from './types'

interface ListViewProps {
  loading: boolean
  suggestions: SuggestionRecord[]
  total: number
  search: string
  setSearch: (v: string) => void
  filterClassId: string
  setFilterClassId: (v: string) => void
  filterIsPremium: string
  setFilterIsPremium: (v: string) => void
  viewStyle: 'grid' | 'list'
  setViewStyle: (v: 'grid' | 'list') => void
  classes: ClassItem[]
  openCreate: () => void
  openEdit: (suggestion: SuggestionRecord) => void
  setDeleteId: (id: string | null) => void
}

const getContentPreview = (content: string) => {
  const stripMarkup = (text: string) =>
    text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  try {
    const blocks = deserializeBlocks(content)
    const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'heading' || b.type === 'math')
    if (textBlocks.length > 0) {
      const first = textBlocks[0] as { content: string }
      const plain = stripMarkup(first.content)
      return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
    }
  } catch { /* */ }
  const plain = stripMarkup(content || '')
  return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
}

const getBlockTypeBadges = (content: string) => {
  try {
    const blocks = deserializeBlocks(content)
    if (blocks.length > 0) {
      return [...new Set(blocks.map(b => b.type))]
    }
  } catch { /* */ }
  return []
}

export function ListView({
  loading,
  suggestions,
  total,
  search,
  setSearch,
  filterClassId,
  setFilterClassId,
  filterIsPremium,
  setFilterIsPremium,
  viewStyle,
  setViewStyle,
  classes,
  openCreate,
  openEdit,
  setDeleteId,
}: ListViewProps) {
  const { classLevelLabels } = useHierarchyMetadata()

  if (loading && suggestions.length === 0) {
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
              <Lightbulb className="h-5 w-5" />
            </div>
            সাজেশন ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি সাজেশন</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" /> নতুন সাজেশন
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="সাজেশন খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card border-border/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="h-10 w-[140px] bg-card border-border/50">
              <SelectValue placeholder="সব ক্লাস" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্লাস</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterIsPremium} onValueChange={setFilterIsPremium}>
            <SelectTrigger className="h-10 w-[140px] bg-card border-border/50">
              <SelectValue placeholder="সব ধরন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ধরন</SelectItem>
              <SelectItem value="free">ফ্রি</SelectItem>
              <SelectItem value="premium">প্রিমিয়াম</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Suggestions Grid/List */}
      <AnimatePresence mode="wait">
        {viewStyle === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <Card className={cn(
                  'hover:shadow-lg transition-all duration-300 border-border/50 h-full overflow-hidden',
                  'border-l-4',
                  suggestion.isPremium
                    ? 'border-l-amber-400 hover:shadow-amber-500/5'
                    : 'border-l-emerald-400 hover:shadow-emerald-500/5',
                )}>
                  {suggestion.thumbnail ? (
                    <div className="relative h-36 overflow-hidden">
                      <Image src={suggestion.thumbnail} alt={suggestion.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-md">{suggestion.title}</h3>
                      </div>
                      {suggestion.isPremium && (
                        <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                          <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                        </Badge>
                      )}
                      {!suggestion.isActive && (
                        <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      'h-28 relative flex items-center justify-center',
                      suggestion.isPremium
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                        : 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
                    )}>
                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                        <Lightbulb className="h-8 w-8 text-violet-600/60" />
                      </div>
                      {suggestion.isPremium && (
                        <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                          <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                        </Badge>
                      )}
                      {!suggestion.isActive && (
                        <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    {!suggestion.thumbnail && (
                      <h3 className="font-semibold text-sm line-clamp-1 mb-2">{suggestion.title}</h3>
                    )}

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                      {getContentPreview(suggestion.content)}
                    </p>

                    {(() => {
                      const types = getBlockTypeBadges(suggestion.content)
                      if (types.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {types.map(t => {
                              const BIcon = blockTypeIcons[t]
                              return (
                                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 bg-muted/80">
                                  {BIcon && <BIcon className="h-2.5 w-2.5" />}
                                  {blockTypeLabels[t] || t}
                                </Badge>
                              )
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                      {suggestion.class && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {classLevelLabels[suggestion.class.slug] || suggestion.class.name}
                        </Badge>
                      )}
                      {suggestion.subject && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {suggestion.subject.name}
                        </Badge>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {suggestion.viewCount}
                      </span>
                      {suggestion.pdfUrl && (
                        <span className="flex items-center gap-0.5">
                          <FileText className="h-3 w-3" /> PDF
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {suggestion.isPremium ? `৳${suggestion.price}` : 'ফ্রি'}
                        </Badge>
                        {suggestion.order > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                            <Hash className="h-2.5 w-2.5" /> {suggestion.order}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-50 dark:hover:bg-violet-950/30" onClick={() => openEdit(suggestion)} title="সম্পাদনা">
                          <Edit className="h-3.5 w-3.5 text-violet-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="আরো অ্যাকশন">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(suggestion)}>
                              <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(suggestion.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> মুছুন
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {suggestions.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">কোনো সাজেশন পাওয়া যায়নি</p>
                <p className="text-sm mt-1">নতুন সাজেশন তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className={cn(
                  'hover:shadow-md transition-all border-border/50 cursor-pointer border-l-4',
                  suggestion.isPremium ? 'border-l-amber-400' : 'border-l-emerald-400',
                )} onClick={() => openEdit(suggestion)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="shrink-0">
                      {suggestion.thumbnail ? (
                        <Image src={suggestion.thumbnail} alt={suggestion.title} width={56} height={56} className="w-14 h-14 rounded-lg object-cover" unoptimized />
                      ) : (
                        <div className={cn(
                          'w-14 h-14 rounded-lg flex items-center justify-center',
                          suggestion.isPremium
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                            : 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
                        )}>
                          <Lightbulb className="h-5 w-5 text-violet-600/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm line-clamp-1">{suggestion.title}</h3>
                        {suggestion.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        {!suggestion.isActive && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-100 dark:bg-gray-800">নিষ্ক্রিয়</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {suggestion.class && (
                          <span>{classLevelLabels[suggestion.class.slug] || suggestion.class.name}</span>
                        )}
                        {suggestion.subject && (
                          <><span>·</span><span>{suggestion.subject.name}</span></>
                        )}
                        {suggestion.chapter && (
                          <><span>·</span><span>{suggestion.chapter.name}</span></>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {suggestion.viewCount}</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1">
                      {getBlockTypeBadges(suggestion.content).slice(0, 4).map(t => {
                        const BIcon = blockTypeIcons[t]
                        return BIcon ? (
                          <div key={t} className="p-1 rounded bg-muted/80">
                            <BIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ) : null
                      })}
                    </div>

                    <div className="hidden sm:flex items-center">
                      <Badge variant={suggestion.isPremium ? 'default' : 'secondary'} className={cn(
                        'text-[10px] h-5',
                        suggestion.isPremium && 'bg-amber-500 text-white',
                      )}>
                        {suggestion.isPremium ? `৳${suggestion.price}` : 'ফ্রি'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 dark:hover:bg-violet-950/30" onClick={(e) => { e.stopPropagation(); openEdit(suggestion) }} aria-label="সম্পাদনা">
                        <Edit className="h-4 w-4 text-violet-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(suggestion.id) }} aria-label="মুছুন">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {suggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">কোনো সাজেশন পাওয়া যায়নি</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
