# LMS Refactoring Plan — Course-Centric Architecture

## Overview

Refactor the LMS so **Course** becomes the central container. Online Classes, Exam Packages, Notes, etc. become internal content sources referenced by Courses — not standalone top-level modules on the admin sidebar.

---

## Phase 1: Database Schema

### 1.1 New Model: `CourseContent` (replaces `CourseItem`)

```prisma
model CourseContent {
  id            String    @id @default(cuid())
  courseId      String
  course        Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)

  contentType   String    // RECORDED_CLASS, LIVE_CLASS, MCQ_PACKAGE, CQ_PACKAGE, NOTE, RESOURCE, NOTICE, LINK, HTML
  referenceId   String?   // FK to source entity: onlineClass.id / mcqExamPackage.id / cqExamPackage.id / note.id / resource.id
  sourceType    String?   // "INTERNAL" | "EXTERNAL" — for future: YouTube, PDF upload, AI note, third-party exam
  sourceId      String?   // External source identifier (e.g. YouTube video ID, file path)

  title         String?
  description   String?
  displayOrder  Int       @default(0)

  // Access & publishing
  isPreview     Boolean   @default(false)   // Free preview without purchase
  isPublished   Boolean   @default(true)
  releaseAt     DateTime?

  // Metadata for future AI/adaptive features
  metadata      Json?     // { difficulty: "easy"|"medium"|"hard", estimatedTime: number, tags: string[] }

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([courseId, displayOrder])
  @@index([contentType, referenceId])
}
```

### 1.2 Routine Model — Split Design

Two models instead of one for clean drag-drop + calendar logic:

```prisma
model CourseRoutine {
  id            String   @id @default(cuid())
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  dayOfWeek     Int      // 0=Sun, 1=Mon, ... 6=Sat
  label         String?  // e.g. "Morning Batch", "Evening Batch"
  displayOrder  Int      @default(0)

  slots         CourseRoutineSlot[]

  @@index([courseId, dayOfWeek])
}

model CourseRoutineSlot {
  id          String   @id @default(cuid())
  routineId   String
  routine     CourseRoutine @relation(fields: [routineId], references: [id], onDelete: Cascade)
  startTime   String   // "09:00"
  endTime     String   // "10:00"
  title       String
  description String?
  color       String?
  displayOrder Int     @default(0)
  contentId   String?  // Optional link to CourseContent.id

  @@index([routineId, displayOrder])
}
```

### 1.3 Changes to Existing `Course` Model

- **Remove fields**: `mcqExamPackageId`, `cqExamPackageId` (become `CourseContent` entries with types `MCQ_PACKAGE` / `CQ_PACKAGE`)
- **Add new fields**: `features`, `requirements`, `targetStudents`, `hasCertificate`, `duration`, `language`, `difficulty`, `teacherName`
- **Add new relations**: `contents CourseContent[]`, `routines CourseRoutine[]`, `notes CourseNote[]`

### 1.4 New Model: `CourseNote`

```prisma
model CourseNote {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  contentType String   // "pdf", "html", "markdown", "file"
  content     String?  // HTML/markdown content
  fileUrl     String?  // PDF or downloadable file URL
  description String?
  displayOrder Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([courseId, displayOrder])
}
```

### 1.5 Migration Strategy — 3-Step Safe Approach

**Step 1 — Compatibility layer (Phase 1)**
- Create `CourseContent`, `CourseRoutine`, `CourseNote` alongside existing `CourseItem`
- One-time migration: copy all `CourseItem` rows → `CourseContent`
- Keep both models active: code reads from `CourseContent` but `CourseItem` is read-only
- Copy `Course.mcqExamPackageId` / `cqExamPackageId` into `CourseContent` entries

**Step 2 — Switch (Phase 3, when admin UI is ready)**
- All new code uses `CourseContent` exclusively
- `CourseItem` marked as deprecated (read-only, no new writes)

**Step 3 — Delete (Phase 7, after everything is verified stable)**
- Drop `CourseItem` model and `Course.mcqExamPackageId`, `cqExamPackageId`
- Verify no read-path still references these

### 1.6 Content Type Constants

```ts
const CONTENT_TYPES = {
  RECORDED_CLASS: 'RECORDED_CLASS',   // references OnlineClass (classType=RECORDED)
  LIVE_CLASS: 'LIVE_CLASS',           // references OnlineClass (classType=LIVE)
  MCQ_PACKAGE: 'MCQ_PACKAGE',         // references MCQExamPackage
  CQ_PACKAGE: 'CQ_PACKAGE',           // references CQExamPackage
  NOTE: 'NOTE',                       // references CourseNote
  RESOURCE: 'RESOURCE',               // URL + title
  NOTICE: 'NOTICE',                   // references Notice
  LINK: 'LINK',                       // external URL
  HTML: 'HTML',                       // raw HTML content
} as const
```

