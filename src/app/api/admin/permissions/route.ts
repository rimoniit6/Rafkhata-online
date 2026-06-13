import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/errors'
import { invalidatePermissionCache } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await applyRateLimit(apiLimiter, request)
    await requirePermission(request, 'system.rbac')

    const permissions = await db.permission.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
      include: {
        roles: {
          select: { role: true },
        },
      },
    })

    const data = permissions.map(p => ({
      id: p.id,
      name: p.name,
      group: p.group,
      description: p.description,
      roles: p.roles.map(r => r.role),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error, 'Get permissions error')
  }
}

export async function PUT(request: Request) {
  try {
    await applyRateLimit(apiLimiter, request)
    await requirePermission(request, 'system.rbac')

    const body = await request.json()
    const { permissionId, roles } = body as { permissionId: string; roles: string[] }

    if (!permissionId || !Array.isArray(roles)) {
      return apiError('permissionId এবং roles প্রয়োজন', 400, 'INVALID_INPUT')
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'STUDENT']
    const invalidRoles = roles.filter(r => !validRoles.includes(r))
    if (invalidRoles.length > 0) {
      return apiError(`অবৈধ রোল: ${invalidRoles.join(', ')}`, 400, 'INVALID_ROLE')
    }

    // Remove existing mappings
    await db.rolePermission.deleteMany({ where: { permissionId } })

    // Add new mappings
    for (const role of roles) {
      await db.rolePermission.create({
        data: { role: role as any, permissionId },
      })
    }

    invalidatePermissionCache()

    return NextResponse.json({ success: true, message: 'পারমিশন আপডেট করা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Update permissions error')
  }
}
