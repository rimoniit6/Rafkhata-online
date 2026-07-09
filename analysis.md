# Analytics Dashboard — Implementation Status

## ✅ What's Been Built

### 1. Architecture & Infrastructure

| Layer | File | Details |
|---|---|---|
| **Prisma schema** | `prisma/schema.prisma` | 6 new analytics models: `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsSearchQuery`, `AnalyticsAlert`, `AnalyticsReport` |
| **Zustand store** | `src/store/analytics.ts` | 9 preset date ranges + custom range, granularity control |
| **Types** | `src/types/analytics.ts` | 20+ section interfaces with full TypeScript coverage |
| **Query keys** | `src/lib/query-keys.ts` | `queryKeys.analytics.*` for TanStack Query caching |
| **React Query hooks** | `src/hooks/use-analytics.ts` | 18 typed hooks for all sections, 15s realtime polling |

### 2. Shared UI Components

| Component | File | Purpose |
|---|---|---|
| `AnalyticsLayout` | `src/components/analytics/AnalyticsLayout.tsx` | Page layout with sticky date filters |
| `AnalyticsFilters` | `src/components/analytics/AnalyticsFilters.tsx` | 9 preset period buttons + custom calendar range picker |
| `KpiCard` | `src/components/analytics/KpiCard.tsx` | Animated number counter, trend indicator, loading/empty/error states |
| `ChartCard` | `src/components/analytics/ChartCard.tsx` | Title/description/actions wrapper with skeleton |
| `AnalyticsSkeleton` | `src/components/analytics/AnalyticsSkeleton.tsx` | Loading state placeholders |
| `AnalyticsEmptyState` | `src/components/analytics/AnalyticsEmptyState.tsx` | Empty data state |
| `AnalyticsErrorState` | `src/components/analytics/AnalyticsErrorState.tsx` | Error state with retry |
| `AiInsight` | `src/components/analytics/AiInsight.tsx` | 4 insight types (positive/negative/neutral/warning) with action suggestions |
| `ExportButton` | `src/components/analytics/ExportButton.tsx` | Dropdown for xlsx/csv/pdf export |

#### Chart Library (shared Recharts wrappers)

| Chart | File |
|---|---|
| `AreaChart` | `src/components/analytics/charts/AreaChart.tsx` |
| `BarChart` | `src/components/analytics/charts/BarChart.tsx` |
| `DonutChart` | `src/components/analytics/charts/DonutChart.tsx` |
| `FunnelChart` | `src/components/analytics/charts/FunnelChart.tsx` |

### 3. Full API Endpoints (9 of 20)

| Endpoint | Lines | What it returns | Real Prisma Queries |
|---|---|---|---|
| **Revenue** | 348 | 18 KPIs, daily/monthly trends, forecast (linear regression), heatmap, by method/source/content type | `payment` aggregate + groupBy across lecture/bundle/exam/suggestion/course |
| **Students** | 142 | DAU/WAU/MAU, growth, engagement, active time/day | `user`, `progress`, `lecture` |
| **Realtime** | 69 | Online users, live purchases/registrations/enrollments/exams, activity feed | `analyticsSession`, `payment`, `user`, `courseEnrollment`, `examResult`, `analyticsEvent` |
| **Retention** | 90 | Cohorts, churn rate, retention heatmap | `user`, `progress` groupBy |
| **Predictions** | 106 | Linear regression forecast with confidence intervals | `payment`, `user`, `coursePurchase`, `course` |
| **Insights** | 157 | Template-based AI insights per section | `payment` aggregate + groupBy, `user` count |
| **Alerts** | 99 | Automatic alert evaluation (threshold-based) | `payment`, `user` |
| **Export** | 71 | XLSX/CSV report generation | Operates on client-provided data |
| **Track** | 54 | Client-side event ingestion | `analyticsEvent.create()` |

### 4. Dashboard Pages (4 of 16 sections)

| Dashboard | File | Charts / Features |
|---|---|---|
| **OverviewDashboard** | `src/components/analytics/OverviewDashboard.tsx` | Summary KPI cards, active alerts list, DAU/WAU/MAU mini-cards, links to sections |
| **RevenueDashboard** | `src/components/analytics/RevenueDashboard.tsx` | 8 KPI cards, trend/forecast line charts, source/method donut charts, day-hour heatmap, export |
| **StudentDashboard** | `src/components/analytics/StudentDashboard.tsx` | DAU/WAU/MAU trend lines, growth bar chart, active time/day distribution |
| **RealtimeDashboard** | `src/components/analytics/RealtimeDashboard.tsx` | Live counters (online, purchases, registrations, enrollments), 15s auto-refresh, activity feed |

### 5. Integration & Routing

