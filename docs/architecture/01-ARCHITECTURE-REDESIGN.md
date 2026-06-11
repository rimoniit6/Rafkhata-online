# CQ Exam Package → Written Assessment System
## Comprehensive Architecture Redesign

---

# 1. EXECUTIVE SUMMARY

The current CQ Exam Package system is tightly coupled: packages belong to classes, sets belong to packages, and questions are either CQ-bank references or typed questions with exactly 4 sub-questions. This design cannot support the new requirements for class-independent exams, multiple question types (MCQ, fill-in-blanks), rich content, configurable attempts, rubric grading, double review, recheck workflow, analytics, or 10k+ performance.

This document defines the new architecture, database schema, API surface, and phased migration strategy.

**Core Design Principles:**
1. **Decoupled hierarchy**: Exams stand alone, not nested inside packages
2. **Extensible question types**: Plugin-style architecture for CQ, MCQ, fill-in-blanks, etc.
3. **Rich content everywhere**: LaTeX, images, tables supported in questions, answers, feedback
4. **Configurable evaluation**: Single, bulk, rubric-based, double review
5. **Performance-first**: Paginated queries, cursor-based for large datasets, cached analytics
6. **Backward compatible**: All existing CQ data remains valid; migration scripts provided

---

# 2. CURRENT SYSTEM AUDIT

## 2.1 Database Models (9 models)

| Model | Purpose | Limitations |
|-------|---------|-------------|
| `CQExamPackage` | Tied to single class via `classId` | Cannot be class-independent |
| `CQExamSet` | Belongs to a package, single date | No scheduling windows, no sessions |
| `CQExamSetQuestion` | Question in a set (type=cq or typed) | Only 2 types, exactly 4 sub-questions |
| `CQExamPackagePurchase` | Purchase record | Only per-student, no bulk purchases |
| `CQExamSubmission` | User's attempt | Single attempt, no attempt config |
| `CQExamAnswer` | Per sub-question answer | Only 4 fixed slots |
| `CQExamAnswerImage` | Images per answer | No ordering control per submission |
| `CQExamRetakeRequest` | Manual retake approval | No auto-retake rules |
| `CQ` (CQ Bank) | 4-questions + 4-answers | Fixed structure, no rich content |

## 2.2 Current Data Flow

```
Admin creates Package → creates Sets → adds Questions
                                           ↓
Student purchases Package → starts Exam → uploads answers → submits
                                           ↓
Admin views Submissions → grades (single/bulk) → publishes results
                                           ↓
Student views Result → requests Retake (optional)
```

## 2.3 Known Pain Points

- **No exam scheduling**: Sets have only `scheduledDate`, no start/end windows
- **Fixed 4 sub-questions**: Cannot add more or fewer questions per set
- **No MCQ or mixed exams**: Only CQ-style questions supported
- **Single attempt**: Retake requires manual admin approval
- **No pass/fail logic**: `passMarks` field exists but never enforced
- **No double review**: Single evaluation, no second reviewer
- **No recheck system**: Students cannot request re-evaluation
- **No analytics**: Basic leaderboard only (per-set, marks-based)
- **No CSV export**: All data stays in DB
- **No teacher role**: Only admin/super_admin can evaluate
- **No rich content**: Questions are plain text; no LaTeX, tables, or formatted text
- **No rubric support**: Grading is free-form marks input
- **Performance**: Submission listing lacks efficient pagination for 10k+ scale
- **Notebook-style image review**: Image lightbox exists but no annotation during review

---

# 3. GAP ANALYSIS

| Requirement | Current | Target | Gap |
|-------------|---------|--------|-----|
| Package independent | classId FK | Standalone exams with class/subject associations | Full redesign |
| Scheduling | Single date | Start/end datetime, sessions, windows | Add models |
| Question types | CQ + typed (4 sub-q) | CQ, MCQ (single/multi), fill-in-blanks, short answer | New models |
| Rich content | Plain text | LaTeX, images, tables, formatted text | Migrate to HTML |
| Attempts | 1 + manual retake | Configurable: N attempts, best/last/average | New logic |
| Pass/Fail | passMarks field unused | Enforced pass/fail, graded on curve | New logic |
| Double review | Not supported | Optional 2nd evaluator, dispute resolution | New workflow |
| Recheck | Not supported | Student requests → admin assigns → re-evaluation | New workflow |
| Rubric | Not supported | Per-question rubric with score levels | New models |
| Analytics | Basic leaderboard | Stats, trends, CSV export, per-exam analytics | New module |
| Performance | Unpaginated | Cursor-based pagination, query optimization | Optimization |
| Roles | student/admin/super_admin | + teacher, evaluator roles | Role system |
| Image review | Lightbox | Canvas-based annotation, multi-image compare | Enhanced UI |
| Notifications | Manual (publish) | Auto on grade, recheck, result, schedule | New triggers |
| Question bank | CQ bank (tight coupling) | Unified bank with filtering by type, subject, difficulty | Refactor |

