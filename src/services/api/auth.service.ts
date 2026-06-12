import { api } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT'
  avatar?: string | null
  phone?: string | null
  institute?: string | null
  classLevel?: string | null
  board?: string | null
  isPremium: boolean
  premiumExpiry?: string | null
}

export const authService = {
  me: (userId?: string) =>
    api.get<{ user: AuthUser }>('auth/me', userId ? { userId } : undefined),

  logout: () =>
    api.post<{ message: string }>('auth/logout'),

  updateProfile: (data: Partial<AuthUser>) =>
    api.patch<{ user: AuthUser }>('user/profile', data),
}