| Area | Details |
|---|---|
| **Sidebar** | 4 sub-items under `বিশ্লেষণ` group: ওভারভিউ, রেভিনিউ, স্টুডেন্টস, লাইভ |
| **Routing** | All 16 analytics sub-routes registered in `RoutePath`, `ADMIN_ROUTES`, `ROUTE_DEFS`, `AdminPages` |
| **AnalyticsPage** | URL-based tab detection, tabs navigate to sub-routes, sidebar highlights active item |
| **Fixed** | Removed `src/app/admin/analytics/page.tsx` (direct route that bypassed AdminLayout/sidebar) |

### 6. Build & Validation

- `tsc --noEmit` — zero errors
- `next build` — zero errors

---

## ❌ What's Left

### 11 Stub API Endpoints — Need Real Implementation

| Endpoint | File | Ideal Data Source | Suggested Implementation |
|---|---|---|---|
| **conversion** | `api/admin/analytics/conversion/route.ts` | `User` → `Progress` → `Payment` → `ExamResult` | Track progression stages, compute funnel step completion rates |
| **dropoff** | `api/admin/analytics/dropoff/route.ts` | Same as conversion with stage exit points | Where users exit the funnel (register but no payment, purchase but no exam, etc.) |
| **courses** | `api/admin/analytics/courses/route.ts` | `Course`, `CourseEnrollment`, `Lecture`, `Progress` | Enrollment counts, completion rates, avg progress per course |
| **lectures** | `api/admin/analytics/lectures/route.ts` | `Lecture`, `Progress` | Views, avg watch time, completion rate, popular lectures |
| **mcq** | `api/admin/analytics/mcq/route.ts` | `MCQAttempt`, `MCQResult`, `Question` | Attempts, avg score, pass rate, topic difficulty breakdown |
| **cq** | `api/admin/analytics/cq/route.ts` | `CQAttempt`, `CQResult`, `CQQuestion` | Attempts, avg score, pass rate |
| **payments** | `api/admin/analytics/payments/route.ts` | `Payment` (already queried in revenue; separate section) | Transaction volume, refund rate, payment method distribution, pending payments |
| **acquisition** | `api/admin/analytics/acquisition/route.ts` | `User` with `createdAt` | Signup source (if tracked), referral metrics, organic vs paid |
| **search** | `api/admin/analytics/search/route.ts` | `AnalyticsSearchQuery` | Popular search terms, zero-result searches, search-to-purchase conversion |
| **devices** | `api/admin/analytics/devices/route.ts` | `AnalyticsSession` user-agent parsing | Device/browser/OS breakdown |
| **geo** | `api/admin/analytics/geo/route.ts` | `User` location or `AnalyticsSession` IP-based | Country/city distribution |

### 12 Section UI Components — Need Building

The `AnalyticsPage` has a tab for each section, but most show only a "Coming soon" placeholder. Sections needing full dashboard UI:

| Section | Suggested charts / features |
|---|---|
| **RetentionDashboard** | Cohort retention heatmap (Recharts heatmap or custom grid), churn trend line |
| **ConversionDashboard** | Funnel chart (Recharts `BarChart` with cascade), stage-by-stage metrics |
| **DropoffDashboard** | Exit rate by stage, comparison bar chart |
| **CoursesDashboard** | Course performance table/summary, enrollment trends |
| **LecturesDashboard** | Top lectures table, engagement metrics |
| **MCQDashboard** | Score distribution, pass/fail rates, topic difficulty |
| **CQDashboard** | Score distribution, pass rates |
| **PaymentsDashboard** | Transaction history table, revenue by method (separate from Revenue section) |
| **AcquisitionDashboard** | Source breakdown donut chart, signup trend |
| **SearchDashboard** | Search terms table, zero-result rate |
| **DevicesDashboard** | Device/OS donut charts |
| **GeoDashboard** | Map or region table |

### 3 Enhancement Items

| Item | Description | Effort |
|---|---|---|
| **Drill-down** | Click on a chart segment → see per-item breakdown (e.g., click revenue source → list of items in that source) | Medium |
| **Scheduled reports** | Cron job (`scripts/aggregate-analytics.ts`) to generate periodic snapshots + email reports | Medium |
| **Performance optimization** | Materialized views or aggregation tables for large-scale data (>100K records) | Small/Medium |

---

## Current State Summary

```
Analytics Feature Completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Endpoints    ████████░░░░░░░░░░░░  45% (9/20 full)
UI Dashboards    ██░░░░░░░░░░░░░░░░░░  25% (4/16 built)
Chart Library    ████████████████████ 100% (4 shared, reusable)
Core Platform    ████████████████████ 100% (store, types, hooks, routing, sidebar)
Build Health     ████████████████████ 100% (zero TS errors, zero build errors)
```

The 4 built dashboards (overview, revenue, students, realtime) are production-ready with real data queries. The remaining 12 need both API logic and UI components.
