# Codebase Concerns

**Analysis Date:** Sat Jun 20 2026

## CRITICAL

### Missing global-error.tsx

- **Issue:** Next.js 13+ requires a `global-error.tsx` file to catch errors in the root layout (`src/app/layout.tsx`). The root layout wraps all pages, so if it crashes (e.g., providers fail), the current `src/app/error.tsx` error boundary won't catch it — it lives inside the layout. The app will show a white screen with no fallback.
- **Files:** `src/app/layout.tsx`, `src/app/error.tsx`
- **Impact:** If any provider (`QueryProvider`, `AuthProvider`, `ThemeProvider`) throws during SSR, the entire app renders a blank page. Users cannot recover.
- **Fix approach:** Create `src/app/global-error.tsx` following the same pattern as `error.tsx` but as a `'use client'` component that shows a minimal fallback. This is a Next.js requirement for production apps.
- **Priority:** Critical

### 22 API Route Handlers Without try-catch

- **Issue:** 22 out of 133 API route handler functions (17%) lack try-catch error handling. These routes can return unhandled 500 errors with stack traces exposed to clients (in dev) or crash silently.
- **Files:** Multiple under `src/app/api/` — affected routes include auth callback, content-types seed, recently-viewed, bookmarks, progress, navigation, and several admin routes.
- **Impact:** Unhandled promise rejections in API routes. In production, these can crash the Node.js process or leak internal error details depending on error type.
- **Fix approach:** Wrap each uncovered handler in try-catch and call `handleApiError(error, context)`. Alternatively, create a higher-order route wrapper using the existing `asyncHandler()` pattern from `src/lib/errors.ts` (lines 226-234).
- **Priority:** Critical

### No HTML Sanitization for dangerouslySetInnerHTML in json-ld.tsx

- **Issue:** `src/components/shared/json-ld.tsx` uses `dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}` without calling `sanitizeHtml()`. This differs from `src/components/shared/JsonLd.tsx` which correctly wraps it. If the JSON-LD data contains user-controlled content, this is an XSS vector.
- **Files:** `src/components/shared/json-ld.tsx` (lowercase d, lines 17, 39, 64)
- **Impact:** Stored XSS if admin-controlled settings or user data flows into JSON-LD content that isn't sanitized.
- **Fix approach:** Import and use `sanitizeHtml()` in all `dangerouslySetInnerHTML` usages, matching the pattern in `JsonLd.tsx` (capital D).
- **Priority:** Critical

## HIGH

### Missing Loading States on 90% of Pages

- **Issue:** Only 4 loading.tsx files exist: root (`src/app/loading.tsx`) and 3 inside `src/app/class/` segments. All other routes — admin (30+ pages), dashboard, exams, MCQ, CQ, notices, suggestions, payment, premium, board-questions, knowledge-questions, search, etc. — have no loading states.
- **Files:** All routes under `src/app/` except `src/app/class/[classSlug]/`, `src/app/loading.tsx`
- **Impact:** Users experience jarring layout shifts or blank screens during page transitions, especially on slow connections. The root loading.tsx only shows during initial app load, not route transitions.
- **Fix approach:** Add `loading.tsx` files to major route segments. At minimum: `src/app/admin/loading.tsx`, `src/app/exams/loading.tsx`, `src/app/mcq/loading.tsx`, `src/app/dashboard/loading.tsx`.
- **Priority:** High

### No aria-label or role Attributes on Any Page Component

- **Issue:** Grep for `aria-label` and `role=` in `src/app/` found zero matches. Custom components use no ARIA attributes. While Radix UI primitives provide some built-in accessibility, all page-level and custom components lack semantic labels.
- **Files:** All non-Radix components in `src/components/`, `src/app/`
- **Impact:** Screen readers and assistive technologies cannot navigate the application. This is a WCAG violation and may be non-compliant for government/education sector requirements in Bangladesh.
- **Fix approach:** Add `aria-label` to navigation elements, buttons without visible text, search inputs, and interactive controls. Use semantic HTML (`<nav>`, `<main>`, `<aside>`) throughout.
- **Priority:** High

### No External Error Monitoring Service

- **Issue:** The error logging in `src/lib/errors.ts` writes structured JSON to console only. There is no integration with Sentry, Datadog, Logtail, or any error monitoring/alerting service. Errors in production are invisible unless someone reads server logs.
- **Files:** `src/lib/errors.ts` (logError function)
- **Impact:** Production errors are silent. Team will not know about 500 errors, failed payments, or crashed API routes unless users report them manually. No error aggregation, no alerting, no trace IDs.
- **Fix approach:** Integrate Sentry with `@sentry/nextjs`. Configure `logError()` to also forward to Sentry. Set up alerts for 5xx error spikes and specific error codes (PAYMENT_ERROR, DATABASE_ERROR).
- **Priority:** High

