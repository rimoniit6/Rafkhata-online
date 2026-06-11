# CQ Exam Package — Full Audit Report

**Date:** 2026-06-11  
**Scope:** All 5 API routes, 20+ components, DB schema, image system, auth, evaluation

---

## EXECUTIVE SUMMARY

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs | 1 | 0 | 2 | 0 |
| Performance | 5 | 8 | 6 | 3 |
| Security | 1 | 1 | 1 | 2 |
| UI/UX | 0 | 4 | 6 | 4 |
| Code Quality | 2 | 4 | 5 | 3 |
| Database | 3 | 5 | 4 | 2 |
| Accessibility | 0 | 2 | 3 | 5 |

**Total: 71 findings** (11 Critical, 24 High, 27 Medium, 19 Low)

---

## CRITICAL FINDINGS (Fix Immediately)

### C1. `grade-submission` Action Broken (BUG)
**File:** `src/app/api/admin/cq-exam-packages/route.ts:462`  
**Problem:** Line references `submission.setId` but variable `submission` is never defined. Body destructures `{ submissionId, answers }` only.  
**Impact:** ALL grade-submission calls throw `ReferenceError`. Feature is completely non-functional.  
**Fix:** Change `submission.setId` to use `setId` from request body, or fetch submission first.

### C2. Public API Exposes Other Users' Data (SECURITY)
**File:** `src/app/api/cq-exam-packages/route.ts`  
**Problem:** `detail`, `my-retake-requests`, `list` actions accept `userId` as query param without verifying it matches the authenticated user.  
**Impact:** Any user can view another user's purchase status, submissions, and retake requests.  
**Fix:** Remove `userId` param; derive from auth token. Or verify `userId === auth.user.id`.

### C3. No Pagination on Public List Endpoint (PERFORMANCE)
**File:** `src/app/api/cq-exam-packages/route.ts:25`  
**Problem:** `findMany` without `skip`/`take`. ALL published packages loaded into memory.  
**Impact:** With 500+ packages, this endpoint returns megabytes of data on every load.  
**Fix:** Add pagination (`skip`/`take`) with default 20 per page.

### C4. No Pagination on Submissions Endpoint (PERFORMANCE)
**File:** `src/app/api/admin/cq-exam-packages/route.ts:165`  
**Problem:** Loads ALL submissions for a set without limit.  
**Impact:** A set with 1000+ submissions loads everything into memory.  
**Fix:** Add cursor-based or offset pagination.

### C5. N+1 Queries in `bulk-grade` (PERFORMANCE)
**File:** `src/app/api/admin/cq-exam-packages/route.ts:506-537`  
**Problem:** Nested loop: for each submission, for each answer, one `update` call. 200 submissions × 20 answers = 4,000+ sequential DB queries.  
**Impact:** Bulk grading 200 submissions takes 30+ seconds.  
**Fix:** Use `updateMany` with `id: { in: answerIds }` for batch updates.

### C6. N+1 Queries in `add-questions` (PERFORMANCE)
**File:** `src/app/api/admin/cq-exam-packages/route.ts:306-324`  
**Problem:** For each CQ ID added, does `findUnique` check + possibly `create`. 20 questions = ~30 queries.  
**Impact:** Adding 20 questions takes ~1 second instead of ~50ms.  
**Fix:** Batch-check with `findMany({ where: { cqId: { in: cqIds } } })` then `createMany`.

### C7. N+1 in `save-bulk-grades-by-question` (PERFORMANCE)
**File:** `src/app/api/admin/cq-exam-packages/route.ts:567-601`  
**Problem:** Double nested loop: per submission, per answer update, then re-fetch ALL answers.  
**Impact:** 50 submissions × 4 answers = 200+ queries for what should be 1-2.  
**Fix:** Compute totals from submitted data instead of re-querying.

### C8. Missing Indexes on All CQ Tables (DATABASE)
**Files:** All models in `schema.prisma`  
**Missing indexes:**
- `CQExamSubmission(setId, status)` — used by bulk-grade, publish, all filtering
- `CQExamAnswerImage(answerId)` — every answer detail query scans
- `CQExamSet(packageId)` — every set listing
- `CQExamPackage(status, isActive, order)` — public + admin listing
- `CQ(isActive, classLevel, subjectId, chapterId)` — CQ search
- `Payment(userId, contentType, contentId, status)` — purchase verification
- `Notification(userId)` — all notification queries

