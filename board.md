# Board Question System — Complete Documentation

## Overview

The Board Question system lets students browse, filter, search, and practice past board exam questions (MCQ and CQ) from Bangladeshi education boards. Questions are stored in the `MCQ` and `CQ` database tables with board, year, classLevel, subject, and chapter metadata.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BoardQuestionExplorer                        │
│  (Orchestrator — src/components/board/BoardQuestionExplorer.tsx)   │
└───────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
  ExplorerHeader  Search   QuickFilters CoreFilterBar FilterChips
                                           │
                                           ▼
                                    AdvancedFilters
                                      Drawer
        ┌──────────┬──────────┬──────────┴──────────┬──────────┐
        ▼          ▼          ▼                     ▼          ▼
  ResultsAnalytics McqViewMode CqViewMode     ConversionBanner 
        │          │          │                         
        ▼          ▼          ▼                         
  EmptyExplorer  McqViewCard CqViewCard       SelectClassPrompt
  /Skeleton      (per MCQ)   (per CQ)          
```

## State Management

### `useBoardFilterStore` (Zustand — `src/store/board-filters.ts`)

Central state for all filter selections:

| State | Type | Default |
|---|---|---|
| `searchQuery` | `string` | `''` |
| `classLevels` | `string[]` | `[]` |
| `boards` | `string[]` | `[]` |
| `years` | `string[]` | `[]` |
| `subjects` | `string[]` | `[]` |
| `chapters` | `string[]` | `[]` |
| `questionTypes` | `string[]` | `[]` |
| `difficulty` | `string[]` | `[]` |
| `topics` | `string[]` | `[]` |
| `status` | `string[]` | `[]` |
| `contentAccess` | `'all' \| 'free' \| 'premium' \| 'unlocked'` | `'all'` |
| `sortBy` | `'year_desc' \| 'year_asc' \| 'popularity' \| 'recently_viewed'` | `'year_desc'` |
| `labelMap` | `Record<key, Record<string, string>>` | Bengali labels |

**Actions:** `setSearchQuery`, `setFilter` (replace), `toggleFilter` (add/remove), `clearFilters`, `removeFilterValue`, `setLabelMap`, `getActiveChips`, `getFilterCount`, `getActiveFilterKeys`

---

## Components (19 files in `src/components/board/`)

### 1. `BoardQuestionExplorer.tsx` (Main Orchestrator)

- **Default export**, no props
- Manages MCQ/CQ tab state, pagination (separate for each tab)
- Loads questions via `useBoardQuestionsData(page, limit, 'mcq'|'cq')` — two separate hook instances
- Determines access via `useAccessStatus(questions)` — calls POST `/api/payment/batch-check`
- Renders the full layout from top to bottom:
  1. `ExplorerHeader` — hero banner
  2. `ExplorerSearch` — animated search bar
  3. `QuickFilters` — preset buttons
  4. `CoreFilterBar` — sticky filter bar
  5. `FilterChips` — active filter badges
  6. SelectClassPrompt / Results (conditional)
  7. `ConversionBanner` (when premium questions exist)
  8. `ResultsAnalytics` — stat cards
  9. MCQ/CQ tabs with `McqViewMode` / `CqViewMode`
- **Practice All** (`handlePracticeAll`): navigates to the `mcq-exam` route with filter params (`classSlug`, `subjectId`, `year`, `boardName`, `classLevel`, `source: 'board'`) so the practice session fetches questions matching the page's current filters

### 2. `ExplorerHeader.tsx`

- **Props:** `{ totalQuestions, recentAdded, activeStudents }`
- Static hero section with gradient background
- Shows 3 stat cards: total board questions, recently added, active students (Bengali numerals)

### 3. `ExplorerSearch.tsx`

- Reads/writes `searchQuery` to `useBoardFilterStore`
- Debounced input (400ms via `useDebounce` in `use-board-questions-data`)
- Autocomplete dropdown with recent searches (localStorage), popular presets, and API-driven suggestions (fetched from `/api/board-questions/search-suggestions?q=...`)

### 4. `QuickFilters.tsx`

- Horizontal scrollable row of toggle buttons for the last 2 classes (SSC, HSC) and popular boards (Dhaka, Rajshahi)
- "Clear All" button when any filter is active

### 5. `CoreFilterBar.tsx`

- **Sticky bar** (`position: sticky; z-index: 30`)
- **Desktop:** 6-column grid of `MultiSelect` components: Class, Board, Year, Subject, Chapter, Question Type + Advanced/Sliders button + Clear button
- **Mobile:** 2-column grid + "More Filters" drawer button
- **Cascading:** Selecting a Class filters available Subjects; selecting Subjects filters available Chapters
- **Filter reset:** Changing a Class resets any Subjects/Chapters that are no longer valid for the new selection (via `handleClassChange`); changing Subjects similarly resets invalid Chapters (via `handleSubjectChange`)
- Opens `AdvancedFiltersDrawer` via `advancedOpen` state

### 6. `AdvancedFiltersDrawer.tsx`

- **Props:** `{ open, onOpenChange }`
- **Desktop:** `Sheet` (side panel, 420px/520px wide)
- **Mobile:** `Drawer` (bottom sheet, 88vh max height)
- **5 filter groups:**
  | Group | Type | Options |
  |---|---|---|
  | Content Access | Radio | All / Free / Premium / Unlocked |
  | Difficulty | Checkbox | Easy / Medium / Hard |
  | Progress Status | Checkbox | Solved / Unsolved / Bookmarked / Attempted / Not Attempted / Correct / Wrong |
  | Popularity | Checkbox | Recently Viewed / Frequently Asked / Most Repeated |
  | Sort By | Radio | Year (Newest) / Year (Oldest) / Popularity / Recently Viewed |

### 7. `FilterChips.tsx`

- Displays active filters as removable animated chips
- Each chip shows the label (Bengali) + X button
- "Clear All" button when more than 1 chip
- Uses `labelMap` from store for display names

### 8. `ResultsAnalytics.tsx`

- **Props:** `{ data: AnalyticsData, isLoading }`
- 7-column grid of stat cards:
  | Card | Icon | Source |
  |---|---|---|
  | Total Found | `FileText` | `analytics.totalQuestions` |
  | Accessible | `Unlock` | `total - premium` |
  | Premium | `Crown` | `analytics.premiumQuestions` |
  | Boards | `Globe` | `analytics.availableBoards` |
  | Subjects | `BookOpen` | `analytics.availableSubjects` |
  | Chapters | `Layers` | `analytics.availableChapters` |
  | Accuracy | `Percent` | `analytics.accuracyRate` (real user data) |
- Skeleton on loading, hidden when total is 0

### 9. `McqViewMode.tsx`

- **Props:** `{ questions, accessMap, page, totalPages, total, onPageChange, onPracticeAll, onUnlock }`
- "Practice All" banner showing count of accessible MCQs + button
- Renders `McqViewCard` for each question (keyed by `q.id`)
- Smart pagination with ellipsis: shows up to 7 visible page numbers
- Footer: "Showing X of Y · Page A of B"

### 10. `McqViewCard.tsx`

- **Props:** `{ question: BoardQuestionItem, index, accessStatus?, onUnlock }`
- Displays: board badge (colored), subject name, chapter name, year
- Shows 4 options (A/B/C/D) as styled buttons
- **Free/Purchased:** Options clickable, can toggle correct answer + explanation
- **Locked:** Options blurred, "Unlock" CTA button, blurred explanation preview
- **Pending:** "Pending verification" badge
- Tracks `showAnswer` and `showExplanation` state locally

### 11. `CqViewMode.tsx`

- **Props:** `{ questions, accessMap, page, totalPages, total, onPageChange, onUnlock }`
- Same pagination logic as McqViewMode
- Renders `CqViewCard` for each question

### 12. `CqViewCard.tsx`

- **Props:** `{ question: BoardQuestionItem, index, accessStatus?, onUnlock }`
- Displays: board badge, subject, chapter, year, question text (stimulus/passage)
- **Free/Purchased:** Shows up to 4 sub-questions (ক, খ, গ, ঘ) with individual "Show Answer" toggles
- **Locked:** Shows stimulus only + unlock overlay
- Tracks which sub-answers are revealed via `revealedAnswers: Set<number>`

### 13. `EmptyExplorer.tsx`

- Contextual empty state: different messaging for "no search results" vs "no questions match filters"
- "Remove All Filters" and "Reset & Try Again" buttons
- Suggestion pills for popular classes

### 14. `ExplorerSkeleton.tsx`

- Loading skeleton: analytics grid (7 cards), filter chips, 6 question card skeletons, pagination
- Uses `Skeleton` UI component

### 15. `ConversionBanner.tsx`

- **Props:** `{ totalQuestions, accessibleQuestions, premiumQuestions }`
- Dismissible amber gradient banner showing locked question count with upgrade CTA
- **Guest:** "Login & Unlock" → navigates to login
- **Free user:** "Upgrade Now" → opens purchase options
- **Any authenticated non-free user (premium or other paid status):** hidden

### 16. `SelectClassPrompt.tsx`

- Shown when no class is selected
- Graduation cap icon, instructional text, mini flow: "Select Class → Subject → Chapter"

### 17. `PackageLockOverlay.tsx`

- **Props:** `{ price, packages?, bundles?, onAction, className? }`
- Overlay component for locked content showing package/bundle offers with discount pricing
- **Guest:** "Login & Unlock" CTA
- **With offers:** Shows available packages/bundles (up to 2 each) with discount badges and "View Offers" CTA
- **No offers:** "Purchase Now" CTA with price display
- Finds and displays the lowest price across direct price, packages, and bundles

### 18. `QuestionList.tsx` (Legacy — Unused)

- Older generic question list with tabs for MCQ/CQ
- Uses `QuestionCard` sub-component
- **Not imported or used by the current `BoardQuestionExplorer` orchestrator**

### 19. `QuestionCard.tsx` (Legacy — Unused)

- Legacy single question card with bookmark/share actions
- **Not imported or used by the current `BoardQuestionExplorer` orchestrator**

---

## Data Hooks

### `useBoardQuestionsData(page, limit?, type?)` — `src/hooks/use-board-questions-data.ts`

- Reads all filters from `useBoardFilterStore`
- Builds URL query params, debounces search via `useDebounce` (400ms)
- Calls `GET /api/board-questions?` with React Query (`staleTime: 30s`)
- Default `limit` sent to API: 20 (when no `limitOverride` provided); the API itself defaults to 50
- Returns `{ questions, analytics, isLoading, isFetching, error, pagination, refetch }`
- **Note:** The hook's `purchaseMap` field is reserved for future use and currently returns an empty object. Real per-question access checking is handled by the separate `useAccessStatus` hook.

### `useHierarchyMetadata()` — `src/hooks/use-hierarchy-metadata.ts`

- Fetches `GET /api/hierarchy/metadata`
- Provides derived maps: `classOptions`, `boardOptions`, `yearLabels`, `classLevelLabels`, `boardColorMap`, etc.
- Fallback data for classes (6-10/HSC) and boards (10 divisions) when API unavailable
- Helper functions: `getClassName(slug)`, `getBoardName(slug)`, `getBoardColor(slug)`, etc.

### `useAccessStatus(questions)` — `src/hooks/use-access-status.ts`

- Batches questions via `POST /api/payment/batch-check`
- Returns `Record<questionId, { accessType: 'free'|'purchased'|'pending'|'locked', purchaseReason, packages?, bundles? }>`
- For locked premium items, fetches available packages/bundles for purchase

---

## API Routes (Public, 3 files)

### `GET /api/board-questions`

**The main data endpoint.** Query params:

| Param | Format | Description |
|---|---|---|
| `type` | `mcq\|cq` | Fetch only one type |
| `board` | `str1,str2` | Comma-separated board slugs |
| `year` | `str1,str2` | Comma-separated years |
| `classLevel` | `str1,str2` | Comma-separated class slugs |
| `subjectId` | `str1,str2` | Comma-separated subject IDs |
| `chapterId` | `str1,str2` | Comma-separated chapter IDs |
| `difficulty` | `str1,str2` | Comma-separated difficulty levels |
| `topic` | `str1,str2` | Comma-separated topics |
| `search` | `string` | Text search (MCQ→question, CQ→uddeepok) |
| `access` | `free\|premium\|unlocked` | Content access filter |
| `sortBy` | `year_desc\|year_asc\|popularity` | Sort order |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Per page (default: 50, max: 100). Note: the `useBoardQuestionsData` hook defaults to 20 when no `limitOverride` is provided |

**Logic flow:**
1. Rate limit check
2. Parse multi-value filters (comma-separated)
3. Query `MCQ` and/or `CQ` tables with Prisma `where` clause
4. Compute analytics via raw SQL UNION across both tables (deduplicated distinct counts)
5. Fetch practice data for authenticated users (`MCQExamSetResult` + `CQExamSubmission`)
6. Combine MCQ+CQ items, sort by year desc then board asc
7. Enrich with board colors
8. If authenticated: `batchCheckContentAccess` → strip answers for locked premium items; if `access=unlocked` → filter to only unlocked items
9. If unauthenticated: strip all premium answers

**Response shape:**
```ts
{
  data: BoardQuestionItem[]
  pagination: { page, limit, total, totalPages }
  analytics: AnalyticsData  // totalQuestions, premiumQuestions, accessibleQuestions,
                              // unlockedQuestions (currently same as accessibleQuestions –
                              // not real user unlock data), availableBoards/Subjects/Chapters
                              // (deduplicated), questionsPracticed (real), accuracyRate (real)
}
```

### `GET /api/board-questions/filters`

Dynamic filter options: given `classLevel` and/or `year`, returns available boards, subjects, chapters with counts.

### `GET /api/board-questions/search-suggestions`

Returns grouped suggestions (boards, subjects, chapters, years) for a search query `q`. Without `q`, returns popular defaults.

---

## Exam Practice Flow

```
BoardQuestionExplorer
  → User selects filters
  → Clicks "Practice All"
  → navigate('mcq-exam', { classSlug, subjectId, year, boardName, classLevel, source: 'board' })
  → MCQExamPage.tsx
    → Reads filter params (classSlug, subjectId, year, boardName)
    → fetch /api/mcq?classLevel=...&subjectId=...&year=...&board=...&limit=9999
    → Returns questions matching those filters
    → Premium filtering: batch-check, remove locked
    → User answers questions
    → Submit → navigate('mcq-result', { source: 'board', ... })
  → MCQResultPage.tsx
    → Re-fetches the same filtered questions via /api/mcq
    → Shows results
