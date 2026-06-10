import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'student'
  avatar?: string
  phone?: string
  institute?: string
  classLevel?: string
  board?: string
  isPremium: boolean
  premiumExpiry?: string
}

interface AuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  updateUser: (data: Partial<User>) => void
  clearAuth: () => void
  setSupabaseUser: (supabaseUser: SupabaseUser | null) => void
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    supabaseUser: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    logout: async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      set({ user: null, supabaseUser: null, isAuthenticated: false, isLoading: false })
    },
    setLoading: (isLoading) => set({ isLoading }),
    updateUser: (data) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
    clearAuth: () => set({ user: null, supabaseUser: null, isAuthenticated: false, isLoading: false }),
    setSupabaseUser: (supabaseUser) => set({ supabaseUser }),
  })
)
