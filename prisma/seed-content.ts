import { db } from './seed-db'

async function seedContent() {
  console.log('🌱 Seeding supplementary content data...\n')

  // ========== FETCH KEY REFS ==========
  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const hscClass = await db.classCategory.findUnique({ where: { slug: 'hsc' } })

  const sscPhysics = sscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: sscClass.id } }) : null
  const sscChemistry = sscClass ? await db.subject.findFirst({ where: { slug: 'chemistry', classId: sscClass.id } }) : null
  const sscMath = sscClass ? await db.subject.findFirst({ where: { slug: 'math', classId: sscClass.id } }) : null
  const _sscBiology = sscClass ? await db.subject.findFirst({ where: { slug: 'biology', classId: sscClass.id } }) : null
  const _sscBangla = sscClass ? await db.subject.findFirst({ where: { slug: 'bangla', classId: sscClass.id } }) : null
  const _sscEnglish = sscClass ? await db.subject.findFirst({ where: { slug: 'english', classId: sscClass.id } }) : null

  const hscPhysics = hscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: hscClass.id } }) : null
  const _hscChemistry = hscClass ? await db.subject.findFirst({ where: { slug: 'chemistry', classId: hscClass.id } }) : null
  const _hscMath = hscClass ? await db.subject.findFirst({ where: { slug: 'higher-math', classId: hscClass.id } }) : null
  const _hscBangla = hscClass ? await db.subject.findFirst({ where: { slug: 'bangla', classId: hscClass.id } }) : null

  // ========== 1. TEACHER / MODERATOR PROFILES ==========
  console.log('🌱 Seeding teacher/moderator profiles...')

  const teachers = [
    { name: 'সাইফুর রহমান', title: 'সিনিয়র শিক্ষক', institution: 'ঢাকা কলেজ' },
    { name: 'নাসরিন আক্তার', title: 'প্রভাষক', institution: 'রাজশাহী কলেজ' },
    { name: 'আব্দুর রহিম', title: 'মডারেটর', institution: 'চট্টগ্রাম কলেজ' },
    { name: 'ফারহানা ইয়াসমিন', title: 'সহকারী শিক্ষক', institution: 'ময়মনসিংহ কলেজ' },
  ]

  for (const t of teachers) {
    const existing = await db.teacherModerator.findFirst({ where: { name: t.name } })
    if (!existing) {
      await db.teacherModerator.create({ data: { ...t, isActive: true, order: teachers.indexOf(t) + 1 } })
    }
  }
  console.log(`✅ ${teachers.length} teachers seeded`)

  // ========== 2. BOARD CQs ==========
  console.log('🌱 Seeding board CQs...')

  const boardCqSeeds: Array<{
    classSlug: string; subjectSlug: string; chapterSlug: string
    uddeepok: string; question1: string; question2: string; question3: string; question4: string
    answer1: string; answer2: string; answer3: string; answer4: string
    board: string; year: string; difficulty: string; isPremium: boolean
  }> = [
    // SSC Physics - Dhaka Board 2024
    {
      classSlug: 'ssc', subjectSlug: 'physics', chapterSlug: 'physical-world-measurement',
      uddeepok: 'একটি পরীক্ষাগারে একজন ছাত্র একটি স্টিলের রডের দৈর্ঘ্য মাপে। সে মিটার স্কেল ও স্লাইড ক্যালিপার্স উভয় ব্যবহার করে মাপ নেয়। মিটার স্কেলে পড়া ৫.২ cm এবং স্লাইড ক্যালিপার্সে পড়া ৫.২৫ cm।',
      question1: 'মিটার স্কেল ও স্লাইড ক্যালিপার্সের মধ্যে কোনটির পরিমাপ বেশি নির্ভুল?',
      question2: 'স্লাইড ক্যালিপার্সের লঘিষ্ঠ গণন কত?',
      question3: 'পরিমাপের নির্ভুলতা বাড়ানোর উপায় কী?',
      question4: 'দৈর্ঘ্য পরিমাপে SI একক কী?',
      answer1: 'স্লাইড ক্যালিপার্সের পরিমাপ বেশি নির্ভুল কারণ এর লঘিষ্ঠ গণন কম।',
      answer2: 'স্লাইড ক্যালিপার্সের লঘিষ্ঠ গণন = ০.০১ cm বা ০.১ mm',
      answer3: 'উপযুক্ত যন্ত্রপাতি ব্যবহার ও একাধিকবার মাপ নিয়ে গড় বের করে নির্ভুলতা বাড়ানো যায়।',
      answer4: 'দৈর্ঘ্যের SI একক মিটার (m)',
      board: 'dhaka', year: '2024', difficulty: 'MEDIUM', isPremium: false,
    },
    // SSC Chemistry - Rajshahi Board 2023 (premium)
    {
      classSlug: 'ssc', subjectSlug: 'chemistry', chapterSlug: 'intro-chemistry',
      uddeepok: 'একটি রাসায়নিক বিক্রিয়ায় ক্যালসিয়াম কার্বনেটকে উত্তপ্ত করা হলো। এর ফলে ক্যালসিয়াম অক্সাইড ও কার্বন ডাই অক্সাইড উৎপন্ন হয়। CaCO₃ → CaO + CO₂',
      question1: 'এই বিক্রিয়াটি কোন ধরনের?',
      question2: 'বিক্রিয়াটির সমীকরণ সমন্বয় করো।',
      question3: '১০০ গ্রাম CaCO₃ থেকে কত গ্রাম CaO পাওয়া যাবে?',
      question4: 'উৎপন্ন CO₂ এর আয়তন STP তে নির্ণয় করো।',
      answer1: 'এটি একটি তাপীয় বিশ্লেষণ বা বিয়োজন বিক্রিয়া।',
      answer2: 'CaCO₃ → CaO + CO₂ (ইতিমধ্যে সমন্বিত)',
      answer3: '100g CaCO₃ = 1 mole, 1 mole CaCO₃ থেকে 1 mole CaO = 56g',
      answer4: '1 mole CO₂ = 22.4 L STP তে',
      board: 'rajshahi', year: '2023', difficulty: 'HARD', isPremium: true,
    },
    // SSC Math - Dhaka Board 2024
    {
      classSlug: 'ssc', subjectSlug: 'math', chapterSlug: 'sets-functions',
      uddeepok: 'A = {x : x, 10-এর গুণনীয়ক} এবং B = {x : x, 15-এর গুণনীয়ক}',
      question1: 'A ও B সেটগুলো তালিকা পদ্ধতিতে প্রকাশ করো।',
      question2: 'A ∪ B নির্ণয় করো।',
      question3: 'A ∩ B নির্ণয় করো।',
      question4: 'দেখাও যে, n(A∪B) = n(A) + n(B) - n(A∩B)',
      answer1: 'A = {1, 2, 5, 10}, B = {1, 3, 5, 15}',
      answer2: 'A ∪ B = {1, 2, 3, 5, 10, 15}',
      answer3: 'A ∩ B = {1, 5}',
      answer4: 'n(A)=4, n(B)=4, n(A∩B)=2, n(A∪B)=6 ; 4+4-2 = 6 (প্রমাণিত)',
      board: 'dhaka', year: '2024', difficulty: 'MEDIUM', isPremium: false,
    },
    // HSC Physics - Dhaka Board 2024 (premium)
    {
      classSlug: 'hsc', subjectSlug: 'physics', chapterSlug: 'vectors',
      uddeepok: 'F₁ = 3i + 4j এবং F₂ = 5i - 2j বল দুটি একটি বিন্দুতে ক্রিয়াশীল।',
      question1: 'লব্ধি বলের মান নির্ণয় করো।',
      question2: 'F₁ ও F₂-এর মধ্যে কোণ নির্ণয় করো।',
      question3: 'লব্ধি বলের দিক নির্ণয় করো।',
      question4: 'F₁ বরাবর একক ভেক্টর লেখো।',
      answer1: 'F = F₁ + F₂ = 8i + 2j; |F| = √(64+4) = √68 = 2√17 N',
      answer2: 'cosθ = (F₁·F₂)/(|F₁||F₂|) = (15-8)/(5×√29) = 7/(5√29)',
      answer3: 'tanα = 2/8 = 0.25; α = tan⁻¹(0.25)',
      answer4: 'F₁ বরাবর একক ভেক্টর = (3i+4j)/5',
      board: 'dhaka', year: '2024', difficulty: 'HARD', isPremium: true,
    },
  ]

  for (const cq of boardCqSeeds) {
    const classCat = await db.classCategory.findUnique({ where: { slug: cq.classSlug } })
    if (!classCat) continue
    const subject = await db.subject.findFirst({ where: { slug: cq.subjectSlug, classId: classCat.id } })
    if (!subject) continue
    const chapter = await db.chapter.findFirst({ where: { slug: cq.chapterSlug, subjectId: subject.id } })
    if (!chapter) continue

    const existing = await db.cQ.findFirst({ where: { uddeepok: cq.uddeepok } })
    if (!existing) {
      await db.cQ.create({
        data: {
          uddeepok: cq.uddeepok,
          question1: cq.question1, question2: cq.question2,
          question3: cq.question3, question4: cq.question4,
          answer1: cq.answer1, answer2: cq.answer2,
          answer3: cq.answer3, answer4: cq.answer4,
          chapterId: chapter.id, classLevel: cq.classSlug, subjectId: subject.id,
          difficulty: cq.difficulty as 'EASY' | 'MEDIUM' | 'HARD', isPremium: cq.isPremium,
          price: cq.isPremium ? 20 : 0,
          board: cq.board, year: cq.year,
          isActive: true,
        },
      })
    }
  }
  console.log(`✅ ${boardCqSeeds.length} board CQs seeded`)

  // ========== 3. CQ EXAM PACKAGES ==========
  console.log('🌱 Seeding CQ exam packages...')

  // Free SSC Physics CQ Exam Package
  if (sscClass && sscPhysics) {
    const _sscCqPkgSlug = 'ssc-physics-cq-practice'
    const existingSscPkg = await db.cQExamPackage.findFirst({ where: { title: 'এসএসসি পদার্থবিজ্ঞান CQ প্র্যাকটিস' } })
    if (!existingSscPkg) {
      const pkg = await db.cQExamPackage.create({
        data: {
          title: 'এসএসসি পদার্থবিজ্ঞান CQ প্র্যাকটিস',
          description: 'এসএসসি পদার্থবিজ্ঞানের সৃজনশীল প্রশ্ন প্র্যাকটিস সেট',
          classId: sscClass.id,
          subjectIds: [sscPhysics.id],
          price: 0,
          originalPrice: 0,
          isPremium: false,
          totalSets: 2,
          status: 'PUBLISHED',
          isActive: true,
          order: 1,
        },
      })

      const sscPhysicsChapters = await db.chapter.findMany({
        where: { subjectId: sscPhysics.id },
        orderBy: { order: 'asc' },
        take: 2,
      })

      for (let setNum = 0; setNum < sscPhysicsChapters.length; setNum++) {
        const chapter = sscPhysicsChapters[setNum]
        const cqs = await db.cQ.findMany({
          where: { chapterId: chapter.id, classLevel: 'ssc', isPremium: false },
          take: 2,
        })

        if (cqs.length === 0) continue

        const examSet = await db.cQExamSet.create({
          data: {
            packageId: pkg.id,
            title: `সেট ${setNum + 1} - ${chapter.name}`,
            scheduledDate: new Date('2025-06-15'),
            startTime: '00:00',
            endTime: '23:59',
            duration: 30,
            marksPerQ: 5,
            totalMarks: cqs.length * 5,
            totalQuestions: cqs.length,
            status: 'PUBLISHED',
            allowRetake: false,
            order: setNum + 1,
          },
        })

        for (let q = 0; q < cqs.length; q++) {
          await db.cQExamSetQuestion.create({
            data: {
              setId: examSet.id,
              cqId: cqs[q].id,
              marks: 5,
              order: q + 1,
              type: 'CQ',
              subMarks: [1, 1, 1.5, 1.5],
            },
          })
        }
      }
      console.log('✅ Free SSC CQ exam package created')
    } else {
      console.log('→ Free SSC CQ exam package already exists')
    }
  }

  // Premium HSC Physics CQ Exam Package
  if (hscClass && hscPhysics) {
    const existingHscPkg = await db.cQExamPackage.findFirst({ where: { title: 'এইচএসসি পদার্থবিজ্ঞান CQ মডেল টেস্ট' } })
    if (!existingHscPkg) {
      const hscCqPkg = await db.cQExamPackage.create({
        data: {
          title: 'এইচএসসি পদার্থবিজ্ঞান CQ মডেল টেস্ট',
          description: 'এইচএসসি পরীক্ষার্থীদের জন্য সম্পূর্ণ CQ মডেল টেস্ট',
          classId: hscClass.id,
          subjectIds: [hscPhysics.id],
          price: 99,
          originalPrice: 199,
          isPremium: true,
          totalSets: 2,
          status: 'PUBLISHED',
          isActive: true,
          order: 2,
        },
      })

      const hscPhysicsChapters = await db.chapter.findMany({
        where: { subjectId: hscPhysics.id },
        orderBy: { order: 'asc' },
        take: 2,
      })

      // Create CQs for HSC physics if none exist for these chapters
      for (let setNum = 0; setNum < hscPhysicsChapters.length; setNum++) {
        const chapter = hscPhysicsChapters[setNum]
        const cqs = await db.cQ.findMany({
          where: { chapterId: chapter.id, classLevel: 'hsc' },
          take: 2,
        })

        if (cqs.length < 2) {
          const hscCqData = [
            {
              uddeepok: `একটি ${chapter.name} সম্পর্কিত উদ্দীপক। কোনো বস্তু সরলরেখায় গতিশীল।`,
              question1: 'গতির প্রথম সমীকরণটি লেখো।',
              question2: 'সমত্বরণে গতিশীল বস্তুর সরণ নির্ণয়ের সূত্র কী?',
              question3: 'বস্তুটির বেগ-সময় লেখচিত্র অঙ্কন করো।',
              question4: 'লেখচিত্রের ঢাল থেকে কী পাওয়া যায়?',
              answer1: 'v = u + at',
              answer2: 's = ut + ½at²',
              answer3: 'বেগ-সময় লেখচিত্র একটি সরলরেখা হবে।',
              answer4: 'লেখচিত্রের ঢাল = ত্বরণ',
              difficulty: 'MEDIUM', isPremium: true,
            },
            {
              uddeepok: `একটি ${chapter.name} বিষয়ক আরেকটি উদ্দীপক। F = ma সূত্রটি বিবেচনা করো।`,
              question1: 'নিউটনের দ্বিতীয় সূত্রটি বিবৃত করো।',
              question2: 'বল ও ত্বরণের মধ্যে সম্পর্ক কী?',
              question3: 'ভরবেগের পরিবর্তনের হার কিসের সমান?',
              question4: 'নিউটনের দ্বিতীয় সূত্র থেকে বলের একক নির্ণয় করো।',
              answer1: 'বল = ভর × ত্বরণ',
              answer2: 'বলের সাথে ত্বরণের সম্পর্ক সমানুপাতিক।',
              answer3: 'ভরবেগের পরিবর্তনের হার = বল',
              answer4: '1 N = 1 kg × 1 m/s²',
              difficulty: 'MEDIUM', isPremium: true,
            },
          ]

          for (const cq of hscCqData) {
            const exists = await db.cQ.findFirst({ where: { uddeepok: cq.uddeepok } })
            if (!exists) {
              const created = await db.cQ.create({
                data: {
                  ...cq,
                  chapterId: chapter.id, classLevel: 'hsc', subjectId: hscPhysics.id,
                  price: 0, isActive: true,
                  difficulty: cq.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
                },
              })
              cqs.push(created)
            }
          }
        }

        if (cqs.length === 0) continue

        const examSet = await db.cQExamSet.create({
          data: {
            packageId: hscCqPkg.id,
            title: `সেট ${setNum + 1} - ${chapter.name}`,
            scheduledDate: new Date('2025-07-01'),
            startTime: '00:00',
            endTime: '23:59',
            duration: 45,
            marksPerQ: 10,
            totalMarks: cqs.length * 10,
            totalQuestions: cqs.length,
            status: 'PUBLISHED',
            allowRetake: false,
            order: setNum + 1,
          },
        })

        for (let q = 0; q < cqs.length; q++) {
          await db.cQExamSetQuestion.create({
            data: {
              setId: examSet.id,
              cqId: cqs[q].id,
              marks: 10,
              order: q + 1,
              type: 'CQ',
              subMarks: [2, 2, 3, 3],
            },
          })
        }
      }
      console.log('✅ Premium HSC CQ exam package created')
    } else {
      console.log('→ Premium HSC CQ exam package already exists')
    }
  }

  // ========== 4. FREE CONTENT BUNDLE ==========
  console.log('🌱 Seeding free content bundle...')

  const existingFreeBundle = await db.contentBundle.findFirst({ where: { slug: 'ssc-free-sample' } })
  if (!existingFreeBundle && sscPhysics && sscMath) {
    const freeBundle = await db.contentBundle.create({
      data: {
        title: 'এসএসসি ফ্রি স্যাম্পল',
        slug: 'ssc-free-sample',
        description: 'বিনামূল্যে কিছু নমুনা কন্টেন্ট',
        price: 0,
        originalPrice: 0,
        classLevel: 'ssc',
        type: 'MIXED',
        isActive: true,
        order: 2,
      },
    })

    const freeMcqs = await db.mCQ.findMany({
      where: { classLevel: 'ssc', isPremium: false },
      take: 3,
    })
    const freeLectures = await db.lecture.findMany({
      where: { isPremium: false },
      take: 2,
    })

    let itemOrder = 1
    for (const mcq of freeMcqs) {
      const exists = await db.bundleItem.findFirst({
        where: { bundleId: freeBundle.id, contentType: 'mcq', contentId: mcq.id },
      })
      if (!exists) {
        await db.bundleItem.create({
          data: { bundleId: freeBundle.id, contentType: 'mcq', contentId: mcq.id, order: itemOrder++ },
        })
      }
    }
    for (const lec of freeLectures) {
      const exists = await db.bundleItem.findFirst({
        where: { bundleId: freeBundle.id, contentType: 'lecture', contentId: lec.id },
      })
      if (!exists) {
        await db.bundleItem.create({
          data: { bundleId: freeBundle.id, contentType: 'lecture', contentId: lec.id, order: itemOrder++ },
        })
      }
    }
    console.log('✅ Free content bundle created')
  } else {
    console.log('→ Free content bundle already exists')
  }

  // ========== 5. FREE MCQ EXAM PACKAGE ==========
  console.log('🌱 Seeding free MCQ exam package...')

  const existingFreeMcqPkg = await db.mCQExamPackage.findFirst({ where: { title: 'এসএসসি গণিত ফ্রি টেস্ট' } })
  if (!existingFreeMcqPkg && sscClass && sscMath) {
    const freeMcqPkg = await db.mCQExamPackage.create({
      data: {
        title: 'এসএসসি গণিত ফ্রি টেস্ট',
        description: 'বিনামূল্যে গণিত প্র্যাকটিস টেস্ট',
        classId: sscClass.id,
        subjectIds: [sscMath.id],
        price: 0,
        originalPrice: 0,
        isPremium: false,
        totalSets: 1,
        status: 'PUBLISHED',
        isActive: true,
        order: 2,
      },
    })

    const freeMcqs = await db.mCQ.findMany({
      where: { classLevel: 'ssc', subjectId: sscMath.id, isPremium: false },
      take: 5,
    })

    if (freeMcqs.length >= 3) {
      const examSet = await db.mCQExamSet.create({
        data: {
          packageId: freeMcqPkg.id,
          title: 'ফ্রি প্র্যাকটিস সেট',
          scheduledDate: new Date('2025-06-01'),
          startTime: '00:00',
          endTime: '23:59',
          duration: 15,
          marksPerQ: 1,
          totalMarks: freeMcqs.length,
          totalQuestions: freeMcqs.length,
          status: 'PUBLISHED',
          order: 1,
        },
      })

      for (let q = 0; q < freeMcqs.length; q++) {
        const exists = await db.mCQExamSetQuestion.findFirst({
          where: { setId: examSet.id, mcqId: freeMcqs[q].id },
        })
        if (!exists) {
          await db.mCQExamSetQuestion.create({
            data: { setId: examSet.id, mcqId: freeMcqs[q].id, marks: 1, order: q + 1 },
          })
        }
      }
    }
    console.log('✅ Free MCQ exam package created')
  } else {
    console.log('→ Free MCQ exam package already exists')
  }

  // ========== 6. PREMIUM EXAM (CQ TYPE) ==========
  console.log('🌱 Seeding premium CQ exam...')

  if (sscPhysics) {
    const existingPremiumExam = await db.exam.findFirst({
      where: { title: 'এসএসসি পদার্থবিজ্ঞান CQ মডেল টেস্ট (প্রিমিয়াম)' },
    })
    if (!existingPremiumExam) {
      const premExam = await db.exam.create({
        data: {
          title: 'এসএসসি পদার্থবিজ্ঞান CQ মডেল টেস্ট (প্রিমিয়াম)',
          classLevel: 'ssc',
          subjectId: sscPhysics.id,
          type: 'MIXED',
          duration: 60,
          totalMarks: 30,
          marksPerMcq: 1,
          negativeMarks: 0.25,
          isPremium: true,
          price: 50,
          status: 'PUBLISHED',
          isActive: true,
          description: 'সম্পূর্ণ মডেল টেস্ট MCQ ও CQ উভয় অংশসহ',
          instructions: 'MCQ অংশে ২০টি প্রশ্ন থাকবে। প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে। CQ অংশে ২টি সৃজনশীল প্রশ্ন থাকবে।',
        },
      })

      const examMcqs = await db.mCQ.findMany({
        where: { subjectId: sscPhysics.id, classLevel: 'ssc' },
        take: 20,
      })
      for (let i = 0; i < examMcqs.length; i++) {
        await db.examQuestion.create({
          data: {
            examId: premExam.id,
            questionType: 'mcq',
            questionId: examMcqs[i].id,
            order: i + 1,
            marks: 1,
          },
        })
      }

      // Add 2 CQ questions
      const examCqs = await db.cQ.findMany({
        where: { subjectId: sscPhysics.id, classLevel: 'ssc' },
        take: 2,
      })
      for (let i = 0; i < examCqs.length; i++) {
        await db.examQuestion.create({
          data: {
            examId: premExam.id,
            questionType: 'cq',
            questionId: examCqs[i].id,
            order: examMcqs.length + i + 1,
            marks: 5,
          },
        })
      }
      console.log('✅ Premium CQ exam created')
    } else {
      console.log('→ Premium CQ exam already exists')
    }
  }

  // ========== 7. ADDITIONAL CONTENT PACKAGE (HALF-YEARLY) ==========
  console.log('🌱 Seeding half-yearly content package...')

  const existingHalfYearly = await db.contentPackage.findFirst({ where: { slug: 'half-yearly-package' } })
  if (!existingHalfYearly) {
    await db.contentPackage.create({
      data: {
        title: 'ছয় মাসিক প্যাকেজ',
        slug: 'half-yearly-package',
        description: '৬ মাসের জন্য সকল কন্টেন্ট অ্যাক্সেস',
        price: 299,
        originalPrice: 594,
        duration: 180,
        durationLabel: '৬ মাস',
        isActive: true,
        order: 3,
      },
    })
    console.log('✅ Half-yearly package created')
  } else {
    console.log('→ Half-yearly package already exists')
  }

  // ========== 8. MCQ EXAM PACKAGE — CHEMISTRY (PREMIUM) ==========
  console.log('🌱 Seeding premium Chemistry MCQ exam package...')

  if (sscClass && sscChemistry) {
    const existingChemPkg = await db.mCQExamPackage.findFirst({ where: { title: 'এসএসসি রসায়ন মডেল টেস্ট' } })
    if (!existingChemPkg) {
      const chemPkg = await db.mCQExamPackage.create({
        data: {
          title: 'এসএসসি রসায়ন মডেল টেস্ট',
          description: 'এসএসসি রসায়নের সম্পূর্ণ মডেল টেস্ট',
          classId: sscClass.id,
          subjectIds: [sscChemistry.id],
          price: 79,
          originalPrice: 149,
          isPremium: true,
          totalSets: 2,
          status: 'PUBLISHED',
          isActive: true,
          order: 3,
        },
      })

      const chemChapters = await db.chapter.findMany({
        where: { subjectId: sscChemistry.id },
        orderBy: { order: 'asc' },
        take: 2,
      })

      for (let setNum = 0; setNum < chemChapters.length; setNum++) {
        const chapter = chemChapters[setNum]
        const chapterMcqs = await db.mCQ.findMany({
          where: { chapterId: chapter.id, classLevel: 'ssc' },
          take: 5,
        })

        if (chapterMcqs.length === 0) continue

        const examSet = await db.mCQExamSet.create({
          data: {
            packageId: chemPkg.id,
            title: `সেট ${setNum + 1} - ${chapter.name}`,
            scheduledDate: new Date('2025-06-20'),
            startTime: '10:00',
            endTime: '23:59',
            duration: 20,
            marksPerQ: 1,
            totalMarks: chapterMcqs.length,
            totalQuestions: chapterMcqs.length,
            status: 'PUBLISHED',
            order: setNum + 1,
          },
        })

        for (let q = 0; q < chapterMcqs.length; q++) {
          await db.mCQExamSetQuestion.create({
            data: { setId: examSet.id, mcqId: chapterMcqs[q].id, marks: 1, order: q + 1 },
          })
        }
      }
      console.log('✅ Premium Chemistry MCQ exam package created')
    } else {
      console.log('→ Premium Chemistry MCQ exam package already exists')
    }
  }

  // ========== 9. BOARD YEARS FOR NEWER YEARS ==========
  console.log('🌱 Seeding additional board-year mappings...')

  const allBoards = await db.board.findMany({ select: { slug: true } })
  const newerYears = ['2026', '2025', '2024', '2023', '2022']

  for (const board of allBoards) {
    for (const year of newerYears) {
      const existing = await db.boardYear.findFirst({
        where: { board: board.slug, year },
      })
      if (!existing) {
        await db.boardYear.create({ data: { board: board.slug, year } })
      }
    }
  }
  console.log('✅ Board-year mappings updated')

  console.log('\n🎉 Supplementary content seeding complete!')
}

seedContent()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
