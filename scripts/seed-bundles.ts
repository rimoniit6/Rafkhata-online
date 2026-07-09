import { db } from '../src/lib/db'

async function seed() {
  console.log('🌱 Seeding sample bundles...')

  // Check if bundles already exist
  const existing = await db.contentBundle.count()
  if (existing > 0) {
    console.log(`✅ ${existing} bundles already exist, skipping seed`)
    return
  }

  // Get some content IDs for reference
  const mcqs = await db.mCQ.findMany({ take: 10, select: { id: true } })
  const cqs = await db.cQ.findMany({ take: 5, select: { id: true } })
  const lectures = await db.lecture.findMany({ take: 5, select: { id: true } })
  const suggestions = await db.suggestion.findMany({ take: 5, select: { id: true } })
  const exams = await db.exam.findMany({ take: 3, select: { id: true } })

  // Helper: create items from IDs
  const makeItems = (ids: { id: string }[], type: string, startOrder: number) =>
    ids.map((item, i) => ({ contentType: type, contentId: item.id, order: startOrder + i }))

  // Bundle 1: SSC MCQ Practice Pack
  if (mcqs.length > 0) {
    const bundle1Items = [
      ...makeItems(mcqs.slice(0, 5), 'mcq', 0),
      ...makeItems(cqs.slice(0, 2), 'cq', 5),
    ]
    await db.contentBundle.create({
      data: {
        title: 'SSC MCQ প্র্যাকটিস প্যাক',
        slug: 'ssc-mcq-practice-pack',
        description: 'SSC পরীক্ষার জন্য বিশেষ MCQ প্র্যাকটিস প্যাক। গণিত, বিজ্ঞান ও অন্যান্য বিষয়ের গুরুত্বপূর্ণ MCQ সমাধানসহ।',
        thumbnail: null,
        price: 149,
        originalPrice: 250,
        classLevel: 'ssc',
        board: 'dhaka',
        type: 'mcq',
        isActive: true,
        order: 1,
        items: { create: bundle1Items },
      },
    })
    console.log('✅ Created: SSC MCQ প্র্যাকটিস প্যাক')
  }

  // Bundle 2: CQ Complete Solution
  if (cqs.length > 0) {
    const bundle2Items = [
      ...makeItems(cqs, 'cq', 0),
      ...makeItems(mcqs.slice(5, 8), 'mcq', cqs.length),
    ]
    await db.contentBundle.create({
      data: {
        title: 'CQ সম্পূর্ণ সমাধান প্যাক',
        slug: 'cq-complete-solution-pack',
        description: 'সকল গুরুত্বপূর্ণ CQ প্রশ্নের বিস্তারিত সমাধান। পরীক্ষার প্রস্তুতির জন্য সবচেয়ে কার্যকর প্যাকেজ।',
        thumbnail: null,
        price: 199,
        originalPrice: 350,
        classLevel: 'ssc',
        type: 'cq',
        isActive: true,
        order: 2,
        items: { create: bundle2Items },
      },
    })
    console.log('✅ Created: CQ সম্পূর্ণ সমাধান প্যাক')
  }

  // Bundle 3: Lecture Bundle
  if (lectures.length > 0) {
    const bundle3Items = makeItems(lectures, 'lecture', 0)
    await db.contentBundle.create({
      data: {
        title: 'লেকচার বান্ডেল — গণিত',
        slug: 'lecture-bundle-math',
        description: 'গণিত বিষয়ের সকল ভিডিও লেকচার একসাথে। বিস্তারিত ব্যাখ্যাসহ সম্পূর্ণ লেকচার সিরিজ।',
        thumbnail: null,
        price: 299,
        originalPrice: 500,
        classLevel: 'class-8',
        type: 'lecture',
        isActive: true,
        order: 3,
        items: { create: bundle3Items },
      },
    })
    console.log('✅ Created: লেকচার বান্ডেল — গণিত')
  }

  // Bundle 4: Board Question Pack
  if (exams.length > 0) {
    const bundle4Items = [
      ...makeItems(exams, 'exam', 0),
      ...makeItems(mcqs.slice(0, 3), 'mcq', exams.length),
      ...makeItems(cqs.slice(0, 2), 'cq', exams.length + 3),
    ]
    await db.contentBundle.create({
      data: {
        title: 'বোর্ড প্রশ্ন সংগ্রহ ২০২৪',
        slug: 'board-question-collection-2024',
        description: 'সকল বোর্ডের ২০২৪ সালের প্রশ্ন সমাধানসহ। MCQ, CQ এবং ব্যাখ্যা একসাথে।',
        thumbnail: null,
        price: 249,
        originalPrice: 400,
        classLevel: 'ssc',
        board: 'dhaka',
        year: '2024',
        type: 'board',
        isActive: true,
        order: 4,
        items: { create: bundle4Items },
      },
    })
    console.log('✅ Created: বোর্ড প্রশ্ন সংগ্রহ ২০২৪')
  }

  // Bundle 5: Mixed Mega Bundle
  const bundle5Items = [
    ...makeItems(mcqs.slice(0, 3), 'mcq', 0),
    ...makeItems(cqs.slice(0, 2), 'cq', 3),
    ...(lectures.length > 0 ? makeItems(lectures.slice(0, 2), 'lecture', 5) : []),
    ...(suggestions.length > 0 ? makeItems(suggestions.slice(0, 2), 'suggestion', 7) : []),
  ]
  if (bundle5Items.length > 0) {
    await db.contentBundle.create({
      data: {
        title: 'মেগা বান্ডেল — সম্পূর্ণ প্রস্তুতি',
        slug: 'mega-bundle-complete-preparation',
        description: 'MCQ, CQ, লেকচার এবং সাজেশন সব একসাথে! SSC পরীক্ষার সম্পূর্ণ প্রস্তুতির জন্য আলটিমেট প্যাকেজ।',
        thumbnail: null,
        price: 499,
        originalPrice: 900,
        classLevel: 'ssc',
        type: 'mixed',
        isActive: true,
        order: 5,
        items: { create: bundle5Items },
      },
    })
    console.log('✅ Created: মেগা বান্ডেল — সম্পূর্ণ প্রস্তুতি')
  }

  // Bundle 6: HSC suggestion pack
  if (suggestions.length > 0) {
    const bundle6Items = makeItems(suggestions, 'suggestion', 0)
    await db.contentBundle.create({
      data: {
        title: 'HSC সাজেশন প্যাক',
        slug: 'hsc-suggestion-pack',
        description: 'HSC পরীক্ষার জন্য বিশেষ সাজেশন। সকল বিষয়ের গুরুত্বপূর্ণ সাজেশন একসাথে।',
        thumbnail: null,
        price: 179,
        originalPrice: 300,
        classLevel: 'hsc',
        type: 'mixed',
        isActive: true,
        order: 6,
        items: { create: bundle6Items },
      },
    })
    console.log('✅ Created: HSC সাজেশন প্যাক')
  }

  console.log('🎉 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
