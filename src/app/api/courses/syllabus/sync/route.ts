import { db } from '@/lib/db'
import { apiResponse, apiError, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { courseId } = body
    if (!courseId) return apiError('courseId required', 400)

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { displayOrder: 'asc' },
          include: { exams: true, assignments: true, schedules: true, notes: true },
        },
      },
    })
    if (!course) return apiError('Course not found', 404)

    const mcqPackageIds = [...new Set(course.lessons.flatMap(l => l.exams.filter(e => e.examType === 'MCQ').map(e => e.packageId)))]
    const cqPackageIds = [...new Set(course.lessons.flatMap(l => l.exams.filter(e => e.examType === 'CQ').map(e => e.packageId)))]
    const [mcqPackages, cqPackages] = await Promise.all([
      mcqPackageIds.length ? db.mCQExamPackage.findMany({ where: { id: { in: mcqPackageIds } }, select: { id: true, title: true } }) : [],
      cqPackageIds.length ? db.cQExamPackage.findMany({ where: { id: { in: cqPackageIds } }, select: { id: true, title: true } }) : [],
    ])
    const mcqPackageMap = new Map(mcqPackages.map(p => [p.id, p.title]))
    const cqPackageMap = new Map(cqPackages.map(p => [p.id, p.title]))

    let userId: string | null = null
    const authResult = await withAuth(request)
    if (!(authResult instanceof NextResponse)) userId = authResult.user.id

    let progressSet = new Set<string>()
    if (userId) {
      const records = await db.lessonProgress.findMany({
        where: { userId, courseId: course.id },
        select: { lessonId: true, completed: true },
      })
      for (const r of records) if (r.completed) progressSet.add(r.lessonId)
    }

    const rows = course.lessons.map(l => {
      const schedule = l.schedules?.[0]
      const dayOfWeek = schedule?.date ? new Date(schedule.date).getDay() : null
      const isCompleted = progressSet.has(l.id)
      return {
        contentId: l.id,
        title: l.title,
        lessonType: l.lessonType,
        dayOfWeek,
        date: schedule?.date?.toISOString() ?? null,
        startTime: schedule?.startTime || null,
        endTime: schedule?.endTime || null,
        mcqExams: l.exams.filter(e => e.examType === 'MCQ').map(e => ({ packageId: e.packageId, packageName: mcqPackageMap.get(e.packageId) || null, setDate: null, setStartTime: null, setEndTime: null })),
        cqExams: l.exams.filter(e => e.examType === 'CQ').map(e => ({ packageId: e.packageId, packageName: cqPackageMap.get(e.packageId) || null, setDate: null, setStartTime: null, setEndTime: null })),
        hasAssignments: l.assignments.length > 0,
        displayOrder: l.displayOrder,
        status: isCompleted ? 'completed' : 'not_started',
      }
    })
    const summary = {
      totalLessons: course.lessons.length,
      totalLiveClasses: course.lessons.filter(l => l.lessonType === 'LIVE').length,
      totalRecordedClasses: course.lessons.filter(l => l.lessonType === 'RECORDED').length,
      totalMcqExams: course.lessons.reduce((acc, l) => acc + l.exams.filter(e => e.examType === 'MCQ').length, 0),
      totalCqExams: course.lessons.reduce((acc, l) => acc + l.exams.filter(e => e.examType === 'CQ').length, 0),
      totalAssignments: course.lessons.reduce((acc, l) => acc + l.assignments.length, 0),
      totalNotes: course.lessons.reduce((acc, l) => acc + l.notes.length, 0),
      totalResources: 0,
      teacherName: course.teacherName,
    }

    return apiResponse({ summary, rows, synced: true })
  } catch (error) {
    return handleApiError(error, 'Syllabus Sync POST')
  }
}
