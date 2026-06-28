# Security Audit Report: শিক্ষা বাংলা (Sikkha Bangla)

**Audit Date:** 2026-06-20
**Auditor:** Security Engineer (White-Box)
**Scope:** Full Next.js application including middleware, API routes, database access, authentication, authorization, input validation, and frontend rendering
**Depth:** Deep (cross-file analysis with import graph tracing)

---

## Executive Summary

This audit found **2 Critical**, **6 High**, **7 Medium**, and **3 Low** severity issues. The most concerning findings are:

1. **CSRF protection is completely bypassed for all `/api/admin/` routes**, meaning any authenticated admin can be tricked into performing destructive actions via CSRF.
2. **Production database credentials and service-role keys are present in the `.env` file** — while `.gitignore` excludes it, any developer with filesystem access has their hands on keys granting full Supabase admin privileges.
3. **`Prisma.raw()` is used for column-name interpolation** in board-question analytics, creating a latent SQL injection vector.
4. **The server-side (SSR) HTML sanitizer is regex-based** and can be bypassed by crafted payloads.
5. **Several admin create/update endpoints accept arbitrary JSON without Zod validation**, allowing storage of unsanitized HTML/scripts in content fields.

The application's authentication layer (Supabase Auth + custom role-based access control) is well-structured, and the middleware correctly enforces authentication for protected API routes. However, authorization within individual handlers has gaps, particularly in admin endpoints.

---

## Finding Classification

| Severity | Count | Criteria |
|----------|-------|----------|
| **Critical** | 2 | Remote code execution, data exfiltration, privilege escalation |
| **High** | 6 | Significant security control bypass, sensitive data exposure |
| **Medium** | 7 | Partial control bypass, potential future exploit, hardening failures |
| **Low** | 3 | Informational, best-practice violations, limited-impact issues |
| **Total** | 18 | |

---

## Critical Findings

### CR-01: CSRF Protection Bypass for All Admin API Routes

**File:** `src/middleware.ts`, Lines 146-151  
**Severity:** CRITICAL

```typescript
const isCsrfExempt =
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/admin/') ||  // <-- ALL ADMIN ROUTES EXEMPT
  pathname.startsWith('/api/uploadthing') ||
  pathname.startsWith('/api/csrf-token') ||
  pathname.startsWith('/api/user/feedback')
```

**Why it's vulnerable:**
The CSRF middleware explicitly exempts ALL `/api/admin/` routes. This means any mutating action (POST/PUT/PATCH/DELETE) on any admin endpoint can be performed via CSRF. An attacker who tricks an authenticated admin into visiting a malicious page can:
- Approve/reject payments (`PATCH /api/admin/payments`)
- Delete users (`DELETE /api/admin/users`)
- Modify/create content (`POST /api/admin/mcq`)
- Change user roles (`PATCH /api/admin/users`)
- Export the entire database (`GET /api/admin/database/export` — though GET is exempt from CSRF by design, the damage is in mutating endpoints)
- Broadcast notifications to all users (`POST /api/admin/notifications`)

The CSRF token mechanism itself is properly implemented (JWT-based, httpOnly cookie, header validation). The bypass is purely in the route whitelist logic.

**How to reproduce:**
1. Login as an admin user (get a valid session cookie)
2. Create a malicious HTML page that sends `POST /api/admin/notifications` with `{ "broadcast": true, "title": "XSS", "message": "<script>..." }` 
3. The request succeeds because no CSRF token is required for `/api/admin/` routes
4. All students receive the malicious notification

**Fix:**
Remove `/api/admin/` from the CSRF-exempt list. Admin routes need CSRF protection just as much as any other mutation endpoint:

```typescript
const isCsrfExempt =
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/uploadthing') ||
  pathname.startsWith('/api/csrf-token')
```

Then ensure admin frontend code sends CSRF headers with all mutating admin requests. The `withCsrf()` helper should be invoked in admin route handlers that don't already use it (most admin handlers use `withAdmin()` which does NOT check CSRF).

### CR-02: Production Database Credentials and Service Keys in Environment File

**File:** `.env` (not git-tracked but present on filesystem)  
**Severity:** CRITICAL

