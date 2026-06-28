# Board Question Module — Architecture Report

## 1. Database Models (Prisma)

The board question module spans **30+ models** in `prisma/schema.prisma`. Here are the directly involved ones:

### Core Content

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| `MCQ` | `MCQ` | `id, question, optionA-D, correctAnswer, explanation, chapterId, classLevel, subjectId, board?, year?, topic?, difficulty, isPremium, price` | Multiple choice board questions |
| `CQ` | `CQ` | `id, uddeepok, question1-4, answer1-4, chapterId, classLevel, subjectId, board?, year?, topic?, difficulty, isPremium, price` | Creative (structured) board questions |

### Hierarchy

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| `ClassCategory` | `ClassCategory` | `id, name, slug, order` | 6th/HSC level grouping |
| `Subject` | `Subject` | `id, name, slug, classId, order` | Subjects under a class |
| `Chapter` | `Chapter` | `id, name, slug, subjectId, order` | Chapters under a subject |
| `Topic` | `Topic` | `id, name, slug, chapterId, order` | Sub-topics within a chapter |

### Board & Year

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| `Board` | `Board` | `id, name, slug, color` | Education boards (Dhaka, Rajshahi, etc.) |
| `ExamYear` | `ExamYear` | `id, year` | Exam years (2024, 2023, etc.) |
| `BoardYear` | `BoardYear` | `id, board, year` | M:N bridge for valid board+year combos |

### Access Control & Monetization

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| `Payment` | `Payment` | `id, userId, amount, contentType, contentId, status` | Tracks purchases (type supports `board-mcq`, `board-cq`) |
| `ContentBundle` | `ContentBundle` | `id, title, slug, price, classLevel` | Mixed-content bundles |
| `BundleItem` | `BundleItem` | `id, bundleId, contentType, contentId` | Links content items to bundles |
| `ContentPackage` | `ContentPackage` | `id, title, slug, price, duration` | Time-based subscription packages |
| `UserSubscription` | `UserSubscription` | `id, userId, packageId, classLevel, startDate, endDate` | Active subscriptions |

### Exam Package System (Structured Practice)

| Model | Table | Purpose |
|-------|-------|---------|
| `MCQExamPackage` | `MCQExamPackage` | Purchasable package of MCQ exam sets |
| `MCQExamSet` | `MCQExamSet` | Single timed MCQ exam set |
| `MCQExamSetQuestion` | `MCQExamSetQuestion` | Links an MCQ to an exam set |
| `MCQExamSetResult` | `MCQExamSetResult` | Student result for an MCQ set |
| `MCQExamPackagePurchase` | `MCQExamPackagePurchase` | Tracks who bought which MCQ package |
| `MCQExamRetakeRequest` | `MCQExamRetakeRequest` | Retake approval flow |
| `CQExamPackage` | `CQExamPackage` | Purchasable package of CQ exam sets |
| `CQExamSet` | `CQExamSet` | Single timed CQ exam set |
| `CQExamSetQuestion` | `CQExamSetQuestion` | Links CQs to exam set (supports typed questions) |
| `CQExamSubmission` | `CQExamSubmission` | Student submission for a CQ set |
| `CQExamAnswer` | `CQExamAnswer` | Per-sub-question answer within a submission |
| `CQExamAnswerImage` | `CQExamAnswerImage` | Images uploaded as part of a CQ answer |
| `CQExamPackagePurchase` | `CQExamPackagePurchase` | Tracks who bought which CQ package |

### Legacy

| Model | Table | Purpose |
|-------|-------|---------|
| `Exam` | `Exam` | General mixed-type exam (legacy) |
| `ExamQuestion` | `ExamQuestion` | Links questions to legacy exams |
| `ExamResult` | `ExamResult` | Legacy exam results |

---

## 2. API Routes

### Public (User-facing)

