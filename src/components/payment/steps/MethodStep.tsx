'use client'

import React from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import type { PaymentMethod, PaymentMethodInfo } from './types'

interface MethodStepProps {
  paymentMethods: PaymentMethodInfo[]
  selectedMethod: PaymentMethod | null
  setSelectedMethod: (method: PaymentMethod) => void
  onNext: () => void
}

export function MethodStep({ paymentMethods, selectedMethod, setSelectedMethod, onNext }: MethodStepProps) {
  const goBack = useRouterStore((s) => s.goBack)

  return (
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
          onClick={onNext}
        >
          পরবর্তী
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