---

## Phase 2: Admin Sidebar

| Action | Detail |
|--------|--------|
| Remove | Sidebar item "অনলাইন ক্লাস" (Monitor icon, routes to `admin-online-classes`) |
| Remove | Lazy import `admin-online-classes` → `OnlineClassAdminContainer` from AdminPages |
| Remove | `admin-online-classes` from `ADMIN_ROUTES` set in `router.ts` |
| Keep | Sidebar item "কোর্স" (BookOpen icon, routes to `admin-courses`) |

The OnlineClass entity and its public/admin APIs remain — they're only removed from the sidebar. The Curriculum Manager accesses classes through the content-picker API.

---

## Phase 3: Admin Course UI — Tabbed Interface

### 3.1 Container Restructure

```
CourseAdminContainer
├── CourseList (default — click a course to enter detail)
└── CourseDetailTabs (when course is selected/created)
    ├── 📋 Overview
    ├── 📚 Curriculum
    ├── 📅 Routine
    ├── 👥 Students
    ├── 📊 Analytics
    └── ⚙️ Settings
```

### 3.2 Overview Tab

Rebuilt from current `CourseForm.tsx`. Add new fields:

| Section | Fields |
|---------|--------|
| Basic | title, slug, description, thumbnail |
| Categorization | teacherName, class (select), subject (select), category (optional) |
| Pricing | isPremium (switch), price (number, shown if premium) |
| Status | draft / published only (no archived) |
| Details | HTML syllabus, features (HTML), requirements (HTML), targetStudents (HTML) |
| Meta | hasCertificate (switch), duration (days), language (select), difficulty (select) |

### 3.3 Curriculum Tab — Grouped UI

**Add Content button** → modal with grouped picker:

```
📺 ক্লাস (Classes)
├── লাইভ ক্লাস → pick from OnlineClass (classType=LIVE)
└── রেকর্ডেড ক্লাস → pick from OnlineClass (classType=RECORDED)

🧠 এক্সাম (Exams)
├── MCQ প্যাকেজ → pick from MCQExamPackage
└── CQ প্যাকেজ → pick from CQExamPackage

📄 কন্টেন্ট (Content)
├── নোট → create inline or pick from CourseNote
├── রিসোর্স → URL/title input
└── HTML → raw HTML textarea

⚙️ অন্যান্য (Others)
├── নোটিশ → pick from Notice
└── লিংক → URL+title input
```

**Curriculum list**: drag-drop ordering, each row shows:
- Icon by type (Film for classes, FileQuestion for MCQ, etc.)
- Title + type badge
- Preview toggle (isPreview)
- Publish/Draft toggle (isPublished)
- Release date picker (releaseAt)
- Delete button

### 3.4 Routine Tab

Uses split models (`CourseRoutine` → `CourseRoutineSlot`):

- **Day columns** (Sun-Sat)
- Each day has collapsible routine entries (label + time slots)
- Add: create a new routine entry per day → then add time slots within it
- Each slot: title, start/end time, color, optional link to CourseContent
- Drag-drop reorder within a day

### 3.5 Students Tab

List enrolled students from `CoursePurchase`:
- Name, email, avatar
- Purchase date
- Active/Inactive status toggle
- Search + pagination

### 3.6 Analytics Tab

- Total enrollments
- Revenue (price × purchases)
- Content count by type (bar/stat cards)
- Enrollment trend over time (basic)

### 3.7 Settings Tab

- Certificate toggle (placeholder for future certificate builder)
- SEO meta fields (meta title, meta description)
- Default content release settings

---

## Phase 4: Admin API Changes

### 4.1 Course Content CRUD

New POST actions in `admin/courses/route.ts`:
- `add-content` — create CourseContent record
- `update-content` — update CourseContent fields (title, description, isPreview, isPublished, releaseAt, metadata)
- `remove-content` — delete CourseContent
- `reorder-contents` — batch update displayOrder

### 4.2 Course Routine CRUD

New POST actions:
- `add-routine` — create CourseRoutine + slots
- `update-routine` / `update-routine-slot` — update entries
- `remove-routine` / `remove-routine-slot` — delete
- `reorder-slots` — batch update slot displayOrder

### 4.3 Content Picker API (New)

```
GET /api/admin/content-picker?type=RECORDED_CLASS&search=abc&classId=xyz
```

Returns unified `{ id, title, description, type, subtitle }[]` from the relevant table. Used by Curriculum Tab's "Add Content" modal.

