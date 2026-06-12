-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STUDENT');

-- AlterTable: Add new column with enum type
ALTER TABLE "User" ADD COLUMN "role_new" "Role" NOT NULL DEFAULT 'STUDENT';

-- Migrate data: map old lowercase string values to new uppercase enum values
UPDATE "User" SET "role_new" = 'SUPER_ADMIN'::"Role" WHERE "role" = 'super_admin';
UPDATE "User" SET "role_new" = 'ADMIN'::"Role" WHERE "role" = 'admin';
UPDATE "User" SET "role_new" = 'STUDENT'::"Role" WHERE "role" = 'student';
-- Handle any other values or NULL by leaving default 'STUDENT'

-- Drop old column
ALTER TABLE "User" DROP COLUMN "role";

-- Rename new column to original name
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Add unique constraints for Payment table
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE UNIQUE INDEX "Payment_userId_contentType_contentId_status_key" ON "Payment"("userId", "contentType", "contentId", "status");