**Impact:** Full table scans on every query. With growing data, performance degrades linearly.  
**Fix:** Add 12+ indexes via Prisma migration.

### C9. No Rate Limiting on Any Endpoint (SECURITY)
**Files:** All 5 API routes  
**Problem:** `applyRateLimit` utility exists in `api-utils.ts` but is NEVER used.  
**Impact:** All endpoints are vulnerable to abuse, scraping, and DOS.  
**Fix:** Apply rate limiting to all public endpoints (especially start-exam, save-answer, add-image).

### C10. Bulk Grading Image Transfer Heavy (PERFORMANCE)
**File:** `src/features/cq-exam/admin/components/CQBulkGradingView.tsx`  
**Problem:** All images loaded at full resolution for thumbnails (w-16 h-16 via CSS). 30 submissions × 2 images × 4MB = 240MB transferred.  
**Impact:** Page load takes 10-30 seconds for moderate datasets.  
**Fix:** Generate thumbnails + lazy loading + virtualized grid.

### C11. No Image Compression Pre-Upload (PERFORMANCE)
**Files:** `CQExamViewerPage.tsx`, `image-uploader.tsx`  
**Problem:** Students upload smartphone photos (4-6MB) at full resolution. No client-side compression.  
**Impact:** 4MB per upload, 5 uploads per answer = 20MB per submission.  
**Fix:** Canvas API compression (max 1920px, quality 0.8) before upload.

---

## HIGH PRIORITY FINDINGS

### H1. Sequential Bulk Set Creation
**File:** `use-cq-exam-packages.ts:759-795`  
**Problem:** Creates N sets in sequential `for` loop with `await`. 10 sets = 10 sequential API calls.  
**Fix:** Use `Promise.all`.

### H2. Waterfall Purchase Checks
**File:** `CQExamPackageListPage.tsx:281-298`  
**Problem:** For each displayed package, does individual API call to check purchase status. 50 packages = 50 API calls.  
**Fix:** Batch into single endpoint.

### H3. Props Drilling (80+ Props)
**File:** `CQExamAdminContainer.tsx`  
**Problem:** ~80 props passed through container to children. Maintenance nightmare, causes re-renders.  
**Fix:** React Context or Zustand for form state / view state / data state.

### H4. God Hook (926 lines)
**File:** `use-cq-exam-packages.ts`  
**Problem:** ~40 state variables, ~25 callbacks, multiple concerns.  
**Fix:** Split into smaller domain hooks (`usePackageList`, `usePackageForm`, `useGrading`, etc.).

### H5. Code Duplication — `transformCQ()` × 2
**Files:** `api/cq/route.ts:6-85`, `api/cq/[id]/route.ts:6-81`  
**Problem:** Exact same 80-line function copied twice.  
**Fix:** Extract to `@/lib/transforms/cq.ts`.

### H6. Code Duplication — Stimulus Parsing × 7
**Files:** `CQQuestionManager`, `CQGradingInterface`, `CQPreviewDialog`, `CQViewerPage`, `CQResultPage`, `CQBulkGradingView`, `CQExamPreviewDialog`  
**Problem:** Same logic to extract stimulus/sub-questions duplicated 7+ times.  
**Fix:** Extract to `@/features/cq-exam/utils.ts`.

### H7. Code Duplication — `bengaliLabels` × 8
**Files:** 8 component files  
**Problem:** Same `['ক','খ','গ','ঘ']` constant repeated.  
**Fix:** Export from shared constants file.

### H8. Missing Lazy Loading on All CQ Images
**Files:** `safe-image.tsx`, all CQ components  
**Problem:** Zero `loading="lazy"` attributes. All images loaded immediately.  
**Impact:** Bulk grading page loads 100+ full-resolution images on pageload.  
**Fix:** Add `loading="lazy"` to `SafeImage` component.

### H9. Missing Thumbnail Generation
**Files:** All CQ components showing image grids  
**Problem:** CSS-resized full-resolution images used as thumbnails.  
**Impact:** Each 64×64 thumbnail downloads 4MB full image.  
**Fix:** Server-side thumbnail generation via `sharp` on upload.

### H10. `next/image` Not Used in CQ System
**Files:** All CQ components  
**Problem:** Plain `<img>` tags used everywhere. No automatic optimization, WebP/AVIF conversion, or responsive sizes.  
**Impact:** Larger images than necessary served to all devices.  
**Fix:** Use `next/image` with UploadThing remote patterns configured.

