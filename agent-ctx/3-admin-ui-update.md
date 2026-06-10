# Task 3: Admin UI Update for CQ Exam Package Configuration Fields

## Summary
Updated all 3 admin UI files to support 8 new CQExamSet configuration fields:
- answerMode, showAnnotatedImages, autoPublishResults, maxImagesPerAnswer
- gradingDeadline, passMarks, showCorrectAnswers, enablePartialGrading

## Files Modified

### 1. `src/features/cq-exam/admin/hooks/use-cq-exam-packages.ts`
- Added 8 new useState pairs for the configuration fields with proper defaults
- Added all fields to `handleSaveSet` body with type conversions (parseInt, parseFloat, Date handling)
- Added all state/setters to the return object

### 2. `src/features/cq-exam/admin/components/CQExamSetForm.tsx`
- Extended CQExamSetFormProps with 8 new props
- Added new "উত্তর ও মূল্যায়ন সেটিংস" Card section with:
  - Answer Mode dropdown (4 options with Bengali labels)
  - 4 Switch toggles with descriptive text
  - 2 number inputs (maxImagesPerAnswer, passMarks) in grid
  - 1 datetime-local input (gradingDeadline)
- Moved save/cancel buttons to separate Card at bottom
- Added Settings2, Image, Eye, Award icons from Lucide

### 3. `src/features/cq-exam/admin/CQExamAdminContainer.tsx`
- Destructured all new state from hook
- Passed all new props to CQExamSetForm
- Reset all fields to defaults in onOpenCreateSet
- Populated all fields from existing set data in onOpenEditSet (with ?? fallbacks, datetime formatting)

## Notes
- The CQExamSetRecord type was already updated by Task 2 agent
- No new lint errors introduced (pre-existing 17 errors unchanged)
- Dev server log not available yet for runtime verification
