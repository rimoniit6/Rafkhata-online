'use client'

import { Crown, Sparkles, Tag, Gift, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthUser } from '@/store/auth'
import { cn } from '@/lib/utils'
import { toDecimal } from '@/lib/decimal'
import type { PackageOffer, BundleOffer } from '@/types/board-questions'

interface PremiumLockOverlayProps {
  price: number
  packages?: PackageOffer[]
  bundles?: BundleOffer[]
  onAction: () => void
  className?: string
}

function findLowestPrice(packages: PackageOffer[], bundles: BundleOffer[], directPrice: number): number {
  let min = toDecimal(directPrice)
  for (const pkg of packages) { if (toDecimal(pkg.price) > 0 && toDecimal(pkg.price) < min) min = toDecimal(pkg.price) }
  for (const bundle of bundles) { if (toDecimal(bundle.price) > 0 && toDecimal(bundle.price) < min) min = toDecimal(bundle.price) }
  return min
}

export function PremiumLockOverlay({ price, packages = [], bundles = [], onAction, className }: PremiumLockOverlayProps) {
  const user = useAuthUser()
  const isGuest = !user
  const hasOffers = packages.length > 0 || bundles.length > 0
  const lowestPrice = findLowestPrice(packages, bundles, price)

  return (
    <div className={cn(
      'absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center',
      'bg-gradient-to-b from-background/80 via-background/60 to-background/80 backdrop-blur-[2px]',
      className,
    )}>
      <div className="flex flex-col items-center gap-3 max-w-[220px]">
        <div className="relative">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 animate-pulse-soft">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">Premium Question</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isGuest ? 'Log in to access this question.' : hasOffers ? 'Available in a package or bundle.' : 'Purchase to unlock.'}
        </p>
        {lowestPrice > 0 && (
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">৳{lowestPrice}</span>
        )}
        {hasOffers && (
          <div className="w-full space-y-1">
            {packages.slice(0, 2).map((pkg) => (
              <div key={pkg.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{pkg.title}</span>
                {pkg.discount > 0 && <span className="text-[10px] text-emerald-600 shrink-0">-{pkg.discount}%</span>}
              </div>
            ))}
            {bundles.slice(0, 2).map((bundle) => (
              <div key={bundle.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Gift className="h-3 w-3 shrink-0 text-violet-500/60" />
                <span className="truncate">{bundle.title}</span>
                {bundle.discount > 0 && <span className="text-[10px] text-emerald-600 shrink-0">-{bundle.discount}%</span>}
              </div>
            ))}
          </div>
        )}
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onAction() }}
          className="gap-2 h-9 px-4 text-xs rounded-xl font-medium shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
          {isGuest ? <><Eye className="h-3.5 w-3.5" /> Login & Unlock</> : <><Crown className="h-3.5 w-3.5" /> {hasOffers ? 'View Offers' : 'Purchase Now'}</>}
        </Button>
      </div>
    </div>
  )
}
