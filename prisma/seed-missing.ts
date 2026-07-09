/**
 * Seed data for ALL missing models in the database.
 * Run: npx tsx prisma/seed-missing.ts
 * Safe to run multiple times (idempotent — checks before insert).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

// ════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════

function randomDate(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60))
  return d
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ════════════════════════════════════════════════════════════════════
//  1. EXAM SYSTEM (Exam, ExamQuestion, ExamResult)
// ════════════════════════════════════════════════════════════════════

async function seedExams() {
  console.log('🌱 Seeding exams...')

  const adminUser = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (!adminUser) return

  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const sscPhysics = sscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: sscClass.id } }) : null

  const exams = [
    { title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট ১', classLevel: 'ssc', type: 'mcq', duration: 30, totalMarks: 30, marksPerMcq: 1, negativeMarks: 0, status: 'published', instructions: 'প্রতিটি প্রশ্নের ৪টি উত্তরের মধ্যে একটি সঠিক। সময় ৩০ মিনিট।' },
    { title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট ২', classLevel: 'ssc', type: 'mcq', duration: 30, totalMarks: 30, marksPerMcq: 1, negativeMarks: 0.5, status: 'published', instructions: 'প্রতিটি প্রশ্নের ৪টি উত্তরের মধ্যে একটি সঠিক। ভুল উত্তরে ০.৫ নম্বর কাটা হবে।' },
    { title: 'এসএসসি রসায়ন মডেল টেস্ট', classLevel: 'ssc', type: 'mcq', duration: 25, totalMarks: 25, marksPerMcq: 1, status: 'published' },
    { title: 'এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট', classLevel: 'hsc', type: 'mcq', duration: 40, totalMarks: 40, marksPerMcq: 1, negativeMarks: 0.25, status: 'published' },
    { title: '৮ম শ্রেণি বিজ্ঞান মডেল টেস্ট', classLevel: 'class-8', type: 'mcq', duration: 20, totalMarks: 20, marksPerMcq: 1, status: 'published' },
    { title: 'ড্রাফট পরীক্ষা (টেস্ট)', classLevel: 'ssc', type: 'mcq', duration: 15, totalMarks: 15, status: 'draft' },
  ]

  for (const examData of exams) {
    const existing = await db.exam.findFirst({ where: { title: examData.title } })
    if (existing) continue

    const exam = await db.exam.create({
      data: {
        ...examData,
        subjectId: sscPhysics?.id || null,
        creatorId: adminUser.id,
        isActive: true,
      },
    })

    // Add MCQ questions to the exam
    if (sscPhysics) {
      const mcqs = await db.mCQ.findMany({
        where: { subjectId: sscPhysics.id, classLevel: examData.classLevel, isActive: true },
        take: Math.min(examData.totalMarks, 10),
      })
      for (let i = 0; i < mcqs.length; i++) {
        await db.examQuestion.create({
          data: {
            examId: exam.id,
            questionType: 'mcq',
            questionId: mcqs[i].id,
            order: i + 1,
            marks: examData.marksPerMcq,
          },
        })
      }
    }
  }

  // ── Exam Results ──
  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 3 })
  const publishedExams = await db.exam.findMany({ where: { status: 'published' }, take: 3 })

  for (const student of students) {
    for (const exam of publishedExams) {
      const existing = await db.examResult.findFirst({ where: { userId: student.id, examId: exam.id } })
      if (existing) continue

      const questions = await db.examQuestion.findMany({ where: { examId: exam.id } })
      const answers: Record<string, string> = {}
      let score = 0
      for (const q of questions) {
        const correct = pick(['A', 'B', 'C', 'D'])
        answers[q.questionId] = correct
        score += q.marks
      }

      await db.examResult.create({
        data: {
          userId: student.id,
          examId: exam.id,
          score: Math.round(score * 0.7), // 70% accuracy
          totalMarks: exam.totalMarks,
          timeTaken: exam.duration * 60 * (0.6 + Math.random() * 0.3),
          answers,
          completedAt: randomDate(14),
        },
      })
    }
  }
  console.log('✅ Exams seeded')
}

// ════════════════════════════════════════════════════════════════════
//  2. USER ACTIVITY (Progress, Bookmark, Note, RecentlyViewed)
// ════════════════════════════════════════════════════════════════════

async function seedUserActivity() {
  console.log('🌱 Seeding user activity...')

  const students = await db.user.findMany({ where: { role: 'STUDENT' } })
  if (students.length === 0) return

  // ── Progress ──
  const lectures = await db.lecture.findMany({ take: 20 })
  const mcqs = await db.mCQ.findMany({ take: 20 })
  const cqs = await db.cQ.findMany({ take: 10 })

  for (const student of students) {
    // Lecture progress
    for (const lecture of lectures.slice(0, 8)) {
      const existing = await db.progress.findFirst({ where: { userId: student.id, contentId: lecture.id, contentType: 'lecture' } })
      if (!existing) {
        await db.progress.create({
          data: {
            userId: student.id,
            contentId: lecture.id,
            contentType: 'lecture',
            progress: pick([25, 50, 75, 100]),
            lastAccessed: randomDate(7),
          },
        })
      }
    }
    // MCQ progress
    for (const mcq of mcqs.slice(0, 5)) {
      const existing = await db.progress.findFirst({ where: { userId: student.id, contentId: mcq.id, contentType: 'mcq' } })
      if (!existing) {
        await db.progress.create({
          data: {
            userId: student.id,
            contentId: mcq.id,
            contentType: 'mcq',
            progress: pick([50, 100]),
            lastAccessed: randomDate(5),
          },
        })
      }
    }
    // CQ progress
    for (const cq of cqs.slice(0, 3)) {
      const existing = await db.progress.findFirst({ where: { userId: student.id, contentId: cq.id, contentType: 'cq' } })
      if (!existing) {
        await db.progress.create({
          data: {
            userId: student.id,
            contentId: cq.id,
            contentType: 'cq',
            progress: pick([0, 25, 50]),
            lastAccessed: randomDate(3),
          },
        })
      }
    }
  }
  console.log('✅ Progress seeded')

  // ── Bookmarks ──
  for (const student of students) {
    for (const mcq of mcqs.slice(0, 4)) {
      const existing = await db.bookmark.findFirst({ where: { userId: student.id, contentId: mcq.id, contentType: 'mcq' } })
      if (!existing) {
        await db.bookmark.create({
          data: { userId: student.id, contentId: mcq.id, contentType: 'mcq' },
        })
      }
    }
    for (const lecture of lectures.slice(0, 3)) {
      const existing = await db.bookmark.findFirst({ where: { userId: student.id, contentId: lecture.id, contentType: 'lecture' } })
      if (!existing) {
        await db.bookmark.create({
          data: { userId: student.id, contentId: lecture.id, contentType: 'lecture' },
        })
      }
    }
  }
  console.log('✅ Bookmarks seeded')

  // ── Notes ──
  const noteContents = [
    'গুরুত্বপূর্ণ সূত্র: F = ma',
    'ভেক্টর রাশির সংজ্ঞা: যে রাশির মান ও দিক উভয়ই আছে।',
    'নিউটনের তৃতীয় সূত্র: প্রতিটি ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া আছে।',
    'কাজ = বল × সরণ × cos θ',
    'শক্তি সংরক্ষণ সূত্র মনে রাখতে হবে।',
  ]
  for (const student of students) {
    for (let i = 0; i < 3; i++) {
      const lecture = pick(lectures)
      const existing = await db.note.findFirst({ where: { userId: student.id, contentId: lecture.id, contentType: 'lecture' } })
      if (!existing) {
        await db.note.create({
          data: {
            userId: student.id,
            contentId: lecture.id,
            contentType: 'lecture',
            content: pick(noteContents),
          },
        })
      }
    }
  }
  console.log('✅ Notes seeded')

  // ── Recently Viewed ──
  for (const student of students) {
    const existingCount = await db.recentlyViewed.count({ where: { userId: student.id } })
    if (existingCount >= 5) continue

    for (const lecture of lectures.slice(0, 5)) {
      const existing = await db.recentlyViewed.findFirst({ where: { userId: student.id, contentId: lecture.id } })
      if (!existing) {
        await db.recentlyViewed.create({
          data: {
            userId: student.id,
            contentId: lecture.id,
            contentType: 'lecture',
            title: lecture.title,
            viewedAt: randomDate(10),
          },
        })
      }
    }
  }
  console.log('✅ Recently viewed seeded')
}

// ════════════════════════════════════════════════════════════════════
//  3. FEEDBACK (UserFeedback, FeedbackMessage)
// ════════════════════════════════════════════════════════════════════

async function seedFeedback() {
  console.log('🌱 Seeding feedback...')

  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 2 })
  const adminUser = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (students.length === 0 || !adminUser) return

  const feedbackSubjects = [
    'পেমেন্ট সমস্যা',
    'কন্টেন্ট অনুরোধ',
    'অ্যাপ বাগ রিপোর্ট',
    'সাধারণ প্রশ্ন',
  ]

  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    const existing = await db.userFeedback.findFirst({ where: { userId: student.id } })
    if (existing) continue

    const feedback = await db.userFeedback.create({
      data: {
        userId: student.id,
        subject: feedbackSubjects[i % feedbackSubjects.length],
        status: i === 0 ? 'replied' : 'pending',
      },
    })

    // User message
    await db.feedbackMessage.create({
      data: {
        feedbackId: feedback.id,
        senderId: student.id,
        senderRole: 'user',
        message: i === 0
          ? 'আমার পেমেন্ট অনুমোদিত হয়নি। ট্রানজেকশন আইডি: TXN123456'
          : 'আমি SSC পদার্থবিজ্ঞানের আরো MCQ চাই।',
      },
    })

    // Admin reply (for replied feedback)
    if (i === 0) {
      await db.feedbackMessage.create({
        data: {
          feedbackId: feedback.id,
          senderId: adminUser.id,
          senderRole: 'admin',
          message: 'আপনার পেমেন্ট যাচাই করা হয়েছে। অনুমোদিত হয়েছে।',
        },
      })
    }
  }
  console.log('✅ Feedback seeded')
}

// ════════════════════════════════════════════════════════════════════
//  4. SUGGESTIONS
// ════════════════════════════════════════════════════════════════════

async function seedSuggestions() {
  console.log('🌱 Seeding suggestions...')

  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const sscPhysics = sscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: sscClass.id } }) : null
  const sscPhysicsCh = sscPhysics ? await db.chapter.findFirst({ where: { subjectId: sscPhysics.id } }) : null

  const suggestions = [
    { title: 'এসএসসি পদার্থবিজ্ঞান - গুরুত্বপূর্ণ সূত্ন', slug: 'ssc-physics-key-formulas', classId: sscClass?.id, subjectId: sscPhysics?.id, chapterId: sscPhysicsCh?.id, isPremium: false },
    { title: 'এসএসসি রসায়ন - মৌল পর্যায় সারণি', slug: 'ssc-chemistry-periodic-table', classId: sscClass?.id, subjectId: null, chapterId: null, isPremium: true, price: 15 },
    { title: 'এইচএসসি পদার্থবিজ্ঞান - ভেক্টর সারসংক্ষেপ', slug: 'hsc-physics-vectors-summary', classId: null, subjectId: null, chapterId: null, isPremium: false },
  ]

  for (const sug of suggestions) {
    const existing = await db.suggestion.findFirst({ where: { slug: sug.slug } })
    if (existing) continue
    await db.suggestion.create({
      data: {
        title: sug.title,
        slug: sug.slug,
        content: `<h2>${sug.title}</h2><p>এই সাজেশনে গুরুত্বপূর্ণ বিষয়গুলো সারসংক্ষেপে আলোচনা করা হয়েছে।</p>`,
        classId: sug.classId || null,
        subjectId: sug.subjectId || null,
        chapterId: sug.chapterId || null,
        isPremium: sug.isPremium,
        price: sug.price || 0,
        isActive: true,
      },
    })
  }
  console.log('✅ Suggestions seeded')
}

// ════════════════════════════════════════════════════════════════════
//  5. MCQ EXAM PACKAGES (Packages, Sets, Questions, Results, Purchases)
// ════════════════════════════════════════════════════════════════════

async function seedMCQExamPackages() {
  console.log('🌱 Seeding MCQ exam packages...')

  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const hscClass = await db.classCategory.findUnique({ where: { slug: 'hsc' } })
  if (!sscClass) return

  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 2 })

  // ── Package 1: SSC Physics MCQ ──
  const existingPkg1 = await db.mCQExamPackage.findFirst({ where: { title: 'এসএসসি পদার্থবিজ্ঞান MCQ প্যাকেজ' } })
  if (!existingPkg1) {
    const pkg = await db.mCQExamPackage.create({
      data: {
        title: 'এসএসসি পদার্থবিজ্ঞান MCQ প্যাকেজ',
        description: 'পদার্থবিজ্ঞানের সকল অধ্যায়ের MCQ পরীক্ষা',
        classId: sscClass.id,
        price: 99,
        originalPrice: 199,
        isPremium: true,
        totalSets: 3,
        status: 'published',
        isActive: true,
      },
    })

    // Create 3 exam sets
    for (let i = 1; i <= 3; i++) {
      const set = await db.mCQExamSet.create({
        data: {
          packageId: pkg.id,
          title: `সেট ${i}`,
          description: `পরীক্ষা সেট ${i}`,
          scheduledDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '23:59',
          duration: 30,
          marksPerQ: 1,
          negativeMarks: 0,
          totalMarks: 10,
          totalQuestions: 10,
          status: 'published',
          allowRetake: i > 1,
        },
      })

      // Add MCQ questions
      const mcqs = await db.mCQ.findMany({ where: { classLevel: 'ssc', isActive: true }, take: 10 })
      for (let j = 0; j < mcqs.length; j++) {
        await db.mCQExamSetQuestion.create({
          data: { setId: set.id, mcqId: mcqs[j].id, marks: 1, order: j + 1 },
        })
      }

      // Add results for students
      for (const student of students) {
        const totalCorrect = Math.floor(Math.random() * 8) + 2
        const totalWrong = 10 - totalCorrect
        await db.mCQExamSetResult.create({
          data: {
            userId: student.id,
            setId: set.id,
            answers: {},
            totalCorrect,
            totalWrong,
            totalSkipped: 0,
            marksObtained: totalCorrect,
            totalMarks: 10,
            timeTaken: 300 + Math.floor(Math.random() * 900),
            startedAt: randomDate(7),
            submittedAt: randomDate(5),
            status: 'completed',
          },
        })
      }
    }
  }

  // ── Package 2: HSC MCQ ──
  if (hscClass) {
    const existingPkg2 = await db.mCQExamPackage.findFirst({ where: { title: 'এইচএসসি MCQ প্যাকেজ' } })
    if (!existingPkg2) {
      const pkg = await db.mCQExamPackage.create({
        data: {
          title: 'এইচএসসি MCQ প্যাকেজ',
          classId: hscClass.id,
          price: 149,
          originalPrice: 299,
          isPremium: true,
          totalSets: 2,
          status: 'published',
          isActive: true,
        },
      })

      for (let i = 1; i <= 2; i++) {
        const set = await db.mCQExamSet.create({
          data: {
            packageId: pkg.id,
            title: `HSC সেট ${i}`,
            scheduledDate: new Date(Date.now() + i * 5 * 24 * 60 * 60 * 1000),
            duration: 35,
            totalMarks: 15,
            totalQuestions: 15,
            status: 'published',
          },
        })
        const mcqs = await db.mCQ.findMany({ where: { classLevel: 'hsc', isActive: true }, take: 15 })
        for (let j = 0; j < mcqs.length; j++) {
          await db.mCQExamSetQuestion.create({
            data: { setId: set.id, mcqId: mcqs[j].id, marks: 1, order: j + 1 },
          })
        }
      }
    }
  }

  // ── MCQ Exam Purchases ──
  const mcqPkg = await db.mCQExamPackage.findFirst()
  if (mcqPkg && students.length > 0) {
    const existing = await db.mCQExamPackagePurchase.findFirst({ where: { userId: students[0].id, packageId: mcqPkg.id } })
    if (!existing) {
      await db.mCQExamPackagePurchase.create({
        data: { userId: students[0].id, packageId: mcqPkg.id, isActive: true },
      })
    }
  }

  // ── MCQ Retake Requests ──
  const completedSets = await db.mCQExamSetResult.findMany({ where: { status: 'completed' }, take: 1 })
  if (completedSets.length > 0 && students.length > 0) {
    const existing = await db.mCQExamRetakeRequest.findFirst({ where: { userId: students[0].id, setId: completedSets[0].setId } })
    if (!existing) {
      await db.mCQExamRetakeRequest.create({
        data: {
          userId: students[0].id,
          setId: completedSets[0].setId,
          reason: 'নেটওয়ার্ক সমস্যায় পরীক্ষা শেষ হয়নি',
          status: 'pending',
        },
      })
    }
  }

  console.log('✅ MCQ exam packages seeded')
}

// ════════════════════════════════════════════════════════════════════
//  6. CQ EXAM PACKAGES (Packages, Sets, Questions, Submissions, Answers)
// ════════════════════════════════════════════════════════════════════

async function seedCQExamPackages() {
  console.log('🌱 Seeding CQ exam packages...')

  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  if (!sscClass) return

  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 2 })

  const existingPkg = await db.cQExamPackage.findFirst({ where: { title: 'এসএসসি পদার্থবিজ্ঞান CQ প্যাকেজ' } })
  if (!existingPkg) {
    const pkg = await db.cQExamPackage.create({
      data: {
        title: 'এসএসসি পদার্থবিজ্ঞান CQ প্যাকেজ',
        description: 'সৃজনশীল প্রশ্নের পরীক্ষা',
        classId: sscClass.id,
        price: 149,
        originalPrice: 299,
        isPremium: true,
        totalSets: 2,
        status: 'published',
        isActive: true,
      },
    })

    const cqs = await db.cQ.findMany({ where: { classLevel: 'ssc', isActive: true }, take: 5 })

    // Set 1
    const set1 = await db.cQExamSet.create({
      data: {
        packageId: pkg.id,
        title: 'CQ সেট ১',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        duration: 60,
        totalMarks: 50,
        totalQuestions: cqs.length || 1,
        status: 'published',
        answerMode: 'flexible',
        passMarks: 20,
      },
    })

    for (let i = 0; i < Math.min(cqs.length, 3); i++) {
      await db.cQExamSetQuestion.create({
        data: { setId: set1.id, cqId: cqs[i].id, marks: 15, order: i + 1, subMarks: [4, 4, 4, 3] },
      })
    }

    // Submissions
    for (const student of students) {
      const submission = await db.cQExamSubmission.create({
        data: {
          userId: student.id,
          setId: set1.id,
          totalMarks: 45,
          obtainedMarks: Math.floor(Math.random() * 30) + 10,
          timeTaken: 1800 + Math.floor(Math.random() * 1800),
          status: pick(['submitted', 'graded']),
          startedAt: randomDate(7),
          submittedAt: randomDate(5),
        },
      })

      // Answers
      const questions = await db.cQExamSetQuestion.findMany({ where: { setId: set1.id } })
      for (const q of questions) {
        const answer = await db.cQExamAnswer.create({
          data: {
            submissionId: submission.id,
            questionId: q.id,
            subIndex: 0,
            answerText: `ছাত্রের উত্তর: ${q.marks} নম্বরের প্রশ্নের উত্তর`,
            obtainedMarks: submission.status === 'graded' ? Math.floor(q.marks * 0.7) : 0,
            maxMarks: q.marks,
          },
        })
      }
    }

    // Set 2
    await db.cQExamSet.create({
      data: {
        packageId: pkg.id,
        title: 'CQ সেট ২',
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        duration: 60,
        totalMarks: 50,
        totalQuestions: 2,
        status: 'published',
      },
    })
  }

  // ── CQ Exam Purchases ──
  const cqPkg = await db.cQExamPackage.findFirst()
  if (cqPkg && students.length > 0) {
    const existing = await db.cQExamPackagePurchase.findFirst({ where: { userId: students[0].id, packageId: cqPkg.id } })
    if (!existing) {
      await db.cQExamPackagePurchase.create({
        data: { userId: students[0].id, packageId: cqPkg.id, isActive: true },
      })
    }
  }

  console.log('✅ CQ exam packages seeded')
}

// ════════════════════════════════════════════════════════════════════
//  7. COURSES (Course, Lessons, Enrollments, Purchases, Assignments, etc.)
// ════════════════════════════════════════════════════════════════════

async function seedCourses() {
  console.log('🌱 Seeding courses...')

  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  if (!sscClass) return

  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 2 })

  const existingCourse = await db.course.findFirst({ where: { slug: 'ssc-physics-masterclass' } })
  if (!existingCourse) {
    const course = await db.course.create({
      data: {
        title: 'এসএসসি পদার্থবিজ্ঞান মাস্টারক্লাস',
        slug: 'ssc-physics-masterclass',
        description: 'এসএসসি পদার্থবিজ্ঞানের সম্পূর্ণ কোর্স',
        isPremium: true,
        price: 499,
        originalPrice: 999,
        status: 'published',
        teacherName: 'সাইফুর রহমান',
        hasCertificate: true,
        duration: 90,
        language: 'bangla',
        difficulty: 'intermediate',
        classId: sscClass.id,
      },
    })

    // ── Lessons ──
    const lessons = [
      { title: 'পরিচয় ও পাঠ্যক্রম', lessonType: 'RECORDED', duration: 15, displayOrder: 1 },
      { title: 'ভৌত জগত ও পরিমাপ', lessonType: 'RECORDED', videoUrl: '#', duration: 45, displayOrder: 2 },
      { title: 'গতি ও বেগ', lessonType: 'LIVE', meetingLink: 'https://meet.google.com/abc-defg-hij', meetingId: 'abc-defg-hij', platform: 'Google Meet', displayOrder: 3 },
      { title: 'বল ও নিউটনের সূত্র', lessonType: 'RECORDED', videoUrl: '#', duration: 50, displayOrder: 4 },
      { title: 'কাজ, ক্ষমতা ও শক্তি', lessonType: 'RECORDED', videoUrl: '#', duration: 40, displayOrder: 5 },
    ]

    const createdLessons = []
    for (const lessonData of lessons) {
      const lesson = await db.courseLesson.create({
        data: { ...lessonData, courseId: course.id },
      })
      createdLessons.push(lesson)

      // Notes
      await db.lessonNote.create({
        data: {
          lessonId: lesson.id,
          title: `${lessonData.title} - ক্লাস নোট`,
          type: 'richtext',
          content: `<h3>${lessonData.title}</h3><p>এই পাঠের গুরুত্বপূর্ণ বিষয়গুলো...</p>`,
          displayOrder: 1,
        },
      })

      // Resources
      await db.lessonResource.create({
        data: {
          lessonId: lesson.id,
          title: `${lessonData.title} - পিডিএফ`,
          type: 'file',
          fileUrl: '#',
          displayOrder: 1,
        },
      })
    }

    // ── Exam Schedule ──
    const mcqPkg = await db.mCQExamPackage.findFirst()
    if (mcqPkg) {
      await db.courseExamSchedule.create({
        data: {
          courseId: course.id,
          examType: 'MCQ',
          packageId: mcqPkg.id,
          examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '23:59',
        },
      })
    }

    // ── Lesson Schedule ──
    for (const lesson of createdLessons) {
      const existing = await db.lessonSchedule.findFirst({ where: { lessonId: lesson.id } })
      if (!existing) {
        await db.lessonSchedule.create({
          data: {
            lessonId: lesson.id,
            date: new Date(Date.now() + lesson.displayOrder * 3 * 24 * 60 * 60 * 1000),
            startTime: '20:00',
            endTime: '21:30',
          },
        })
      }
    }

    // ── Lesson Assignments ──
    for (const lesson of createdLessons.slice(1, 4)) {
      const existing = await db.lessonAssignment.findFirst({ where: { lessonId: lesson.id } })
      if (!existing) {
        const assignment = await db.lessonAssignment.create({
          data: {
            lessonId: lesson.id,
            title: `${lesson.title} - হোমওয়ার্ক`,
            description: `এই পাঠের পর নিচের প্রশ্নগুলোর উত্তর দিন।`,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            displayOrder: 1,
          },
        })

        // Assignment Submissions
        for (const student of students) {
          const existingSub = await db.assignmentSubmission.findFirst({ where: { assignmentId: assignment.id, userId: student.id } })
          if (!existingSub) {
            await db.assignmentSubmission.create({
              data: {
                assignmentId: assignment.id,
                userId: student.id,
                content: 'আমার উত্তর: F = ma সূত্র প্রয়োগ করে...',
                status: pick(['submitted', 'graded']),
                marks: pick([null, 8, 9, 10]),
                feedback: pick([null, 'ভালো উত্তর!', 'আরো বিস্তারিত লিখুন।']),
                submittedAt: randomDate(5),
              },
            })
          }
        }
      }
    }

    // ── Enrollments ──
    for (const student of students) {
      const existing = await db.courseEnrollment.findFirst({ where: { userId: student.id, courseId: course.id } })
      if (!existing) {
        await db.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            status: 'ACTIVE',
            type: 'PAID',
          },
        })
      }
    }

    // ── Course Purchases ──
    for (const student of students) {
      const existing = await db.coursePurchase.findFirst({ where: { userId: student.id, courseId: course.id } })
      if (!existing) {
        await db.coursePurchase.create({
          data: {
            userId: student.id,
            courseId: course.id,
            isActive: true,
          },
        })
      }
    }

    // ── Lesson Progress ──
    for (const student of students) {
      for (const lesson of createdLessons.slice(0, 3)) {
        const existing = await db.lessonProgress.findFirst({ where: { userId: student.id, lessonId: lesson.id } })
        if (!existing) {
          await db.lessonProgress.create({
            data: {
              userId: student.id,
              lessonId: lesson.id,
              courseId: course.id,
              completed: lesson.displayOrder <= 2,
              completedAt: lesson.displayOrder <= 2 ? randomDate(3) : null,
            },
          })
        }
      }
    }
  }
  console.log('✅ Courses seeded')
}

// ════════════════════════════════════════════════════════════════════
//  8. ANALYTICS (Events, Sessions, SearchQueries, Alerts, Reports)
// ════════════════════════════════════════════════════════════════════

async function seedAnalytics() {
  console.log('🌱 Seeding analytics...')

  const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 3 })

  // ── Analytics Events ──
  const eventTypes = ['page_view', 'lecture_view', 'mcq_answer', 'exam_start', 'exam_complete', 'payment_submit', 'search_query', 'bookmark_add', 'note_create']
  const pages = ['/', '/classes', '/class/ssc', '/class/ssc/physics', '/board-questions', '/exams', '/premium', '/search', '/login', '/dashboard']

  for (let i = 0; i < 50; i++) {
    const student = pick(students)
    const eventType = pick(eventTypes)
    await db.analyticsEvent.create({
      data: {
        userId: student?.id,
        eventType,
        eventName: eventType,
        entityType: eventType.includes('lecture') ? 'lecture' : eventType.includes('mcq') ? 'mcq' : eventType.includes('exam') ? 'exam' : null,
        entityId: null,
        sessionId: `session-${Math.floor(Math.random() * 10)}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        url: pick(pages),
        deviceType: pick(['desktop', 'mobile', 'tablet']),
        browser: pick(['Chrome', 'Firefox', 'Safari']),
        os: pick(['Windows', 'Android', 'iOS']),
        screenRes: pick(['1920x1080', '360x800', '768x1024']),
        createdAt: randomDate(30),
      },
    })
  }
  console.log('✅ Analytics events seeded')

  // ── Analytics Sessions ──
  for (let i = 0; i < 20; i++) {
    const student = pick(students)
    const startTime = randomDate(30)
    const duration = Math.floor(Math.random() * 3600) + 120
    await db.analyticsSession.create({
      data: {
        userId: student?.id,
        startTime,
        endTime: new Date(startTime.getTime() + duration * 1000),
        duration,
        pageViews: Math.floor(Math.random() * 20) + 1,
        events: Math.floor(Math.random() * 50) + 5,
        deviceType: pick(['desktop', 'mobile']),
        browser: pick(['Chrome', 'Firefox']),
        os: pick(['Windows', 'Android']),
        country: 'Bangladesh',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        landingPage: pick(pages),
        isActive: false,
      },
    })
  }
  console.log('✅ Analytics sessions seeded')

  // ── Analytics Search Queries ──
  const queries = ['পদার্থবিজ্ঞান', 'MCQ', 'বোর্ড প্রশ্ন', 'এসএসসি', 'নিউটন', 'ভেক্টর', 'গতি', 'বল', 'তাপমাত্রা', 'রসায়ন']
  for (let i = 0; i < 30; i++) {
    const student = pick(students)
    await db.analyticsSearchQuery.create({
      data: {
        userId: student?.id,
        query: pick(queries),
        resultCount: Math.floor(Math.random() * 50),
        clicked: Math.random() > 0.3,
        clickedId: null,
        sessionId: `session-${Math.floor(Math.random() * 10)}`,
        createdAt: randomDate(14),
      },
    })
  }
  console.log('✅ Analytics search queries seeded')

  // ── Analytics Alerts ──
  const alerts = [
    { name: 'High Traffic Alert', description: 'Daily page views exceed 1000', metric: 'page_views', condition: 'gt', threshold: 1000, timeframe: '24h' },
    { name: 'Low Conversion', description: 'Conversion rate drops below 5%', metric: 'conversion_rate', condition: 'lt', threshold: 5, timeframe: '7d' },
    { name: 'Payment Spike', description: 'More than 20 pending payments', metric: 'pending_payments', condition: 'gt', threshold: 20, timeframe: '24h' },
  ]
  for (const alert of alerts) {
    const existing = await db.analyticsAlert.findFirst({ where: { name: alert.name } })
    if (!existing) {
      await db.analyticsAlert.create({
        data: { ...alert, enabled: true, lastTriggered: randomDate(3) },
      })
    }
  }
  console.log('✅ Analytics alerts seeded')

  // ── Analytics Reports ──
  const reports = [
    { name: 'Weekly Revenue Report', type: 'revenue', format: 'xlsx', schedule: 'weekly' },
    { name: 'Monthly Student Report', type: 'students', format: 'pdf', schedule: 'monthly' },
    { name: 'Daily Activity Report', type: 'retention', format: 'csv', schedule: 'daily' },
  ]
  for (const report of reports) {
    const existing = await db.analyticsReport.findFirst({ where: { name: report.name } })
    if (!existing) {
      await db.analyticsReport.create({
        data: { ...report, lastGenerated: randomDate(7) },
      })
    }
  }
  console.log('✅ Analytics reports seeded')
}

// ════════════════════════════════════════════════════════════════════
//  RUN ALL
// ════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Starting missing seed data...\n')

  await seedExams()
  await seedUserActivity()
  await seedFeedback()
  await seedSuggestions()
  await seedMCQExamPackages()
  await seedCQExamPackages()
  await seedCourses()
  await seedAnalytics()

  console.log('\n🎉 All missing seed data complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
