import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export interface AuditLogInput {
  adminId: string
  action: string
  entityType: string
  entityId: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldData: (input.oldData ?? undefined) as Prisma.InputJsonValue | undefined,
        newData: (input.newData ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should never break the main operation
    console.error('[AuditLog] Failed to create audit log:', error)
  }
}

export const AuditActions = {
  // Payment actions
  PAYMENT_APPROVE: 'payment_approve',
  PAYMENT_REJECT: 'payment_reject',
  
  // Grade actions
  GRADE_UPDATE: 'grade_update',
  GRADE_BULK: 'grade_bulk',
  
  // User actions
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ROLE_CHANGE: 'role_change',
  
  // Retake actions
  RETAKE_APPROVE: 'retake_approve',
  RETAKE_REJECT: 'retake_reject',
  
  // Content actions
  CONTENT_CREATE: 'content_create',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
} as const

export const EntityTypes = {
  PAYMENT: 'payment',
  SUBMISSION: 'submission',
  USER: 'user',
  CQ_QUESTION: 'cq_question',
  CQ_SET: 'cq_set',
  CQ_PACKAGE: 'cq_package',
  MCQ_QUESTION: 'mcq_question',
  LECTURE: 'lecture',
  BUNDLE: 'bundle',
  PACKAGE: 'package',
} as const

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

// Helper to create audit log from request context
export async function auditFromRequest(
  request: Request,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<void> {
  const ipAddress = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined
  
  await createAuditLog({
    adminId,
    action,
    entityType,
    entityId,
    oldData,
    newData,
    ipAddress,
    userAgent,
  })
}