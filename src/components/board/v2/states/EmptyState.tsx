'use client'

import { motion } from 'framer-motion'
import { Search, Filter, BookOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoardFilterStore } from '@/store/board-filters'

export function EmptyState() {
  const filterCount = useBoardFilterStore((s) => s.getFilterCount())
  const searchQuery = useBoardFilterStore((s) => s.searchQuery)
  const clearFilters = useBoardFilterStore((s) => s.clearFilters)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <motion.div
        className="relative mb-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 shadow-sm">
          <Search className="w-12 h-12 text-muted-foreground/40" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-amber-500/20"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
        />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2">No Questions Found</h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
        {searchQuery
          ? 'No results match "' + searchQuery + '". Try a different search term.'
          : filterCount > 0
            ? 'No questions match your current filters. Try adjusting or removing some filters.'
            : 'No board questions are available yet. New content is being added regularly.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {filterCount > 0 && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={clearFilters} variant="outline" className="gap-2 rounded-xl">
              <Filter className="h-4 w-4" />
              Remove All Filters
            </Button>
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              clearFilters()
              useBoardFilterStore.getState().setSearchQuery('')
            }}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reset & Try Again
          </Button>
        </motion.div>
      </div>

      <div className="mt-8 pt-8 border-t border-border/40 w-full max-w-md">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'Change Board selection',
            'Try a different Year',
            'Search with different keywords',
            'Check other Class levels',
          ].map((tip) => (
            <span key={tip} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              {tip}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