---

# 4. NEW ARCHITECTURE

## 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Admin UI │  │ Student  │  │ Evaluator│  │  Analytics  │ │
│  │          │  │ Exam UI  │  │ UI       │  │  Dashboard  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
└───────┼──────────────┼─────────────┼──────────────┼────────┘
        │              │             │              │
┌───────▼──────────────▼─────────────▼──────────────▼────────┐
│                    API LAYER (Next.js API)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Exam API │  │ Question │  │ Eval API │  │  Analytics  │ │
│  │ (CRUD)   │  │ API      │  │          │  │  API        │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
└───────┼──────────────┼─────────────┼──────────────┼────────┘
        │              │             │              │
┌───────▼──────────────▼─────────────▼──────────────▼────────┐
│                    DATA LAYER (Prisma)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Written  │  │ Question │  │ Eval     │  │  Analytics  │ │
│  │ Exam     │  │ Bank     │  │ Pipeline │  │  Views      │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        CQ Exam Package (Legacy, read-only)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 4.2 Key Design Decisions

### 4.2.1 Package Independence
Exams are **first-class entities** not nested inside packages. A `WrittenExam` can be:
- Sold individually (price + isPremium)
- Grouped into bundles (many-to-many with `ExamBundle`)
- Associated with multiple classes/subjects (many-to-many)

This replaces `CQExamPackage` → `CQExamSet` → `CQExamSetQuestion`.

### 4.2.2 Question Types as Plugin Architecture
A single `ExamQuestion` model with a `questionType` discriminator:
- `cq`: 4 sub-questions (existing format, backward compatible)
- `mcq-single`: MCQ with single correct answer
- `mcq-multiple`: MCQ with multiple correct answers
- `fill-blanks`: Fill in the blanks / short answer
- `written`: Long-form written answer
- `mixed`: Combination types

Each type stores type-specific data in a JSON `config` field.

### 4.2.3 Rich Content
All text fields (questions, answers, feedback, instructions) support:
- HTML subset (bold, italic, lists, tables)
- LaTeX via KaTeX syntax (`$$...$$` or `$...$`)
- Image URLs with sizing
- Rich content rendered via existing `RichContentRenderer` component

### 4.2.4 Configurable Attempts
Each exam has attempt rules:
- `maxAttempts`: max attempts allowed (0 = unlimited)
- `attemptScoring`: best-score, last-score, average
- `retakeDelayHours`: wait time between attempts
- `retakeRequiresApproval`: whether retake needs admin approval

### 4.2.5 Evaluation Pipeline
Multi-stage evaluation pipeline:
1. **Single evaluation**: One evaluator grades the submission
2. **Bulk evaluation**: Grade one question across all submissions
3. **Rubric evaluation**: Select from predefined rubric levels
4. **Double review**: Optional second evaluator; if scores differ > threshold, third reviewer resolves
5. **Auto-publish**: Automatic when all evaluations complete

### 4.2.6 Role System
Extended roles beyond current `student/admin/super_admin`:
| Role | Permissions |
|------|-------------|
| `super_admin` | Everything |
| `admin` | Create/manage exams, assign evaluators, publish results |
| `evaluator` | Grade assigned submissions, view rubrics |
| `teacher` | View student results, request rechecks |
| `student` | Take exams, view results, request rechecks |

---

# 5. DATABASE SCHEMA DESIGN

## 5.1 New Models

### WrittenExam (replaces CQExamPackage + CQExamSet)

