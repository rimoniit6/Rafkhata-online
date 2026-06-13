-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_supabaseUserId_idx";

-- CreateIndex
CREATE INDEX "CQExamRetakeRequest_reviewedBy_idx" ON "CQExamRetakeRequest"("reviewedBy");

-- CreateIndex
CREATE INDEX "CQExamSet_scheduledDate_idx" ON "CQExamSet"("scheduledDate");

-- CreateIndex
CREATE INDEX "CQExamSubmission_gradedBy_idx" ON "CQExamSubmission"("gradedBy");

-- CreateIndex
CREATE INDEX "Exam_classLevel_isActive_idx" ON "Exam"("classLevel", "isActive");

-- CreateIndex
CREATE INDEX "Exam_subjectId_idx" ON "Exam"("subjectId");

-- CreateIndex
CREATE INDEX "MCQExamPackagePurchase_paymentId_idx" ON "MCQExamPackagePurchase"("paymentId");

-- CreateIndex
CREATE INDEX "MCQExamRetakeRequest_reviewedBy_idx" ON "MCQExamRetakeRequest"("reviewedBy");

-- CreateIndex
CREATE INDEX "MCQExamSet_scheduledDate_idx" ON "MCQExamSet"("scheduledDate");

-- CreateIndex
CREATE INDEX "Payment_reviewedBy_idx" ON "Payment"("reviewedBy");

-- CreateIndex
CREATE INDEX "UserSubscription_paymentId_idx" ON "UserSubscription"("paymentId");