```
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>
UPLOADTHING_SECRET=<REDACTED>
UPLOADTHING_APP_ID=<REDACTED>
UPLOADTHING_TOKEN=<REDACTED>
UPSTASH_REDIS_REST_TOKEN=<REDACTED>
```

**Why it's vulnerable:**
While `.env` is in `.gitignore` and not tracked in git, all production secrets are stored in plaintext on the filesystem. Any developer, CI/CD pipeline, or attacker with filesystem access to the server can:
- **SUPABASE_SERVICE_ROLE_KEY**: Full admin access to Supabase Auth (create/delete users, modify metadata, bypass email confirmation), full access to Supabase Storage, and any other Supabase service. This key **cannot be revoked** without rotating the entire project.
- **DATABASE_URL**: Full read/write access to the production PostgreSQL database.
- **UPLOADTHING_SECRET**: Full access to file upload infrastructure.
- **UPSTASH_REDIS_REST_TOKEN**: Full access to Redis (rate limit counters, cached data).

**Fix:**
1. Use a secrets manager (e.g., Vercel Environment Variables, AWS Secrets Manager, HashiCorp Vault)
2. Never check `.env` files with production secrets into any repository
3. Rotate all exposed keys immediately (especially SUPABASE_SERVICE_ROLE_KEY)
4. Restrict filesystem permissions on `.env` to only the process user

---

## High Severity Findings

### HI-01: `Prisma.raw()` Column Interpolation (Latent SQL Injection)

**File:** `src/app/api/board-questions/route.ts`, Lines 59-61  
**Severity:** HIGH

```typescript
function analyticsWhere(
  params: { ... },
  searchColumn?: string,
  searchValue?: string,
): Prisma.Sql {
  // ...
  if (searchColumn && searchValue) {
    parts.push(Prisma.sql`${Prisma.raw(`"${searchColumn}"`)} LIKE ${'%' + searchValue + '%'}`)
  }
  // ...
}
```

Called at:
- Line 221: `analyticsWhere(analyticsParams, 'question', search ?? undefined)`
- Line 239: `analyticsWhere(analyticsParams, 'uddeepok', search ?? undefined)`

**Why it's vulnerable:**
`Prisma.raw()` bypasses Prisma's query parameterization. Currently, `searchColumn` is hardcoded to `'question'` or `'uddeepok'`, so the injection is latent. However, `Prisma.raw()` with string concatenation is a ticking bomb — a future refactor that passes user-controlled input as `searchColumn` would create a direct SQL injection vulnerability.

Additionally, `'%' + searchValue + '%'` — while `searchValue` comes from the `search` query parameter and is passed through `Prisma.sql` template, the concatenation pattern `LIKE '%' || $1 || '%'` in the chapter route (see below) is susceptible to wildcard injection.

**Similar issue in:** `src/app/api/chapters/[id]/route.ts`, Line 61:
```sql
"chapterIds" LIKE '%' || $1 || '%'
```
This uses `$queryRawUnsafe` with parameterized `$1`, but `LIKE` with `%` wildcards allows an attacker to match unintended rows if they control the parameter value.

**Fix:**
1. Replace `Prisma.raw()` with a whitelist approach for column names
2. For the LIKE clause, escape `%` and `_` characters in search values
3. Consider using Prisma's native `contains` filter instead of raw SQL

```typescript
const VALID_COLUMNS = ['question', 'uddeepok'] as const
if (searchColumn && !VALID_COLUMNS.includes(searchColumn as any)) {
  throw new Error('Invalid search column')
}
// Then use Prisma.sql template safely
```

### HI-02: Regex-Based Server-Side HTML Sanitizer is Bypassable

**File:** `src/lib/sanitize.ts`, Lines 106-140  
**Severity:** HIGH

```typescript
function serverSanitize(html: string): string {
  html = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // ...
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/\s*data-\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // ...
    .replace(/<a\s+[^>]*href\s*=\s*["']javascript:/gi, '<a ')
```

