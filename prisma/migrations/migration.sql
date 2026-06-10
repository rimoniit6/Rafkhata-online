-- Performance optimization: Add comprehensive indexes for query performance
-- Run this to add missing indexes

-- User table indexes (already has @@index([supabaseUserId]) and @@index([email]))
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_user_is_premium ON "User"("isPremium");

-- MCQ table indexes
CREATE INDEX IF NOT EXISTS idx_mcq_chapter_id ON "MCQ"("chapterId");
CREATE INDEX IF NOT EXISTS idx_mcq_subject_id ON "MCQ"("subjectId");
CREATE INDEX IF NOT EXISTS idx_mcq_class_level ON "MCQ"("classLevel");
CREATE INDEX IF NOT EXISTS idx_mcq_is_active ON "MCQ"("isActive");
CREATE INDEX IF NOT EXISTS idx_mcq_is_premium ON "MCQ"("isPremium");
CREATE INDEX IF NOT EXISTS idx_mcq_board ON "MCQ"("board");
CREATE INDEX IF NOT EXISTS idx_mcq_year ON "MCQ"("year");
CREATE INDEX IF NOT EXISTS idx_mcq_difficulty ON "MCQ"("difficulty");
CREATE INDEX IF NOT EXISTS idx_mcq_created_at ON "MCQ"("createdAt");
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_mcq_chapter_active ON "MCQ"("chapterId", "isActive");
CREATE INDEX IF NOT EXISTS idx_mcq_subject_active ON "MCQ"("subjectId", "isActive", "isPremium");
CREATE INDEX IF NOT EXISTS idx_mcq_class_active ON "MCQ"("classLevel", "isActive", "isPremium");

-- CQ table indexes
CREATE INDEX IF NOT EXISTS idx_cq_chapter_id ON "CQ"("chapterId");
CREATE INDEX IF NOT EXISTS idx_cq_subject_id ON "CQ"("subjectId");
CREATE INDEX IF NOT EXISTS idx_cq_class_level ON "CQ"("classLevel");
CREATE INDEX IF NOT EXISTS idx_cq_is_active ON "CQ"("isActive");
CREATE INDEX IF NOT EXISTS idx_cq_is_premium ON "CQ"("isPremium");
CREATE INDEX IF NOT EXISTS idx_cq_board ON "CQ"("board");
CREATE INDEX IF NOT EXISTS idx_cq_year ON "CQ"("year");
CREATE INDEX IF NOT EXISTS idx_cq_created_at ON "CQ"("createdAt");
CREATE INDEX IF NOT EXISTS idx_cq_subject_active ON "CQ"("subjectId", "isActive", "isPremium");

-- Lecture table indexes
CREATE INDEX IF NOT EXISTS idx_lecture_chapter_id ON "Lecture"("chapterId");
CREATE INDEX IF NOT EXISTS idx_lecture_is_active ON "Lecture"("isActive");
CREATE INDEX IF NOT EXISTS idx_lecture_is_premium ON "Lecture"("isPremium");
CREATE INDEX IF NOT EXISTS idx_lecture_created_at ON "Lecture"("createdAt");
CREATE INDEX IF NOT EXISTS idx_lecture_chapter_active ON "Lecture"("chapterId", "isActive", "isPremium");

-- Payment table indexes
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"("status");
CREATE INDEX IF NOT EXISTS idx_payment_content_type ON "Payment"("contentType");
CREATE INDEX IF NOT EXISTS idx_payment_content_id ON "Payment"("contentId");
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON "Payment"("createdAt");
CREATE INDEX IF NOT EXISTS idx_payment_user_status ON "Payment"("userId", "status");
CREATE INDEX IF NOT EXISTS idx_payment_content_lookup ON "Payment"("userId", "contentType", "contentId", "status");

-- Exam table indexes
CREATE INDEX IF NOT EXISTS idx_exam_class_level ON "Exam"("classLevel");
CREATE INDEX IF NOT EXISTS idx_exam_is_active ON "Exam"("isActive");
CREATE INDEX IF NOT EXISTS idx_exam_status ON "Exam"("status");

-- ExamQuestion indexes
CREATE INDEX IF NOT EXISTS idx_exam_question_exam_id ON "ExamQuestion"("examId");
CREATE INDEX IF NOT EXISTS idx_exam_question_type_id ON "ExamQuestion"("questionType", "questionId");

-- ExamResult indexes
CREATE INDEX IF NOT EXISTS idx_exam_result_user_id ON "ExamResult"("userId");
CREATE INDEX IF NOT EXISTS idx_exam_result_exam_id ON "ExamResult"("examId");

-- BundleItem indexes
CREATE INDEX IF NOT EXISTS idx_bundle_item_content ON "BundleItem"("contentType", "contentId");
CREATE INDEX IF NOT EXISTS idx_bundle_item_bundle_id ON "BundleItem"("bundleId");

-- Progress indexes
CREATE INDEX IF NOT EXISTS idx_progress_user_content ON "Progress"("userId", "contentType");

-- Bookmark indexes
CREATE INDEX IF NOT EXISTS idx_bookmark_user_content ON "Bookmark"("userId", "contentType");

-- RecentlyViewed indexes
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON "RecentlyViewed"("userId", "viewedAt");

-- FeaturedContent indexes
CREATE INDEX IF NOT EXISTS idx_featured_section ON "FeaturedContent"("section", "isActive", "order");

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId", "isRead", "createdAt");

-- Navigation indexes
CREATE INDEX IF NOT EXISTS idx_navigation_location ON "Navigation"("location", "isActive", "order");

-- MCQExamPackage indexes
CREATE INDEX IF NOT EXISTS idx_mcq_exam_pkg_class ON "MCQExamPackage"("classId", "isActive");

-- MCQExamSet indexes
CREATE INDEX IF NOT EXISTS idx_mcq_exam_set_pkg ON "MCQExamSet"("packageId", "status");

-- MCQExamSetResult indexes
CREATE INDEX IF NOT EXISTS idx_mcq_exam_result_user ON "MCQExamSetResult"("userId", "setId");

-- CQExamPackage indexes
CREATE INDEX IF NOT EXISTS idx_cq_exam_pkg_class ON "CQExamPackage"("classId", "isActive");

-- CQExamSet indexes
CREATE INDEX IF NOT EXISTS idx_cq_exam_set_pkg ON "CQExamSet"("packageId", "status");

-- CQExamSubmission indexes
CREATE INDEX IF NOT EXISTS idx_cq_submission_user ON "CQExamSubmission"("userId", "setId");
CREATE INDEX IF NOT EXISTS idx_cq_submission_status ON "CQExamSubmission"("status");

-- SiteSetting indexes
CREATE INDEX IF NOT EXISTS idx_site_setting_group ON "SiteSetting"("group");