| Route | Methods | Purpose | Auth |
|-------|---------|---------|------|
| `GET /api/board-questions` | `GET` | Main data endpoint — fetches MCQ + CQ with filters, pagination, analytics, access control. Rate limited. | Optional (answers stripped for unauthenticated) |
| `GET /api/board-questions/filters` | `GET` | Dynamic filter options (boards, years, class levels, subjects) based on classLevel/year params | None |
| `GET /api/board-questions/search-suggestions` | `GET` | Search autocomplete — grouped by board/subject/chapter/year. Returns popular defaults when no query | None |
| `GET /api/mcq` | `GET` | MCQ exam/practice data endpoint. Used by exam and result pages with filter params | Optional |
| `GET /api/mcq/[id]` | `GET` | Single MCQ detail | Optional |
| `GET /api/mcq/exam` | `GET` | MCQ exam session data | Auth required |
| `GET /api/hierarchy/metadata` | `GET` | Central metadata — classes, subjects, chapters, boards, years, board-years. Cache headers set | None |
| `GET /api/content/bundles-for` | `GET` | Finds bundles + packages containing a specific content item. Cross-type matching (board-mcq <-> mcq) | None |
| `POST /api/payment/batch-check` | `POST` | Batch access check for question IDs — returns purchase/pending status per item | Auth required |
| `GET /api/stats` | `GET` | Site-wide stats (students, mcqs, cqs, lectures, exams) | None |

### Admin-only

| Route | Methods | Purpose | Auth |
|-------|---------|---------|------|
| `GET /api/admin/board-questions` | `GET` | List board questions with search, filter by board/year/class/type. Paginated. Returns MCQ + CQ merged | Admin |
| `POST /api/admin/board-questions` | `POST` | Create a board question (MCQ or CQ). Zod-validated body. Invalidates cache | Admin |
| `PUT /api/admin/board-questions` | `PUT` | Update an existing board question by ID + type. Partial updates allowed | Admin |
| `DELETE /api/admin/board-questions` | `DELETE` | Delete by ID + type. Invalidates cache on success | Admin |
| `GET /api/admin/stats` | `GET` | Admin dashboard stats (users, mcqs, cqs, lectures, revenue, payments) | Admin |

---

## 3. Server Actions

**None found.** There are no `use server` server actions in `src/actions/` or `src/lib/actions/`. All server-side logic is handled via Next.js API Route Handlers (`app/api/`).

---

## 4. Repository Layer

There is **no formal repository layer**. All database access is done inline within API route handlers using Prisma Client (`db` from `@/lib/db`). Access control logic in `src/lib/access-control.ts` functions as a partial service layer but is called directly from routes.

---

## 5. Services

| Service File | Role | Used By |
|-------------|------|---------|
| `src/lib/access-control.ts` | `checkContentAccess()`, `batchCheckContentAccess()` — layered access check (subscription -> payment -> bundle -> package) | Server-side only: `board-questions/route.ts` |
| `src/lib/cache-invalidate.ts` | `invalidateContentCache('board-question')` — Redis-based cache version bump | Server-side only: `admin/board-questions/route.ts` |

---

## 6. Types (`src/types/board-questions.ts`)

| Type | Description |
|------|-------------|
| `BoardQuestionItem` | Full question shape — MCQ + CQ union fields, premium/price/difficulty, board metadata |
| `BoardQuestionFilters` | Filter state shape — arrays of slugs for each filter dimension |
| `AnalyticsData` | 10 computed stats (total, accessible, premium, unlocked, boards, subjects, chapters, practiced, remaining, accuracy) |
| `BoardQuestionsResponse` | API envelope — data + pagination + analytics |
| `AccessStatus` | Per-question access — type (free/purchased/pending/locked), packages/bundles for conversion |
| `PurchaseStatus` / `PurchaseStatusType` | Payment state tracking |
| `PackageOffer` / `BundleOffer` | Monetization offer shapes for purchase modal |
| `FilterChip` / `FilterOption` / `FilterSection` | UI filter types |
| `SearchSuggestion` | Autocomplete suggestion shape |

---

## 7. Validation (Zod)

**Only in admin CRUD:**

- `src/app/api/admin/board-questions/route.ts` — `createBoardMcqSchema` and `createBoardCqSchema`

No Zod validation in public API routes. Public routes rely on Prisma's built-in type safety and manual query param parsing.

---

## 8. Query Builders

**No abstracted query builder layer.** Query construction is inline:

- `board-questions/route.ts` builds Prisma `where` clauses and raw SQL for analytics (`analyticsWhere()` function)
- `board-questions/filters/route.ts` builds dynamic `where` from URL params
- `access-control.ts` builds batched Prisma queries programmatically

---

## 9. Dependency Tree