**Why it's vulnerable:**
Regex-based HTML sanitizers are notoriously bypassable. Known bypass techniques:
- **Nested constructions**: `<scr<script>ipt>alert(1)</scr<script>ipt>` — inner pass creates valid `<script>` tag
- **Unicode/encoding variations**: `\u006A\u0061\u0076\u0061\u0073\u0063\u0072\u0069\u0070\u0074` (javascript encoded)
- **Newlines in attributes**: `onclick=\n alert(1)` — the regex `"[^"]*"` doesn't match across newlines
- **HTML entity encoding**: `&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:` in href
- **Attribute without quotes**: `onclick=javascript:alert(1)` — this is caught by `[^\s>]*`, but variations with spaces may bypass
- **SVG with nested event handlers**: SVG `<animate>` elements can execute JS in some browsers

This sanitizer is used by `sanitizeForStorage()` (the server-side storage function) and as the SSR fallback for `sanitizeHtml()`. Any content stored through the admin panel (MCQ questions, CQ prompts, explanations, lecture content) runs through this sanitizer.

**Fix:**
1. Use DOMPurify on the server side (isomorphic-dompurify works in Node.js)
2. If DOMPurify cannot be used server-side, use a well-tested library like `sanitize-html` (npm package)
3. Never rely on regex for HTML sanitization
4. Apply input validation (Zod) to reject HTML in fields that shouldn't contain it

### HI-03: Admin API Routes Accept Arbitrary JSON Without Schema Validation

**File (multiple):**
- `src/app/api/admin/mcq/route.ts`, Lines 75-101 (POST handler)
- `src/app/api/admin/mcq-exam-packages/route.ts`, Lines 289-526 (POST handler)
- `src/app/api/admin/cq/route.ts` (likely similar pattern)
- `src/app/api/admin/notifications/route.ts`, Lines 56-94 (POST handler)
- `src/app/api/admin/exams/route.ts` (likely similar pattern)

**Severity:** HIGH

**Why it's vulnerable:**
Several admin POST/PUT handlers accept `await request.json()` and destructure arbitrary fields without Zod validation. For example, in `admin/mcq/route.ts`:

```typescript
const body = await request.json()
const { question, questionImage, optionA, ... } = body
// Manual null checks only:
if (!question || !optionA || !optionB || ...) {
  return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন', 400)
}
```

This means:
- No type validation on field values (e.g., `isPremium` could be any type)
- No length/max-size validation on string fields (e.g., `question` could be 10MB)
- No HTML sanitization is enforced at the input layer — content is stored as-is and only sanitized at render time
- Any compromised admin account can inject arbitrary HTML into the database

In contrast, the `admin/users` route properly uses Zod schemas. The inconsistency means admin content endpoints are less protected.

**Fix:**
Add Zod schemas for all admin content mutation endpoints:

```typescript
export const adminMcqSchema = z.object({
  question: z.string().min(1).max(10000),
  questionImage: z.string().url().optional().nullable(),
  optionA: z.string().min(1).max(5000),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  // ... rest of fields
  isPremium: z.boolean().default(false),
})

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth
  const body = await request.json()
  const validation = validateBody(adminMcqSchema, body)
  if ('error' in validation) return validation.error
  // ... use validated data
}
```

### HI-04: Open Redirect via `next` Parameter in Auth Callback

**File:** `src/app/api/auth/callback/route.ts`, Lines 9, 50-52  
**Severity:** HIGH

```typescript
const next = searchParams.get('next') ?? '/'
// ...
const redirectUrl = new URL(origin)
redirectUrl.pathname = next
return NextResponse.redirect(redirectUrl)
```

**Why it's vulnerable:**
The `next` URL parameter is used as the redirect target after authentication without sufficient validation. While `new URL(origin)` prevents full URL injection as the base, `redirectUrl.pathname = next` can be exploited in several ways:
- **Path traversal**: `next = "//evil.com"` — the URL constructor may interpret `//evil.com` as a protocol-relative redirect in some environments. The WHATWG URL spec sets pathname to `//evil.com` (preserving the double slash), and when the browser processes `https://origin.com//evil.com`, it may interpret `//evil.com` as a protocol-relative URL.
- **Open redirect chaining**: `next = "/@evil.com"` or similar patterns may redirect to external domains depending on the browser/user-agent.
- **Phishing**: An attacker can craft a link like `https://sikkhabangla.com/api/auth/callback?code=...&next=//attacker.com` to trick users after OAuth flow.

