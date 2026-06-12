'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { Button } from '@/components/ui/button'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { navigate } = useRouterStore()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' } as const}
          className="max-w-md w-full text-center space-y-6"
        >
          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
          >
            <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-bold text-foreground">
              অ্যাডমিন অ্যাক্সেস প্রয়োজন
            </h1>
            <p className="text-muted-foreground">
              এই পৃষ্ঠায় প্রবেশ করতে অ্যাডমিন হিসেবে লগইন করুন
            </p>
          </motion.div>

          {/* Login button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => navigate('login')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 text-base"
            >
              <Lock className="mr-2 h-4 w-4" />
              লগইন করুন
            </Button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Authenticated but not admin — access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' } as const}
          className="max-w-md w-full text-center space-y-6"
        >
          {/* Shield icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10"
          >
            <Shield className="h-10 w-10 text-destructive" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-bold text-foreground">
              অ্যাক্সেস অস্বীকৃত
            </h1>
            <p className="text-muted-foreground">
              আপনার এই পৃষ্ঠায় প্রবেশের অনুমতি নেই। শুধুমাত্র অ্যাডমিন ব্যবহারকারীরা এই প্যানেল অ্যাক্সেস করতে পারবেন।
            </p>
          </motion.div>

          {/* Back to home button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => navigate('home')}
              variant="outline"
              className="px-8 py-2.5 text-base"
            >
              হোম পৃষ্ঠায় যান
            </Button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Authenticated as admin — render children with entrance animation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
