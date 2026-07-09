<!-- refreshed: 2026-06-20 -->
# Architecture

**Analysis Date:** 2026-06-20

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  Next.js App Router (catch-all [...slug]/page.tsx)                  │
│  Client Components: Home, ClassHub, SubjectHub, ChapterHub, etc.    │
│  State: Zustand stores (auth, router, exam, filters)                │
│  Data Fetching: @tanstack/react-query + custom hooks                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ http / api
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API / MIDDLEWARE LAYER                          │
│  src/middleware.ts → Supabase auth, CSRF, security headers, routing  │
│  src/app/api/ → 133 route handlers                                  │
│  Rate limiting: @upstash/ratelimit + Redis                          │
│  CSRF: JWT-based via jose                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE / LIBRARY LAYER                         │
│  lib/api-utils.ts → Response helpers, validation, rate-limit wrapper │
│  lib/errors.ts → Centralized error handling + logging                │
│  lib/auth.ts → Supabase auth wrapper + RBAC                          │
│  lib/access-control.ts → Purchase/subscription verification          │
│  lib/audit.ts → Admin action audit logging                           │
│  lib/validations.ts → Zod schemas                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
│  Prisma ORM → PostgreSQL (35+ models)                               │
│  Supabase Auth → Authentication + Session management                 │
│  Upstash Redis → Rate limiting state                                 │
│  UploadThing → File uploads                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | SEO metadata, theme, auth, query providers | `src/app/layout.tsx` |
| Admin Layout | Admin-only metadata, role guard | `src/app/admin/layout.tsx` |
| Middleware | Auth guard, CSRF, security headers, public route routing | `src/middleware.ts` |
| Catch-All Router | Client-side routing via Zustand store | `src/app/[...slug]/page.tsx` |
| Error System | Structured error classes, formatting, logging | `src/lib/errors.ts` |
| Auth System | Supabase auth wrapper, RBAC with permissions | `src/lib/auth.ts` |
| Access Control | Multi-strategy content access resolution | `src/lib/access-control.ts` |
| Audit Log | Admin action persistence | `src/lib/audit.ts` |
| Rate Limiter | Upstash Redis sliding window | `src/lib/rate-limit.ts` |
| API Utils | Response formatting, validation, auth/CSRF helpers | `src/lib/api-utils.ts` |

## Layers

**Client Layer:**
- Purpose: UI rendering and client-side state
- Location: `src/app/`, `src/components/`
- Contains: Page components, feature components, shared UI (shadcn/ui)
- Depends on: Hooks, stores, API client

**API/Middleware Layer:**
- Purpose: Request routing, authentication, authorization
- Location: `src/middleware.ts`, `src/app/api/`
- Contains: 133 API route handlers, middleware
- Depends on: Lib layer services

**Service/Library Layer:**
- Purpose: Business logic, error handling, validation, external integrations
- Location: `src/lib/`, `src/services/`
- Contains: Error classes, auth helpers, rate limiter, CSRF, validation schemas, access control
- Depends on: Prisma client, Supabase client, Redis client

**Data Layer:**
- Purpose: Persistence and external services
- Contains: PostgreSQL (Prisma ORM), Supabase Auth, Upstash Redis, UploadThing

## Data Flow

### Primary Request Path

1. Request hits middleware (`src/middleware.ts`) — auth check, security headers, CSRF validation
2. Route handler in `src/app/api/` — rate limit, validate body, execute business logic
3. Prisma queries to PostgreSQL — access control checks via `src/lib/access-control.ts`
4. Structured response via `apiResponse()` or error via `handleApiError()` (`src/lib/api-utils.ts`, `src/lib/errors.ts`)

### Payment Flow

1. Client submits payment form → `POST /api/payment` (`src/app/api/payment/route.ts`)
2. Server validates: auth → rate limit → CSRF → Zod schema → idempotency check → duplicate check → bundle/subscription cross-check
3. Creates pending Payment record in DB
4. Admin reviews → `PATCH /api/admin/payments` (`src/app/api/admin/payments/route.ts`)
5. On approval: creates subscription/purchase records, sends notification
6. Audit log written

### Content Access Check Flow

1. Client requests content → `GET /api/payment/check?contentType=X&contentId=Y`
2. Server resolves class level → checks subscription → checks direct payment → checks bundle purchase → checks exam package purchase
3. Returns `{ purchased: boolean, reason: string, pendingPayment: boolean }`

## Key Abstractions

**Error Classes:**
- Purpose: Typed errors with HTTP status codes, error codes, and operational vs programmer error distinction
- Files: `src/lib/errors.ts`
- Pattern: Class hierarchy — `AppError` base → `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `PaymentError`, `DatabaseError`

**Rate Limiter:**
- Purpose: Sliding window rate limiting with DB-configurable limits
- Files: `src/lib/rate-limit.ts`
- Pattern: `LazyRateLimiter` wrapper — lazy loads limits from DB on first request, caches for session

**Content Access Resolver:**
- Purpose: Multi-strategy access check with cross-type matching (mcq ↔ board-mcq)
- Files: `src/lib/access-control.ts`
- Pattern: Checkchain — subscription → direct payment → bundle purchase → all-items-purchased → exam package purchase

## Entry Points

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request matching `/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|public).*)`
- Responsibilities: Auth session, CSRF validation, security headers, public route passthrough, admin route protection

**Root Layout:**
- Location: `src/app/layout.tsx`
- Responsibilities: Global providers (theme, query, auth), SEO metadata, service worker registration, MathJax loading, PWA meta tags

**Catch-All Router:**
- Location: `src/app/[...slug]/page.tsx`
- Responsibilities: Maps URL paths to dynamically loaded page components via Zustand routing store

## Architectural Constraints

- **Threading:** Next.js single-threaded event loop; all async I/O via Prisma/Supabase clients
- **Global state:** `cachedLimits` module-level variable in `src/lib/rate-limit.ts` (lines 16-36) — mutable singleton; `permissionCache` in `src/lib/auth.ts` (lines 77-79) — mutable singleton with 60s TTL
- **Circular imports:** Not detected — architecture is cleanly layered
- **DB relation mode:** `relationMode = "prisma"` — all relations enforced at application level

## Anti-Patterns

### Admin Routes CSRF-Exempt

**What happens:** `src/middleware.ts` lines 145-150 exempts `/api/admin/` from CSRF checks. Admin mutation endpoints can be called without a valid CSRF token.
**Why it's wrong:** Admin actions (payment approval, user management) are the most security-sensitive operations. Removing CSRF for these routes increases risk of CSRF attacks via XSS.
**Do this instead:** Remove the admin route exemption from the CSRF skip list. See `src/middleware.ts`.

### Rate Limiting Applied Inconsistently

**What happens:** Rate limiting is opt-in per route handler, not applied globally. Only ~30% of API routes apply rate limiting.
**Why it's wrong:** Unprotected routes can be abused. Auth routes are already protected, but content-serving routes are not.
**Do this instead:** Apply rate limiting at middleware level for all `/api/` routes, with per-route exemptions for higher limits.

## Cross-Cutting Concerns

**Logging:** Structured JSON to console via `logError()` — no external aggregator
**Validation:** Zod schemas in `src/lib/validations.ts` — used in all payment/mutation routes
**Authentication:** Supabase Auth + custom RBAC with permissions cache
**Content security:** `sanitizeHtml()` wraps all `dangerouslySetInnerHTML` (except one file)
**PWA:** Service worker with cache-first strategy, manifest.json, offline support declared but unimplemented

---

*Architecture analysis: 2026-06-20*
