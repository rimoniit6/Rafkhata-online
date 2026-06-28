# শিক্ষা বাংলা (Sikkha Bangla) — Complete API Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Audit Summary](#3-audit-summary)
4. [Base Configuration](#4-base-configuration)
5. [Authentication APIs](#5-authentication-apis)
6. [User APIs](#6-user-apis)
7. [Content Hierarchy APIs](#7-content-hierarchy-apis)
8. [MCQ APIs](#8-mcq-apis)
9. [CQ (Creative Question) APIs](#9-cq-creative-question-apis)
10. [Lecture APIs](#10-lecture-apis)
11. [Exam APIs](#11-exam-apis)
12. [Payment & Purchase APIs](#12-payment--purchase-apis)
13. [Bookmark APIs](#13-bookmark-apis)
14. [Progress APIs](#14-progress-apis)
15. [Notes APIs](#15-notes-apis)
16. [Suggestion APIs](#16-suggestion-apis)
17. [Notice APIs](#17-notice-apis)
18. [Search APIs](#18-search-apis)
19. [Bundle APIs](#19-bundle-apis)
20. [Package APIs](#20-package-apis)
21. [MCQ Exam Package APIs](#21-mcq-exam-package-apis)
22. [CQ Exam Package APIs](#22-cq-exam-package-apis)
23. [Board Question APIs](#23-board-question-apis)
24. [Other Public APIs](#24-other-public-apis)
25. [Admin APIs](#25-admin-apis)
26. [Error Handling](#26-error-handling)
27. [Security](#27-security)
28. [Appendix: Response Envelope](#28-appendix-response-envelope)

---

## 1. Project Overview

**Platform:** শিক্ষা বাংলা (Sikkha Bangla) — Bangladesh's online education platform
**Base URL:** `https://sikkhabangla.com` (configurable via `NEXT_PUBLIC_SITE_URL`)
**Language:** Bengali (bn-BD)
**Description:** Provides lectures, MCQs, creative questions (CQ), board questions, exams, and suggestions for Class 6 to HSC students.

---

## 2. Architecture & Tech Stack

### Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **API Layer** | Next.js Route Handlers (`/app/api/`) |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | Supabase Auth (cookie-based sessions) |
| **Rate Limiting** | Upstash Redis (Sliding Window) |
| **File Upload** | Uploadthing |
| **Caching** | Next.js `unstable_cache`, CDN cache headers |
| **Validation** | Zod schemas |
| **Security** | CSRF (JWT tokens), CSP headers, HTML sanitization |
| **Math Rendering** | KaTeX + MathJax (fallback) |
| **Frontend** | React + Tailwind CSS |
| **State** | TanStack Query (React Query) |

### API Pattern
- **Route:** `/api/{resource}` — Public; `/api/{resource}/{id}` — Detail
- **Auth Required:** `/api/user/*`, `/api/bookmarks/*`, `/api/progress/*`, `/api/notes/*`
- **Admin Only:** `/api/admin/*`
- **Method Convention:**
  - `GET` — Read/List
  - `POST` — Create
  - `PUT` / `PATCH` — Update
  - `DELETE` — Delete/Deactivate

### Response Envelope

All API responses follow a standardized envelope format:

```json
// Success:
{ "success": true, "data": { ... }, "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Success (array data with pagination):
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 200, "totalPages": 10 } }

// Mutation success:
{ "success": true, "data": { "message": "...", ... } }

// Error:
{ "success": false, "error": "Bengali error message", "code": "ERROR_CODE", "details": [...] }

// Note: Frontend `api-client.ts` and `fetchJSON` both auto-unwrap the envelope,
// so consumers receive the `data` payload directly without manual unwrapping.
```

---

## 3. Audit Summary

### ✅ Production Ready

| Criteria | Status | Details |
|----------|--------|---------|
| **No hardcoded data** | ✅ Pass | All dynamic data (content types, labels, messages) from DB with fallbacks. Config from SiteSetting model. |
| **Authorization** | ✅ Pass | Cookie-based Supabase auth. Middleware at `/proxy.ts` level. Per-route `verifyAuth()`, `requireAuth()`, `requireAdmin()`, `requireSuperAdmin()`. |
| **Role-Based Access** | ✅ Pass | 3 roles: `SUPER_ADMIN`, `ADMIN`, `STUDENT`. Admin routes enforce via `withAdmin()`. Super admin routes (`database/*`) enforce via `withSuperAdmin()`. |
| **Pagination** | ✅ Pass | Consistent pagination pattern: `page`, `limit`, `total`, `totalPages`. Default page=1, limit=20. Max limit=100. |
| **Error Handling** | ✅ Pass | Centralized error system in `src/lib/errors.ts`. Structured `AppError` classes. `handleApiError()` → safe JSON response. Prisma errors caught and mapped. |
| **Rate Limiting** | ✅ Pass | Upstash Redis sliding window implemented across all public routes (60 req/min general, 10 req/15min auth, 10 req/min upload). |
| **Validation** | ✅ Pass | Zod schemas in `src/lib/validations.ts`. `validateBody()` helper. Prisma schema-level validation. |
| **Security** | ✅ Pass | CSP headers (proxy.ts), CSRF protection (JWT tokens for mutations), XSS sanitization (Prisma middleware auto-sanitizes HTML fields), SQL injection protected by Prisma parameterized queries. |
| **API Consistency** | ✅ Pass | All routes (public, user-facing, and admin) use `{ success, data, pagination }` envelope format. Error responses consistently use `{ success: false, error }`. |

### ⚠️ Remaining Considerations

1. **No API Versioning**: All routes under `/api/` — no version prefix.
2. **No OpenAPI/Swagger spec**: Documentation would need to be maintained externally.
3. **CSRF Exemption**: Admin routes are CSRF-exempt by design.

---

## 4. Base Configuration

### `GET /api/config`

Public site configuration. Returns all dynamic site settings.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "siteName": "শিক্ষা বাংলা",
    "siteDescription": "...",
  "contactEmail": "",
  "contactPhone": "",
  "contactAddress": "",
  "facebook": "",
  "youtube": "",
  "telegram": "",
  "bkash": "017XXXXXXXX",
  "nagad": "018XXXXXXXX",
  "rocket": "016XXXXXXXX",
  "logo": "",
  "favicon": "",
  "heroBadge": "",
  "heroTitle": "",
  "heroSubtitle": "",
  "statsSubtitle": "",
  "footerDescription": "",
  "premiumFeatures": [],
  "mcqFeatures": [],
  "searchSuggestions": [],
  "homepageClassesBadge": "",
  "homepageClassesTitle": "",
  "homepageClassesSubtitle": "",
  "homepageBoardTitle": "",
  "homepageBoardSubtitle": "",
  "homepageMcqTitle": "",
  "homepageMcqSubtitle": "",
  "homepageFaqTitle": "",
  "homepageFaqSubtitle": "",
  "homepageTestimonialsTitle": "",
  "homepageTestimonialsSubtitle": "",
  "homepageStatsTitle": "",
  "homepageStatsSubtitle": "",
  "homepageFeaturedTitle": "",
  "homepageFeaturedSubtitle": "",
  "homepagePremiumTitle": "",
  "homepagePremiumSubtitle": "",
  "messages": {
    "contentComingSoon": "কন্টেন্ট শীঘ্রই আসবে",
    "chaptersComingSoon": "এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে",
    "chapterContentSoon": "এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে",
    "mcqComingSoon": "শীঘ্রই নতুন প্রশ্ন যোগ করা হবে",
    "cqComingSoon": "শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে",
    "lectureComingSoon": "শীঘ্রই নতুন লেকচার যোগ করা হবে",
    "boardComingSoon": "শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে",
    "contentLoadError": "কন্টেন্ট লোড করতে সমস্যা হয়েছে",
    "contentTypeSoon": "শীঘ্রই কন্টেন্ট আসবে",
    "noQuestionsFound": "কোনো প্রশ্ন পাওয়া যায়নি",
    "footerClassesSoon": "শীঘ্রই শ্রেণি যোগ করা হবে",
    "footerContactSoon": "শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে",
    "subjectsComingSoon": "এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে"
    }
  }
}
```

### `GET /api/health`

**Auth:** None
**Response:**
```json
{
  "status": "healthy" | "degraded",
  "timestamp": "2026-06-13T...",
  "checks": { "database": true, "supabase": true, "redis": true },
  "errors": {}
}
```

### `GET /api/csrf-token`

Get a fresh CSRF token (required for all POST/PUT/PATCH/DELETE mutations).

**Auth:** None
**Response:** Sets `csrf_token` cookie + returns JSON
```json
{ "token": "jwt_token_string" }
```

---

## 5. Authentication APIs

Auth uses **Supabase Auth** with **httpOnly cookies**. The browser sends cookies automatically. For Flutter, you must manage cookies or use the Supabase Flutter SDK.

### `POST /api/auth/login`

Login with email + password.

**Auth:** None
**CSRF:** Required
**Body:**
```json
{ "email": "user@example.com", "password": "password123" }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid...",
      "email": "user@example.com",
      "name": "User name",
      "role": "STUDENT",
      "avatar": null,
      "phone": null,
      "institute": null,
      "classLevel": null,
      "board": null,
      "isPremium": false,
      "premiumExpiry": null
    }
  }
}
```
**Errors:** `400` (missing fields), `401` (wrong email/password)

### `POST /api/auth/logout`

**Auth:** Required (session cookie)
**CSRF:** Required
**Response:** `{ "success": true, "data": { "message": "সফলভাবে লগআউট হয়েছে" } }`

### `GET /api/auth/me`

Get currently authenticated user. Admins can pass `?userId=X` to view another user.

**Auth:** Optional (returns 401 if not authenticated)
**Rate Limited:** Yes
**Params:** `?userId=xxx` (admin only)
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "role": "STUDENT",
      "avatar": null,
      "phone": null,
      "institute": null,
      "classLevel": null,
      "board": null,
      "isVerified": true,
      "isPremium": false,
      "premiumExpiry": null,
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  }
}
```

### `GET /api/auth/callback`

OAuth callback handler (for Supabase OAuth providers).

**Auth:** None
**Params:** `?code=xxx&next=/path`

---

## 6. User APIs

### `GET /api/user/profile`

Get authenticated user's profile.

**Auth:** Required
**Response:** `{ "success": true, "data": { "user": { ... } } }`

### `PUT /api/user/profile`
### `PATCH /api/user/profile`

Update authenticated user's profile.

**Auth:** Required
**CSRF:** Required
**Body:**
```json
{
  "name": "New Name",
  "phone": "017XXXXXXX",
  "institute": "School Name",
  "classLevel": "class-6",
  "board": "dhaka",
  "avatar": "url"
}
```
**Response:** `{ "success": true, "data": { "user": { ... } } }`

### `GET /api/user/dashboard`

Get dashboard data for the authenticated user.

**Auth:** Required
**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "completedLectures": 5,
      "totalLectures": 100,
      "avgMcqScore": 75,
      "savedQuestions": 10,
      "isPremium": false,
      "premiumExpiry": null
    },
    "recentLectures": [
      { "id": "...", "title": "...", "subject": "...", "progress": 80 }
    ],
    "recentExams": [
      { "id": "...", "subject": "পরীক্ষা", "score": 80, "total": 100, "date": "১৩ জুন, ২০২৬" }
    ],
    "bookmarkedQuestions": [
      { "id": "...", "text": "MCQ প্রশ্ন", "type": "mcq" }
    ],
    "paymentHistory": [
      { "id": "...", "planName": "...", "amount": 100, "date": "...", "status": "completed|pending|failed" }
    ]
  }
}
```

### `GET /api/user/subscriptions`

Get user's subscription history.

**Auth:** Required
**Rate Limited:** Yes
**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "...",
        "packageId": "...",
        "packageName": "১ মাসের প্যাকেজ",
        "packageThumbnail": null,
        "durationLabel": "৩০ দিন",
        "classLevel": "ssc",
        "classLabel": "এসএসসি",
        "startDate": "2026-01-01T00:00:00Z",
        "endDate": "2026-01-31T00:00:00Z",
        "isActive": true,
        "isExpired": false,
        "daysRemaining": 18,
        "paymentId": "..."
      }
    ],
    "activeCount": 1,
    "expiringSoon": []
  }
}
```

### `GET /api/user/payments`

Get user's payment history.

**Auth:** Required
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "contentType": "mcq",
      "contentId": "...",
      "contentTitle": "Question text...",
      "amount": 50,
      "method": "bkash",
      "transactionId": "TRX123",
      "status": "approved",
      "adminNote": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "reviewedAt": null
    }
  ]
}
```

### `GET /api/user/recent-lectures`

Get recently viewed lectures.

**Auth:** Required
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Lecture Title",
      "subject": "বাংলা",
      "chapter": "প্রথম অধ্যায়",
      "progress": 75,
      "viewedAt": "2026-06-13T..."
    }
  ]
}
```

### `GET /api/user/feedback`
### `POST /api/user/feedback`

User feedback/support tickets.

**Auth:** Required
**CSRF (POST):** Required

**GET Params:** `?status=pending&page=1&limit=20`

**POST Body:**
```json
{ "subject": "Problem title", "message": "Description..." }
```

**POST Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "subject": "...",
    "status": "pending",
    "messages": [{ "senderId": "...", "senderRole": "user", "message": "..." }]
  }
}
```

### `GET /api/user/feedback/{id}/messages`

Get messages for a specific feedback thread.

---

## 7. Content Hierarchy APIs

### `GET /api/classes`

List all active class categories with aggregated content counts.

**Auth:** None
**Cache:** Public, 5 min
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "...",
        "name": "ষষ্ঠ শ্রেণি",
        "slug": "class-6",
        "subjectCount": 10,
        "icon": "BookOpen",
        "gradient": "from-emerald-400 to-teal-600",
        "description": null,
        "color": null,
        "contentCounts": {
          "lectures": 0,
          "freeLectures": 0,
          "mcqs": 150,
          "freeMcqs": 100,
          "cqs": 50,
          "freeCqs": 30,
          "boardQuestions": 200,
          "freeBoardQuestions": 150
        },
        "totalContent": 400
      }
    ]
  }
}
```

### `GET /api/classes/{slug}`

Get a single class by slug (e.g., `class-6`, `ssc`, `hsc`).

### `GET /api/subjects/{id}`

Get a single subject by ID.

**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "subject": {
      "id": "...",
      "name": "বাংলা",
      "slug": "bangla",
      "classId": "...",
      "icon": null,
      "color": null,
      "description": null,
      "order": 1,
      "isActive": true,
      "class": { "id": "...", "name": "ষষ্ঠ শ্রেণি", "slug": "class-6" },
      "_count": { "chapters": 10 }
    }
  }
}
```

### `GET /api/chapters/{id}`

Get a single chapter by ID with content counts per content type.

### `GET /api/boards`

List all boards (ঢাকা, রাজশাহী, etc.).

**Response envelope:** `{ success, data }`

### `GET /api/years`

List all exam years.

**Response envelope:** `{ success, data }`

### `GET /api/board-years`

List all board-year combinations.

**Response envelope:** `{ success, data }`

### `GET /api/hierarchy/metadata`

Get hierarchy metadata (class labels, board labels).

**Response envelope:** `{ success, data }`

---

## 8. MCQ APIs

### `GET /api/mcq`

List MCQs with filtering. Three modes: normal, list, exam.

**Auth:** Optional (required for premium content access check)
**Params:**

| Param | Type | Description |
|-------|------|-------------|
| `chapterId` | string | Filter by chapter |
| `classLevel` | string | Filter by class (e.g., `class-6`, `ssc`) |
| `subjectId` | string | Filter by subject |
| `type` | string | `list` (lightweight, paginated), `exam` (shuffled, no answers), or omit for full data |
| `difficulty` | string | `easy`, `medium`, `hard` |
| `board` | string | Board slug |
| `year` | string | Year |
| `isPremium` | boolean | `true`/`false` |
| `page` | number | Default 1 |
| `limit` | number | Default 500 (normal), 20 (list) |

**Normal Mode Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "...",
        "text": "প্রশ্নের বিবরণ",
        "questionImage": null,
        "options": [
          { "key": "A", "text": "অপশন A", "image": null },
          { "key": "B", "text": "অপশন B", "image": null },
          { "key": "C", "text": "অপশন C", "image": null },
          { "key": "D", "text": "অপশন D", "image": null }
        ],
        "correctAnswer": "A",
        "explanation": "ব্যাখ্যা...",
        "explanationImage": null,
        "isPremium": false,
        "price": 0,
        "classLevel": "ssc",
        "subjectId": "...",
        "chapterId": "...",
        "chapterName": "অধ্যায়ের নাম",
        "difficulty": "medium",
        "board": null,
        "year": null,
        "hasAccess": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 500, "totalPages": 25 }
  }
}
```

**List Mode Response (type=list):**
```json
{
  "success": true,
  "data": {
    "questions": [
      { "id": "...", "text": "...", "questionImage": null, "isPremium": false, "price": 0, "classLevel": "ssc", "subjectId": "...", "chapterId": "...", "chapterName": "...", "difficulty": "medium", "board": null, "year": null }
    ],
    "total": 500,
    "freeCount": 300,
    "premiumCount": 200,
    "boardCount": 100,
    "practiceCount": 400
  },
  "pagination": { "page": 1, "limit": 20, "totalPages": 25 }
}
```

**Exam Mode Response (type=exam):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "...", "text": "...", "options": [...],
        "correctAnswer": "",  // Intentionally empty
        "hasExplanation": true,
        "isPremium": false
      }
    ],
    "total": 50,
    "mode": "exam"
  }
}
```

**Note:** For premium MCQs without access, the response returns a stripped version inside the envelope:
```json
{
  "success": true,
  "data": {
    "id": "...", "text": "...", "isPremium": true, "price": 50, "hasAccess": false, "options": [], "correctAnswer": "", "explanation": ""
  }
}
```

### `GET /api/mcq/{id}`

Get single MCQ detail.

**Auth:** Optional
**Params:** None
**Response:** Same as normal MCQ object.

If premium and not purchased, returns (wrapped in envelope):
```json
{
  "success": true,
  "data": {
    "id": "...", "text": "...", "isPremium": true, "price": 50, "chapterId": "...", "chapterName": "...", "hasAccess": false, "pendingPayment": false
  }
}
```

### `POST /api/mcq`
### `PUT /api/mcq/{id}`
### `DELETE /api/mcq/{id}`

Admin operations (require admin role).

---

## 9. CQ (Creative Question) APIs

### `GET /api/cq`

List creative questions.

**Auth:** Optional
**Params:** Same filtering as MCQ (`chapterId`, `classLevel`, `subjectId`, `board`, `year`, `difficulty`, `isPremium`, `type`, `page`, `limit`)

**Normal Mode Response:**
```json
{
  "success": true,
  "data": {
    "cqs": [
      {
        "id": "...",
        "uddeepok": "উদ্দীপকের বিবরণ",
        "uddeepokImage": null,
        "questions": [
          { "id": "...-q1", "label": "ক", "number": 1, "text": "প্রশ্ন ক", "marks": 1, "answer": "উত্তর ক", "questionImage": null, "answerImage": null },
          { "id": "...-q2", "label": "খ", "number": 2, "text": "প্রশ্ন খ", "marks": 2, "answer": "উত্তর খ", "questionImage": null, "answerImage": null },
          { "id": "...-q3", "label": "গ", "number": 3, "text": "প্রশ্ন গ", "marks": 3, "answer": "উত্তর গ", "questionImage": null, "answerImage": null },
          { "id": "...-q4", "label": "ঘ", "number": 4, "text": "প্রশ্ন ঘ", "marks": 4, "answer": "উত্তর ঘ", "questionImage": null, "answerImage": null }
        ],
        "chapterName": "...",
        "subjectName": "...",
        "className": "...",
        "classSlug": "...",
        "subjectId": "...",
        "chapterId": "...",
        "isPremium": false,
        "price": 0,
        "difficulty": "medium",
        "year": null,
        "board": null,
        "hasAccess": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
  }
}
```

**List Mode Response (type=list):**
```json
{
  "success": true,
  "data": {
    "cqs": [
      { "id": "...", "uddeepok": "...", "uddeepokImage": null, "questionCount": 4, "isPremium": false, "price": 0, "difficulty": "medium", "board": null, "year": null, "chapterId": "...", "chapterName": "...", "subjectName": "...", "className": "...", "classSlug": "...", "subjectId": "..." }
    ],
    "total": 100,
    "freeCount": 60,
    "premiumCount": 40
  },
  "pagination": { "page": 1, "limit": 20, "totalPages": 5 }
}
```

### `GET /api/cq/{id}`

Get single CQ detail.

### `POST /api/cq`
### `PUT /api/cq/{id}`
### `DELETE /api/cq/{id}`

Admin operations.

---

## 10. Lecture APIs

### `GET /api/lectures`

List lectures.

**Auth:** Optional
**Params:** `chapterId`, `subjectId`, `classLevel`, `page`, `limit`
**Response envelope:** `{ success, data, pagination }`
**Response:**
```json
{
  "success": true,
  "data": {
    "lectures": [
      {
        "id": "...",
        "title": "লেকচার টাইটেল",
        "content": "HTML content...",
        "thumbnail": null,
        "videoUrl": null,
        "audioUrl": null,
        "pdfUrl": null,
        "chapterName": "...",
        "subjectName": "...",
        "className": "...",
        "classSlug": "...",
        "subjectId": "...",
        "chapterId": "...",
        "progress": 0,
        "order": 1,
        "isPremium": false,
        "price": 0,
        "duration": 30,
        "resources": [
          { "name": "Resource", "url": "https://...", "type": "pdf" }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

### `GET /api/lectures/{id}`

Get single lecture with full content, chapter context, and sibling lecture list.

**Auth:** Optional (required for premium)
**Response envelope:** `{ success, data }`
**Response:** Same as lecture object + `lectures` (sibling list) + `currentIndex`, wrapped in envelope.

If premium and not purchased (wrapped in envelope):
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Lecture Title",
    "thumbnail": null,
    "isPremium": true,
    "price": 50,
    "chapterName": "...",
    "subjectName": "...",
    "className": "...",
    "classSlug": "...",
    "subjectId": "...",
    "chapterId": "...",
    "hasAccess": false,
    "pendingPayment": false
  }
}
```

---

## 11. Exam APIs

### `GET /api/exams`

List exams (published only by default).

**Auth:** None
**Params:** `classLevel`, `subjectId`, `chapterId`, `type` (mcq/cq/mixed), `q` (search), `isActive`, `status`, `page`, `limit`
**Response envelope:** `{ success, data, pagination }`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "পরীক্ষার নাম",
      "description": null,
      "classLevel": "ssc",
      "type": "mcq",
      "duration": 30,
      "totalMarks": 100,
      "marksPerMcq": 1,
      "negativeMarks": 0,
      "year": null,
      "board": null,
      "isPremium": false,
      "price": 0,
      "instructions": null,
      "totalQuestions": 50
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 10, "totalPages": 1 }
}
```

### `GET /api/exams/{id}`

Get exam detail with full questions.

**Auth:** Optional
**Params:** `?showAnswers=true` (admin or after submission)
**Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": "...",
      "title": "...",
      "description": "...",
      "type": "mcq",
      "duration": 30,
      "totalMarks": 100,
      "marksPerMcq": 1,
      "negativeMarks": 0,
      "questions": [
        {
          "id": "...",
          "text": "Question?",
          "options": [
            { "key": "A", "text": "Option A" },
            { "key": "B", "text": "Option B" },
            { "key": "C", "text": "Option C" },
            { "key": "D", "text": "Option D" }
          ],
          "correctAnswer": "A",  // Empty if showAnswers=false for non-admin
          "explanation": "...",  // Empty if showAnswers=false for non-admin
          "marks": 1,
          "order": 1
        }
      ],
      "totalQuestions": 50
    }
  }
}
```

### `POST /api/exams/results`

Submit exam result.

**Auth:** Required
**CSRF:** Required
**Body:**
```json
{
  "examId": "...",
  "score": 80,
  "totalMarks": 100,
  "timeTaken": 1200,
  "answers": { "q1": "A", "q2": "B" }
}
```
**Response (201):** `{ "success": true, "data": { ...examResult } }`

### `GET /api/exams/results`
### `GET /api/exams/results/{userId}`

Get exam results (admin). User sees own results.

---

## 12. Payment & Purchase APIs

### `GET /api/payment`

List payments.

**Auth:** Required
**Rate Limited:** Yes
**Params:** `page`, `limit`, `status`, `contentType`, `userId` (admin only)

Non-admin users only see their own payments.

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "...",
        "userId": "...",
        "amount": 100,
        "method": "bkash",
        "transactionId": "TRX123",
        "paymentNumber": "017XXXXXXXX",
        "screenshot": null,
        "contentType": "mcq",
        "contentId": "...",
        "contentTitle": "Question title",
        "classLevel": null,
        "status": "pending",
        "isActive": true,
        "adminNote": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "createdAt": "...",
        "updatedAt": "...",
        "idempotencyKey": null,
        "user": { "id": "...", "name": "...", "email": "...", "phone": null }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

### `POST /api/payment`

Create a payment request.

**Auth:** Required
**CSRF:** Required
**Rate Limited:** Yes
**Body:**
```json
{
  "amount": 100,
  "method": "bkash",
  "transactionId": "TRX123",
  "paymentNumber": "017XXXXXXXX",
  "screenshot": "uploadthing_url_or_null",
  "contentType": "mcq",
  "contentId": "mcq_id",
  "contentTitle": "Optional title",
  "classLevel": "ssc",
  "idempotencyKey": "client_generated_uuid"
}
```
**Valid methods:** `bkash`, `nagad`, `rocket`

**Important:** `userId` is taken from the authenticated session, NOT from the body.

**Idempotency:** If `idempotencyKey` is provided and a payment with that key already exists, returns the existing payment (200) instead of creating a duplicate (201).

**Checks performed:**
- If user already has an approved payment for this content → error
- If user already has a pending payment for this content → error
- If user bought a bundle containing this content → error
- If user has active subscription covering this content → error

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "পেমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাইয়ের পর আপনার কন্টেন্ট অ্যাক্সেস সক্রিয় হবে।",
    "payment": { ...payment }
  }
}
```

**Duplicate (200):**
```json
{
  "success": true,
  "data": { "message": "পেমেন্ট ইতিমধ্যে প্রক্রিয়াধীন", "payment": { ... } },
  "idempotent": true
}
```

### `GET /api/payment/{id}`

Get single payment detail.

**Auth:** Required (user sees own, admin sees any)
**Rate Limited:** Yes

### `PATCH /api/payment/{id}`
### `PUT /api/payment/{id}`

**Note:** Redirected to `/api/admin/payments`. Returns error message.

### `GET /api/payment/check`

Check if a user has access to specific content.

**Auth:** Optional
**Rate Limited:** Yes
**Params:** `contentType`, `contentId`, `userId` (fallback for unauthenticated)
**Response:**
```json
{
  "success": true,
  "data": {
    "purchased": true,
    "reason": "active_subscription|content_payment|bundle_purchase|exam_package_purchase",
    "pendingPayment": false,
    "subscription": { "id": "...", "packageName": "...", "durationLabel": "...", "endDate": "..." },
    "bundleTitle": "Bundle name"
  }
}
```

### `POST /api/payment/batch-check`

Batch check access for multiple items.

**Auth:** Optional (returns all unpurchased for unauthenticated)
**CSRF:** Required
**Body:**
```json
{
  "items": [
    { "contentType": "mcq", "contentId": "id1" },
    { "contentType": "cq", "contentId": "id2" }
  ]
}
```
**Max items:** 50
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "contentType": "mcq", "contentId": "id1", "purchased": true, "pendingPayment": false },
      { "contentType": "cq", "contentId": "id2", "purchased": false, "pendingPayment": true }
    ]
  }
}
```

### `GET /api/payment/content-info`

Get pricing/content info for a specific item.

**Params:** `contentType`, `contentId`, `classLevel` (for packages)
**Response:** Varies by content type. Generic:
```json
{
  "title": "Content title",
  "price": 100,
  "isPremium": true,
  "contentType": "mcq",
  "contentId": "...",
  "contentTypeLabel": "MCQ",
  "description": "..."
}
```

**For packages:** Additional fields: `originalPrice`, `duration`, `durationLabel`, `classLevel`, `mcqCount`, `cqCount`, `lectureCount`, `totalContent`

**For bundles:** Additional fields: `originalPrice`, `itemCount`, `items: [{ id, contentType, contentId, order }]`

**For exam packages:** Additional fields: `originalPrice`, `totalSets`

### `GET /api/payment/accounts`

Get payment account numbers (bKash, Nagad, Rocket).

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": { "bkash": "017XXXXXXXX", "nagad": "018XXXXXXXX", "rocket": "016XXXXXXXX" }
  }
}
```

### `GET /api/payment/purchases`

Get user's purchase history (approved payments).

**Auth:** Required
**Rate Limited:** Yes
**Response:**
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "...",
        "userId": "...",
        "contentType": "mcq",
        "contentId": "...",
        "amount": 50,
        "isActive": true,
        "createdAt": "...",
        "contentTitle": "...",
        "contentTypeLabel": "MCQ"
      }
    ],
    "total": 5,
    "isPremium": false
  }
}
```

### `GET /api/payment/access`

Check detailed content access (similar to /payment/check but returns full purchase info).

**Auth:** Required
**Rate Limited:** Yes
**Params:** `contentType`, `contentId`
**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "purchase": {
      "id": "...",
      "contentType": "package",
      "contentId": "...",
      "amount": 0,
      "createdAt": "...",
      "subscription": {
        "packageName": "...",
        "durationLabel": "৩০ দিন",
        "endDate": "..."
      }
    },
    "isPremium": false,
    "accessReason": "active_subscription",
    "partialAccess": false
  }
}
```

