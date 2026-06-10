'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setLoading, clearAuth, setSupabaseUser } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    const syncUser = async (supabaseUserId: string | undefined) => {
      if (!supabaseUserId) {
        clearAuth()
        return
      }

      try {
        const res = await fetch(`/api/auth/me`)
        if (res.ok) {
          const data = await res.json()
          const user = data.data?.user || data.user
          if (user) {
            login(user)
            return
          }
        }
        clearAuth()
      } catch {
        clearAuth()
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSupabaseUser(user)
        syncUser(user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const supabaseUser = session?.user ?? null
      setSupabaseUser(supabaseUser)

      if (event === 'SIGNED_IN' && supabaseUser) {
        syncUser(supabaseUser.id)
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [login, logout, setLoading, clearAuth, setSupabaseUser])

  return <>{children}</>
}
