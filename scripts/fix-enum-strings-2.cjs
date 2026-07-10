const fs = require('fs');
const path = require('path');

// Get all TypeScript files that have errors
const rootDir = process.cwd();

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.planning') {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Only process the specific files from tsc errors
const targetFiles = [
  // API routes with comparison operators
  'src/app/api/admin/payments/route.ts',
  'src/app/api/admin/cq-exam-packages/route.ts',
  'src/app/api/admin/mcq-exam-packages/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/exams/route.ts',
  'src/app/api/admin/mcq/route.ts',
  'src/app/api/admin/cq/route.ts',
  'src/app/api/admin/board-questions/route.ts',
  'src/app/api/admin/bulk-import/route.ts',
  'src/app/api/admin/mcq/bulk-upload/route.ts',
  'src/app/api/admin/mcq-exam-packages/bulk-upload-questions/route.ts',
  'src/app/api/admin/knowledge-questions/route.ts',
  'src/app/api/admin/notices/route.ts',
  'src/app/api/admin/feedback/route.ts',
  'src/app/api/admin/content-purchases/route.ts',
  'src/app/api/admin/featured/search/route.ts',
  'src/app/api/admin/bundles/route.ts',
  'src/app/api/admin/bundles/content/route.ts',
  'src/app/api/admin/courses/route.ts',
  'src/app/api/admin/analytics/cq/route.ts',
  'src/app/api/admin/analytics/dropoff/route.ts',
  'src/app/api/admin/analytics/insights/route.ts',
  'src/app/api/admin/analytics/predictions/route.ts',
  'src/app/api/admin/analytics/revenue/route.ts',
  'src/app/api/mcq-exam-packages/route.ts',
  'src/app/api/cq-exam-packages/route.ts',
  'src/app/api/courses/enroll/route.ts',
  'src/app/api/courses/progress/route.ts',
  'src/app/api/courses/purchase/route.ts',
  'src/app/api/cq/[id]/route.ts',
  'src/app/api/cq/route.ts',
  'src/app/api/exams/[id]/route.ts',
  'src/app/api/exams/results/route.ts',
  'src/app/api/mcq/[id]/route.ts',
  'src/app/api/mcq/route.ts',
  'src/app/api/payment/content-info/route.ts',
  'src/app/api/bundles/[id]/route.ts',
  'src/app/api/bundles/route.ts',
  // Lib files
  'src/lib/cq-exam/utils.ts',
];

let totalUpdated = 0;