---

## 13. Bookmark APIs

### `GET /api/bookmarks`

List user's bookmarks.

**Auth:** Required
**Params:** `contentType` (mcq/cq/lecture), `page`, `limit`
**Response:**
```json
{
  "success": true,
  "data": {
    "bookmarks": [
      {
        "id": "...",
        "contentId": "...",
        "contentType": "mcq",
        "title": "Question preview...",
        "createdAt": "..."
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### `POST /api/bookmarks`

Add a bookmark.

**Auth:** Required
**CSRF:** Required
**Body:** `{ "contentId": "...", "contentType": "mcq" }`
**Valid contentTypes:** `mcq`, `cq`, `lecture`
**Response:** `{ "success": true, "data": { "bookmarked": true } }`

### `DELETE /api/bookmarks`

Remove a bookmark.

**Auth:** Required
**CSRF:** Required
**Body:** `{ "contentId": "...", "contentType": "mcq" }`
**Response:** `{ "success": true, "data": { "bookmarked": false } }`

### `GET /api/bookmarks/check`

Check if specific content is bookmarked.

**Auth:** Required
**Params:** `contentId`, `contentType`
**Response:** `{ "success": true, "data": { "isBookmarked": true } }`

### `POST /api/bookmarks/batch-check`

Batch check bookmarks.

**Auth:** Required
**CSRF:** Required
**Body:** `{ "items": [{ "contentId": "...", "contentType": "mcq" }] }`
**Max items:** 100
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "contentId": "...", "contentType": "mcq", "isBookmarked": true }
    ]
  }
}
```

