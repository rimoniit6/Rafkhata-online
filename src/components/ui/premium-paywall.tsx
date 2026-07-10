'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { useIsAuthenticated } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { Crown,Lock,Sparkles } from 'lucide-react'
import { useState } from 'react'

import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'

interface PremiumPaywallProps {
  contentType: string
  contentId: string
  price: number
  title: string
  isPremium: boolean
  board?: string
  year?: string
  classLevel?: string
}

export default function PremiumPaywall({
  contentType,
  contentId,
  price,
  title,
  isPremium,
  classLevel,
}: PremiumPaywallProps) {
  const navigate = useRouterStore((s) => s.navigate)
  const isAuthenticated = useIsAuthenticated()
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // If content is not premium, no paywall needed
  if (!isPremium) {
    return null
  }

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate('login')
      return
    }
    // Open the 3-option purchase modal instead of navigating directly
    setShowPurchaseModal(true)
  }

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 backdrop-blur-md bg-edu-premium-light/60 dark:bg-edu-premium-light/20 rounded-xl z-0" />

      <div className="animate-scale-in relative z-10 p-4 sm:p-6">
        <Card className="w-full border-edu-premium/20 dark:border-edu-premium/30 bg-white/80 dark:bg-card/90 backdrop-blur-sm shadow-xl shadow-edu-premium/5">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="animate-pulse-soft relative mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-edu-premium-light/80 dark:bg-edu-premium-light/30 border border-edu-premium/30 dark:border-edu-premium/40 flex items-center justify-center">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-edu-premium" />
              </div>
              <div className="animate-pulse-soft absolute -top-1.5 -right-1.5">
                <Sparkles className="w-5 h-5 text-edu-premium" />
              </div>
            </div>

            <Badge variant="outline" className="mb-4 border-edu-premium/40 text-edu-premium bg-edu-premium-light/50 dark:bg-edu-premium-light/20 px-3 py-1">
              <Lock className="w-3 h-3 mr-1" />
              প্রিমিয়াম
            </Badge>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              প্রিমিয়াম কন্টেন্ট
            </h3>

            <p className="text-sm text-muted-foreground mb-1 max-w-xs line-clamp-2">
              {title}
            </p>

            <p className="text-xs text-muted-foreground/80 mb-5 max-w-xs">
              কন্টেন্ট আনলক করতে নিচের বাটনে ক্লিক করুন
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                ৳{price}
              </span>
              <span className="text-sm text-muted-foreground">/ কন্টেন্ট</span>
            </div>

            <div className="w-full">
              <Button
                onClick={handleBuy}
                className="w-full gap-2 bg-edu-premium hover:bg-edu-premium/90 text-white shadow-lg shadow-edu-premium/25 h-11 sm:h-12 text-base font-semibold"
              >
                <Crown className="w-4 h-4" />
                কেনার অপশন দেখুন
              </Button>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground mt-4">
                কিনতে প্রথমে <span className="text-edu-premium font-medium cursor-pointer" onClick={() => navigate('login')}>লগইন</span> করুন
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase Options Modal */}
      <PurchaseOptionsModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        contentType={contentType}
        contentId={contentId}
        contentTitle={title}
        contentPrice={price}
        classLevel={classLevel}
      />
    </div>
  )
}
