import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { AuthorizationError, AuthenticationError } from './errors'
import type { Role } from '@prisma/client'

export type { Role }

export interface AuthUser {
  id: string
  email: string
  role: Role
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
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true, email: true, role: true, isPremium: true },
    })
    if (!dbUser) return null
    return {
      user: dbUser,
      isSuperAdmin: dbUser.role === 'SUPER_ADMIN',
      isAdmin: dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN',
    }
  } catch {
    return null
  }
}

export async function requireAuth(request?: Request): Promise<AuthResult> {
  const auth = await verifyAuth(request)
  if (!auth) throw new AuthenticationError()
  return auth
}

export async function requireRole(request: Request | undefined, ...roles: Role[]): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (!roles.includes(auth.user.role)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
  return auth
}

export async function requireAdmin(request?: Request): Promise<AuthResult> {
  return requireRole(request, 'ADMIN', 'SUPER_ADMIN')
}

export async function requireSuperAdmin(request?: Request): Promise<AuthResult> {
  return requireRole(request, 'SUPER_ADMIN')
}

export function hasRole(user: { role: Role }, ...roles: Role[]): boolean {
  return roles.includes(user.role)
}

export function assertRole(user: { role: Role }, ...roles: Role[]): void {
  if (!roles.includes(user.role)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
}

/**
 * Check whether a user's role has a specific permission.
 * SUPER_ADMIN always passes all permission checks without DB lookup.
 */
let permissionCache: Map<string, Set<string>> | null = null
let permissionCacheTime = 0
const PERMISSION_CACHE_TTL = 60_000 // 1 minute

async function getPermissionsForRole(role: Role): Promise<Set<string>> {
  if (role === 'SUPER_ADMIN') return new Set(['*']) // super admin has all
  const now = Date.now()
  if (!permissionCache || now - permissionCacheTime > PERMISSION_CACHE_TTL) {
    const rows = await db.rolePermission.findMany({
      where: { role },
      include: { permission: { select: { name: true } } },
    })
    const perms = new Set(rows.map(r => r.permission.name))
    permissionCache = new Map([[role, perms]])
    permissionCacheTime = now
    return perms
  }
  return permissionCache.get(role) ?? new Set()
}

export function invalidatePermissionCache() {
  permissionCache = null
  permissionCacheTime = 0
}

/**
 * Require that the authenticated user has a specific permission.
 * SUPER_ADMIN passes all checks without needing explicit RolePermission entries.
 */
export async function requirePermission(
  request: Request | undefined,
  permissionName: string,
): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (auth.user.role === 'SUPER_ADMIN') return auth
  const perms = await getPermissionsForRole(auth.user.role)
  if (!perms.has(permissionName)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
  return auth
}

export const RoleLabel: Record<Role, string> = {
  SUPER_ADMIN: 'সুপার অ্যাডমিন',
  ADMIN: 'অ্যাডমিন',
  STUDENT: 'শিক্ষার্থী',
}
