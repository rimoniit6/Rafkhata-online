# শিক্ষা বাংলা (Shiksha Bangla / Sikkha)

An online education platform for Bangladeshi students from Class 6 to HSC, built with Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Proxy/Middleware, SPA)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + shadcn/ui (50+ Radix components) + `tw-animate-css`
- **State Management**: Zustand (auth, router, exam) + TanStack React Query
- **Database**: PostgreSQL on Supabase via Prisma ORM (24+ models)
- **Auth**: Supabase Auth (email/password + Google OAuth) with HttpOnly cookies
- **File Upload**: UploadThing
- **Validation**: Zod 4 + React Hook Form
- **Charts**: Recharts + TanStack React Table
- **Rich Text**: Tiptap (heading, bold, italic, link, underline, bullet list, ordered list)
- **Math Rendering**: KaTeX, MathJax (MathML fallback)
- **Mind Maps**: Markmap (interactive SVG mind maps from markdown)
- **Animation**: Framer Motion 12
- **Carousel**: Embla Carousel with autoplay
- **UI Components**: Sonner (toasts), Vaul (drawer), Cmdk (command palette), Input OTP, react-day-picker, react-resizable-panels
- **Excel Processing**: xlsx (bulk import/export)
- **Runtime**: Node.js 22+ via tsx
- **Package Manager**: npm
- **Testing**: Vitest with coverage
- **Error Monitoring**: Sentry (configurable, client + server + edge)
- **Rate Limiting**: Upstash Redis (distributed)
- **CSRF Protection**: JWT-based (jose) via proxy.ts
- **Security**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Theming**: next-themes (light/dark/system)

## Features

### Student Features
- **Content Hierarchy**: Browse classes (6-HSC) → subjects → chapters → lectures
- **Lectures**: Rich HTML content with video, audio, PDF resources; premium content gating
- **MCQ Practice**: Chapter-wise MCQ with instant scoring and explanations
- **CQ Practice**: Creative questions with model answers; premium answer locking
- **Exams**: Create custom exams with random MCQ/CQ; timed with negative marking
- **CQ Exam Packages**: Timed CQ exams with image upload, teacher annotation, answer modes (flexible/text-only/image-only/complete-image-only), auto-publish, pass/fail grading
- **MCQ Exam Packages**: Timed MCQ exam sets with grading
- **Courses**: Structured courses with lessons, exam schedules, enrollments, certificates
- **Board Questions**: Past board exam questions filtered by board, year, subject
- **Suggestions**: Exam suggestions with pricing
- **Search**: Global search across lectures, MCQ, CQ, suggestions
- **Dashboard**: Stats, recently viewed, bookmarks, purchase history
- **Payment & Access**: Per-content pricing via bKash/Nagad/Rocket; manual verification

### Admin Features
- **Content Management**: Full CRUD for classes, subjects, chapters, lectures
- **Question Bank**: Manage MCQ and CQ with bulk import via Excel (xlsx)
- **CQ Exam Packages**: Create exam sets with configurable answer modes, grading settings, pass marks, image limits; view/grading interface with image annotation, partial marking, bulk grade by question
- **MCQ Exam Packages**: Manage MCQ exam sets with question assignment
- **Courses**: Full course management — lessons, schedules, pricing, purchases, progress tracking
- **Exam Builder**: Create exams with question assignment
- **Board Questions**: Manage past board questions with filters
- **Bundles & Packages**: Create content bundles and exam packages with discounts
- **Featured Content**: Homepage featured section manager (lectures, MCQ, CQ, bundles, packages, suggestions, exams, courses)
- **Payment Review**: Approve/reject payment transactions
- **CMS**: Banners, notices, notifications, FAQs, testimonials, suggestions, notes, teacher moderators
- **Settings**: Site-wide configuration (SEO, homepage, social links, contact)
- **User Management**: View and manage users, content purchases
- **Hierarchy Manager**: Visual class-subject-chapter hierarchy
- **Content Types**: Manage dynamic content type registry
- **Dashboard**: Stats, charts, payment analytics
- **Database Tools**: Export/import database (super admin)

