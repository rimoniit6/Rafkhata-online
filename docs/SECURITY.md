# Security Architecture

## Authentication

- **Provider**: Supabase Auth with httpOnly cookies
- **Session**: Managed via `@supabase/ssr` with cookie-based sessions
- **Middleware**: Session refresh on every request via `updateSession()`
- **Service Role**: `SUPABASE_SERVICE_ROLE_KEY` for admin operations (server-only)

## Authorization

### Role-Based Access Control (RBAC)
- Three roles: `SUPER_ADMIN`, `ADMIN`, `STUDENT`
- Permission system with named permissions (e.g., `"payment.approve"`)
- In-memory permission cache with 60s TTL
- SUPER_ADMIN bypasses all permission checks

### Content Access Control
- Multi-level resolution: subscription -> direct payment -> bundle purchase
- Type-cross-matching (board-mcq inherits mcq access)
- Pending payment detection

## Request Security

### CSRF Protection
- JWT-based CSRF tokens (jose library, HS256)
- Cookie-stored token (`csrf_token`, httpOnly)
- Header-based verification (`x-csrf-token`)
- Form data fallback for non-JSON requests
- 1-hour token expiry

### Rate Limiting
- Upstash Redis sliding window implementation
- Three limit tiers: API (60/min), Upload (10/min), Auth (10/15min)
- Dynamic limits configurable via SiteSetting table
- Client identification via IP headers (CF, Vercel, X-Forwarded-For)
- Rate limit headers returned on limit exceeded

### Security Headers
Configured in `next.config.ts`:
- `Strict-Transport-Security`: 1 year, includeSubDomains, preload
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: Restricted camera, microphone, geolocation
- `Content-Security-Policy`: Strict CSP with allowed origins

### Content Security Policy
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co *.uploadthing.com utfs.io *.sentry.io
style-src 'self' 'unsafe-inline' fonts.googleapis.com
img-src 'self' data: blob: https:
font-src 'self' fonts.gstatic.com data:
connect-src 'self' *.supabase.co *.uploadthing.com utfs.io *.sentry.io *.upstash.io wss://*.supabase.co
frame-src 'self' *.supabase.co
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
```

## Data Sanitization
- DOMPurify (isomorphic) for all HTML content
- Prisma middleware auto-sanitizes 8 models before write
- Field-by-field sanitization per model type

## Error Handling
- Production-safe error messages (no stack traces)
- Structured error hierarchy (AppError -> ValidationError, AuthenticationError, etc.)
- Bengali user-facing messages
- Sentry integration for error tracking

## Database Security
- Parameterized queries via Prisma ORM (no SQL injection)
- Connection pooling via PrismaPg adapter
- Transaction retry logic for deadlock handling
- Singleton PrismaClient prevents connection leaks
