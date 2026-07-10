import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const classes = await db.classCategory.findMany({ where: { isActive: true } });
  console.log('=== Classes ===');
  for (const c of classes) console.log(`${c.name} (${c.slug}) - id: ${c.id}`);
  
  const subjects = await db.subject.findMany({ where: { isActive: true }, include: { class: true } });
  console.log('\n=== Subjects ===');
  for (const s of subjects) console.log(`${s.name} (${s.class.name}) - id: ${s.id}`);
  
  const chapters = await db.chapter.findMany({ where: { isActive: true }, orderBy: [{ subjectId: 'asc', order: 'asc' }] });
  console.log('\n=== Chapters ===');
  for (const ch of chapters) console.log(`#${ch.order}: ${ch.name} - subjectId: ${ch.subjectId}`);
  
  const mcqCount = await db.mCQ.count({ where: { isActive: true } });
  const cqCount = await db.cQ.count({ where: { isActive: true } });
  const lectureCount = await db.lecture.count({ where: { isActive: true } });
  const suggestionCount = await db.suggestion.count({ where: { isActive: true } });
  const examCount = await db.exam.count({ where: { isActive: true, status: 'PUBLISHED' } });
  console.log(`\n=== Content === MCQ:${mcqCount} CQ:${cqCount} Lecture:${lectureCount} Suggestion:${suggestionCount} Exam:${examCount}`);
  
  const freeMcqCount = await db.mCQ.count({ where: { isActive: true, isPremium: false } });
  const freeCqCount = await db.cQ.count({ where: { isActive: true, isPremium: false } });
  const freeLectureCount = await db.lecture.count({ where: { isActive: true, isPremium: false } });
  console.log(`=== Free === MCQ:${freeMcqCount} CQ:${freeCqCount} Lecture:${freeLectureCount}`);

  const contentTypes = await db.contentType.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  console.log('\n=== Content Types ===');
  for (const ct of contentTypes) console.log(`${ct.key}: ${ct.labelBn} (route: ${ct.route}, showInChapterDetail: ${ct.showInChapterDetail})`);
  
  // Check if Lecture model supports subjectId
  try {
    const testCount = await db.lecture.count({ where: { chapter: { subjectId: subjects[0]?.id } } });
    console.log(`\nLecture count via chapter.subjectId works: ${testCount}`);
  } catch (e: any) {
    console.log(`\nLecture count via chapter.subjectId failed: ${e.message}`);
  }
}
main().catch(console.error).finally(() => db.$disconnect());