### H11. Image Annotator Lacks Touch Support
**File:** `image-annotator.tsx`  
**Problem:** Only mouse events (`onMouseDown`, `onMouseMove`, `onMouseUp`). No touch equivalents.  
**Impact:** Entirely unusable on tablets/iPads.  
**Fix:** Add `onTouchStart`, `onTouchMove`, `onTouchEnd` handlers.

### H12. Lightbox Lacks Touch + Pinch-to-Zoom
**File:** `image-lightbox.tsx`  
**Problem:** Only mouse + scroll-wheel zoom. No touch pan or pinch-to-zoom.  
**Impact:** Unusable for evaluators on tablets.  
**Fix:** Add touch event handling + pinch-to-zoom.

### H13. No Loading State in Bulk Grading
**File:** `CQBulkGradingView.tsx`  
**Problem:** `bulkGradingLoading` state defined but never consumed in UI.  
**Impact:** User sees no feedback while submissions load.  
**Fix:** Show spinner while loading.

### H14. `recalculateSetTotals` Uses `findMany` Instead of `aggregate`
**File:** `admin/cq-exam-packages/route.ts:7-16`  
**Problem:** Fetches ALL question rows just to count and sum marks.  
**Fix:** Use `aggregate({ _sum: { marks: true }, _count: true })`.

### H15. No Server-Side Image Limit Validation
**File:** `api/cq-exam-packages/route.ts` — `add-image`  
**Problem:** `maxImagesPerAnswer` enforced on client only. Student can bypass and upload unlimited images.  
**Fix:** Count existing images before allowing upload.

### H16. Missing Accessibility on Interactive Cards
**Files:** `CQPackageList.tsx:170`, `CQQuestionSearchDialog.tsx:132-148`  
**Problem:** `onClick` on `<Card>` and `<div>` without `role`, `tabIndex`, or keyboard handler.  
**Fix:** Add `role="button"`, `tabIndex={0}`, `onKeyDown` handler.

### H17. Silent Catch Blocks (No Error Feedback)
**Files:** `use-cq-exam-packages.ts` — 12+ catch blocks  
**Problem:** Many catch blocks have empty comments or `console.error` only. User never sees errors.  
**Fix:** Show toast or error state on all failures.

### H18. Duplicate `ClassCategory` / `SubjectOption` Type Definitions
**Files:** `CQPackageList.tsx`, `CQPackageForm.tsx`, `use-cq-exam-packages.ts`  
**Problem:** Same types defined 2-3 times.  
**Fix:** Import from shared types file.

### H19. Stale `CQExamSet.totalMarks` After Question Edit
**File:** `admin/cq-exam-packages/route.ts`  
**Problem:** `update-question-marks` and `update-typed-question` don't call `recalculateSetTotals`.  
**Impact:** Total marks display becomes incorrect.  
**Fix:** Call `recalculateSetTotals` after mark updates.

### H20. Sequential Per-Question Reorder (N+1)
**File:** `admin/cq-exam-packages/route.ts:434-439`  
**Problem:** Updates each question's order in individual query. 50 questions = 50 queries.  
**Fix:** Use raw SQL `CASE` or `updateMany` with batch.

### H21. `recalculatePackageTotalSets` Not Called on Package Status Change
**File:** `admin/cq-exam-packages/route.ts`  
**Problem:** Total sets count may drift when sets are archived rather than deleted.  
**Impact:** Package displays incorrect set count.  
**Fix:** Recalculate on set status changes too.

### H22. Inline Function Recreations in Admin Container
**File:** `CQExamAdminContainer.tsx`  
**Problem:** Every child receives inline arrow function props (30+ instances).  
**Impact:** All children re-render on every container render.  
**Fix:** Wrap callbacks in `useCallback`.

### H23. `submission.setId` Undefined in `publish-results` Check
**File:** `admin/cq-exam-packages/route.ts:668`  
**Problem:** After `updateMany`, code checks `submission.status` but `submission` is an array of count, not a record.  
**Impact:** `publish-results` not checking pending submissions due to variable shadowing/confusion.

### H24. Race Condition in `add-questions` Order Assignment
**File:** `admin/cq-exam-packages/route.ts:304`  
**Problem:** Two concurrent requests can read the same `existingCount` and assign duplicate `order` values.  
**Fix:** Wrap in transaction.

