# Written Assessment System - Implementation Plan

## Overview

This document breaks down the architecture redesign into concrete, sequential implementation tasks. Each phase builds on the previous one. The old CQ Exam Package system remains untouched until Phase 6.

---

## Phase 0: Foundation — Database Schema (1 day)

### Tasks

1. **Add new Prisma models to schema.prisma**
   - `WrittenExam`, `WrittenExamClassSubject`, `WrittenExamQuestion`
   - `WrittenExamSession`, `WrittenExamSubmission`, `WrittenExamAnswer`
   - `WrittenExamAnswerImage`, `WrittenExamEvaluation`
   - `WrittenExamRecheckRequest`, `WrittenExamAnalytics`
   - `WrittenExamBundle`, `WrittenExamBundleExam`
   - `WrittenExamPurchase`, `WrittenExamBundlePurchase`

2. **Add new roles to User model**
   - Add `evaluator` to role enum (current: `student, admin, super_admin`)
   - Add optional `assignedExams` relation

3. **Run migration**
   ```bash
   npx prisma migrate dev --name add-written-exam-system
   ```

4. **Add indexes for performance**
   - Composite indexes on `[examId, status]`, `[examId, userId]`
   - Indexes on `status`, `submittedAt`, `attemptNumber`

### Verification
- Migration applies cleanly
- New models accessible in Prisma Studio
- Existing CQ models unchanged

---

## Phase 1: Core CRUD — Admin Exam Management (3 days)

### Tasks

1. **Create `/api/admin/written-exams/route.ts`**
   - GET: `list`, `detail`
   - POST: `create`
   - PUT: `update`
   - DELETE: `delete`

2. **Create admin UI components** (under `src/features/written-exam/admin/`)
   - `WrittenExamAdminContainer.tsx` — View router (copy pattern from `CQExamAdminContainer.tsx`)
   - `WrittenExamList.tsx` — Paginated list with search/filter
   - `WrittenExamForm.tsx` — Create/edit form (class/subject selection, pricing, config)
   - `WrittenExamDetail.tsx` — Single exam view with sessions tab
   - Types file: `src/features/written-exam/types.ts`

3. **Create `/api/admin/written-exam-questions/route.ts`**
   - GET: `list` (questions for an exam)
   - POST: `create` (with `questionType` discriminator)
   - PUT: `update`, `reorder-questions`
   - DELETE: `delete-question`

4. **Create question management UI**
   - `WrittenExamQuestionManager.tsx` — Question list with reorder
   - `WrittenExamQuestionForm.tsx` — Question editor (multi-type, rich content)
   - `WrittenExamBankSearchDialog.tsx` — Import from CQ bank

5. **Create session management**
   - `WrittenExamSessionForm.tsx` — Add/edit sessions
   - `/api/admin/written-exams/route.ts` — Add `create-session`, `update-session`, `delete-session`

### Verification
- Admin can create/edit exams with class/subject associations
- Admin can add CQ-bank questions and create typed questions
- Admin can reorder questions
- Questions display rich content (LaTeX, images)
- Admin can manage sessions

---

## Phase 2: Question Types — Full Question Builder (4 days)

### Tasks

1. **Implement CQ type**
   - Backward compatible: reuse existing CQ bank model
   - New `config` JSON format: `{ subQuestions: [{label, text, image, marks}], answers: [] }`
   - Migration: existing `typedQuestion1-4` + `subMarks` → new JSON config

2. **Implement MCQ single type**
   - Admin UI: Add options (A/B/C/D), set correct answer
   - Config JSON: `{ options: [{label, text}], correctIndex }`
   - Student UI: Radio button selection
   - Auto-grading on submit: compare with correctIndex

3. **Implement MCQ multiple type**
   - Admin UI: Add options, set multiple correct answers
   - Config JSON: `{ options: [{label, text}], correctIndices: [0, 2] }`
   - Student UI: Checkbox selection
   - Auto-grading: partial marks (each correct = totalMarks / correctCount)

4. **Implement Fill-in-blanks type**
   - Admin UI: Define blanks with correct answers
   - Config JSON: `{ blanks: [{id, answer, marks, caseSensitive}] }`
   - Student UI: Input fields for each blank
   - Auto-grading: exact match (or case-insensitive)

