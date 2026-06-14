'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Crown, Lock, CheckCircle2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import dynamic from 'next/dynamic'
const PurchaseOptionsModal = dynamic(() => import('@/components/shared/PurchaseOptionsModal'))

interface KQItem {
  id: string
  question: string
  answer: string
  questionImage: string | null
  answerImage: string | null
  isPremium: boolean
  price: number
  order: number
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

export default function KnowledgeQuestionsPage() {
  const { navigate, params } = useRouterStore()
  const chapterId = params?.chapterId as string | undefined
  const { user } = useAuthStore()

  const [questions, setQuestions] = useState<KQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseData, setPurchaseData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  useEffect(() => {
    if (!chapterId) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/knowledge-questions?chapterId=${chapterId}`)
      .then(r => r.json())
      .then(json => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setQuestions(data || [])
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false))
  }, [chapterId])

  useEffect(() => {
    if (!user?.id || questions.length === 0) return
    const premiumItems = questions.filter(q => q.isPremium)
    if (premiumItems.length === 0) return

    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(q => ({ contentType: 'short-questions', contentId: q.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [questions, user?.id])

  const getAccessStatus = (q: KQItem): 'free' | 'purchased' | 'locked' => {
    if (!q.isPremium) return 'free'
    if (purchaseMap[q.id]?.purchased) return 'purchased'
    return 'locked'
  }

  const openBuy = (q: KQItem) => {
    setPurchaseData({
      contentType: 'short-questions',
      contentId: q.id,
      contentTitle: q.question.length > 60 ? q.question.slice(0, 60) + '...' : q.question,
      contentPrice: q.price,
      classLevel: params?.classSlug as string || '',
    })
    setPurchaseModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white mb-3 -ml-2"
            onClick={() => navigate('chapter-detail', { chapterId })}
          >
            <ArrowLeft className="size-4 mr-1" /> ফিরে যান
          </Button>
          <h1 className="text-2xl font-bold">সংক্ষিপ্ত প্রশ্ন</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>কোনো প্রশ্ন নেই</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => {
              const access = getAccessStatus(q)
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    'overflow-hidden border-l-4',
                    access === 'locked' ? 'border-l-amber-400' : access === 'purchased' ? 'border-l-emerald-500' : 'border-l-emerald-400'
                  )}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">
                            <span className="text-muted-foreground mr-2">{toBengaliNumerals(i + 1)}.</span>
                            <RichContentRenderer content={q.question} inline />
                            {access === 'locked' ? (
                              <>
                                <span className="mx-1.5 text-muted-foreground">—</span>
                                <span className="blur-sm select-none italic text-muted-foreground/60">উত্তর দেখতে কিনুন</span>
                              </>
                            ) : (
                              <>
                                <span className="mx-1.5 text-muted-foreground">—</span>
                                <RichContentRenderer content={q.answer} inline />
                              </>
                            )}
                          </p>
                          {q.questionImage && (
                            <img
                              src={q.questionImage}
                              alt="প্রশ্নের ছবি"
                              className={cn("mt-2 max-w-full h-auto rounded-lg", access === 'locked' && 'opacity-60')}
                            />
                          )}
                          {access !== 'locked' && q.answerImage && (
                            <img
                              src={q.answerImage}
                              alt="উত্তরের ছবি"
                              className="mt-2 max-w-full h-auto rounded-lg"
                            />
                          )}
                        </div>
                        {access === 'purchased' && (
                          <Badge className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="size-3 mr-1" /> কেনা
                          </Badge>
                        )}
                        {access === 'locked' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                              <Lock className="size-3" /> প্রিমিয়াম
                            </Badge>
                            {q.price > 0 && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{q.price}</Badge>
                            )}
                          </div>
                        )}
                        {access === 'free' && q.isPremium && (
                          <Badge variant="secondary" className="shrink-0">
                            <Crown className="size-3 mr-1" /> প্রিমিয়াম
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {purchaseData && (
        <PurchaseOptionsModal
          open={purchaseModalOpen}
          onOpenChange={(open) => {
            if (!open) { setPurchaseModalOpen(false); setPurchaseData(null) }
          }}
          contentType={purchaseData.contentType}
          contentId={purchaseData.contentId}
          contentTitle={purchaseData.contentTitle}
          contentPrice={purchaseData.contentPrice}
          classLevel={purchaseData.classLevel}
        />
      )}
    </div>
  )
}