---

## Phase 5: Access Control

### 5.1 Two-Layer Architecture

**Layer 1 — Ownership (pure data queries):**
```ts
async function getPackageOwnership(userId: string, packageId: string, contentType: 'MCQ_PACKAGE' | 'CQ_PACKAGE') {
  const directOwnership = await db.mcqExamPackagePurchase.findFirst({ // or cq
    where: { userId, packageId, isActive: true }
  })

  const courseOwnership = await db.coursePurchase.findFirst({
    where: {
      userId,
      isActive: true,
      course: {
        status: 'published',  // MUST be published
        contents: { some: { contentType, referenceId: packageId } }
      }
    }
  })

  return { directOwnership: !!directOwnership, courseOwnership: !!courseOwnership }
}
```

**Layer 2 — Access Resolver (single entry point):**
```ts
async function hasAccessToPackage(userId: string, packageId: string, contentType: 'MCQ_PACKAGE' | 'CQ_PACKAGE'): Promise<boolean> {
  const { directOwnership, courseOwnership } = await getPackageOwnership(userId, packageId, contentType)
  return directOwnership || courseOwnership
}
```

### 5.2 Check-Purchase API Update

`GET /api/mcq-exam-packages?action=check-purchase` and `GET /api/cq-exam-packages?action=check-purchase`:
- Extend response: `{ purchased, courseGranted, ownership: { directOwnership, courseOwnership } }`
- Student UI uses `courseGranted` to show "✓ আপনার কোর্সে অন্তর্ভুক্ত"

### 5.3 Access-Control Library Update

`src/lib/access-control.ts` — add the ownership resolver:
- After checking direct purchase, also check course-granted access
- Future: this same resolver can be extended for subscription-based access, AI tutor grants, etc.

---

## Phase 6: Student UI

### 6.1 Course Detail Page — Tabbed

Redesign `CourseDetailPage.tsx` with tabs:

| Tab | Content |
|-----|---------|
| 📋 Overview | Description, syllabus, instructor info, features, requirements, price/purchase card |
| 📚 Curriculum | Ordered content list with lock/preview icons; click opens viewer or exam |
| 📅 Routine | Weekly schedule from CourseRoutine → CourseRoutineSlot |
| 📝 Notes | Course notes (PDF download, HTML/markdown inline render) |
| 📊 Progress | completed/total count, percentage bar |
| 💬 Discussion | Placeholder — future |
| 🎓 Certificate | Placeholder — future |

### 6.2 Content Type Rendering

| Content Type | Student Click Action |
|---|---|
| RECORDED_CLASS | Navigate to `online-class-viewer` with classId |
| LIVE_CLASS | Navigate to `online-class-viewer` (join live) |
| MCQ_PACKAGE | Navigate to `mcq-exam-package-detail` |
| CQ_PACKAGE | Navigate to `cq-exam-package-detail` |
| NOTE | Open inline viewer or download |
| RESOURCE | Download file / open link |
| LINK | Open external URL in new tab |
| HTML | Render inline HTML |
| NOTICE | Read notice content |

### 6.3 Access Gating Rules

- `isPreview = true` → always accessible (no purchase needed)
- `isPublished = false` → hidden from student
- User has purchased course AND course is PUBLISHED → all published content accessible
- No purchase + not preview → locked (show lock icon + purchase CTA)

### 6.4 Progress Tracking (V1)

```prisma
model CourseContentProgress {
  id          String    @id @default(cuid())
  userId      String
  contentId   String    // references CourseContent.id
  courseId    String
  completed   Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, contentId])
  @@index([userId, courseId])
}
```

Mark as completed when: class viewer loaded, exam started, note opened. Percentage = completed / total published.

---

## Phase 7: Cleanup — AFTER Everything Is Stable

**Do NOT run until:**
- Student UI confirmed working
- Access logic fully tested (direct + course-granted paths)
- Migration verified (no data loss, no read-path to old models)

### 7.1 Remove

- `src/features/online-class/admin/` (entire directory)
- Drop `CourseItem` model from Prisma schema
- Remove `Course.mcqExamPackageId`, `Course.cqExamPackageId` from schema
- (Optional) Drop `src/app/api/admin/online-classes/route.ts` — can keep for internal tooling

### 7.2 Update Router

- Remove `admin-online-classes` from `ADMIN_ROUTES` in `src/store/router.ts`
- (Optional) Remove `admin-online-classes` from `RoutePath` type

### 7.3 Update Types & Services