### Security
- Session-based auth via Supabase Auth with HttpOnly cookies
- Supabase Auth with email/password and Google OAuth
- **Distributed rate limiting** via Upstash Redis (auth, login, general API, upload, password reset, admin mutations)
- **CSRF protection** on all state-changing non-admin forms (JWT-based tokens via proxy.ts)
- Role-based access control (student, admin, super_admin)
- Input validation via Zod schemas
- Error handling with custom error classes (try-catch on all API routes)
- SSRF protection on PDF proxy
- Premium content stripping at API level
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Payment race condition prevention**: DB unique constraint + P2002 handling
- **Root error boundary**: `global-error.tsx` catches layout crashes with Sentry reporting

## Project Structure

```
src/
├── app/                 # Next.js App Router (SPA entry, API routes)
│   ├── admin/           # Admin panel pages (30+ route groups)
│   ├── api/             # 80+ API endpoints (auth, content, payment, admin)
│   └── global-error.tsx # Root error boundary
├── components/          # React components
│   ├── admin/           # Admin panel components (30+ page components)
│   ├── auth/            # Login, register, password reset
│   ├── classes/         # Class/subject/chapter pages
│   ├── cq/              # Creative question components
│   ├── exam/            # Exam system (builder, viewer, results)
│   ├── home/            # Home page sections (hero, featured, classes, notices)
│   ├── layout/          # AppShell, Header, Footer, BottomNav
│   ├── lecture/         # Lecture viewer, content rendering
│   ├── mcq/             # MCQ practice, exam, results
│   ├── notice/          # Notice board
│   ├── payment/         # Payment forms, history, premium paywall
│   ├── premium/         # Premium lock/paywall components
│   ├── search/          # Global search
│   ├── shared/          # RouteSync, AppNavigationBridge, JSON-LD, etc.
│   ├── suggestion/      # Suggestion components
│   └── ui/              # shadcn/ui components + ImageUploader, SafeImage
├── constants/           # App constants
├── features/            # Feature-specific code (domain-driven)
│   ├── course/          # Course feature (admin + student)
│   ├── cq-exam/         # CQ exam packages (admin + grading)
│   ├── mcq-exam/        # MCQ exam packages (admin)
│   └── online-class/    # Online class (planned)
├── hooks/               # Custom hooks (40+ hooks)
├── lib/                 # Utilities
│   ├── db.ts            # Prisma client singleton
│   ├── auth/            # Auth utilities
│   ├── api-utils.ts     # API helpers (withAdmin, withSuperAdmin, rate limiting)
│   ├── errors.ts        # Custom error classes
│   ├── urls.ts          # Route → URL mapping, URL parsing
│   ├── password.ts      # Password hashing/verification
│   ├── rate-limit.ts    # Rate limiting configuration
│   ├── fetch-json.ts    # HTTP client with retries & error handling
│   ├── query-keys.ts    # TanStack Query key factory
│   └── __tests__/       # Unit tests
├── providers/           # React context providers
├── services/            # Business logic layer (purchase, access control, etc.)
├── store/               # Zustand stores (auth, router, exam)
└── types/               # TypeScript type definitions
```

## Prerequisites

- **Node.js** v22+ (runtime)
- **npm** (package manager)
- **PostgreSQL** database (Supabase recommended)
- **Upstash Redis** account (for rate limiting)
- **UploadThing** account (for file uploads)
- **Supabase** project (for auth + database)

## Getting Started

