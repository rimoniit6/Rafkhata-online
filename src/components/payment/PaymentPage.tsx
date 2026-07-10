'use client'

import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,BreadcrumbPage,BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { Separator } from '@/components/ui/separator'
import { useContentTypes } from '@/hooks/use-content-types'
import { useCsrf } from '@/hooks/use-csrf'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useToast } from '@/hooks/use-toast'
import { useUploadThing } from '@/lib/uploadthing/client'
import { useAuthStore, useAuthUser } from '@/store/auth'
import { useRouterStore, useRouteParams } from '@/store/router'
import {
AlertCircle,
ArrowLeft,ArrowRight,
BookOpen,
CheckCircle2,Clock,
Copy,
CreditCard,
Layers,
Loader2,
Package,
RefreshCw,
Shield,
Smartphone
} from 'lucide-react'

type PaymentStep = 'method' | 'pay' | 'verify'
type PaymentMethod = 'bkash' | 'nagad' | 'rocket'
type PaymentStatus = 'idle' | 'submitting' | 'success' | 'pending' | 'error'
type PaymentMode = 'content' | 'bundle'

interface ContentInfo {
  contentType: string
  contentId: string
  title: string
  price: number
  type: string
  description?: string
  isPremium?: boolean
  originalPrice?: number
  itemCount?: number
  duration?: number
  durationLabel?: string
  classLevel?: string
  mcqCount?: number
  cqCount?: number
  lectureCount?: number
  totalContent?: number
}

// Content type labels and icons are now provided dynamically via useContentTypes() hook

const stepLabels: Record<PaymentStep, string> = {
  method: 'পেমেন্ট মেথড',
  pay: 'পেমেন্ট করুন',
  verify: 'ভেরিফিকেশন',
}