### /offline Page Referenced in Service Worker But Does Not Exist

- **Issue:** `public/sw.js` references `'/offline'` in its cache assets list (line 3). This page does not exist — there's no `src/app/offline/` route. When the service worker tries to cache it, it fails silently.
- **Files:** `public/sw.js`, no `src/app/offline/`
- **Impact:** Service worker install step may partially fail. Users who go offline get no meaningful offline experience. The `/offline` pre-cache attempt returns a 404.
- **Fix approach:** Create `src/app/offline/page.tsx` with an offline-friendly message. Alternatively, remove `/offline` from the service worker's pre-cache array if offline support is not intended.
- **Priority:** High

### Admin API Routes Exempt from CSRF

- **Issue:** In `src/middleware.ts` (lines 145-150), `/api/admin/` routes are explicitly exempted from CSRF checks: `const isCsrfExempt = pathname.startsWith('/api/admin/')`. Admin mutation endpoints (PATCH, POST, DELETE) do not require CSRF tokens.
- **Files:** `src/middleware.ts` lines 145-150
- **Impact:** If an admin's session is compromised via XSS, an attacker can perform admin actions without CSRF protection. Admin mutations are the highest-value targets (payment approval, user management, content changes).
- **Fix approach:** Remove `/api/admin/` from CSRF exemption list. Admin routes should still have CSRF protection. The middleware already checks auth before CSRF, so authenticated admins will have valid CSRF cookies.
- **Priority:** High

### Rate Limiting Is Per-Route Opt-In, Not Universal

- **Issue:** Rate limiting (`applyRateLimit`) is applied individually in each route handler. A review shows that many routes skip it entirely — only auth, payment, admin payment, and search routes apply rate limiting. The remaining ~100 API routes have no rate limit protection.
- **Files:** Multiple route files under `src/app/api/`
- **Impact:** Unprotected routes are vulnerable to abuse and DoS attacks. A malicious actor can hammer any unprotected API endpoint without restriction.
- **Fix approach:** Apply rate limiting in middleware automatically for all `/api/` routes, with per-route overrides for higher limits. Alternatively, audit every route handler and add `applyRateLimit()` calls.
- **Priority:** High

### No Component Tests or API Integration Tests

- **Issue:** The codebase has 6 unit test files (all in `src/lib/__tests__/`) and 2 E2E test files (in `tests/`). There are zero component tests (React Testing Library) and zero API integration tests. Critical modules like `access-control.ts` (562 lines), `rate-limit.ts` (139 lines), `csrf.ts` (89 lines), `sanitize.ts` (314 lines), and `audit.ts` (109 lines) have no test coverage.
- **Files:** `vitest.config.ts`, `src/lib/__tests__/`, `tests/`
- **Impact:** No safety net for refactoring critical payment/auth/content-access logic. The payment flow (which handles real money) has limited test coverage.
- **Fix approach:** Add tests for `access-control.ts`, `csrf.ts`, `rate-limit.ts`. Add React Testing Library for key components. Add API route integration tests using Vitest.
- **Priority:** High

## MEDIUM

### No Production CI/CD Pipeline Configuration

- **Issue:** `package.json` does not have a `"ci"` or `"test:ci"` script. There is no CI config file (`.github/workflows/`, `.gitlab-ci.yml`). No build validation step exists.
- **Files:** `package.json`
- **Impact:** No automated gate to prevent broken builds or failing tests from reaching production.
- **Fix approach:** Add a `"test:ci"` script. Add GitHub Actions workflow with lint → test → build steps.
- **Priority:** Medium

### No Runtime Environment Variable Validation

- **Issue:** The `.env.example` documents all required env vars, but there is no runtime validation that they are set at startup. Missing env vars fail silently until the specific feature is used. For example, if `CSRF_SECRET` is missing, `src/lib/csrf.ts` throws a hard error only when the module loads.
- **Files:** `src/lib/csrf.ts` (line 7-9), no `src/lib/env.ts`
- **Impact:** Deployment errors are discovered at runtime rather than startup. Missing `UPSTASH_REDIS_REST_URL` causes rate limiting to fail silently, which is security-relevant.
- **Fix approach:** Create a validated env module (`src/lib/env.ts`) using Zod. Check at server startup. Fail fast with clear messages.
- **Priority:** Medium

### CSP Uses 'unsafe-inline' and 'unsafe-eval' in Fallback Mode

