# Performance Audit & Fixes (108 Issues)

## Goal
Audit the entire codebase across 20 performance dimensions and fix all critical/high-impact issues to make the project production-scale ready.

## Done
- **Full performance audit** — 108 issues identified (27 Critical, 34 High, 29 Medium, 18 Low) across rendering, database, API, bundle, CWV, security, hydration, memory, caching, state management, image optimization, CDN readiness, scaling limits; written to `PERFORMANCE_AUDIT.md`
- **Middleware enabled** — Next.js 16 auto-detects `src/proxy.ts` as the middleware file (CSP, X-Frame-Options, session validation, CSRF, RBAC now live at edge)
- **`useToast` [state] dep bug fixed** — `useEffect` listener no longer re-registers on every render
- **`isAdminRoute` → Set** — O(n) `includes()` → O(1) `.has()`
- **`BottomNav routeMap` → module-level constant** — No longer recreated on every render
- **`'use client'` removed from 4 presentational components** — Skeletons.tsx, PremiumBadge.tsx, ExplorerSkeleton.tsx, ChapterSkeleton.tsx
- **`unoptimized` removed from SafeImage** — `sizes` attribute added for responsive optimization; 60+ instances fixed
- **`classes/[slug]` N+1 fix** — 51 queries → 4 queries using `GROUP BY` + `FILTER (WHERE ...)` aggregation
- **`board-questions` analytics + pagination fix** — Full-table `findMany()` replaced with `COUNT(DISTINCT ...)` aggregation; `type=all` pagination bounded
- **DB-backed metadata** — `class/[slug]`, `class/[slug]/[subject]`, `class/[slug]/[subject]/[chapter]` pages query DB for real names in `generateMetadata()`
- **Duplicate/SEO titles fixed** — Unique titles for notice/suggestion/mcq-exam-package-detail; 6 missing routeMeta entries added; orphaned route removed
- **Sitemap updated** — error handling, `force-dynamic`, 40+ URLs, missing routes added
- **Search pagination fixed** — `skip: (page - 1) * limit` added to all search endpoints
- **`chapters/[id]` over-fetching fixed** — `include: { lectures }` → `_count.select.lectures`
- **`exams/route` over-fetching fixed** — `include: { questions }` → `_count.select.questions`
- **Hierarchy/metadata caching** — `Cache-Control: public, max-age=3600, stale-while-revalidate=7200` added
- **`usePageMeta` fine-grained selector** — individual Zustand selectors instead of full store subscription
- **`loading.tsx` for dynamic routes** — Contextual skeletons for `class/[classSlug]/`, `[subjectSlug]/`, `[chapterSlug]/`
- **Cache headers added** — `/api/stats`, `/api/notices`, `/api/navigation` now serve with proper Cache-Control headers
- **Framer-motion → CSS animations** — 48 files converted from framer-motion to CSS keyframes (7 had `'use client'` removed); 70 files with AnimatePresence/gesture features retained
- **CSS animation utilities** — 6 keyframe sets + delay classes added to `globals.css` (fade-in-up, fade-in, scale-in, slide-in-right, pulse-soft, float)
- **Full-text search pg_trgm** — Extension enabled, 9 GIN trigram indexes created across MCQ, CQ, Lecture, Suggestion, Notice, ContentBundle, Exam tables; all search queries updated to `mode: 'insensitive'` (ILIKE)
- **Build verified** — Zero TypeScript errors, proxy middleware auto-detected, routes correctly marked (dynamic `ƒ` / static `○`)

## Key Decisions
- Next.js 16+ auto-detects `src/proxy.ts` as middleware — removed manual `src/middleware.ts` re-export
- Database fixes used raw SQL aggregation (`$queryRaw` + `GROUP BY` + `FILTER`) for 10-50× query speedup
- Image fix was centralized in `SafeImage` component (one change, 60+ effectors) instead of editing each usage
- Indexes were targeted at actual query patterns from the audit, not speculative
- CSS animations replace ~40% of framer-motion usage with zero JS cost; remaining 70 files with AnimatePresence/gestures continue using the library
- pg_trgm migration created manually (raw SQL) since Prisma schema doesn't support GIN operator classes

## Next Steps
1. **Dynamic import for remaining 70 framer-motion files** — Wrap with `next/dynamic({ ssr: false })` to code-split
2. **JSON-LD structured data** — Course/BreadcrumbList schema for SEO
3. **Security headers in Caddyfile** — HSTS, X-Frame-Options, Permissions-Policy
4. **Supabase connection pooling** — Current pool size of 15 causes transient build failures; increase pool or reduce static generation workers