```prisma
model WrittenExam {
  id              String    @id @default(cuid())
  title           String
  description     String?
  thumbnail       String?
  
  // Class/subject association (many-to-many via join table)
  classSubjects   WrittenExamClassSubject[]
  
  // Pricing
  price           Float     @default(0)
  originalPrice   Float     @default(0)
  isPremium       Boolean   @default(true)
  
  // Scheduling
  startDate       DateTime?
  endDate         DateTime?
  startTime       String?   // "09:00"
  endTime         String?   // "17:00"
  
  // Config
  duration        Int       @default(30) // minutes
  instructions    String?   // Rich content
  status          String    @default("draft") // draft, published, completed, archived
  isActive        Boolean   @default(true)
  
  // Grading config
  passMarks       Float     @default(0) // 0 = no pass/fail
  showResultAfter String    @default("immediately") // immediately, after_grading, after_publish
  showCorrectAnswers Boolean @default(false)
  
  // Attempt config
  maxAttempts     Int       @default(1) // 0 = unlimited
  attemptScoring  String    @default("best") // best, last, average
  retakeDelayHours Int      @default(0)
  retakeRequiresApproval Boolean @default(false)
  
  // Evaluation config
  evaluationMode  String    @default("single") // single, double
  doubleReviewThreshold Float @default(2) // score difference triggers 3rd review
  autoPublishResults Boolean @default(false)
  enableRubricGrading   Boolean @default(false)
  
  // Display
  shuffleQuestions Boolean  @default(false)
  questionLayout  String    @default("list") // list, one-by-one
  maxImagesPerAnswer Int   @default(5)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  questions       WrittenExamQuestion[]
  sessions        WrittenExamSession[]
  submissions     WrittenExamSubmission[]
  recheckRequests WrittenExamRecheckRequest[]
  analytics       WrittenExamAnalytics?
}
```

### WrittenExamClassSubject (join table)

```prisma
model WrittenExamClassSubject {
  id          String    @id @default(cuid())
  examId      String
  classId     String
  subjectId   String?
  
  exam        WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  class       ClassCategory @relation(fields: [classId], references: [id])
  subject     Subject?     @relation(fields: [subjectId], references: [id])
  
  @@unique([examId, classId, subjectId])
}
```

### WrittenExamQuestion (replaces CQExamSetQuestion)

```prisma
model WrittenExamQuestion {
  id              String    @id @default(cuid())
  examId          String
  exam            WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  
  // Question type discriminator
  questionType    String    // cq, mcq-single, mcq-multiple, fill-blanks, written
  
  // Common fields
  order           Int       @default(0)
  marks           Float     @default(1)
  
  // Rich content fields (used by all types)
  stem            String?   // Question stem/passage (rich content)
  stemImage       String?   // Stem image URL
  
  // Type-specific configuration stored as JSON
  // For cq: { subQuestions: [{label: "ক", text: "...", image: "...", marks: 1}, ...], answers: [...] }
  // For mcq-single: { options: [{label: "A", text: "..."}, ...], correctIndex: 0 }
  // For mcq-multiple: { options: [{label: "A", text: "..."}, ...], correctIndices: [0, 2] }
  // For fill-blanks: { blanks: [{id: "b1", answer: "..."}, ...] }
  // For written: { expectedPoints: ["...", "..."], wordLimit: 500 }
  config          String    @default("{}") // JSON
  
  // Rubric (optional, for rubric-based grading)
  rubric          String?   // JSON: [{level: "Excellent", score: 5, description: "..."}, ...]
  
  // Backward compatibility: reference to CQ bank
  cqId            String?
  cq              CQ?       @relation(fields: [cqId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  answers         WrittenExamAnswer[]
  
  @@index([examId, order])
}
```

### WrittenExamSession (scheduling windows)

```prisma
model WrittenExamSession {
  id          String    @id @default(cuid())
  examId      String
  exam        WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  title       String    // e.g. "Session 1", "Morning Batch"
  
  // Scheduling
  startDate   DateTime
  endDate     DateTime
  startTime   String    // "09:00"
  endTime     String    // "12:00"
  
  // Capacity
  maxStudents Int       @default(0) // 0 = unlimited
  currentCount Int      @default(0)
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  submissions WrittenExamSubmission[]
}
```

### WrittenExamSubmission (replaces CQExamSubmission)

```prisma
model WrittenExamSubmission {
  id              String    @id @default(cuid())
  examId          String
  exam            WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId       String?
  session         WrittenExamSession? @relation(fields: [sessionId], references: [id])
  
  // Attempt tracking
  attemptNumber   Int       @default(1)
  
  // Timing
  startedAt       DateTime?
  submittedAt     DateTime?
  timeTaken       Int       @default(0) // seconds
  isAutoSubmitted Boolean   @default(false)
  
  // Status
  status          String    @default("not-started")
  // not-started, in-progress, submitted, evaluating, evaluated, published, recheck-requested, rechecking
  
  // Scoring (populated after evaluation)
  totalMarks      Float     @default(0)
  obtainedMarks   Float     @default(0)
  passFail        String?   // pass, fail, null (not evaluated)
  
  // Evaluation tracking
  evaluatedBy     String?   // First evaluator ID
  evaluatedAt     DateTime?
  reviewedBy      String?   // Second evaluator ID (double review)
  reviewedAt      DateTime?
  reviewNeeded    Boolean   @default(false) // Score diff > threshold
  
  // Retake
  canRetake       Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  answers         WrittenExamAnswer[]
  evaluations     WrittenExamEvaluation[]
  
  @@index([examId, userId])
  @@index([examId, status])
  @@index([sessionId])
}
```

