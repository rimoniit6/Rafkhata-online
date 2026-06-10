'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Eye, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export type AccessStatus = 'free' | 'purchased' | 'locked' | 'pending'

interface PremiumBadgeProps {
  status?: AccessStatus
  size?: 'sm' | 'default'
  className?: string
}

const badgeConfig: Record<AccessStatus, { text: string; icon: ReactNode; className: string }> = {
  free: {
    text: 'ফ্রি',
    icon: <Eye className="size-3" />,
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  },
  purchased: {
    text: 'কেনা',
    icon: <CheckCircle2 className="size-3" />,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  locked: {
    text: 'প্রিমিয়াম',
    icon: <Lock className="size-3" />,
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
  pending: {
    text: 'অপেক্ষমাণ',
    icon: <AlertCircle className="size-3" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
}

export function PremiumBadge({ status = 'locked', size = 'default', className }: PremiumBadgeProps) {
  const config = badgeConfig[status]
  return (
    <Badge className={cn(size === 'sm' ? 'text-[10px] px-1.5 gap-0.5' : 'text-xs gap-1', config.className, className)}>
      {size === 'sm' ? null : config.icon} {config.text}
    </Badge>
  )
}

export default PremiumBadge
