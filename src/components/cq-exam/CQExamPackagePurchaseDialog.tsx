'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { toDecimal } from '@/lib/decimal'
import {
Dialog,
DialogClose,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCsrf,withCsrfHeaders } from '@/hooks/use-csrf'
import { useToast } from '@/hooks/use-toast'
import { useUploadThing } from '@/lib/uploadthing/client'
import { cn,toBengaliNumerals } from '@/lib/utils'
import { useAuthStore, useIsAuthenticated } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertCircle,
Award,
BookOpen,
Calendar,
CheckCircle2,
Clock,
Copy,
CreditCard,
FileQuestion,
GraduationCap,
Loader2,
Shield,
ShoppingCart,
Smartphone,
Timer,
X
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CQExamPackagePurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageDetail: {
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
    _count?: { purchases: number }
  }
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket'
type DialogStep = 'overview' | 'payment' | 'success'

// ─── Utility Functions ───────────────────────────────────────────────────────

function formatBengaliDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return date.toLocaleDateString('bn-BD', options)
  } catch {
    return dateStr
  }
}

function formatBengaliTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const bengaliHours = toBengaliNumerals(h)
    const bengaliMinutes = toBengaliNumerals(m)
    return `${bengaliHours}:${bengaliMinutes.toString().length < 2 ? '০' + bengaliMinutes : bengaliMinutes}`
  } catch {
    return timeStr
  }
}

