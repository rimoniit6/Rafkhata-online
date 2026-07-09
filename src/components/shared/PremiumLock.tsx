'use client'

import { useState } from 'react'

import { Lock, Crown, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PremiumBadge from './PremiumBadge'
import PurchaseOptionsModal from './PurchaseOptionsModal'

interface PremiumLockProps {
  onUpgrade?: () => void
  title?: string
  description?: string
  purchased?: boolean
  pendingPayment?: boolean
  price?: number
  contentType?: string
  contentId?: string
  contentTitle?: string
  classLevel?: string
  children?: React.ReactNode
}

export default function PremiumLock({
  onUpgrade,
  title = 'প্রিমিয়াম কন্টেন্ট',
  description = 'এই কন্টেন্টটি দেখতে পেমেন্ট করুন',
  purchased = false,
  pendingPayment = false,
  price,
  contentType,
  contentId,
  contentTitle,
  classLevel,
  children,
}: PremiumLockProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Determine if we should show the 3-option modal or just call onUpgrade
  const hasContentDetails = !!(contentType && contentId && price && price > 0)

  const handleUpgrade = () => {
    if (hasContentDetails) {
      setShowPurchaseModal(true)
    } else if (onUpgrade) {
      onUpgrade()
    }
  }

  // If purchased, show content with "কেনা" badge
  if (purchased) {
    return (
      <div className="relative">
        {/* কেনা Badge - floating top right */}
        <div className="animate-scale-in absolute top-3 right-3 z-20">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 px-2.5 py-1 text-xs font-semibold shadow-sm border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-3.5" />
            কেনা
          </Badge>
        </div>
        {children}
      </div>
    )
  }

  // If payment is pending, show pending state
  if (pendingPayment) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred placeholder background */}
        <div className="premium-blur absolute inset-0 bg-gradient-to-br from-edu-primary/5 to-edu-accent/5">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.55_0.2_160/0.03)_10px,oklch(0.55_0.2_160/0.03)_20px)]" />
        </div>

        {/* Glass overlay */}
        <div className="animate-fade-in relative glass-card flex flex-col items-center justify-center py-12 px-6 text-center min-h-[200px]">
          {/* Pending icon with animation */}
          <div className="animate-float relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">পেমেন্ট অপেক্ষমাণ</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            আপনার পেমেন্ট যাচাই করা হচ্ছে। অনুমোদিত হলে কন্টেন্টটি দেখতে পারবেন।
          </p>

          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1 px-3 py-1">
            <Clock className="size-3.5" />
            অপেক্ষমাণ
          </Badge>
        </div>
      </div>
    )
  }

  // Default: Show lock
  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred placeholder background */}
        <div className="premium-blur absolute inset-0 bg-gradient-to-br from-edu-primary/5 to-edu-accent/5">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.55_0.2_160/0.03)_10px,oklch(0.55_0.2_160/0.03)_20px)]" />
        </div>

        {/* Glass overlay */}
        <div className="animate-fade-in relative glass-card flex flex-col items-center justify-center py-12 px-6 text-center min-h-[200px]">
          {/* Lock icon with animation */}
          <div className="animate-float relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-edu-premium/10 border border-edu-premium/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-edu-premium" />
            </div>
            <div className="animate-pulse-soft absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-edu-premium" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>

          {price && price > 0 ? (
            <div className="flex items-center gap-2 mb-4 text-edu-premium">
              <Crown className="w-5 h-5" />
              <span className="text-xl font-bold">৳{price}</span>
            </div>
          ) : (
            <PremiumBadge size="sm" className="mb-4" />
          )}

          <Button
            onClick={handleUpgrade}
            className="bg-edu-premium hover:bg-edu-premium/90 text-white gap-2 shadow-lg shadow-edu-premium/20"
          >
            <Crown className="w-4 h-4" />
            {price && price > 0 ? 'কেনার অপশন দেখুন' : 'প্রিমিয়াম আনলক করুন'}
          </Button>
        </div>
      </div>

      {/* Purchase Options Modal */}
      {hasContentDetails && (
        <PurchaseOptionsModal
          open={showPurchaseModal}
          onOpenChange={setShowPurchaseModal}
          contentType={contentType!}
          contentId={contentId!}
          contentTitle={contentTitle || title}
          contentPrice={price || 0}
          classLevel={classLevel}
        />
      )}
    </>
  )
}
