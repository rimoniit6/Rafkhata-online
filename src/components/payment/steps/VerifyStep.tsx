'use client'

import React, { memo } from 'react'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouterStore } from '@/store/router'
import type { PaymentStatus, ContentInfo } from './types'

interface VerifyStepProps {
  paymentStatus: PaymentStatus
  contentInfo: ContentInfo
  amount: number
  selectedMethod: string | null
  transactionId: string
  paymentMode: string
}

function VerifyStep({ paymentStatus, contentInfo, amount, selectedMethod, transactionId, paymentMode }: VerifyStepProps) {
  const navigate = useRouterStore((s) => s.navigate)

  return (
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

              <Card className="text-left mb-4 border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">ক্রয়:</div>
                    <div className="font-medium">{contentInfo.title}</div>
                    <div className="text-muted-foreground">ধরন:</div>
                    <div className="font-medium">{contentInfo.type || contentInfo.contentType}</div>
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
                    <div className="font-medium">{selectedMethod}</div>
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
  )
}

export default memo(VerifyStep)