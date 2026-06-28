'use client'

import { Input } from '@/components/ui/input'
import { useBoardFilterStore } from '@/store/board-filters'
import { AnimatePresence,motion } from 'framer-motion'
import { BookOpen,Clock,Search,TrendingUp,X } from 'lucide-react'
import { useCallback,useEffect,useRef,useState } from 'react'

const RECENT_SEARCHES_KEY = 'board-q-recent-searches'
const MAX_RECENT = 5

const SUGGESTIONS = [
  { text: 'Rajshahi Board 2024 Mathematics', type: 'question' as const, icon: BookOpen },
  { text: 'Dhaka Board 2023 Physics', type: 'question' as const, icon: BookOpen },
  { text: 'SSC Board Questions', type: 'question' as const, icon: BookOpen },
  { text: 'HSC 2024 All Boards', type: 'question' as const, icon: BookOpen },
  { text: 'Chapter 5: Chemical Bonding', type: 'question' as const, icon: BookOpen },
]

export function ExplorerSearch() {
  const { searchQuery, setSearchQuery } = useBoardFilterStore()
  const [focused, setFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const saveRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT)
    setRecentSearches(updated)
    try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)) } catch { }
  }, [recentSearches])

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) saveRecentSearch(searchQuery)
  }

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text)
    saveRecentSearch(text)
    setFocused(false)
  }

  const handleRemoveRecent = (text: string) => {
    const updated = recentSearches.filter((s) => s !== text)
    setRecentSearches(updated)
    try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)) } catch { }
  }

  const showSuggestions = focused && !searchQuery
  const showSearchResults = focused && searchQuery

  return (
    <div ref={containerRef} className="relative max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <motion.div
          initial={false}
          animate={{
            boxShadow: focused
              ? '0 4px 24px hsl(var(--primary)/0.12), 0 0 0 2px hsl(var(--primary)/0.2)'
              : '0 1px 3px hsl(var(--border))',
          }}
          transition={{ duration: 0.2 }}
          className="relative flex items-center bg-card rounded-2xl border border-border/60 overflow-hidden"
        >
          <div className="pl-4 pr-2">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder='Search boards, subjects, chapters, years...'
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-14 text-base placeholder:text-muted-foreground/50"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={handleClear}
                className="mr-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </form>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                {recentSearches.map((text) => (
                  <div key={text} className="flex items-center group px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(text)}
                      className="flex-1 text-sm text-left text-foreground"
                    >
                      {text}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecent(text)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Popular Searches
              </div>
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.text}
                    type="button"
                    onClick={() => handleSuggestionClick(s.text)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{s.text}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-2">
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground">
                <Search className="h-3 w-3" />
                Search results for &ldquo;{searchQuery}&rdquo;
              </div>
              {SUGGESTIONS.filter((s) =>
                s.text.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Press Enter to search all questions
                </div>
              ) : (
                SUGGESTIONS.filter((s) =>
                  s.text.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => handleSuggestionClick(s.text)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{s.text}</span>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