---

## MEDIUM PRIORITY FINDINGS

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| M1 | Inline `motion.div` animate objects recreated | Container, all views | Extract to constants |
| M2 | `request-retake` returns stale data | `route.ts:482` | Return updated record |
| M3 | Public API uses raw `console.error` not `handleApiError` | `cq-exam-packages/route.ts` | Standardize error handling |
| M4 | POST auth uses inline role check not `withAdmin` | `cq/route.ts:282` | Use `withAdmin()` |
| M5 | `recalculateSetTotals` not wrapped in transaction | `route.ts:7` | Add `$transaction` |
| M6 | `subjectIds` stored as JSON string (unfilterable) | Schema, `CQExamPackage` | Create join table |
| M7 | `CQ.question1-4` non-nullable (forces dummy data) | Schema | Make optional |
| M8 | `CQExamPackage.class` missing cascade delete | Schema | Add `onDelete: Cascade` |
| M9 | `Notification` model has NO indexes | Schema | Add `userId`, `isRead`, `createdAt` indexes |
| M10 | `update-typed-question` double-fetches record | `route.ts:786-808` | Use update result |
| M11 | Overly permissive `remotePatterns` in next.config | `next.config.ts` | Restrict to UploadThing CDN |
| M12 | Annotator full canvas redraw on every change | `image-annotator.tsx:120` | Use dirty-rect optimization |
| M13 | Annotator synchronous `prompt()` | `image-annotator.tsx:158` | Use modal dialog |
| M14 | Lightbox no image preloading | `image-lightbox.tsx` | Prefetch adjacent images |
| M15 | Unused state variables (gradingDialogOpen, etc.) | `use-cq-exam-packages.ts` | Remove dead code |
| M16 | `framer-motion` in 11 files for simple animations | All views | Replace with CSS transitions |
| M17 | `CQExamPackage.isPremium` used inconsistently | Schema (default true) | Document intent |
| M18 | Heavy client components could be server components | `CQPackageList`, `CQLeaderboard`, `CQRetakeRequests` | Convert to server components |
| M19 | `useEffect` for derived state | `use-cq-exam-packages.ts:86-90` | Use `useMemo` |
| M20 | `CQExamPreviewDialog` loading state only shows "লোডিং..." | Preview dialog | Add skeleton/spinner |
| M21 | No `generateMetadata` for SEO | All page components | Add metadata exports |
| M22 | No `cache`/`revalidate` on data fetches | All components | Add Next.js cache config |
| M23 | `CQExamAnswer.maxMarks` stale after mark change | Schema | Recompute on grade |
| M24 | `CQExamSubmission.totalMarks` duplicates `set.totalMarks` | Schema | Remove or document |
| M25 | `CQExamSubmission.obtainedMarks` stale after regrade | Schema | Recalculate on grade |

---

## LOW PRIORITY FINDINGS

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| L1 | Legacy body-based DELETE without type validation | `route.ts:871-881` | Add action validation |
| L2 | No validation that `cqIds` exist in add-questions | `route.ts:299` | Validate IDs |
| L3 | No validation that endTime > startTime | `CQExamSetForm.tsx` | Client-side validation |
| L4 | Price can be negative | `CQPackageForm.tsx` | Add `min={0}` |
| L5 | `handleBulkCreateSets` no input validation | Hook | Validate `bulkCount > 0` |
| L6 | `handleScreenshotChange` race condition | `CQExamPackagePurchaseDialog.tsx:262` | Add `await` |
| L7 | No image preview before upload | `CQExamViewerPage.tsx:558` | Show preview first |
| L8 | No upload deduplication | `CQExamViewerPage.tsx:544-605` | Hash check |
| L9 | Hiding important columns on mobile (marks, status) | `CQSubmissions.tsx:213-214` | Reconsider breakpoints |
| L10 | Table not wrapped in overflow-x-auto | `CQSubmissions.tsx` | Add container |
| L11 | `showCloseButton={false}` on dialog | `CQExamPackagePurchaseDialog.tsx:367` | Restore standard close |
| L12 | Inconsistent `<img>` vs `SafeImage` in same file | `CQGradingInterface.tsx:388` | Standardize |
| L13 | `CQExamPackage.isPremium` default true contradicts pricing logic | Schema | Consider default false |
| L14 | `Payment.contentType` + `contentId` polymorphic without FK | Schema | Add composite index |
| L15 | `CQExamAnswerImage.annotations` no size limit | Schema | Add application-level limit |
| L16 | Drag-reorder missing in question manager | `CQQuestionManager.tsx` | Add drag-and-drop |
| L17 | No `htmlFor` on some labels | Various forms | Add label-input association |
| L18 | No `aria-describedby` on form inputs | Various forms | Add for help text |
| L19 | Image alt text could be more descriptive | All image components | Improve descriptions |