### WrittenExamAnswer (replaces CQExamAnswer)

```prisma
model WrittenExamAnswer {
  id              String    @id @default(cuid())
  submissionId    String
  submission      WrittenExamSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  questionId      String
  question        WrittenExamQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  // For CQ: subIndex identifies which sub-question (0=ক, 1=খ, etc.)
  // For MCQ: subIndex = 0, answerText stores selected option
  // For fill-blanks: subIndex identifies which blank
  subIndex        Int       @default(0)
  
  answerText      String?   // Text answer, MCQ selection, or fill-blank answer
  maxMarks        Float     @default(0)
  obtainedMarks   Float     @default(0)
  feedback        String?   // Rich content
  gradedAt        DateTime?
  gradedBy        String?   // Evaluator ID
  rubricLevel     String?   // Selected rubric level (if rubric grading)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Images
  images          WrittenExamAnswerImage[]
  
  @@index([submissionId, questionId])
}
```

### WrittenExamAnswerImage (replaces CQExamAnswerImage)

```prisma
model WrittenExamAnswerImage {
  id              String    @id @default(cuid())
  answerId        String
  answer          WrittenExamAnswer @relation(fields: [answerId], references: [id], onDelete: Cascade)
  imageUrl        String
  annotations     String?   // JSON: {shapes, marks, comments}
  order           Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### WrittenExamEvaluation (evaluation pipeline tracking)

```prisma
model WrittenExamEvaluation {
  id            String    @id @default(cuid())
  submissionId  String
  submission    WrittenExamSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  evaluatorId   String
  stage         String    // first, second, third (dispute resolution)
  
  // Scores
  totalMarks    Float     @default(0)
  obtainedMarks Float     @default(0)
  passFail      String?   // pass, fail
  
  // Rubric selections per question (JSON)
  rubricResults String?   // JSON: [{questionId, rubricLevel}, ...]
  
  feedback      String?   // Overall feedback
  isFinal       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  // Relations
  evaluator     User      @relation(fields: [evaluatorId], references: [id])
  
  @@index([submissionId, stage])
}
```

### WrittenExamRecheckRequest (NEW)

```prisma
model WrittenExamRecheckRequest {
  id            String    @id @default(cuid())
  submissionId  String
  submission    WrittenExamSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  reason        String    // Rich content
  status        String    @default("pending") // pending, under-review, completed, rejected
  assignedTo    String?   // Evaluator ID assigned for recheck
  assignedAt    DateTime?
  
  // Result
  originalMarks Float
  revisedMarks  Float?
  revisedPassFail String?
  reviewerNotes String?   // Rich content
  resolvedAt    DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([submissionId])
  @@index([status])
}
```

### WrittenExamAnalytics (pre-computed / cached)

```prisma
model WrittenExamAnalytics {
  id              String    @id @default(cuid())
  examId          String    @unique
  exam            WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  
  // Participation
  totalSubmissions  Int     @default(0)
  completedSubmissions Int @default(0)
  averageScore      Float   @default(0)
  highestScore      Float   @default(0)
  lowestScore       Float   @default(0)
  passCount         Int     @default(0)
  failCount         Int     @default(0)
  averageTimeTaken  Int     @default(0) // seconds
  
  // Per-question stats (JSON)
  questionStats     String? // JSON: [{questionId, avgScore, maxScore, minScore, ...}]
  
  // Distribution
  scoreDistribution String? // JSON: [{range: "0-10", count: 5}, ...]
  
  updatedAt         DateTime @updatedAt
}
```

### WrittenExamBundle (grouping exams)

```prisma
model WrittenExamBundle {
  id          String    @id @default(cuid())
  title       String
  description String?
  price       Float     @default(0)
  originalPrice Float   @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  exams       WrittenExamBundleExam[]
  purchases   WrittenExamBundlePurchase[]
}
```

### WrittenExamBundleExam (join)

```prisma
model WrittenExamBundleExam {
  id        String    @id @default(cuid())
  bundleId  String
  examId    String
  order     Int       @default(0)
  
  bundle    WrittenExamBundle @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  exam      WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  
  @@unique([bundleId, examId])
}
```

### Purchase Models

```prisma
model WrittenExamPurchase {
  id          String    @id @default(cuid())
  userId      String
  examId      String
  exam        WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  paymentId   String?
  purchasedAt DateTime  @default(now())
  isActive    Boolean   @default(true)
  
  @@unique([userId, examId])
}