---

## 14. Progress APIs

### `GET /api/progress`

Get progress records for authenticated user.

**Auth:** Required
**Params:** `contentType` (lecture/mcq/cq), `contentId`
**Response:**
```json
{
  "success": true,
  "data": {
    "progress": [
      { "id": "...", "contentId": "...", "contentType": "lecture", "progress": 75, "lastAccessed": "...", "title": "Lecture Title" }
    ]
  }
}
```

### `POST /api/progress`
### `PUT /api/progress`

Update progress for a content item.

**Auth:** Required
**CSRF:** Required
**Body:** `{ "contentId": "...", "contentType": "lecture", "progress": 75 }`
**Progress range:** 0–100
**Also updates:** RecentlyViewed table
**Response:** `{ "success": true, "data": { "progress": 75 } }`

---

## 15. Notes APIs

### `GET /api/notes`

List user's notes.

**Auth:** Required
**Params:** `contentType`, `contentId`, `page`, `limit`
**Response envelope:** `{ success, data, pagination }`
**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "userId": "...", "contentId": "...", "contentType": "lecture", "content": "Note text...", "createdAt": "...", "updatedAt": "..." }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

### `POST /api/notes`

Create or update a note (upsert by userId + contentId + contentType).

**Auth:** Required
**CSRF:** Required
**Body:** `{ "contentId": "...", "contentType": "lecture", "content": "Note text..." }`
**Response envelope:** `{ success, data }`

