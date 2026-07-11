'use client'

import Image from 'next/image'
import React, { memo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Package,
  Percent,
  ShoppingBag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import type { Bundle } from './types'

interface BundleCardProps {
  bundle: Bundle
  typeLabels: Record<string, { label: string; icon: typeof Package; color: string }>
  isPurchased: boolean
  isPending: boolean
  onOpenDetail: (id: string) => void
  onBuy: (bundle: Bundle) => void
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function BundleCard({ bundle, typeLabels, isPurchased, isPending, onOpenDetail, onBuy }: BundleCardProps) {
  const metadata = useHierarchyMetadata()
  const typeConfig = typeLabels[bundle.type] || typeLabels.mixed
  const TypeIcon = typeConfig.icon

  return (
    <motion.div variants={item} layout>
      <Card className="overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800 border-border/50 h-full flex flex-col">
        {/* Thumbnail */}
        <div
          className="relative h-44 overflow-hidden cursor-pointer"
          onClick={() => onOpenDetail(bundle.id)}
        >
          {bundle.thumbnail ? (
            <Image
              src={bundle.thumbnail}
              alt={bundle.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center">
              <Package className="w-12 h-12 text-emerald-300 dark:text-emerald-700" />
            </div>
          )}

          {bundle.discount > 0 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500/90 text-white border-0 gap-1 shadow-lg shadow-red-500/20 text-xs font-bold">
                <Percent className="w-3 h-3" />
                {bundle.discount}% ছাড়
              </Badge>
            </div>
          )}

          <div className="absolute top-2 right-2">
            <Badge className={cn('border-0 gap-1 text-xs font-medium', typeConfig.color)}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </Badge>
          </div>

          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
              <Layers className="w-3 h-3" />
              {bundle.itemCount}টি আইটেম
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <h3
            className="font-semibold text-sm line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors cursor-pointer mb-1"
            onClick={() => onOpenDetail(bundle.id)}
          >
            {bundle.title}
          </h3>

          {bundle.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-3">
              <RichContentRenderer content={bundle.description} />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
            {bundle.classLevel && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                <GraduationCap className="w-2.5 h-2.5" />
                {bundle.classLevel ? metadata.classLevelLabels[bundle.classLevel] || bundle.classLevel : ''}
              </Badge>
            )}
            {bundle.board && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                {bundle.board ? metadata.boardSlugToLabel[bundle.board] || bundle.board : ''}
              </Badge>
            )}
            {bundle.year && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400">
                {bundle.year}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ৳{Math.round(bundle.price)}
              </span>
              {bundle.originalPrice > bundle.price && (
                <span className="text-xs text-muted-foreground line-through">
                  ৳{Math.round(bundle.originalPrice)}
                </span>
              )}
            </div>
            {isPurchased ? (
              <Button
                size="sm"
                disabled
                className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs h-8 cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                কেনা হয়েছে
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
                className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs h-8"
                onClick={() => onBuy(bundle)}
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

export default memo(BundleCard)