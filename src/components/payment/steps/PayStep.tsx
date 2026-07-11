'use client'

import Image from 'next/image'
import React from 'react'
import { ArrowLeft, Clock, Copy, CreditCard, Loader2, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PaymentMethodInfo } from './types'

interface PayStepProps {
  currentMethod: PaymentMethodInfo
  amount: number
  transactionId: string
  setTransactionId: (v: string) => void
  paymentNumber: string
  setPaymentNumber: (v: string) => void
  handleScreenshotChange: (file: File | null) => void
  uploadingScreenshot: boolean
  screenshotUrl: string | null
  paymentStatus: string
  csrfLoading: boolean
  csrfToken: string | null
  handleSubmit: () => void
  onBack: () => void
}

export function PayStep({
  currentMethod,
  amount,
  transactionId,
  setTransactionId,
  paymentNumber,
  setPaymentNumber,
  handleScreenshotChange,
  uploadingScreenshot,
  screenshotUrl,
  paymentStatus,
  csrfLoading,
  csrfToken,
  handleSubmit,
  onBack,
}: PayStepProps) {
  const [copied, setCopied] = React.useState(false)

  const copyAccountNumber = (number: string) => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
          onClick={onBack}
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
  )
}