### `GET /api/notes/{id}`
### `PUT /api/notes/{id}`
### `DELETE /api/notes/{id}`

Individual note CRUD.

---

## 16. Suggestion APIs

### `GET /api/suggestions`

List suggestions.

**Auth:** None
**Params:** `classId`, `subjectId`, `chapterId`, `search`, `page`, `limit`

Premium suggestions return `content: null` without access check.

**Response envelope:** `{ success, data, pagination }`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "সাজেশন টাইটেল",
      "slug": "...",
      "classId": "...",
      "subjectId": "...",
      "chapterId": "...",
      "className": "...",
      "subjectName": "...",
      "chapterName": "...",
      "thumbnail": null,
      "pdfUrl": null,
      "isPremium": false,
      "price": 0,
      "viewCount": 100,
      "order": 1,
      "createdAt": "...",
      "content": "HTML content..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
}
```

---

## 17. Notice APIs

### `GET /api/notices`

List notices.

**Auth:** None
**Params:** `classLevel`, `search`, `page`, `limit`
**Response envelope:** `{ success, data, pagination }`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Notice title",
      "content": "Notice content...",
      "pdfUrl": null,
      "linkUrl": null,
      "linkLabel": null,
      "type": "text",
      "thumbnail": null,
      "classLevel": null,
      "isPinned": true,
      "isActive": true,
      "order": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

## 18. Search APIs

### `GET /api/search`

Search across all content types.

**Auth:** None
**Params:**
- `q` (required): Search query
- `type`: Content type filter (`all`, `mcq`, `cq`, `lecture`, `suggestion`, `notice`, `bundle`)
- `limit`: Max 50, default 10

**Response:**
```json
{
  "query": "বাংলা",
  "results": {
    "mcqs": [...],
    "cqs": [...],
    "lectures": [...],
    "suggestions": [...],
    "notices": [...],
    "bundles": [...]
  },
  "total": 25
}
```

---

## 19. Bundle APIs

### `GET /api/bundles`

List content bundles.

### `GET /api/bundles/{id}`

Get bundle detail with items.

**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "contentType": "mcq", "contentId": "...", "contentTitle": "...", "contentPrice": 0, "order": 1 }
    ],
    "title": "Bundle title"
  }
}
```

