'use client'

import React from 'react'
import { Lock, Shield } from 'lucide-react'
import { useShallowAuth } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { Button } from '@/components/ui/button'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated } = useShallowAuth()
  const navigate = useRouterStore((s) => s.navigate)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div
          className="max-w-md w-full text-center space-y-6 animate-fade-in-up animate-scale-in"
        >
          {/* Lock icon */}
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 animate-scale-in delay-100"
          >
            <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Title */}
          <div
            className="space-y-2 animate-fade-in-up delay-200"
          >
            <h1 className="text-2xl font-bold text-foreground">
              অ্যাডমিন অ্যাক্সেস প্রয়োজন
            </h1>
            <p className="text-muted-foreground">
              এই পৃষ্ঠায় প্রবেশ করতে অ্যাডমিন হিসেবে লগইন করুন
            </p>
          </div>

          {/* Login button */}
          <div
            className="animate-fade-in-up delay-300"
          >
            <Button
              onClick={() => navigate('login')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 text-base"
            >
              <Lock className="mr-2 h-4 w-4" />
              লগইন করুন
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated but not admin — access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div
          className="max-w-md w-full text-center space-y-6 animate-fade-in-up animate-scale-in"
        >
          {/* Shield icon */}
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 animate-scale-in delay-100"
          >
            <Shield className="h-10 w-10 text-destructive" />
          </div>

          {/* Title */}
          <div
            className="space-y-2 animate-fade-in-up delay-200"
          >
            <h1 className="text-2xl font-bold text-foreground">
              অ্যাক্সেস অস্বীকৃত
            </h1>
            <p className="text-muted-foreground">
              আপনার এই পৃষ্ঠায় প্রবেশের অনুমতি নেই। শুধুমাত্র অ্যাডমিন ব্যবহারকারীরা এই প্যানেল অ্যাক্সেস করতে পারবেন।
            </p>
          </div>

          {/* Back to home button */}
          <div
            className="animate-fade-in-up delay-300"
          >
            <Button
              onClick={() => navigate('home')}
              variant="outline"
              className="px-8 py-2.5 text-base"
            >
              হোম পৃষ্ঠায় যান
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated as admin — render children with entrance animation
  return (
    <div
      className="animate-fade-in"
    >
      {children}
    </div>
  )
}
