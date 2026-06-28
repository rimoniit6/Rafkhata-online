# Task 4: CQ Exam Viewer Answer Mode Support

## Summary
Updated the CQExamViewerPage component to support dynamic answer modes based on the set's `answerMode` configuration.

## Changes Made

### File: `/home/z/my-project/src/components/cq-exam/CQExamViewerPage.tsx`

1. **Added `AnswerMode` type and updated `SetDetailData` interface**
   - Added `type AnswerMode = 'flexible' | 'text-only' | 'image-only' | 'complete-image-only'`
   - Added `answerMode: AnswerMode` and `maxImagesPerAnswer: number` to the `SetDetailData.set` interface

2. **Updated `CQBlock` component props**
   - Added `answerMode?: AnswerMode` (default: 'flexible') and `maxImagesPerAnswer?: number` (default: 5)
   - Updated answered count logic to respect answer modes:
     - `complete-image-only`: All sub-questions answered if global image exists
     - `image-only` with global image: All sub-questions counted as answered
     - `text-only`: Only text answers count
     - `flexible`: Text or images count (original behavior)
   - Conditional rendering of input controls based on mode:
     - `text-only`: Only Textarea, no image buttons
     - `image-only`: Only image upload buttons, no Textarea
     - `complete-image-only`: Only global image upload area (no per-sub-question inputs)
     - `flexible`: Textarea + image button + global image area (original behavior)
   - Enhanced global image upload area for `complete-image-only` mode with:
     - Larger upload area (`py-6` vs `py-3`)
     - Larger preview images (`size-32` vs `size-24`)
     - Instructional text in amber banner
     - No dashed border separator (since no sub-question inputs above)

3. **Enforced `maxImagesPerAnswer` limit**
   - In `addAnswerImage`, check current image count before opening file picker
   - Show Bengali toast message if limit reached: "ছবির সীমা পূর্ণ — প্রতিটি উত্তরে সর্বোচ্চ Xটি ছবি আপলোড করা যাবে"

4. **Updated total answered count and progress bar**
   - Added `answerMode` variable from `setData.set.answerMode`
   - Updated `totalAnswered` calculation to handle all four modes
   - Progress bar automatically reflects correct calculation

5. **Updated pre-exam start screen**
   - Added amber info banner showing answer mode description in Bengali:
     - `flexible`: "আপনি টেক্সট, ছবি অথবা সম্পূর্ণ উত্তরের ছবি দিতে পারবেন"
     - `text-only`: "শুধুমাত্র টেক্সট উত্তর দিতে পারবেন"
     - `image-only`: "শুধুমাত্র ছবি আপলোড করতে পারবেন"
     - `complete-image-only`: "সম্পূর্ণ উত্তরের খাতার ছবি আপলোড করতে হবে"

6. **Passed new props to CQBlock instances**
   - `answerMode={answerMode}`
   - `maxImagesPerAnswer={setData.set.maxImagesPerAnswer ?? 5}`

## Lint Status
No new lint errors introduced. All existing lint errors are in unrelated files.