// ─── Payment Method Config ──────────────────────────────────────────────────

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
  name: string
  color: string
  bgColor: string
  borderColor: string
  iconBg: string
}> = {
  bkash: {
    name: 'bKash',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-300 dark:border-pink-700',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
  },
  nagad: {
    name: 'Nagad',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
  },
  rocket: {
    name: 'Rocket',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CQExamPackagePurchaseDialog({
  open,
  onOpenChange,
  packageDetail,
}: CQExamPackagePurchaseDialogProps) {
  const navigate = useRouterStore((s) => s.navigate)
  const isAuthenticated = useIsAuthenticated()
  const { toast } = useToast()
  const { token: csrfToken, refreshToken } = useCsrf()

  // Dialog step
  const [step, setStep] = useState<DialogStep>('overview')
  const [purchaseStatus, setPurchaseStatus] = useState<'checking' | 'available' | 'pending' | 'purchased'>('checking')

  // Payment form state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [paymentNumber, setPaymentNumber] = useState('')
  const [_screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Payment accounts from API
  const [paymentAccounts, setPaymentAccounts] = useState<Record<string, string>>({
    bkash: '017XXXXXXXX',
    nagad: '018XXXXXXXX',
    rocket: '016XXXXXXXX',
  })

  // ─── Fetch Payment Accounts ─────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/payment/accounts')
      if (res.ok) {
        const data = await res.json()
        if (data.data?.accounts) {
          setPaymentAccounts(data.data.accounts)
        }
      }
    } catch (err) {
      console.error('Failed to fetch payment accounts:', err)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchAccounts()
    }
  }, [open, fetchAccounts])

  // ─── Check purchase status on open ─────────────────────────────────────

  useEffect(() => {
    if (open) {
      setPurchaseStatus('checking')
      fetch(`/api/cq-exam-packages?action=check-purchase&packageId=${packageDetail.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.data?.purchased) {
            setPurchaseStatus('purchased')
          } else if (data?.data?.pendingPayment) {
            setPurchaseStatus('pending')
          } else {
            setPurchaseStatus('available')
          }
        })
        .catch(() => setPurchaseStatus('available'))
    }
  }, [open, packageDetail.id])

  // ─── Reset form on close ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setStep('overview')
      setSelectedMethod(null)
      setTransactionId('')
      setPaymentNumber('')
      setScreenshot(null)
      setScreenshotUrl(null)
      setSubmitting(false)
      setPurchaseStatus('checking')
    }
  }, [open])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCopyAccount = (key: string, number: string) => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setCopiedKey(key)
    setTimeout(() => {
      setCopied(false)
      setCopiedKey(null)
    }, 2000)
  }

  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const { startUpload } = useUploadThing('screenshotUploader', {
    onClientUploadComplete: (res) => {
      setUploadingScreenshot(false)
      if (res?.[0]?.ufsUrl ?? res?.[0]?.url) {
        setScreenshotUrl(res[0].ufsUrl ?? res[0].url)
      } else {
        toast({ title: 'স্ক্রিনশট আপলোড ব্যর্থ', description: 'আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' })
        setScreenshot(null)
        setScreenshotUrl(null)
      }
    },
    onUploadError: () => {
      setUploadingScreenshot(false)
      toast({ title: 'নেটওয়ার্ক সমস্যা', description: 'স্ক্রিনশট আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' })
      setScreenshot(null)
      setScreenshotUrl(null)
    },
  })

  const handleScreenshotChange = async (file: File | null) => {
    setScreenshot(file)
    if (file) {
      setUploadingScreenshot(true)
      await startUpload([file])
    } else {
      setScreenshotUrl(null)
    }
  }

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      onOpenChange(false)
      navigate('login')
      return
    }
    setStep('payment')
  }

  const handleSubmitPayment = async () => {
    if (!selectedMethod || !transactionId || !paymentNumber) {
      toast({
        title: 'তথ্য অসম্পূর্ণ',
        description: 'পেমেন্ট মেথড, ট্রানজেকশন ID এবং পেমেন্ট নম্বর দিন',
        variant: 'destructive',
      })
      return
    }
    if (uploadingScreenshot) {
      toast({ title: 'অপেক্ষা করুন', description: 'স্ক্রিনশট আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        method: selectedMethod,
        transactionId,
        paymentNumber,
        screenshot: screenshotUrl || undefined,
        amount: packageDetail.price,
        contentType: 'cq-exam-package',
        contentId: packageDetail.id,
        contentTitle: packageDetail.title,
        contentPrice: packageDetail.price,
        classLevel: packageDetail.class.slug,
      }

      let activeToken = csrfToken
      if (!activeToken) activeToken = await refreshToken()

      const doSubmit = async (token: string | null): Promise<Response> => {
        return fetch('/api/payment', {
          method: 'POST',
          headers: withCsrfHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify(body),
        })
      }

      let res = await doSubmit(activeToken)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (res.status === 401) {
          useAuthStore.getState().clearAuth()
          toast({
            title: 'সেশন মেয়াদোত্তীর্ণ',
            description: 'অনুগ্রহ করে পুনরায় লগইন করুন।',
            variant: 'destructive',
          })
          onOpenChange(false)
          navigate('login')
          return
        }
        if (res.status === 403 && data?.code === 'CSRF_INVALID') {
          const newToken = await refreshToken()
          if (newToken) {
            res = await doSubmit(newToken)
            if (res.ok) {
              setStep('success')
              toast({
                title: 'পেমেন্ট জমা হয়েছে',
                description: 'অ্যাডমিন যাচাই করার পর আপনার CQ এক্সাম প্যাকেজ অ্যাক্সেস সক্রিয় হবে',
              })
              return
            }
          }
          const retryData = await res.json().catch(() => null)
          throw new Error(retryData?.error || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে')
        }
        throw new Error(data?.error || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে')
      }

      setStep('success')
      toast({
        title: 'পেমেন্ট জমা হয়েছে',
        description: 'অ্যাডমিন যাচাই করার পর আপনার CQ এক্সাম প্যাকেজ অ্যাক্সেস সক্রিয় হবে',
      })
    } catch (err) {
      toast({
        title: 'পেমেন্ট জমা দিতে সমস্যা',
        description: err instanceof Error ? err.message : 'আবার চেষ্টা করুন',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  // ─── Computed ───────────────────────────────────────────────────────────

  const discount =
    toDecimal(packageDetail.originalPrice) > toDecimal(packageDetail.price)
      ? Math.round(((toDecimal(packageDetail.originalPrice) - toDecimal(packageDetail.price)) / toDecimal(packageDetail.originalPrice)) * 100)
      : 0

  const sortedExamSets = [...packageDetail.examSets].sort((a, b) => a.order - b.order)

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{packageDetail.title} - ক্রয় করুন</DialogTitle>
          <DialogDescription>
            {packageDetail.title} পরীক্ষা প্যাকেজ ক্রয় করতে পেমেন্ট সম্পন্ন করুন
          </DialogDescription>
        </DialogHeader>

        {/* ─── Flex wrapper for proper scrolling ──────────────────── */}
        <div className="flex flex-col h-full max-h-[92vh]">
        {/* ─── Gradient Header (fixed) ──────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-5 shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden border border-white/30">
                {packageDetail.thumbnail ? (
                  <Image
                    src={packageDetail.thumbnail}
                    alt={packageDetail.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <BookOpen className="size-6 sm:size-7 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="bg-white/20 text-white border-white/30 text-xs gap-1 mb-1">
                  <GraduationCap className="size-3" />
                  {packageDetail.class.name}
                </Badge>
                <h2 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2">
                  {packageDetail.title}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-white text-lg sm:text-xl font-bold">
                    ৳{toBengaliNumerals(packageDetail.price)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-white/60 text-xs sm:text-sm line-through">
                        ৳{toBengaliNumerals(packageDetail.originalPrice)}
                      </span>
                      <Badge className="bg-yellow-400 text-yellow-900 text-[10px] px-1.5 border-0 font-bold">
                        {toBengaliNumerals(discount)}% ছাড়
                      </Badge>
                    </>
                  )}
                </div>
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
            <div className="flex items-center gap-3 mt-2 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <FileQuestion className="size-3.5" />
                {toBengaliNumerals(packageDetail.totalSets)}টি পরীক্ষা সেট
              </span>
              <span className="flex items-center gap-1">
                <ShoppingCart className="size-3.5" />
                {toBengaliNumerals(packageDetail._count?.purchases ?? 0)} জন কিনেছেন
              </span>
            </div>
          </div>
        </div>

        {/* ─── Scrollable Content ───────────────────────────────────── */}
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
                আপনার এই প্যাকেজের জন্য একটি পেমেন্ট ইতিমধ্যে জমা আছে। অ্যাডমিন যাচাইয়ের পর আপনার <span className="font-semibold">{packageDetail.title}</span> প্যাকেজ অ্যাক্সেস সক্রিয় হবে।
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
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
                আপনি ইতিমধ্যে <span className="font-semibold">{packageDetail.title}</span> প্যাকেজটি কিনেছেন। এখন এক্সাম দিন।
              </p>
              <Button
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                onClick={() => {
                  onOpenChange(false)
                  // Note: The parent component will redirect to exam detail
                }}
              >
                <BookOpen className="size-4" />
                এক্সাম দিন
              </Button>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {/* ──────────────── STEP: OVERVIEW ─────────────────────── */}
            {step === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-4"
              >
                  {/* Subject Coverage */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      📝 এই CQ প্যাকেজে <span className="font-semibold">{packageDetail.class.name}</span> এর সৃজনশীল পরীক্ষা অনুষ্ঠিত হবে — আলাদাভাবে কিনতে হবে, অন্য প্যাকেজে অন্তর্ভুক্ত নয়
                    </p>
                  </div>

                  {/* ─── Exam Schedule Table ──────────────────────────── */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Calendar className="size-4 text-emerald-600" />
                      পরীক্ষার সময়সূচি
                    </h3>
                    <div className="border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">তারিখ</th>
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">সময়</th>
                              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">সময়কাল</th>
                              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">প্রশ্ন</th>
                              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">নম্বর</th>
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">সেট</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedExamSets.map((examSet, index) => (
                              <tr
                                key={examSet.id}
                                className={cn(
                                  'border-b last:border-b-0 transition-colors hover:bg-muted/30',
                                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                )}
                              >
                                <td className="px-3 py-2.5">
                                  <div className="font-medium text-xs">
                                    {formatBengaliDate(examSet.scheduledDate)}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-xs font-mono">
                                    {formatBengaliTime(examSet.startTime)} - {formatBengaliTime(examSet.endTime)}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Badge variant="outline" className="text-[10px] gap-0.5">
                                    <Timer className="size-2.5" />
                                    {toBengaliNumerals(examSet.duration)} মি.
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="text-xs font-semibold">
                                    {toBengaliNumerals(examSet.totalQuestions || examSet._count?.questions || 0)}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {toBengaliNumerals(examSet.totalMarks)}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-xs font-medium line-clamp-2">{examSet.title}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {sortedExamSets.length > 5 && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        উপরে-নিচে স্ক্রল করে সব পরীক্ষা দেখুন
                      </p>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <FileQuestion className="size-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">{toBengaliNumerals(packageDetail.totalSets)}</p>
                        <p className="text-[10px] text-muted-foreground">মোট পরীক্ষা</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <Timer className="size-5 text-teal-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">
                          {toBengaliNumerals(
                            sortedExamSets.length > 0
                              ? sortedExamSets.reduce((sum, s) => sum + s.totalQuestions, 0)
                              : 0
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">মোট প্রশ্ন</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <Award className="size-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">
                          {toBengaliNumerals(
                            sortedExamSets.length > 0
                              ? sortedExamSets.reduce((sum, s) => sum + s.totalMarks, 0)
                              : 0
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">মোট নম্বর</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Login reminder */}
                  {!isAuthenticated && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                      <p>
                        কিনতে প্রথমে{' '}
                        <span
                          className="font-semibold cursor-pointer underline"
                          onClick={() => {
                            onOpenChange(false)
                            navigate('login')
                          }}
                        >
                          লগইন
                        </span>{' '}
                        করুন
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ──────────────── STEP: PAYMENT ──────────────────────── */}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 space-y-4"
                >
                  {/* Back to overview */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground -ml-2"
                    onClick={() => setStep('overview')}
                  >
                    ← ফিরে যান
                  </Button>

                  {/* Order Summary */}
                  <Card className="border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{packageDetail.title}</p>
                          <p className="text-xs text-muted-foreground">{packageDetail.class.name} • {toBengaliNumerals(packageDetail.totalSets)}টি পরীক্ষা</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            ৳{toBengaliNumerals(packageDetail.price)}
                          </p>
                          {discount > 0 && (
                            <p className="text-xs text-muted-foreground line-through">
                              ৳{toBengaliNumerals(packageDetail.originalPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Method Selection */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">পেমেন্ট মেথড নির্বাচন করুন</h3>
                    <div className="space-y-2">
                      {(Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethod[]).map((methodId) => {
                        const methodConfig = PAYMENT_METHOD_CONFIG[methodId]
                        const accountNumber = paymentAccounts[methodId] || ''
                        return (
                          <Card
                            key={methodId}
                            className={cn(
                              'cursor-pointer transition-all border-2',
                              selectedMethod === methodId
                                ? `${methodConfig.borderColor} ${methodConfig.bgColor}`
                                : 'border-border/50 hover:border-primary/30'
                            )}
                            onClick={() => setSelectedMethod(methodId)}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className={cn('p-2 rounded-xl', methodConfig.iconBg)}>
                                <Smartphone className={cn('size-5', methodConfig.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{methodConfig.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{accountNumber}</p>
                              </div>
                              <div
                                className={cn(
                                  'size-5 rounded-full border-2 flex items-center justify-center shrink-0',
                                  selectedMethod === methodId
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/30'
                                )}
                              >
                                {selectedMethod === methodId && (
                                  <CheckCircle2 className="size-3 text-primary-foreground" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  {/* Payment Instructions (shown after method selected) */}
                  {selectedMethod && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={cn(
                        'border-2',
                        PAYMENT_METHOD_CONFIG[selectedMethod].borderColor,
                        PAYMENT_METHOD_CONFIG[selectedMethod].bgColor
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Smartphone className={cn('size-4', PAYMENT_METHOD_CONFIG[selectedMethod].color)} />
                              <h4 className="font-semibold text-sm">
                                {PAYMENT_METHOD_CONFIG[selectedMethod].name} পেমেন্ট
                              </h4>
                            </div>
                            <Badge className={cn(
                              PAYMENT_METHOD_CONFIG[selectedMethod].bgColor,
                              PAYMENT_METHOD_CONFIG[selectedMethod].color,
                              'border-current/20'
                            )}>
                              ৳{toBengaliNumerals(packageDetail.price)}
                            </Badge>
                          </div>

                          {/* Account Number with copy */}
                          <div className="flex items-center gap-2 bg-background/80 rounded-lg p-2.5 mb-2">
                            <span className="text-sm font-mono flex-1">
                              {paymentAccounts[selectedMethod] || ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 h-7 text-xs shrink-0"
                              onClick={() => handleCopyAccount(selectedMethod, paymentAccounts[selectedMethod] || '')}
                            >
                              <Copy className="size-3" />
                              {copied && copiedKey === selectedMethod ? 'কপি হয়েছে' : 'কপি'}
                            </Button>
                          </div>

                          <ol className="space-y-1">
                            <li className="flex items-start gap-1.5 text-xs">
                              <span className="flex items-center justify-center size-4 rounded-full bg-background/80 text-[10px] font-medium shrink-0">১</span>
                              {PAYMENT_METHOD_CONFIG[selectedMethod].name} অ্যাপ খুলুন
                            </li>
                            <li className="flex items-start gap-1.5 text-xs">
                              <span className="flex items-center justify-center size-4 rounded-full bg-background/80 text-[10px] font-medium shrink-0">২</span>
                              Send Money অপশনে যান
                            </li>
                            <li className="flex items-start gap-1.5 text-xs">
                              <span className="flex items-center justify-center size-4 rounded-full bg-background/80 text-[10px] font-medium shrink-0">৩</span>
                              উপরের নম্বরে ৳{toBengaliNumerals(packageDetail.price)} পাঠান
                            </li>
                          </ol>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Transaction Form */}
                  {selectedMethod && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <Card className="border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-semibold text-sm">পেমেন্ট তথ্য</h4>

                          <div className="space-y-1.5">
                            <Label htmlFor="exam-txn-id" className="text-xs">ট্রানজেকশন ID *</Label>
                            <Input
                              id="exam-txn-id"
                              placeholder="যেমন: TXN123456789"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="exam-pay-number" className="text-xs">পেমেন্ট নম্বর *</Label>
                            <Input
                              id="exam-pay-number"
                              placeholder="যেমন: 017XXXXXXXX"
                              value={paymentNumber}
                              onChange={(e) => setPaymentNumber(e.target.value)}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="exam-screenshot" className="text-xs">স্ক্রিনশট (ঐচ্ছিক)</Label>
                            <div className="relative">
                              <Input
                                id="exam-screenshot"
                                type="file"
                                accept="image/*"
                                className="cursor-pointer text-sm"
                                onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)}
                              />
                            </div>
                            {uploadingScreenshot && (
                              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>স্ক্রিনশট আপলোড হচ্ছে...</span>
                              </div>
                            )}
                            {screenshotUrl && !uploadingScreenshot && (
                              <div className="mt-1.5 rounded-lg overflow-hidden border border-border/50">
                                <Image
                                  src={screenshotUrl}
                                  alt="স্ক্রিনশট প্রিভিউ"
                                  width={400}
                                  height={200}
                                  className="max-h-24 object-cover w-full"
                                  unoptimized
                                />
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              পেমেন্ট সফল হলে স্ক্রিনশট আপলোড করুন — দ্রুত যাচাইয়ে সহায়তা করে
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Payment Accounts Info */}
                  <Card className="border-border/50 bg-muted/30">
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-xs mb-2 flex items-center gap-1.5">
                        <AlertCircle className="size-3.5 text-amber-500" />
                        পেমেন্ট অ্যাকাউন্ট তথ্য
                      </h4>
                      <div className="space-y-1.5">
                        {(Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethod[]).map((methodId) => {
                          const methodConfig = PAYMENT_METHOD_CONFIG[methodId]
                          return (
                            <div key={methodId} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className={cn('size-2 rounded-full', methodConfig.bgColor, 'border', methodConfig.borderColor)} />
                                <span className={methodConfig.color}>{methodConfig.name}:</span>
                              </div>
                              <span className="font-mono">{paymentAccounts[methodId] || '—'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Notice */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center pb-1">
                    <Shield className="size-3" />
                    <span>আপনার পেমেন্ট তথ্য সুরক্ষিত রাখা হয়</span>
                  </div>
                </motion.div>
              )}

              {/* ──────────────── STEP: SUCCESS ──────────────────────── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  >
                    <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4" />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-2">পেমেন্ট জমা হয়েছে!</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                    অ্যাডমিন যাচাই করার পর আপনার <span className="font-semibold">{packageDetail.title}</span> প্যাকেজ অ্যাক্সেস সক্রিয় হবে।
                  </p>

                  {/* Purchase summary */}
                  <Card className="w-full max-w-sm text-left mb-4 border-border/50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">প্যাকেজ:</div>
                        <div className="font-medium truncate">{packageDetail.title}</div>
                        <div className="text-muted-foreground">শ্রেণি:</div>
                        <div className="font-medium">{packageDetail.class.name}</div>
                        <div className="text-muted-foreground">পরিমাণ:</div>
                        <div className="font-medium text-emerald-600 dark:text-emerald-400">
                          ৳{toBengaliNumerals(packageDetail.price)}
                        </div>
                        <div className="text-muted-foreground">মেথড:</div>
                        <div className="font-medium">
                          {selectedMethod ? PAYMENT_METHOD_CONFIG[selectedMethod].name : '—'}
                        </div>
                        <div className="text-muted-foreground">ট্রানজেকশন ID:</div>
                        <div className="font-mono text-xs">{transactionId}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Verification notice */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-left mb-6 max-w-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-amber-700 dark:text-amber-400 text-xs">
                        ভেরিফিকেশন সম্পন্ন হলে আপনাকে নোটিফিকেশন পাঠানো হবে। আপনি ড্যাশবোর্ড থেকে পেমেন্ট স্ট্যাটাস দেখতে পারবেন।
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => {
                        onOpenChange(false)
                      }}
                    >
                      বন্ধ করুন
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        onOpenChange(false)
                        navigate('user-dashboard')
                      }}
                    >
                      ড্যাশবোর্ড
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ─── Fixed CTA Footer ────────────────────────────────────── */}
        {purchaseStatus === 'available' && (
        <AnimatePresence mode="wait">
          {step === 'overview' && (
            <motion.div
              key="footer-overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-t bg-background p-4"
            >
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 text-base font-semibold"
                onClick={handleProceedToPayment}
              >
                <ShoppingCart className="size-5" />
                ৳{toBengaliNumerals(packageDetail.price)} পেমেন্ট করুন
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="footer-payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-t bg-background p-4"
            >
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 text-base font-semibold"
                disabled={!selectedMethod || !transactionId || !paymentNumber || submitting}
                onClick={handleSubmitPayment}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    পেমেন্ট জমা হচ্ছে...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-5" />
                    ৳{toBengaliNumerals(packageDetail.price)} পেমেন্ট জমা দিন
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="footer-success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-t bg-background p-4 flex gap-3"
            >
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={handleClose}
              >
                বন্ধ করুন
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11"
                onClick={() => {
                  onOpenChange(false)
                  navigate('user-dashboard')
                }}
              >
                <BookOpen className="size-4" />
                ড্যাশবোর্ড
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        )}
        </div>{/* end flex wrapper */}
      </DialogContent>
    </Dialog>
  )
}