```
src/types/board-questions.ts              <- Pure types, no dependencies
src/lib/board-utils.ts                    <- Pure utils, no dependencies
src/lib/fetch-json.ts                     <- No dependencies
src/lib/api-client.ts                     <- No dependencies
src/lib/api-utils.ts                      <- Depends on: zod, next/server, @/lib/rate-limit, @/store/auth
src/lib/access-control.ts                 <- Depends on: @/lib/db
src/lib/cache-invalidate.ts               <- Depends on: @upstash/redis
src/lib/query-keys.ts                     <- No dependencies (constants)
src/lib/sanitize-html.ts                  <- No dependencies

src/store/board-filters.ts                <- Depends on: zustand, @/types/board-questions

src/hooks/use-debounce.ts                 <- No dependencies
src/hooks/use-board-questions-data.ts     <- Depends on: @tanstack/react-query, @/lib/fetch-json,
                                              @/store/auth, @/store/board-filters,
                                              @/types/board-questions, ./use-debounce
src/hooks/use-access-status.ts            <- Depends on: @/lib/api-client, @/store/auth,
                                              @/types/board-questions
src/hooks/use-hierarchy-metadata.ts       <- Depends on: @tanstack/react-query, @/lib/fetch-json,
                                              @/lib/query-keys
src/hooks/use-stats.ts                    <- Depends on: @tanstack/react-query, @/lib/fetch-json
src/hooks/use-mobile.ts                   <- No dependencies

src/app/api/board-questions/route.ts              <- @/lib/db, @/lib/api-utils, @/lib/auth,
                                                      @/lib/rate-limit, @/lib/access-control
src/app/api/board-questions/filters/route.ts       <- @/lib/db, @/lib/api-utils, @/lib/rate-limit
src/app/api/board-questions/search-suggestions/route.ts <- @/lib/db
src/app/api/hierarchy/metadata/route.ts            <- @/lib/db, @/lib/api-utils, @/lib/cache-headers
src/app/api/content/bundles-for/route.ts           <- @/lib/db
src/app/api/admin/board-questions/route.ts         <- @/lib/db, @/lib/api-utils, @/lib/errors,
                                                      @/lib/cache-invalidate, zod, next/server
src/app/api/mcq/route.ts                           <- @/lib/db, @/lib/auth, @/lib/api-utils,
                                                      @/lib/errors, @/lib/rate-limit

src/components/board/BoardQuestionExplorer.tsx     <- store, hooks, explorer/*, PurchaseOptionsModal,
                                                      @/types/board-questions
src/components/board/explorer/*.tsx (17 files)     <- store, hooks, @/components/ui/*, @/lib/*,
                                                      @/types/board-questions

src/components/admin/AdminBoardPage.tsx             <- @/hooks/use-hierarchy-metadata,
                                                      @/components/shared/DataTable, admin API routes
src/components/home/BoardQuestionSection.tsx        <- store/router, hooks/use-home-data
src/components/chapter-hub/tabs/BoardQuestionsTab.tsx  <- hooks, BoardQuestionCard, PurchaseOptionsModal
src/components/chapter-hub/cards/BoardQuestionCard.tsx <- @/types/board-questions, @/lib/sanitize-html
src/components/shared/PurchaseOptionsModal.tsx      <- hooks/use-content-types,
                                                      hooks/use-hierarchy-metadata, store

src/app/board-questions/page.tsx                    <- Thin wrapper -> BoardQuestionExplorer
src/app/[...slug]/page.tsx                          <- Route registration -> BoardQuestionExplorer
```

---

## 10. File Classification

### SAFE TO CHANGE (Leaf / Isolated — changes won't cascade)

