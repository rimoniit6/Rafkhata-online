'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileQuestion,
  GraduationCap,
  Layers,
  Percent,
  ShoppingBag,
  Timer,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import { toDecimal } from '@/lib/decimal'
import type { ContentPackage } from './types'

interface PackageCardProps {
  pkg: ContentPackage
  classLevelBuyOptions: { value: string; label: string }[]
  selectedClass: string
  onClassChange: (pkgId: string, value: string) => void
  isPurchased: boolean
  isPending: boolean
  onBuy: (pkg: ContentPackage, selectedClass: string) => void
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const getDurationStyle = (duration: number) => {
  if (duration <= 30) return { bg: 'from-teal-500 to-emerald-500', icon: 'text-teal-500 dark:text-teal-400', ring: 'ring-teal-200 dark:ring-teal-800' }
  if (duration <= 180) return { bg: 'from-emerald-500 to-cyan-500', icon: 'text-emerald-500 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' }
  return { bg: 'from-cyan-500 to-teal-600', icon: 'text-cyan-500 dark:text-cyan-400', ring: 'ring-cyan-200 dark:ring-cyan-800' }
}

function PackageCard({ pkg, classLevelBuyOptions, selectedClass, onClassChange, isPurchased, isPending, onBuy }: PackageCardProps) {
  const metadata = useHierarchyMetadata()
  const durStyle = getDurationStyle(pkg.duration)
  const discount = toDecimal(pkg.originalPrice) > toDecimal(pkg.price)
    ? Math.round(((toDecimal(pkg.originalPrice) - toDecimal(pkg.price)) / toDecimal(pkg.originalPrice)) * 100)
    : 0

  return (
    <motion.div variants={item} layout>
      <Card className="overflow-hidden group hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 hover:border-teal-200 dark:hover:border-teal-800 border-border/50 h-full flex flex-col">
        {/* Duration Header */}
        <div className={cn('relative h-36 overflow-hidden bg-gradient-to-br', durStyle.bg)}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className={cn('w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2', durStyle.ring)}>
              <Timer className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">
              {pkg.durationLabel}
            </h3>
            {pkg.classLevel && (
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] gap-1 backdrop-blur-sm">
                <GraduationCap className="w-3 h-3" />
                {pkg.classLevel ? metadata.classLevelLabels[pkg.classLevel] || pkg.classLevel : ''}
              </Badge>
            )}
          </div>

          {discount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500/90 text-white border-0 gap-1 shadow-lg shadow-red-500/20 text-xs font-bold">
                <Percent className="w-3 h-3" />
                {discount}% ছাড়
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1">
            {pkg.title}
          </h4>

          {pkg.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-3">
              <RichContentRenderer content={pkg.description} />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.mcqCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400">
                <FileQuestion className="w-2.5 h-2.5" />
                {pkg.mcqCount} MCQ
              </Badge>
            )}
            {pkg.cqCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                <ClipboardList className="w-2.5 h-2.5" />
                {pkg.cqCount} সৃজনশীল
              </Badge>
            )}
            {pkg.lectureCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400">
                <BookOpen className="w-2.5 h-2.5" />
                {pkg.lectureCount} লেকচার
              </Badge>
            )}
            {pkg.totalContent > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                <Layers className="w-2.5 h-2.5" />
                মোট {pkg.totalContent}টি
              </Badge>
            )}
          </div>

          {!isPurchased && !isPending && (
            <div className="mb-3">
              <Select
                value={selectedClass}
                onValueChange={(v) => onClassChange(pkg.id, v)}
              >
                <SelectTrigger className={cn(
                  "w-full h-9 text-xs bg-muted/30 border-border/50",
                  !selectedClass && "border-dashed"
                )}>
                  <GraduationCap className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {classLevelBuyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                ৳{Math.round(pkg.price)}
              </span>
              {pkg.originalPrice > pkg.price && (
                <span className="text-xs text-muted-foreground line-through">
                  ৳{Math.round(pkg.originalPrice)}
                </span>
              )}
            </div>
            {isPurchased ? (
              <Button
                size="sm"
                disabled
                className="gap-1.5 bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs h-8 cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                সক্রিয়
              </Button>
            ) : isPending ? (
              <Button
                size="sm"
                disabled
                className="gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs h-8 cursor-not-allowed"
              >
                <Clock className="w-3.5 h-3.5" />
                অপেক্ষমাণ
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs h-8"
                disabled={!selectedClass}
                onClick={() => onBuy(pkg, selectedClass)}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                কিনুন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default memo(PackageCard)