**Fix:**
Validate that the redirect path is a relative URL:

```typescript
const next = searchParams.get('next') ?? '/'

// Only allow relative URLs (must start with /)
if (!next.startsWith('/') || next.startsWith('//')) {
  return NextResponse.redirect(`${origin}/`)
}

// Optional: whitelist of allowed paths
const ALLOWED_REDIRECT_PREFIXES = ['/', '/subjects/', '/dashboard', '/exams']
if (!ALLOWED_REDIRECT_PREFIXES.some(prefix => next.startsWith(prefix))) {
  return NextResponse.redirect(`${origin}/`)
}
```

### HI-05: Weak Rate-Limiting Identifier Can Be Spoofed

**File:** `src/lib/rate-limit.ts`, Lines 98-121  
**Severity:** HIGH

```typescript
export function getClientIdentifier(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return `ip:${cfIp}`
  const vercelIp = request.headers.get('x-vercel-ip')
  if (vercelIp) return `ip:${vercelIp}`
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    if (ip && ip !== 'unknown') return `ip:${ip}`
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp && realIp !== 'unknown') return `ip:${realIp}`

  // Last resort: fingerprint
  const ua = request.headers.get('user-agent') || ''
  const uaHash = simpleHash(`${ua}:${pathPrefix}`)
  return `fp:${uaHash}`
}
```

**Why it's vulnerable:**
When no proxy headers are present (common in non-Cloudflare/Vercel deployments or during development), the fallback fingerprint is trivially spoofable:
- **User-Agent header is attacker-controlled**: An attacker can send `User-Agent: attacker1`, `User-Agent: attacker2`, etc., generating unique fingerprints for each request
- **Path-based prefix**: The `pathPrefix` is derived from the URL pathname, so requests to different paths get different limits
- **Simple hash is not cryptographic**: The `simpleHash` function (line 123-131) is a basic 32-bit hash with high collision probability

This means the auth rate limiter (10 requests per 15 minutes) can be bypassed by rotating the User-Agent header. An attacker could attempt thousands of login attempts without hitting the rate limit.

**Fix:**
1. Use a more robust fallback identifier combining available signals:
```typescript
const signals = [
  request.headers.get('cf-connecting-ip'),
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  request.headers.get('x-real-ip'),
  request.headers.get('x-vercel-ip'),
  // If all proxy headers are missing, use a hash of multiple headers
  request.headers.get('accept-language'),
  request.headers.get('sec-ch-ua'),
]
const validIp = signals.find(s => s && s !== 'unknown')
if (validIp) return `ip:${validIp}`

// Combine multiple headers to make fingerprint harder to spoof
const fp = `${request.headers.get('user-agent') || ''}:${request.headers.get('accept-language') || ''}:${request.headers.get('sec-ch-ua') || ''}`
return `fp:${sha256(fp).slice(0, 16)}`
```

2. On the login route specifically, add additional friction (CAPTCHA, progressive delay) before rate limiting kicks in.

### HI-06: Server-Side Rendering Runs `sanitizeHtml` on JavaScript Code

**File:** `src/app/layout.tsx`, Lines 145-180  
**Severity:** HIGH

```typescript
<script
  dangerouslySetInnerHTML={{
    __html: sanitizeHtml(`
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
        })
      }
      window.MathJax = { ... };
      window.addEventListener('load', () => {
        setTimeout(() => {
          var s = document.createElement('script');
          s.id = 'MathJax-script';
          s.async = true;
          s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
          document.head.appendChild(s);
        }, 2000);
      });
    `),
  }}
/>
```