```

### Individual Question Practice

Clicking a specific question's "Practice" button navigates to the MCQ exam page with the same filter-based params, as there is no per-question direct practice route.

---

## Key Files Reference

| File | Purpose |
|---|---|---|
| `src/components/board/BoardQuestionExplorer.tsx` | Main page orchestrator |
| `src/components/board/explorer/*.tsx` | 17 explorer UI components |
| `src/store/board-filters.ts` | Zustand filter state |
| `src/types/board-questions.ts` | All TS interfaces |
| `src/hooks/use-board-questions-data.ts` | Data fetching hook |
| `src/hooks/use-hierarchy-metadata.ts` | Class/board/subject metadata |
| `src/hooks/use-access-status.ts` | Per-question access check |
| `src/hooks/use-stats.ts` | Site-wide stats (active students count) |
| `src/hooks/use-mobile.ts` | Responsive breakpoint detection |
| `src/components/shared/PurchaseOptionsModal.tsx` | Purchase/unlock modal for premium questions |
| `src/app/api/board-questions/route.ts` | Main data API |
| `src/app/api/board-questions/filters/route.ts` | Filter options API |
| `src/app/api/board-questions/search-suggestions/route.ts` | Search suggestions API |
| `src/app/api/mcq/route.ts` | MCQ exam/practice API |
| `src/components/mcq/MCQExamPage.tsx` | Exam practice page |
| `src/components/mcq/MCQResultPage.tsx` | Exam result page |
| `src/store/exam.ts` | Exam session store (answers, timer, questionIds) |
| `src/lib/access-control.ts` | `batchCheckContentAccess` utility |
| `src/app/api/payment/batch-check/route.ts` | Client-side access check endpoint |

## UI States

Every component handles these states:
- **Loading:** `ExplorerSkeleton` for the results area; individual skeletons in `ResultsAnalytics`
- **Empty:** `EmptyExplorer` with contextual messaging and action buttons
- **Error:** Error message with "Try Again" button (in `BoardQuestionExplorer`)
- **No class selected:** `SelectClassPrompt` with instructions
- **Success (no premium):** Full results with free questions
- **Success (w/premium):** Results + `ConversionBanner` with upgrade CTA
- **Mixed access:** Cards show lock/unlock/pending state per question via `McqViewCard`/`CqViewCard`
- **Filter active:** Filter chips shown; analytics update dynamically; "Clear All" available