| File | Reason |
|------|--------|
| `src/types/board-questions.ts` | Pure type definitions. Safe if types remain compatible with consumers |
| `src/lib/board-utils.ts` | Pure utility functions (color mappings, labels) with no dependencies |
| `src/lib/fetch-json.ts` | Standalone HTTP helper. Low-risk if interface preserved |
| `src/lib/query-keys.ts` | Constants only. Safe |
| `src/lib/sanitize-html.ts` | Isolated sanitization utility |
| `src/lib/cache-invalidate.ts` | Redis-backed cache busting. Isolated service |
| `src/hooks/use-debounce.ts` | Generic debounce hook. No board-specific logic |
| `src/hooks/use-mobile.ts` | Generic responsive hook. No board-specific logic |
| `src/hooks/use-stats.ts` | Generic stats fetch. Low risk |
| `src/components/board/explorer/ExplorerHeader.tsx` | Pure presentational. Receives props |
| `src/components/board/explorer/ExplorerSkeleton.tsx` | Loading skeleton. No logic |
| `src/components/board/explorer/SelectClassPrompt.tsx` | Pure presentational. No logic |
| `src/components/board/explorer/EmptyExplorer.tsx` | Presentational with store reads. Low risk |
| `src/components/board/explorer/ResultsAnalytics.tsx` | Presentational with props. Low risk |
| `src/components/board/explorer/ConversionBanner.tsx` | Presentational with store reads. Low risk |
| `src/components/board/explorer/PackageLockOverlay.tsx` | Self-contained overlay. Not currently imported by active components |
| `src/components/board/explorer/QuestionCard.tsx` | Legacy/Unused in current explorer |
| `src/components/board/explorer/QuestionList.tsx` | Legacy/Unused in current explorer |
| `src/components/chapter-hub/cards/BoardQuestionCard.tsx` | Self-contained display card. Only used by BoardQuestionsTab |

### SHOULD NOT CHANGE (Critical — changes would break the entire module)

| File | Reason |
|------|--------|
| `src/store/board-filters.ts` | Central filter state — every explorer component reads/writes to it |
| `src/hooks/use-board-questions-data.ts` | Primary data fetching hook — both MCQ and CQ tabs depend on it |
| `src/hooks/use-access-status.ts` | All access decisions (free/locked/purchased) flow through this hook |
| `src/hooks/use-hierarchy-metadata.ts` | Shared metadata — explorer, admin, home, chapter-hub all depend on it |
| `src/components/board/BoardQuestionExplorer.tsx` | Main orchestrator — coordinates all sub-components, hooks, and state |
| `src/components/board/explorer/CoreFilterBar.tsx` | Filter bar with cascading logic |
| `src/components/board/explorer/AdvancedFiltersDrawer.tsx` | Advanced filter panel — reads/writes central filter store |
| `src/components/board/explorer/McqViewMode.tsx` | MCQ list with pagination |
| `src/components/board/explorer/McqViewCard.tsx` | Single MCQ display with answer reveal, explanation, lock/unlock |
| `src/components/board/explorer/CqViewMode.tsx` | CQ list with pagination |
| `src/components/board/explorer/CqViewCard.tsx` | Single CQ display with sub-questions |
| `src/components/board/explorer/FilterChips.tsx` | Active filter display — reads from filter store |
| `src/components/board/explorer/QuickFilters.tsx` | One-click class/board toggles |
| `src/components/board/explorer/ExplorerSearch.tsx` | Search input with localStorage recent/popular |
| `src/lib/access-control.ts` | Server-side access check chain — critical for premium gating |
| `src/app/api/board-questions/route.ts` | Primary data API — powers the entire explorer |
| `src/app/api/board-questions/filters/route.ts` | Dynamic filter options |
| `src/app/api/board-questions/search-suggestions/route.ts` | Search autocomplete |
| `src/app/api/hierarchy/metadata/route.ts` | Central metadata |
| `src/app/api/mcq/route.ts` | Exam practice data |
| `src/app/api/content/bundles-for/route.ts` | Bundle/package discovery |
| `src/app/api/payment/batch-check/route.ts` | Batch access check |

### SHARED (Used across multiple modules)

| File | Reason |
|------|--------|
| `src/types/board-questions.ts` | Types imported by board module, chapter-hub, admin, and others |
| `src/lib/board-utils.ts` | Color utilities used by both explorer and chapter-hub |
| `src/lib/fetch-json.ts` | HTTP utility used by multiple hooks across the app |
| `src/lib/api-client.ts` | HTTP client used by `useAccessStatus` and many other hooks |
| `src/lib/api-utils.ts` | Server utilities used by all API routes |
| `src/lib/query-keys.ts` | React Query key constants |
| `src/lib/sanitize-html.ts` | HTML sanitizer used by all question display components |
| `src/lib/cache-invalidate.ts` | Cache busting used by admin routes across all modules |
| `src/lib/access-control.ts` | Access logic used by board-questions and other content API routes |
| `src/hooks/use-hierarchy-metadata.ts` | Used by board explorer, admin, chapter hub, home page |
| `src/hooks/use-stats.ts` | Used by board explorer, admin dashboard, home page |
| `src/hooks/use-debounce.ts` | Generic hook |
| `src/hooks/use-mobile.ts` | Generic responsive hook |
| `src/components/shared/PurchaseOptionsModal.tsx` | Used by both BoardQuestionExplorer and BoardQuestionsTab |

