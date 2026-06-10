import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// ============================================================================
// GET handler — all read operations for MCQ Exam Packages (public-facing)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list':
        return await handleList(searchParams)
      case 'detail':
        return await handleDetail(searchParams, request)
      case 'take-exam':
        return await handleTakeExam(searchParams, request)
      case 'my-results':
        return await handleMyResults(searchParams, request)
      case 'result-detail':
        return await handleResultDetail(searchParams, request)
      case 'weakness-analysis':
        return await handleWeaknessAnalysis(searchParams, request)
      case 'check-purchase':
        return await handleCheckPurchase(searchParams, request)
      case 'leaderboard':
        return await handleLeaderboard(searchParams, request)
      case 'exam-set-status':
        return await handleExamSetStatus(searchParams, request)
      case 'check-retake':
        return await handleCheckRetake(searchParams, request)
      case 'my-retake-requests':
        return await handleMyRetakeRequests(searchParams, request)
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('MCQ Exam Packages API error:', error)
    return NextResponse.json(
      { success: false, error: 'সার্ভার ত্রুটি হয়েছে' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST handler — submit exam answers
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'submit-exam':
        return await handleSubmitExam(body, request)
      case 'request-retake':
        return await handleRequestRetake(body, request)
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('MCQ Exam Packages POST error:', error)
    return NextResponse.json(
      { success: false, error: 'সার্ভার ত্রুটি হয়েছে' },
      { status: 500 }
    )
  }
}

// ============================================================================
// 1. LIST — Published packages with pagination
// ============================================================================