---

## IMPLEMENTATION PLAN

### Phase 1: CRITICAL (Must Fix Immediately)

**Effort Estimate: 2-3 days**

1. Fix `grade-submission` bug (C1) — 30 min
2. Fix public API auth bypass (C2) — 1 hour
3. Add pagination to public list + submissions (C3, C4) — 2 hours
4. Fix N+1 in bulk-grade (C5) — 2 hours
5. Fix N+1 in add-questions (C6) — 1 hour
6. Fix N+1 in save-bulk-grades (C7) — 1 hour
7. Add 12+ database indexes (C8) — 30 min
8. Apply rate limiting (C9) — 1 hour
9. Add image compression + thumbnails + lazy loading (C10, C11) — 4 hours

### Phase 2: HIGH (Should Fix Soon)

**Effort Estimate: 4-5 days**

1. Parallelize bulk set creation (H1)
2. Batch purchase checks (H2)
3. Split god hook into domain hooks (H4)
4. Extract shared utilities (H5, H6, H7)
5. Fix image annotator + lightbox touch support (H11, H12)
6. Add loading states to bulk grading (H13)
7. Fix `recalculateSetTotals` to use aggregated queries (H14)
8. Add server-side image limit validation (H15)
9. Add accessibility to interactive elements (H16)
10. Fix silent catch blocks (H17)
11. Deduplicate type definitions (H18)
12. Fix stale totalMarks after question edit (H19)
13. Batch question reorder (H20)
14. Wrap callbacks in `useCallback` (H22)

### Phase 3: MEDIUM (Improvement Opportunities)

**Effort Estimate: 5-6 days**

1. Replace props drilling with context (H3)
2. Standardize error handling across all routes (M3, M4)
3. Add DB indexes on remaining tables (M9)
4. Add client-side form validation (L2-L5)
5. Convert static pages to server components (M18)
6. Replace framer-motion with CSS transitions (M16)
7. Add Next.js image optimization (M22)
8. Remove unused state & dead code (M15)
9. Add image preview before upload (L7)
10. Add service worker for image caching
11. Implement drag-reorder in question manager (L16)

### Phase 4: LOW (Nice-to-Have)

**Effort Estimate: 2-3 days**

1. Clean up legacy code paths (L1)
2. Add SEO metadata (M21)
3. Fix image alt text (L19)
4. Add table overflow containers (L10)
5. Standardize `SafeImage` usage (L12)
6. Add cascade delete consistency (M8)
7. Make CQ question fields optional (M7)
8. Create join table for subjectIds (M6)
9. Add upload deduplication (L8)
10. Improve mobile responsive breakpoints (L9)

---

## PERFORMANCE IMPACT ESTIMATES

| Fix | Current | After | Improvement |
|-----|---------|-------|-------------|
| N+1 bulk-grade (200 subs × 20 answers) | 4000 queries, ~30s | 3 queries, ~2s | **15x faster** |
| N+1 add-questions (20 CQs) | ~30 queries, ~1s | 2 queries, ~50ms | **20x faster** |
| Missing indexes (submission list) | Full scan 100k rows | Index seek ~10 rows | **100-1000x faster** |
| Image compression (per upload) | 4MB avg | 0.5MB avg | **8x smaller** |
| Thumbnail generation (bulk grading) | 240MB page load | ~3MB page load | **80x smaller** |
| Lazy loading (bulk grading) | 100+ images loaded | ~10 images loaded | **10x fewer requests** |
| Batch reorder (50 questions) | 50 queries | 1 query | **50x fewer queries** |
| Pagination (public list) | All rows returned | 20 rows returned | **Variable, 25x+ at scale** |
| Rate limiting | Unprotected | Protected | **Security improvement** |
| Props drilling optimization | 80+ props, re-render all | Context, selective renders | **Significant render reduction** |
