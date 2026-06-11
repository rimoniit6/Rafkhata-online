# শিক্ষা বাংলা (Shiksha Bangla / Sikkha)

An online education platform for Bangladeshi students from Class 6 to HSC, built with Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router, API Routes, SPA)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (50+ Radix components)
- **State Management**: Zustand (auth, router, exam) + TanStack React Query
- **Database**: PostgreSQL on Supabase via Prisma ORM
- **Auth**: Supabase Auth (Google OAuth) + custom JWT with bcryptjs
- **File Upload**: UploadThing
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts + TanStack React Table
- **Content**: KaTeX (math rendering), DOMPurify (HTML sanitization)
- **Animation**: Framer Motion
- **Runtime**: Bun
- **Rate Limiting**: Upstash Redis (distributed)
- **CSRF Protection**: JWT-based (jose)
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
- JWT-based authentication with HttpOnly cookies
- Supabase Auth with Google OAuth
- **Distributed rate limiting** via Upstash Redis (auth, login, general API, upload, password reset)
- **CSRF protection** on all state-changing forms (JWT-based tokens)
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
│   ├── api/        # 80+ API endpoints
│   └── page.tsx    # SPA entry point
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

## Getting Started

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Seed the database
bunx prisma db seed

# Start development server
bun run dev

# Build for production
bun run build
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
| `SUPER_ADMIN_EMAIL` | Super admin login email |
| `SUPER_ADMIN_PASSWORD` | Super admin login password |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (rate limiting) |
| `CSRF_SECRET` | 32+ char secret for CSRF JWT signing |

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 (Turbopack) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run test` | Run tests |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:reset` | Reset database migrations |

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
- **Middleware/Proxy** (`src/proxy.ts`): JWT verification, route-based access control, security headers injection
- **Premium Gating**: Content stripping at API level + frontend lock UI
- **Database**: PostgreSQL on Supabase via Prisma with 24+ models
- **File Storage**: UploadThing for image/file uploads
- **Auth Providers**: Custom JWT + Supabase Auth (Google OAuth)
- **Rate Limiting**: Upstash Redis (distributed, persistent across serverless instances)
- **CSRF Protection**: JWT-based tokens (HttpOnly cookie + `x-csrf-token` header)
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy via middleware