model WrittenExamBundlePurchase {
  id          String    @id @default(cuid())
  userId      String
  bundleId    String
  bundle      WrittenExamBundle @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  paymentId   String?
  purchasedAt DateTime  @default(now())
  isActive    Boolean   @default(true)
  
  @@unique([userId, bundleId])
}
```

## 5.2 Migration from Existing Models

| Old Model | New Model | Migration |
|-----------|-----------|-----------|
| `CQExamPackage` | `WrittenExam` | Convert each package's data + sets into written exams. Package → Exam, each Set → questions within that exam |
| `CQExamSet` | (merged into WrittenExam) | Sets become questions grouped under one exam. Set-level config (duration, passMarks, etc.) becomes Exam-level |
| `CQExamSetQuestion` | `WrittenExamQuestion` | Direct: cqId maps to CQ bank, typed questions convert config |
| `CQExamPackagePurchase` | `WrittenExamPurchase` | Direct migration |
| `CQExamSubmission` | `WrittenExamSubmission` | Direct migration |
| `CQExamAnswer` | `WrittenExamAnswer` | Direct migration |
| `CQExamAnswerImage` | `WrittenExamAnswerImage` | Direct migration |
| `CQExamRetakeRequest` | (absorbed into attempt config) | Config becomes exam-level; existing requests convert to recheck |

---

# 6. API DESIGN

## 6.1 Route Structure

```
/api/admin/written-exams/             → Exam CRUD (admin)
/api/admin/written-exams/[id]/        → Single exam operations
/api/admin/written-exam-questions/    → Question CRUD
/api/admin/written-exam-evaluations/  → Evaluation operations
/api/admin/written-exam-bundles/      → Bundle CRUD

/api/written-exams/                   → Public exam listing & access
/api/written-exams/[id]/              → Single exam detail & actions
/api/written-exam-submissions/        → Submission & answer actions
/api/written-exam-rechecks/           → Recheck requests
/api/written-exam-analytics/          → Analytics data
```

## 6.2 Action-based Pattern (consistent with existing code)

### Admin API: `/api/admin/written-exams/`

**GET actions:**
- `list` — Paginated list with filters (class, subject, status, search)
- `detail` — Single exam with questions, sessions
- `submissions` — Submissions for an exam (paginated, filterable by status)
- `submission-detail` — Full submission with answers, images, evaluations
- `bulk-grade-by-question` — All submissions filtered to one question
- `evaluators` — List available evaluators
- `recheck-requests` — List recheck requests for an exam
- `analytics` — Exam analytics data
- `bundle-detail` — Bundle with its exams

**POST actions:**
- `create` — Create exam
- `create-session` — Add exam session
- `create-question` — Add question (cq/mcq/fill-blanks/written)
- `add-cq-from-bank` — Import from CQ bank
- `create-bundle` — Create exam bundle
- `assign-evaluator` — Assign evaluator to submissions

**PUT actions:**
- `update` — Update exam config
- `update-question` — Update question
- `update-session` — Update session
- `reorder-questions` — Reorder exam questions
- `grade-submission` — Grade a submission (single)
- `bulk-grade` — Bulk grade all submissions
- `save-bulk-grades-by-question` — Save per-question bulk grades
- `submit-evaluation` — Submit evaluation (double review)
- `resolve-dispute` — Resolve score dispute (third evaluator)
- `publish-results` — Publish results for an exam
- `approve-recheck` — Approve/reject recheck request
- `complete-recheck` — Submit recheck result
- `allow-retake` — Grant individual retake permission
- `export-csv` — Export results as CSV

**DELETE actions:**
- `delete` — Delete exam (soft or hard)
- `delete-question` — Remove question
- `delete-session` — Remove session
- `delete-bundle` — Remove bundle

### Public API: `/api/written-exams/`

**GET actions:**
- `list` — Published exams list
- `detail` — Exam detail (with purchased check)
- `check-purchase` — Check if user purchased
- `my-submissions` — User's submissions
- `my-result` — Single submission result
- `my-recheck-requests` — User's recheck requests
- `leaderboard` — Exam leaderboard

**POST actions:**
- `start-exam` — Start/continue exam attempt
- `save-answer` — Save answer text/selection
- `add-image` — Upload image to answer
- `remove-image` — Remove image
- `save-mcq-answer` — Save MCQ selection
- `submit-exam` — Final submission
- `request-recheck` — Submit recheck request

## 6.3 Question Config Json Schema

### CQ type
```json
{
  "subQuestions": [
    {"label": "ক", "text": "<rich>", "image": null, "marks": 1},
    {"label": "খ", "text": "<rich>", "image": null, "marks": 2},
    {"label": "গ", "text": "<rich>", "image": null, "marks": 3},
    {"label": "ঘ", "text": "<rich>", "image": null, "marks": 4}
  ],
  "answers": ["<answer1>", "<answer2>", "<answer3>", "<answer4>"]
}
```

### MCQ Single type
```json
{
  "options": [
    {"label": "A", "text": "<rich>"},
    {"label": "B", "text": "<rich>"},
    {"label": "C", "text": "<rich>"},
    {"label": "D", "text": "<rich>"}
  ],
  "correctIndex": 0
}
```

### MCQ Multiple type
```json
{
  "options": [
    {"label": "A", "text": "<rich>"},
    {"label": "B", "text": "<rich>"},
    {"label": "C", "text": "<rich>"},
    {"label": "D", "text": "<rich>"}
  ],
  "correctIndices": [0, 2]
}
```

### Fill-in-Blanks type
```json
{
  "blanks": [
    {"id": "b1", "answer": "correct answer", "marks": 1, "caseSensitive": false},
    {"id": "b2", "answer": "another answer", "marks": 1, "caseSensitive": false}
  ]
}
```

### Written type
```json
{
  "expectedPoints": ["Point 1", "Point 2", "Point 3"],
  "wordLimit": 500,
  "minWords": 100,
  "guideLines": "<rich content>"
}
```

---

# 7. EVALUATION FLOW

## 7.1 Single Evaluation (Default)

```
Submission Submitted
        │
        ▼
