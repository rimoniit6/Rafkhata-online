# শিক্ষা বাংলা (Shiksha Bangla / Sikkha)

An online education platform for Bangladeshi students from Class 6 to HSC, built with Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Proxy/Middleware, SPA)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (50+ Radix components)
- **State Management**: Zustand (auth, router, exam) + TanStack React Query
- **Database**: PostgreSQL on Supabase via Prisma ORM
- **Auth**: Supabase Auth (email/Google OAuth)
- **File Upload**: UploadThing
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts + TanStack React Table
- **Content**: KaTeX (math rendering), MathJax (MathML fallback), DOMPurify (HTML sanitization)
- **Animation**: Framer Motion
- **Runtime**: Bun
- **Rate Limiting**: Upstash Redis (distributed)
- **CSRF Protection**: JWT-based (jose) via proxy.ts
- **Security**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

## Features

### Student Features
- **Content Hierarchy**: Browse classes (6-HSC) → subjects → chapters → lectures
- **Lectures**: Rich HTML content with video, audio, PDF resources; premium content gating
- **MCQ Practice**: Chapter-wise MCQ with instant scoring and explanations
- **CQ Practice**: Creative questions with model answers; premium answer locking
- **CQ Exam Packages**: Timed CQ exams with image upload, teacher annotation, answer modes (flexible/text-only/image-only/complete-image-only), auto-publish, pass/fail grading
- **Exams**: Create custom exams with random MCQ/CQ; timed with negative marking
- **Board Questions**: Past board exam questions filtered by board, year, subject
- **Suggestions**: Exam suggestions for quick preparation
- **Search**: Global search across lectures, MCQ, CQ, suggestions
- **Dashboard**: Stats, recently viewed, bookmarks, purchase history
- **Payment & Access**: Per-content pricing via bKash/Nagad/Rocket; manual verification

### Admin Features
- **Content Management**: Full CRUD for classes, subjects, chapters, lectures
- **Question Bank**: Manage MCQ and CQ with bulk import via Excel
- **CQ Exam Packages**: Create exam sets with configurable answer modes, grading settings, pass marks, image limits
- **Grading Interface**: View and grade student submissions with image annotation, partial marking, bulk grade by question
- **Exam Builder**: Create exams with question assignment
- **Board Questions**: Manage past board questions with filters
- **Bundles & Packages**: Create content bundles and exam packages with discounts
- **Payment Review**: Approve/reject payment transactions
- **CMS**: Banners, notices, notifications, FAQs, testimonials, suggestions
- **Settings**: Site-wide configuration
- **User Management**: View and manage users
- **Dashboard**: Stats, charts, payment analytics
- **Database Tools**: Export/import database (super admin)

### Security
- Session-based auth via Supabase Auth with HttpOnly cookies
- Supabase Auth with email/password and Google OAuth
- **Distributed rate limiting** via Upstash Redis (auth, login, general API, upload, password reset)
- **CSRF protection** on all state-changing forms (JWT-based tokens via proxy.ts)
- Role-based access control (student, admin, super_admin)
- Input validation via Zod schemas
- Error handling with custom error classes
- SSRF protection on PDF proxy
- Premium content stripping at API level
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Payment race condition prevention**: DB unique constraint + P2002 handling

## Project Structure

```
src/
├── app/            # Next.js App Router (SPA entry, API routes)
│   └── api/        # 80+ API endpoints
├── components/     # React components
│   ├── admin/      # Admin panel components
│   ├── auth/       # Login, register, password reset
│   ├── classes/    # Class/subject/chapter pages
│   ├── cq/         # Creative question components
│   ├── exam/       # Exam system
│   ├── home/       # Home page sections
│   ├── layout/     # AppShell, Header, Footer, BottomNav, AdminLayout
│   ├── lecture/    # Lecture viewer
│   ├── mcq/        # MCQ components
│   ├── notice/     # Notice board
│   ├── payment/    # Payment forms and history
│   ├── premium/    # Premium lock/paywall components
│   ├── search/     # Global search
│   ├── shared/     # Shared reusable components
│   ├── suggestion/ # Suggestion components
│   └── ui/         # shadcn/ui components
├── constants/      # App constants
├── features/       # Feature-specific logic (cq-exam, etc.)
├── hooks/          # Custom hooks (useContentAccess, useBoardYears, etc.)
├── lib/            # Utilities (db, auth, config, errors, validations, etc.)
├── providers/      # React context providers
├── services/       # API client service
├── store/          # Zustand stores (auth, router, exam)
└── types/          # TypeScript type definitions
```

## Prerequisites

- **Bun** v1.3+ (runtime)
- **PostgreSQL** database (Supabase recommended)
- **Upstash Redis** account (for rate limiting)
- **UploadThing** account (for file uploads)
- **Supabase** project (for auth + database)

## Getting Started

```bash
# 1. Clone and install dependencies
git clone https://github.com/rimoniit6/sikkha.git
cd sikkha
bun install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables table below)

# 3. Generate Prisma client
bun run db:generate

# 4. Push database schema
bun run db:push

# 5. Seed the database
bunx prisma db seed

# 6. Create a super admin user (CLI only — API endpoint disabled for safety)
bun run create-super-admin

# 7. Start development server
bun run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (Supabase) |
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

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 (Turbopack) |
| `bun run build` | Production build + standalone output |
| `bun run start` | Start production server |
| `bun run test` | Run tests (Bun test runner) |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run create-super-admin` | Create a super admin user (CLI) |
| `bun run list-super-admins` | List all super admin users |
| `bun run revoke-super-admin` | Revoke super admin role |
| `bun run sync-supabase-roles` | Sync roles from DB to Supabase metadata |

## API Overview

80+ API endpoints organized as:

- **Auth** (7): login, register, logout, profile, password management
- **Content** (25+): classes, subjects, chapters, lectures, MCQ, CQ, bundles, packages, suggestions, board questions, search
- **CQ Exam Packages** (10+): create sets, submit answers, grade submissions, bulk grading, annotated images
- **Payment** (7): create, verify, check access, purchase history
- **Admin** (30+): full CRUD for all content types, user management, payment review, CMS, settings, database tools
- **User** (2): dashboard, payment history
- **Other** (3): file upload, PDF proxy, health check

### Payment Model

Per-content pricing (no subscriptions). Students pay for individual lectures, MCQ sets, CQ, exams, bundles, or packages via bKash/Nagad/Rocket with manual admin verification.

## Architecture

- **SPA Router**: Custom Zustand-based client-side router (35+ routes)
- **No SSR pages**: Single `page.tsx` entry point with dynamic imports
- **Proxy/Middleware** (`src/proxy.ts`): JWT verification, route-based access control (admin/public/authenticated), CSRF protection for non-admin mutations, security headers injection
- **Admin Route Protection**: Handled by proxy.ts (session auth + role query from DB) + `withAdmin()` guard in each route handler
- **Premium Gating**: Content stripping at API level + frontend lock UI
- **Database**: PostgreSQL on Supabase via Prisma with 24+ models
- **File Storage**: UploadThing for image/file uploads
- **Auth**: Supabase Auth with email/password and Google OAuth
- **Rate Limiting**: Upstash Redis (distributed, persistent across serverless instances)
- **CSRF Protection**: JWT-based tokens (HttpOnly cookie + `x-csrf-token` header) enforced by proxy.ts on all non-admin mutation routes
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy via proxy.ts
