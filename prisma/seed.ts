import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

async function seed() {
  // ========== SUPER ADMIN (with fallback defaults) ==========
  console.log('🌱 Seeding super admin...')

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@shikhabangla.com'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123'

  const existingAdmin = await db.user.findUnique({ where: { email: superAdminEmail } })
  const hashedPassword = hashPassword(superAdminPassword)

  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: hashedPassword,
        role: 'super_admin',
        isVerified: true,
        isPremium: true,
      },
    })
    console.log(`✅ Super Admin created (${superAdminEmail})`)
  } else {
    // Ensure existing admin has super_admin role and correct password
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: 'super_admin',
        password: hashedPassword,
        isVerified: true,
      },
    })
    console.log(`✅ Super Admin already exists — role & password synced (${superAdminEmail})`)
  }

  // ========== ADMIN USER (regular admin) ==========
  console.log('🌱 Seeding admin user...')

  const adminEmail = 'moderator@shikhabangla.com'
  const existingMod = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existingMod) {
    const adminPassword = hashPassword('admin123')
    await db.user.create({
      data: {
        email: adminEmail,
        name: 'মডারেটর',
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        isPremium: true,
      },
    })
    console.log(`✅ Admin user created (${adminEmail})`)
  } else {
    console.log(`✅ Admin user already exists (${adminEmail})`)
  }

  // ========== STUDENT USERS ==========
  console.log('🌱 Seeding student users...')

  const studentPasswords = hashPassword('Student123')
  const sampleStudents = [
    { email: 'rahul@student.com', name: 'রাহুল আহমেদ', classLevel: 'ssc', board: 'dhaka', phone: '01712345678' },
    { email: 'fatema@student.com', name: 'ফাতেমা খাতুন', classLevel: 'ssc', board: 'rajshahi', phone: '01812345678' },
    { email: 'sakib@student.com', name: 'সাকিব হাসান', classLevel: 'hsc', board: 'dhaka', phone: '01912345678', isPremium: true },
  ]

  for (const student of sampleStudents) {
    const existing = await db.user.findUnique({ where: { email: student.email } })
    if (!existing) {
      await db.user.create({
        data: {
          email: student.email,
          name: student.name,
          password: studentPasswords,
          role: 'student',
          phone: student.phone,
          classLevel: student.classLevel,
          board: student.board,
          isVerified: true,
          isPremium: student.isPremium ?? false,
        },
      })
    }
  }
  console.log('✅ Sample students seeded')

  // ========== CLASS CATEGORIES ==========
  console.log('🌱 Seeding class categories...')

  const classes = [
    { name: '৬ষ্ঠ শ্রেণি', slug: 'class-6', order: 1, icon: '6', color: '#10b981', gradient: 'from-emerald-400 to-emerald-600' },
    { name: '৭ম শ্রেণি', slug: 'class-7', order: 2, icon: '7', color: '#3b82f6', gradient: 'from-teal-400 to-teal-600' },
    { name: '৮ম শ্রেণি', slug: 'class-8', order: 3, icon: '8', color: '#8b5cf6', gradient: 'from-cyan-400 to-cyan-600' },
    { name: 'এসএসসি', slug: 'ssc', order: 4, icon: 'S', color: '#f59e0b', gradient: 'from-emerald-500 to-teal-500' },
    { name: 'এইচএসসি', slug: 'hsc', order: 5, icon: 'H', color: '#ef4444', gradient: 'from-teal-500 to-emerald-500' },
  ]

  for (const cls of classes) {
    const existing = await db.classCategory.findUnique({ where: { slug: cls.slug } })
    if (!existing) {
      await db.classCategory.create({ data: cls })
    } else {
      // Update existing records with new fields (gradient) if missing
      await db.classCategory.update({
        where: { slug: cls.slug },
        data: {
          name: cls.name,
          order: cls.order,
          icon: cls.icon,
          color: cls.color,
          gradient: cls.gradient,
        },
      })
    }
  }
  console.log('✅ Class categories seeded')

  // ========== SUBJECTS ==========
  console.log('🌱 Seeding subjects...')

  const subjectData: Record<string, Array<{ name: string; slug: string; icon: string; color: string }>> = {
    'class-6': [
      { name: 'বাংলা', slug: 'bangla', icon: 'বা', color: '#10b981' },
      { name: 'English', slug: 'english', icon: 'En', color: '#3b82f6' },
      { name: 'গণিত', slug: 'math', icon: 'গ', color: '#f59e0b' },
      { name: 'বিজ্ঞান', slug: 'science', icon: 'বি', color: '#8b5cf6' },
      { name: 'সমাজ', slug: 'social-science', icon: 'স', color: '#ef4444' },
      { name: 'ইসলাম ও নৈতিকতা', slug: 'islam', icon: 'ই', color: '#06b6d4' },
    ],
    'class-7': [
      { name: 'বাংলা', slug: 'bangla', icon: 'বা', color: '#10b981' },
      { name: 'English', slug: 'english', icon: 'En', color: '#3b82f6' },
      { name: 'গণিত', slug: 'math', icon: 'গ', color: '#f59e0b' },
      { name: 'বিজ্ঞান', slug: 'science', icon: 'বি', color: '#8b5cf6' },
      { name: 'সমাজ', slug: 'social-science', icon: 'স', color: '#ef4444' },
    ],
    'class-8': [
      { name: 'বাংলা', slug: 'bangla', icon: 'বা', color: '#10b981' },
      { name: 'English', slug: 'english', icon: 'En', color: '#3b82f6' },
      { name: 'গণিত', slug: 'math', icon: 'গ', color: '#f59e0b' },
      { name: 'বিজ্ঞান', slug: 'science', icon: 'বি', color: '#8b5cf6' },
      { name: 'ICT', slug: 'ict', icon: 'IC', color: '#06b6d4' },
    ],
    'ssc': [
      { name: 'বাংলা', slug: 'bangla', icon: 'বা', color: '#10b981' },
      { name: 'English', slug: 'english', icon: 'En', color: '#3b82f6' },
      { name: 'গণিত', slug: 'math', icon: 'গ', color: '#f59e0b' },
      { name: 'পদার্থবিজ্ঞান', slug: 'physics', icon: 'প', color: '#8b5cf6' },
      { name: 'রসায়ন', slug: 'chemistry', icon: 'র', color: '#ef4444' },
      { name: 'জীববিজ্ঞান', slug: 'biology', icon: 'জী', color: '#06b6d4' },
      { name: 'উচ্চতর গণিত', slug: 'higher-math', icon: 'উ', color: '#f97316' },
      { name: 'ICT', slug: 'ict', icon: 'IC', color: '#14b8a6' },
    ],
    'hsc': [
      { name: 'বাংলা', slug: 'bangla', icon: 'বা', color: '#10b981' },
      { name: 'English', slug: 'english', icon: 'En', color: '#3b82f6' },
      { name: 'পদার্থবিজ্ঞান', slug: 'physics', icon: 'প', color: '#8b5cf6' },
      { name: 'রসায়ন', slug: 'chemistry', icon: 'র', color: '#ef4444' },
      { name: 'উচ্চতর গণিত', slug: 'higher-math', icon: 'উ', color: '#f97316' },
      { name: 'জীববিজ্ঞান', slug: 'biology', icon: 'জী', color: '#06b6d4' },
      { name: 'হিসাববিজ্ঞান', slug: 'accounting', icon: 'হি', color: '#6366f1' },
      { name: 'ICT', slug: 'ict', icon: 'IC', color: '#14b8a6' },
    ],
  }

  for (const [classSlug, subjects] of Object.entries(subjectData)) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!classCategory) continue

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i]
      const existing = await db.subject.findFirst({
        where: { slug: subject.slug, classId: classCategory.id },
      })
      if (!existing) {
        await db.subject.create({
          data: {
            ...subject,
            classId: classCategory.id,
            order: i + 1,
            description: `${subject.name} - ${classCategory.name}`,
          },
        })
      }
    }
  }
  console.log('✅ Subjects seeded')

  // ========== CHAPTERS ==========
  console.log('🌱 Seeding chapters...')

  const chapterData: Record<string, Record<string, Array<{ name: string; slug: string }>>> = {
    'class-6': {
      'bangla': [
        { name: 'কবিতা ও গদ্য', slug: 'poetry-prose' },
        { name: 'ব্যাকরণ', slug: 'grammar' },
        { name: 'সাহিত্যের ইতিহাস', slug: 'literary-history' },
      ],
      'english': [
        { name: 'Grammar & Composition', slug: 'grammar-composition' },
        { name: 'Reading Comprehension', slug: 'reading-comprehension' },
      ],
      'math': [
        { name: 'প্রাকৃতিক সংখ্যা', slug: 'natural-numbers' },
        { name: 'ভগ্নাংশ ও দশমিক', slug: 'fractions-decimals' },
        { name: 'জ্যামিতির প্রাথমিক ধারণা', slug: 'basic-geometry' },
      ],
      'science': [
        { name: 'পদার্থের বৈশিষ্ট্য', slug: 'matter-properties' },
        { name: 'জীবের পরিচয়', slug: 'living-organisms' },
        { name: 'পরিবেশ ও প্রকৃতি', slug: 'environment-nature' },
      ],
      'social-science': [
        { name: 'বাংলাদেশ ও বিশ্বপরিচয়', slug: 'bangladesh-world' },
        { name: 'নাগরিকতা', slug: 'citizenship' },
      ],
      'islam': [
        { name: 'আকাইদ ও ইবাদত', slug: 'aqeedah-ibadah' },
        { name: 'ইসলামের ইতিহাস', slug: 'islamic-history' },
      ],
    },
    'class-7': {
      'bangla': [
        { name: 'কবিতা ও গদ্য', slug: 'poetry-prose' },
        { name: 'ব্যাকরণ', slug: 'grammar' },
      ],
      'english': [
        { name: 'Grammar & Composition', slug: 'grammar-composition' },
        { name: 'Reading & Writing', slug: 'reading-writing' },
      ],
      'math': [
        { name: 'পূর্ণসংখ্যা', slug: 'integers' },
        { name: 'রেখা ও কোণ', slug: 'lines-angles' },
        { name: 'ত্রিভুজ', slug: 'triangles' },
      ],
      'science': [
        { name: 'পদার্থের অবস্থা', slug: 'states-matter' },
        { name: 'উদ্ভিদের পুষ্টি', slug: 'plant-nutrition' },
        { name: 'বিদ্যুৎ', slug: 'electricity' },
      ],
      'social-science': [
        { name: 'বাংলাদেশের ইতিহাস', slug: 'bangladesh-history' },
        { name: 'ভূগোল', slug: 'geography' },
      ],
    },
    'class-8': {
      'bangla': [
        { name: 'কবিতা ও গদ্য', slug: 'poetry-prose' },
        { name: 'ব্যাকরণ', slug: 'grammar' },
      ],
      'english': [
        { name: 'Grammar & Composition', slug: 'grammar-composition' },
        { name: 'Reading & Writing', slug: 'reading-writing' },
      ],
      'math': [
        { name: 'অনুপাত ও সমানুপাত', slug: 'ratio-proportion' },
        { name: 'বীজগণিতীয় সমীকরণ', slug: 'algebraic-equations' },
        { name: 'চতুর্ভুজ', slug: 'quadrilaterals' },
      ],
      'science': [
        { name: 'পরমাণুর গঠন', slug: 'atomic-structure' },
        { name: 'রাসায়নিক বিক্রিয়া', slug: 'chemical-reactions' },
        { name: 'বল ও গতি', slug: 'force-motion' },
      ],
      'ict': [
        { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' },
        { name: 'কম্পিউটারের ব্যবহার', slug: 'computer-usage' },
      ],
    },
    'ssc': {
      'physics': [
        { name: 'ভৌত জগত ও পরিমাপ', slug: 'physical-world-measurement' },
        { name: 'গতি', slug: 'motion' },
        { name: 'বল', slug: 'force' },
        { name: 'কাজ ক্ষমতা ও শক্তি', slug: 'work-power-energy' },
        { name: 'তাপ ও তাপমাত্রা', slug: 'heat-temperature' },
        { name: 'তরঙ্গ ও শব্দ', slug: 'wave-sound' },
      ],
      'chemistry': [
        { name: 'রসায়নের ভূমিকা', slug: 'intro-chemistry' },
        { name: 'অবস্থার পরিবর্তন', slug: 'state-change' },
        { name: 'পরমাণুর গঠন', slug: 'atomic-structure' },
        { name: 'মৌলের পর্যায় শ্রেণীবিন্যাস', slug: 'periodic-table' },
      ],
      'math': [
        { name: 'বাস্তব সংখ্যা ও অনুপাত', slug: 'real-numbers-ratio' },
        { name: 'সেট ও ফাংশন', slug: 'sets-functions' },
        { name: 'বীজগণিতীয় রাশি', slug: 'algebraic-expressions' },
        { name: 'জ্যামিতি', slug: 'geometry' },
      ],
      'biology': [
        { name: 'জীবনের উৎপত্তি ও বিবর্তন', slug: 'origin-evolution' },
        { name: 'কোষ ও এর গঠন', slug: 'cell-structure' },
        { name: 'উদ্ভিদের শারীরতত্ত্ব', slug: 'plant-physiology' },
        { name: 'প্রাণীর শারীরতত্ত্ব', slug: 'animal-physiology' },
      ],
      'bangla': [
        { name: 'কবিতা ও গদ্য', slug: 'poetry-prose' },
        { name: 'ব্যাকরণ', slug: 'grammar' },
        { name: 'সাহিত্যের ইতিহাস', slug: 'literary-history' },
      ],
      'english': [
        { name: 'Grammar & Composition', slug: 'grammar-composition' },
        { name: 'Reading Comprehension', slug: 'reading-comprehension' },
        { name: 'Writing Skills', slug: 'writing-skills' },
      ],
      'higher-math': [
        { name: 'ম্যাট্রিক্স ও নির্ণায়ক', slug: 'matrix-determinant' },
        { name: 'সরলরেখা', slug: 'straight-line' },
        { name: 'ত্রিকোণমিতি', slug: 'trigonometry' },
      ],
      'ict': [
        { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' },
        { name: 'ইন্টারনেট ও ওয়েব', slug: 'internet-web' },
        { name: 'প্রোগ্রামিং', slug: 'programming' },
      ],
    },
    'hsc': {
      'physics': [
        { name: 'ভৌত জগত ও পরিমাপ', slug: 'physical-world' },
        { name: 'ভেক্টর', slug: 'vectors' },
        { name: 'গতিবিদ্যা', slug: 'kinetics' },
        { name: 'নিউটনীয় বলবিদ্যা', slug: 'newtonian-mechanics' },
      ],
      'chemistry': [
        { name: 'নিরাপদ রসায়ন পরিচয়', slug: 'safe-chemistry' },
        { name: 'পরমাণু গঠন ও ইলেকট্রন বিন্যাস', slug: 'atomic-electron' },
        { name: 'রাসায়নিক বন্ধন', slug: 'chemical-bonding' },
      ],
      'higher-math': [
        { name: 'ম্যাট্রিক্স ও নির্ণায়ক', slug: 'matrix-determinant' },
        { name: 'সদিক রাশি', slug: 'vectors' },
        { name: 'সরলরেখা', slug: 'straight-line' },
      ],
      'biology': [
        { name: 'কোষ রসায়ন', slug: 'cell-chemistry' },
        { name: 'কোষ বিভাজন', slug: 'cell-division' },
        { name: 'উদ্ভিদ শারীরবৃত্ত', slug: 'plant-physiology' },
      ],
      'bangla': [
        { name: 'কবিতা ও গদ্য', slug: 'poetry-prose' },
        { name: 'ব্যাকরণ', slug: 'grammar' },
      ],
      'english': [
        { name: 'Grammar & Composition', slug: 'grammar-composition' },
        { name: 'Reading Comprehension', slug: 'reading-comprehension' },
      ],
      'accounting': [
        { name: 'হিসাববিজ্ঞানের ভূমিকা', slug: 'intro-accounting' },
        { name: 'জাবেদা ও লেজার', slug: 'journal-ledger' },
      ],
      'ict': [
        { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' },
        { name: 'ওয়েব ডিজাইন', slug: 'web-design' },
      ],
    },
  }

  for (const [classSlug, subjectChapters] of Object.entries(chapterData)) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!classCategory) continue

    for (const [subjectSlug, chapters] of Object.entries(subjectChapters)) {
      const subject = await db.subject.findFirst({
        where: { slug: subjectSlug, classId: classCategory.id },
      })
      if (!subject) continue

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i]
        const existing = await db.chapter.findFirst({
          where: { slug: ch.slug, subjectId: subject.id },
        })
        if (!existing) {
          await db.chapter.create({
            data: {
              ...ch,
              subjectId: subject.id,
              order: i + 1,
              description: ch.name,
            },
          })
        }
      }
    }
  }
  console.log('✅ Chapters seeded')

  // ========== TOPICS ==========
  console.log('🌱 Seeding topics...')

  // Add topics for key chapters across classes
  const topicSeeds: Record<string, Record<string, Record<string, Array<{ name: string; slug: string }>>>> = {
    'class-6': {
      'math': {
        'natural-numbers': [
          { name: 'প্রাকৃতিক সংখ্যার ধারণা', slug: 'natural-numbers-concept' },
          { name: 'সংখ্যার তুলনা', slug: 'number-comparison' },
          { name: 'প্রাইম ও যৌগিক সংখ্যা', slug: 'prime-composite' },
        ],
      },
      'science': {
        'matter-properties': [
          { name: 'পদার্থের অবস্থা', slug: 'states-of-matter' },
          { name: 'পদার্থের পরিবর্তন', slug: 'matter-change' },
        ],
      },
    },
    'class-7': {
      'math': {
        'integers': [
          { name: 'পূর্ণসংখ্যার ধারণা', slug: 'integers-concept' },
          { name: 'পূর্ণসংখ্যার যোগ ও বিয়োগ', slug: 'integer-addition-subtraction' },
        ],
      },
      'science': {
        'states-matter': [
          { name: 'কঠিন, তরল ও গ্যাস', slug: 'solid-liquid-gas' },
          { name: 'অবস্থার পরিবর্তন', slug: 'state-change' },
        ],
      },
    },
    'class-8': {
      'math': {
        'ratio-proportion': [
          { name: 'অনুপাতের ধারণা', slug: 'ratio-concept' },
          { name: 'সমানুপাত', slug: 'proportion' },
        ],
      },
      'science': {
        'atomic-structure': [
          { name: 'পরমাণুর মডেল', slug: 'atomic-model' },
          { name: 'ইলেকট্রন বিন্যাস', slug: 'electron-configuration' },
        ],
      },
    },
    'ssc': {
      'physics': {
        'physical-world-measurement': [
          { name: 'ভৌত জগত ও এর শাখাসমূহ', slug: 'physical-world-branches' },
          { name: 'পরিমাপ ও একক', slug: 'measurement-units' },
          { name: 'মাত্রিক সমীকরণ', slug: 'dimensional-equation' },
        ],
        'motion': [
          { name: 'স্থিরতা ও গতি', slug: 'rest-motion' },
          { name: 'সমত্বরণ', slug: 'uniform-acceleration' },
          { name: 'সমবেগ ও প্রাস', slug: 'uniform-velocity-projectile' },
        ],
      },
      'chemistry': {
        'intro-chemistry': [
          { name: 'রসায়নের পরিধি', slug: 'chemistry-scope' },
          { name: 'রসায়নের শাখা', slug: 'chemistry-branches' },
        ],
      },
    },
    'hsc': {
      'physics': {
        'physical-world': [
          { name: 'পদার্থবিজ্ঞানের পরিধি', slug: 'physics-scope' },
          { name: 'পরিমাপের সঠিকতা', slug: 'measurement-accuracy' },
        ],
      },
    },
  }

  for (const [classSlug, subjectTopics] of Object.entries(topicSeeds)) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!classCategory) continue

    for (const [subjectSlug, chapterTopics] of Object.entries(subjectTopics)) {
      const subject = await db.subject.findFirst({
        where: { slug: subjectSlug, classId: classCategory.id },
      })
      if (!subject) continue

      for (const [chapterSlug, topics] of Object.entries(chapterTopics)) {
        const chapter = await db.chapter.findFirst({
          where: { slug: chapterSlug, subjectId: subject.id },
        })
        if (!chapter) continue

        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i]
          const existing = await db.topic.findFirst({
            where: { slug: topic.slug, chapterId: chapter.id },
          })
          if (!existing) {
            await db.topic.create({
              data: {
                ...topic,
                chapterId: chapter.id,
                order: i + 1,
                description: topic.name,
              },
            })
          }
        }
      }
    }
  }
  console.log('✅ Topics seeded')

  // ========== BOARDS ==========
  console.log('🌱 Seeding boards...')

  const boards = [
    { name: 'ঢাকা', slug: 'dhaka', color: 'rose', order: 1 },
    { name: 'রাজশাহী', slug: 'rajshahi', color: 'emerald', order: 2 },
    { name: 'চট্টগ্রাম', slug: 'chittagong', color: 'sky', order: 3 },
    { name: 'বরিশাল', slug: 'barishal', color: 'amber', order: 4 },
    { name: 'সিলেট', slug: 'sylhet', color: 'violet', order: 5 },
    { name: 'দিনাজপুর', slug: 'dinajpur', color: 'orange', order: 6 },
    { name: 'কুমিল্লা', slug: 'comilla', color: 'teal', order: 7 },
    { name: 'যশোর', slug: 'jessore', color: 'pink', order: 8 },
    { name: 'ময়মনসিংহ', slug: 'mymensingh', color: 'indigo', order: 9 },
    { name: 'টেকনাফ', slug: 'teknaf', color: 'cyan', order: 10 },
  ]

  for (const board of boards) {
    const existing = await db.board.findUnique({ where: { slug: board.slug } })
    if (!existing) {
      await db.board.create({ data: board })
    } else {
      // Update color for existing boards
      await db.board.update({ where: { slug: board.slug }, data: { color: board.color } })
    }
  }
  console.log('✅ Boards seeded')

  // ========== EXAM YEARS ==========
  console.log('🌱 Seeding exam years...')

  const examYears = [
    { year: '2025', order: 1 },
    { year: '2024', order: 2 },
    { year: '2023', order: 3 },
    { year: '2022', order: 4 },
    { year: '2021', order: 5 },
    { year: '2020', order: 6 },
    { year: '2019', order: 7 },
    { year: '2018', order: 8 },
    { year: '2017', order: 9 },
    { year: '2016', order: 10 },
  ]

  for (const ey of examYears) {
    const existing = await db.examYear.findUnique({ where: { year: ey.year } })
    if (!existing) {
      await db.examYear.create({ data: ey })
    }
  }
  console.log('✅ Exam years seeded')

  // ========== BOARD-YEAR MAPPING ==========
  console.log('🌱 Seeding board-year mappings...')

  const allBoards = await db.board.findMany({ select: { slug: true } })
  const allYears = await db.examYear.findMany({ select: { year: true }, orderBy: { year: 'desc' } })

  for (const board of allBoards) {
    for (const ey of allYears.slice(0, 5)) {
      const existing = await db.boardYear.findFirst({
        where: { board: board.slug, year: ey.year },
      })
      if (!existing) {
        await db.boardYear.create({
          data: { board: board.slug, year: ey.year },
        })
      }
    }
  }
  console.log('✅ Board-year mappings seeded')

  // ========== MCQs ==========
  console.log('🌱 Seeding MCQs...')

  // SSC Physics MCQs - detailed
  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const physicsSubject = sscClass ? await db.subject.findFirst({
    where: { slug: 'physics', classId: sscClass.id },
  }) : null

  if (physicsSubject) {
    const chapters = await db.chapter.findMany({ where: { subjectId: physicsSubject.id }, orderBy: { order: 'asc' } })

    const mcqByChapter: Record<string, Array<{ question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; difficulty: string; isPremium: boolean; price?: number }>> = {
      'physical-world-measurement': [
        { question: 'পদার্থবিজ্ঞানে দৈর্ঘ্যের SI একক কোনটি?', optionA: 'সেন্টিমিটার', optionB: 'মিটার', optionC: 'কিলোমিটার', optionD: 'মিলিমিটার', correctAnswer: 'B', explanation: 'পদার্থবিজ্ঞানে দৈর্ঘ্যের SI একক হলো মিটার (m)।', difficulty: 'easy', isPremium: false },
        { question: '1 আলোকবর্ষ সমান কত মিটার?', optionA: '9.46 × 10¹⁵ m', optionB: '3 × 10⁸ m', optionC: '1.5 × 10¹¹ m', optionD: '3.08 × 10¹⁶ m', correctAnswer: 'A', explanation: '1 আলোকবর্ষ = আলোর বেগ × 1 বছর ≈ 9.46 × 10¹⁵ মিটার', difficulty: 'medium', isPremium: false },
        { question: 'নিচের কোনটি ভেক্টর রাশি?', optionA: 'ভর', optionB: 'তাপমাত্রা', optionC: 'বেগ', optionD: 'সময়', correctAnswer: 'C', explanation: 'বেগ হলো ভেক্টর রাশি কারণ এর মান ও দিক উভয়ই আছে।', difficulty: 'easy', isPremium: false },
        { question: 'পরিমাপে সংকট কোনটি?', optionA: 'নির্ভুলতা', optionB: 'যথার্থতা', optionC: 'শুদ্ধতা', optionD: 'তাৎপর্যপূর্ণ অঙ্ক', correctAnswer: 'D', explanation: 'পরিমাপে সংকট বলতে তাৎপর্যপূর্ণ অঙ্ককে বোঝায়।', difficulty: 'hard', isPremium: true, price: 10 },
        { question: 'মাত্রাহীন রাশি কোনটি?', optionA: 'বল', optionB: 'কোণ', optionC: 'দৈর্ঘ্য', optionD: 'সময়', correctAnswer: 'B', explanation: 'কোণ একটি মাত্রাহীন রাশি।', difficulty: 'medium', isPremium: true, price: 10 },
      ],
      'motion': [
        { question: 'স্থির অবস্থা থেকে অবাধে পতনশীল বস্তুর প্রাথমিক ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '10.8 m/s²', optionC: '8.9 m/s²', optionD: '11.2 m/s²', correctAnswer: 'A', explanation: 'মুক্তভাবে পতনশীল বস্তুর ত্বরণ g = 9.8 m/s²', difficulty: 'easy', isPremium: false },
        { question: 'সমবেগে চলমান বস্তুর ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '0', optionC: 'অসীম', optionD: 'ঋণাত্মক', correctAnswer: 'B', explanation: 'সমবেগে বেগ পরিবর্তন না হওয়ায় ত্বরণ = 0', difficulty: 'easy', isPremium: false },
        { question: 'বেগ-সময় লেখচিত্রের ঢাল কী নির্দেশ করে?', optionA: 'বেগ', optionB: 'সরণ', optionC: 'ত্বরণ', optionD: 'বল', correctAnswer: 'C', explanation: 'v-t লেখচিত্রের ঢাল = ত্বরণ', difficulty: 'medium', isPremium: false },
        { question: 'একটি গাড়ি 36 km/h বেগে যাচ্ছে। এটি m/s এ কত?', optionA: '5 m/s', optionB: '10 m/s', optionC: '15 m/s', optionD: '20 m/s', correctAnswer: 'B', explanation: '36 km/h = 36 × 1000/3600 = 10 m/s', difficulty: 'easy', isPremium: false },
        { question: 'প্রক্ষিপ্ত বস্তুর সর্বোচ্চ উচ্চতায় বেগ কত?', optionA: 'সর্বোচ্চ', optionB: 'নূন্যতম', optionC: 'শূন্য', optionD: 'প্রাথমিক বেগের অর্ধেক', correctAnswer: 'C', explanation: 'সর্বোচ্চ উচ্চতায় বস্তুর উল্লম্ব বেগ = 0', difficulty: 'medium', isPremium: true, price: 10 },
      ],
      'force': [
        { question: 'নিউটনের তৃতীয় সূত্র কোনটি?', optionA: 'জড়তার সূত্র', optionB: 'F = ma', optionC: 'ক্রিয়া-প্রতিক্রিয়া সূত্র', optionD: 'মহাকর্ষ সূত্র', correctAnswer: 'C', explanation: 'প্রতিটি ক্রিয়ার একটি সমান ও বিপরীত প্রতিক্রিয়া আছে।', difficulty: 'easy', isPremium: false },
        { question: 'ঘর্ষণ বল সর্বদা কোন দিকে ক্রিয়া করে?', optionA: 'গতির দিকে', optionB: 'গতির বিপরীত দিকে', optionC: 'উল্লম্ব দিকে', optionD: 'যেকোনো দিকে', correctAnswer: 'B', explanation: 'ঘর্ষণ বল সর্বদা গতির বিপরীত দিকে ক্রিয়া করে।', difficulty: 'easy', isPremium: false },
        { question: '1 নিউটন বল = কত ডাইন?', optionA: '10³ ডাইন', optionB: '10⁴ ডাইন', optionC: '10⁵ ডাইন', optionD: '10² ডাইন', correctAnswer: 'C', explanation: '1 N = 10⁵ ডাইন', difficulty: 'medium', isPremium: false },
      ],
    }

    for (const chapter of chapters) {
      const chapterMcqs = mcqByChapter[chapter.slug] || []
      for (let mcqIdx = 0; mcqIdx < chapterMcqs.length; mcqIdx++) {
        const mcq = chapterMcqs[mcqIdx]
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
        if (!existing) {
          // First 2 MCQs per chapter are board questions (from Dhaka board)
          const isBoardMcq = mcqIdx < 2
          await db.mCQ.create({
            data: {
              ...mcq,
              chapterId: chapter.id,
              classLevel: 'ssc',
              subjectId: physicsSubject.id,
              board: isBoardMcq ? 'dhaka' : null,
              year: isBoardMcq ? '2024' : null,
            },
          })
        }
      }
    }

    // Add generic MCQs for other chapters that don't have specific ones
    for (const chapter of chapters) {
      const existingCount = await db.mCQ.count({ where: { chapterId: chapter.id } })
      if (existingCount === 0) {
        const genericMcqs = [
          { question: `${chapter.name} - নিচের কোনটি সঠিক?`, optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪', correctAnswer: 'A', explanation: 'এটি একটি উদাহরণ প্রশ্ন।', difficulty: 'medium', isPremium: false, board: 'dhaka' as string | null, year: '2024' as string | null },
          { question: `${chapter.name} সম্পর্কে কোনটি ভুল?`, optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪', correctAnswer: 'B', explanation: 'এটি একটি উদাহরণ প্রশ্ন।', difficulty: 'easy', isPremium: false, board: 'rajshahi' as string | null, year: '2023' as string | null },
        ]
        for (const mcq of genericMcqs) {
          const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
          if (!existing) {
            await db.mCQ.create({
              data: { ...mcq, chapterId: chapter.id, classLevel: 'ssc', subjectId: physicsSubject.id },
            })
          }
        }
      }
    }
  }

  // SSC Chemistry MCQs
  const chemistrySubject = sscClass ? await db.subject.findFirst({
    where: { slug: 'chemistry', classId: sscClass.id },
  }) : null

  if (chemistrySubject) {
    const chapters = await db.chapter.findMany({ where: { subjectId: chemistrySubject.id }, orderBy: { order: 'asc' } })
    for (const chapter of chapters) {
      const existingCount = await db.mCQ.count({ where: { chapterId: chapter.id } })
      if (existingCount === 0) {
        const mcqs = [
          { question: `${chapter.name} - নিচের কোনটি সঠিক?`, optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪', correctAnswer: 'A', explanation: 'উদাহরণ প্রশ্ন', difficulty: 'medium', isPremium: false, board: 'dhaka' as string | null, year: '2024' as string | null },
          { question: `${chapter.name} - কোনটি ভুল?`, optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪', correctAnswer: 'C', explanation: 'উদাহরণ প্রশ্ন', difficulty: 'easy', isPremium: false, board: 'rajshahi' as string | null, year: '2023' as string | null },
          { question: `${chapter.name} সম্পর্কে মূল ধারণা কোনটি?`, optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪', correctAnswer: 'B', explanation: 'উদাহরণ প্রশ্ন', difficulty: 'hard', isPremium: true, price: 10 },
        ]
        for (const mcq of mcqs) {
          const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
          if (!existing) {
            await db.mCQ.create({
              data: { ...mcq, chapterId: chapter.id, classLevel: 'ssc', subjectId: chemistrySubject.id },
            })
          }
        }
      }
    }
  }

  // SSC Math MCQs
  const mathSubject = sscClass ? await db.subject.findFirst({
    where: { slug: 'math', classId: sscClass.id },
  }) : null

  if (mathSubject) {
    const chapters = await db.chapter.findMany({ where: { subjectId: mathSubject.id }, orderBy: { order: 'asc' } })
    for (const chapter of chapters) {
      const existingCount = await db.mCQ.count({ where: { chapterId: chapter.id } })
      if (existingCount === 0) {
        const mcqs = [
          { question: `${chapter.name} - সঠিক উত্তর নির্বাচন করুন।`, optionA: '১', optionB: '২', optionC: '৩', optionD: '৪', correctAnswer: 'A', difficulty: 'medium', isPremium: false, explanation: 'উদাহরণ', board: 'dhaka' as string | null, year: '2024' as string | null },
          { question: `${chapter.name} - কোন সূত্রটি সঠিক?`, optionA: 'সূত্র ১', optionB: 'সূত্র ২', optionC: 'সূত্র ৩', optionD: 'সূত্র ৪', correctAnswer: 'B', difficulty: 'hard', isPremium: true, price: 10, explanation: 'উদাহরণ' },
        ]
        for (const mcq of mcqs) {
          const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
          if (!existing) {
            await db.mCQ.create({
              data: { ...mcq, chapterId: chapter.id, classLevel: 'ssc', subjectId: mathSubject.id },
            })
          }
        }
      }
    }
  }

  // HSC MCQs
  const hscClass = await db.classCategory.findUnique({ where: { slug: 'hsc' } })
  if (hscClass) {
    const hscSubjects = await db.subject.findMany({ where: { classId: hscClass.id } })
    for (const subject of hscSubjects) {
      const chapters = await db.chapter.findMany({ where: { subjectId: subject.id }, orderBy: { order: 'asc' } })
      for (const chapter of chapters) {
        const existingCount = await db.mCQ.count({ where: { chapterId: chapter.id } })
        if (existingCount === 0) {
          const mcq = {
            question: `${chapter.name} (${subject.name}) - সঠিক উত্তর নির্বাচন করুন।`,
            optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪',
            correctAnswer: 'A', difficulty: 'medium', isPremium: false, explanation: 'উদাহরণ প্রশ্ন',
            board: 'dhaka' as string | null, year: '2024' as string | null,
          }
          const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
          if (!existing) {
            await db.mCQ.create({
              data: { ...mcq, chapterId: chapter.id, classLevel: 'hsc', subjectId: subject.id },
            })
          }
        }
      }
    }
  }

  // MCQs for class-6, class-7, class-8
  const juniorClasses = ['class-6', 'class-7', 'class-8']
  for (const classSlug of juniorClasses) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!classCategory) continue

    const subjects = await db.subject.findMany({ where: { classId: classCategory.id } })
    for (const subject of subjects) {
      const chapters = await db.chapter.findMany({ where: { subjectId: subject.id }, orderBy: { order: 'asc' } })
      for (const chapter of chapters) {
        const existingCount = await db.mCQ.count({ where: { chapterId: chapter.id } })
        if (existingCount === 0) {
          const mcqs = [
            {
              question: `${chapter.name} (${subject.name}) - সঠিক উত্তর নির্বাচন করুন।`,
              optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪',
              correctAnswer: 'A', difficulty: 'easy', isPremium: false, explanation: `${classCategory.name} এর ${subject.name} বিষয়ের উদাহরণ প্রশ্ন`,
              board: 'dhaka' as string | null, year: '2024' as string | null,
            },
            {
              question: `${chapter.name} - কোনটি ভুল?`,
              optionA: 'বিকল্প ১', optionB: 'বিকল্প ২', optionC: 'বিকল্প ৩', optionD: 'বিকল্প ৪',
              correctAnswer: 'C', difficulty: 'medium', isPremium: false, explanation: `${classCategory.name} এর ${subject.name} বিষয়ের উদাহরণ প্রশ্ন`,
            },
          ]
          for (const mcq of mcqs) {
            const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
            if (!existing) {
              await db.mCQ.create({
                data: { ...mcq, chapterId: chapter.id, classLevel: classSlug, subjectId: subject.id },
              })
            }
          }
        }
      }
    }
  }

  console.log('✅ MCQs seeded')

  // ========== CQs ==========
  console.log('🌱 Seeding CQs...')

  // SSC Physics CQs
  const chapter1 = physicsSubject ? await db.chapter.findFirst({
    where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id },
  }) : null

  if (chapter1 && physicsSubject) {
    const sampleCQ = {
      uddeepok: 'একটি গাড়ি স্থির অবস্থা থেকে যাত্রা শুরু করে সমবেগে 20 m/s বেগে 10 সেকেন্ড চলে। এরপর গাড়িটি 5 সেকেন্ডে ব্রেক করে থেমে যায়।',
      question1: 'গাড়ির প্রাথমিক ত্বরণ কত?',
      question2: 'গাড়িটি মোট কত দূরত্ব অতিক্রম করে?',
      question3: 'ব্রেক করার সময় মন্দণ কত?',
      question4: 'গাড়ির বেগ-সময় লেখচিত্রটি অঙ্কন করো।',
      answer1: 'প্রাথমিক ত্বরণ, a = (v - u)/t = (20 - 0)/10 = 2 m/s²',
      answer2: 'মোট দূরত্ব = (½ × 20 × 10) + (½ × 20 × 5) = 100 + 50 = 150 m',
      answer3: 'মন্দণ, a = (0 - 20)/5 = -4 m/s²',
      answer4: 'বেগ-সময় লেখচিত্রে প্রথমে ধনাত্মক ঢালের সরলরেখা (0-10s), তারপর ঋণাত্মক ঢালের সরলরেখা (10-15s) হবে।',
      chapterId: chapter1.id,
      classLevel: 'ssc',
      subjectId: physicsSubject.id,
      difficulty: 'medium',
      isPremium: false,
      board: 'dhaka',
      year: '2024',
    }

    const existing = await db.cQ.findFirst({ where: { uddeepok: sampleCQ.uddeepok } })
    if (!existing) {
      await db.cQ.create({ data: sampleCQ })
    }
  }

  // SSC Physics chapter 2 (motion) CQ
  const chapter2 = physicsSubject ? await db.chapter.findFirst({
    where: { slug: 'motion', subjectId: physicsSubject.id },
  }) : null

  if (chapter2 && physicsSubject) {
    const cq = {
      uddeepok: 'একটি বল মাটি থেকে 20 m/s বেগে উপরের দিকে নিক্ষেপ করা হলো। (g = 10 m/s²)',
      question1: 'বলটি কত উচ্চতায় উঠবে?',
      question2: 'বলটি কত সময় পর মাটিতে ফিরে আসবে?',
      question3: 'সর্বোচ্চ উচ্চতায় বলটির বেগ কত?',
      question4: 'বলটির গতিপথের সর্বোচ্চ উচ্চতায় ত্বরণ কত?',
      answer1: 'h = v²/(2g) = 400/20 = 20 m',
      answer2: 'T = 2v/g = 40/10 = 4 s',
      answer3: 'সর্বোচ্চ উচ্চতায় বেগ = 0',
      answer4: 'ত্বরণ = g = 10 m/s² (নিচের দিকে)',
      chapterId: chapter2.id,
      classLevel: 'ssc',
      subjectId: physicsSubject.id,
      difficulty: 'medium',
      isPremium: true,
      price: 15,
      board: 'rajshahi',
      year: '2023',
    }
    const existing = await db.cQ.findFirst({ where: { uddeepok: cq.uddeepok } })
    if (!existing) {
      await db.cQ.create({ data: cq })
    }
  }

  // CQs for class-6, class-7, class-8, and HSC (at least 1 CQ per class level)
  const cqSeedData: Array<{
    classSlug: string
    subjectSlug: string
    chapterSlug: string
    uddeepok: string
    question1: string; question2: string; question3: string; question4: string
    answer1: string; answer2: string; answer3: string; answer4: string
    difficulty: string
    isPremium: boolean
    price?: number
  }> = [
    // Class 6 - Math
    {
      classSlug: 'class-6', subjectSlug: 'math', chapterSlug: 'natural-numbers',
      uddeepok: 'একটি সংখ্যারেখায় A বিন্দু 5 এ অবস্থিত এবং B বিন্দু 12 এ অবস্থিত।',
      question1: 'A ও B এর মধ্যবর্তী দূরত্ব কত?',
      question2: 'A ও B এর মধ্যবর্তী সংখ্যাগুলো কী কী?',
      question3: 'A ও B এর গসাগু কত?',
      question4: 'A ও B এর লসাগু কত?',
      answer1: 'দূরত্ব = 12 - 5 = 7',
      answer2: '6, 7, 8, 9, 10, 11',
      answer3: 'গসাগু(5, 12) = 1',
      answer4: 'লসাগু(5, 12) = 60',
      difficulty: 'easy', isPremium: false,
    },
    // Class 6 - Science
    {
      classSlug: 'class-6', subjectSlug: 'science', chapterSlug: 'matter-properties',
      uddeepok: 'একটি লোহার নির্দিষ্ট আয়তনের টুকরো ও একটি কাঠের টুকরো নেওয়া হলো।',
      question1: 'কোনটির ঘনত্ব বেশি?',
      question2: 'পানিতে কোনটি ডুবে যাবে?',
      question3: 'ভরের একক কী?',
      question4: 'ঘনত্বের সূত্র লেখো।',
      answer1: 'লোহার ঘনত্ব বেশি।',
      answer2: 'লোহার টুকরো পানিতে ডুবে যাবে।',
      answer3: 'ভরের SI একক কিলোগ্রাম (kg)।',
      answer4: 'ঘনত্ব = ভর/আয়তন',
      difficulty: 'easy', isPremium: false,
    },
    // Class 7 - Math
    {
      classSlug: 'class-7', subjectSlug: 'math', chapterSlug: 'integers',
      uddeepok: 'একটি তাপমাত্রা সকালে 5°C ছিল, দুপুরে 12°C বৃদ্ধি পেল এবং রাতে 8°C হ্রাস পেল।',
      question1: 'দুপুরে তাপমাত্রা কত ছিল?',
      question2: 'রাতে তাপমাত্রা কত হলো?',
      question3: 'দিনের সর্বোচ্চ ও সর্বনিম্ন তাপমাত্রার পার্থক্য কত?',
      question4: 'পূর্ণসংখ্যার যোগের নিয়ম ব্যাখ্যা করো।',
      answer1: 'দুপুরে তাপমাত্রা = 5 + 12 = 17°C',
      answer2: 'রাতে তাপমাত্রা = 17 - 8 = 9°C',
      answer3: 'পার্থক্য = 17 - 5 = 12°C',
      answer4: 'একই চিহ্নের পূর্ণসংখ্যা যোগে পরম মান যোগ হয় ও চিহ্ন অপরিবর্তিত থাকে।',
      difficulty: 'easy', isPremium: false,
    },
    // Class 7 - Science
    {
      classSlug: 'class-7', subjectSlug: 'science', chapterSlug: 'states-matter',
      uddeepok: 'বরফের একটি টুকরো 0°C তাপমাত্রায় উত্তপ্ত করা হলে তা পানিতে পরিণত হয়।',
      question1: 'এটি কোন ধরনের পরিবর্তন?',
      question2: 'বরফ গলার তাপমাত্রা কত?',
      question3: 'পানি বাষ্পে পরিণত হওয়ার প্রক্রিয়াকে কী বলে?',
      question4: 'উদ্বাষ্পীকরণ ও বাষ্পীভবনের পার্থক্য লেখো।',
      answer1: 'এটি অবস্থার পরিবর্তন (গলন)।',
      answer2: '0°C',
      answer3: 'বাষ্পীভবন।',
      answer4: 'উদ্বাষ্পীকরণ যেকোনো তাপমাত্রায় ঘটে, বাষ্পীভবন নির্দিষ্ট তাপমাত্রায় ঘটে।',
      difficulty: 'medium', isPremium: false,
    },
    // Class 8 - Math
    {
      classSlug: 'class-8', subjectSlug: 'math', chapterSlug: 'ratio-proportion',
      uddeepok: 'একটি ক্লাসে ছেলে ও মেয়ের অনুপাত 3:2। মোট শিক্ষার্থী 40 জন।',
      question1: 'ক্লাসে কতজন ছেলে আছে?',
      question2: 'ক্লাসে কতজন মেয়ে আছে?',
      question3: '5 জন ছেলে চলে গেলে নতুন অনুপাত কত?',
      question4: 'অনুপাত ও সমানুপাতের পার্থক্য লেখো।',
      answer1: 'ছেলে = (3/5) × 40 = 24 জন',
      answer2: 'মেয়ে = (2/5) × 40 = 16 জন',
      answer3: 'নতুন অনুপাত = 19:16',
      answer4: 'অনুপাত দুটি রাশির তুলনা, সমানুপাত দুটি সমান অনুপাতের সমতা।',
      difficulty: 'medium', isPremium: false,
    },
    // Class 8 - Science
    {
      classSlug: 'class-8', subjectSlug: 'science', chapterSlug: 'atomic-structure',
      uddeepok: 'একটি কার্বন পরমাণুর পারমাণবিক সংখ্যা 6 ও ভর সংখ্যা 12।',
      question1: 'কার্বন পরমাণুতে কয়টি প্রোটন আছে?',
      question2: 'কার্বন পরমাণুতে কয়টি নিউট্রন আছে?',
      question3: 'ইলেকট্রনের সংখ্যা কত?',
      question4: 'আইসোটোপ কী? উদাহরণ দাও।',
      answer1: 'প্রোটন = 6 টি',
      answer2: 'নিউট্রন = 12 - 6 = 6 টি',
      answer3: 'ইলেকট্রন = 6 টি',
      answer4: 'একই পারমাণবিক সংখ্যা কিন্তু ভিন্ন ভর সংখ্যার পরমাণুকে আইসোটোপ বলে। যেমন: C-12, C-14।',
      difficulty: 'medium', isPremium: false,
    },
    // HSC - Physics
    {
      classSlug: 'hsc', subjectSlug: 'physics', chapterSlug: 'physical-world',
      uddeepok: 'একটি বস্তু 5 m/s বেগে পূর্ব দিকে যাচ্ছে এবং অপর একটি বস্তু 3 m/s বেগে পশ্চিম দিকে যাচ্ছে।',
      question1: 'প্রথম বস্তুর সাপেক্ষে দ্বিতীয় বস্তুর বেগ কত?',
      question2: 'দুটি বস্তুর আপেক্ষিক বেগের ধারণা ব্যাখ্যা করো।',
      question3: 'আপেক্ষিক বেগের SI একক কী?',
      question4: 'একমাত্রিক গতিতে আপেক্ষিক বেগের সূত্র লেখো।',
      answer1: 'আপেক্ষিক বেগ = 5 - (-3) = 8 m/s',
      answer2: 'একটি বস্তুর সাপেক্ষে অপর বস্তুর অবস্থান পরিবর্তনের হারকে আপেক্ষিক বেগ বলে।',
      answer3: 'm/s',
      answer4: 'V_AB = V_A - V_B',
      difficulty: 'medium', isPremium: false,
    },
  ]

  for (const cqData of cqSeedData) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: cqData.classSlug } })
    if (!classCategory) continue

    const subject = await db.subject.findFirst({
      where: { slug: cqData.subjectSlug, classId: classCategory.id },
    })
    if (!subject) continue

    const chapter = await db.chapter.findFirst({
      where: { slug: cqData.chapterSlug, subjectId: subject.id },
    })
    if (!chapter) continue

    const existing = await db.cQ.findFirst({ where: { uddeepok: cqData.uddeepok } })
    if (!existing) {
      await db.cQ.create({
        data: {
          uddeepok: cqData.uddeepok,
          question1: cqData.question1,
          question2: cqData.question2,
          question3: cqData.question3,
          question4: cqData.question4,
          answer1: cqData.answer1,
          answer2: cqData.answer2,
          answer3: cqData.answer3,
          answer4: cqData.answer4,
          chapterId: chapter.id,
          classLevel: cqData.classSlug,
          subjectId: subject.id,
          difficulty: cqData.difficulty,
          isPremium: cqData.isPremium,
          price: cqData.price ?? 0,
        },
      })
    }
  }

  console.log('✅ CQs seeded')

  // ========== 1. LECTURES ==========
  console.log('🌱 Seeding lectures...')

  // Helper to slugify Bengali titles
  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')
  }

  // SSC Physics chapter 1 — detailed lecture with real content
  if (physicsSubject) {
    const sscPhysicsCh1 = await db.chapter.findFirst({
      where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id },
    })
    if (sscPhysicsCh1) {
      const detailedLectures = [
        {
          title: 'ভৌত জগত ও এর শাখাসমূহ',
          slug: 'physical-world-and-its-branches',
          content: `<h2>ভৌত জগত ও এর শাখাসমূহ</h2>
<p>পদার্থবিজ্ঞান প্রাকৃতিক বিজ্ঞানের একটি মৌলিক শাখা। এতে পদার্থ, শক্তি এবং এদের পারস্পরিক ক্রিয়ার অধ্যয়ন করা হয়।</p>
<h3>পদার্থবিজ্ঞানের প্রধান শাখাসমূহ:</h3>
<ul>
<li><strong>বলবিদ্যা (Mechanics):</strong> স্থির ও গতিশীল বস্তুর অধ্যয়ন</li>
<li><strong>তাপগতিবিদ্যা (Thermodynamics):</strong> তাপ ও শক্তির অধ্যয়ন</li>
<li><strong>আলোকবিজ্ঞান (Optics):</strong> আলোর ধর্ম ও আচরণ</li>
<li><strong>তড়িৎ ও চুম্বকবিদ্যা (Electromagnetism):</strong> তড়িৎ ও চুম্বকের অধ্যয়ন</li>
<li><strong>ধ্বনিবিজ্ঞান (Acoustics):</strong> শব্দের উৎপত্তি ও বিস্তার</li>
</ul>`,
          duration: 30, isPremium: false, price: 0, order: 1,
        },
        {
          title: 'পরিমাপ ও একক পদ্ধতি',
          slug: 'measurement-and-unit-system',
          content: `<h2>পরিমাপ ও একক পদ্ধতি</h2>
<p>ভৌত রাশির পরিমাপই পদার্থবিজ্ঞানের ভিত্তি। পরিমাপ ছাড়া বৈজ্ঞানিক অধ্যয়ন অসম্ভব।</p>
<h3>SI একক পদ্ধতি:</h3>
<ul>
<li>দৈর্ঘ্য → মিটার (m)</li>
<li>ভর → কিলোগ্রাম (kg)</li>
<li>সময় → সেকেন্ড (s)</li>
<li>তাপমাত্রা → কেলভিন (K)</li>
<li>বিদ্যুৎ প্রবাহ → অ্যামিয়ার (A)</li>
</ul>`,
          duration: 25, isPremium: false, price: 0, order: 2,
        },
        {
          title: 'মাত্রিক সমীকরণ ও পরিমাপে সংকট',
          slug: 'dimensional-equation-and-significant-figures',
          content: `<h2>মাত্রিক সমীকরণ ও পরিমাপে সংকট</h2><p>মাত্রিক সমীকরণ এবং তাৎপর্যপূর্ণ অঙ্ক সম্পর্কে আলোচনা।</p>`,
          duration: 20, isPremium: true, price: 25, order: 3,
        },
      ]
      for (const lec of detailedLectures) {
        const existing = await db.lecture.findFirst({ where: { slug: lec.slug, chapterId: sscPhysicsCh1.id } })
        if (!existing) {
          await db.lecture.create({
            data: { ...lec, chapterId: sscPhysicsCh1.id, isActive: true },
          })
        }
      }
    }
  }

  // 1 lecture per chapter across all classes/subjects (SSC Physics ch1 skipped - done above)
  const allClassSlugs = ['class-6', 'class-7', 'class-8', 'ssc', 'hsc']
  for (const classSlug of allClassSlugs) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!classCategory) continue

    const subjects = await db.subject.findMany({ where: { classId: classCategory.id }, orderBy: { order: 'asc' } })
    for (const subject of subjects) {
      const chapters = await db.chapter.findMany({ where: { subjectId: subject.id }, orderBy: { order: 'asc' } })

      for (const chapter of chapters) {
        // Skip SSC physics ch1 - already has detailed lectures
        if (classSlug === 'ssc' && subject.slug === 'physics' && chapter.slug === 'physical-world-measurement') continue

        const existingLectureCount = await db.lecture.count({ where: { chapterId: chapter.id } })
        if (existingLectureCount > 0) continue

        const lectureTitle = `ভূমিকা - ${chapter.name}`
        const lectureSlug = slugify(`intro-${chapter.slug}-${subject.slug}-${classSlug}`)

        const existingLecture = await db.lecture.findFirst({ where: { slug: lectureSlug, chapterId: chapter.id } })
        if (!existingLecture) {
          // Mark a few lectures as premium
          const isPremiumLecture = (classSlug === 'ssc' && subject.slug === 'chemistry' && chapter.order === 1)
            || (classSlug === 'hsc' && subject.slug === 'physics' && chapter.order === 2)
            || (classSlug === 'ssc' && subject.slug === 'higher-math' && chapter.order === 1)

          await db.lecture.create({
            data: {
              title: lectureTitle,
              slug: lectureSlug,
              chapterId: chapter.id,
              content: `<h2>${lectureTitle}</h2><p>এই লেকচারে ${chapter.name} সম্পর্কে বিস্তারিত আলোচনা করা হয়েছে। ${subject.name} বিষয়ের প্রাথমিক ধারণা তুলে ধরা হয়েছে।</p>`,
              duration: 20,
              order: 1,
              isPremium: isPremiumLecture,
              price: isPremiumLecture ? 30 : 0,
              isActive: true,
            },
          })
        }
      }
    }
  }
  console.log('✅ Lectures seeded')

  // ========== 2. RESOURCES ==========
  console.log('🌱 Seeding resources...')

  // 1 PDF resource per lecture
  const allLectures = await db.lecture.findMany({ select: { id: true } })
  for (const lecture of allLectures) {
    const existingRes = await db.resource.findFirst({ where: { lectureId: lecture.id, type: 'pdf' } })
    if (!existingRes) {
      await db.resource.create({
        data: {
          lectureId: lecture.id,
          title: 'লেকচার নোট (PDF)',
          type: 'pdf',
          url: '#',
          size: '2.5 MB',
          isActive: true,
        },
      })
    }
  }
  console.log('✅ Resources seeded')

  // ========== 3. CONTENT TYPES ==========
  console.log('🌱 Seeding content types...')

  const contentTypes = [
    { key: 'lecture', labelBn: 'লেকচার', labelEn: 'Lecture', icon: 'PlayCircle', color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', route: 'lecture-list', paramKey: 'chapterId', buttonLabel: 'লেকচার দেখুন', order: 1 },
    { key: 'mcq', labelBn: 'MCQ প্র্যাকটিস', labelEn: 'MCQ Practice', icon: 'CircleDot', color: 'bg-purple-500', lightColor: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', route: 'mcq-practice', paramKey: 'chapterId', buttonLabel: 'প্র্যাকটিস শুরু', order: 2 },
    { key: 'cq', labelBn: 'সৃজনশীল প্রশ্ন', labelEn: 'Creative Question', icon: 'FileText', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', route: 'cq-viewer', paramKey: 'cqId', buttonLabel: 'সৃজনশীল প্রশ্ন দেখুন', order: 3 },
    { key: 'board', labelBn: 'বোর্ড প্রশ্ন', labelEn: 'Board Questions', icon: 'GraduationCap', color: 'bg-blue-500', lightColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড প্রশ্ন দেখুন', order: 4 },
    { key: 'suggestion', labelBn: 'সাজেশন', labelEn: 'Suggestion', icon: 'Lightbulb', color: 'bg-yellow-500', lightColor: 'bg-yellow-50 dark:bg-yellow-950/30', textColor: 'text-yellow-600 dark:text-yellow-400', route: 'suggestions', paramKey: 'chapterId', buttonLabel: 'সাজেশন দেখুন', order: 5 },
    { key: 'exam', labelBn: 'পরীক্ষা', labelEn: 'Exam', icon: 'ClipboardCheck', color: 'bg-red-500', lightColor: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-600 dark:text-red-400', route: 'exam-center', paramKey: 'examId', buttonLabel: 'পরীক্ষা দিন', order: 6 },
    { key: 'bundle', labelBn: 'বান্ডেল', labelEn: 'Bundle', icon: 'Package', color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400', route: 'premium', paramKey: 'bundleId', buttonLabel: 'বান্ডেল কিনুন', order: 7 },
    { key: 'package', labelBn: 'প্যাকেজ', labelEn: 'Package', icon: 'Gift', color: 'bg-rose-500', lightColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', route: 'premium', paramKey: 'packageId', buttonLabel: 'প্যাকেজ কিনুন', order: 8 },
    { key: 'mcq-exam-package', labelBn: 'MCQ এক্সাম প্যাকেজ', labelEn: 'MCQ Exam Package', icon: 'ClipboardCheck', color: 'bg-sky-500', lightColor: 'bg-sky-50 dark:bg-sky-950/30', textColor: 'text-sky-600 dark:text-sky-400', route: 'mcq-exam-package-list', paramKey: '', buttonLabel: 'এক্সাম প্যাকেজ দেখুন', order: 9 },
    { key: 'board-mcq', labelBn: 'বোর্ড MCQ', labelEn: 'Board MCQ', icon: 'CircleDot', color: 'bg-indigo-500', lightColor: 'bg-indigo-50 dark:bg-indigo-950/30', textColor: 'text-indigo-600 dark:text-indigo-400', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড MCQ দেখুন', order: 10 },
    { key: 'board-cq', labelBn: 'বোর্ড সৃজনশীল প্রশ্ন', labelEn: 'Board Creative Question', icon: 'FileText', color: 'bg-pink-500', lightColor: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড সৃজনশীল প্রশ্ন দেখুন', order: 11 },
    { key: 'cq-exam-package', labelBn: 'CQ এক্সাম প্যাকেজ', labelEn: 'CQ Exam Package', icon: 'ClipboardCheck', color: 'bg-cyan-500', lightColor: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-600 dark:text-cyan-400', route: 'cq-exam-package-list', paramKey: '', buttonLabel: 'এক্সাম প্যাকেজ দেখুন', order: 12 },
  ]

  for (const ct of contentTypes) {
    await db.contentType.upsert({
      where: { key: ct.key },
      update: ct,
      create: ct,
    })
  }
  console.log('✅ Content types seeded')

  // ========== 4. BANNERS ==========
  console.log('🌱 Seeding banners...')

  const bannerData = [
    { title: 'এসএসসি ২০২৫ স্পেশাল অফার', subtitle: 'সকল বিষয়ের কন্টেন্ট একসাথে', link: '/premium', buttonText: 'এখনই দেখুন', isActive: true, order: 1 },
    { title: 'বিজ্ঞান বিভাগে ভর্তি চলছে', subtitle: 'পদার্থ, রসায়ন, জীববিজ্ঞান', link: '/classes/ssc', buttonText: 'বিস্তারিত', isActive: true, order: 2 },
  ]

  for (const banner of bannerData) {
    const existing = await db.banner.findFirst({ where: { title: banner.title } })
    if (!existing) {
      await db.banner.create({ data: banner })
    }
  }
  console.log('✅ Banners seeded')

  // ========== 5. FAQS ==========
  console.log('🌱 Seeding FAQs...')

  const faqData = [
    { question: 'শিক্ষা বাংলা কী?', answer: 'শিক্ষা বাংলা বাংলাদেশের শিক্ষার্থীদের জন্য একটি অনলাইন শিক্ষা প্ল্যাটফর্ম। এখানে ৬ষ্ঠ শ্রেণি থেকে এইচএসসি পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন, বোর্ড প্রশ্ন ও সাজেশন পাওয়া যায়।', order: 1 },
    { question: 'কিভাবে রেজিস্ট্রেশন করব?', answer: 'উপরের ডানপাশে রেজিস্ট্রেশন বাটনে ক্লিক করুন। আপনার নাম, ইমেইল ও পাসওয়ার্ড দিয়ে সহজেই একাউন্ট তৈরি করুন।', order: 2 },
    { question: 'প্রিমিয়াম কন্টেন্ট কিভাবে কিনব?', answer: 'যেকোনো প্রিমিয়াম কন্টেন্টে ক্লিক করলে পেমেন্ট অপশন পাবেন। বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করতে পারবেন।', order: 3 },
    { question: 'বিকাশে কিভাবে পেমেন্ট করব?', answer: 'বিকাশ পেমেন্ট নম্বর: 017XXXXXXXX। পেমেন্ট করার পর স্ক্রিনশট আপলোড করুন। অ্যাডমিন যাচাই করে কন্টেন্ট এক্সেস দিবেন।', order: 4 },
    { question: 'কি কি বিষয়ের কন্টেন্ট আছে?', answer: '৬ষ্ঠ শ্রেণি থেকে এইচএসসি পর্যন্ত সকল বিষয়ের কন্টেন্ট আছে। বাংলা, ইংরেজি, গণিত, পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, হিসাববিজ্ঞান ও ICT সহ সকল বিষয়।', order: 5 },
  ]

  for (const faq of faqData) {
    const existing = await db.fAQ.findFirst({ where: { question: faq.question } })
    if (!existing) {
      await db.fAQ.create({ data: { ...faq, isActive: true } })
    }
  }
  console.log('✅ FAQs seeded')

  // ========== 6. TESTIMONIALS ==========
  console.log('🌱 Seeding testimonials...')

  const testimonialData = [
    { name: 'রাফি আহমেদ', role: 'এসএসসি ২০২৪ ব্যাচ', content: 'শিক্ষা বাংলা থেকে পড়াশোনা করে আমি এসএসসিতে A+ পেয়েছি।', rating: 5, order: 1 },
    { name: 'নুসরাত জাহান', role: 'এইচএসসি ২০২৪ ব্যাচ', content: 'পদার্থবিজ্ঞানের MCQ প্র্যাকটিস অসাধারণ।', rating: 5, order: 2 },
    { name: 'তানভীর হাসান', role: '৮ম শ্রেণি', content: 'খুব সহজে সব বুঝতে পারি।', rating: 4, order: 3 },
  ]

  for (const t of testimonialData) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name, content: t.content } })
    if (!existing) {
      await db.testimonial.create({ data: { ...t, isActive: true } })
    }
  }
  console.log('✅ Testimonials seeded')

  // ========== 7. NOTICES ==========
  console.log('🌱 Seeding notices...')

  const noticeData = [
    { title: 'এসএসসি ২০২৫ মডেল টেস্ট', content: 'আগামী ১৫ তারিখে এসএসসি ২০২৫ মডেল টেস্ট অনুষ্ঠিত হবে।', type: 'text', isPinned: true, order: 1 },
    { title: 'নতুন অধ্যায় যোগ হয়েছে', content: 'এইচএসসি পদার্থবিজ্ঞানের নতুন অধ্যায় যোগ করা হয়েছে।', type: 'text', isPinned: false, order: 2 },
  ]

  for (const n of noticeData) {
    const existing = await db.notice.findFirst({ where: { title: n.title } })
    if (!existing) {
      await db.notice.create({ data: { ...n, isActive: true } })
    }
  }
  console.log('✅ Notices seeded')

  // ========== 8. SUGGESTIONS ==========
  console.log('🌱 Seeding suggestions...')

  // SSC Physics suggestion
  const sscPhysicsSubject = sscClass ? await db.subject.findFirst({
    where: { slug: 'physics', classId: sscClass.id },
  }) : null

  // SSC Physics chapters for suggestions
  const sscPhysicsCh1 = sscPhysicsSubject ? await db.chapter.findFirst({
    where: { slug: 'physical-world-measurement', subjectId: sscPhysicsSubject.id },
  }) : null
  const sscPhysicsCh2 = sscPhysicsSubject ? await db.chapter.findFirst({
    where: { slug: 'motion', subjectId: sscPhysicsSubject.id },
  }) : null
  const sscPhysicsCh3 = sscPhysicsSubject ? await db.chapter.findFirst({
    where: { slug: 'force', subjectId: sscPhysicsSubject.id },
  }) : null

  if (sscClass && sscPhysicsSubject) {
    const existing = await db.suggestion.findFirst({ where: { slug: 'ssc-physics-suggestion-2025' } })
    if (!existing) {
      await db.suggestion.create({
        data: {
          title: 'এসএসসি পদার্থবিজ্ঞান সাজেশন ২০২৫',
          slug: 'ssc-physics-suggestion-2025',
          content: '<h2>সাজেশন</h2><p>গুরুত্বপূর্ণ অধ্যায়সমূহ...</p>',
          classId: sscClass.id,
          subjectId: sscPhysicsSubject.id,
          chapterId: sscPhysicsCh1?.id || null,
          isPremium: true,
          price: 30,
          order: 1,
          isActive: true,
        },
      })
    }
  }

  // HSC Physics suggestion
  const hscPhysicsSubject = hscClass ? await db.subject.findFirst({
    where: { slug: 'physics', classId: hscClass.id },
  }) : null

  const hscPhysicsCh1 = hscPhysicsSubject ? await db.chapter.findFirst({
    where: { slug: 'physical-world', subjectId: hscPhysicsSubject.id },
  }) : null

  if (hscClass && hscPhysicsSubject) {
    const existing = await db.suggestion.findFirst({ where: { slug: 'hsc-physics-suggestion-2025' } })
    if (!existing) {
      await db.suggestion.create({
        data: {
          title: 'এইচএসসি পদার্থবিজ্ঞান সাজেশন ২০২৫',
          slug: 'hsc-physics-suggestion-2025',
          content: '<h2>সাজেশন</h2><p>গুরুত্বপূর্ণ অধ্যায়সমূহ...</p>',
          classId: hscClass.id,
          subjectId: hscPhysicsSubject.id,
          chapterId: hscPhysicsCh1?.id || null,
          isPremium: true,
          price: 40,
          order: 2,
          isActive: true,
        },
      })
    }
  }

  // Additional per-chapter suggestions (free ones for better coverage)
  const chapterSuggestionSeeds: Array<{ classSlug: string; subjectSlug: string; chapterSlug: string; title: string; slug: string; content: string; isPremium: boolean; price: number }> = [
    { classSlug: 'ssc', subjectSlug: 'physics', chapterSlug: 'motion', title: 'গতি অধ্যায় - সাজেশন', slug: 'ssc-physics-motion-suggestion', content: '<h2>গতি সাজেশন</h2><p>গতি অধ্যায়ের গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: false, price: 0 },
    { classSlug: 'ssc', subjectSlug: 'physics', chapterSlug: 'force', title: 'বল অধ্যায় - সাজেশন', slug: 'ssc-physics-force-suggestion', content: '<h2>বল সাজেশন</h2><p>বল অধ্যায়ের গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: false, price: 0 },
    { classSlug: 'ssc', subjectSlug: 'chemistry', chapterSlug: 'intro-chemistry', title: 'রসায়নের ভূমিকা - সাজেশন', slug: 'ssc-chemistry-intro-suggestion', content: '<h2>রসায়ন সাজেশন</h2><p>গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: false, price: 0 },
    { classSlug: 'hsc', subjectSlug: 'physics', chapterSlug: 'vectors', title: 'ভেক্টর অধ্যায় - সাজেশন', slug: 'hsc-physics-vectors-suggestion', content: '<h2>ভেক্টর সাজেশন</h2><p>গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: true, price: 25 },
    { classSlug: 'class-8', subjectSlug: 'math', chapterSlug: 'ratio-proportion', title: 'অনুপাত ও সমানুপাত - সাজেশন', slug: 'class8-math-ratio-suggestion', content: '<h2>অনুপাত সাজেশন</h2><p>গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: false, price: 0 },
    { classSlug: 'class-6', subjectSlug: 'math', chapterSlug: 'natural-numbers', title: 'প্রাকৃতিক সংখ্যা - সাজেশন', slug: 'class6-math-natural-suggestion', content: '<h2>সংখ্যা সাজেশন</h2><p>গুরুত্বপূর্ণ প্রশ্ন...</p>', isPremium: false, price: 0 },
  ]

  for (const sug of chapterSuggestionSeeds) {
    const classCategory = await db.classCategory.findUnique({ where: { slug: sug.classSlug } })
    if (!classCategory) continue
    const subject = await db.subject.findFirst({ where: { slug: sug.subjectSlug, classId: classCategory.id } })
    if (!subject) continue
    const chapter = await db.chapter.findFirst({ where: { slug: sug.chapterSlug, subjectId: subject.id } })
    if (!chapter) continue

    const existing = await db.suggestion.findFirst({ where: { slug: sug.slug } })
    if (!existing) {
      await db.suggestion.create({
        data: {
          title: sug.title,
          slug: sug.slug,
          content: sug.content,
          classId: classCategory.id,
          subjectId: subject.id,
          chapterId: chapter.id,
          isPremium: sug.isPremium,
          price: sug.price,
          order: 3,
          isActive: true,
        },
      })
    }
  }
  console.log('✅ Suggestions seeded')

  // ========== 9. CONTENT BUNDLES + ITEMS ==========
  console.log('🌱 Seeding content bundles...')

  let sscPhysicsBundleId: string | undefined

  const existingBundle = await db.contentBundle.findFirst({ where: { slug: 'ssc-physics-complete-bundle' } })
  if (!existingBundle) {
    const bundle = await db.contentBundle.create({
      data: {
        title: 'এসএসসি পদার্থবিজ্ঞান সম্পূর্ণ বান্ডেল',
        slug: 'ssc-physics-complete-bundle',
        description: 'সকল অধ্যায়ের MCQ, CQ ও লেকচার',
        price: 199,
        originalPrice: 350,
        classLevel: 'ssc',
        type: 'mixed',
        isActive: true,
        order: 1,
      },
    })
    sscPhysicsBundleId = bundle.id
  } else {
    sscPhysicsBundleId = existingBundle.id
  }

  // Add items to the bundle
  if (sscPhysicsBundleId && sscPhysicsSubject) {
    const sscPhysicsMcqs = await db.mCQ.findMany({
      where: { subjectId: sscPhysicsSubject.id, classLevel: 'ssc' },
      take: 5,
    })
    const sscPhysicsCqs = await db.cQ.findMany({
      where: { subjectId: sscPhysicsSubject.id, classLevel: 'ssc' },
      take: 2,
    })

    let itemOrder = 1
    for (const mcq of sscPhysicsMcqs) {
      const existingItem = await db.bundleItem.findFirst({
        where: { bundleId: sscPhysicsBundleId, contentType: 'mcq', contentId: mcq.id },
      })
      if (!existingItem) {
        await db.bundleItem.create({
          data: { bundleId: sscPhysicsBundleId, contentType: 'mcq', contentId: mcq.id, order: itemOrder++ },
        })
      }
    }
    for (const cq of sscPhysicsCqs) {
      const existingItem = await db.bundleItem.findFirst({
        where: { bundleId: sscPhysicsBundleId, contentType: 'cq', contentId: cq.id },
      })
      if (!existingItem) {
        await db.bundleItem.create({
          data: { bundleId: sscPhysicsBundleId, contentType: 'cq', contentId: cq.id, order: itemOrder++ },
        })
      }
    }
  }
  console.log('✅ Content bundles seeded')

  // ========== 10. CONTENT PACKAGES ==========
  console.log('🌱 Seeding content packages...')

  const packageData = [
    { title: 'মাসিক প্যাকেজ', slug: 'monthly-package', description: '১ মাসের জন্য সকল কন্টেন্ট অ্যাক্সেস', price: 99, originalPrice: 199, duration: 30, durationLabel: '৩০ দিন', order: 1 },
    { title: 'বার্ষিক প্যাকেজ', slug: 'annual-package', description: '১ বছরের জন্য সকল কন্টেন্ট অ্যাক্সেস', price: 499, originalPrice: 1188, duration: 365, durationLabel: '১ বছর', order: 2 },
  ]

  for (const pkg of packageData) {
    const existing = await db.contentPackage.findFirst({ where: { slug: pkg.slug } })
    if (!existing) {
      await db.contentPackage.create({ data: { ...pkg, isActive: true } })
    }
  }
  console.log('✅ Content packages seeded')

  // ========== 11. MCQ EXAM PACKAGES + EXAM SETS ==========
  console.log('🌱 Seeding MCQ exam packages...')

  if (sscClass && sscPhysicsSubject) {
    const existingPkg = await db.mCQExamPackage.findFirst({
      where: { title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট' },
    })

    let examPackageId: string | undefined
    if (!existingPkg) {
      const examPkg = await db.mCQExamPackage.create({
        data: {
          title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট',
          description: 'এসএসসি পদার্থবিজ্ঞানের সম্পূর্ণ মডেল টেস্ট',
          classId: sscClass.id,
          price: 49,
          originalPrice: 99,
          totalSets: 2,
          status: 'published',
          isActive: true,
          order: 1,
        },
      })
      examPackageId = examPkg.id
    } else {
      examPackageId = existingPkg.id
    }

    // Create 2 exam sets
    if (examPackageId) {
      const sscPhysicsMcqs = await db.mCQ.findMany({
        where: { subjectId: sscPhysicsSubject.id, classLevel: 'ssc' },
        take: 10,
      })

      for (let setNum = 1; setNum <= 2; setNum++) {
        const setTitle = `সেট ${setNum}`
        const existingSet = await db.mCQExamSet.findFirst({
          where: { packageId: examPackageId, title: setTitle },
        })

        let setId: string | undefined
        if (!existingSet) {
          const examSet = await db.mCQExamSet.create({
            data: {
              packageId: examPackageId,
              title: setTitle,
              scheduledDate: new Date('2025-03-15'),
              startTime: '10:00',
              endTime: '23:59',
              duration: 30,
              marksPerQ: 1,
              totalMarks: 5,
              totalQuestions: 5,
              status: 'published',
              order: setNum,
            },
          })
          setId = examSet.id
        } else {
          setId = existingSet.id
        }

        // Add questions to set
        if (setId && sscPhysicsMcqs.length >= 5) {
          const setMcqs = sscPhysicsMcqs.slice((setNum - 1) * 5, setNum * 5)
          for (let q = 0; q < setMcqs.length; q++) {
            const existingQ = await db.mCQExamSetQuestion.findFirst({
              where: { setId, mcqId: setMcqs[q].id },
            })
            if (!existingQ) {
              await db.mCQExamSetQuestion.create({
                data: { setId, mcqId: setMcqs[q].id, marks: 1, order: q + 1 },
              })
            }
          }
        }
      }
    }
  }
  console.log('✅ MCQ exam packages seeded')

  // ========== 12. BOARD MCQs ==========
  console.log('🌱 Seeding board MCQs...')

  if (physicsSubject) {
    const boardMcqs = [
      { question: 'ঢাকা বোর্ড ২০২৪: দৈর্ঘ্যের SI একক কোনটি?', optionA: 'ফুট', optionB: 'মিটার', optionC: 'সেন্টিমিটার', optionD: 'ইঞ্চি', correctAnswer: 'B', explanation: 'SI একক অনুযায়ী দৈর্ঘ্যের একক মিটার।', difficulty: 'easy', isPremium: false },
      { question: 'ঢাকা বোর্ড ২০২৪: নিচের কোনটি স্কেলার রাশি?', optionA: 'বেগ', optionB: 'বল', optionC: 'ভর', optionD: 'ত্বরণ', correctAnswer: 'C', explanation: 'ভরের কেবল মান আছে, দিক নেই।', difficulty: 'easy', isPremium: false },
      { question: 'ঢাকা বোর্ড ২০২৪: সমবেগে চলমান বস্তুর ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '0', optionC: 'অসীম', optionD: 'ঋণাত্মক', correctAnswer: 'B', explanation: 'সমবেগে বেগ পরিবর্তন না হওয়ায় ত্বরণ = 0', difficulty: 'medium', isPremium: false },
      { question: 'ঢাকা বোর্ড ২০২৪: কাজের মাত্রিক সংকেত কোনটি?', optionA: 'MLT⁻²', optionB: 'ML²T⁻²', optionC: 'MLT⁻¹', optionD: 'ML²T⁻³', correctAnswer: 'B', explanation: 'কাজ = বল × সরণ, মাত্রিক সংকেত = ML²T⁻²', difficulty: 'hard', isPremium: false },
      { question: 'ঢাকা বোর্ড ২০২৪: নিউটনের দ্বিতীয় সূত্র কোনটি?', optionA: 'F = ma', optionB: 'E = mc²', optionC: 'F = mv', optionD: 'W = Fd', correctAnswer: 'A', explanation: 'নিউটনের দ্বিতীয় সূত্রানুসারে বল = ভর × ত্বরণ', difficulty: 'easy', isPremium: false },
    ]

    // Add board MCQs for Rajshahi board 2023
    const rajshahiBoardMcqs = [
      { question: 'রাজশাহী বোর্ড ২০২৩: ভেক্টর রাশি কোনটি?', optionA: 'ভর', optionB: 'তাপমাত্রা', optionC: 'বেগ', optionD: 'সময়', correctAnswer: 'C', explanation: 'বেগের মান ও দিক উভয়ই আছে।', difficulty: 'easy', isPremium: false },
      { question: 'রাজশাহী বোর্ড ২০২৩: 1 আলোকবর্ষ কত মিটার?', optionA: '9.46 × 10¹⁵ m', optionB: '3 × 10⁸ m', optionC: '1.5 × 10¹¹ m', optionD: '3.08 × 10¹⁶ m', correctAnswer: 'A', explanation: '1 আলোকবর্ষ = আলোর বেগ × 1 বছর', difficulty: 'medium', isPremium: false },
      { question: 'রাজশাহী বোর্ড ২০২৩: ঘর্ষণ বল কোন দিকে ক্রিয়া করে?', optionA: 'গতির দিকে', optionB: 'গতির বিপরীত দিকে', optionC: 'উল্লম্ব দিকে', optionD: 'যেকোনো দিকে', correctAnswer: 'B', explanation: 'ঘর্ষণ বল সর্বদা গতির বিপরীত দিকে ক্রিয়া করে।', difficulty: 'easy', isPremium: false },
    ]

    // Add board MCQs for Chittagong board 2022
    const chittagongBoardMcqs = [
      { question: 'চট্টগ্রাম বোর্ড ২০২২: মুক্তভাবে পতনশীল বস্তুর ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '10.8 m/s²', optionC: '8.9 m/s²', optionD: '11.2 m/s²', correctAnswer: 'A', explanation: 'মুক্তভাবে পতনশীল বস্তুর ত্বরণ g = 9.8 m/s²', difficulty: 'easy', isPremium: false },
      { question: 'চট্টগ্রাম বোর্ড ২০২২: বলের SI একক কোনটি?', optionA: 'ডাইন', optionB: 'কিলোগ্রাম-বল', optionC: 'পাউন্ড-বল', optionD: 'নিউটন', correctAnswer: 'D', explanation: 'বলের SI একক নিউটন (N)।', difficulty: 'easy', isPremium: false },
    ]

    const sscPhysicsCh1 = await db.chapter.findFirst({
      where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id },
    })
    if (sscPhysicsCh1) {
      for (const mcq of boardMcqs) {
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
        if (!existing) {
          await db.mCQ.create({
            data: {
              ...mcq,
              chapterId: sscPhysicsCh1.id,
              classLevel: 'ssc',
              subjectId: physicsSubject.id,
              board: 'dhaka',
              year: '2024',
            },
          })
        }
      }
      for (const mcq of rajshahiBoardMcqs) {
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
        if (!existing) {
          await db.mCQ.create({
            data: {
              ...mcq,
              chapterId: sscPhysicsCh1.id,
              classLevel: 'ssc',
              subjectId: physicsSubject.id,
              board: 'rajshahi',
              year: '2023',
            },
          })
        }
      }
      for (const mcq of chittagongBoardMcqs) {
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
        if (!existing) {
          await db.mCQ.create({
            data: {
              ...mcq,
              chapterId: sscPhysicsCh1.id,
              classLevel: 'ssc',
              subjectId: physicsSubject.id,
              board: 'chittagong',
              year: '2022',
            },
          })
        }
      }
    }
  }
  console.log('✅ Board MCQs seeded')

  // ========== 13. EXAMS ==========
  console.log('🌱 Seeding exams...')

  let sscExamId: string | undefined
  if (sscPhysicsSubject) {
    const existingExam = await db.exam.findFirst({
      where: { title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট ১' },
    })
    if (!existingExam) {
      const exam = await db.exam.create({
        data: {
          title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট ১',
          classLevel: 'ssc',
          subjectId: sscPhysicsSubject.id,
          type: 'mcq',
          duration: 30,
          totalMarks: 25,
          marksPerMcq: 1,
          status: 'published',
          isActive: true,
        },
      })
      sscExamId = exam.id
    } else {
      sscExamId = existingExam.id
    }

    // Add questions to the exam
    if (sscExamId) {
      const examMcqs = await db.mCQ.findMany({
        where: { subjectId: sscPhysicsSubject.id, classLevel: 'ssc' },
        take: 25,
      })
      for (let i = 0; i < examMcqs.length; i++) {
        const existingQ = await db.examQuestion.findFirst({
          where: { examId: sscExamId, questionType: 'mcq', questionId: examMcqs[i].id },
        })
        if (!existingQ) {
          await db.examQuestion.create({
            data: { examId: sscExamId, questionType: 'mcq', questionId: examMcqs[i].id, order: i + 1, marks: 1 },
          })
        }
      }
    }
  }
  console.log('✅ Exams seeded')

  // ========== 14. FEATURED CONTENT ==========
  console.log('🌱 Seeding featured content...')

  let featuredOrder = 1

  // 2 featured lectures (from SSC Physics)
  if (physicsSubject) {
    const sscPhysicsLectures = await db.lecture.findMany({
      where: { chapter: { subjectId: physicsSubject.id } },
      take: 2,
    })
    for (const lec of sscPhysicsLectures) {
      const existing = await db.featuredContent.findFirst({
        where: { section: 'homepage', contentType: 'lecture', contentId: lec.id },
      })
      if (!existing) {
        await db.featuredContent.create({
          data: { contentType: 'lecture', contentId: lec.id, section: 'homepage', isActive: true, order: featuredOrder++ },
        })
      }
    }

    // 1 featured MCQ
    const sscMcq = await db.mCQ.findFirst({
      where: { subjectId: physicsSubject.id, classLevel: 'ssc' },
    })
    if (sscMcq) {
      const existing = await db.featuredContent.findFirst({
        where: { section: 'homepage', contentType: 'mcq', contentId: sscMcq.id },
      })
      if (!existing) {
        await db.featuredContent.create({
          data: { contentType: 'mcq', contentId: sscMcq.id, section: 'homepage', isActive: true, order: featuredOrder++ },
        })
      }
    }

    // 1 featured CQ
    const sscCq = await db.cQ.findFirst({
      where: { subjectId: physicsSubject.id, classLevel: 'ssc' },
    })
    if (sscCq) {
      const existing = await db.featuredContent.findFirst({
        where: { section: 'homepage', contentType: 'cq', contentId: sscCq.id },
      })
      if (!existing) {
        await db.featuredContent.create({
          data: { contentType: 'cq', contentId: sscCq.id, section: 'homepage', isActive: true, order: featuredOrder++ },
        })
      }
    }
  }

  // 1 featured bundle
  if (sscPhysicsBundleId) {
    const existing = await db.featuredContent.findFirst({
      where: { section: 'homepage', contentType: 'bundle', contentId: sscPhysicsBundleId },
    })
    if (!existing) {
      await db.featuredContent.create({
        data: { contentType: 'bundle', contentId: sscPhysicsBundleId, section: 'homepage', isActive: true, order: featuredOrder++ },
      })
    }
  }

  // 1 featured package
  const monthlyPackage = await db.contentPackage.findFirst({ where: { slug: 'monthly-package' } })
  if (monthlyPackage) {
    const existing = await db.featuredContent.findFirst({
      where: { section: 'homepage', contentType: 'package', contentId: monthlyPackage.id },
    })
    if (!existing) {
      await db.featuredContent.create({
        data: { contentType: 'package', contentId: monthlyPackage.id, section: 'homepage', isActive: true, order: featuredOrder++ },
      })
    }
  }

  // 1 featured suggestion
  const sscSuggestion = await db.suggestion.findFirst({ where: { slug: 'ssc-physics-suggestion-2025' } })
  if (sscSuggestion) {
    const existing = await db.featuredContent.findFirst({
      where: { section: 'homepage', contentType: 'suggestion', contentId: sscSuggestion.id },
    })
    if (!existing) {
      await db.featuredContent.create({
        data: { contentType: 'suggestion', contentId: sscSuggestion.id, section: 'homepage', isActive: true, order: featuredOrder++ },
      })
    }
  }

  // 1 featured exam
  if (sscExamId) {
    const existing = await db.featuredContent.findFirst({
      where: { section: 'homepage', contentType: 'exam', contentId: sscExamId },
    })
    if (!existing) {
      await db.featuredContent.create({
        data: { contentType: 'exam', contentId: sscExamId, section: 'homepage', isActive: true, order: featuredOrder++ },
      })
    }
  }
  console.log('✅ Featured content seeded')

  // ========== 15. SITE SETTINGS ==========
  console.log('🌱 Seeding site settings...')

  const siteSettings = [
    // General
    { key: 'site_name', value: 'শিক্ষা বাংলা', group: 'general', label: 'সাইট নাম' },
    { key: 'site_description', value: 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম', group: 'general', label: 'সাইট বিবরণ' },
    // Payment
    { key: 'default_bkash_number', value: '01712345678', group: 'payment', label: 'বিকাশ নম্বর' },
    { key: 'default_nagad_number', value: '01812345678', group: 'payment', label: 'নগদ নম্বর' },
    { key: 'default_rocket_number', value: '01912345678', group: 'payment', label: 'রকেট নম্বর' },
    // SEO
    { key: 'seo_title', value: 'শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম', group: 'seo', label: 'সাইট শিরোনাম (SEO Title)' },
    { key: 'seo_description', value: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।', group: 'seo', label: 'সাইট বিবরণ (SEO Description)' },
    { key: 'seo_keywords', value: 'শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ', group: 'seo', label: 'কীওয়ার্ড (SEO Keywords)' },
    { key: 'seo_author', value: 'শিক্ষা বাংলা', group: 'seo', label: 'লেখক (SEO Author)' },
    // Homepage section titles/subtitles
    { key: 'homepage_hero_badge', value: 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম', group: 'homepage', label: 'হিরো ব্যাজ' },
    { key: 'homepage_hero_title', value: 'বাংলাদেশের সেরা', group: 'homepage', label: 'হিরো শিরোনাম' },
    { key: 'homepage_hero_subtitle', value: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন', group: 'homepage', label: 'হিরো উপশিরোনাম' },
    { key: 'homepage_classes_badge', value: 'শিক্ষা যাত্রা', group: 'homepage', label: 'শ্রেণি সেকশন ব্যাজ' },
    { key: 'homepage_classes_title', value: 'আপনার ক্লাস বেছে নিন', group: 'homepage', label: 'শ্রেণি সেকশন শিরোনাম' },
    { key: 'homepage_classes_subtitle', value: 'আপনার শ্রেণি অনুযায়ী সকল বিষয় ও কন্টেন্ট দেখুন', group: 'homepage', label: 'শ্রেণি সেকশন উপশিরোনাম' },
    { key: 'homepage_board_title', value: 'বোর্ড প্রশ্ন সমাধান', group: 'homepage', label: 'বোর্ড প্রশ্ন সেকশন শিরোনাম' },
    { key: 'homepage_board_subtitle', value: 'সকল বোর্ডের বিগত বছরের প্রশ্ন ও সমাধান অনুশীলন করুন', group: 'homepage', label: 'বোর্ড প্রশ্ন সেকশন উপশিরোনাম' },
    { key: 'homepage_mcq_title', value: 'MCQ প্র্যাকটিস', group: 'homepage', label: 'MCQ সেকশন শিরোনাম' },
    { key: 'homepage_mcq_subtitle', value: 'সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন', group: 'homepage', label: 'MCQ সেকশন উপশিরোনাম' },
    { key: 'homepage_faq_title', value: 'সচরাচর জিজ্ঞাসা', group: 'homepage', label: 'FAQ সেকশন শিরোনাম' },
    { key: 'homepage_faq_subtitle', value: 'আপনার প্রশ্নের উত্তর এখানে', group: 'homepage', label: 'FAQ সেকশন উপশিরোনাম' },
    { key: 'homepage_testimonials_title', value: 'শিক্ষার্থীরা যা বলেন', group: 'homepage', label: 'টেস্টিমোনিয়াল সেকশন শিরোনাম' },
    { key: 'homepage_testimonials_subtitle', value: 'আমাদের প্ল্যাটফর্ম ব্যবহারকারী শিক্ষার্থীদের মতামত', group: 'homepage', label: 'টেস্টিমোনিয়াল সেকশন উপশিরোনাম' },
    { key: 'homepage_stats_title', value: 'আমাদের অর্জন', group: 'homepage', label: 'পরিসংখ্যান সেকশন শিরোনাম' },
    { key: 'homepage_stats_subtitle', value: 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি', group: 'homepage', label: 'পরিসংখ্যান সেকশন উপশিরোনাম' },
    { key: 'homepage_featured_title', value: 'ফিচার্ড কন্টেন্ট', group: 'homepage', label: 'ফিচার্ড সেকশন শিরোনাম' },
    { key: 'homepage_featured_subtitle', value: 'আমাদের সেরা কন্টেন্টসমূহ', group: 'homepage', label: 'ফিচার্ড সেকশন উপশিরোনাম' },
    { key: 'homepage_premium_title', value: 'প্রিমিয়াম কন্টেন্ট', group: 'homepage', label: 'প্রিমিয়াম ব্যানার শিরোনাম' },
    { key: 'homepage_premium_subtitle', value: 'প্রতিটি কন্টেন্ট আলাদাভাবে কিনুন অথবা বান্ডেলে আকর্ষণীয় ছাড়ে পান!', group: 'homepage', label: 'প্রিমিয়াম ব্যানার উপশিরোনাম' },
    // Messages (admin-controllable empty state messages)
    { key: 'msg_contentComingSoon', value: 'কন্টেন্ট শীঘ্রই আসবে', group: 'messages', label: 'কন্টেন্ট শীঘ্রই আসবে' },
    { key: 'msg_chaptersComingSoon', value: 'এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে', group: 'messages', label: 'অধ্যায় শীঘ্রই আসবে' },
    { key: 'msg_chapterContentSoon', value: 'এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে', group: 'messages', label: 'অধ্যায় কন্টেন্ট শীঘ্রই আসবে' },
    { key: 'msg_mcqComingSoon', value: 'শীঘ্রই নতুন প্রশ্ন যোগ করা হবে', group: 'messages', label: 'MCQ শীঘ্রই আসবে' },
    { key: 'msg_cqComingSoon', value: 'শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে', group: 'messages', label: 'সৃজনশীল প্রশ্ন শীঘ্রই আসবে' },
    { key: 'msg_lectureComingSoon', value: 'শীঘ্রই নতুন লেকচার যোগ করা হবে', group: 'messages', label: 'লেকচার শীঘ্রই আসবে' },
    { key: 'msg_boardComingSoon', value: 'শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে', group: 'messages', label: 'বোর্ড প্রশ্ন শীঘ্রই আসবে' },
    { key: 'msg_contentLoadError', value: 'কন্টেন্ট লোড করতে সমস্যা হয়েছে', group: 'messages', label: 'কন্টেন্ট লোড ত্রুটি' },
    { key: 'msg_contentTypeSoon', value: 'শীঘ্রই কন্টেন্ট আসবে', group: 'messages', label: 'কন্টেন্ট টাইপ শীঘ্রই আসবে' },
    { key: 'msg_noQuestionsFound', value: 'কোনো প্রশ্ন পাওয়া যায়নি', group: 'messages', label: 'প্রশ্ন পাওয়া যায়নি' },
    { key: 'msg_footerClassesSoon', value: 'শীঘ্রই শ্রেণি যোগ করা হবে', group: 'messages', label: 'ফুটার শ্রেণি শীঘ্রই আসবে' },
    { key: 'msg_footerContactSoon', value: 'শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে', group: 'messages', label: 'ফুটার যোগাযোগ শীঘ্রই আসবে' },
    { key: 'msg_subjectsComingSoon', value: 'এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে', group: 'messages', label: 'বিষয় শীঘ্রই আসবে' },
  ]

  for (const setting of siteSettings) {
    const existing = await db.siteSetting.findUnique({ where: { key: setting.key } })
    if (!existing) {
      await db.siteSetting.create({ data: setting })
    } else {
      // Update group/label if missing
      if (!existing.group || !existing.label) {
        await db.siteSetting.update({
          where: { key: setting.key },
          data: {
            group: existing.group || setting.group,
            label: existing.label || setting.label,
          },
        })
      }
    }
  }
  console.log('✅ Site settings seeded')

  // ========== NAVIGATION ==========
  console.log('🌱 Seeding navigation items...')

  const navigationItems = [
    // Header navigation
    { label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 5, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 6, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 7, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 8, isAuthOnly: false, isAdminOnly: true, isActive: true },

    // Bottom navigation (mobile)
    { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true, isAdminOnly: false, isActive: true },

    // Footer navigation
    { label: 'হোম', route: 'home', icon: 'Home', location: 'footer', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true },
    { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true },
  ]

  for (const navItem of navigationItems) {
    const existing = await db.navigation.findFirst({
      where: { route: navItem.route, location: navItem.location },
    })
    if (!existing) {
      await db.navigation.create({ data: navItem })
    } else {
      await db.navigation.update({
        where: { id: existing.id },
        data: navItem,
      })
    }
  }
  console.log('✅ Navigation items seeded')

  console.log('\n🎉 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