### ADMIN ONLY

| File | Reason |
|------|--------|
| `src/components/admin/AdminBoardPage.tsx` | Full CRUD for board questions — protected by admin auth |
| `src/app/api/admin/board-questions/route.ts` | Admin-only CRUD API — protected by `withAdmin` middleware |
| `src/app/api/admin/stats/route.ts` | Admin dashboard stats |

### USER ONLY

| File | Reason |
|------|--------|
| `src/app/board-questions/page.tsx` | Public route wrapping BoardQuestionExplorer |
| `src/app/[...slug]/page.tsx` | Route registration (contains `'board-questions'` case) |
| `src/components/home/BoardQuestionSection.tsx` | Homepage marketing section |
| `src/components/chapter-hub/tabs/BoardQuestionsTab.tsx` | Chapter detail page tab |
| `src/components/chapter-hub/cards/BoardQuestionCard.tsx` | Chapter detail question card |

---

## 11. Architecture Diagram

```
                    +--------------------------------------------------+
                    |           [...slug]/page.tsx                      |
                    |          board-questions/page.tsx                  |
                    +------------------------+-------------------------+
                                             | renders
                    +------------------------v-------------------------+
                    |      BoardQuestionExplorer.tsx                    |
                    |  (Orchestrator - no props, default export)        |
                    +--------------------------------------------------+
                    |  Reads: useBoardFilterStore (Zustand)             |
                    |  Fetches: useBoardQuestionsData (React Query)     |
                    |  Checks: useAccessStatus (api.post)               |
                    |  Metadata: useHierarchyMetadata (React Query)     |
                    |  Stats: useStats (React Query)                    |
                    |  Responsive: useIsMobile                          |
                    +--+--+--+--+--+--+--+--+--+--+--------------------+
          +-----------+  |  |  |  |  |  |  |  |  |  |
          v              v  v  v  v  v  v  v  v  v  v
   ExplorerHeader    Search QuickFilters CoreFilterBar
   SelectClassPrompt  FilterChips ConversionBanner
   ResultsAnalytics
   McqViewMode (tab)     CqViewMode (tab)
   +-- McqViewCard       +-- CqViewCard
   PurchaseOptionsModal (shared)

  +-------------------------------------------------------------+
  |                  API Layer (server-side)                     |
  +-------------------------------------------------------------+
  |  GET /api/board-questions              -> MCQ + CQ data      |
  |  GET /api/board-questions/filters      -> filter options     |
  |  GET /api/board-questions/search-suggestions -> autocomplete |
  |  GET /api/hierarchy/metadata           -> classes/boards/etc |
  |  GET /api/content/bundles-for          -> offers for unlock  |
  |  POST /api/payment/batch-check         -> access per question|
  |  GET /api/mcq                          -> exam practice data |
  |  GET /api/admin/board-questions        -> CRUD (admin only)  |
  +-------------------------------------------------------------+
  |                  Service Layer                                |
  +-------------------------------------------------------------+
  |  src/lib/access-control.ts            -> access check chain  |
  |  src/lib/cache-invalidate.ts          -> Redis cache busting |
  +-------------------------------------------------------------+

  +-------------------------------------------------------------+
  |               External Consumers                             |
  +-------------------------------------------------------------+
  |  home/BoardQuestionSection.tsx       -> homepage promo      |
  |  chapter-hub/tabs/BoardQuestionsTab  -> chapter detail      |
  |  chapter-hub/cards/BoardQuestionCard -> per-question card   |
  |  admin/AdminBoardPage.tsx            -> admin CRUD UI       |
  +-------------------------------------------------------------+
```

### Key Architectural Observations

1. **No server actions** — all server-side logic is in API route handlers
2. **No repository/DAO layer** — Prisma is called directly from route handlers
3. **No Zod validation on public APIs** — only admin create endpoint validates
4. **Graph-like dependency on `useBoardFilterStore`** — 8+ components read from it; the store is the single source of truth for filter state
5. **`use-hierarchy-metadata.ts`** is the most widely shared hook (board, admin, chapter-hub, home)
6. **`access-control.ts`** is server-only and is the most complex piece of business logic (subscription -> payment -> bundle -> package chain)
