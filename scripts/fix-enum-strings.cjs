const fs = require('fs');
const path = require('path');

const files = [
  'prisma/seed-all.ts',
  'prisma/seed-content.ts',
  'prisma/seed-missing.ts',
  'prisma/seed.ts',
  'scripts/aggregate-analytics.ts',
  'scripts/check-db.ts',
  'scripts/seed-bundles.ts',
  'src/app/api/admin/analytics/alerts/route.ts',
  'src/app/api/admin/analytics/conversion/route.ts',
  'src/app/api/admin/analytics/courses/route.ts',
  'src/app/api/admin/analytics/cq/route.ts',
  'src/app/api/admin/analytics/dropoff/route.ts',
  'src/app/api/admin/analytics/insights/route.ts',
  'src/app/api/admin/analytics/payments/route.ts',
  'src/app/api/admin/analytics/predictions/route.ts',
  'src/app/api/admin/analytics/realtime/route.ts',
  'src/app/api/admin/analytics/reports/generate/route.ts',
  'src/app/api/admin/analytics/revenue/route.ts',
  'src/app/api/admin/analytics/students/route.ts',
  'src/app/api/admin/board-questions/route.ts',
  'src/app/api/admin/bulk-import/route.ts',
  'src/app/api/admin/bundles/content/route.ts',
  'src/app/api/admin/bundles/route.ts',
  'src/app/api/admin/content-purchases/route.ts',
  'src/app/api/admin/courses/route.ts',
  'src/app/api/admin/cq-exam-packages/route.ts',
  'src/app/api/admin/cq/route.ts',
  'src/app/api/admin/exams/route.ts',
  'src/app/api/admin/featured/search/route.ts',
  'src/app/api/admin/feedback/[id]/messages/route.ts',
  'src/app/api/admin/feedback/route.ts',
  'src/app/api/admin/knowledge-questions/route.ts',
  'src/app/api/admin/mcq-exam-packages/bulk-upload-questions/route.ts',
  'src/app/api/admin/mcq-exam-packages/route.ts',
  'src/app/api/admin/mcq/bulk-upload/route.ts',
  'src/app/api/admin/mcq/route.ts',
  'src/app/api/admin/notices/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/payments/route.ts',
  'src/app/api/admin/payments/stats/route.ts',
  'src/app/api/admin/stats/route.ts',
  'src/app/api/bundles/[id]/route.ts',
  'src/app/api/bundles/route.ts',
  'src/app/api/courses/enroll/route.ts',
  'src/app/api/courses/progress/route.ts',
  'src/app/api/courses/purchase/route.ts',
  'src/app/api/courses/route.ts',
  'src/app/api/cq-exam-packages/route.ts',
  'src/app/api/cq/[id]/route.ts',
  'src/app/api/cq/route.ts',
  'src/app/api/create-exam/route.ts',
  'src/app/api/exams/[id]/route.ts',
  'src/app/api/exams/results/route.ts',
  'src/app/api/mcq-exam-packages/route.ts',
  'src/app/api/mcq/[id]/route.ts',
  'src/app/api/mcq/route.ts',
  'src/app/api/payment/access/route.ts',
  'src/app/api/payment/batch-check/route.ts',
  'src/app/api/payment/check/route.ts',
  'src/app/api/payment/content-info/route.ts',
  'src/app/api/payment/purchases/route.ts',
  'src/app/api/subjects/[id]/route.ts',
  'src/app/api/user/feedback/[id]/messages/route.ts',
  'src/app/api/user/feedback/route.ts',
  'src/lib/course-access-resolver.ts',
  'src/services/server/purchase.service.ts',
  'src/lib/cq-exam/utils.ts',
];

