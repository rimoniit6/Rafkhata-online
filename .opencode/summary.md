# Purchase Badge System

## Goal
Implement a purchase badge system across all content types (exam packages, suggestions, bundles) that shows "pending" status until admin verification, "purchased" after approval, and "premium" again after rejection, with duplicate payment protection.

## Done
- `src/app/api/mcq-exam-packages/route.ts` — `handleCheckPurchase` returns `pendingPayment: true/false`
- `src/components/exam/MCQExamPackageListPage.tsx` — PackageCard shows "অপেক্ষমাণ" badge (Clock icon, amber, disabled)
- `src/components/exam/MCQExamPackagePurchaseDialog.tsx` — Shows pending/purchased states on open
- `src/components/suggestion/SuggestionsPage.tsx` — 3-way badge (কেনা/অপেক্ষমাণ/প্রিমিয়াম), pending section in list/chapter views, `isSuggestionLocked` returns false for pending
- `src/components/shared/PurchaseOptionsModal.tsx` — Shows pending/purchased states on open
- `src/components/classes/ChapterDetailPage.tsx` — Pending suggestions separated, shown with Clock icon + yellow border, navigates to detail instead of purchase modal
- `src/components/classes/SubjectDetailPage.tsx` — Pending suggestions separated, shown with "অপেক্ষমাণ" badge + yellow border

## Key Decisions
- `isSuggestionLocked()` returns `false` for pending so cards use normal styling and navigate to detail page
- POST `/api/payment` already blocks duplicate payments — no changes needed
- `PremiumBadge.tsx` already has `pending` variant — no changes needed
- `PremiumLock.tsx` already accepts `pendingPayment` prop — no changes needed
- Batch-check API returns `{ purchased, pendingPayment }` for all content types
