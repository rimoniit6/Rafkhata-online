'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api-client'
import type {
  BoardQuestionItem,
  AccessStatus,
  PurchaseStatusType,
  PackageOffer,
  BundleOffer,
} from '@/types/board-questions'

interface BatchCheckItem {
  contentType: string
  contentId: string
  purchased: boolean
  pendingPayment: boolean
}

interface BundlesForApiResult {
  bundles: BundleOffer[]
  packages: PackageOffer[]
}

export function useAccessStatus(questions: BoardQuestionItem[]): Record<string, AccessStatus> {
  const { user } = useAuthStore()
  const [accessMap, setAccessMap] = useState<Record<string, AccessStatus>>({})
  const fetchingRef = useRef(false)
  const prevQuestionsRef = useRef('')

  useEffect(() => {
    const key = questions.length === 0
      ? ''
      : questions.map(q => `${q.id}:${q.isPremium}:${q.classLevel}`).join(',')

    if (key === prevQuestionsRef.current && !fetchingRef.current) return
    prevQuestionsRef.current = key

    if (questions.length === 0) {
      setAccessMap({})
      return
    }

    const fetchAccess = async () => {
      fetchingRef.current = true

      try {
        const batchItems = questions.map(q => ({
          contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
          contentId: q.id,
        }))

        const batchResult = await api.post<{ items: BatchCheckItem[] }>('payment/batch-check', { items: batchItems })

        const map: Record<string, AccessStatus> = {}
        const lockedPremiumIds: string[] = []

        for (const q of questions) {
          const check = batchResult.items.find(i => i.contentId === q.id)
          const purchased = check?.purchased ?? false
          const pending = check?.pendingPayment ?? false

          let accessType: PurchaseStatusType
          const purchaseReason: string | null = null

          if (!q.isPremium) {
            accessType = 'free'
          } else if (purchased) {
            accessType = 'purchased'
          } else if (pending) {
            accessType = 'pending'
          } else {
            accessType = 'locked'
            lockedPremiumIds.push(q.id)
          }

          map[q.id] = { questionId: q.id, accessType, purchaseReason }
        }

        if (lockedPremiumIds.length > 0) {
          const lockedQuestions = questions.filter(q => lockedPremiumIds.includes(q.id))

          const bundlePromises = lockedQuestions.map(async (q) => {
            try {
              const result = await api.get<BundlesForApiResult>('content/bundles-for', {
                contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
                contentId: q.id,
                classLevel: q.classLevel,
              })
              return { id: q.id, ...result }
            } catch {
              return { id: q.id, bundles: [], packages: [] }
            }
          })

          const bundleResults = await Promise.all(bundlePromises)

          for (const result of bundleResults) {
            if (map[result.id]) {
              map[result.id] = {
                ...map[result.id],
                packages: result.packages ?? [],
                bundles: result.bundles ?? [],
              }
            }
          }
        }

        setAccessMap(map)
      } catch {
        const map: Record<string, AccessStatus> = {}
        for (const q of questions) {
          map[q.id] = {
            questionId: q.id,
            accessType: q.isPremium ? 'locked' : 'free',
            purchaseReason: null,
          }
        }
        setAccessMap(map)
      } finally {
        fetchingRef.current = false
      }
    }

    fetchAccess()
  }, [questions, user])

  return accessMap
}