```bash
# 1. Clone and install dependencies
git clone https://github.com/rimoniit6/sikkha.git
cd sikkha
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables table below)

# 3. Generate Prisma client
npm run db:generate

# 4. Push database schema
npm run db:push

# 5. Seed the database
npx prisma db seed

# 6. Create a super admin user (CLI only — API endpoint disabled for safety)
npm run create-super-admin

# 7. Start development server
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (Supabase pooler) |
| `DIRECT_URL` | Direct PostgreSQL connection for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `UPLOADTHING_SECRET` | UploadThing secret key |
| `UPLOADTHING_APP_ID` | UploadThing app ID |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (rate limiting) |
| `CSRF_SECRET` | 32+ char secret for CSRF JWT signing |
| `SENTRY_DSN` | Sentry DSN for error monitoring (optional) |
| `NEXT_PUBLIC_SENTRY_DSN` | Public Sentry DSN for client-side errors (optional) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server on port 3000 (Turbopack) |
| `npm run build` | Production build + standalone output |
| `npm run analyze` | Build with bundle analyzer |
| `npm run start` | Start production server |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:reset` | Reset database and re-run migrations |
| `npm run create-super-admin` | Create a super admin user (CLI) |
| `npm run list-super-admins` | List all super admin users |
| `npm run revoke-super-admin` | Revoke super admin role |
| `npm run sync-supabase-roles` | Sync roles from DB to Supabase metadata |
| `npm run seed:content` | Seed content data |

## Tests

198+ unit tests across 8 test files:

| Test File | Tests | What it covers |
|-----------|-------|----------------|
| `api-client.test.ts` | 46 | HTTP client, retries, error handling, interceptors |
| `errors.test.ts` | 36 | Custom error classes, error formatting |
| `access-control.test.ts` | 31 | Content type resolution, class level detection, title resolution, access checking (subscription, payment, bundle, pending) |
| `auth.test.ts` | 20 | Auth utilities, token handling |
| `validations.test.ts` | 8 | Input validation schemas |
| `error-history.test.ts` | 7 | Error history tracking |
| `safe-transaction.test.ts` | 5 | DB transaction safety |
| `purchase.service.test.ts` | 10 | Payment creation, subscription lookup, purchase history, admin access |

## API Overview

80+ API endpoints organized as:

- **Auth** (7): login, register, logout, profile, password management
- **Content** (25+): classes, subjects, chapters, lectures, MCQ, CQ, bundles, packages, suggestions, courses, board questions, search
- **CQ Exam Packages** (10+): create sets, submit answers, grade submissions, bulk grading, annotated images
- **Payment** (7): create, verify, check access, batch check, purchase history
- **Admin** (35+): full CRUD for all content types, featured content, user management, payment review, CMS, settings, database tools (all POST/PUT/DELETE rate-limited)
- **Courses** (5+): course CRUD, lessons, enrollments, purchases, progress
- **User** (2): dashboard, payment history
- **Other** (3): file upload, PDF proxy, health check

### Payment Model

Per-content pricing (no subscriptions). Students pay for individual lectures, MCQ sets, CQ, exams, bundles, packages, or courses via bKash/Nagad/Rocket with manual admin verification.

## Architecture

- **SPA Router**: Custom Zustand-based client-side router (40+ routes) with URL sync via `RouteSync` component
- **No SSR pages**: Single `page.tsx` entry point with dynamic imports; all pages client-side rendered
- **Proxy/Middleware** (`src/proxy.ts`): JWT verification, route-based access control (admin/public/authenticated), CSRF protection for non-admin mutations, security headers injection
- **Admin Route Protection**: Handled by proxy.ts (session auth + role query from DB) + `withAdmin()` guard with rate limiting for POST/PUT/DELETE
- **Premium Gating**: Content stripping at API level + frontend lock UI
- **Database**: PostgreSQL on Supabase via Prisma with 24+ models (User, Lecture, MCQ, CQ, Course, Exam, ContentType, FeaturedContent, Payment, etc.)
- **File Storage**: UploadThing for image/file uploads
- **Auth**: Supabase Auth with email/password and Google OAuth
- **Rate Limiting**: Upstash Redis (distributed, persistent across serverless instances) + in-memory rate limiting on `withAdmin()` wrapper
- **CSRF Protection**: JWT-based tokens (HttpOnly cookie + `x-csrf-token` header) enforced by proxy.ts on all non-admin mutation routes; public routes exempted
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy via proxy.ts
- **Error Monitoring**: Sentry integration (client, server, edge) with instrumentation.ts
- **CI/CD**: GitHub Actions workflow — lint + test on push/PR to main

## CI/CD

```yaml
# .github/workflows/ci.yml
- npm ci
- npm run lint
- npm test
```

Runs on every push/PR to `main` using Node.js 22 with npm caching.
