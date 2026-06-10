'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Package, Timer, X, CheckCircle2, ShoppingCart,
  Layers, BadgePercent, Clock, GraduationCap, Sparkles,
  ArrowRight, Loader2, BookOpen, FileQuestion, ClipboardList,
  BookOpenCheck, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useContentTypes } from '@/hooks/use-content-types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import SafeImage from '@/components/ui/safe-image'
import { cn } from '@/lib/utils'

// ============ TYPES ============

interface BundleInfo {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  discount: number
  classLevel: string | null
  board: string | null
  year: string | null
  type: string
  order: number
}

interface PackageInfo {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  duration: number
  durationLabel: string
  classLevel: string | null
  order: number
  mcqCount: number
  cqCount: number
  lectureCount: number
  totalContent: number
  discount: number
}

interface PurchaseOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: string // mcq, cq, lecture, board-mcq, board-cq, exam, suggestion
  contentId: string
  contentTitle: string
  contentPrice: number
  classLevel?: string
}

// ============ CONTENT TYPE CONFIG ============

// Fallback content type config (used before content types load from DB)
const FALLBACK_CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  mcq: { label: 'MCQ', icon: FileQuestion, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  cq: { label: 'সৃজনশীল প্রশ্ন', icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  lecture: { label: 'লেকচার', icon: BookOpen, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
  'board-mcq': { label: 'বোর্ড MCQ', icon: FileQuestion, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  'board-cq': { label: 'বোর্ড সৃজনশীল প্রশ্ন', icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  exam: { label: 'পরীক্ষা', icon: GraduationCap, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  suggestion: { label: 'সাজেশন', icon: BookOpenCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
}

// ============ COMPONENT ============

export default function PurchaseOptionsModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  contentPrice,
  classLevel,
}: PurchaseOptionsModalProps) {
  const { navigate } = useRouterStore()
  const { isAuthenticated } = useAuthStore()
  const metadata = useHierarchyMetadata()
  const { contentTypesWithIcons, getLabel, getIcon } = useContentTypes()

  // Build dynamic contentTypeConfig from DB content types
  const contentTypeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {}
  for (const ct of contentTypesWithIcons) {
    contentTypeConfig[ct.key] = {
      label: ct.labelBn,
      icon: ct.Icon,
      color: `${ct.textColor || 'text-gray-600'} ${ct.lightColor || 'bg-gray-50 dark:bg-gray-950/30'}`,
    }
  }
  // Add board-mcq and board-cq variants
  contentTypeConfig['board-mcq'] = contentTypeConfig['board-mcq'] || {
    label: 'বোর্ড MCQ', icon: getIcon('board'), color: contentTypeConfig['board']?.color || FALLBACK_CONTENT_TYPE_CONFIG['board-mcq'].color,
  }
  contentTypeConfig['board-cq'] = contentTypeConfig['board-cq'] || {
    label: 'বোর্ড সৃজনশীল প্রশ্ন', icon: getIcon('board'), color: contentTypeConfig['board']?.color || FALLBACK_CONTENT_TYPE_CONFIG['board-cq'].color,
  }
  // Fill any missing keys from fallback
  for (const [key, val] of Object.entries(FALLBACK_CONTENT_TYPE_CONFIG)) {
    if (!contentTypeConfig[key]) contentTypeConfig[key] = val
  }

  const [bundles, setBundles] = useState<BundleInfo[]>([])
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [hasBundles, setHasBundles] = useState(false)
  const [showAllBundles, setShowAllBundles] = useState(false)
  const [showAllPackages, setShowAllPackages] = useState(false)
  const [selectedPackageClass, setSelectedPackageClass] = useState<Record<string, string>>({})
  const [purchaseStatus, setPurchaseStatus] = useState<'checking' | 'available' | 'pending' | 'purchased'>('checking')

  // Check purchase/pending status on open
  useEffect(() => {
    if (open) {
      setPurchaseStatus('checking')
      fetch(`/api/payment/check?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const d = data?.data || data
          if (d?.purchased) {
            setPurchaseStatus('purchased')
          } else if (d?.pendingPayment) {
            setPurchaseStatus('pending')
          } else {
            setPurchaseStatus('available')
          }
        })
        .catch(() => setPurchaseStatus('available'))
    }
  }, [open, contentType, contentId])

  // Fetch bundles and packages for this content
  const fetchOptions = useCallback(async () => {
    if (!contentType || !contentId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        contentType,
        contentId,
      })
      if (classLevel) params.set('classLevel', classLevel)

      const res = await fetch(`/api/content/bundles-for?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBundles(data.bundles || [])
        setPackages(data.packages || [])
        setHasBundles(data.hasBundles || false)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [contentType, contentId, classLevel])

  useEffect(() => {
    if (open) {
      fetchOptions()
      setShowAllBundles(false)
      setShowAllPackages(false)
    }
  }, [open, fetchOptions])

  // Handlers
  const handleBuyIndividual = () => {
    if (!isAuthenticated) {
      onOpenChange(false)
      navigate('login')
      return
    }
    onOpenChange(false)
    navigate('payment', {
      contentType,
      contentId,
      contentTitle,
      contentPrice: String(contentPrice),
    })
  }

  const handleBuyBundle = (bundle: BundleInfo) => {
    if (!isAuthenticated) {
      onOpenChange(false)
      navigate('login')
      return
    }
    onOpenChange(false)
    navigate('payment', {
      bundleId: bundle.id,
      contentTitle: bundle.title,
      contentPrice: String(bundle.price),
    })
  }

  const handleBuyPackage = (pkg: PackageInfo, selectedClass: string) => {
    if (!isAuthenticated) {
      onOpenChange(false)
      navigate('login')
      return
    }
    onOpenChange(false)
    navigate('payment', {
      contentType: 'package',
      contentId: pkg.id,
      contentTitle: pkg.title,
      contentPrice: String(pkg.price),
      classLevel: selectedClass || pkg.classLevel || classLevel || '',
    })
  }

  const contentConfig = contentTypeConfig[contentType] || contentTypeConfig.mcq
  const ContentIcon = contentConfig.icon

  // Visible bundles (show top 2 by default, expandable)
  const visibleBundles = showAllBundles ? bundles : bundles.slice(0, 2)
  const visiblePackages = showAllPackages ? packages : packages.slice(0, 2)

  // Calculate savings
  const bestBundleSavings = bundles.length > 0
    ? Math.max(...bundles.map(b => b.discount))
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg max-h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>কেনার অপশন</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[92vh]">
          {/* Header - Fixed at top */}
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 pb-6 shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
                  <ContentIcon className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="bg-white/25 text-white border-white/30 text-xs gap-1 mb-1.5 backdrop-blur-sm">
                    <Crown className="size-3" />
                    প্রিমিয়াম কন্টেন্ট
                  </Badge>
                  <h2 className="text-white font-bold text-base truncate leading-tight">
                    {contentTitle}
                  </h2>
                </div>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10 shrink-0 -mt-1 -mr-2"
                  >
                    <X className="size-5" />
                  </Button>
                </DialogClose>
              </div>
              <p className="text-white/85 text-sm leading-relaxed">
                এই কন্টেন্টটি কেনার জন্য আপনার জন্য সেরা অপশন বেছে নিন
              </p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {purchaseStatus === 'checking' ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">অবস্থা যাচাই করা হচ্ছে...</p>
              </div>
            ) : purchaseStatus === 'pending' ? (
              <div className="p-6 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <Clock className="size-16 text-amber-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">পেমেন্ট অপেক্ষমাণ</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                  আপনার এই কন্টেন্টের জন্য একটি পেমেন্ট ইতিমধ্যে জমা আছে। অ্যাডমিন যাচাইয়ের পর কন্টেন্টটি অ্যাক্সেস করতে পারবেন।
                </p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  বন্ধ করুন
                </Button>
              </div>
            ) : purchaseStatus === 'purchased' ? (
              <div className="p-6 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">ইতিমধ্যে কেনা হয়েছে</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                  আপনি ইতিমধ্যে এই কন্টেন্টটি কিনেছেন। এখন কন্টেন্টটি দেখুন।
                </p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  বন্ধ করুন
                </Button>
              </div>
            ) : (
            <>
            {/* Custom scrollbar */}
            <style jsx>{`
              div::-webkit-scrollbar { width: 4px; }
              div::-webkit-scrollbar-track { background: transparent; }
              div::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
              div::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            `}</style>

            <div className="p-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-8 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">কেনার অপশন খোঁজা হচ্ছে...</p>
                </div>
              ) : (
                <>
                  {/* ============ OPTION 1: INDIVIDUAL PURCHASE ============ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Card
                      className={cn(
                        'border-2 cursor-pointer hover:shadow-lg transition-all group',
                        'border-amber-200 dark:border-amber-800/50',
                        'bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20',
                        'hover:border-amber-300 dark:hover:border-amber-700'
                      )}
                      onClick={handleBuyIndividual}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 shrink-0 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="size-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm">একক ক্রয়</h3>
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs gap-0.5">
                                <Crown className="size-3" />
                                দ্রুত
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              শুধু এই {contentConfig.label} টি কিনুন — স্থায়ী অ্যাক্সেস
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-foreground">৳{contentPrice}</span>
                                <span className="text-xs text-muted-foreground">/ কন্টেন্ট</span>
                              </div>
                              <Button
                                size="sm"
                                className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8 shadow-md shadow-amber-500/20"
                              >
                                <ShoppingCart className="size-3.5" />
                                কিনুন
                                <ArrowRight className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* ============ OPTION 2: BUNDLE SUGGESTIONS ============ */}
                  {bundles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                          <Layers className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-sm">বান্ডেল থেকে কিনুন</h3>
                        {bestBundleSavings > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] gap-0.5">
                            <BadgePercent className="size-3" />
                            পর্যন্ত {bestBundleSavings}% সাশ্রয়!
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        এই কন্টেন্টটি নিচের বান্ডেলে অন্তর্ভুক্ত — বান্ডেল কিনলে আরও কন্টেন্ট পাবেন সাশ্রয়ী মূল্যে
                      </p>

                      <div className="space-y-2">
                        {visibleBundles.map((bundle) => (
                          <Card
                            key={bundle.id}
                            className="border border-emerald-200/60 dark:border-emerald-800/30 hover:shadow-md transition-all cursor-pointer bg-white/70 dark:bg-card/80 hover:border-emerald-300 dark:hover:border-emerald-700"
                            onClick={() => handleBuyBundle(bundle)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 dark:border-emerald-800/30">
                                  {bundle.thumbnail ? (
                                    <SafeImage src={bundle.thumbnail} alt={bundle.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="size-6 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-sm line-clamp-1">{bundle.title}</h4>
                                    {bundle.discount > 0 && (
                                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 text-[10px] px-1.5 shrink-0 gap-0.5">
                                        <BadgePercent className="size-2.5" />
                                        {bundle.discount}% ছাড়
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {bundle.classLevel && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                                        <GraduationCap className="size-2.5" />
                                        {metadata.classLevelLabels[bundle.classLevel] || bundle.classLevel}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase">
                                      {bundle.type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{Math.round(bundle.price)}</span>
                                      {bundle.originalPrice > bundle.price && (
                                        <span className="text-xs text-muted-foreground line-through">৳{Math.round(bundle.originalPrice)}</span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">স্থায়ী</span>
                                    </div>
                                    <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                                      <CheckCircle2 className="size-3" />
                                      বান্ডেল কিনুন
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {/* Show more bundles */}
                        {bundles.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs gap-1 text-muted-foreground"
                            onClick={() => setShowAllBundles(!showAllBundles)}
                          >
                            {showAllBundles ? (
                              <>
                                <ChevronUp className="size-3.5" />
                                কম দেখুন
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3.5" />
                                আরও {bundles.length - 2}টি বান্ডেল দেখুন
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ============ OPTION 3: PACKAGE SUGGESTIONS ============ */}
                  {packages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                          <Timer className="size-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h3 className="font-semibold text-sm">
                          {!hasBundles ? 'সাবস্ক্রিপশন প্যাকেজ' : 'অথবা প্যাকেজ কিনুন'}
                        </h3>
                        {!hasBundles && (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-[10px] gap-0.5">
                            <Sparkles className="size-3" />
                            আরও সাশ্রয়!
                          </Badge>
                        )}
                      </div>
                      {!hasBundles && (
                        <p className="text-xs text-muted-foreground mb-2">
                          এই কন্টেন্টটি কোনো বান্ডেলে নেই — প্যাকেজ কিনলে পুরো শ্রেণির সব প্রিমিয়াম কন্টেন্ট পাবেন
                        </p>
                      )}
                      {hasBundles && (
                        <p className="text-xs text-muted-foreground mb-2">
                          প্যাকেজ কিনলে নির্দিষ্ট সময়ের জন্য পুরো শ্রেণির সব কন্টেন্ট অ্যাক্সেস পাবেন
                        </p>
                      )}

                      <div className="space-y-2">
                        {visiblePackages.map((pkg) => {
                          const selectedClass = selectedPackageClass[pkg.id] || classLevel || pkg.classLevel || ''
                          return (
                            <Card
                              key={pkg.id}
                              className="border border-teal-200/60 dark:border-teal-800/30 hover:shadow-md transition-all cursor-pointer bg-white/70 dark:bg-card/80 hover:border-teal-300 dark:hover:border-teal-700"
                              onClick={() => {
                                if (selectedClass) {
                                  handleBuyPackage(pkg, selectedClass)
                                }
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-teal-200/50 dark:border-teal-800/30">
                                    {pkg.thumbnail ? (
                                      <SafeImage src={pkg.thumbnail} alt={pkg.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <Timer className="size-6 text-teal-600 dark:text-teal-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-medium text-sm line-clamp-1">{pkg.title}</h4>
                                      {pkg.discount > 0 && (
                                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 text-[10px] px-1.5 shrink-0 gap-0.5">
                                          <BadgePercent className="size-2.5" />
                                          {pkg.discount}% ছাড়
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                        <Clock className="size-2.5" />
                                        {pkg.durationLabel}
                                      </Badge>
                                      {(pkg.classLevel || classLevel) && (
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                                          <GraduationCap className="size-2.5" />
                                          {metadata.classLevelLabels[pkg.classLevel || classLevel || ''] || pkg.classLevel || classLevel}
                                        </Badge>
                                      )}
                                      {pkg.totalContent > 0 && (
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                          {pkg.totalContent}টি কন্টেন্ট
                                        </Badge>
                                      )}
                                    </div>
                                    {!selectedClass && metadata.classOptions.length > 0 && (
                                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          className="w-full text-xs border border-teal-200 dark:border-teal-800 rounded-lg px-2 py-1.5 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                                          value={selectedPackageClass[pkg.id] || ''}
                                          onChange={(e) => setSelectedPackageClass(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                        >
                                          <option value="">শ্রেণি নির্বাচন করুন</option>
                                          {metadata.classOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-teal-600 dark:text-teal-400">৳{Math.round(pkg.price)}</span>
                                        {pkg.originalPrice > pkg.price && (
                                          <span className="text-xs text-muted-foreground line-through">৳{Math.round(pkg.originalPrice)}</span>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs gap-1 bg-teal-500 hover:bg-teal-600 text-white"
                                        disabled={!selectedClass}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (selectedClass) {
                                            handleBuyPackage(pkg, selectedClass)
                                          }
                                        }}
                                      >
                                        <CheckCircle2 className="size-3" />
                                        প্যাকেজ কিনুন
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}

                        {/* Show more packages */}
                        {packages.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs gap-1 text-muted-foreground"
                            onClick={() => setShowAllPackages(!showAllPackages)}
                          >
                            {showAllPackages ? (
                              <>
                                <ChevronUp className="size-3.5" />
                                কম দেখুন
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3.5" />
                                আরও {packages.length - 2}টি প্যাকেজ দেখুন
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* No bundles and no packages found */}
                  {!loading && bundles.length === 0 && packages.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        বর্তমানে কোনো বান্ডেল বা প্যাকেজ পাওয়া যায়নি।
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        উপরের &quot;একক ক্রয়&quot; অপশন থেকে কন্টেন্টটি কিনতে পারেন।
                      </p>
                    </div>
                  )}

                  {/* Login reminder */}
                  {!isAuthenticated && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                      <p>কিনতে প্রথমে <span className="font-semibold cursor-pointer underline" onClick={() => { onOpenChange(false); navigate('login') }}>লগইন</span> করুন</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
