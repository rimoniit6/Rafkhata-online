'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return (
    <html lang="bn">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: '0.5rem',
            }}>
              সাইটটি সাময়িকভাবে অকার্যকর
            </h1>
            <p style={{
              color: '#64748b',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}>
              একটি গুরুতর ত্রুটি ঘটেছে। আমরা সমস্যাটি সমাধানের জন্য কাজ করছি।
              অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#059669',
                color: 'white',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