### `GET /api/content/bundles-for`

Find bundles containing specific content.

**Params:** `contentType`, `contentId`
**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "bundles": [...] } }`

---

## 20. Package APIs

### `GET /api/packages`

List subscription packages (time-based).

**Response envelope:** `{ success, data }`

### `GET /api/packages/{id}`

Get package detail.

**Response envelope:** `{ success, data }`

### `GET /api/packages/suggest`

Get suggested packages based on user context.

**Response envelope:** `{ success, data }`

### `GET /api/plans`

List available plans/packages.

**Response envelope:** `{ success, data }`

---

## 21. MCQ Exam Package APIs

### `GET /api/mcq-exam-packages`

List MCQ exam packages.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "MCQ Exam Package",
      "description": "...",
      "price": 500,
      "originalPrice": 1000,
      "thumbnail": null,
      "totalSets": 30,
      "status": "published",
      "isPremium": true,
      "order": 1
    }
  ]
}
```

### `GET /api/exams/{id}`
### `POST /api/exams/results`

Exam taking and submission (see Section 11).

---

## 22. CQ Exam Package APIs

### `GET /api/cq-exam-packages`

List CQ exam packages.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:** Similar structure to MCQ exam packages.

---

## 23. Board Question APIs

### `GET /api/board-questions`

