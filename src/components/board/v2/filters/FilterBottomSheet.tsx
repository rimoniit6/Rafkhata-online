'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterBottomSheetProps {
  open: boolean
  onClose: () => void
  filterCount: number
  children: ReactNode
}

export function FilterBottomSheet({ open, onClose, filterCount, children }: FilterBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed left-0 right-0 bottom-0 z-50 max-h-[85vh] bg-background bottom-sheet overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Filters</span>
                {filterCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {filterCount}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>

            <div className="px-4 py-3 border-t border-border/40 shrink-0">
              <Button onClick={onClose} className="w-full h-11 rounded-xl text-sm font-medium">
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
