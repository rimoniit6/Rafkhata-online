'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Chrome, Facebook, Mail, Lock, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'

export default function SocialLoginPage() {
  const { login, setLoading, isLoading } = useAuthStore()
  const { navigate } = useRouterStore()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  const handleFacebookLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড দিন')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'লগইন ব্যর্থ হয়েছে')
        return
      }
      const user = data.data?.user || data.user
      if (user) {
        login(user)
        // Sync supabase user so AuthProvider has consistent supabaseUser state
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user: su } }) => {
          if (su) useAuthStore.getState().setSupabaseUser(su)
        }).catch(() => {})
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          navigate('admin-dashboard')
        } else {
          navigate('home')
        }
      }
    } catch {
      setError('সার্ভার সমস্যা। পরে আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-background dark:via-background dark:to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <motion.div variants={itemVariants} className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">শিক্ষা বাংলা</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {showAdminLogin ? 'অ্যাডমিন লগইন' : 'সামাজিক অ্যাকাউন্ট দিয়ে লগইন করুন'}
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {showAdminLogin ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="পাসওয়ার্ড দিন"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        লগইন হচ্ছে...
                      </div>
                    ) : (
                      'লগইন করুন'
                    )}
                  </Button>
                </motion.div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setError('') }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    সামাজিক লগইনে ফিরুন
                  </button>
                </div>
              </form>
            ) : (
              <>
                <motion.div variants={itemVariants} className="space-y-3">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-medium text-base"
                  >
                    <Chrome className="w-5 h-5 mr-3" />
                    Google দিয়ে লগইন করুন
                  </Button>

                  <Button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full h-12 bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-base"
                  >
                    <Facebook className="w-5 h-5 mr-3 fill-current" />
                    Facebook দিয়ে লগইন করুন
                  </Button>
                </motion.div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(true)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    অ্যাডমিন লগইন
                  </button>
                </div>
              </>
            )}

            {isLoading && !showAdminLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">সংযোগ করা হচ্ছে...</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
