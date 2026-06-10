'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { onApiError } from '@/lib/api-client'
import { captureError } from '@/lib/error-history'

/**
 * Global API error handler.
 *
 * Subscribes to the onApiError event system and:
 * 1. Displays error toasts via sonner
 * 2. Captures errors into the dev error history store
 *
 * Mount once in the root layout — minimal visual footprint (null render).
 */
export default function ApiErrorHandler() {
  useEffect(() => {
    const unsubscribe = onApiError((event) => {
      // Capture into dev history (always, for debugging)
      captureError(event)

      // Show toast (only for non-silent requests — filtered upstream)
      const label = getErrorLabel(event.error.status)
      toast.error(label, {
        description: event.error.message,
        duration: 5000,
      })
    })

    return unsubscribe
  }, [])

  return null
}

function getErrorLabel(status: number): string {
  if (status === 0) return 'নেটওয়ার্ক ত্রুটি'
  if (status === 401) return 'সেশন শেষ'
  if (status === 403) return 'অনুমতি নেই'
  if (status === 404) return 'তথ্য পাওয়া যায়নি'
  if (status === 409) return 'ডুপ্লিকেট তথ্য'
  if (status === 422) return 'ইনপুট ত্রুটি'
  if (status === 429) return 'অনেক বেশি অনুরোধ'
  if (status >= 500) return 'সার্ভার ত্রুটি'
  if (status >= 400) return 'অনুরোধ ত্রুটি'
  return 'ত্রুটি'
}