**Why it's vulnerable:**
`sanitizeHtml()` is designed for HTML content, not JavaScript. During SSR, `sanitizeHtml` falls back to the regex-based `serverSanitize()` which:
- Strips `<script>` tags → This inline JS is wrapped in `<script>` by React, but the regex's `*?` (lazy quantifier) with `[^<]*` patterns may behave differently than expected with template literals
- Strips `javascript:` → Not relevant here, but shows the sanitizer is actively transforming the content
- Strips `on\w+` event handlers → If the JS contains words starting with "on" in certain contexts, they could be mangled
- Removes form/input/button tags → Not in this code, but the sanitizer operates on the entire JS string

**Real risk:** If the JS code ever contains a string that looks like `<script>` or `onclick=...` (e.g., in user-controlled content or template literals), the sanitizer would corrupt the JavaScript, potentially breaking the application or introducing runtime errors.

**Fix:**
Do not pass static JavaScript through `sanitizeHtml()`. Use a separate strategy:
1. For static inline JS, use `__html` directly without sanitization (the content is hardcoded, not user-controlled)
2. For user-controlled values within JS, escape them properly with `JSON.stringify` and encode for the JS context
3. Consider using `next/script` with `strategy="afterInteractive"` instead of inline `<script>` tags

```typescript
<script
  dangerouslySetInnerHTML={{
    __html: `/* static code - no user input */`,
  }}
/>
```

---

## Medium Severity Findings

### ME-01: JSON-LD Components Use `sanitizeHtml` on Structured Data (Semantically Incorrect)

**File:** `src/components/shared/JsonLd.tsx`, Lines 24, 40, 54, 67, 83, 105, 130  
**Severity:** MEDIUM

```typescript
return <script type="application/ld+json" dangerouslySetInnerHTML={{ 
  __html: sanitizeHtml(JSON.stringify(json)) 
}} />
```

**Why it's vulnerable:**
`sanitizeHtml()` is designed for HTML, not JSON within a `<script type="application/ld+json">` tag. While DOMPurify's behavior on JSON strings is unpredictable — it might strip characters that resemble HTML tags. If any JSON value contains user-controlled data (e.g., a question title or description that contains `</script>`), the script tag would break and could lead to XSS.

Currently, all JSON-LD values are hardcoded strings, so this is not directly exploitable. However, it's a ticking bomb: anyone adding user-controlled data to these schema components would create an XSS vulnerability because the JSON data is not properly escaped for the script context.

**Comparison:** The `json-ld.tsx` file (a newer/simpler version) uses a proper escaping function:
```typescript
function safeJsonLd(json: unknown): string {
  return JSON.stringify(json)
    .replace(/<\//g, '<\\/')
    .replace(/-->/g, '--\\>')
}
```

**Fix:**
Replace the `sanitizeHtml()` calls with proper JSON escaping for the script context:
```typescript
function safeJsonLd(json: unknown): string {
  return JSON.stringify(json)
    .replace(/<\//g, '<\\/')
    .replace(/-->/g, '--\\>')
}
```

Also, note that JSON-LD should ideally be server-rendered (not `'use client'`) for SEO purposes. The `JsonLd.tsx` component is marked `'use client'` which means it's injected client-side and won't be indexed by search engines.

### ME-02: Broadcast Notification Can Send Arbitrary Content to All Students

**File:** `src/app/api/admin/notifications/route.ts`, Lines 51-94  
**Severity:** MEDIUM

```typescript
if (broadcast && !userId) {
  const users = await db.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true },
  })
  const notifications = await db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title,
      message,
      type: type || 'info',
      link: link || null,
    })),
  })
}
```

**Why it's vulnerable:**
Combined with CR-01 (CSRF bypass for admin routes), this allows:
1. An attacker to broadcast arbitrary HTML/JS payloads to all students via social engineering
2. The `title` and `message` fields are not validated for malicious content
3. The `link` field could contain `javascript:` URLs or phishing links
4. No rate limiting on broadcast (one request can create thousands of database rows)

While this is an admin-only endpoint and requires authentication, the lack of CSRF protection, combined with no output validation, creates a realistic attack chain: CSRF → Broadcast → XSS in student notification panel.

**Fix:**
1. Add CSRF protection to this endpoint (remove admin route from CSRF-exempt list)
2. Validate notification content (max length, sanitize HTML)
3. Add rate limiting for broadcast notifications (max 1 per minute)
4. Add confirmation step (admin must confirm "Send to all N students")

