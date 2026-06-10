export {
  apiResponse,
  paginatedApiResponse,
  apiError,
  unauthorized,
  forbidden,
  notFound,
  rateLimitExceeded,
  validateBody,
  applyRateLimit,
  withAuth,
  withAdmin,
  withSuperAdmin,
} from '@/lib/api-utils'

export type { PaginationInput } from '@/lib/api-utils'

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  DatabaseError,
  handleApiError,
  asyncHandler,
  safeTransaction,
  logError,
} from '@/lib/errors'

export {
  verifyAuth,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
} from '@/lib/auth'

export type { AuthResult, AuthUser } from '@/lib/auth'
