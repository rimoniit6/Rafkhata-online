import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Role } from '@prisma/client'

interface User {
  id: string
  email: string
  name: string
  role: Role
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
  persist(
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
  }),
  {
    name: 'edu-auth',
    partialize: (state) => ({
      user: state.user,
      supabaseUser: state.supabaseUser,
      isAuthenticated: state.isAuthenticated,
    }),
  }
))
