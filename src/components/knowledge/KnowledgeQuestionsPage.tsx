'use client'

import { KnowledgeCard } from '@/components/chapter-hub/cards/KnowledgeCard'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { KnowledgeItem } from '@/hooks/use-chapter-content'
import { useAuthUser } from '@/store/auth'
import { useRouterStore, useRouteParams } from '@/store/router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect,useState } from 'react'

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

export default function KnowledgeQuestionsPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const params = useRouteParams()
  const chapterId = params?.chapterId as string | undefined
  const user = useAuthUser()

  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseData, setPurchaseData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  const { data: questions = [], isLoading: loading } = useQuery<KnowledgeItem[]>({
    queryKey: ['knowledge-questions', chapterId],
    queryFn: async () => {
      if (!chapterId) return []
      const r = await fetch(`/api/knowledge-questions?chapterId=${chapterId}`)
      const json = await r.json()
      const data = json.success ? json.data : (Array.isArray(json) ? json : [])
      return data || []
    },
    enabled: Boolean(chapterId),
  })

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
          <p className="text-white/70 text-sm mt-1">{questions.length}টি প্রশ্ন</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>কোনো প্রশ্ন নেই</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <KnowledgeCard
                key={q.id}
                item={q}
                index={i}
                isPurchased={purchaseMap[q.id]?.purchased}
                onUnlock={() => {
                  setPurchaseData({
                    contentType: 'short-questions',
                    contentId: q.id,
                    contentTitle: q.question.replace(/<[^>]*>/g, '').slice(0, 80),
                    contentPrice: q.price,
                    classLevel: params?.classSlug as string || '',
                  })
                  setPurchaseModalOpen(true)
                }}
              />
            ))}
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