5. **Implement Written type**
   - Admin UI: Set expected points, word limit
   - Config JSON: `{ expectedPoints, wordLimit, minWords }`
   - Student UI: Textarea with word count
   - Manual grading only

6. **Add rich content support**
   - Integrate with existing `RichContentRenderer` component
   - LaTeX support via KaTeX (wrap in `$$...$$` or `$...$`)
   - Image embedding via UploadThing
   - Simple toolbar for bold, italic, lists, tables

### Verification
- All 4 question types creatable through admin UI
- Rich content renders correctly in questions
- MCQ auto-grading works on student submission
- Fill-in-blanks auto-grading works
- Backward compatible with existing CQ bank data

---

## Phase 3: Student Exam Flow (5 days)

### Tasks

1. **Create public API `/api/written-exams/route.ts`**
   - GET: `list`, `detail`, `check-purchase`
   - POST: none yet

2. **Create `/api/written-exam-submissions/route.ts`**
   - POST: `start-exam`, `save-answer`, `add-image`, `remove-image`, `submit-exam`
   - Implement MCQ auto-grading on submit

3. **Create exam viewer UI** `src/components/written-exam/WrittenExamViewerPage.tsx`
   - Adapt from `CQExamViewerPage.tsx`
   - Timer (countdown from duration)
   - Question navigation (list view or one-by-one)
   - Per-question type rendering:
     - CQ: Textarea per sub-question + image upload
     - MCQ: Radio/checkbox selection
     - Fill-blanks: Input fields
     - Written: Textarea with word count
   - Image upload via UploadThing (existing `screenshotUploader` endpoint)
   - Auto-save every 30 seconds
   - Submit with confirmation dialog

4. **Create exam list & detail pages**
   - `WrittenExamListPage.tsx` — Available exams list
   - `WrittenExamDetailPage.tsx` — Single exam detail with start button

5. **Implement access control**
   - Check purchase for premium exams
   - Check subscription as fallback
   - Check exam availability (scheduling window)

### Verification
- Students can see available exams
- Students can start an exam (timer begins)
- All question types render correctly
- Students can save answers and upload images
- MCQ auto-grades on submit
- Auto-save works
- Timer expires and auto-submits
- Submission is stored correctly

---

## Phase 4: Evaluation System (4 days)

### Tasks

1. **Create `/api/admin/written-exam-evaluations/route.ts`**
   - GET: `submissions`, `submission-detail`, `bulk-grade-by-question`
   - POST: `grade-submission`, `bulk-grade`, `save-bulk-grades-by-question`
   - PUT: `publish-results`

2. **Create evaluation UI components**
   - `WrittenExamSubmissionsList.tsx` — All submissions with status filter, paginated
   - `WrittenExamGradingView.tsx` — Single submission grading (adapt from CQGradingInterface)
     - For MCQ: show selected answer + correct answer
     - For fill-blanks: show student answer + correct answer
     - For CQ/written: show answer text/images, evaluator inputs marks + feedback
     - Image lightbox for reviewing uploaded images
   - `WrittenExamBulkGradingView.tsx` — Grade one question across all submissions

3. **Implement result publishing**
   - Publishing sets status to `published`
   - Creates Bengali notifications
   - Auto-publish if configured
   - Calculate pass/fail based on passMarks

4. **Create student result page** `WrittenExamResultPage.tsx`
   - Show marks per question
   - Show pass/fail badge
   - Show feedback from evaluator
   - Show annotated images
   - Show correct answers (if enabled)
   - "Request Recheck" button

### Verification
- Admin can view all submissions for an exam
- Single grading works for all question types
- Bulk grading by question works
- Results can be published
- Students can view their results
- Notifications are created
- Pass/Fail is calculated correctly

---

## Phase 5: Advanced Features (5 days)

### Tasks

1. **Double Review System**
   - DB: `WrittenExamEvaluation` model (first/second/third stages)
   - API: `submit-evaluation`, `resolve-dispute`
   - UI: Second evaluator dashboard, dispute resolution view
   - Score comparison logic: difference > threshold → flag for third review

2. **Recheck System**
   - API: `POST /api/written-exam-rechecks/` — `request-recheck`
   - API: `PUT /api/admin/written-exams/` — `approve-recheck`, `complete-recheck`
   - UI: Recheck request form (student), Recheck queue (admin), Recheck grading (evaluator)