async function handleList(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
  const classId = searchParams.get('classId') || ''
  const search = searchParams.get('search') || ''
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    status: 'published',
    isActive: true,
  }

  if (classId) {
    where.classId = classId
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [packages, total] = await Promise.all([
    db.mCQExamPackage.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        class: {
          select: { id: true, name: true, slug: true },
        },
        examSets: {
          where: { status: 'published' },
          orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
          select: {
            id: true,
            scheduledDate: true,
            startTime: true,
            endTime: true,
            duration: true,
            totalMarks: true,
            totalQuestions: true,
            order: true,
          },
        },
        _count: {
          select: {
            examSets: true,
            purchases: true,
          },
        },
      },
    }),
    db.mCQExamPackage.count({ where }),
  ])

  // ---- Batch-fetch subject names for all packages ----
  // Collect all unique subject IDs across all packages
  const allSubjectIds = new Set<string>()
  for (const pkg of packages) {
    try {
      const ids = JSON.parse(pkg.subjectIds || '[]') as string[]
      for (const id of ids) {
        if (id) allSubjectIds.add(id)
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // Fetch subjects in one batch query
  const subjectList = allSubjectIds.size > 0
    ? await db.subject.findMany({
        where: { id: { in: Array.from(allSubjectIds) } },
        select: { id: true, name: true },
      })
    : []
  const subjectMap = new Map(subjectList.map((s) => [s.id, s.name]))

  // ---- Enrich each package with subjects, examSetSummary, and totals ----
  const enrichedPackages = packages.map((pkg) => {
    // Parse subject IDs and resolve names
    let subjectIds: string[] = []
    try {
      subjectIds = JSON.parse(pkg.subjectIds || '[]') as string[]
    } catch {
      subjectIds = []
    }
    const subjects = subjectIds
      .filter((id) => id)
      .map((id) => ({ id, name: subjectMap.get(id) || 'Unknown' }))

    // Build exam set summary (first 5)
    const examSetSummary = pkg.examSets.slice(0, 5).map((set) => ({
      scheduledDate: set.scheduledDate,
      startTime: set.startTime,
      endTime: set.endTime,
      duration: set.duration,
      totalMarks: set.totalMarks,
      totalQuestions: set.totalQuestions,
    }))

    // Calculate totals from ALL exam sets (not just first 5)
    const totalExamSets = pkg.examSets.length
    const totalMarks = pkg.examSets.reduce((sum, s) => sum + s.totalMarks, 0)
    const totalQuestions = pkg.examSets.reduce((sum, s) => sum + s.totalQuestions, 0)

    // Remove examSets from the output (we only fetched them for summary calculation)
    const { examSets: _examSets, ...pkgWithoutExamSets } = pkg

    return {
      ...pkgWithoutExamSets,
      subjects,
      examSetSummary,
      totalExamSets,
      totalMarks,
      totalQuestions,
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      packages: enrichedPackages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}

// ============================================================================
// 2. DETAIL — Single package with exam sets + purchase status for auth'd users
// ============================================================================

async function handleDetail(searchParams: URLSearchParams, request: NextRequest) {
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const pkg = await db.mCQExamPackage.findUnique({
    where: { id },
    include: {
      class: {
        select: { id: true, name: true, slug: true },
      },
      examSets: {
        where: { status: 'published' },
        orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          scheduledDate: true,
          startTime: true,
          endTime: true,
          duration: true,
          totalMarks: true,
          totalQuestions: true,
          marksPerQ: true,
          negativeMarks: true,
          instructions: true,
          status: true,
          order: true,
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  })

  if (!pkg || pkg.status !== 'published' || !pkg.isActive) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  // Check purchase status for authenticated users
    let purchased = false
    let purchase: Record<string, unknown> | null = null

    const auth = await requireAuth(request)
    if (auth) {
      const purchaseRecord = await db.mCQExamPackagePurchase.findUnique({
        where: {
          userId_packageId: {
            userId: auth.user.id,
            packageId: id,
          },
        },
      })
      if (purchaseRecord && purchaseRecord.isActive) {
        purchased = true
        purchase = purchaseRecord as unknown as Record<string, unknown>
      }
    }

  return NextResponse.json({
    success: true,
    data: {
      package: pkg,
      purchased,
      purchase,
    },
  })
}

// ============================================================================
// 3. TAKE EXAM — Get exam set questions (requires auth + purchase)
// ============================================================================

async function handleTakeExam(searchParams: URLSearchParams, request: NextRequest) {
  const setId = searchParams.get('setId')
  if (!setId) {
    return NextResponse.json(
      { success: false, error: 'সেট ID প্রদান করুন' },
      { status: 400 }
    )
  }

  // Require authentication
  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষা দিতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Get the exam set with package info
  const examSet = await db.mCQExamSet.findUnique({
    where: { id: setId },
    include: {
      package: {
        select: {
          id: true,
          title: true,
          status: true,
          isActive: true,
        },
      },
    },
  })

  if (!examSet || examSet.status !== 'published') {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষার সেট খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  // Check purchase
  const purchaseRecord = await db.mCQExamPackagePurchase.findUnique({
    where: {
      userId_packageId: {
        userId: auth.user.id,
        packageId: examSet.packageId,
      },
    },
  })

  if (!purchaseRecord || !purchaseRecord.isActive) {
    return NextResponse.json(
      { success: false, error: 'আপনি এই প্যাকেজটি কিনেননি', code: 'NOT_PURCHASED' },
      { status: 403 }
    )
  }

  // Check scheduled date — lenient: exam available from scheduledDate 00:00 onwards
  const now = new Date()
  const dhakaOffset = 6 * 60 // UTC+6 in minutes
  const dhakaTime = new Date(now.getTime() + dhakaOffset * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const todayDhaka = new Date(dhakaTime.getFullYear(), dhakaTime.getMonth(), dhakaTime.getDate())

  const scheduledDateOnly = new Date(
    examSet.scheduledDate.getFullYear(),
    examSet.scheduledDate.getMonth(),
    examSet.scheduledDate.getDate()
  )

  if (todayDhaka < scheduledDateOnly) {
    const diffMs = scheduledDateOnly.getTime() - todayDhaka.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return NextResponse.json(
      {
        success: false,
        error: `পরীক্ষা এখনো শুরু হয়নি। ${diffDays} দিন পর পরীক্ষা শুরু হবে।`,
        code: 'EXAM_NOT_YET_AVAILABLE',
        data: {
          scheduledDate: examSet.scheduledDate,
          startTime: examSet.startTime,
        },
      },
      { status: 400 }
    )
  }

  // Check if user already has a result for this set
  let existingResult = await db.mCQExamSetResult.findUnique({
    where: {
      userId_setId: {
        userId: auth.user.id,
        setId: setId,
      },
    },
  })

  // If completed and retake is allowed (set-level or individual), delete old result and start fresh
  const hadCanRetake = existingResult?.canRetake || false
  if (existingResult && existingResult.status === 'completed' && (examSet.allowRetake || existingResult.canRetake)) {
    await db.mCQExamSetResult.delete({ where: { id: existingResult.id } })
    existingResult = null
    // Fall through to create new result below
  }

  // If completed, return the result (no retake allowed)
  if (existingResult && existingResult.status === 'completed') {
    // Get questions with answers for review
    const setQuestions = await db.mCQExamSetQuestion.findMany({
      where: { setId },
      orderBy: { order: 'asc' },
      include: {
        mcq: {
          select: {
            id: true,
            question: true,
            questionImage: true,
            optionA: true,
            optionAImage: true,
            optionB: true,
            optionBImage: true,
            optionC: true,
            optionCImage: true,
            optionD: true,
            optionDImage: true,
            correctAnswer: true,
            explanation: true,
            explanationImage: true,
            chapterId: true,
            chapter: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

  const questionsWithAnswers = setQuestions.map((sq) => ({
    id: sq.id,
    mcqId: sq.mcqId,
    question: sq.mcq.question,
    questionImage: sq.mcq.questionImage,
    optionA: sq.mcq.optionA,
    optionAImage: sq.mcq.optionAImage,
    optionB: sq.mcq.optionB,
    optionBImage: sq.mcq.optionBImage,
    optionC: sq.mcq.optionC,
    optionCImage: sq.mcq.optionCImage,
    optionD: sq.mcq.optionD,
    optionDImage: sq.mcq.optionDImage,
    correctAnswer: sq.mcq.correctAnswer,
    explanation: sq.mcq.explanation,
    explanationImage: sq.mcq.explanationImage,
    marks: sq.marks,
    order: sq.order,
    chapterId: sq.mcq.chapterId ?? null,
    chapterName: sq.mcq.chapter?.name ?? null,
  }))

    return NextResponse.json({
      success: true,
      data: {
        set: {
          id: examSet.id,
          title: examSet.title,
          description: examSet.description,
          scheduledDate: examSet.scheduledDate,
          startTime: examSet.startTime,
          endTime: examSet.endTime,
          duration: examSet.duration,
          marksPerQ: examSet.marksPerQ,
          negativeMarks: examSet.negativeMarks,
          totalMarks: examSet.totalMarks,
          totalQuestions: examSet.totalQuestions,
          instructions: examSet.instructions,
        },
        result: existingResult,
        questions: questionsWithAnswers,
        alreadyCompleted: true,
        timeRemaining: 0,
      },
    })
  }

  // If in-progress, resume it
  if (existingResult && existingResult.status === 'in-progress') {
    const setQuestions = await db.mCQExamSetQuestion.findMany({
      where: { setId },
      orderBy: { order: 'asc' },
      include: {
        mcq: {
          select: {
            id: true,
            question: true,
            questionImage: true,
            optionA: true,
            optionAImage: true,
            optionB: true,
            optionBImage: true,
            optionC: true,
            optionCImage: true,
            optionD: true,
            optionDImage: true,
          },
        },
      },
    })

    // Questions without correct answer or explanation during exam
    const questionsForExam = setQuestions.map((sq) => ({
      id: sq.id,
      mcqId: sq.mcqId,
      question: sq.mcq.question,
      questionImage: sq.mcq.questionImage,
      optionA: sq.mcq.optionA,
      optionAImage: sq.mcq.optionAImage,
      optionB: sq.mcq.optionB,
      optionBImage: sq.mcq.optionBImage,
      optionC: sq.mcq.optionC,
      optionCImage: sq.mcq.optionCImage,
      optionD: sq.mcq.optionD,
      optionDImage: sq.mcq.optionDImage,
      marks: sq.marks,
      order: sq.order,
    }))

    // Calculate time remaining
    const timeRemaining = calculateTimeRemaining(existingResult.startedAt, examSet.duration)

    return NextResponse.json({
      success: true,
      data: {
        set: {
          id: examSet.id,
          title: examSet.title,
          description: examSet.description,
          scheduledDate: examSet.scheduledDate,
          startTime: examSet.startTime,
          endTime: examSet.endTime,
          duration: examSet.duration,
          marksPerQ: examSet.marksPerQ,
          negativeMarks: examSet.negativeMarks,
          totalMarks: examSet.totalMarks,
          totalQuestions: examSet.totalQuestions,
          instructions: examSet.instructions,
        },
        questions: questionsForExam,
        result: {
          id: existingResult.id,
          status: existingResult.status,
          startedAt: existingResult.startedAt,
          answers: existingResult.answers,
        },
        timeRemaining: Math.max(0, timeRemaining),
        resuming: true,
      },
    })
  }

  // No existing result — create an in-progress result
  const setQuestions = await db.mCQExamSetQuestion.findMany({
    where: { setId },
    orderBy: { order: 'asc' },
    include: {
      mcq: {
        select: {
          id: true,
          question: true,
          questionImage: true,
          optionA: true,
          optionAImage: true,
          optionB: true,
          optionBImage: true,
          optionC: true,
          optionCImage: true,
          optionD: true,
          optionDImage: true,
        },
      },
    },
  })

  const newResult = await db.mCQExamSetResult.create({
    data: {
      userId: auth.user.id,
      setId: setId,
      status: 'in-progress',
      startedAt: new Date(),
      answers: '{}',
      totalMarks: examSet.totalMarks,
      canRetake: hadCanRetake,
    },
  })

  // Questions without correct answer or explanation during exam
  const questionsForExam = setQuestions.map((sq) => ({
    id: sq.id,
    mcqId: sq.mcqId,
    question: sq.mcq.question,
    questionImage: sq.mcq.questionImage,
    optionA: sq.mcq.optionA,
    optionAImage: sq.mcq.optionAImage,
    optionB: sq.mcq.optionB,
    optionBImage: sq.mcq.optionBImage,
    optionC: sq.mcq.optionC,
    optionCImage: sq.mcq.optionCImage,
    optionD: sq.mcq.optionD,
    optionDImage: sq.mcq.optionDImage,
    marks: sq.marks,
    order: sq.order,
  }))

  const timeRemaining = calculateTimeRemaining(newResult.startedAt, examSet.duration)

  return NextResponse.json({
    success: true,
    data: {
      set: {
        id: examSet.id,
        title: examSet.title,
        description: examSet.description,
        scheduledDate: examSet.scheduledDate,
        startTime: examSet.startTime,
        endTime: examSet.endTime,
        duration: examSet.duration,
        marksPerQ: examSet.marksPerQ,
        negativeMarks: examSet.negativeMarks,
        totalMarks: examSet.totalMarks,
        totalQuestions: examSet.totalQuestions,
        instructions: examSet.instructions,
      },
      questions: questionsForExam,
      result: {
        id: newResult.id,
        status: newResult.status,
        startedAt: newResult.startedAt,
        answers: newResult.answers,
      },
      timeRemaining: Math.max(0, timeRemaining),
      resuming: false,
    },
  })
}

// ============================================================================
// 4. SUBMIT EXAM — Calculate scores and complete the result
// ============================================================================

async function handleSubmitExam(body: Record<string, unknown>, request: NextRequest) {
  const { setId, resultId, answers, timeTaken } = body as {
    setId?: string
    resultId?: string
    answers?: Record<string, string>
    timeTaken?: number
  }

  if (!setId || !resultId || !answers) {
    return NextResponse.json(
      { success: false, error: 'setId, resultId এবং answers প্রদান করুন' },
      { status: 400 }
    )
  }

  // Require authentication
  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষা জমা দিতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Get the result and verify ownership
  const result = await db.mCQExamSetResult.findUnique({
    where: { id: resultId },
  })

  if (!result) {
    return NextResponse.json(
      { success: false, error: 'ফলাফল খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  if (result.userId !== auth.user.id) {
    return NextResponse.json(
      { success: false, error: 'এই ফলাফল আপনার নয়', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (result.status !== 'in-progress') {
    return NextResponse.json(
      { success: false, error: 'এই পরীক্ষা ইতিমধ্যে জমা দেওয়া হয়েছে', code: 'ALREADY_SUBMITTED' },
      { status: 400 }
    )
  }

  // Verify the result belongs to the given setId
  if (result.setId !== setId) {
    return NextResponse.json(
      { success: false, error: 'সেট ID ফলাফলের সাথে মিলছে না' },
      { status: 400 }
    )
  }

  // Get the exam set for scoring info
  const examSet = await db.mCQExamSet.findUnique({
    where: { id: setId },
  })

  if (!examSet) {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষার সেট খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  // Get all questions in the set with MCQ data
  const setQuestions = await db.mCQExamSetQuestion.findMany({
    where: { setId },
    orderBy: { order: 'asc' },
    include: {
      mcq: {
        select: {
          id: true,
          question: true,
          questionImage: true,
          optionA: true,
          optionAImage: true,
          optionB: true,
          optionBImage: true,
          optionC: true,
          optionCImage: true,
          optionD: true,
          optionDImage: true,
          correctAnswer: true,
          explanation: true,
          explanationImage: true,
          chapterId: true,
          subjectId: true,
          classLevel: true,
          difficulty: true,
        },
      },
    },
  })

  // Calculate scores
  let totalCorrect = 0
  let totalWrong = 0
  let totalSkipped = 0
  let marksObtained = 0

  for (const sq of setQuestions) {
    const userAnswer = answers[sq.mcqId]

    if (!userAnswer || userAnswer.trim() === '') {
      // Skipped
      totalSkipped++
    } else if (userAnswer.toUpperCase() === sq.mcq.correctAnswer.toUpperCase()) {
      // Correct
      totalCorrect++
      marksObtained += sq.marks
    } else {
      // Wrong
      totalWrong++
      marksObtained -= examSet.negativeMarks
    }
  }

  // Ensure marks don't go negative
  marksObtained = Math.max(0, marksObtained)

  // Update the result
  const updatedResult = await db.mCQExamSetResult.update({
    where: { id: resultId },
    data: {
      status: 'completed',
      submittedAt: new Date(),
      answers: JSON.stringify(answers),
      totalCorrect,
      totalWrong,
      totalSkipped,
      marksObtained,
      totalMarks: examSet.totalMarks,
      timeTaken: timeTaken || 0,
    },
  })

  // Build questions with correctAnswer and explanation for review
  const questionsWithAnswers = setQuestions.map((sq) => ({
    id: sq.id,
    mcqId: sq.mcqId,
    question: sq.mcq.question,
    questionImage: sq.mcq.questionImage,
    optionA: sq.mcq.optionA,
    optionAImage: sq.mcq.optionAImage,
    optionB: sq.mcq.optionB,
    optionBImage: sq.mcq.optionBImage,
    optionC: sq.mcq.optionC,
    optionCImage: sq.mcq.optionCImage,
    optionD: sq.mcq.optionD,
    optionDImage: sq.mcq.optionDImage,
    correctAnswer: sq.mcq.correctAnswer,
    explanation: sq.mcq.explanation,
    explanationImage: sq.mcq.explanationImage,
    marks: sq.marks,
    order: sq.order,
  }))

  return NextResponse.json({
    success: true,
    data: {
      result: updatedResult,
      questions: questionsWithAnswers,
    },
  })
}

// ============================================================================
// 5. MY RESULTS — User's exam results/history
// ============================================================================

async function handleMyResults(searchParams: URLSearchParams, request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'ফলাফল দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const skip = (page - 1) * limit

  const [results, total] = await Promise.all([
    db.mCQExamSetResult.findMany({
      where: { userId: auth.user.id },
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        set: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            duration: true,
            totalMarks: true,
            totalQuestions: true,
            package: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              },
            },
          },
        },
      },
    }),
    db.mCQExamSetResult.count({
      where: { userId: auth.user.id },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}

// ============================================================================
// 6. RESULT DETAIL — Single result with full question review
// ============================================================================

async function handleResultDetail(searchParams: URLSearchParams, request: NextRequest) {
  const resultId = searchParams.get('resultId')
  if (!resultId) {
    return NextResponse.json(
      { success: false, error: 'ফলাফল ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'ফলাফল দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const result = await db.mCQExamSetResult.findUnique({
    where: { id: resultId },
    include: {
      set: {
        select: {
          id: true,
          title: true,
          description: true,
          scheduledDate: true,
          duration: true,
          totalMarks: true,
          totalQuestions: true,
          marksPerQ: true,
          negativeMarks: true,
          instructions: true,
          package: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              class: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  })

  if (!result) {
    return NextResponse.json(
      { success: false, error: 'ফলাফল খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  if (result.userId !== auth.user.id) {
    return NextResponse.json(
      { success: false, error: 'এই ফলাফল আপনার নয়', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  // Get questions with correctAnswer and explanation
  const setQuestions = await db.mCQExamSetQuestion.findMany({
    where: { setId: result.setId },
    orderBy: { order: 'asc' },
    include: {
      mcq: {
        select: {
          id: true,
          question: true,
          questionImage: true,
          optionA: true,
          optionAImage: true,
          optionB: true,
          optionBImage: true,
          optionC: true,
          optionCImage: true,
          optionD: true,
          optionDImage: true,
          correctAnswer: true,
          explanation: true,
          explanationImage: true,
          chapterId: true,
          subjectId: true,
          chapter: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  const questionsWithAnswers = setQuestions.map((sq) => ({
    id: sq.id,
    mcqId: sq.mcqId,
    question: sq.mcq.question,
    questionImage: sq.mcq.questionImage,
    optionA: sq.mcq.optionA,
    optionAImage: sq.mcq.optionAImage,
    optionB: sq.mcq.optionB,
    optionBImage: sq.mcq.optionBImage,
    optionC: sq.mcq.optionC,
    optionCImage: sq.mcq.optionCImage,
    optionD: sq.mcq.optionD,
    optionDImage: sq.mcq.optionDImage,
    correctAnswer: sq.mcq.correctAnswer,
    explanation: sq.mcq.explanation,
    explanationImage: sq.mcq.explanationImage,
    marks: sq.marks,
    order: sq.order,
  }))

  return NextResponse.json({
    success: true,
    data: {
      result,
      questions: questionsWithAnswers,
    },
  })
}

// ============================================================================
// 7. WEAKNESS ANALYSIS — Subject/chapter-wise analysis for a package
// ============================================================================

async function handleWeaknessAnalysis(searchParams: URLSearchParams, request: NextRequest) {
  const packageId = searchParams.get('packageId')
  if (!packageId) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'বিশ্লেষণ দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Check purchase
  const purchaseRecord = await db.mCQExamPackagePurchase.findUnique({
    where: {
      userId_packageId: {
        userId: auth.user.id,
        packageId,
      },
    },
  })

  if (!purchaseRecord || !purchaseRecord.isActive) {
    return NextResponse.json(
      { success: false, error: 'আপনি এই প্যাকেজটি কিনেননি', code: 'NOT_PURCHASED' },
      { status: 403 }
    )
  }

  // Get all sets in this package
  const sets = await db.mCQExamSet.findMany({
    where: { packageId },
    select: { id: true },
  })

  const setIds = sets.map((s) => s.id)

  // Get all completed results for these sets for this user
  const results = await db.mCQExamSetResult.findMany({
    where: {
      userId: auth.user.id,
      setId: { in: setIds },
      status: 'completed',
    },
    select: {
      id: true,
      answers: true,
      setId: true,
    },
  })

  if (results.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        overallStats: {
          totalExams: 0,
          avgScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
        },
        subjectWise: [],
        chapterWise: [],
      },
    })
  }

  // Aggregate overall stats from results
  const resultsWithDetails = await db.mCQExamSetResult.findMany({
    where: {
      userId: auth.user.id,
      setId: { in: setIds },
      status: 'completed',
    },
    select: {
      totalCorrect: true,
      totalWrong: true,
      marksObtained: true,
      totalMarks: true,
    },
  })

  const totalExams = resultsWithDetails.length
  const totalCorrect = resultsWithDetails.reduce((sum, r) => sum + r.totalCorrect, 0)
  const totalWrong = resultsWithDetails.reduce((sum, r) => sum + r.totalWrong, 0)
  const avgScore = totalExams > 0
    ? resultsWithDetails.reduce((sum, r) => sum + (r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0), 0) / totalExams
    : 0

  // Build a map of mcqId -> userAnswer from all results
  const answerMap: Record<string, string> = {}
  for (const result of results) {
    try {
      const parsed = JSON.parse(result.answers) as Record<string, string>
      for (const [mcqId, answer] of Object.entries(parsed)) {
        answerMap[mcqId] = answer
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // Get all MCQ IDs that appear in these sets
  const allSetQuestions = await db.mCQExamSetQuestion.findMany({
    where: { setId: { in: setIds } },
    include: {
      mcq: {
        select: {
          id: true,
          correctAnswer: true,
          subjectId: true,
          chapterId: true,
        },
      },
    },
  })

  // Subject-wise analysis
  const subjectStats: Record<string, { totalCorrect: number; totalWrong: number; total: number }> = {}
  // Chapter-wise analysis
  const chapterStats: Record<string, { totalCorrect: number; totalWrong: number; total: number }> = {}

  for (const sq of allSetQuestions) {
    const mcq = sq.mcq
    const userAnswer = answerMap[mcq.id]

    // Subject stats
    if (!subjectStats[mcq.subjectId]) {
      subjectStats[mcq.subjectId] = { totalCorrect: 0, totalWrong: 0, total: 0 }
    }
    subjectStats[mcq.subjectId].total++

    // Chapter stats
    if (!chapterStats[mcq.chapterId]) {
      chapterStats[mcq.chapterId] = { totalCorrect: 0, totalWrong: 0, total: 0 }
    }
    chapterStats[mcq.chapterId].total++

    if (userAnswer && userAnswer.trim() !== '') {
      if (userAnswer.toUpperCase() === mcq.correctAnswer.toUpperCase()) {
        subjectStats[mcq.subjectId].totalCorrect++
        chapterStats[mcq.chapterId].totalCorrect++
      } else {
        subjectStats[mcq.subjectId].totalWrong++
        chapterStats[mcq.chapterId].totalWrong++
      }
    }
    // Skipped questions are counted in total but not in correct/wrong
  }

  // Fetch subject names
  const subjectIds = Object.keys(subjectStats)
  const subjects = await db.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true },
  })
  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]))

  // Fetch chapter names
  const chapterIds = Object.keys(chapterStats)
  const chapters = await db.chapter.findMany({
    where: { id: { in: chapterIds } },
    select: { id: true, name: true },
  })
  const chapterNameMap = new Map(chapters.map((c) => [c.id, c.name]))

  // Build response
  const subjectWise = subjectIds.map((id) => {
    const stats = subjectStats[id]
    return {
      subjectId: id,
      subjectName: subjectNameMap.get(id) || 'Unknown',
      totalCorrect: stats.totalCorrect,
      totalWrong: stats.totalWrong,
      accuracy: stats.total > 0 ? Math.round((stats.totalCorrect / stats.total) * 100) : 0,
    }
  })

  const chapterWise = chapterIds.map((id) => {
    const stats = chapterStats[id]
    return {
      chapterId: id,
      chapterName: chapterNameMap.get(id) || 'Unknown',
      totalCorrect: stats.totalCorrect,
      totalWrong: stats.totalWrong,
      accuracy: stats.total > 0 ? Math.round((stats.totalCorrect / stats.total) * 100) : 0,
    }
  })

  // Sort by accuracy ascending (weakest first)
  subjectWise.sort((a, b) => a.accuracy - b.accuracy)
  chapterWise.sort((a, b) => a.accuracy - b.accuracy)

  return NextResponse.json({
    success: true,
    data: {
      overallStats: {
        totalExams,
        avgScore: Math.round(avgScore * 10) / 10,
        totalCorrect,
        totalWrong,
      },
      subjectWise,
      chapterWise,
    },
  })
}

// ============================================================================
// 8. CHECK PURCHASE — Check if user has purchased a package
// ============================================================================

async function handleCheckPurchase(searchParams: URLSearchParams, request: NextRequest) {
  const packageId = searchParams.get('packageId')
  if (!packageId) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'ক্রয় অবস্থা দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const purchaseRecord = await db.mCQExamPackagePurchase.findUnique({
    where: {
      userId_packageId: {
        userId: auth.user.id,
        packageId,
      },
    },
  })

  const purchased = !!(purchaseRecord && purchaseRecord.isActive)

  // Check for pending payment in the Payment table
  let pendingPayment = false
  if (!purchased) {
    const pendingPay = await db.payment.findFirst({
      where: {
        userId: auth.user.id,
        contentType: 'mcq-exam-package',
        contentId: packageId,
        status: 'pending',
      },
      select: { id: true },
    })
    pendingPayment = !!pendingPay
  }

  return NextResponse.json({
    success: true,
    data: {
      purchased,
      pendingPayment,
      purchase: purchased ? purchaseRecord : null,
    },
  })
}

// ============================================================================
// 9. LEADERBOARD — Leaderboard for a specific exam set
// ============================================================================

async function handleLeaderboard(searchParams: URLSearchParams, request: NextRequest) {
  const setId = searchParams.get('setId')
  if (!setId) {
    return NextResponse.json(
      { success: false, error: 'সেট ID প্রদান করুন' },
      { status: 400 }
    )
  }

  // Require authentication
  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'লিডারবোর্ড দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Verify the exam set exists and is published
  const examSet = await db.mCQExamSet.findUnique({
    where: { id: setId },
    select: {
      id: true,
      title: true,
      totalMarks: true,
      totalQuestions: true,
      package: {
        select: {
          id: true,
          title: true,
          status: true,
          isActive: true,
        },
      },
    },
  })

  if (!examSet || examSet.package.status !== 'published' || !examSet.package.isActive) {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষার সেট খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  // Get all completed results for this set, ordered by marksObtained descending
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit

  const [results, total] = await Promise.all([
    db.mCQExamSetResult.findMany({
      where: {
        setId,
        status: 'completed',
      },
      orderBy: [
        { marksObtained: 'desc' },
        { timeTaken: 'asc' }, // Tie-break: less time is better
      ],
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            classLevel: true,
          },
        },
      },
    }),
    db.mCQExamSetResult.count({
      where: {
        setId,
        status: 'completed',
      },
    }),
  ])

  // Find current user's rank
  const userResult = await db.mCQExamSetResult.findUnique({
    where: {
      userId_setId: {
        userId: auth.user.id,
        setId,
      },
    },
    select: {
      id: true,
      marksObtained: true,
      timeTaken: true,
      status: true,
    },
  })

  let myRank: number | null = null
  if (userResult && userResult.status === 'completed') {
    // Count how many results have higher marksObtained, or same marks but less time
    const higherCount = await db.mCQExamSetResult.count({
      where: {
        setId,
        status: 'completed',
        OR: [
          { marksObtained: { gt: userResult.marksObtained } },
          {
            marksObtained: userResult.marksObtained,
            timeTaken: { lt: userResult.timeTaken },
          },
        ],
      },
    })
    myRank = higherCount + 1
  }

  const leaderboard = results.map((r, index) => ({
    rank: skip + index + 1,
    user: {
      id: r.user.id,
      name: r.user.name || 'বেনামী ব্যবহারকারী',
      avatar: r.user.avatar,
      classLevel: r.user.classLevel,
    },
    marksObtained: r.marksObtained,
    totalMarks: r.totalMarks,
    totalCorrect: r.totalCorrect,
    totalWrong: r.totalWrong,
    timeTaken: r.timeTaken,
    submittedAt: r.submittedAt,
  }))

  return NextResponse.json({
    success: true,
    data: {
      set: {
        id: examSet.id,
        title: examSet.title,
        totalMarks: examSet.totalMarks,
        totalQuestions: examSet.totalQuestions,
      },
      leaderboard,
      myRank,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}

// ============================================================================
// 10. EXAM SET STATUS — Status of each exam set for the current user
// ============================================================================

async function handleExamSetStatus(searchParams: URLSearchParams, request: NextRequest) {
  const packageId = searchParams.get('packageId')
  if (!packageId) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ ID প্রদান করুন' },
      { status: 400 }
    )
  }

  // Require authentication
  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'পরীক্ষার অবস্থা দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Get the package with its exam sets
  const pkg = await db.mCQExamPackage.findUnique({
    where: { id: packageId },
    include: {
      examSets: {
        where: { status: 'published' },
        orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          startTime: true,
          endTime: true,
          duration: true,
          totalMarks: true,
          totalQuestions: true,
          allowRetake: true,
        },
      },
    },
  })

  if (!pkg || pkg.status !== 'published' || !pkg.isActive) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ খুঁজে পাওয়া যায়নি' },
      { status: 404 }
    )
  }

  // Get all results for this user for these sets
  const setIds = pkg.examSets.map((s) => s.id)

  const userResults = setIds.length > 0
    ? await db.mCQExamSetResult.findMany({
        where: {
          userId: auth.user.id,
          setId: { in: setIds },
        },
      })
    : []

  const resultMap = new Map(userResults.map((r) => [r.setId, r]))

  // Fetch retake requests for this user's sets
  const retakeRequests = setIds.length > 0
    ? await db.mCQExamRetakeRequest.findMany({
        where: {
          userId: auth.user.id,
          setId: { in: setIds },
        },
      })
    : []

  const retakeRequestMap = new Map(retakeRequests.map((r) => [r.setId, r]))

  // Determine current date in Dhaka timezone
  const now = new Date()
  const dhakaOffset = 6 * 60 // UTC+6 in minutes
  const dhakaTime = new Date(now.getTime() + dhakaOffset * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const todayDhaka = new Date(dhakaTime.getFullYear(), dhakaTime.getMonth(), dhakaTime.getDate())

  const setsWithStatus = pkg.examSets.map((set) => {
    const result = resultMap.get(set.id)

    // Determine scheduled date (date only, for comparison)
    const scheduledDateOnly = new Date(
      set.scheduledDate.getFullYear(),
      set.scheduledDate.getMonth(),
      set.scheduledDate.getDate()
    )

    let status: 'completed' | 'not-started' | 'in-progress' | 'missed' | 'upcoming'

    if (result && result.status === 'completed') {
      status = 'completed'
    } else if (result && result.status === 'in-progress') {
      status = 'in-progress'
    } else if (todayDhaka < scheduledDateOnly) {
      // Exam date hasn't arrived yet
      status = 'upcoming'
    } else {
      // Exam date has arrived or passed — check if the time window has ended
      const [endH, endM] = set.endTime.split(':').map(Number)
      const examEndDhaka = new Date(
        set.scheduledDate.getFullYear(),
        set.scheduledDate.getMonth(),
        set.scheduledDate.getDate(),
        endH,
        endM
      )

      if (dhakaTime > examEndDhaka) {
        // Time window has closed and user hasn't taken it
        status = 'missed'
      } else {
        // Time window is still open
        status = 'not-started'
      }
    }

    const retakeReq = retakeRequestMap.get(set.id)
    return {
      setId: set.id,
      title: set.title,
      scheduledDate: set.scheduledDate,
      startTime: set.startTime,
      endTime: set.endTime,
      duration: set.duration,
      totalMarks: set.totalMarks,
      totalQuestions: set.totalQuestions,
      status,
      allowRetake: set.allowRetake,
      canRetake: !!(result && result.canRetake),
      retakeRequestStatus: retakeReq?.status || null,
      result: result
        ? {
            id: result.id,
            marksObtained: result.marksObtained,
            totalMarks: result.totalMarks,
            totalCorrect: result.totalCorrect,
            totalWrong: result.totalWrong,
            totalSkipped: result.totalSkipped,
            timeTaken: result.timeTaken,
            submittedAt: result.submittedAt,
            startedAt: result.startedAt,
            resultStatus: result.status,
          }
        : null,
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      packageId: pkg.id,
      packageTitle: pkg.title,
      sets: setsWithStatus,
    },
  })
}

// ============================================================================
// 11. CHECK RETAKE — Check if user can retake or has pending request
// ============================================================================

async function handleCheckRetake(searchParams: URLSearchParams, request: NextRequest) {
  const setId = searchParams.get('setId')
  if (!setId) {
    return NextResponse.json(
      { success: false, error: 'সেট ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'চেক করতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Check exam set allowRetake
  const examSet = await db.mCQExamSet.findUnique({
    where: { id: setId },
    select: { allowRetake: true },
  })

  // Check individual canRetake on result
  const result = await db.mCQExamSetResult.findUnique({
    where: { userId_setId: { userId: auth.user.id, setId } },
    select: { canRetake: true, status: true },
  })

  // Check pending retake request
  const retakeRequest = await db.mCQExamRetakeRequest.findUnique({
    where: { userId_setId: { userId: auth.user.id, setId } },
  })

  return NextResponse.json({
    success: true,
    data: {
      canRetake: !!((result?.canRetake || examSet?.allowRetake) && result?.status === 'completed'),
      hasPendingRequest: retakeRequest?.status === 'pending',
      hasApprovedRequest: retakeRequest?.status === 'approved',
      requestStatus: retakeRequest?.status || null,
      resultStatus: result?.status || null,
    },
  })
}

// ============================================================================
// 12. MY RETAKE REQUESTS — Get user's retake requests for a package
// ============================================================================

async function handleMyRetakeRequests(searchParams: URLSearchParams, request: NextRequest) {
  const packageId = searchParams.get('packageId')
  if (!packageId) {
    return NextResponse.json(
      { success: false, error: 'প্যাকেজ ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'অনুরোধ দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const requests = await db.mCQExamRetakeRequest.findMany({
    where: {
      userId: auth.user.id,
      set: { packageId },
    },
    include: {
      set: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: { requests } })
}

// ============================================================================
// 13. REQUEST RETAKE — User requests retake for a completed exam set
// ============================================================================

async function handleRequestRetake(body: Record<string, unknown>, request: NextRequest) {
  const { setId, reason } = body as { setId?: string; reason?: string }

  if (!setId) {
    return NextResponse.json(
      { success: false, error: 'সেট ID প্রদান করুন' },
      { status: 400 }
    )
  }

  const auth = await requireAuth(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'অনুরোধ করতে লগইন করুন', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Check if already requested
  const existing = await db.mCQExamRetakeRequest.findUnique({
    where: { userId_setId: { userId: auth.user.id, setId } },
  })

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'ইতিমধ্যে একটি অনুরোধ জমা দেওয়া হয়েছে' },
        { status: 400 }
      )
    }
    if (existing.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'ইতিমধ্যে পুনরায় পরীক্ষার অনুমতি দেওয়া হয়েছে' },
        { status: 400 }
      )
    }
    // If rejected, allow re-request
    const updated = await db.mCQExamRetakeRequest.update({
      where: { id: existing.id },
      data: { status: 'pending', reason: reason || null, reviewedBy: null, reviewedAt: null },
    })
    return NextResponse.json({ success: true, data: { request: updated } })
  }

  const retakeRequest = await db.mCQExamRetakeRequest.create({
    data: {
      userId: auth.user.id,
      setId,
      reason: reason || null,
      status: 'pending',
    },
  })

  return NextResponse.json({ success: true, data: { request: retakeRequest } })
}

// ============================================================================
// Utility: Calculate time remaining for an in-progress exam
// ============================================================================

function calculateTimeRemaining(startedAt: Date | null, durationMinutes: number): number {
  if (!startedAt) return durationMinutes * 60

  const now = new Date()
  const endTime = new Date(startedAt.getTime() + durationMinutes * 60 * 1000)
  const remainingMs = endTime.getTime() - now.getTime()

  return Math.max(0, Math.floor(remainingMs / 1000))
}