### ME-03: Missing Rate Limiting on Admin GET Endpoints

**File:** `src/lib/api-utils.ts`, Lines 119-131  
**Severity:** MEDIUM

```typescript
export async function withAdmin(request: Request): Promise<AuthResult | NextResponse> {
  try {
    const auth = await requireAdmin(request)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const rateCheck = await applyRateLimit(apiLimiter, request)
      if ('error' in rateCheck) return rateCheck.error
    }
    return auth
  }
```

**Why it's vulnerable:**
Admin GET endpoints are not rate-limited through the `withAdmin` wrapper. Individual handlers may add rate limiting (e.g., `admin/database/export` does), but most do not:
- `GET /api/admin/users` — list all users with PII
- `GET /api/admin/payments` — list all payments
- `GET /api/admin/payments/stats` — financial data
- `GET /api/admin/stats` — aggregate statistics
- `GET /api/admin/exam-results` — all exam results

An attacker with a valid admin session (or session token) can scrape the entire database through unauthenticated GET requests at high speed.

**Fix:**
Move rate limiting outside the `if (request.method !== 'GET')` check, or add a separate rate limiter for admin GET endpoints:
```typescript
export async function withAdmin(request: Request): Promise<AuthResult | NextResponse> {
  try {
    const auth = await requireAdmin(request)
    // Apply rate limiting to ALL admin requests
    const rateCheck = await applyRateLimit(adminLimiter, request)
    if ('error' in rateCheck) return rateCheck.error
    return auth
  }
```

### ME-04: User Feedback Endpoint is CSRF-Exempt

**File:** `src/middleware.ts`, Line 151  
**Severity:** MEDIUM

```typescript
const isCsrfExempt =
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/admin/') ||
  pathname.startsWith('/api/uploadthing') ||
  pathname.startsWith('/api/csrf-token') ||
  pathname.startsWith('/api/user/feedback')  // <-- CSRF EXEMPT
```

**Why it's vulnerable:**
The user feedback submission endpoint is CSRF-exempt. While feedback is low-risk, it still allows:
- Spamming fake feedback on behalf of authenticated users
- Injecting malicious content into the feedback system that admins will view

**Fix:**
Remove `/api/user/feedback` from CSRF-exempt list, or add a CAPTCHA.

### ME-05: Database Export Exposes Full User PII Through API

**File:** `src/app/api/admin/database/export/route.ts`, Line 49  
**Severity:** MEDIUM

```typescript
const [users, ...] = await Promise.all([
  db.user.findMany({ select: { 
    id: true, email: true, name: true, role: true, avatar: true, 
    phone: true, institute: true, classLevel: true, board: true, 
    isVerified: true, isPremium: true, premiumExpiry: true, 
    createdAt: true, updatedAt: true 
  }}),
  // ... all other tables
])
```

**Why it's vulnerable:**
A single API endpoint exports the entire database, including:
- User PII (email, phone, name)
- All payment records
- All exam results
- All content

While gated behind `requireSuperAdmin`, the endpoint only has a low-rate general rate limiter. If a super admin's session is compromised, this endpoint exfiltrates the entire database. Additionally, there's no audit trail for the export action (the audit log just says "database_export" with counts).

**Fix:**
1. Require re-authentication (password re-entry) before allowing export
2. Add a stricter, separate rate limiter for exports (max 1 per hour)
3. Log who accessed the export, including IP and user agent
4. Consider making this a background job rather than a synchronous API response

### ME-06: `$queryRawUnsafe` Used for Counting Queries (Parameterized but Unnecessary Risk)

**File:** 
- `src/app/api/subjects/[id]/route.ts`, Lines 87-119 and 139-166
- `src/app/api/chapters/[id]/route.ts`, Lines 40-71

**Severity:** MEDIUM

**Why it's vulnerable:**
While the `$queryRawUnsafe` calls use parameterized queries (`$1`), the use of raw SQL increases the risk surface:
1. **Escaped table/column names**: PostgreSQL `"TableName"` quotation makes schema changes risky
2. **LIKE injection**: `"chapterIds" LIKE '%' || $1 || '%'` — the `%` wildcards allow pattern-matching injection. If `$1` contains `%` or `_`, it affects the results (not SQL injection, but logic injection)
3. Maintenance burden: any schema change requires updating raw SQL strings

