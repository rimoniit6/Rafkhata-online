import { createClient } from '@/lib/supabase/server'

export interface AuthUser {
  id: string
  email: string
  role: string
  isPremium: boolean
}

export interface AuthResult {
  user: AuthUser
  isSuperAdmin: boolean
  isAdmin: boolean
}

export async function verifyAuth(request?: Request): Promise<AuthResult | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { db } = await import('@/lib/db')
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true, email: true, role: true, isPremium: true },
    })

    if (!dbUser) return null

    return {
      user: dbUser,
      isSuperAdmin: dbUser.role === 'super_admin',
      isAdmin: dbUser.role === 'admin' || dbUser.role === 'super_admin',
    }
  } catch {
    return null
  }
}

export async function requireAuth(request?: Request): Promise<AuthResult | null> {
  return verifyAuth(request)
}

export async function requireAdmin(request?: Request): Promise<AuthResult | null> {
  const auth = await verifyAuth(request)
  if (!auth || !auth.isAdmin) return null
  return auth
}

export async function requireSuperAdmin(request?: Request): Promise<AuthResult | null> {
  const auth = await verifyAuth(request)
  if (!auth || !auth.isSuperAdmin) return null
  return auth
}
