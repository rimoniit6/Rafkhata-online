import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const db = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) })

async function main() {
  const r = await Promise.all([
    db.user.count(), db.classCategory.count(), db.subject.count(), db.chapter.count(),
    db.topic.count(), db.mCQ.count(), db.cQ.count(), db.lecture.count(), db.resource.count(),
    db.board.count(), db.examYear.count(), db.boardYear.count(), db.fAQ.count(),
    db.testimonial.count(), db.notice.count(), db.banner.count(), db.contentType.count(),
    db.featuredContent.count(), db.siteSetting.count(), db.navigation.count(),
    db.teacherModerator.count(), db.permission.count(), db.rolePermission.count(),
    db.knowledgeQuestion.count(), db.suggestion.count(), db.contentPackage.count(),
    db.contentBundle.count(), db.bundleItem.count(), db.payment.count(), db.notification.count(),
    db.auditLog.count(), db.userSubscription.count(), db.exam.count(), db.examQuestion.count(),
    db.examResult.count(), db.progress.count(), db.bookmark.count(), db.note.count(),
    db.recentlyViewed.count(), db.userFeedback.count(), db.feedbackMessage.count(),
    db.mCQExamPackage.count(), db.mCQExamSet.count(), db.mCQExamSetQuestion.count(),
    db.mCQExamSetResult.count(), db.mCQExamPackagePurchase.count(), db.mCQExamRetakeRequest.count(),
    db.cQExamPackage.count(), db.cQExamSet.count(), db.cQExamSetQuestion.count(),
    db.cQExamSubmission.count(), db.cQExamAnswer.count(), db.cQExamPackagePurchase.count(),
    db.course.count(), db.courseLesson.count(), db.courseEnrollment.count(),
    db.coursePurchase.count(), db.lessonAssignment.count(), db.assignmentSubmission.count(),
    db.lessonSchedule.count(), db.lessonNote.count(), db.lessonResource.count(),
    db.lessonProgress.count(), db.courseExamSchedule.count(), db.analyticsEvent.count(),
    db.analyticsSession.count(), db.analyticsSearchQuery.count(), db.analyticsAlert.count(),
    db.analyticsReport.count(),
  ])

  const l = [
    'Users','Classes','Subjects','Chapters','Topics','MCQs','CQs','Lectures','Resources',
    'Boards','ExamYears','BoardYears','FAQs','Testimonials','Notices','Banners','ContentTypes',
    'FeaturedContent','SiteSettings','Navigation','Teachers','Permissions','RolePermissions',
    'KnowledgeQuestions','Suggestions','Packages','Bundles','BundleItems','Payments',
    'Notifications','AuditLogs','Subscriptions','Exams','ExamQuestions','ExamResults',
    'Progress','Bookmarks','Notes','RecentlyViewed','UserFeedback','FeedbackMessages',
    'MCQExamPackages','MCQExamSets','MCQExamSetQuestions','MCQExamSetResults',
    'MCQExamPurchases','MCQExamRetakeReqs','CQExamPackages','CQExamSets',
    'CQExamSetQuestions','CQExamSubmissions','CQExamAnswers','CQExamPurchases',
    'Courses','CourseLessons','CourseEnrollments','CoursePurchases','LessonAssignments',
    'AssignmentSubmissions','LessonSchedules','LessonNotes','LessonResources',
    'LessonProgress','CourseExamSchedules','AnalyticsEvents','AnalyticsSessions',
    'AnalyticsSearchQueries','AnalyticsAlerts','AnalyticsReports',
  ]

  console.log('\n  DATABASE RECORD COUNTS\n')
  console.log('  Category'.padEnd(25) + 'Count'.padStart(8))
  console.log('  ' + '─'.repeat(31))
  for (let i = 0; i < l.length; i++) {
    console.log('  ' + l[i].padEnd(23) + String(r[i]).padStart(8))
  }
  console.log('  ' + '─'.repeat(31))
  console.log('  ' + 'TOTAL'.padEnd(23) + String(r.reduce((a: number, b: number) => a + b, 0)).padStart(8))
  console.log()
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