List board questions with filters.

**Response envelope:** `{ success, data, pagination }`
**Params:** `board`, `year`, `classLevel`, `subjectId`, `chapterId`, `type` (mcq/cq), `page`, `limit`

### `GET /api/board-questions/filters`

Get available board/year filter options.

**Response envelope:** `{ success, data }`

---

## 24. Other Public APIs

### `GET /api/banners`

Active banners.

**Auth:** None
**Cache:** Public, 30s
**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "banners": [...] } }`

### `GET /api/faqs`

Active FAQs.

**Auth:** None
**Cache:** Public, 1h
**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "faqs": [...] } }`

### `GET /api/testimonials`

Active testimonials.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "testimonials": [...] } }`

### `GET /api/stats`

Public site statistics.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:**
```json
{
  "success": true,
  "data": {
    "students": 10000,
    "mcqs": 5000,
    "lectures": 500,
    "cqs": 2000,
    "exams": 100
  }
}
```

### `GET /api/teacher-moderators`

Active teachers/moderators list.

**Auth:** None
**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "teachers": [...] } }`

### `GET /api/content-types`

List content types with labels.

### `GET /api/navigation`

Navigation items (header/footer/bottomNav).

**Response envelope:** `{ success, data }`
**Response:** `{ "success": true, "data": { "items": [...] } }`

