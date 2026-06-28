'use client'

import { Package, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useContentTypes } from '@/hooks/use-content-types'
import { BundleItemData } from '@/types/user-dashboard'

interface BundleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  items: BundleItemData[]
  loading: boolean
  onNavigate: (type: string, id: string) => void
}

export function BundleDetailDialog({
  open,
  onOpenChange,
  title,
  items,
  loading,
  onNavigate
}: BundleDetailDialogProps) {
  const { getLabel, getIcon, getTextColor, getLightColor } = useContentTypes()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>বান্ডেল বিস্তারিত</DialogTitle>
        </DialogHeader>
        <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 p-5">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Package className="size-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{title || 'বান্ডেল'}</h3>
              <p className="text-teal-100/80 text-sm">বান্ডেলের কন্টেন্টসমূহ</p>
            </div>
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো আইটেম নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => {
                const ItemIcon = getIcon(item.contentType)
                const itemColor = `${getLightColor(item.contentType)} ${getTextColor(item.contentType)}`
                return (
                  <Card
                    key={item.id}
                    className="border shadow-none cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      onNavigate(item.contentType, item.contentId)
                      onOpenChange(false)
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn('p-1.5 rounded-lg shrink-0', itemColor)}>
                        <ItemIcon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.contentTitle || `${getLabel(item.contentType) || 'কন্টেন্ট'} ${idx + 1}`}
                        </p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 mt-1">
                          {getLabel(item.contentType) || item.contentType}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold">৳{item.contentPrice}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
