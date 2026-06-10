import type { LucideIcon } from 'lucide-react'
import { Crown, Package, ShoppingBag } from 'lucide-react'

export const FALLBACK_GRADIENTS: Record<string, string> = {
  mcq: 'from-violet-500 to-purple-600',
  cq: 'from-emerald-500 to-teal-600',
  lecture: 'from-sky-500 to-blue-600',
  suggestion: 'from-amber-500 to-orange-600',
  exam: 'from-rose-500 to-pink-600',
  bundle: 'from-teal-500 to-emerald-600',
  package: 'from-purple-500 to-violet-600',
  'board-mcq': 'from-violet-500 to-purple-600',
  'board-cq': 'from-emerald-500 to-teal-600',
  'mcq-exam-package': 'from-emerald-500 to-teal-600',
}

export const getGradient = (key: string) => FALLBACK_GRADIENTS[key] || 'from-gray-500 to-slate-600'

export const methodLabels: Record<string, string> = {
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
}

export type PurchaseCategory = 'subscription' | 'bundle' | 'individual'

export function getPurchaseCategory(contentType: string): PurchaseCategory {
  if (contentType === 'package') return 'subscription'
  if (contentType === 'bundle') return 'bundle'
  return 'individual'
}

export const categoryConfig: Record<PurchaseCategory, {
  label: string
  icon: LucideIcon
  color: string
  bgGradient: string
  badgeClass: string
  headerIconBg: string
  headerIconColor: string
  topStripClass: string
  description: string
}> = {
  subscription: {
    label: 'সাবস্ক্রিপশন',
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-500 to-violet-600',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30',
    headerIconBg: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    headerIconColor: 'text-purple-600 dark:text-purple-400',
    topStripClass: 'bg-gradient-to-r from-purple-400 to-violet-500',
    description: 'সাবস্ক্রিপশনের মাধ্যমে কেনা',
  },
  bundle: {
    label: 'বান্ডেল',
    icon: Package,
    color: 'text-teal-600 dark:text-teal-400',
    bgGradient: 'from-teal-500 to-emerald-600',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200/50 dark:border-teal-800/30',
    headerIconBg: 'bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40',
    headerIconColor: 'text-teal-600 dark:text-teal-400',
    topStripClass: 'bg-gradient-to-r from-teal-400 to-emerald-500',
    description: 'বান্ডেল থেকে কেনা',
  },
  individual: {
    label: 'ব্যক্তিগত ক্রয়',
    icon: ShoppingBag,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500 to-teal-600',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/30',
    headerIconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
    headerIconColor: 'text-emerald-600 dark:text-emerald-400',
    topStripClass: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    description: 'ব্যক্তিগতভাবে কেনা',
  },
}
