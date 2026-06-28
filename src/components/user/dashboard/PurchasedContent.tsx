'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useContentTypes } from '@/hooks/use-content-types'
import { cn } from '@/lib/utils'
import {
DetailedPayment,
SubscriptionData
} from '@/types/user-dashboard'
import { Calendar,Crown,Eye,Package,ShoppingBag,Zap } from 'lucide-react'
import {
categoryConfig
} from './DashboardConstants'

interface PurchasedContentProps {
  loading: boolean
  approvedPayments: DetailedPayment[]
  subscriptionPayments: DetailedPayment[]
  bundlePayments: DetailedPayment[]
  individualPayments: DetailedPayment[]
  activeSubscriptions: SubscriptionData[]
  onNavigate: (type: string, id: string) => void
  onExplore: () => void
}

export function PurchasedContent({
  loading,
  approvedPayments,
  subscriptionPayments,
  bundlePayments,
  individualPayments,
  activeSubscriptions,
  onNavigate,
  onExplore
}: PurchasedContentProps) {
  const { getLabel, getIcon, getTextColor, getLightColor } = useContentTypes()

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const renderPurchaseCard = (payment: DetailedPayment, index: number, category: any) => {
    const ContentIcon = getIcon(payment.contentType)
    const colorClass = `${getLightColor(payment.contentType)} ${getTextColor(payment.contentType)}`
    const config = categoryConfig[category as keyof typeof categoryConfig]
    const CategoryIcon = config.icon

    return (
      <div
        key={payment.id}
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <Card
          className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 active:scale-[0.99] group"
          onClick={() => onNavigate(payment.contentType, payment.contentId)}
        >
          <div className={cn('h-1.5', config.topStripClass)} />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className={cn('p-2.5 rounded-xl shrink-0 shadow-sm', colorClass)}>
                <ContentIcon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {payment.contentTitle}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium">
                    {getLabel(payment.contentType) || payment.contentType}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(payment.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  ৳{payment.amount}
                </p>
                <Badge className={cn('text-[9px] h-5 px-1.5 gap-0.5', config.badgeClass)}>
                  <CategoryIcon className="size-2.5" />
                  {config.label}
                </Badge>
              </div>
            </div>
            {payment.contentType !== 'package' && (
              <Button
                className="w-full mt-3 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8 shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 transition-all duration-200 font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(payment.contentType, payment.contentId)
                }}
              >
                <Eye className="size-3.5" />
                দেখুন / পড়ুন
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-5 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (approvedPayments.length === 0 && activeSubscriptions.length === 0) {
    return (
      <div className="mt-5">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-40" />
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center mb-4">
              <ShoppingBag className="size-8 text-emerald-400 dark:text-emerald-500" />
            </div>
            <p className="font-semibold text-lg">কোনো কন্টেন্ট কেনেনি</p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">প্রিমিয়াম কন্টেন্ট কিনলে এখানে দেখাবে</p>
            <Button
              className="mt-5 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20"
              onClick={onExplore}
            >
              <Zap className="size-4" />
              কন্টেন্ট খুঁজুন
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-8">
      {subscriptionPayments.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('p-2 rounded-xl', categoryConfig.subscription.headerIconBg)}>
              <Crown className={cn('size-5', categoryConfig.subscription.headerIconColor)} />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                সাবস্ক্রিপশন
                <Badge className={cn('text-[10px] h-5 px-2 gap-1', categoryConfig.subscription.badgeClass)}>
                  {subscriptionPayments.length}টি
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">সাবস্ক্রিপশনের মাধ্যমে কেনা</p>
            </div>
          </div>

          {activeSubscriptions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {activeSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="animate-fade-in-up"
                >
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-purple-400 to-violet-500" />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 shrink-0">
                          <Crown className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{sub.packageName}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30 text-[10px] h-5 px-1.5 gap-0.5">
                              {sub.daysRemaining} দিন বাকি
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {sub.classLabel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subscriptionPayments.map((payment, index) => renderPurchaseCard(payment, index, 'subscription'))}
          </div>
        </div>
      )}

      {bundlePayments.length > 0 && (
        <div>
          <Separator className="mb-6" />
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('p-2 rounded-xl', categoryConfig.bundle.headerIconBg)}>
              <Package className={cn('size-5', categoryConfig.bundle.headerIconColor)} />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                বান্ডেল
                <Badge className={cn('text-[10px] h-5 px-2 gap-1', categoryConfig.bundle.badgeClass)}>
                  {bundlePayments.length}টি
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">বান্ডেল থেকে কেনা</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bundlePayments.map((payment, index) => renderPurchaseCard(payment, index, 'bundle'))}
          </div>
        </div>
      )}

      {individualPayments.length > 0 && (
        <div>
          <Separator className="mb-6" />
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('p-2 rounded-xl', categoryConfig.individual.headerIconBg)}>
              <ShoppingBag className={cn('size-5', categoryConfig.individual.headerIconColor)} />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                ব্যক্তিগত ক্রয়
                <Badge className={cn('text-[10px] h-5 px-2 gap-1', categoryConfig.individual.badgeClass)}>
                  {individualPayments.length}টি
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">ব্যক্তিগতভাবে কেনা</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {individualPayments.map((payment, index) => renderPurchaseCard(payment, index, 'individual'))}
          </div>
        </div>
      )}
    </div>
  )
}