let totalUpdated = 0;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${file}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // ===== Payment.status (PaymentStatus) =====
  content = content.replace(/status:\s*['"]pending['"]/g, "status: 'PENDING'");
  content = content.replace(/status:\s*['"]approved['"]/g, "status: 'APPROVED'");
  content = content.replace(/status:\s*['"]rejected['"]/g, "status: 'REJECTED'");

  // ===== Exam/Package/Course status (ExamStatus/PackageStatus/CourseStatus) =====
  content = content.replace(/status:\s*['"]draft['"]/g, "status: 'DRAFT'");
  content = content.replace(/status:\s*['"]published['"]/g, "status: 'PUBLISHED'");
  content = content.replace(/status:\s*['"]archived['"]/g, "status: 'ARCHIVED'");

  // ===== SubmissionStatus =====
  content = content.replace(/status:\s*['"]not-started['"]/g, "status: 'NOT_STARTED'");
  content = content.replace(/status:\s*['"]in-progress['"]/g, "status: 'IN_PROGRESS'");
  // submitted/graded only in cq-exam/mcq-exam contexts
  if (file.includes('cq-exam') || file.includes('mcq-exam') || file.includes('admin/courses/assignments')) {
    content = content.replace(/status:\s*['"]submitted['"]/g, "status: 'SUBMITTED'");
    content = content.replace(/status:\s*['"]graded['"]/g, "status: 'GRADED'");
  }

  // ===== ExamSetStatus =====
  content = content.replace(/status:\s*['"]completed['"]/g, "status: 'COMPLETED'");

  // ===== FeedbackStatus =====
  content = content.replace(/status:\s*['"]replied['"]/g, "status: 'REPLIED'");
  content = content.replace(/status:\s*['"]closed['"]/g, "status: 'CLOSED'");

  // ===== Difficulty (MCQ/CQ) =====
  content = content.replace(/difficulty:\s*['"]easy['"]/g, "difficulty: 'EASY'");
  content = content.replace(/difficulty:\s*['"]medium['"]/g, "difficulty: 'MEDIUM'");
  content = content.replace(/difficulty:\s*['"]hard['"]/g, "difficulty: 'HARD'");

  // ===== PaymentMethod =====
  content = content.replace(/method:\s*['"]bkash['"]/g, "method: 'BKASH'");
  content = content.replace(/method:\s*['"]nagad['"]/g, "method: 'NAGAD'");
  content = content.replace(/method:\s*['"]rocket['"]/g, "method: 'ROCKET'");

  // ===== SenderRole =====
  content = content.replace(/senderRole:\s*['"]user['"]/g, "senderRole: 'USER'");

  // ===== NotificationType =====
  content = content.replace(/type:\s*['"]info['"]/g, "type: 'INFO'");
  content = content.replace(/type:\s*['"]success['"]/g, "type: 'SUCCESS'");
  content = content.replace(/type:\s*['"]warning['"]/g, "type: 'WARNING'");
  // 'error' type only in notification contexts - risky but all type: 'error' in codebase are notifications
  content = content.replace(/type:\s*['"]error['"]/g, "type: 'ERROR'");

  // ===== KnowledgeType =====
  content = content.replace(/type:\s*['"]knowledge['"]/g, "type: 'KNOWLEDGE'");
  content = content.replace(/type:\s*['"]comprehension['"]/g, "type: 'COMPREHENSION'");

  // ===== NoticeType (only in notice-related files) =====
  if (file.includes('notice')) {
    content = content.replace(/type:\s*['"]text['"]/g, "type: 'TEXT'");
    content = content.replace(/type:\s*['"]pdf['"]/g, "type: 'PDF'");
    content = content.replace(/type:\s*['"]link['"]/g, "type: 'LINK'");
  }

  // ===== ExamType (only in exam-related and seed files) =====
  if (file.includes('exam') || file.includes('seed') || file.includes('create-exam') || file.includes('admin/exams')) {
    content = content.replace(/type:\s*['"]mcq['"]/g, "type: 'MCQ'");
    content = content.replace(/type:\s*['"]cq['"]/g, "type: 'CQ'");
    content = content.replace(/type:\s*['"]mixed['"]/g, "type: 'MIXED'");
  }

  // ===== ContentTypeEnum for ContentBundle (only in bundle files) =====
  if (file.includes('bundle')) {
    content = content.replace(/type:\s*['"]mixed['"]/g, "type: 'MIXED'");
    content = content.replace(/type:\s*['"]mcq['"]/g, "type: 'MCQ'");
    content = content.replace(/type:\s*['"]cq['"]/g, "type: 'CQ'");
    content = content.replace(/type:\s*['"]lecture['"]/g, "type: 'LECTURE'");
    content = content.replace(/type:\s*['"]board['"]/g, "type: 'BOARD'");
  }

  // ===== Bulk import: difficulty fallbacks =====
  content = content.replace(/difficulty\s*\|\|\s*['"]medium['"]/g, "difficulty || 'MEDIUM'");
  content = content.replace(/difficulty\s*\?\?\s*['"]medium['"]/g, "difficulty ?? 'MEDIUM'");

  // ===== Seed files: specific patterns =====
  if (file.includes('seed')) {
    // Status defaults
    content = content.replace(/status:\s*['"]draft['"]/g, "status: 'DRAFT'");
    // Difficulty in seed data
    content = content.replace(/difficulty:\s*['"]easy['"]/g, "difficulty: 'EASY'");
    content = content.replace(/difficulty:\s*['"]medium['"]/g, "difficulty: 'MEDIUM'");
    content = content.replace(/difficulty:\s*['"]hard['"]/g, "difficulty: 'HARD'");
    // correctAnswer
    content = content.replace(/correctAnswer:\s*['"]([a-d])['"]/g, (_, letter) => `correctAnswer: '${letter.toUpperCase()}'`);
    // KnowledgeType
    content = content.replace(/type:\s*['"]knowledge['"]/g, "type: 'KNOWLEDGE'");
    content = content.replace(/type:\s*['"]comprehension['"]/g, "type: 'COMPREHENSION'");
    // NoticeType
    content = content.replace(/type:\s*['"]text['"]/g, "type: 'TEXT'");
    // ContentTypeEnum for bundles
    content = content.replace(/type:\s*['"]mixed['"]/g, "type: 'MIXED'");
    // Exam type
    content = content.replace(/type:\s*['"]mcq['"]/g, "type: 'MCQ'");
    content = content.replace(/type:\s*['"]cq['"]/g, "type: 'CQ'");
    // PaymentMethod
    content = content.replace(/method:\s*['"]bkash['"]/g, "method: 'BKASH'");
    content = content.replace(/method:\s*['"]nagad['"]/g, "method: 'NAGAD'");
    // NotificationType
    content = content.replace(/type:\s*['"]info['"]/g, "type: 'INFO'");
    content = content.replace(/type:\s*['"]success['"]/g, "type: 'SUCCESS'");
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`UPDATED: ${file}`);
    totalUpdated++;
  }
}

console.log(`\nTotal files updated: ${totalUpdated}`);
