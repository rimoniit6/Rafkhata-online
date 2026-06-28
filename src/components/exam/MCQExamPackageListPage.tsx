'use client'

import MCQExamPackagePurchaseDialog from '@/components/exam/MCQExamPackagePurchaseDialog'
import EmptyState from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'
import { toBengaliNumerals } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
ArrowLeft,
Award,
BookOpen,
Calendar,
Clock,
Crown,
FileQuestion,
Package,
Search,
ShoppingCart,
Users
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useRef,useState } from 'react'

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatBengaliDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassInfo {
  id: string
  name: string
  slug: string
}

interface ExamSetSummaryItem {
  scheduledDate: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  totalQuestions: number
}

interface ExamPackage {
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
  subjects: Array<{ id: string; name: string }>
  examSetSummary: ExamSetSummaryItem[]
  totalExamSets: number
  totalMarks: number
  totalQuestions: number
}

interface ListResponse {
  success: boolean
  data: {
    packages: ExamPackage[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

// Type for the purchase dialog's packageDetail prop
interface PackageDetailForDialog {
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
    negativeMarks: number
    instructions: string | null
    status: string
    order: number
  }>
  _count: { purchases: number }
}

// ─── Constants ───────────────────────────────────────────────────────────────



// ─── Animation Variants ──────────────────────────────────────────────────────

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

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function PackageCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        <Skeleton className="h-28 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Package Card ────────────────────────────────────────────────────────────

interface PackageCardProps {
  pkg: ExamPackage
  purchased: boolean
  pending: boolean
  onBuy: (pkg: ExamPackage) => void
  onTakeExam: (pkg: ExamPackage) => void
  buyingId: string | null
}

function PackageCard({ pkg, purchased, pending, onBuy, onTakeExam, buyingId }: PackageCardProps) {
  const examPreviews = pkg.examSetSummary || []
  const moreCount = Math.max(0, pkg.totalExamSets - examPreviews.length)

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -2 }} className="h-full">
      <Card className="overflow-hidden border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1">
          {/* Thumbnail or Placeholder */}
          <div className="relative h-28 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center overflow-hidden">
            {pkg.thumbnail ? (
              <Image
                src={pkg.thumbnail}
                alt={pkg.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-emerald-500">
                <Package className="size-8" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {toBengaliNumerals(pkg.totalExamSets || pkg.totalSets)}টি পরীক্ষা
                </span>
              </div>
            )}
            {/* Price Badge */}
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
            {/* Title */}
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-2">
              {pkg.title}
            </h3>

            {/* Class Badge + Subject Tags */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                {pkg.class?.name || 'N/A'}
              </Badge>
              {pkg.subjects && pkg.subjects.length > 0
                ? pkg.subjects.slice(0, 3).map((subj) => (
                    <Badge
                      key={subj.id}
                      variant="secondary"
                      className="text-xs gap-0.5 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                    >
                      <BookOpen className="size-2.5" />
                      {subj.name}
                    </Badge>
                  ))
                : null}
              {pkg.subjects && pkg.subjects.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{toBengaliNumerals(pkg.subjects.length - 3)}
                </Badge>
              )}
            </div>

            {/* Exam Schedule Preview */}
            {examPreviews.length > 0 && (
              <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3 text-emerald-500" />
                  পরীক্ষার সূচি
                </p>
                <div className="space-y-1">
                  {examPreviews.slice(0, 3).map((es, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs text-foreground/80"
                    >
                      <Calendar className="size-3 text-emerald-500 shrink-0" />
                      <span className="font-medium">
                        {formatBengaliDate(es.scheduledDate)}
                      </span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {toBengaliNumerals(Math.round(es.totalMarks))} নম্বর
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        ({toBengaliNumerals(es.totalQuestions)} প্রশ্ন)
                      </span>
                    </div>
                  ))}
                  {moreCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Calendar className="size-3 shrink-0" />
                      +{toBengaliNumerals(moreCount)}টি আরও পরীক্ষা
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total Stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
              {pkg.totalMarks > 0 && (
                <span className="flex items-center gap-1">
                  <Award className="size-3.5 text-amber-500" />
                  মোট: {toBengaliNumerals(Math.round(pkg.totalMarks))} নম্বর
                </span>
              )}
              {pkg.totalQuestions > 0 && (
                <span className="flex items-center gap-1">
                  <FileQuestion className="size-3.5 text-teal-500" />
                  {toBengaliNumerals(pkg.totalQuestions)} প্রশ্ন
                </span>
              )}
            </div>

            {/* Purchases count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Users className="size-3.5 text-gray-400" />
              {toBengaliNumerals(pkg._count?.purchases || 0)} জন কিনেছেন
            </div>

            {/* Spacer */}
            <div className="mt-auto" />

            {/* Action Button */}
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
                onClick={() => onTakeExam(pkg)}
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
                onClick={() => onTakeExam(pkg)}
              >
                <BookOpen className="size-4" />
                এক্সাম দিন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MCQExamPackageListPage() {
  const { navigate, goBack } = useRouterStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const { classOptions } = useHierarchyMetadata()
  const CLASS_TABS = [{ value: 'all', label: 'সকল' }, ...classOptions]

  // State
  const [packages, setPackages] = useState<ExamPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  // Class slug-to-ID mapping
  const [classMap, setClassMap] = useState<Map<string, ClassInfo>>(new Map())

  // Purchase tracking
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [buyingId, setBuyingId] = useState<string | null>(null)

  // Purchase dialog state
  const [purchaseDialog, setPurchaseDialog] = useState<{
    open: boolean
    packageDetail: PackageDetailForDialog | null
  }>({ open: false, packageDetail: null })

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Fetch Class Categories (for slug-to-ID mapping) ────────────────────

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const json = await res.json()
          const classes: ClassInfo[] = json.data?.classes || json.data || json.classes || json
          const map = new Map<string, ClassInfo>()
          for (const cls of classes) {
            map.set(cls.slug, cls)
          }
          setClassMap(map)
        }
      } catch {
        // Silently ignore
      }
    }
    fetchClasses()
  }, [])