export default function PaymentPage() {
  const params = useRouteParams()
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const user = useAuthUser()
  const { toast } = useToast()
  const { config } = useSiteConfig()
  const metadata = useHierarchyMetadata()
  const { getLabel, getIcon } = useContentTypes()
  const { token: csrfToken, loading: csrfLoading, refreshToken, tokenRef } = useCsrf()

  // Render a content type icon as JSX
  const renderTypeIcon = (type: string, className: string = 'size-5') => {
    const Icon = getIcon(type)
    return <Icon className={className} />
  }

  const defaultBkashInstructions = ['bKash অ্যাপ খুলুন', 'Send Money অপশনে যান', `নম্বর: ${config?.bkash || ''}`, 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']
  const defaultNagadInstructions = ['Nagad অ্যাপ খুলুন', 'Cash Out / Send Money যান', `নম্বর: ${config?.nagad || ''}`, 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']
  const defaultRocketInstructions = ['Rocket অ্যাপ খুলুন', 'Send Money অপশনে যান', `নম্বর: ${config?.rocket || ''}`, 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']

  // Build payment methods dynamically from site config
  const paymentMethods: {
    id: PaymentMethod
    name: string
    color: string
    bgColor: string
    borderColor: string
    accountNumber: string
    instructions: string[]
  }[] = [
    {
      id: 'bkash',
      name: 'bKash',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      borderColor: 'border-pink-300 dark:border-pink-700',
      accountNumber: config?.bkash || '',
      instructions: (config?.paymentBkashInstructions?.length ? config.paymentBkashInstructions : defaultBkashInstructions).map(
        s => s.replace('{account}', config?.bkash || '')
      ),
    },
    {
      id: 'nagad',
      name: 'Nagad',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-300 dark:border-orange-700',
      accountNumber: config?.nagad || '',
      instructions: (config?.paymentNagadInstructions?.length ? config.paymentNagadInstructions : defaultNagadInstructions).map(
        s => s.replace('{account}', config?.nagad || '')
      ),
    },
    {
      id: 'rocket',
      name: 'Rocket',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
      accountNumber: config?.rocket || '',
      instructions: (config?.paymentRocketInstructions?.length ? config.paymentRocketInstructions : defaultRocketInstructions).map(
        s => s.replace('{account}', config?.rocket || '')
      ),
    },
  ]
  const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('content')
  const [step, setStep] = useState<PaymentStep>('method')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [paymentNumber, setPaymentNumber] = useState('')
  const [_screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  // Track the content type/id so we can retry fetching on error
  const [fetchParams, setFetchParams] = useState<{ cType: string; cId: string } | null>(null)

  const fetchContentInfo = useCallback(async (cType: string, cId: string, classLevel?: string) => {
    setLoadingInfo(true)
    setError(null)
    try {
      let url = `/api/payment/content-info?contentType=${encodeURIComponent(cType)}&contentId=${encodeURIComponent(cId)}`
      if (classLevel) url += `&classLevel=${encodeURIComponent(classLevel)}`
      const res = await fetch(url)
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'কন্টেন্টের তথ্য আনতে সমস্যা হয়েছে')
      }
      const json = await res.json()
      const d = json.data || json
      setContentInfo({
        contentType: d.contentType || cType,
        contentId: d.contentId || cId,
        title: d.title || getLabel(cType) || cType,
        price: d.price || 0,
        type: d.contentTypeLabel || getLabel(cType) || cType,
        description: d.description || undefined,
        isPremium: d.isPremium,
        originalPrice: d.originalPrice,
        itemCount: d.itemCount,
        duration: d.duration,
        durationLabel: d.durationLabel,
        classLevel: d.classLevel || classLevel,
        mcqCount: d.mcqCount,
        cqCount: d.cqCount,
        lectureCount: d.lectureCount,
        totalContent: d.totalContent,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কন্টেন্টের তথ্য আনতে সমস্যা হয়েছে')
    } finally {
      setLoadingInfo(false)
    }
  }, [getLabel])

  // Session validation is now handled globally by AuthProvider
  // No aggressive per-page session check here

  useEffect(() => {
    const { contentType, contentId, bundleId, classLevel } = params

    if (bundleId) {
      // Bundle payment
      setPaymentMode('bundle')
      setFetchParams({ cType: 'bundle', cId: bundleId })
      fetchContentInfo('bundle', bundleId)
    } else if (contentType && contentId) {
      // Per-content or package payment
      setPaymentMode(contentType === 'package' ? 'bundle' : 'content')
      setFetchParams({ cType: contentType, cId: contentId })
      fetchContentInfo(contentType, contentId, classLevel)
    } else {
      // No valid content or bundle specified - show error
      setError('কোনো কন্টেন্ট বা বান্ডেল নির্বাচন করা হয়নি। অনুগ্রহ করে হোম পেজে ফিরে যান।')
      setLoadingInfo(false)
    }
  }, [params, fetchContentInfo])

  const handleRetry = useCallback(() => {
    if (fetchParams) {
      fetchContentInfo(fetchParams.cType, fetchParams.cId)
    } else {
      navigate('home')
    }
  }, [fetchParams, fetchContentInfo, navigate])

  const getAmount = () => {
    return contentInfo?.price || 0
  }

  const getModeIcon = () => {
    if (paymentMode === 'bundle') return <Package className="size-5 text-teal-600" />
    return renderTypeIcon(contentInfo?.contentType || 'mcq')
  }

  const getModeLabel = () => {
    if (paymentMode === 'bundle') return 'বান্ডেল ক্রয়'
    return 'কন্টেন্ট ক্রয়'
  }

  const copyAccountNumber = (number: string) => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const handleSubmit = async () => {
    if (!selectedMethod || !transactionId || !paymentNumber) {
      toast({ title: 'তথ্য অসম্পূর্ণ', description: 'পেমেন্ট মেথড, ট্রানজেকশন ID এবং পেমেন্ট নম্বর দিন', variant: 'destructive' })
      return
    }
    if (uploadingScreenshot) {
      toast({ title: 'অপেক্ষা করুন', description: 'স্ক্রিনশট আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন', variant: 'destructive' })
      return
    }
    if (!user?.id) {
      toast({ title: 'লগইন প্রয়োজন', description: 'পেমেন্ট করতে প্রথমে লগইন করুন', variant: 'destructive' })
      navigate('login')
      return
    }
    if (csrfLoading) {
      toast({ title: 'অপেক্ষা করুন', description: 'সিকিউরিটি টোকেন লোড হচ্ছে...', variant: 'destructive' })
      return
    }
    let activeToken = csrfToken || tokenRef.current
    if (!activeToken) {
      activeToken = await refreshToken()
    }
    setPaymentStatus('submitting')
    try {
      const body: Record<string, unknown> = {
        method: selectedMethod,
        transactionId,
        paymentNumber,
        screenshot: screenshotUrl || undefined,
        amount: contentInfo?.price,
        contentType: contentInfo?.contentType,
        contentId: contentInfo?.contentId,
        contentTitle: contentInfo?.title,
        classLevel: contentInfo?.classLevel || params.classLevel,
      }

      // userId is now derived from the JWT session on the server side
      // No need to send it in the request body

      const doSubmit = async (token: string | null): Promise<Response> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['x-csrf-token'] = token
        return fetch('/api/payment', { method: 'POST', headers, body: JSON.stringify(body) })
      }

      let res = await doSubmit(activeToken)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        // Handle 401 — user session is stale, redirect to login gracefully
        if (res.status === 401) {
          // Clear local state but don't call logout() which makes another API call
          // that could also fail and cause a loop
          useAuthStore.getState().clearAuth()
          toast({
            title: 'সেশন মেয়াদোত্তীর্ণ',
            description: 'অনুগ্রহ করে পুনরায় লগইন করুন।',
            variant: 'destructive',
          })
          navigate('login')
          return
        }
        // Handle CSRF error — refresh token and retry once
        if (res.status === 403 && data?.code === 'CSRF_INVALID') {
          const newToken = await refreshToken()
          if (newToken) {
            res = await doSubmit(newToken)
            if (res.ok) {
              setPaymentStatus('pending')
              setStep('verify')
              toast({ title: 'পেমেন্ট জমা হয়েছে', description: 'অ্যাডমিন যাচাই করার পর আপনার কন্টেন্ট অ্যাক্সেস সক্রিয় হবে', variant: 'default' })
              return
            }
          }
          const retryData = await res.json().catch(() => null)
          throw new Error(retryData?.error || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে')
        }
        throw new Error(data?.error || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে')
      }

      setPaymentStatus('pending')
      setStep('verify')
      toast({
        title: 'পেমেন্ট জমা হয়েছে',
        description: 'অ্যাডমিন যাচাই করার পর আপনার কন্টেন্ট অ্যাক্সেস সক্রিয় হবে',
      })
    } catch (err) {
      setPaymentStatus('error')
      toast({
        title: 'পেমেন্ট জমা দিতে সমস্যা',
        description: err instanceof Error ? err.message : 'আবার চেষ্টা করুন',
        variant: 'destructive',
      })
    }
  }

  const amount = getAmount()

  // Show auth required state if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="size-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">লগইন প্রয়োজন</h2>
            <p className="text-muted-foreground mb-4">পেমেন্ট করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('login')} className="gap-2">
                লগইন করুন
              </Button>
              <Button variant="outline" onClick={() => navigate('home')} className="gap-2">
                <ArrowLeft className="size-4" />
                হোমে ফিরে যান
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">ত্রুটি</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {fetchParams && (
                <Button variant="outline" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="size-4" />
                  আবার চেষ্টা করুন
                </Button>
              )}
              <Button onClick={() => navigate('home')} className="gap-2">
                <ArrowLeft className="size-4" />
                হোমে ফিরে যান
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state
  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">কন্টেন্টের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (!contentInfo) return null

  const currentMethod = paymentMethods.find((m) => m.id === selectedMethod)

  const steps: PaymentStep[] = ['method', 'pay', 'verify']
  const currentStepIndex = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-emerald-100" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-emerald-200" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">পেমেন্ট</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mt-3">
            {getModeIcon()}
            <h1 className="text-2xl font-bold text-white">{getModeLabel()}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Stepper */}
        <Card className="border-border/50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center size-8 rounded-full text-sm font-medium transition-colors ${
                      i < currentStepIndex
                        ? 'bg-emerald-500 text-white'
                        : i === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {i < currentStepIndex ? <CheckCircle2 className="size-4" /> : i + 1}
                    </div>
                    <span className="text-xs mt-1 text-center hidden sm:block">{stepLabels[s]}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      i < currentStepIndex ? 'bg-emerald-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary - Enhanced with prominent content info */}
        <Card className="border-border/50 mb-4 overflow-hidden">
          {/* Prominent title banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 border-b border-border/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-background shadow-sm border border-border/50 shrink-0">
                {getModeIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight break-words">{contentInfo.title}</h2>
                {contentInfo.description && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2"><RichContentRenderer content={contentInfo.description} /></div>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderTypeIcon(contentInfo.contentType, 'size-4')}
                <span className="text-sm font-medium">{contentInfo.type || getLabel(contentInfo.contentType) || contentInfo.contentType}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{amount}</p>
                {contentInfo.originalPrice && contentInfo.originalPrice > amount && (
                  <p className="text-sm text-muted-foreground line-through">৳{contentInfo.originalPrice}</p>
                )}
              </div>
            </div>

            {paymentMode === 'bundle' && contentInfo.itemCount && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center gap-2 text-sm">
                  <Package className="size-4 text-teal-600" />
                  <span className="text-muted-foreground">বান্ডেলে অন্তর্ভুক্ত:</span>
                  <span className="font-semibold">{contentInfo.itemCount}টি প্রিমিয়াম কন্টেন্ট</span>
                </div>
              </>
            )}

            {contentInfo.contentType === 'package' && (
              <>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  {contentInfo.durationLabel && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-teal-600" />
                      <span className="text-muted-foreground">মেয়াদ:</span>
                      <span className="font-semibold text-teal-700 dark:text-teal-400">{contentInfo.durationLabel}</span>
                    </div>
                  )}
                  {contentInfo.classLevel && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-emerald-600" />
                      <span className="text-muted-foreground">শ্রেণি:</span>
                      <span className="font-semibold">
                        {metadata.classLevelLabels[contentInfo.classLevel] || contentInfo.classLevel}
                      </span>
                    </div>
                  )}
                  {contentInfo.totalContent !== undefined && contentInfo.totalContent > 0 && (
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-cyan-600" />
                      <span className="text-muted-foreground">প্রিমিয়াম কন্টেন্ট:</span>
                      <span className="font-semibold">{contentInfo.totalContent}টি</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {paymentMode === 'content' && (
              <>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">কন্টেন্টের ধরন:</div>
                  <div className="font-medium">{contentInfo.type || getLabel(contentInfo.contentType) || contentInfo.contentType}</div>
                  <div className="text-muted-foreground">কন্টেন্ট ID:</div>
                  <div className="font-mono text-xs">{contentInfo.contentId.length > 12 ? contentInfo.contentId.slice(0, 12) + '...' : contentInfo.contentId}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 1: Payment Method */}
        {step === 'method' && (
          <div className="animate-slide-in-right">
            <h3 className="font-semibold mb-3">পেমেন্ট মেথড নির্বাচন করুন</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedMethod === method.id
                      ? `${method.borderColor} ${method.bgColor}`
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${method.bgColor}`}>
                      <Smartphone className={`size-6 ${method.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{method.name}</p>
                      <p className="text-xs text-muted-foreground">মোবাইল ব্যাংকিং</p>
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedMethod === method.id && (
                        <CheckCircle2 className="size-3 text-primary-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => goBack()}
              >
                <ArrowLeft className="size-4" />
                পেছনে
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!selectedMethod}
                onClick={() => setStep('pay')}
              >
                পরবর্তী
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Instructions & Form */}
        {step === 'pay' && currentMethod && (
          <div className="animate-slide-in-right">
            {/* Instructions */}
            <Card className={`border-2 ${currentMethod.borderColor} ${currentMethod.bgColor} mb-4`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className={`size-5 ${currentMethod.color}`} />
                    <h3 className="font-semibold">{currentMethod.name} পেমেন্ট</h3>
                  </div>
                  <Badge className={`${currentMethod.bgColor} ${currentMethod.color} border-current/20`}>
                    ৳{amount}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 bg-background/80 rounded-lg p-3 mb-3">
                  <span className="text-sm font-mono">{currentMethod.accountNumber}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 ml-auto"
                    onClick={() => copyAccountNumber(currentMethod.accountNumber)}
                  >
                    <Copy className="size-3.5" />
                    {copied ? 'কপি হয়েছে' : 'কপি'}
                  </Button>
                </div>

                <ol className="space-y-1.5">
                  {currentMethod.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex items-center justify-center size-5 rounded-full bg-background/80 text-xs font-medium shrink-0">
                        {i + 1}
                      </span>
                      {inst}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Transaction Form */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">পেমেন্ট তথ্য</h3>

                <div className="space-y-2">
                  <Label htmlFor="transactionId">ট্রানজেকশন ID *</Label>
                  <Input
                    id="transactionId"
                    placeholder="যেমন: TXN123456789"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNumber">পেমেন্ট নম্বর *</Label>
                  <Input
                    id="paymentNumber"
                    placeholder="যেমন: 017XXXXXXXX"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot">স্ক্রিনশট (ঐচ্ছিক)</Label>
                  <div className="relative">
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)}
                    />
                  </div>
                  {uploadingScreenshot && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>স্ক্রিনশট আপলোড হচ্ছে...</span>
                    </div>
                  )}
                  {screenshotUrl && !uploadingScreenshot && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                      <Image
                        src={screenshotUrl}
                        alt="স্ক্রিনশট প্রিভিউ"
                        width={400}
                        height={300}
                        className="max-h-32 object-cover w-full"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    পেমেন্ট সফল হলে স্ক্রিনশট আপলোড করুন — দ্রুত যাচাইয়ে সহায়তা করে
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setStep('method')}
              >
                <ArrowLeft className="size-4" />
                পেছনে
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!transactionId || !paymentNumber || paymentStatus === 'submitting' || csrfLoading || !csrfToken}
                onClick={handleSubmit}
              >
                {paymentStatus === 'submitting' ? (
                  <>
                    <Clock className="size-4 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    ৳{amount} পেমেন্ট জমা দিন
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 'verify' && (
          <div className="animate-slide-in-right">
            <Card className="border-border/50">
              <CardContent className="p-6 text-center">
                {paymentStatus === 'success' ? (
                  <>
                    <div className="animate-scale-in">
                      <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">পেমেন্ট সফল!</h3>
                    <p className="text-muted-foreground mb-6">
                      কন্টেন্ট অ্যাক্সেস সক্রিয় হবে। এখন কন্টেন্ট দেখতে পারবেন।
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1" onClick={() => navigate('home')}>
                        হোমে যান
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => navigate('user-dashboard')}>
                        ড্যাশবোর্ড
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="animate-scale-in">
                      <Clock className="size-16 text-amber-500 mx-auto mb-4" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">পেমেন্ট যাচাই চলছে</h3>
                    <p className="text-muted-foreground mb-6">
                      আপনার পেমেন্ট যাচাই করা হচ্ছে। অ্যাডমিন অনুমোদনের পর কন্টেন্ট অ্যাক্সেস সক্রিয় হবে।
                    </p>

                    {/* Purchase Details */}
                    <Card className="text-left mb-4 border-border/50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">ক্রয়:</div>
                          <div className="font-medium">{contentInfo.title}</div>
                          <div className="text-muted-foreground">ধরন:</div>
                          <div className="font-medium">{contentInfo.type || getLabel(contentInfo.contentType) || contentInfo.contentType}</div>
                          {paymentMode === 'bundle' && contentInfo.itemCount && (
                            <>
                              <div className="text-muted-foreground">আইটেম:</div>
                              <div className="font-medium">{contentInfo.itemCount}টি প্রিমিয়াম কন্টেন্ট</div>
                            </>
                          )}
                          <div className="text-muted-foreground">পরিমাণ:</div>
                          <div className="font-medium">
                            ৳{amount}
                            {contentInfo.originalPrice && contentInfo.originalPrice > amount && (
                              <span className="text-muted-foreground line-through text-xs ml-1.5">৳{contentInfo.originalPrice}</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">মেথড:</div>
                          <div className="font-medium">{currentMethod?.name || selectedMethod}</div>
                          <div className="text-muted-foreground">ট্রানজেকশন ID:</div>
                          <div className="font-mono text-xs">{transactionId}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-left mb-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-amber-700 dark:text-amber-400">
                          ভেরিফিকেশন সম্পন্ন হলে আপনাকে নোটিফিকেশন পাঠানো হবে। আপনি ড্যাশবোর্ড থেকে পেমেন্ট স্ট্যাটাস দেখতে পারবেন।
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1" onClick={() => navigate('home')}>
                        হোমে যান
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => navigate('user-dashboard')}>
                        ড্যাশবোর্ড
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 mt-6 mb-8 text-xs text-muted-foreground justify-center">
          <Shield className="size-4" />
          <span>আপনার পেমেন্ট তথ্য সুরক্ষিত রাখা হয়</span>
        </div>
      </div>
    </div>
  )
}