**Fix:**
Replace raw counting queries with Prisma's aggregate/groupBy where possible, or use `Prisma.sql` template tags instead of `$queryRawUnsafe`:

```typescript
const result = await db.$queryRaw<...>(Prisma.sql`
  SELECT COUNT(*)::int as "count"
  FROM "MCQ" 
  WHERE "chapterId" = ${chapterId} AND "isActive" = true
`)
```

### ME-07: Password Hash Uses scrypt with Fixed Parameters

**File:** `src/lib/password.ts`, Lines 1-15  
**Severity:** MEDIUM

```typescript
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return salt + ':' + hash
}
```

**Why it's vulnerable:**
The `scryptSync` call uses default cost parameters (N=16384, r=8, p=1), which is the Node.js default. While this is reasonably secure, there are concerns:
1. **No explicit cost parameter**: Future Node.js version changes to the default could weaken security
2. **Synchronous**: `scryptSync` blocks the event loop. On a login-heavy server, this causes performance degradation
3. **No memory-hardness tuning**: The parameters should be explicitly set to known-secure values

**Fix:**
Use explicit scrypt parameters and async version:
```typescript
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const SCRYPTOPTIONS = { N: 16384, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64, SCRYPTOPTIONS) as Buffer
  return salt + ':' + hash.toString('hex')
}
```

---

## Low Severity Findings

### LO-01: Content Security Policy Falls Back to `'unsafe-inline'`

**File:** `src/middleware.ts`, Lines 83-108  
**Severity:** LOW

```typescript
function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const cspNonce = nonce || generateNonce()
  const scriptSrc = nonce 
    ? `'self' 'nonce-${cspNonce}' ...`
    : `'self' 'unsafe-inline' 'unsafe-eval' ...`  // <-- FALLBACK
```

**Why it's a concern:**
If `addSecurityHeaders` is ever called without a `nonce` parameter, the CSP degrades to `'unsafe-inline' 'unsafe-eval'`, rendering CSP ineffective against XSS. Currently, all call sites pass a nonce, but the function signature allows omitting it.