- Replace all `CourseItemRecord` references with `CourseContentRecord`
- Remove `CourseItem` enums and types from course.service.ts
- Keep `onlineClassService` / `onlineClassAdminService` for internal data fetching

---

## Implementation Order

```
Phase 1: Database schema (CourseContent, CourseRoutine, CourseRoutineSlot,
         CourseNote + Step 1 migration)
    ↓
Phase 2: Admin sidebar (remove online-classes item, lazy import, ADMIN_ROUTES)
    ↓
Phase 3: Admin course UI (tabbed container + all 6 tabs + grouped curriculum UI)
    ↓
Phase 4: Admin API (content/routine CRUD, content-picker endpoint)
    ↓
Phase 5: Access control (2-layer ownership + resolver, API updates, library update)
    ↓
Phase 6: Student UI (tabbed course detail, progress tracking, access gating)
    ↓
Phase 7: Cleanup (remove old models, files — only after verification)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `prisma/migrations/XYZ_course_content_routine/` | Schema migration |
| `src/features/course/admin/components/CourseDetailTabs.tsx` | Tabbed layout wrapper |
| `src/features/course/admin/components/OverviewTab.tsx` | Course info form (replaces CourseForm) |
| `src/features/course/admin/components/CurriculumTab.tsx` | Grouped content manager (replaces CourseItemManager) |
| `src/features/course/admin/components/ContentPickerDialog.tsx` | Grouped modal for adding content |
| `src/features/course/admin/components/RoutineTab.tsx` | Weekly routine with split models |
| `src/features/course/admin/components/StudentsTab.tsx` | Enrolled students list |
| `src/features/course/admin/components/AnalyticsTab.tsx` | Course stats |
| `src/features/course/admin/components/SettingsTab.tsx` | Course settings |
| `src/features/course/admin/hooks/use-course-detail.ts` | Hook for tab state + content CRUD |
| `src/services/api/content-picker.service.ts` | Content picker API calls |
| `src/app/api/admin/content-picker/route.ts` | Content picker API endpoint |

---

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add CourseContent, CourseRoutine, CourseRoutineSlot, CourseNote; modify Course |
| `src/components/admin/AdminLayout.tsx` | Remove sidebar item + lazy import |
| `src/store/router.ts` | Remove admin-online-classes from ADMIN_ROUTES |
| `src/features/course/admin/CourseAdminContainer.tsx` | Tabbed detail view |
| `src/features/course/admin/hooks/use-courses.ts` | Split into use-courses (list) + use-course-detail (tabs) |
| `src/features/course/admin/components/CourseList.tsx` | Click → select course → open tabbed view |
| `src/features/course/admin/components/CourseForm.tsx` | Replaced by OverviewTab |
| `src/features/course/admin/components/CourseItemManager.tsx` | Replaced by CurriculumTab |
| `src/app/api/admin/courses/route.ts` | Add content + routine CRUD actions |
| `src/app/api/courses/route.ts` | Include CourseContent + CourseRoutine in detail response |
| `src/lib/access-control.ts` | Add 2-layer ownership resolver |
| `src/app/api/mcq-exam-packages/route.ts` | check-purchase: add courseGranted |
| `src/app/api/cq-exam-packages/route.ts` | check-purchase: add courseGranted |
| `src/components/course/CourseDetailPage.tsx` | Tabbed student UI |
| `src/components/course/CourseListPage.tsx` | Minor updates for new response shape |
| `src/services/api/course.service.ts` | Update types (CourseRecord, add CourseContentRecord) |
| `src/services/api/course-admin.service.ts` | Add content/routine/note methods |

---

## Acceptance Criteria

1. Admin sidebar has "কোর্স" only under LMS section (no "অনলাইন ক্লাস")
2. Course editor has 6 tabs: Overview, Curriculum, Routine, Students, Analytics, Settings
3. Curriculum supports 9 content types in 4 groups: Classes, Exams, Content, Others
4. Curriculum items support: drag-drop, preview toggle, publish/draft toggle, release date
5. Weekly routine has two-level structure (routine → time slots) with drag-drop
6. Students tab shows enrolled users with search
7. Course purchase auto-grants access to linked MCQ/CQ packages
8. Package access check: uses 2-layer ownership (direct OR course-granted), also verifies course.status === 'published'
9. Student course page has tabs: Overview, Curriculum, Routine, Notes, Progress
10. Progress auto-calculates based on completed content
11. Course-granted access shows "✓ আপনার কোর্সে অন্তর্ভুক্ত" instead of buy button on exam pages
12. No TypeScript errors (except pre-existing CqTab/McqTab)
13. Migration runs safely: Step 1 (compatibility) → Step 2 (switch) → Step 3 (delete, verified first)