  // ─── Check Purchase Status ──────────────────────────────────────────────

  const checkPurchases = useCallback(
    async (pkgs: ExamPackage[]) => {
      if (!user) return

      const newPurchased = new Set<string>()
      const newPending = new Set<string>()

      // Check purchases in parallel
      const checks = pkgs.map(async (pkg) => {
        try {
          const res = await fetch(
            `/api/mcq-exam-packages?action=check-purchase&packageId=${pkg.id}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.data?.purchased) {
              newPurchased.add(pkg.id)
            }
            if (data.data?.pendingPayment) {
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

  // ─── Fetch Packages ─────────────────────────────────────────────────────

  const fetchPackages = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('action', 'list')
        params.set('page', String(page))
        params.set('limit', String(pagination.limit))

        if (activeTab && activeTab !== 'all') {
          // Resolve slug to class database ID
          const classInfo = classMap.get(activeTab)
          if (classInfo) {
            params.set('classId', classInfo.id)
          }
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim())
        }

        const res = await fetch(`/api/mcq-exam-packages?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const json: ListResponse = await res.json()
        const fetchedPackages = json.data?.packages || []
        setPackages(fetchedPackages)

        if (json.data?.pagination) {
          setPagination((prev) => ({ ...prev, ...json.data.pagination }))
        }

        // Check purchase status for fetched packages if authenticated
        if (isAuthenticated && user && fetchedPackages.length > 0) {
          checkPurchases(fetchedPackages)
        }
      } catch (err) {
        console.error('Failed to fetch packages:', err)
        setPackages([])
      } finally {
        setLoading(false)
      }
    },
    [activeTab, searchQuery, pagination.limit, isAuthenticated, user, classMap, checkPurchases]
  )
  const fetchPackagesRef = useRef(fetchPackages)
  useEffect(() => {
    fetchPackagesRef.current = fetchPackages
  }, [fetchPackages])

  // Fetch on filter change
  useEffect(() => {
    fetchPackagesRef.current(1)
  }, [activeTab])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPackagesRef.current(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Initial fetch
  useEffect(() => {
    fetchPackagesRef.current(1)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleBuy = async (pkg: ExamPackage) => {
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
      // Fetch full package detail for the purchase dialog
      const res = await fetch(`/api/mcq-exam-packages?action=detail&id=${pkg.id}`)
      if (!res.ok) throw new Error('Failed to fetch package detail')

      const json = await res.json()
      const detail: PackageDetailForDialog = json.data?.package

      if (!detail) {
        toast({
          title: 'ত্রুটি',
          description: 'প্যাকেজ বিবরণ লোড করা যায়নি',
          variant: 'destructive',
        })
        return
      }

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

  const handleTakeExam = (pkg: ExamPackage) => {
    navigate('mcq-exam-package-detail', { packageId: pkg.id })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="size-6 text-emerald-500" />
                MCQ এক্সাম প্যাকেজ
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                সরাসরি কিনুন — প্যাকেজ বা বান্ডেলের সাথে কোনো সম্পর্ক নেই
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" />
                {toBengaliNumerals(pagination.total)}টি প্যাকেজ
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 space-y-4"
        >
          {/* Class Filter Tabs */}
          <div className="w-full overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 h-auto flex-wrap">
                {CLASS_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="প্যাকেজ খুঁজুন..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-full"
            />
          </div>
        </motion.div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="কোনো এক্সাম প্যাকেজ পাওয়া যায়নি"
            description="আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আসুন। নতুন প্যাকেজ যুক্ত হলে এখানে দেখা যাবে।"
            actionLabel="ফিল্টার রিসেট করুন"
            onAction={() => {
              setActiveTab('all')
              setSearchQuery('')
            }}
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
                  onTakeExam={handleTakeExam}
                  buyingId={buyingId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchPackages(pagination.page - 1)}
            >
              আগের
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {toBengaliNumerals(pagination.page)} / {toBengaliNumerals(pagination.totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchPackages(pagination.page + 1)}
            >
              পরের
            </Button>
          </div>
        )}
      </div>

      {/* ─── MCQ Exam Package Purchase Dialog ───────────────────────────────── */}
      {purchaseDialog.packageDetail && (
        <MCQExamPackagePurchaseDialog
          open={purchaseDialog.open}
          onOpenChange={(open) => {
            setPurchaseDialog({ open, packageDetail: open ? purchaseDialog.packageDetail : null })
            // Refresh packages after dialog closes (user may have purchased)
            if (!open) {
              fetchPackages(pagination.page)
            }
          }}
          packageDetail={purchaseDialog.packageDetail}
        />
      )}
    </div>
  )
}
