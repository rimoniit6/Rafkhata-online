# API Audit Report — শিক্ষা বাংলা

## 1. Overview

| Metric | Count |
|--------|-------|
| Total API Routes | 129 files |
| Public Routes | ~70 (including auth callback, content listing, search) |
| Auth-Required Routes | ~15 (user profile, bookmarks, progress, notes) |
| Admin Routes | ~60 (content CRUD, user mgmt, payments) |
| Database Models | 35+ Prisma models |

## 2. Findings

### ✅ Production Ready

| Criteria | Verdict | Details |
|----------|---------|---------|
| Hardcoded data | ✅ None | All configs from DB (`SiteSetting`). Content types from `ContentType` model. Labels from DB with fallbacks. |
| Authorization | ✅ Solid | 3-tier RBAC (STUDENT/ADMIN/SUPER_ADMIN). Supabase session + DB-verified role. Route-level guards. |
| Pagination | ✅ Consistent | Every list endpoint supports `page`/`limit` with `{ page, limit, total, totalPages }` in response. |
| Error handling | ✅ Centralized | `AppError` class hierarchy → `handleApiError()` → safe JSON. Prisma/Zod/SyntaxError catch. Production errors hide details. |
| Validation | ✅ Zod-integrated | `validateBody()` + Zod schemas for mutations. Prisma auto-sanitizes HTML fields (XSS prevention). |
| CSRF | ✅ Implemented | JWT-based tokens, httpOnly cookies, header + body fallback. Excluded for admin routes and auth. |
| XSS prevention | ✅ Multi-layer | Prisma middleware auto-sanitize on write. DOMPurify + regex on read. CSP headers. |
| Security headers | ✅ All routes | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy via proxy.ts. |
| Audit logging | ✅ Present | All admin payment actions, user updates/deletes logged to `AuditLog` table. IP + user-agent captured. |
| Idempotency | ✅ Payment | `idempotencyKey` unique constraint prevents duplicate payment creation. |

### ⚠️ Minor Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Inconsistent response format | Medium | ~80% use `{ success, data, pagination }`. ~20% return flat objects like `{ classes: [...] }` or `{ questions: [...] }`. |
| Inconsistent error format | Medium | Most use `handleApiError()` which returns `{ success: false, error, code }`. Some routes use raw `NextResponse.json()` returning `{ error }` without `success` or `code` fields. |
| Rate limiting not universal | Medium | Applied to auth/me, payment, payment/[id], but NOT to classes, mcq, cq, lectures, search, banners, faqs, etc. |
| CSRF exempt on admin routes | Low | Admin routes are CSRF-exempt by design (admin SPA protection via session + role). Acceptable trade-off. |
| No API versioning | Low | All routes under `/api/`. A future `/api/v2/` would help for breaking changes. |
| No OpenAPI/Swagger | Low | Documentation lives in markdown. |
| CQ route error format mismatch | Low | GET /api/cq returns `{ error: "..." }` (no code, no success field) instead of using `handleApiError()`. |
| Bookmark/notes error format | Low | Some routes use raw `console.error` + `NextResponse.json` instead of `handleApiError()`. |

### 🔴 Security Strengths

1. **UserId from session, never from body** — Payment creation uses `auth.user.id` from verified session
2. **Self-approval blocked** — Admin cannot approve own payment
3. **SUPER_ADMIN protected** — Cannot be modified/deleted by regular admin
4. **SUPER_ADMIN role can't be created via API** — Only via CLI script
5. **HTML auto-sanitized** at Prisma middleware layer before storage
6. **Passwords hashed** with scrypt + random salt + timingSafeEqual comparison

## 3. Recommendations for Flutter Development

1. **Use Supabase Flutter SDK** for auth (cookie management is easier via SDK)
2. **Standardize on `{ success, data, pagination }`** format — handle both formats in the client
3. **Cache responses locally** using the `Cache-Control` and `X-Cache-TTL` headers
4. **Handle rate limits** (429) with retry-after logic using `X-RateLimit-Reset` header
5. **Always send CSRF token** in `x-csrf-token` header for state-changing requests
6. **Use `idempotencyKey`** for payment creation to prevent duplicate charges

---

*Full API documentation: see `docs/API-DOCUMENTATION.md`*