Admin opens submission
        │
        ▼
Admin grades each answer (marks + feedback)
        │
        ▼
Admin submits evaluation (action: grade-submission)
        │
        ▼
System calculates totalObtainedMarks
        │
        ▼
If passMarks > 0: auto-set pass/fail
        │
        ▼
If autoPublishResults: publish
        │
        ▼
Submission status → evaluated (or published)
```

## 7.2 Double Review

```
First evaluator grades
        │
        ▼
System saves evaluation (stage: first)
        │
        ▼
Admin assigns second evaluator OR system auto-assigns
        │
        ▼
Second evaluator grades (blind or with first score visible)
        │
        ▼
Compare scores:
  ├── Difference ≤ threshold → auto-finalize (average or first score)
  └── Difference > threshold → flag as reviewNeeded
                                │
                                ▼
                      Third evaluator (admin/senior) resolves
                                │
                                ▼
                      Final score set, finalized
```

## 7.3 Rubric Evaluation

```
Admin enables rubric grading on exam
        │
        ▼
Each question has rubric: [{level, score, description}, ...]
        │
        ▼
During grading, admin selects rubric level per question
        │
        ▼
System auto-calculates marks from rubric selection
        │
        ▼
Admin can override marks if needed
        │
        ▼
Submit as normal
```

## 7.4 Bulk Evaluation

```
Admin opens "বulk grade by question" for a specific question
        │
        ▼
Shows all submissions' answers for that question (paginated)
        │
        ▼
Admin sets marks per submission, or applies default to all
        │
        ▼
Save → updates each answer individually
        │
        ▼
Auto-recalculate submission totals
```

## 7.5 Recheck Flow

```
Student views result → clicks "রিচেক অনুরোধ"
        │
        ▼
Submits reason + optional specific question references
        │
        ▼
Admins sees request in "রিচেক অনুরোধ" tab
        │
        ▼
Admin can:
  ├── Approve → assign evaluator for recheck
  │             │
  │             ▼
  │       Evaluator re-grades submission
  │             │
  │             ▼
  │       New score set (can be higher or lower)
  │             │
  │             ▼
  │       Notification sent to student
  │
  └── Reject → provide reason, notification sent
```

---

# 8. ADMIN FLOW (New UI Structure)

```
Written Exam Admin Panel
├── Dashboard (overview stats)
├── Exams
│   ├── List (search, filter, paginate)
│   ├── Create/Edit Exam
│   │   ├── Basic info (title, class/subject, pricing)
│   │   ├── Scheduling (start/end, sessions)
│   │   ├── Config (duration, attempts, pass marks)
│   │   └── Questions
│   │       ├── Add from bank (CQ/MCQ)
│   │       ├── Create new question
│   │       │   ├── CQ (4 sub-questions with rich content)
│   │       │   ├── MCQ (single/multiple, options)
│   │       │   ├── Fill-in-blanks
│   │       │   └── Written (long form)
│   │       ├── Reorder (drag & drop)
│   │       └── Set marks per question
│   ├── Sessions
│   │   ├── Create session (date, time, capacity)
│   │   └── View enrollment per session
│   └── Submissions
│       ├── All submissions (filter by status, paginated)
│       ├── Single grading view
│       ├── Bulk grading by question
│       ├── Double review queue
│       └── Publish results
├── Bundles (group exams)
│   ├── Create/Edit bundle
│   └── Add/remove exams
├── Recheck Requests
│   ├── Pending queue
│   ├── Approve/Reject
│   └── Track recheck results
├── Evaluators
│   ├── Manage evaluator assignments
│   └── View evaluator progress
└── Analytics
    ├── Per-exam stats
    ├── Score distribution chart
    ├── Pass/fail ratio
    ├── Per-question difficulty
    ├── CSV export
    └── Ranking