- **Issue:** In `src/middleware.ts` (line 86), when no nonce is available, the CSP falls back to `'unsafe-inline' 'unsafe-eval'`. This weakens XSS protection. The nonce path is only used for static assets.
- **Files:** `src/middleware.ts` lines 84-86
- **Impact:** Reduced XSS mitigation for dynamic page responses. Script injection could execute if an XSS vulnerability exists.
- **Fix approach:** Always generate and propagate nonces for all responses. Pass nonce through to layouts via headers or `<meta>` tag.
- **Priority:** Medium

### Some API Routes Use Raw console.error Instead of Error System

- **Issue:** Routes like `src/app/api/mcq/exam/route.ts` (line 129) use `console.error('Generate exam error:', error)` instead of `handleApiError(error)`. While they have basic catch blocks, they don't use the centralized error handling, so errors are not logged consistently and don't get structured formatting.
- **Files:** `src/app/api/mcq/exam/route.ts`, plus possibly others
- **Impact:** Inconsistent error responses. Some errors missing structured logging, code field, or proper status codes.
- **Fix approach:** Replace ad-hoc error handling with `handleApiError()` or the `asyncHandler()` wrapper.
- **Priority:** Medium

### No Sitemap for Admin Dynamically Generated Metadata

- **Issue:** While `src/app/sitemap.ts` covers public content routes, it does not dynamically generate per-content-item sitemap entries for MCQs, CQs, knowledge questions, board questions, exams, or lectures at the individual item level. Search engines may not index deep content.
- **Files:** `src/app/sitemap.ts`
- **Impact:** Deep content pages may not be indexed by search engines, reducing organic discovery of individual questions and lectures.
- **Fix approach:** Add paginated batch queries for individual content items (MCQs, CQs, lectures) with appropriate `changeFrequency` and low `priority`.
- **Priority:** Medium

### No Migration Strategy / Squashing

- **Issue:** 7 migration files exist with date-based naming. As the schema evolves, running all migrations sequentially may become slow. There is no documented squashing strategy.
- **Files:** `prisma/migrations/`
- **Impact:** CI/CD pipeline runs all migrations from scratch on new environments, which is slow. Teams may need to squash migrations for production deployments.
- **Fix approach:** Add migration squashing to development workflow. Document in README. Use `prisma migrate resolve` for production.
- **Priority:** Medium

### No Enforced Code Coverage Threshold

- **Issue:** `vitest.config.ts` has no coverage threshold configuration. Tests can pass even with 0% coverage of critical paths.
- **Files:** `vitest.config.ts`
- **Impact:** No quality gate for test coverage. Untested code can be merged.
- **Fix approach:** Add `coverage.thresholds` to vitest.config.ts (e.g., 70% for statements, branches, functions, lines).
- **Priority:** Medium

## LOW

### Service Worker Uses Cache-First Strategy for All Non-API Content

- **Issue:** `public/sw.js` line 25 uses `cacheFirst` for all non-API requests. This means users may see stale content even when newer versions exist. The cache is only invalidated on service worker update.
- **Impact:** Users may see outdated lecture content, notices, or MCQ questions until the SW updates.
- **Fix approach:** Use `staleWhileRevalidate` for content requests to serve cached content while fetching updates in the background.
- **Priority:** Low

### Database Index Gaps for High-Query Tables

- **Issue:** Several large tables lack compound indexes for common query patterns. For example, `Payment` queries by `(userId, contentType, contentId, status)` but only has `@@unique([userId, contentType, contentId, status])` and `@@index([userId, contentType, contentId])`. The `contentId` alone has no index but is frequently queried in access control checks.
- **Impact:** Performance degradation as data grows. Access control checks (`checkContentAccess`) do multiple table scans.
- **Fix approach:** Add indexes for query patterns: single `contentId`, `(userId, status)`, `(paymentId)` already exists on UserSubscription.
- **Priority:** Low

### eslint-config-next/core-web-vitals May Be Too Permissive

- **Issue:** The ESLint config (`eslint.config.mjs`) disables several important rules: `no-console: "off"`, `react/no-unescaped-entities: "off"`, `react/display-name: "off"`, `@next/next/no-img-element: "off"`. This allows console.log statements in production code.
- **Impact:** Console logs may leak sensitive data in production. Debugging statements may accumulate.
- **Fix approach:** Enable `no-console: "warn"` at minimum. Review other disabled rules.
- **Priority:** Low

### Unused Dependencies Audit Needed

- **Issue:** The `package.json` includes a `find-unused-deps.mjs` script (referenced in root directory listing), suggesting awareness that unused dependencies may exist. With 60+ runtime dependencies, some may be unused.
- **Files:** `package.json`, `find-unused-deps.mjs`
- **Impact:** Larger bundle size, increased attack surface, slower CI installs.
- **Fix approach:** Run `node find-unused-deps.mjs` periodically. Remove unused dependencies.
- **Priority:** Low

---

*Concerns audit: 2026-06-20*