for (const relFile of targetFiles) {
  const fullPath = path.join(rootDir, relFile);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${relFile}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // ===== Fix comparison operators (===, !==, ==, !=) =====
  // Payment status comparisons
  content = content.replace(/===\s*['"]pending['"]/g, "=== 'PENDING'");
  content = content.replace(/!==\s*['"]pending['"]/g, "!== 'PENDING'");
  content = content.replace(/===\s*['"]approved['"]/g, "=== 'APPROVED'");
  content = content.replace(/!==\s*['"]approved['"]/g, "!== 'APPROVED'");
  content = content.replace(/===\s*['"]rejected['"]/g, "=== 'REJECTED'");
  content = content.replace(/!==\s*['"]rejected['"]/g, "!== 'REJECTED'");

  // Exam/Package/Course status comparisons
  content = content.replace(/===\s*['"]draft['"]/g, "=== 'DRAFT'");
  content = content.replace(/===\s*['"]published['"]/g, "=== 'PUBLISHED'");
  content = content.replace(/!==\s*['"]published['"]/g, "!== 'PUBLISHED'");
  content = content.replace(/===\s*['"]archived['"]/g, "=== 'ARCHIVED'");

  // SubmissionStatus comparisons
  content = content.replace(/===\s*['"]submitted['"]/g, "=== 'SUBMITTED'");
  content = content.replace(/!==\s*['"]submitted['"]/g, "!== 'SUBMITTED'");
  content = content.replace(/===\s*['"]graded['"]/g, "=== 'GRADED'");
  content = content.replace(/===\s*['"]completed['"]/g, "=== 'COMPLETED'");
  content = content.replace(/===\s*['"]in-progress['"]/g, "=== 'IN_PROGRESS'");
  content = content.replace(/===\s*['"]not-started['"]/g, "=== 'NOT_STARTED'");

  // FeedbackStatus comparisons
  content = content.replace(/===\s*['"]replied['"]/g, "=== 'REPLIED'");
  content = content.replace(/===\s*['"]closed['"]/g, "=== 'CLOSED'");

  // Difficulty comparisons
  content = content.replace(/===\s*['"]easy['"]/g, "=== 'EASY'");
  content = content.replace(/===\s*['"]medium['"]/g, "=== 'MEDIUM'");
  content = content.replace(/===\s*['"]hard['"]/g, "=== 'HARD'");
  content = content.replace(/!==\s*['"]medium['"]/g, "!== 'MEDIUM'");

  // NotificationType comparisons
  content = content.replace(/===\s*['"]info['"]/g, "=== 'INFO'");
  content = content.replace(/===\s*['"]success['"]/g, "=== 'SUCCESS'");
  content = content.replace(/===\s*['"]warning['"]/g, "=== 'WARNING'");
  content = content.replace(/===\s*['"]error['"]/g, "=== 'ERROR'");

  // ExamType comparisons
  content = content.replace(/===\s*['"]mcq['"]/g, "=== 'MCQ'");
  content = content.replace(/===\s*['"]cq['"]/g, "=== 'CQ'");
  content = content.replace(/===\s*['"]mixed['"]/g, "=== 'MIXED'");

  // Course status
  content = content.replace(/===\s*['"]ACTIVE['"]/g, "=== 'ACTIVE'");

  // KnowledgeType
  content = content.replace(/===\s*['"]knowledge['"]/g, "=== 'KNOWLEDGE'");
  content = content.replace(/===\s*['"]comprehension['"]/g, "=== 'COMPREHENSION'");

  // NoticeType
  content = content.replace(/===\s*['"]text['"]/g, "=== 'TEXT'");
  content = content.replace(/===\s*['"]pdf['"]/g, "=== 'PDF'");
  content = content.replace(/===\s*['"]link['"]/g, "=== 'LINK'");

  // ===== Fix ternary operators for Notification type =====
  // type: status === 'approved' ? 'success' : 'error' -> type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
  content = content.replace(/['"]success['"]\s*:\s*['"]error['"]/g, "'SUCCESS' : 'ERROR'");
  content = content.replace(/['"]warning['"]\s*:\s*['"]success['"]/g, "'WARNING' : 'SUCCESS'");

  // ===== Fix 'in' arrays for Prisma where clauses =====
  content = content.replace(/\['submitted',\s*'graded',\s*'published'\]/g, "['SUBMITTED', 'GRADED', 'PUBLISHED']");
  content = content.replace(/\['pending',\s*'rejected'\]/g, "['PENDING', 'REJECTED']");
  content = content.replace(/\['approved',\s*'pending'\]/g, "['APPROVED', 'PENDING']");

  // ===== Fix SubmissionStatus in CQ/MCQ exam contexts =====
  if (relFile.includes('cq-exam') || relFile.includes('mcq-exam')) {
    content = content.replace(/status:\s*['"]submitted['"]/g, "status: 'SUBMITTED'");
    content = content.replace(/status:\s*['"]graded['"]/g, "status: 'GRADED'");
  }

  // ===== Fix seed files =====
  if (relFile.includes('seed')) {
    // correctAnswer uppercase
    content = content.replace(/correctAnswer:\s*['"]([a-d])['"]/gi, (_, letter) => `correctAnswer: '${letter.toUpperCase()}'`);
    // method uppercase
    content = content.replace(/method:\s*['"]bkash['"]/g, "method: 'BKASH'");
    content = content.replace(/method:\s*['"]nagad['"]/g, "method: 'NAGAD'");
    // lessonType
    content = content.replace(/lessonType:\s*['"]LIVE['"]/g, "lessonType: 'LIVE'");
    content = content.replace(/lessonType:\s*['"]RECORDED['"]/g, "lessonType: 'RECORDED'");
    content = content.replace(/lessonType:\s*['"]live['"]/g, "lessonType: 'LIVE'");
    content = content.replace(/lessonType:\s*['"]recorded['"]/g, "lessonType: 'RECORDED'");
    // senderRole
    content = content.replace(/senderRole:\s*['"]admin['"]/g, "senderRole: 'ADMIN'");
    content = content.replace(/senderRole:\s*['"]user['"]/g, "senderRole: 'USER'");
    // status patterns specific to seed files
    content = content.replace(/status:\s*['"]submitted['"]/g, "status: 'SUBMITTED'");
    content = content.replace(/status:\s*['"]graded['"]/g, "status: 'GRADED'");
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`UPDATED: ${relFile}`);
    totalUpdated++;
  }
}

console.log(`\nTotal files updated: ${totalUpdated}`);