**Fix:**
Make `nonce` required (remove `?`), or throw if not provided:
```typescript
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const scriptSrc = `'self' 'nonce-${nonce}' https://cdn.jsdelivr.net ${getSupabaseUrl()}`
  // ...
}
```

### LO-02: `rateLimitHeaders` Returns `reset` as Seconds Instead of Timestamp

**File:** `src/lib/rate-limit.ts`, Lines 133-139  
**Severity:** LOW

```typescript
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),  // <-- Matches Upstash's ms value
  }
}
```

**Why it's a concern:**
Upstash's `ratelimit.limit()` returns `reset` in milliseconds since epoch. Dividing by 1000 converts to seconds, but this should be documented or clarified. If Upstash changes their API, the header would be incorrect.

Also, the `X-RateLimit-Reset` header should contain an absolute Unix timestamp (seconds since epoch), which it appears to do, but verification is needed that Upstash returns milliseconds.

### LO-03: `$queryRaw` with `BigInt` Returns Not Properly Cast in All Code

**File:** `src/app/api/classes/route.ts`, Lines 49, 64  
**Severity:** LOW

```typescript
db.$queryRaw<Array<{ subject_id: string; count: bigint }>>(Prisma.sql`...`)
```

The BigInt values from `$queryRaw` are used in calculations throughout the codebase. While the code appears to handle them correctly in most places, there's no consistent casting. Any comparison or arithmetic that doesn't use `Number()` will fail or produce unexpected results with BigInt types.

---

## Issues Not Found (Verified Secure)

The following areas were audited and found to be properly implemented:

### Authentication Flow
- ✅ Supabase session cookies use `httpOnly`, `secure` (production), `sameSite: strict`
- ✅ Auth middleware correctly validates sessions on every request
- ✅ Role metadata synced from DB to Supabase on every login
- ✅ Rate limiting on login endpoint (10/15min)

### Upload Handling (UploadThing)
- ✅ Authentication required for ALL upload types (image, PDF, video, audio, screenshot)
- ✅ File size limits enforced (4MB images, 16MB PDFs, 256MB video)
- ✅ File count limits enforced

### Password Storage
- ✅ scrypt with random 16-byte salt
- ✅ `timingSafeEqual` for comparison (constant-time)

### Error Handling
- ✅ No stack traces exposed in production (`handleApiError` strips details)
- ✅ Generic error messages in production
- ✅ Structured error logging

### Content Access Control
- ✅ Proper subscription/payment/bundle access checks
- ✅ Premium content redaction for unauthorized users
- ✅ Cross-type access mapping (mcq ↔ board-mcq)

### Prisma Query Parameterization
- ✅ All `$queryRawUnsafe` calls use parameterized queries (`$1`, `$2`, etc.)
- ✅ `$queryRaw` template usage with `Prisma.sql` is safe

### IDOR Protection
- ✅ User profile, payments, dashboard, subscriptions all use `auth.user.id` (not user-supplied ID)
- ✅ Exam results check `auth.user.id !== userId && !auth.isAdmin` properly
- ✅ Bookmarks scoped to authenticated user

---

## Appendix: Hardcoded Secrets Inventory

The following secrets were found in plaintext (all in `.env` which is gitignored):

| Secret | Value (first 20 chars) | Risk if leaked |
|--------|------------------------|----------------|
| `DATABASE_URL` (password) | `<REDACTED>` | Full DB access |
| `SUPABASE_SERVICE_ROLE_KEY` | `<REDACTED>` | Full Supabase admin |
| `UPLOADTHING_SECRET` | `<REDACTED>` | File upload access |
| `UPLOADTHING_TOKEN` | `<REDACTED>` | UploadThing API access |
| `UPSTASH_REDIS_REST_TOKEN` | `<REDACTED>` | Redis data access |
| `CSRF_SECRET` | `<REDACTED>` | CSRF token forgery |

The Supabase URL (`https://<PROJECT>.supabase.co`) is also hardcoded in source code as a fallback in `middleware.ts` Line 7.

---

## Recommendations Priority Matrix

| Issue | Severity | Effort to Fix | Priority |
|-------|----------|---------------|----------|
| CR-01: CSRF bypass for admin routes | Critical | Low | **P0 - Fix Immediately** |
| CR-02: Exposed credentials | Critical | Medium | **P0 - Rotate keys now** |
| HI-01: `Prisma.raw()` SQL injection | High | Low | **P1 - Fix this sprint** |
| HI-02: Regex sanitizer bypass | High | Medium | **P1 - Fix this sprint** |
| HI-03: Missing Zod validation on admin endpoints | High | Medium | **P1 - Fix this sprint** |
| HI-04: Open redirect in callback | High | Low | **P1 - Fix this sprint** |
| HI-05: Weak rate-limit fingerprint | High | Medium | **P2 - Fix next sprint** |
| HI-06: sanitizeHtml on JS code | High | Low | **P1 - Fix this sprint** |
| ME-01: JSON-LD incorrect escaping | Medium | Low | **P2 - Fix next sprint** |
| ME-02: Broadcast notification abuse | Medium | Medium | **P2 - Fix next sprint** |
| ME-03: Missing rate limit on admin GET | Medium | Low | **P2 - Fix next sprint** |
| ME-04: Feedback CSRF-exempt | Medium | Low | **P2 - Fix next sprint** |
| ME-05: Database export exposure | Medium | Medium | **P3 - Plan for next milestone** |
| ME-06: `$queryRawUnsafe` risk | Medium | Medium | **P3 - Plan for next milestone** |
| ME-07: Password hash parameters | Medium | Low | **P3 - Plan for next milestone** |
| LO-01: CSP unsafe-inline fallback | Low | Low | **P3 - Plan for next milestone** |

---

*This audit was conducted as a white-box review of the full source code. No dynamic testing or penetration testing was performed. Findings should be validated in a staging environment before applying fixes.*
