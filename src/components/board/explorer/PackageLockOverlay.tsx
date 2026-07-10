'use client'

import { Lock, Tag, Gift, Sparkles, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'
import { toDecimal } from '@/lib/decimal'
import type { PackageOffer, BundleOffer } from '@/types/board-questions'

interface PackageLockOverlayProps {
  price: number
  packages?: PackageOffer[]
  bundles?: BundleOffer[]
  onAction: () => void
  className?: string
}

export function PackageLockOverlay({
  price,
  packages = [],
  bundles = [],
  onAction,
  className,
}: PackageLockOverlayProps) {
  const user = useAuthUser()
  const isGuest = !user

  const hasOffers = packages.length > 0 || bundles.length > 0
  const lowestPrice = findLowestPrice(packages, bundles, price)

  return (
    <div className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center',
        'bg-gradient-to-b from-background/80 via-background/60 to-background/80',
        'backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 max-w-[240px] animate-scale-in">
        <div className="relative">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 animate-pulse-soft">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Locked Question</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {isGuest ? 'Log in to access this question.' : hasOffers ? 'Available in a package or bundle.' : 'Purchase to unlock this question.'}
          </p>
        </div>

        {lowestPrice > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">৳{lowestPrice}</span>
          </div>
        )}

        {hasOffers && (
          <div className="w-full space-y-1.5">
            {packages.length > 0 && (
              <div className="text-left">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Packages</p>
                <div className="space-y-1 max-h-[72px] overflow-y-auto">
                  {packages.slice(0, 2).map((pkg) => (
                    <div key={pkg.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Tag className="h-3 w-3 shrink-0 text-primary/60" />
                      <span className="truncate">{pkg.title}</span>
                      {pkg.discount > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">-{pkg.discount}%</span>
                      )}
                    </div>
                  ))}
                  {packages.length > 2 && (
                    <p className="text-[10px] text-muted-foreground/50">+{packages.length - 2} more</p>
                  )}
                </div>
              </div>
            )}
            {bundles.length > 0 && (
              <div className="text-left">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Bundles</p>
                <div className="space-y-1 max-h-[72px] overflow-y-auto">
                  {bundles.slice(0, 2).map((bundle) => (
                    <div key={bundle.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Gift className="h-3 w-3 shrink-0 text-violet-500/60" />
                      <span className="truncate">{bundle.title}</span>
                      {bundle.discount > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">-{bundle.discount}%</span>
                      )}
                    </div>
                  ))}
                  {bundles.length > 2 && (
                    <p className="text-[10px] text-muted-foreground/50">+{bundles.length - 2} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onAction() }}
          className={cn(
            'gap-2 h-9 px-4 text-xs rounded-xl font-medium shadow-sm',
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
          )}
        >
          {isGuest ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              Login & Unlock
            </>
          ) : hasOffers ? (
            <>
              <Gift className="h-3.5 w-3.5" />
              View Offers
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Purchase Now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function findLowestPrice(packages: PackageOffer[], bundles: BundleOffer[], directPrice: number): number {
  let min = toDecimal(directPrice)
  for (const pkg of packages) {
    if (toDecimal(pkg.price) > 0 && toDecimal(pkg.price) < min) min = toDecimal(pkg.price)
  }
  for (const bundle of bundles) {
    if (toDecimal(bundle.price) > 0 && toDecimal(bundle.price) < min) min = toDecimal(bundle.price)
  }
  return min
}