---

## 25. Admin APIs

All admin endpoints are under `/api/admin/*`. They require `ADMIN` or `SUPER_ADMIN` role.

**Response Envelope:** All admin routes now use the same `{ success, data, pagination }` envelope format as public routes. Success responses include `success: true`; error responses include `success: false`.

**Note:** Admin routes are CSRF-exempt by design.

Super admin only endpoints:

- `POST /api/admin/database/reset` — Reset database (requires confirmation string)
- `GET /api/admin/database/export` — Export database
- `POST /api/admin/database/import` — Import database

### `GET /api/admin/stats`

Admin dashboard statistics.

**Auth:** Admin
**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "users": { "total": 1000, "students": 950, "premium": 50, "today": 5 },
      "content": { "mcqs": 5000, "cqs": 2000, "lectures": 500, "classes": 5, "subjects": 30, "chapters": 200 },
      "payments": { "total": 500, "pending": 10, "approved": 400, "totalRevenue": 50000 }
    },
    "recentPayments": [...],
    "monthlyRevenue": { "2026-01": 10000, "2026-02": 15000 }
  }
}
```

### `GET /api/admin/payments`
### `PATCH /api/admin/payments`

Admin payment listing and review.

**GET Params:** `status`, `method`, `contentType`, `q` (search), `page`, `limit`

**PATCH Body (Review Payment):**
```json
{
  "id": "payment_id",
  "status": "approved" | "rejected",
  "adminNote": "Reason for rejection (required if rejected)"
}
```

**PATCH Flow:**
1. Validates payment exists and is still pending
2. Prevents self-approval
3. Updates payment status
4. Creates notification for the user
5. For approved payments:
   - `mcq-exam-package` → creates `MCQExamPackagePurchase`
   - `cq-exam-package` → creates `CQExamPackagePurchase`
   - `package` → creates/extends `UserSubscription`
6. Creates audit log entry

### `GET /api/admin/users`
### `PATCH /api/admin/users`
### `DELETE /api/admin/users`

Admin user management.

**GET Params:** `role`, `isPremium`, `search`, `page`, `limit`

**PATCH Body (Update User):**
```json
{
  "id": "user_id",
  "ids": ["user_id1", "user_id2"],  // For bulk update (mutually exclusive with id)
  "name": "New Name",
  "role": "ADMIN" | "STUDENT",  // Cannot set SUPER_ADMIN
  "phone": "017XXXXXXXX",
  "institute": "...",
  "classLevel": "...",
  "board": "...",
  "isVerified": true,
  "isPremium": true,
  "premiumExpiry": "2026-12-31T00:00:00Z"
}
```

**DELETE:** Deletes user and all related records (payments, bookmarks, progress, etc.). Cannot delete SUPER_ADMIN. Also cleans up Supabase auth user.

### `GET /api/admin/content-purchases`
### `PATCH /api/admin/content-purchases`

Manage content purchases (approved payments).

**PATCH Body:**
```json
{
  "id": "payment_id",
  "isActive": true | false,
  "reason": "Reason for toggling access"
}
```

Cascades to related tables (MCQExamPackagePurchase, CQExamPackagePurchase, UserSubscription).

### Other Admin Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET/POST/PUT/DELETE /api/admin/classes` | Manage class categories |
| `GET/POST/PUT/DELETE /api/admin/subjects` | Manage subjects |
| `GET/POST/PUT/DELETE /api/admin/chapters` | Manage chapters |
| `POST /api/admin/chapters/content-counts` | Get content counts |
| `GET/POST/PUT/DELETE /api/admin/lectures` | Manage lectures |
| `GET/POST/PUT/DELETE /api/admin/mcq` | Manage MCQs |
| `POST /api/admin/mcq/bulk-upload` | Bulk upload MCQs |
| `GET/POST/PUT/DELETE /api/admin/cq` | Manage CQs |
| `GET/POST/PUT/DELETE /api/admin/exams` | Manage exams |
| `POST /api/admin/exams/questions` | Manage exam questions |
| `GET/POST/PUT/DELETE /api/admin/exam-results` | Manage exam results |
| `GET/POST/PUT/DELETE /api/admin/bundles` | Manage bundles |
| `GET/POST/PUT/DELETE /api/admin/packages` | Manage packages |
| `GET/POST/PUT/DELETE /api/admin/banners` | Manage banners |
| `GET/POST/PUT/DELETE /api/admin/notices` | Manage notices |
| `GET/POST/PUT/DELETE /api/admin/suggestions` | Manage suggestions |
| `GET/POST/PUT/DELETE /api/admin/faqs` | Manage FAQs |
| `GET/POST/PUT/DELETE /api/admin/testimonials` | Manage testimonials |
| `GET/POST/PUT/DELETE /api/admin/feedback` | Manage user feedback |
| `GET/POST/PUT/DELETE /api/admin/notifications` | Manage notifications |
| `GET/POST/PUT/DELETE /api/admin/subscriptions` | Manage subscriptions |
| `GET/POST/PUT/DELETE /api/admin/settings` | Manage site settings |
| `GET/POST/PUT/DELETE /api/admin/navigation` | Manage navigation |
| `POST /api/admin/navigation/seed` | Seed navigation defaults |
| `GET/POST/PUT/DELETE /api/admin/board-years` | Manage board-year combinations |
| `GET/POST/PUT/DELETE /api/admin/boards` | Manage boards |
| `GET/POST/PUT/DELETE /api/admin/years` | Manage years |
| `GET/POST/PUT/DELETE /api/admin/content-types` | Manage content types |
| `GET/POST/PUT/DELETE /api/admin/plans` | Manage plans |
| `GET/POST/PUT/DELETE /api/admin/teacher-moderators` | Manage teachers |
| `GET/POST/PUT/DELETE /api/admin/featured` | Manage featured content |
| `GET /api/admin/featured/search` | Search content for featured |
| `GET/POST/PUT/DELETE /api/admin/mcq-exam-packages` | Manage MCQ exam packages |
| `POST /api/admin/mcq-exam-packages/bulk-upload-questions` | Bulk upload questions |
| `GET/POST/PUT/DELETE /api/admin/cq-exam-packages` | Manage CQ exam packages |
| `GET/POST/PUT/DELETE /api/admin/bulk-import` | Bulk import content |
| `GET/POST/PUT/DELETE /api/admin/board-questions` | Manage board questions |
| `GET /api/admin/board-questions` | Admin board questions listing |
| `GET /api/admin/notes` | View all notes |
| `GET /api/admin/topics` | Manage topics |
| `GET /api/admin/settings/seed` | Seed default settings |
| `GET /api/admin/payments/stats` | Payment statistics |
| `GET /api/admin/bundles/content` | Bundle content management |

