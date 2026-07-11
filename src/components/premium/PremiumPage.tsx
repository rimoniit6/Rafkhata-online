'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { toDecimal } from '@/lib/decimal'
import {
  Dialog,
  DialogClose,
  DialogContent,DialogHeader,DialogTitle,
} from '@/components/ui/dialog'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,SelectContent,SelectItem,SelectTrigger,SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { useContentTypes } from '@/hooks/use-content-types'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  FileQuestion,
  FileText,
  GraduationCap,
  Layers,
  Package,
  Percent,
  Search,
  ShoppingBag,
  Tag,
  Timer,
  X
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'
import BundleCard from './cards/BundleCard'
import PackageCard from './cards/PackageCard'
import type { Bundle, BundleItem, ContentPackage } from './cards/types'

// ============ HELPERS ============

/** Ensure a value is always an array, regardless of API response format */
function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    for (const key of ['data', 'bundles', 'packages', 'items', 'results', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
  }
  return [] as T[]
}

// Fallback type labels (used before content types load from DB)
const FALLBACK_TYPE_LABELS: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  mcq: { label: 'MCQ', icon: FileQuestion, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  cq: { label: 'সৃজনশীল প্রশ্ন', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  lecture: { label: 'লেকচার', icon: BookOpen, color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  board: { label: 'বোর্ড প্রশ্ন', icon: GraduationCap, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  mixed: { label: 'মিক্সড', icon: Layers, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
}

const FALLBACK_CONTENT_TYPE_LABELS: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  mcq: { label: 'MCQ', icon: FileQuestion, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  cq: { label: 'সৃজনশীল প্রশ্ন', icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  lecture: { label: 'লেকচার', icon: BookOpen, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
  suggestion: { label: 'সাজেশন', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  exam: { label: 'পরীক্ষা', icon: GraduationCap, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  package: { label: 'প্যাকেজ', icon: Package, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
}

// ============ COMPONENT ============

export default function PremiumPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const user = useAuthUser()
  const metadata = useHierarchyMetadata()
  const { contentTypesWithIcons, getLabel: _getLabel, getIcon: _getIcon } = useContentTypes()

  // Build dynamic type labels from DB content types
  const typeLabels: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {}
  for (const ct of contentTypesWithIcons) {
    typeLabels[ct.key] = {
      label: ct.labelBn,
      icon: ct.Icon,
      color: `${ct.lightColor || 'bg-gray-100 dark:bg-gray-950/40'} ${ct.textColor || 'text-gray-700 dark:text-gray-300'}`,
    }
  }
  // Add special 'mixed' type that's not in DB
  if (!typeLabels['mixed']) {
    typeLabels['mixed'] = FALLBACK_TYPE_LABELS['mixed']
  }
  // Fill any missing keys from fallback
  for (const [key, val] of Object.entries(FALLBACK_TYPE_LABELS)) {
    if (!typeLabels[key]) typeLabels[key] = val
  }

  // Build dynamic filter options from DB content types
  const typeFilterOptions = [
    { value: '', label: 'সকল ধরন' },
    ...contentTypesWithIcons
      .filter(ct => ct.key !== 'bundle' && ct.key !== 'package')
      .map(ct => ({ value: ct.key, label: ct.labelBn })),
    { value: 'mixed', label: 'মিক্সড' },
  ]

  // Build dynamic content type labels from DB
  const contentTypeLabels: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {}
  for (const ct of contentTypesWithIcons) {
    contentTypeLabels[ct.key] = {
      label: ct.labelBn,
      icon: ct.Icon,
      color: `${ct.textColor || 'text-gray-600'} ${ct.lightColor || 'bg-gray-50 dark:bg-gray-950/30'}`,
    }
  }
  for (const [key, val] of Object.entries(FALLBACK_CONTENT_TYPE_LABELS)) {
    if (!contentTypeLabels[key]) contentTypeLabels[key] = val
  }

  // Dynamic class level options from database (with "all" option prepended for filter)
  const classLevelOptions = [{ value: '', label: 'সকল শ্রেণি' }, ...metadata.classOptions]
  // Dynamic class level options for buy selector (no "all" option)
  const classLevelBuyOptions = metadata.classOptions
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [purchasedBundleIds, setPurchasedBundleIds] = useState<Set<string>>(new Set())
  const [pendingBundleIds, setPendingBundleIds] = useState<Set<string>>(new Set())

  // Package state
  const [activeTab, setActiveTab] = useState<string>('bundles')
  const [packages, setPackages] = useState<ContentPackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [purchasedPackageIds, setPurchasedPackageIds] = useState<Set<string>>(new Set())
  const [pendingPackageIds, setPendingPackageIds] = useState<Set<string>>(new Set())

  // Package class selector state — keyed by package id
  const [selectedClassForPkg, setSelectedClassForPkg] = useState<Record<string, string>>({})
  // Which package's class selector is open (for dialog)
  const [classSelectorOpen, setClassSelectorOpen] = useState<string | null>(null)

  // Fetch bundles
  const fetchBundles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (classLevel) params.set('classLevel', classLevel)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/bundles?${params}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const items = ensureArray<Bundle>(json)
      setBundles(items)
    } catch {
      setBundles([])
    } finally {
      setLoading(false)
    }
  }, [search, classLevel, typeFilter])

  useEffect(() => {
    fetchBundles()
  }, [fetchBundles])

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (classLevel) params.set('classLevel', classLevel)

      const res = await fetch(`/api/packages?${params}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const items = json.data?.packages || ensureArray<ContentPackage>(json)
      setPackages(items)
    } catch {
      setPackages([])
    } finally {
      setPackagesLoading(false)
    }
  }, [search, classLevel])

  useEffect(() => {
    if (activeTab === 'packages') {
      fetchPackages()
    }
  }, [fetchPackages, activeTab])

  // Batch check purchase status using /api/payment/batch-check
  const batchCheckPurchases = useCallback(async (
    items: Array<{ contentType: string; contentId: string }>,
    onSuccess: (purchased: Set<string>, pending: Set<string>) => void
  ) => {
    if (!user?.id || items.length === 0) return
    try {
      const res = await fetch('/api/payment/batch-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      const purchased = new Set<string>()
      const pending = new Set<string>()
      for (const result of data.data.items) {
        if (result.purchased) purchased.add(result.contentId)
        if (result.pendingPayment) pending.add(result.contentId)
      }
      onSuccess(purchased, pending)
    } catch {
      // Silently fail
    }
  }, [user?.id])

  // Check purchase status for bundles
  useEffect(() => {
    if (!user?.id || bundles.length === 0) return
    const items = bundles.map(b => ({ contentType: 'bundle', contentId: b.id }))
    batchCheckPurchases(items, (purchased, pending) => {
      setPurchasedBundleIds(purchased)
      setPendingBundleIds(pending)
    })
  }, [user?.id, bundles, batchCheckPurchases])

  // Check purchase status for packages
  useEffect(() => {
    if (!user?.id || packages.length === 0) return
    const items = packages.map(p => ({ contentType: 'package', contentId: p.id }))
    batchCheckPurchases(items, (purchased, pending) => {
      setPurchasedPackageIds(purchased)
      setPendingPackageIds(pending)
    })
  }, [user?.id, packages, batchCheckPurchases])

  // Fetch single bundle detail
  const openBundleDetail = async (bundleId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/bundles/${bundleId}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setSelectedBundle(json.data || null)
    } catch {
      setSelectedBundle(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBuy = (bundle: Bundle) => {
    navigate('payment', { bundleId: bundle.id, contentTitle: bundle.title, contentPrice: bundle.price.toString() })
  }

  const handleBuyPackage = (pkg: ContentPackage, selectedClass: string) => {
    navigate('payment', {
      contentType: 'package',
      contentId: pkg.id,
      contentTitle: pkg.title,
      contentPrice: String(pkg.price),
      classLevel: selectedClass,
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-14 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
              <Crown className="size-4 mr-1" />
              প্রিমিয়াম কন্টেন্ট
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              প্রিমিয়াম কন্টেন্ট
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed">
              বান্ডেল কিনে পান স্থায়ী অ্যাক্সেস, অথবা সাবস্ক্রিপশনে উপভোগ করুন সম্পূর্ণ শ্রেণির কন্টেন্ট
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 text-white/90 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>বান্ডেল — স্থায়ী</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4" />
                <span>প্যাকেজ — সাবস্ক্রিপশন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>সাশ্রয়ী মূল্য</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Tabs + Filters */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          {/* Tab bar */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-10">
              <TabsTrigger value="bundles" className="gap-1.5 px-4">
                <Layers className="w-4 h-4" />
                বান্ডেল
              </TabsTrigger>
              <TabsTrigger value="packages" className="gap-1.5 px-4">
                <Timer className="w-4 h-4" />
                প্যাকেজ
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder={activeTab === 'packages' ? 'প্যাকেজ খুঁজুন...' : 'বান্ডেল খুঁজুন...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-muted/30 border-border/50 w-full rounded-md border px-3 py-1 text-sm"
              />
            </div>
            <Select value={classLevel} onValueChange={(v) => setClassLevel(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-44 h-10 bg-muted/30 border-border/50">
                <GraduationCap className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="শ্রেণি নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {classLevelOptions.map((opt) => (
                  <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'bundles' && (
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-40 h-10 bg-muted/30 border-border/50">
                  <Layers className="w-4 h-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="ধরন নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {typeFilterOptions.map((opt) => (
                    <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'bundles' ? (
          /* ============ BUNDLES TAB ============ */
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-44 bg-muted/50 animate-pulse" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted/50 rounded-full animate-pulse w-16" />
                        <div className="h-6 bg-muted/50 rounded-full animate-pulse w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-muted/50 rounded animate-pulse w-24" />
                        <div className="h-9 bg-muted/50 rounded-lg animate-pulse w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : bundles.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 border border-border/50">
                  <Package className="w-9 h-9 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">কোনো বান্ডেল পাওয়া যায়নি</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence>
                  {bundles.map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      typeLabels={typeLabels}
                      isPurchased={purchasedBundleIds.has(bundle.id)}
                      isPending={pendingBundleIds.has(bundle.id)}
                      onOpenDetail={openBundleDetail}
                      onBuy={handleBuy}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* ============ PACKAGES TAB ============ */
          packagesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-40 bg-muted/50 animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-6 bg-muted/50 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted/50 rounded-full animate-pulse w-16" />
                      <div className="h-6 bg-muted/50 rounded-full animate-pulse w-16" />
                      <div className="h-6 bg-muted/50 rounded-full animate-pulse w-20" />
                    </div>
                    <div className="h-9 bg-muted/50 rounded-lg animate-pulse w-full" />
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-muted/50 rounded animate-pulse w-24" />
                      <div className="h-9 bg-muted/50 rounded-lg animate-pulse w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 border border-border/50">
                <Timer className="w-9 h-9 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">কোনো প্যাকেজ পাওয়া যায়নি</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    classLevelBuyOptions={classLevelBuyOptions}
                    selectedClass={selectedClassForPkg[pkg.id] || ''}
                    onClassChange={(pkgId, v) => setSelectedClassForPkg(prev => ({ ...prev, [pkgId]: v }))}
                    isPurchased={purchasedPackageIds.has(pkg.id)}
                    isPending={pendingPackageIds.has(pkg.id)}
                    onBuy={handleBuyPackage}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </div>

      {/* Bundle Detail Dialog */}
      <Dialog
        open={!!selectedBundle}
        onOpenChange={(open) => {
          if (!open) setSelectedBundle(null)
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>বান্ডেল বিস্তারিত</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">বান্ডেল লোড হচ্ছে...</p>
              </div>
            </div>
          ) : selectedBundle ? (
            <>
              {/* Detail Header with thumbnail */}
              <div className="relative h-48 overflow-hidden">
                  {selectedBundle.thumbnail ? (
                                  <Image
                                    src={selectedBundle.thumbnail}
                                    alt={selectedBundle.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Package className="w-16 h-16 text-white/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 z-20 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <X className="size-5" />
                  </Button>
                </DialogClose>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-xl font-bold text-white mb-1">{selectedBundle.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedBundle.discount > 0 && (
                      <Badge className="bg-red-500/90 text-white border-0 gap-1 text-xs">
                        <Percent className="w-3 h-3" />
                        {selectedBundle.discount}% ছাড়
                      </Badge>
                    )}
                    {(() => {
                      const tc = typeLabels[selectedBundle.type] || typeLabels.mixed
                      return (
                        <Badge className={cn('border-0 gap-1 text-xs', tc.color)}>
                          <tc.icon className="w-3 h-3" />
                          {tc.label}
                        </Badge>
                      )
                    })()}
                    {selectedBundle.classLevel && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                        {selectedBundle.classLevel ? metadata.classLevelLabels[selectedBundle.classLevel] || selectedBundle.classLevel : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[50vh]">
                <div className="p-6 space-y-4">
                  {selectedBundle.description && (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <RichContentRenderer content={selectedBundle.description} />
                    </div>
                  )}

                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">আইটেম সংখ্যা</span>
                      <span className="font-medium">{selectedBundle.itemCount}টি</span>
                    </div>
                    {selectedBundle.originalPrice > selectedBundle.price && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">আসল মূল্য</span>
                        <span className="text-muted-foreground line-through">৳{Math.round(selectedBundle.originalPrice)}</span>
                      </div>
                    )}
                    {selectedBundle.discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ছাড়</span>
                        <span className="text-red-500 font-medium">- ৳{Math.round(toDecimal(selectedBundle.originalPrice) - toDecimal(selectedBundle.price))}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">বান্ডেল মূল্য</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{Math.round(selectedBundle.price)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      বান্ডেলের আইটেমসমূহ
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedBundle.items.map((bItem, idx) => {
                        const contentConfig = contentTypeLabels[bItem.contentType]
                        return (
                          <div
                            key={bItem.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">
                                {bItem.contentTitle || 'শিরোনাম পাওয়া যায়নি'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {contentConfig && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                                      contentConfig.color,
                                    )}
                                  >
                                    <contentConfig.icon className="w-2.5 h-2.5" />
                                    {contentConfig.label}
                                  </span>
                                )}
                                {bItem.contentPrice > 0 && (
                                  <span className="text-[10px] text-muted-foreground">৳{Math.round(bItem.contentPrice)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {purchasedBundleIds.has(selectedBundle.id) ? (
                    <Button
                      disabled
                      className="w-full gap-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 h-11 text-sm font-semibold cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      কেনা হয়েছে
                    </Button>
                  ) : pendingBundleIds.has(selectedBundle.id) ? (
                    <Button
                      disabled
                      className="w-full gap-2 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 h-11 text-sm font-semibold cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      অপেক্ষমাণ — অ্যাডমিন অনুমোদনের অপেক্ষায়
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 text-sm font-semibold"
                      onClick={() => handleBuy(selectedBundle)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      ৳{Math.round(selectedBundle.price)} — কিনুন
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Package Class Selector Dialog (fallback for mobile) */}
      <Dialog
        open={!!classSelectorOpen}
        onOpenChange={(open) => {
          if (!open) setClassSelectorOpen(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-teal-500" />
              শ্রেণি নির্বাচন করুন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {classLevelBuyOptions.map((opt) => {
              const pkg = packages.find(p => p.id === classSelectorOpen)
              return (
                <button
                  key={opt.value}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-colors text-left"
                  onClick={() => {
                    if (pkg) {
                      setSelectedClassForPkg(prev => ({ ...prev, [pkg.id]: opt.value }))
                      setClassSelectorOpen(null)
                      handleBuyPackage(pkg, opt.value)
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/40 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">এই শ্রেণির সকল প্রিমিয়াম কন্টেন্ট</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