```

---

# 9. STUDENT FLOW (New UI)

```
Student Dashboard
└── Written Exams
    ├── Available Exams
    │   ├── Free exams
    │   └── Premium exams (with purchase)
    ├── My Upcoming Exams (scheduled)
    ├── My Results
    │   ├── Passed exams
    │   ├── Failed exams
    │   └── Pending results
    └── My Recheck Requests

Exam Taking Flow:
1. View exam details (title, duration, instructions)
2. Start exam (countdown timer starts)
3. Navigate questions (list or one-by-one)
4. For each question:
   - CQ: Type answer in text area, upload images
   - MCQ: Select option(s)
   - Fill-blanks: Type in blanks
   - Written: Type long-form answer, upload images
5. Save progress (auto-save every 30s)
6. Submit (with confirmation dialog)
7. View result (immediately or after grading)

Result View:
- Marks obtained / Total marks
- Pass/Fail badge
- Per-question breakdown
- Images with annotations (if showAnnotatedImages)
- Feedback from evaluator
- Correct answers (if showCorrectAnswers)
- "Request Recheck" button
- Leaderboard position (if available)
```

---

# 10. PERFORMANCE STRATEGY (10k+ Scale)

## 10.1 Database Optimizations

- **Indexes on all foreign keys and status fields**
- **Cursor-based pagination** for submission lists (instead of offset)
- **Pre-computed analytics** via `WrittenExamAnalytics` model (updated on publish)
- **Batch operations** for bulk grading (single UPDATE query per submission)
- **JSON fields for flexible data** (reducing joins)

## 10.2 Query Patterns

```typescript
// Cursor-based pagination for submissions
const submissions = await db.writtenExamSubmission.findMany({
  where: { examId, status },
  take: 20 + 1, // fetch one extra to check hasMore
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { submittedAt: 'desc' },
  include: { user: { select: { id: true, name: true, email: true } } }
})
```

## 10.3 Caching

- **SWR for client-side data fetching** (already used in many places)
- **Server-side caching** for exam detail/settings (revalidate on update)
- **Analytics cache** updated on publish, not real-time

## 10.4 Upload Handling

- **UploadThing** (already integrated) for image uploads
- Images linked via URL, not stored in DB
- Max image size + count configured per exam

---

# 11. SECURITY STRATEGY

## 11.1 Access Control

- **Written exams**: Check purchase or subscription via `checkContentAccess`
- **Evaluation**: Only assigned evaluator or admin can grade
- **Recheck**: Only student who submitted can request; only admin/evaluator can process
- **Admin operations**: Require `super_admin` or `admin` role
- **Data isolation**: Students see only their own submissions

## 11.2 Role Validation

```typescript
// New access control helper
async function requireEvaluator(request: Request, submissionId?: string) {
  const auth = await withAdmin(request)
  // If user is admin/super_admin, allow
  // If user is evaluator, check assignment
  // If submissionId provided, check if assigned to this evaluator
}
```

## 11.3 Rate Limiting

- Exam start: max 1 per 10 seconds per user
- Answer save: max 60 per minute per user
- Recheck request: max 1 per 24 hours per exam per user

## 11.4 Data Validation

- All input validated via Zod schemas
- Rich content sanitized (strip scripts, malicious HTML)
- Image URLs validated as belonging to allowed domains
- File uploads limited to images (check MIME type server-side)

---

# 12. MIGRATION STRATEGY

## Phase 0: Foundation (Keep current system running)

No changes to existing CQ Exam Package code. New models created alongside.

## Phase 1: Core Models + Admin CRUD

1. Add all new Prisma models
2. Create admin API for WrittenExam CRUD
3. Create admin API for WrittenExamQuestion CRUD
4. Build admin UI: Exam list, create/edit, question management
5. Run migration (`prisma migrate dev`)

## Phase 2: Question Types + Rich Content

1. Implement CQ question type (backward compatible with existing CQ bank)
2. Implement MCQ single/multiple question types
3. Implement fill-in-blanks question type
4. Implement written question type
5. Add rich content editor (LaTeX, image embedding)

## Phase 3: Student Exam Flow

1. Public API: list, detail, start-exam
2. Exam viewer UI (adapt from current CQExamViewerPage)
3. MCQ answer UI
4. Fill-in-blanks UI
5. Timer, auto-save, auto-submit
6. Submission flow

## Phase 4: Evaluation System

1. Single evaluation UI (adapt from current CQGradingInterface)
2. Bulk evaluation by question
3. Rubric grading
4. Publish results with notifications
5. Result view for students

## Phase 5: Advanced Features

1. Double review system
2. Recheck request system
3. Exam sessions & scheduling
4. Pass/Fail enforcement
5. Analytics dashboard
6. CSV export

## Phase 6: Performance & Data Migration

1. Add proper indexes
2. Cursor-based pagination
3. Pre-computed analytics
4. Migrate existing CQ exam data to new models (script)
5. Deprecate old CQ Exam Package admin UI
6. Redirect old routes to new system

## Phase 7: Polish & QA

1. Role management (evaluator, teacher)
2. Notification triggers (auto on grade, publish, recheck)
3. Load testing with 10k+ concurrent users
4. UI refinements
5. Documentation

---

# 13. COMPONENT MAPPING (Existing → New)

| Existing Component | New Component | Action |
|--------------------|---------------|--------|
| `CQPackageList` | `WrittenExamList` | Adapt |
| `CQPackageForm` | `WrittenExamForm` | Rewrite |
| `CQPackageDetail` | `WrittenExamDetail` | Rewrite |
| `CQExamSetForm` | (merged into exam form) | Merge |
| `CQQuestionManager` | `WrittenExamQuestionManager` | Adapt |
| `CQQuestionCreatePage` | `WrittenExamQuestionEditor` | Rewrite (multi-type) |
| `CQQuestionSearchDialog` | `WrittenExamBankSearchDialog` | Adapt |
| `CQSubmissions` | `WrittenExamSubmissionsList` | Adapt |
| `CQGradingInterface` | `WrittenExamGradingView` | Adapt |
| `CQBulkGradingView` | `WrittenExamBulkGradingView` | Adapt |
| `CQLeaderboard` | `WrittenExamLeaderboard` | Adapt |
| `CQRetakeRequests` | `WrittenExamRecheckRequests` | Rewrite |
| `CQExamViewerPage` | `WrittenExamViewerPage` | Rewrite (multi-type) |
| `CQExamResultPage` | `WrittenExamResultPage` | Adapt |
| `CQExamPackageDetailPage` | `WrittenExamDetailPage` | Adapt |
| `CQExamPackageListPage` | `WrittenExamListPage` | Adapt |
| `CQExamPackagePurchaseDialog` | `WrittenExamPurchaseDialog` | Adapt |
| `CQBulkCreateSetsDialog` | (removed, sessions instead) | Remove |
| `CQExamPreviewDialog` | (merged into viewer) | Remove |

---

# 14. RISK ASSESSMENT

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Data loss during migration | High | Low | Keep old DB intact, test migration on staging |
| Breaking existing student flows | High | Low | Backward-compatible API wrappers |
| Performance regression | Medium | Medium | Cursor pagination, pre-computed analytics |
| Rich content rendering issues | Medium | Medium | Use existing RichContentRenderer, extensive testing |
| MCQ auto-grading accuracy | Medium | Low | Strict validation, test with edge cases |
| Double review complexity | Low | Low | Simple score comparison, clear threshold config |
| Evaluation consistency | Medium | Medium | Rubric-based grading, evaluator guidelines |

---

# 15. TIMELINE ESTIMATE

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 0: Foundation | 1 day | Prisma migration, new DB models |
| Phase 1: Core CRUD | 3 days | Admin exam/question CRUD + UI |
| Phase 2: Question Types | 4 days | All 4 types + rich content + CQ bank integration |
| Phase 3: Student Flow | 5 days | Exam viewer, timer, MCQ/Fill/Write UI, submission |
| Phase 4: Evaluation | 4 days | Single/bulk/rubric grading, publish, result view |
| Phase 5: Advanced | 5 days | Double review, recheck, sessions, analytics, CSV |
| Phase 6: Migration | 3 days | Data migration, old → new route redirection |
| Phase 7: Polish | 3 days | Roles, notifications, load testing, docs |
| **Total** | **28 days** | |

---

*Document version: 1.0*
*Last updated: 2026-06-11*
