-- Convert String fields to Json in Prisma schema
-- Step 1: Drop old defaults, Step 2: Alter column type, Step 3: Set new defaults

-- MCQExamPackage.subjectIds
ALTER TABLE "MCQExamPackage" ALTER COLUMN "subjectIds" DROP DEFAULT;
ALTER TABLE "MCQExamPackage" ALTER COLUMN "subjectIds" TYPE JSONB USING "subjectIds"::jsonb;
ALTER TABLE "MCQExamPackage" ALTER COLUMN "subjectIds" SET DEFAULT '[]'::jsonb;

-- CQExamPackage.subjectIds
ALTER TABLE "CQExamPackage" ALTER COLUMN "subjectIds" DROP DEFAULT;
ALTER TABLE "CQExamPackage" ALTER COLUMN "subjectIds" TYPE JSONB USING "subjectIds"::jsonb;
ALTER TABLE "CQExamPackage" ALTER COLUMN "subjectIds" SET DEFAULT '[]'::jsonb;

-- ExamResult.answers
ALTER TABLE "ExamResult" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;

-- MCQExamSetResult.answers
ALTER TABLE "MCQExamSetResult" ALTER COLUMN "answers" DROP DEFAULT;
ALTER TABLE "MCQExamSetResult" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;
ALTER TABLE "MCQExamSetResult" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb;

-- CQExamSetQuestion.subMarks
ALTER TABLE "CQExamSetQuestion" ALTER COLUMN "subMarks" TYPE JSONB USING CASE WHEN "subMarks" IS NULL THEN NULL ELSE "subMarks"::jsonb END;

-- CQExamSetQuestion.config
ALTER TABLE "CQExamSetQuestion" ALTER COLUMN "config" DROP DEFAULT;
ALTER TABLE "CQExamSetQuestion" ALTER COLUMN "config" TYPE JSONB USING "config"::jsonb;
ALTER TABLE "CQExamSetQuestion" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb;

-- CQExamAnswerImage.annotations
ALTER TABLE "CQExamAnswerImage" ALTER COLUMN "annotations" TYPE JSONB USING CASE WHEN "annotations" IS NULL THEN NULL ELSE "annotations"::jsonb END;

-- AuditLog.oldData
ALTER TABLE "AuditLog" ALTER COLUMN "oldData" TYPE JSONB USING CASE WHEN "oldData" IS NULL THEN NULL ELSE "oldData"::jsonb END;

-- AuditLog.newData
ALTER TABLE "AuditLog" ALTER COLUMN "newData" TYPE JSONB USING CASE WHEN "newData" IS NULL THEN NULL ELSE "newData"::jsonb END;