---

## 26. Error Handling

### Error Response Format

```json
{ "success": false, "error": "স্থানীয় বার্তা", "code": "ERROR_CODE", "details": [...] }
```

### Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Input validation failed |
| 400 | `INVALID_JSON` | Invalid JSON body |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` / `DUPLICATE_ENTRY` | Resource already exists |
| 422 | `VALIDATION_ERROR` | Zod validation failed (with details array) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` / `DATABASE_ERROR` | Server error |

### Validation Error Details

```json
{
  "success": false,
  "error": "ইনপুট ভ্যালিডেশন ব্যর্থ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "amount", "message": "পরিমাণ অবশ্যই ধনাত্মক হতে হবে" },
    { "field": "method", "message": "অবৈধ পেমেন্ট মেথড" }
  ]
}
```

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1623456789
```

---

## 27. Security

### Authentication
- **Method:** Supabase Auth with httpOnly cookies
- **Session Mgmt:** Server-side session via Supabase SSR
- **Middleware:** `proxy.ts` checks auth at edge for all protected routes
- **Route Guarding:** Per-route `verifyAuth()`, `requireAuth()`, `withAuth()`, `withAdmin()`, `withSuperAdmin()`

### CSRF Protection
- **Mechanism:** JWT-signed CSRF token (HS256, 1h expiry)
- **Cookie:** `csrf_token` (httpOnly, secure, strict sameSite)
- **Header:** `x-csrf-token`
- **Applied to:** All POST/PUT/PATCH/DELETE on user-facing routes
- **Exempt:** Auth routes, uploadthing, CSRF token endpoint, user feedback, admin routes

### Authorization (RBAC)
- **Roles:** `SUPER_ADMIN` > `ADMIN` > `STUDENT`
- **Middleware:** Checks role from Prisma DB (not Supabase metadata) at proxy level
- **Admin routes:** `/api/admin/*` — requires `ADMIN` or `SUPER_ADMIN`
- **Super admin routes:** `/api/admin/database/*` — requires `SUPER_ADMIN`
- **Self-approval prevention:** Admin cannot approve own payment
- **SUPER_ADMIN protection:** Cannot be modified/deleted by regular admin

### XSS Prevention
- **Storage layer:** Prisma middleware auto-sanitizes HTML fields on create/update
- **Rendering:** DOMPurify (client) + regex fallback (server)
- **Models with sanitized fields:** Lecture, MCQ, CQ, Suggestion, Notice, Banner, FAQ, Testimonial, Exam, SiteSetting
- **CSP:** Strict Content-Security-Policy headers via middleware

### Rate Limiting
- **Provider:** Upstash Redis
- **Algorithm:** Sliding window
- **Limiters:**
  - `apiLimiter`: 60 req/min (general API)
  - `uploadLimiter`: 10 req/min (file uploads)
  - `authLimiter`: 10 req/15min (auth endpoints)
- **Identifier:** Derived from `cf-connecting-ip`, `x-vercel-ip`, `x-forwarded-for`, or user-agent fingerprint

### Security Headers (via proxy.ts)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src ...; style-src ...; ...
```

### Additional Measures
- **SQL Injection:** Prevented by Prisma ORM (parameterized queries)
- **Payment userId:** Always taken from session, never from request body
- **Idempotency:** Payment creation supports `idempotencyKey` to prevent duplicates
- **Input Validation:** Zod schemas for all mutations
- **Audit Logging:** All admin actions (payment review, user update/delete) logged to `AuditLog`

---

## 28. Appendix: Response Envelope

All API endpoints use a consistent `{ success, data, pagination }` envelope format.

### Object Data (no pagination)

```json
{ "success": true, "data": { "key": "value", ... } }
```

### Array Data with Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 200,
    "totalPages": 10
  }
}
```

### Error Response

```json
{ "success": false, "error": "Bengali message", "code": "ERROR_CODE", "details": [...] }
```

### Auto-Unwrap Behavior

The frontend `fetchJSON()` function and `api-client.ts` interceptor both auto-unwrap the envelope:
- `{ success: true, data: { banners } }` → consumer receives `{ banners }`
- `{ success: true, data: [...], pagination: {...} }` → consumer receives `{ data: [...], pagination: {...} }`
- `{ success: true, data: objectValue }` → consumer receives `objectValue`
- `{ success: false, error: "..." }` → throws with the error message

---

*Generated on: June 13, 2026 | Project: শিক্ষা বাংলা (Sikkha Bangla)*
