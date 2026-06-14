'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  Crown,
  Package,
  ShoppingCart,
  Users,
  AlignLeft,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toBengaliNumerals } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import EmptyState from '@/components/shared/EmptyState'
import CQExamPackagePurchaseDialog from '@/components/cq-exam/CQExamPackagePurchaseDialog'

interface CQExamPackage {
  id: string
  title: string
  description: string | null
  classId: string
  price: number
  originalPrice: number
  isPremium: boolean
  thumbnail: string | null
  totalSets: number
  status: string
  isActive: boolean
  order: number
  class: {
    id: string
    name: string
    slug: string
  }
  _count: {
    examSets: number
    purchases: number
  }
}

interface CQPackageDetailForDialog {
  id: string
  title: string
  description: string | null
  price: number
  originalPrice: number
  isPremium: boolean
  thumbnail: string | null
  totalSets: number
  class: { id: string; name: string; slug: string }
  examSets: Array<{
    id: string
    title: string
    description: string | null
    scheduledDate: string
    startTime: string
    endTime: string
    duration: number
    totalMarks: number
    totalQuestions: number
    marksPerQ: number
    instructions: string | null
    status: string
    order: number
    _count?: { questions: number }
  }>
  _count: { purchases: number }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const

function PackageCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        <Skeleton className="h-24 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

interface PackageCardProps {
  pkg: CQExamPackage
  purchased: boolean
  pending: boolean
  onBuy: (pkg: CQExamPackage) => void
  onView: (pkg: CQExamPackage) => void
  buyingId: string | null
}

function PackageCard({ pkg, purchased, pending, onBuy, onView, buyingId }: PackageCardProps) {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -2 }} className="h-full">
      <Card className="overflow-hidden border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1">
          <div className="relative h-24 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center overflow-hidden">
            {pkg.thumbnail ? (
              <img
                src={pkg.thumbnail}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-emerald-500">
                <AlignLeft className="size-8" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {toBengaliNumerals(pkg._count?.examSets || 0)}টি সেট
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {pkg.isPremium && pkg.price > 0 ? (
                <Badge className="gap-1 bg-amber-500 text-white border-0 shadow-sm">
                  <Crown className="size-3" />
                  ৳{toBengaliNumerals(Math.round(pkg.price))}
                </Badge>
              ) : (
                <Badge className="bg-emerald-500 text-white border-0 shadow-sm">
                  ফ্রি
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-2">
              {pkg.title}
            </h3>

            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                {pkg.class?.name || 'N/A'}
              </Badge>
            </div>

            {pkg.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {pkg.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Users className="size-3.5 text-gray-400" />
              {toBengaliNumerals(pkg._count?.purchases || 0)} জন কিনেছেন
            </div>

            <div className="mt-auto" />

            {pending ? (
              <Button
                className="w-full gap-2 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs cursor-not-allowed"
                disabled
              >
                <Clock className="size-4" />
                অপেক্ষমাণ
              </Button>
            ) : purchased ? (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                onClick={() => onView(pkg)}
              >
                <BookOpen className="size-4" />
                এক্সাম দিন
              </Button>
            ) : pkg.isPremium && pkg.price > 0 ? (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
                onClick={() => onBuy(pkg)}
                disabled={buyingId === pkg.id}
              >
                {buyingId === pkg.id ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' } as const}
                      className="size-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    লোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    ৳{toBengaliNumerals(Math.round(pkg.price))} — কিনুন
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                onClick={() => onView(pkg)}
              >
                <BookOpen className="size-4" />
                বিস্তারিত দেখুন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function CQExamPackageListPage() {
  const { navigate, goBack } = useRouterStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  const [packages, setPackages] = useState<CQExamPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Purchase tracking (independent — no subscription/package/bundle cross-check)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [purchaseDialog, setPurchaseDialog] = useState<{
    open: boolean
    packageDetail: CQPackageDetailForDialog | null
  }>({ open: false, packageDetail: null })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPackageDetail = useCallback(async (pkgId: string): Promise<CQPackageDetailForDialog> => {
    const params = new URLSearchParams({ action: 'detail', id: pkgId })
    if (user?.id) params.set('userId', user.id)
    const res = await fetch(`/api/cq-exam-packages?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch package detail')
    const json = await res.json()
    if (json.error || !json.data?.package) throw new Error(json.error || 'Package not found')
    return json.data.package as CQPackageDetailForDialog
  }, [user?.id])

  // ─── Check Purchase Status ──────────────────────────────────────────────

  const checkPurchases = useCallback(
    async (pkgs: CQExamPackage[]) => {
      if (!user) return

      const newPurchased = new Set<string>()
      const newPending = new Set<string>()

      const checks = pkgs.map(async (pkg) => {
        try {
          const res = await fetch(
            `/api/cq-exam-packages?action=check-purchase&packageId=${pkg.id}`
          )
          if (res.ok) {
            const json = await res.json()
            if (json.data?.purchased) {
              newPurchased.add(pkg.id)
            }
            if (json.data?.pendingPayment) {
              newPending.add(pkg.id)
            }
          }
        } catch {
          // Silently ignore
        }
      })

      await Promise.all(checks)
      setPurchasedIds(newPurchased)
      setPendingIds(newPending)
    },
    [user]
  )

  // ─── Fetch Packages + Check Purchases ─────────────────────────────────

  const fetchPackagesWithPurchase = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('action', 'list')
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const res = await fetch(`/api/cq-exam-packages?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const json = await res.json()
      const fetchedPackages = json.data?.packages || []
      setPackages(fetchedPackages)

      // Check purchase status if authenticated
      if (isAuthenticated && user && fetchedPackages.length > 0) {
        checkPurchases(fetchedPackages)
      }
    } catch (err) {
      console.error('Failed to fetch CQ packages:', err)
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, isAuthenticated, user, checkPurchases])

  // ─── Initial fetch ──────────────────────────────────────────────────────

  useEffect(() => {
    fetchPackagesWithPurchase()
  }, [])

  // ─── Debounced search ────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPackagesWithPurchase()
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleBuy = async (pkg: CQExamPackage) => {
    if (!isAuthenticated) {
      toast({
        title: 'লগইন করুন',
        description: 'কেনাকাটা করতে প্রথমে লগইন করুন',
        variant: 'destructive',
      })
      navigate('login')
      return
    }

    setBuyingId(pkg.id)
    try {
      const detail = await fetchPackageDetail(pkg.id)
      setPurchaseDialog({ open: true, packageDetail: detail })
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'প্যাকেজ বিবরণ লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setBuyingId(null)
    }
  }

  const handleView = (pkg: CQExamPackage) => {
    navigate('cq-exam-package-detail', { packageId: pkg.id })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <AlignLeft className="size-6 text-emerald-500" />
                CQ এক্সাম প্যাকেজ
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                সৃজনশীল প্রশ্নের প্যাকেজ কিনে পরীক্ষা দিন
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" />
                {toBengaliNumerals(packages.length)}টি প্যাকেজ
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="প্যাকেজ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="কোনো CQ এক্সাম প্যাকেজ পাওয়া যায়নি"
            description="আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আসুন। নতুন প্যাকেজ যুক্ত হলে এখানে দেখা যাবে।"
            actionLabel="ফিল্টার রিসেট করুন"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence>
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  purchased={purchasedIds.has(pkg.id)}
                  pending={pendingIds.has(pkg.id)}
                  onBuy={handleBuy}
                  onView={handleView}
                  buyingId={buyingId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {purchaseDialog.packageDetail && (
        <CQExamPackagePurchaseDialog
          open={purchaseDialog.open}
          onOpenChange={(open) => {
            setPurchaseDialog({ open, packageDetail: open ? purchaseDialog.packageDetail : null })
            if (!open && packages.length > 0) {
              checkPurchases(packages)
            }
          }}
          packageDetail={purchaseDialog.packageDetail}
        />
      )}
    </div>
  )
}
