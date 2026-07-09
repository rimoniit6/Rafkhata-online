# Performance Optimization

## Build-Time Optimizations

### Next.js Configuration
- **Standalone Output**: Reduced deployment size
- **Image Optimization**: AVIF + WebP formats, remote patterns for CDNs
- **Bundle Optimization**: `optimizePackageImports` for lucide-react, recharts, framer-motion, Radix UI
- **Server External Packages**: Prisma client packages excluded from bundling

### TypeScript
- Strict mode enabled
- No unused locals/parameters (compile-time elimination)
- Path aliases (`@/`) for clean imports

## Runtime Performance

### React Optimizations

#### Component Memoization
- `React.memo` on DataTable, pagination, sort indicators
- Selector pattern for Zustand stores prevents unnecessary re-renders
- Typed selector hooks (`useAuthUser`, `useIsAuthenticated`, etc.)

#### Re-render Prevention
- Zustand selectors instead of full state subscriptions
- `useShallow` for multi-value selections
- Derived state computed at store level (`answerCount`, `getFilterCount`)

### Data Fetching (React Query)
- 5-minute stale time, 10-minute garbage collection
- No refetch on window focus
- Retry only on 5xx errors (max 2 attempts)
- No retry for mutations
- Prefetching for site configuration
- Query key factory pattern prevents cache collisions

### Code Splitting

#### Dynamic Implements
- `next/dynamic` for heavy components (content-block-editor, charts)
- Route-level code splitting via App Router
- Lazy-onload strategy for MathJax (2s delay)

#### Component Splitting
- DataTablePagination extracted from DataTable
- Store selectors exported as separate hooks
- Admin panels organized by domain

## Database Performance

### Query Optimization
- Batch loading in access-control (N+1 prevention)
- Compound `findMany` instead of per-item queries
- `Promise.all` for parallel independent queries
- Selective field loading (no `select *`)

### Pagination
- `skip/take` pattern with max limit of 100
- Paginated API responses with `page, limit, total, totalPages`
- `parsePaginationParams` in `api-utils.ts`

### Caching
- `unstable_cache` for SEO settings (5-min revalidation)
- In-memory permission cache (60s TTL)
- Rate limit config cache (5-min TTL)

## Network Performance

### Caching Strategy
| Content Type | Cache Duration |
|---|---|
| Images (svg, png, etc.) | 365 days, immutable |
| Fonts (woff, woff2) | 365 days, immutable |
| JSON | 1 hour, must-revalidate |
| Banners | 30s CDN cache |
| Classes/Subjects | 5min CDN cache |
| Static data (Boards, FAQs) | 1hr CDN cache |

### CDN Configuration
- Public content uses `s-maxage` with `stale-while-revalidate`
- CDN-Cache-Control headers for edge caching
- X-Cache-TTL header for monitoring

### API Optimization
- Timeout handling (15s default, 30s for full client)
- Retry with exponential backoff + jitter
- Request/response interceptors for consistent processing
- CSRF token caching (singleton with promise deduplication)

## Bundle Size Management

### Optimized Imports
- `lucide-react` (tree-shakeable icons)
- `recharts` (tree-shakeable charts)
- `framer-motion` (tree-shakeable animations)
- Radix UI (individual package imports)

### Dynamic Loading
- TipTap editor loaded on demand
- Recharts loaded only on analytics pages
- MathJax loaded with `lazyOnload` strategy

## Monitoring

### Error Tracking (Sentry)
- Automatic error capture
- Performance tracing
- Release tracking

### API Metrics
- Structured logging with timestamps
- Error code tracking
- Rate limit monitoring via Upstash analytics