3. **Exam Sessions & Scheduling**
   - Enforce session time windows in `start-exam`
   - Session capacity tracking (reject if full)
   - Admin view of session enrollment

4. **Analytics Dashboard**
   - Pre-computed stats in `WrittenExamAnalytics`
   - UI: `WrittenExamAnalyticsPage.tsx`
     - Score distribution chart (use existing chart library)
     - Pass/fail ratio
     - Per-question difficulty analysis
     - Average time, highest/lowest scores
   - CSV export endpoint

5. **Leaderboard**
   - `WrittenExamLeaderboard.tsx` — Adapt from CQLeaderboard
   - Show rank, name, score, time
   - Filter by class/subject

### Verification
- Double review works: 2 evaluators, score comparison, dispute resolution
- Recheck flow complete: request → approve → regrade → result
- Sessions enforce capacity and timing
- Analytics show correct data
- CSV export produces valid file
- Leaderboard is accurate

---

## Phase 6: Data Migration & Route Transition (3 days)

### Tasks

1. **Create migration script** `scripts/migrate-cq-to-written.ts`
   - Each `CQExamPackage` → `WrittenExam`
   - Each `CQExamSet` → questions grouped into the same exam
   - Each `CQExamSetQuestion` → `WrittenExamQuestion` (convert typed questions to new config format)
   - Each `CQExamPackagePurchase` → `WrittenExamPurchase`
   - Each `CQExamSubmission` → `WrittenExamSubmission`
   - Each `CQExamAnswer` → `WrittenExamAnswer`
   - Each `CQExamAnswerImage` → `WrittenExamAnswerImage`

2. **Run migration on staging, verify data integrity**

3. **Add backward-compatible API wrappers**
   - Old `GET /api/cq-exam-packages?action=list` → redirects to new exam list (or displays both)
   - Old package detail → shows migrated data

4. **Deprecate old CQ admin UI**
   - Add banner: "পরবর্তী সংস্করণে এই পৃষ্ঠাটি সরানো হবে"
   - Link to new Written Exam admin UI
   - Keep old routes active but read-only

5. **Remove old code** (after migration verified)
   - Delete `src/features/cq-exam/admin/` components
   - Delete old API routes
   - Keep CQ bank (`/api/cq/`, `/api/admin/cq/`) — still used for question bank reference

### Verification
- All old data migrated correctly
- Old URLs redirect or show migrated data
- No data loss
- Old admin UI deprecated gracefully

---

## Phase 7: Polish & Performance (3 days)

### Tasks

1. **Role Management**
   - Update `requireAuth`, `requireAdmin` for new roles
   - Create evaluator assignment UI
   - Create teacher dashboard (view student results)

2. **Notification Triggers**
   - Auto-notify on: grade complete, results published, recheck approved/rejected/completed
   - Use existing Bengali notification system

3. **Performance Optimization**
   - Add cursor-based pagination to submission lists
   - Add database indexes (verify with EXPLAIN)
   - Pre-compute analytics on publish
   - Optimize image loading (lazy load, thumbnail generation)

4. **Load Testing**
   - Simulate 100+ concurrent exam starts
   - Simulate 10k+ submissions
   - Measure API response times
   - Optimize slow queries

5. **UI Polish**
   - Loading states, error states, empty states
   - Mobile responsiveness for exam viewer
   - Accessibility improvements
   - Bengali text consistency

### Verification
- 10k+ submissions load within 2 seconds
- Concurrent exam starts don't fail
- API responses < 500ms for typical queries
- Mobile exam viewer is usable
- All UI has proper loading/error states

---

## Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| 0 | 1 day | Database schema + migration |
| 1 | 3 days | Core CRUD (admin exam/question management) |
| 2 | 4 days | Question types (CQ, MCQ, fill-blanks, written) |
| 3 | 5 days | Student exam flow (viewer, timer, submission) |
| 4 | 4 days | Evaluation system (grading, bulk, results) |
| 5 | 5 days | Advanced features (double review, recheck, analytics) |
| 6 | 3 days | Data migration & deprecation |
| 7 | 3 days | Polish, performance, roles, notifications |
| **Total** | **28 days** | |

---

*Document version: 1.0*
*Last updated: 2026-06-11*
