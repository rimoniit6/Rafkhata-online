'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DrillDownItem {
  label: string
  value: number
  subtitle?: string
  metadata?: Record<string, string | number>
}

interface DrillDownModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  items: DrillDownItem[]
  formatValue?: (value: number) => string
  emptyMessage?: string
}

export default function DrillDownModal({
  open,
  onClose,
  title,
  description,
  items,
  formatValue,
  emptyMessage = 'No items found',
}: DrillDownModalProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    )
  }, [items, search])

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{emptyMessage}</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {item.metadata && Object.entries(item.metadata).slice(0, 2).map(([k, v]) => (
                    <span key={k} className="text-xs text-muted-foreground tabular-nums">
                      {k}: {typeof v === 'number' ? v.toLocaleString('bn-BD') : v}
                    </span>
                  ))}
                  <span className="text-sm font-semibold tabular-nums">
                    {formatValue ? formatValue(item.value) : item.value.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
