'use client'

import { Button } from '@/components/ui/button'
import { toBengaliNumerals } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { useIsMobile } from '@/hooks/use-mobile'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Crown, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

interface PremiumBannerProps {
  totalQuestions: number
  accessibleQuestions: number
  premiumQuestions: number
  loading?: boolean
}

export function PremiumBanner({ totalQuestions, accessibleQuestions, premiumQuestions, loading }: PremiumBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const user = useAuthUser()
  const navigate = useRouterStore((s) => s.navigate)
  const isMobile = useIsMobile()

  if (dismissed || premiumQuestions === 0 || loading) return null

  const isFreeUser = !!user && !user.isPremium
  if (!isFreeUser && !!user) return null

  const lockedCount = totalQuestions - accessibleQuestions

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className={isMobile ? 'relative p-3 space-y-3' : 'relative p-4 flex items-center justify-between gap-4'}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shrink-0">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
                {toBengaliNumerals(lockedCount)} locked question{lockedCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/70 truncate">
                {toBengaliNumerals(accessibleQuestions)} accessible · {toBengaliNumerals(premiumQuestions)} premium
                {!user && ' · Log in to unlock'}
              </p>
            </div>
          </div>
          <div className={isMobile ? 'flex items-center justify-between gap-2' : 'flex items-center gap-2 shrink-0'}>
            <Button size="sm" onClick={() => navigate(!user ? 'login' : 'premium')}
              className="gap-1.5 h-8 px-3 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
            >
              {!user ? <><ArrowRight className="h-3 w-3" /> Login & Unlock</> : <><Sparkles className="h-3 w-3" /> Upgrade Now</>}
            </Button>
            <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors">
              <X className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
