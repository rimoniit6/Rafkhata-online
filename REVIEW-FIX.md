---
phase: standalone
fixed_at: 2026-06-14T00:00:00.000Z
review_path: N/A (standalone fix task)
iteration: 1
findings_in_scope: 32
fixed: 32
skipped: 0
status: all_fixed
---

# API Route Error Response Fix

**Fixed at:** 2026-06-14
**Iteration:** 1

**Summary:**
- Findings in scope: 32
- Fixed: 32 (all `NextResponse.json({ success: false, ... })` → `apiError(...)`)
- Skipped: 0

## Fixed Issues

### All 32 Files

**Pattern applied:** Replaced all `NextResponse.json({ success: false, error: '...' }, { status: XXX })` with `apiError('...', XXX)` and `NextResponse.json({ success: false, error: '...', code: '...' }, { status: XXX })` with `apiError('...', XXX, '...')`.

Each file received:
1. Added `import { apiError } from '@/lib/api-utils'`
2. Replaced every error `NextResponse.json({ success: false, ... })` with equivalent `apiError(...)` call
3. Removed `import { NextResponse } from 'next/server'` where no longer used (only `database/reset/route.ts`)

**Files fixed:**

1. `src/app/api/admin/board-years/route.ts` — 10 error responses replaced
2. `src/app/api/admin/bundles/content/route.ts` — 3 error responses replaced
3. `src/app/api/admin/bundles/[id]/route.ts` — 6 error responses replaced
4. `src/app/api/admin/chapters/content-counts/route.ts` — 1 error response replaced
5. `src/app/api/admin/content-purchases/route.ts` — 7 error responses replaced
6. `src/app/api/admin/database/reset/route.ts` — 1 error response replaced, `NextResponse` import removed
7. `src/app/api/admin/exam-results/route.ts` — 2 error responses replaced
8. `src/app/api/admin/featured/search/route.ts` — 2 error responses replaced
9. `src/app/api/admin/feedback/route.ts` — 6 error responses replaced
10. `src/app/api/admin/feedback/[id]/messages/route.ts` — 6 error responses replaced
11. `src/app/api/admin/mcq/bulk-upload/route.ts` — 5 error responses replaced
12. `src/app/api/admin/mcq-exam-packages/bulk-upload-questions/route.ts` — 7 error responses replaced
13. `src/app/api/admin/mcq-exam-purchases/route.ts` — 5 error responses replaced
14. `src/app/api/admin/navigation/route.ts` — 8 error responses replaced
15. `src/app/api/admin/navigation/seed/route.ts` — 2 error responses replaced
16. `src/app/api/board-questions/filters/route.ts` — 1 error response replaced
17. `src/app/api/board-years/route.ts` — 1 error response replaced
18. `src/app/api/bookmarks/check/route.ts` — 4 error responses replaced
19. `src/app/api/csrf-token/route.ts` — 1 error response replaced
20. `src/app/api/exams/results/[userId]/route.ts` — 3 error responses replaced
21. `src/app/api/exams/[id]/route.ts` — 2 error responses replaced
22. `src/app/api/hierarchy/metadata/route.ts` — 2 error responses replaced
23. `src/app/api/lectures/[id]/route.ts` — 3 error responses replaced (one with `PREMIUM_REQUIRES_AUTH` code)
24. `src/app/api/packages/suggest/route.ts` — 1 error response replaced
25. `src/app/api/payment/content-info/route.ts` — 14 error responses replaced
26. `src/app/api/payment/purchases/route.ts` — 2 error responses replaced (rate-limit with headers left as-is)
27. `src/app/api/pdf/route.ts` — 8 error responses replaced (rate-limit with headers and dynamic-status proxy response left as-is)
28. `src/app/api/suggestions/[id]/route.ts` — 2 error responses replaced
29. `src/app/api/teacher-moderators/route.ts` — 1 error response replaced
30. `src/app/api/testimonials/route.ts` — 1 error response replaced
31. `src/app/api/user/dashboard/route.ts` — 3 error responses replaced (one with `UNAUTHORIZED` code)
32. `src/app/api/user/recent-lectures/route.ts` — 2 error responses replaced

### Notes

3 raw `NextResponse.json({ success: false, ... })` error calls remain intentionally unchanged because `apiError()` does not support their specific requirements:
- **pdf/route.ts** (line 65): Rate-limit response with custom headers (`rateLimitHeaders`)
- **pdf/route.ts** (line 103): Proxy fetch error with dynamic status from fetch response
- **payment/purchases/route.ts** (line 60): Rate-limit response with custom headers (`rateLimitHeaders`)

---

_Fixed: 2026-06-14_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
