# Architecture

## Overview

শিক্ষা বাংলা (Sikkha) is a Next.js 16 App Router application serving a Bangladeshi online learning platform. It uses a hybrid SPA-in-SSR architectural pattern where most page transitions happen client-side via a Zustand-based virtual router, while SEO-critical pages use server-side rendering.

## High-Level Architecture

```
Client Browser
    |
    |-- CDN (Vercel Edge)
    |
    v
Next.js App Router (Node.js)
    |
    |-- [...slug] SPA Router (client-side)
    |-- /admin/* (admin panel)
    |-- /api/* (85+ REST endpoints)
    |
    v
Services Layer
    |-- Server Services (PurchaseService, ContentService)
    |-- Client API Services (courseService, bookmarkService)
    |
    v
Lib Layer
    |-- Database (Prisma + PostgreSQL)
    |-- Auth (Supabase)
    |-- Validation (Zod)
    |-- Error Handling
    |-- Rate Limiting (Upstash Redis)
    |-- Cache Mgmt
    |
    v
External Services
    |-- Supabase Auth
    |-- Upstash Redis
    |-- UploadThing
    |-- Sentry
```

## Key Architectural Decisions

### SPA-in-SSR Pattern
The app uses a catch-all `[...slug]` route that loads a client-side SPA router. This provides app-like navigation while maintaining SEO for initial page loads. Actual Next.js routes exist for:
- SEO-critical pages (/, /classes, /login, /register)
- API routes
- Admin panel
- Exam flow pages

### State Management
- **Zustand**: Client state (auth, router, filters, exam session)
- **React Query**: Server state (data fetching, caching, mutations)
- **URL State**: Route params store navigation state

### Authentication
- Supabase Auth with httpOnly cookies
- Custom User table in PostgreSQL for business logic
- Service role client for admin operations
- Permission-based RBAC

### Content Access Control
Complex multi-level access resolution:
1. Active subscription checks
2. Direct payment verification
3. Bundle purchase checks
4. Content-type cross-matching (board-mcq -> mcq)

## Data Flow

### Page Navigation Flow
1. User clicks link -> useAppNavigation.navigate()
2. RouterStore updates state + pushes URL via Next.js router
3. [...slug]/page.tsx reads route from URL params
4. Client components render based on currentRoute

### API Request Flow
1. Client -> api-client.ts (retry, timeout, CSRF)
2. Middleware -> auth check, rate limiting
3. Route handler -> validation, business logic
4. Response -> standardized { success, data, error, code }

## Database Schema (45 Models)

### Core Content Hierarchy
- ClassCategory -> Subject -> Chapter -> Topic

### Content Types
- Lecture, MCQ, CQ, KnowledgeQuestion

### Exam Systems
- Custom exams (Exam + ExamQuestion + ExamResult)
- MCQ Exam Packages (MCQExamPackage -> MCQExamSet -> ...)
- CQ Exam Packages (CQExamPackage -> CQExamSet -> ...)

### Commerce
- Payment (bkash/nagad/rocket)
- ContentPackage + UserSubscription
- ContentBundle + BundleItem
- Course + CourseEnrollment + CoursePurchase

### Analytics
- AnalyticsEvent, AnalyticsSession, AnalyticsSearchQuery
- AnalyticsAlert, AnalyticsReport

## Security Architecture

See SECURITY.md for detailed security architecture.

## Performance Architecture

See PERFORMANCE.md for detailed performance optimizations.
