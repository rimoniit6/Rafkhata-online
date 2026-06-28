import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

// ────────────────────────────────────────────────────────────────────────────
//  PART 1 — Users & Educational Hierarchy (from seed.ts)
// ────────────────────────────────────────────────────────────────────────────

async function seed() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@localhost'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!'
  const existingAdmin = await db.user.findUnique({ where: { email: superAdminEmail } })
  const hashedPassword = hashPassword(superAdminPassword)
  if (!existingAdmin) {
    await db.user.create({ data: { email: superAdminEmail, name: 'Super Admin', password: hashedPassword, role: 'SUPER_ADMIN', isVerified: true, isPremium: true } })
    console.log(`✅ Super Admin created (${superAdminEmail})`)
  } else {
    await db.user.update({ where: { id: existingAdmin.id }, data: { role: 'SUPER_ADMIN', password: hashedPassword, isVerified: true } })
    console.log(`✅ Super Admin synced (${superAdminEmail})`)
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'moderator@shikhabangla.com'
  const existingMod = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existingMod) {
    await db.user.create({ data: { email: adminEmail, name: 'মডারেটর', password: hashPassword(process.env.ADMIN_PASSWORD || 'Admin1234!'), role: 'ADMIN', isVerified: true, isPremium: true } })
    console.log(`✅ Admin created (${adminEmail})`)
  } else {
    console.log(`→ Admin exists (${adminEmail})`)
  }

  const studentPasswords = hashPassword(process.env.STUDENT_DEFAULT_PASSWORD || 'Student1234!')
  const sampleStudents = [
    { email: 'rahul@student.com', name: 'রাহুল আহমেদ', classLevel: 'ssc', board: 'dhaka', phone: '01712345678' },
    { email: 'fatema@student.com', name: 'ফাতেমা খাতুন', classLevel: 'ssc', board: 'rajshahi', phone: '01812345678' },
    { email: 'sakib@student.com', name: 'সাকিব হাসান', classLevel: 'hsc', board: 'dhaka', phone: '01912345678', isPremium: true },
  ]
  for (const student of sampleStudents) {
    const existing = await db.user.findUnique({ where: { email: student.email } })
    if (!existing) {
      await db.user.create({ data: { email: student.email, name: student.name, password: studentPasswords, role: 'STUDENT', phone: student.phone, classLevel: student.classLevel, board: student.board, isVerified: true, isPremium: student.isPremium ?? false } })
    }
  }
  console.log('✅ Students seeded')

  // ── Class Categories ──
  const classes = [
    { name: '৬ষ্ঠ শ্রেণি', slug: 'class-6', order: 1, icon: '6', color: '#10b981', gradient: 'from-emerald-400 to-emerald-600' },
    { name: '৭ম শ্রেণি', slug: 'class-7', order: 2, icon: '7', color: '#3b82f6', gradient: 'from-teal-400 to-teal-600' },
    { name: '৮ম শ্রেণি', slug: 'class-8', order: 3, icon: '8', color: '#8b5cf6', gradient: 'from-cyan-400 to-cyan-600' },
    { name: 'এসএসসি', slug: 'ssc', order: 4, icon: 'S', color: '#f59e0b', gradient: 'from-emerald-500 to-teal-500' },
    { name: 'এইচএসসি', slug: 'hsc', order: 5, icon: 'H', color: '#ef4444', gradient: 'from-teal-500 to-emerald-500' },
  ]
  for (const cls of classes) {
    await db.classCategory.upsert({ where: { slug: cls.slug }, update: cls, create: cls })
  }
  console.log('✅ Classes seeded')

  // ── Subjects ──
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
    const cc = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!cc) continue
    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i]
      const existing = await db.subject.findFirst({ where: { slug: s.slug, classId: cc.id } })
      if (!existing) await db.subject.create({ data: { ...s, classId: cc.id, order: i + 1, description: `${s.name} - ${cc.name}` } })
    }
  }
  console.log('✅ Subjects seeded')

  // ── Chapters ── (abbreviated — key structure only)
  const chapterData: Record<string, Record<string, Array<{ name: string; slug: string }>>> = {
    'class-6': {
      'bangla': [{ name: 'কবিতা ও গদ্য', slug: 'poetry-prose' }, { name: 'ব্যাকরণ', slug: 'grammar' }, { name: 'সাহিত্যের ইতিহাস', slug: 'literary-history' }],
      'english': [{ name: 'Grammar & Composition', slug: 'grammar-composition' }, { name: 'Reading Comprehension', slug: 'reading-comprehension' }],
      'math': [{ name: 'প্রাকৃতিক সংখ্যা', slug: 'natural-numbers' }, { name: 'ভগ্নাংশ ও দশমিক', slug: 'fractions-decimals' }, { name: 'জ্যামিতির প্রাথমিক ধারণা', slug: 'basic-geometry' }],
      'science': [{ name: 'পদার্থের বৈশিষ্ট্য', slug: 'matter-properties' }, { name: 'জীবের পরিচয়', slug: 'living-organisms' }, { name: 'পরিবেশ ও প্রকৃতি', slug: 'environment-nature' }],
      'social-science': [{ name: 'বাংলাদেশ ও বিশ্বপরিচয়', slug: 'bangladesh-world' }, { name: 'নাগরিকতা', slug: 'citizenship' }],
      'islam': [{ name: 'আকাইদ ও ইবাদত', slug: 'aqeedah-ibadah' }, { name: 'ইসলামের ইতিহাস', slug: 'islamic-history' }],
    },
    'class-7': {
      'bangla': [{ name: 'কবিতা ও গদ্য', slug: 'poetry-prose' }, { name: 'ব্যাকরণ', slug: 'grammar' }],
      'english': [{ name: 'Grammar & Composition', slug: 'grammar-composition' }, { name: 'Reading & Writing', slug: 'reading-writing' }],
      'math': [{ name: 'পূর্ণসংখ্যা', slug: 'integers' }, { name: 'রেখা ও কোণ', slug: 'lines-angles' }, { name: 'ত্রিভুজ', slug: 'triangles' }],
      'science': [{ name: 'পদার্থের অবস্থা', slug: 'states-matter' }, { name: 'উদ্ভিদের পুষ্টি', slug: 'plant-nutrition' }, { name: 'বিদ্যুৎ', slug: 'electricity' }],
      'social-science': [{ name: 'বাংলাদেশের ইতিহাস', slug: 'bangladesh-history' }, { name: 'ভূগোল', slug: 'geography' }],
    },
    'class-8': {
      'bangla': [{ name: 'কবিতা ও গদ্য', slug: 'poetry-prose' }, { name: 'ব্যাকরণ', slug: 'grammar' }],
      'english': [{ name: 'Grammar & Composition', slug: 'grammar-composition' }, { name: 'Reading & Writing', slug: 'reading-writing' }],
      'math': [{ name: 'অনুপাত ও সমানুপাত', slug: 'ratio-proportion' }, { name: 'বীজগণিতীয় সমীকরণ', slug: 'algebraic-equations' }, { name: 'চতুর্ভুজ', slug: 'quadrilaterals' }],
      'science': [{ name: 'পরমাণুর গঠন', slug: 'atomic-structure' }, { name: 'রাসায়নিক বিক্রিয়া', slug: 'chemical-reactions' }, { name: 'বল ও গতি', slug: 'force-motion' }],
      'ict': [{ name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' }, { name: 'কম্পিউটারের ব্যবহার', slug: 'computer-usage' }],
    },
    'ssc': {
      'physics': [{ name: 'ভৌত জগত ও পরিমাপ', slug: 'physical-world-measurement' }, { name: 'গতি', slug: 'motion' }, { name: 'বল', slug: 'force' }, { name: 'কাজ ক্ষমতা ও শক্তি', slug: 'work-power-energy' }, { name: 'তাপ ও তাপমাত্রা', slug: 'heat-temperature' }, { name: 'তরঙ্গ ও শব্দ', slug: 'wave-sound' }],
      'chemistry': [{ name: 'রসায়নের ভূমিকা', slug: 'intro-chemistry' }, { name: 'অবস্থার পরিবর্তন', slug: 'state-change' }, { name: 'পরমাণুর গঠন', slug: 'atomic-structure' }, { name: 'মৌলের পর্যায় শ্রেণীবিন্যাস', slug: 'periodic-table' }],
      'math': [{ name: 'বাস্তব সংখ্যা ও অনুপাত', slug: 'real-numbers-ratio' }, { name: 'সেট ও ফাংশন', slug: 'sets-functions' }, { name: 'বীজগণিতীয় রাশি', slug: 'algebraic-expressions' }, { name: 'জ্যামিতি', slug: 'geometry' }],
      'biology': [{ name: 'জীবনের উৎপত্তি ও বিবর্তন', slug: 'origin-evolution' }, { name: 'কোষ ও এর গঠন', slug: 'cell-structure' }, { name: 'উদ্ভিদের শারীরতত্ত্ব', slug: 'plant-physiology' }, { name: 'প্রাণীর শারীরতত্ত্ব', slug: 'animal-physiology' }],
      'bangla': [{ name: 'কবিতা ও গদ্য', slug: 'poetry-prose' }, { name: 'ব্যাকরণ', slug: 'grammar' }, { name: 'সাহিত্যের ইতিহাস', slug: 'literary-history' }],
      'english': [{ name: 'Grammar & Composition', slug: 'grammar-composition' }, { name: 'Reading Comprehension', slug: 'reading-comprehension' }, { name: 'Writing Skills', slug: 'writing-skills' }],
      'higher-math': [{ name: 'ম্যাট্রিক্স ও নির্ণায়ক', slug: 'matrix-determinant' }, { name: 'সরলরেখা', slug: 'straight-line' }, { name: 'ত্রিকোণমিতি', slug: 'trigonometry' }],
      'ict': [{ name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' }, { name: 'ইন্টারনেট ও ওয়েব', slug: 'internet-web' }, { name: 'প্রোগ্রামিং', slug: 'programming' }],
    },
    'hsc': {
      'physics': [{ name: 'ভৌত জগত ও পরিমাপ', slug: 'physical-world' }, { name: 'ভেক্টর', slug: 'vectors' }, { name: 'গতিবিদ্যা', slug: 'kinetics' }, { name: 'নিউটনীয় বলবিদ্যা', slug: 'newtonian-mechanics' }],
      'chemistry': [{ name: 'নিরাপদ রসায়ন পরিচয়', slug: 'safe-chemistry' }, { name: 'পরমাণু গঠন ও ইলেকট্রন বিন্যাস', slug: 'atomic-electron' }, { name: 'রাসায়নিক বন্ধন', slug: 'chemical-bonding' }],
      'higher-math': [{ name: 'ম্যাট্রিক্স ও নির্ণায়ক', slug: 'matrix-determinant' }, { name: 'সদিক রাশি', slug: 'vectors' }, { name: 'সরলরেখা', slug: 'straight-line' }],
      'biology': [{ name: 'কোষ রসায়ন', slug: 'cell-chemistry' }, { name: 'কোষ বিভাজন', slug: 'cell-division' }, { name: 'উদ্ভিদ শারীরবৃত্ত', slug: 'plant-physiology' }],
      'bangla': [{ name: 'কবিতা ও গদ্য', slug: 'poetry-prose' }, { name: 'ব্যাকরণ', slug: 'grammar' }],
      'english': [{ name: 'Grammar & Composition', slug: 'grammar-composition' }, { name: 'Reading Comprehension', slug: 'reading-comprehension' }],
      'accounting': [{ name: 'হিসাববিজ্ঞানের ভূমিকা', slug: 'intro-accounting' }, { name: 'জাবেদা ও লেজার', slug: 'journal-ledger' }],
      'ict': [{ name: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict-intro' }, { name: 'ওয়েব ডিজাইন', slug: 'web-design' }],
    },
  }
  for (const [classSlug, subjectChapters] of Object.entries(chapterData)) {
    const cc = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!cc) continue
    for (const [subjectSlug, chapters] of Object.entries(subjectChapters)) {
      const subj = await db.subject.findFirst({ where: { slug: subjectSlug, classId: cc.id } })
      if (!subj) continue
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i]
        const existing = await db.chapter.findFirst({ where: { slug: ch.slug, subjectId: subj.id } })
        if (!existing) await db.chapter.create({ data: { ...ch, subjectId: subj.id, order: i + 1, description: ch.name } })
      }
    }
  }
  console.log('✅ Chapters seeded')

  // ── Boards ──
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
  ]
  for (const board of boards) {
    await db.board.upsert({ where: { slug: board.slug }, update: board, create: board })
  }
  console.log('✅ Boards seeded')

  // ── Exam Years ──
  for (const year of ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016']) {
    const order = 2025 - parseInt(year) + 1
    await db.examYear.upsert({ where: { year }, update: { order }, create: { year, order } })
  }
  console.log('✅ Exam years seeded')

  // ── Board-Year mappings ──
  const allBoards = await db.board.findMany({ select: { slug: true } })
  for (const board of allBoards) {
    for (const year of ['2025', '2024', '2023', '2022', '2021']) {
      const existing = await db.boardYear.findFirst({ where: { board: board.slug, year } })
      if (!existing) await db.boardYear.create({ data: { board: board.slug, year } })
    }
  }
  console.log('✅ Board-year mappings seeded')
}

// ────────────────────────────────────────────────────────────────────────────
//  PART 2 — MCQs, CQs, Lectures & Content (from seed.ts)
// ────────────────────────────────────────────────────────────────────────────

async function seedContent() {
  const sscClass = await db.classCategory.findUnique({ where: { slug: 'ssc' } })
  const _hscClass = await db.classCategory.findUnique({ where: { slug: 'hsc' } })

  // ── SSC Physics MCQs ──
  const physicsSubject = sscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: sscClass.id } }) : null
  if (physicsSubject) {
    const chapters = await db.chapter.findMany({ where: { subjectId: physicsSubject.id }, orderBy: { order: 'asc' } })
    const mcqByChapter: Record<string, Array<Record<string, unknown>>> = {
      'physical-world-measurement': [
        { question: 'পদার্থবিজ্ঞানে দৈর্ঘ্যের SI একক কোনটি?', optionA: 'সেন্টিমিটার', optionB: 'মিটার', optionC: 'কিলোমিটার', optionD: 'মিলিমিটার', correctAnswer: 'B', explanation: 'SI একক মিটার (m)।', difficulty: 'easy', isPremium: false },
        { question: '1 আলোকবর্ষ সমান কত মিটার?', optionA: '9.46 × 10¹⁵ m', optionB: '3 × 10⁸ m', optionC: '1.5 × 10¹¹ m', optionD: '3.08 × 10¹⁶ m', correctAnswer: 'A', explanation: '1 আলোকবর্ষ ≈ 9.46 × 10¹⁵ মিটার', difficulty: 'medium', isPremium: false },
        { question: 'নিচের কোনটি ভেক্টর রাশি?', optionA: 'ভর', optionB: 'তাপমাত্রা', optionC: 'বেগ', optionD: 'সময়', correctAnswer: 'C', explanation: 'বেগের মান ও দিক উভয়ই আছে।', difficulty: 'easy', isPremium: false },
        { question: 'মাত্রাহীন রাশি কোনটি?', optionA: 'বল', optionB: 'কোণ', optionC: 'দৈর্ঘ্য', optionD: 'সময়', correctAnswer: 'B', explanation: 'কোণ একটি মাত্রাহীন রাশি।', difficulty: 'medium', isPremium: true },
      ],
      'motion': [
        { question: 'স্থির অবস্থা থেকে অবাধে পতনশীল বস্তুর প্রাথমিক ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '10.8 m/s²', optionC: '8.9 m/s²', optionD: '11.2 m/s²', correctAnswer: 'A', explanation: 'g = 9.8 m/s²', difficulty: 'easy', isPremium: false },
        { question: 'সমবেগে চলমান বস্তুর ত্বরণ কত?', optionA: '9.8 m/s²', optionB: '0', optionC: 'অসীম', optionD: 'ঋণাত্মক', correctAnswer: 'B', explanation: 'বেগ পরিবর্তন না হওয়ায় ত্বরণ = 0', difficulty: 'easy', isPremium: false },
        { question: 'বেগ-সময় লেখচিত্রের ঢাল কী নির্দেশ করে?', optionA: 'বেগ', optionB: 'সরণ', optionC: 'ত্বরণ', optionD: 'বল', correctAnswer: 'C', explanation: 'v-t লেখচিত্রের ঢাল = ত্বরণ', difficulty: 'medium', isPremium: false },
        { question: 'একটি গাড়ি 36 km/h বেগে যাচ্ছে। এটি m/s এ কত?', optionA: '5 m/s', optionB: '10 m/s', optionC: '15 m/s', optionD: '20 m/s', correctAnswer: 'B', explanation: '36 × 1000/3600 = 10 m/s', difficulty: 'easy', isPremium: false },
        { question: 'প্রক্ষিপ্ত বস্তুর সর্বোচ্চ উচ্চতায় বেগ কত?', optionA: 'সর্বোচ্চ', optionB: 'নূন্যতম', optionC: 'শূন্য', optionD: 'অর্ধেক', correctAnswer: 'C', explanation: 'সর্বোচ্চ উচ্চতায় উল্লম্ব বেগ = 0', difficulty: 'medium', isPremium: true },
      ],
      'force': [
        { question: 'নিউটনের তৃতীয় সূত্র কোনটি?', optionA: 'জড়তার সূত্র', optionB: 'F = ma', optionC: 'ক্রিয়া-প্রতিক্রিয়া সূত্র', optionD: 'মহাকর্ষ সূত্র', correctAnswer: 'C', explanation: 'প্রতি ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া।', difficulty: 'easy', isPremium: false },
        { question: 'ঘর্ষণ বল সর্বদা কোন দিকে ক্রিয়া করে?', optionA: 'গতির দিকে', optionB: 'গতির বিপরীত দিকে', optionC: 'উল্লম্ব দিকে', optionD: 'যেকোনো দিকে', correctAnswer: 'B', explanation: 'ঘর্ষণ বল গতির বিপরীত দিকে ক্রিয়া করে।', difficulty: 'easy', isPremium: false },
        { question: '1 নিউটন = কত ডাইন?', optionA: '10³', optionB: '10⁴', optionC: '10⁵', optionD: '10²', correctAnswer: 'C', explanation: '1 N = 10⁵ ডাইন', difficulty: 'medium', isPremium: false },
      ],
    }
    for (const chapter of chapters) {
      const chapterMcqs = mcqByChapter[chapter.slug] || []
      for (let i = 0; i < chapterMcqs.length; i++) {
        const mcq = chapterMcqs[i]
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question as string } })
        if (!existing) {
          const isBoard = i < 2
          await db.mCQ.create({
            data: { ...mcq as any, chapterId: chapter.id, classLevel: 'ssc', subjectId: physicsSubject.id, board: isBoard ? 'dhaka' : null, year: isBoard ? '2024' : null },
          })
        }
      }
    }
  }

  // ── SSC Chemistry / Math / HSC / Junior class MCQs (abbreviated) ──
  const chemSubject = sscClass ? await db.subject.findFirst({ where: { slug: 'chemistry', classId: sscClass.id } }) : null
  for (const subject of [chemSubject].filter(Boolean)) {
    if (!subject) continue
    const chapters = await db.chapter.findMany({ where: { subjectId: subject.id } })
    for (const chapter of chapters) {
      const count = await db.mCQ.count({ where: { chapterId: chapter.id } })
      if (count === 0) {
        await db.mCQ.create({ data: { question: `${chapter.name} - নিচের কোনটি সঠিক?`, optionA: '১', optionB: '২', optionC: '৩', optionD: '৪', correctAnswer: 'A', explanation: 'উদাহরণ', difficulty: 'medium', isPremium: false, chapterId: chapter.id, classLevel: 'ssc', subjectId: subject.id, board: 'dhaka', year: '2024' } })
        await db.mCQ.create({ data: { question: `${chapter.name} - কোনটি ভুল?`, optionA: '১', optionB: '২', optionC: '৩', optionD: '৪', correctAnswer: 'C', explanation: 'উদাহরণ', difficulty: 'easy', isPremium: false, chapterId: chapter.id, classLevel: 'ssc', subjectId: subject.id } })
      }
    }
  }

  // ── CQs ──
  const physicsCh1 = physicsSubject ? await db.chapter.findFirst({ where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id } }) : null
  if (physicsCh1 && physicsSubject) {
    const existing = await db.cQ.findFirst({ where: { uddeepok: 'একটি গাড়ি স্থির অবস্থা থেকে যাত্রা শুরু করে সমবেগে 20 m/s বেগে 10 সেকেন্ড চলে।' } })
    if (!existing) {
      await db.cQ.create({
        data: {
          uddeepok: 'একটি গাড়ি স্থির অবস্থা থেকে যাত্রা শুরু করে সমবেগে 20 m/s বেগে 10 সেকেন্ড চলে। এরপর গাড়িটি 5 সেকেন্ডে ব্রেক করে থেমে যায়।',
          question1: 'গাড়ির প্রাথমিক ত্বরণ কত?', question2: 'গাড়িটি মোট কত দূরত্ব অতিক্রম করে?', question3: 'ব্রেক করার সময় মন্দণ কত?', question4: 'বেগ-সময় লেখচিত্র অঙ্কন করো।',
          answer1: 'a = (20-0)/10 = 2 m/s²', answer2: '½×20×10 + ½×20×5 = 150 m', answer3: 'a = (0-20)/5 = -4 m/s²', answer4: 'প্রথমে ধনাত্মক ঢাল, তারপর ঋণাত্মক ঢাল।',
          chapterId: physicsCh1.id, classLevel: 'ssc', subjectId: physicsSubject.id, difficulty: 'medium', isPremium: false, board: 'dhaka', year: '2024',
        },
      })
    }
  }

  // ── Lectures ──
  if (physicsSubject) {
    const sscPhysicsCh1 = await db.chapter.findFirst({ where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id } })
    if (sscPhysicsCh1) {
      for (const lec of [
        { title: 'ভৌত জগত ও এর শাখাসমূহ', slug: 'physical-world-and-its-branches', content: '<h2>ভৌত জগত ও এর শাখাসমূহ</h2><p>পদার্থবিজ্ঞানের প্রধান শাখা: বলবিদ্যা, তাপগতিবিদ্যা, আলোকবিজ্ঞান, তড়িৎ ও চুম্বকবিদ্যা, ধ্বনিবিজ্ঞান।</p>', duration: 30, isPremium: false, order: 1 },
        { title: 'পরিমাপ ও একক পদ্ধতি', slug: 'measurement-and-unit-system', content: '<h2>পরিমাপ ও একক</h2><p>SI একক: দৈর্ঘ্য→মিটার, ভর→কিলোগ্রাম, সময়→সেকেন্ড, তাপমাত্রা→কেলভিন।</p>', duration: 25, isPremium: false, order: 2 },
        { title: 'মাত্রিক সমীকরণ ও তাৎপর্যপূর্ণ অঙ্ক', slug: 'dimensional-equation', content: '<h2>মাত্রিক বিশ্লেষণ</h2><p>মাত্রিক সমীকরণ ও তাৎপর্যপূর্ণ অঙ্কের ধারণা।</p>', duration: 20, isPremium: true, order: 3 },
      ]) {
        const exists = await db.lecture.findFirst({ where: { slug: lec.slug, chapterId: sscPhysicsCh1.id } })
        if (!exists) await db.lecture.create({ data: { ...lec, chapterId: sscPhysicsCh1.id, isActive: true } })
      }
    }
  }
  // 1 lecture per remaining chapter
  for (const classSlug of ['class-6', 'class-7', 'class-8', 'ssc', 'hsc']) {
    const cc = await db.classCategory.findUnique({ where: { slug: classSlug } })
    if (!cc) continue
    const subjects = await db.subject.findMany({ where: { classId: cc.id } })
    for (const subject of subjects) {
      const chapters = await db.chapter.findMany({ where: { subjectId: subject.id } })
      for (const chapter of chapters) {
        if (classSlug === 'ssc' && subject.slug === 'physics' && chapter.slug === 'physical-world-measurement') continue
        const count = await db.lecture.count({ where: { chapterId: chapter.id } })
        if (count > 0) continue
        const isPremium = (classSlug === 'ssc' && subject.slug === 'chemistry' && chapter.order === 1) || (classSlug === 'hsc' && subject.slug === 'physics' && chapter.order === 2)
        await db.lecture.create({
          data: { title: `ভূমিকা - ${chapter.name}`, slug: `intro-${chapter.slug}`, chapterId: chapter.id, content: `<h2>${chapter.name}</h2><p>${subject.name} বিষয়ের ${chapter.name} অধ্যায়ের ভূমিকা।</p>`, duration: 20, order: 1, isPremium, price: isPremium ? 30 : 0, isActive: true },
        })
      }
    }
  }
  console.log('✅ Lectures seeded')

  // ── Resources ──
  const allLectures = await db.lecture.findMany({ select: { id: true } })
  for (const lecture of allLectures) {
    const exists = await db.resource.findFirst({ where: { lectureId: lecture.id, type: 'pdf' } })
    if (!exists) await db.resource.create({ data: { lectureId: lecture.id, title: 'লেকচার নোট (PDF)', type: 'pdf', url: '#', size: '2.5 MB', isActive: true } })
  }
  console.log('✅ Resources seeded')

  // ── Content Types ──
  const contentTypes = [
    { key: 'lecture', labelBn: 'লেকচার', labelEn: 'Lecture', icon: 'PlayCircle', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', route: 'lecture-list', paramKey: 'chapterId', buttonLabel: 'লেকচার দেখুন', order: 1 },
    { key: 'mcq', labelBn: 'MCQ প্র্যাকটিস', labelEn: 'MCQ Practice', icon: 'CircleDot', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600', route: 'mcq-practice', paramKey: 'chapterId', buttonLabel: 'প্র্যাকটিস শুরু', order: 2 },
    { key: 'cq', labelBn: 'সৃজনশীল প্রশ্ন', labelEn: 'Creative Question', icon: 'FileText', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600', route: 'cq-viewer', paramKey: 'cqId', buttonLabel: 'সৃজনশীল প্রশ্ন দেখুন', order: 3 },
    { key: 'board', labelBn: 'বোর্ড প্রশ্ন', labelEn: 'Board Questions', icon: 'GraduationCap', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড প্রশ্ন দেখুন', order: 4 },
    { key: 'suggestion', labelBn: 'সাজেশন', labelEn: 'Suggestion', icon: 'Lightbulb', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-600', route: 'suggestions', paramKey: 'chapterId', buttonLabel: 'সাজেশন দেখুন', order: 5 },
    { key: 'exam', labelBn: 'পরীক্ষা', labelEn: 'Exam', icon: 'ClipboardCheck', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600', route: 'exam-center', paramKey: 'examId', buttonLabel: 'পরীক্ষা দিন', order: 6 },
    { key: 'bundle', labelBn: 'বান্ডেল', labelEn: 'Bundle', icon: 'Package', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600', route: 'premium', paramKey: 'bundleId', buttonLabel: 'বান্ডেল কিনুন', order: 7 },
    { key: 'package', labelBn: 'প্যাকেজ', labelEn: 'Package', icon: 'Gift', color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-600', route: 'premium', paramKey: 'packageId', buttonLabel: 'প্যাকেজ কিনুন', order: 8 },
    { key: 'mcq-exam-package', labelBn: 'MCQ এক্সাম প্যাকেজ', labelEn: 'MCQ Exam Package', icon: 'ClipboardCheck', color: 'bg-sky-500', lightColor: 'bg-sky-50', textColor: 'text-sky-600', route: 'mcq-exam-package-list', paramKey: '', buttonLabel: 'এক্সাম প্যাকেজ দেখুন', order: 9 },
    { key: 'board-mcq', labelBn: 'বোর্ড MCQ', labelEn: 'Board MCQ', icon: 'CircleDot', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড MCQ দেখুন', order: 10 },
    { key: 'board-cq', labelBn: 'বোর্ড CQ', labelEn: 'Board CQ', icon: 'FileText', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড CQ দেখুন', order: 11 },
    { key: 'cq-exam-package', labelBn: 'CQ এক্সাম প্যাকেজ', labelEn: 'CQ Exam Package', icon: 'ClipboardCheck', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', textColor: 'text-cyan-600', route: 'cq-exam-package-list', paramKey: '', buttonLabel: 'এক্সাম প্যাকেজ দেখুন', order: 12 },
  ]
  for (const ct of contentTypes) {
    await db.contentType.upsert({ where: { key: ct.key }, update: ct, create: ct })
  }
  console.log('✅ Content types seeded')

  // ── Banners ──
  const bannerData = [
    { title: 'এসএসসি ২০২৫ স্পেশাল অফার', subtitle: 'সকল বিষয়ের কন্টেন্ট একসাথে', link: '/premium', buttonText: 'এখনই দেখুন', order: 1 },
    { title: 'বিজ্ঞান বিভাগে ভর্তি চলছে', subtitle: 'পদার্থ, রসায়ন, জীববিজ্ঞান', link: '/classes/ssc', buttonText: 'বিস্তারিত', order: 2 },
  ]
  for (const b of bannerData) {
    const existing = await db.banner.findFirst({ where: { title: b.title } })
    if (!existing) await db.banner.create({ data: { ...b, isActive: true } })
  }
  console.log('✅ Banners seeded')

  // ── FAQs ──
  const faqData = [
    { question: 'শিক্ষা বাংলা কী?', answer: '৬ষ্ঠ থেকে এইচএসসি পর্যন্ত অনলাইন শিক্ষা প্ল্যাটফর্ম।', order: 1 },
    { question: 'কিভাবে রেজিস্ট্রেশন করব?', answer: 'উপরের ডানপাশে রেজিস্ট্রেশন বাটনে ক্লিক করুন।', order: 2 },
    { question: 'প্রিমিয়াম কন্টেন্ট কিভাবে কিনব?', answer: 'প্রিমিয়াম কন্টেন্টে ক্লিক করে বিকাশ/নগদ/রকেটে পেমেন্ট করুন।', order: 3 },
    { question: 'কি কি বিষয়ের কন্টেন্ট আছে?', answer: 'বাংলা, ইংরেজি, গণিত, পদার্থ, রসায়ন, জীববিজ্ঞান, ICT সহ সকল বিষয়।', order: 4 },
    { question: 'পেমেন্ট কতক্ষণের মধ্যে অ্যাক্টিভেট হয়?', answer: 'অ্যাডমিন যাচাই করে সাধারণত ২৪ ঘন্টার মধ্যে অ্যাক্টিভেট করা হয়।', order: 5 },
  ]
  for (const f of faqData) {
    const existing = await db.fAQ.findFirst({ where: { question: f.question } })
    if (!existing) await db.fAQ.create({ data: { ...f, isActive: true } })
  }
  console.log('✅ FAQs seeded')

  // ── Testimonials ──
  const testimonialData = [
    { name: 'রাফি আহমেদ', role: 'এসএসসি ২০২৪', content: 'শিক্ষা বাংলা থেকে পড়ে A+ পেয়েছি।', rating: 5, order: 1 },
    { name: 'নুসরাত জাহান', role: 'এইচএসসি ২০২৪', content: 'পদার্থবিজ্ঞানের MCQ প্র্যাকটিস অসাধারণ।', rating: 5, order: 2 },
    { name: 'তানভীর হাসান', role: '৮ম শ্রেণি', content: 'খুব সহজে সব বুঝতে পারি।', rating: 4, order: 3 },
  ]
  for (const t of testimonialData) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name } })
    if (!existing) await db.testimonial.create({ data: { ...t, isActive: true } })
  }
  console.log('✅ Testimonials seeded')

  // ── Content Packages (Plans) ──
  const packageData = [
    { title: 'মাসিক প্যাকেজ', slug: 'monthly-package', description: '১ মাসের জন্য সকল কন্টেন্ট অ্যাক্সেস', price: 99, originalPrice: 199, duration: 30, durationLabel: '৩০ দিন', order: 1 },
    { title: 'ছয় মাসিক প্যাকেজ', slug: 'half-yearly-package', description: '৬ মাসের জন্য সকল কন্টেন্ট অ্যাক্সেস', price: 299, originalPrice: 594, duration: 180, durationLabel: '৬ মাস', order: 2 },
    { title: 'বার্ষিক প্যাকেজ', slug: 'annual-package', description: '১ বছরের জন্য সকল কন্টেন্ট অ্যাক্সেস', price: 499, originalPrice: 1188, duration: 365, durationLabel: '১ বছর', order: 3 },
  ]
  for (const pkg of packageData) {
    await db.contentPackage.upsert({ where: { slug: pkg.slug }, update: pkg, create: { ...pkg, isActive: true } })
  }
  console.log('✅ Content packages seeded')

  // ── Teacher/Moderator ──
  const teachers = [
    { name: 'সাইফুর রহমান', title: 'সিনিয়র শিক্ষক', institution: 'ঢাকা কলেজ' },
    { name: 'নাসরিন আক্তার', title: 'প্রভাষক', institution: 'রাজশাহী কলেজ' },
    { name: 'আব্দুর রহিম', title: 'মডারেটর', institution: 'চট্টগ্রাম কলেজ' },
    { name: 'ফারহানা ইয়াসমিন', title: 'সহকারী শিক্ষক', institution: 'ময়মনসিংহ কলেজ' },
  ]
  for (const t of teachers) {
    const existing = await db.teacherModerator.findFirst({ where: { name: t.name } })
    if (!existing) await db.teacherModerator.create({ data: { ...t, isActive: true, order: teachers.indexOf(t) + 1 } })
  }
  console.log('✅ Teachers seeded')

  // ── Notices ──
  const noticeData = [
    { title: 'এসএসসি ২০২৫ মডেল টেস্ট', content: 'আগামী ১৫ তারিখে এসএসসি ২০২৫ মডেল টেস্ট অনুষ্ঠিত হবে।', type: 'text', isPinned: true, order: 1 },
    { title: 'নতুন অধ্যায় যোগ হয়েছে', content: 'এইচএসসি পদার্থবিজ্ঞানের নতুন অধ্যায় যোগ করা হয়েছে।', type: 'text', isPinned: false, order: 2 },
  ]
  for (const n of noticeData) {
    const existing = await db.notice.findFirst({ where: { title: n.title } })
    if (!existing) await db.notice.create({ data: { ...n, isActive: true } })
  }
  console.log('✅ Notices seeded')

  // ── Board CQs ──
  const boardCqSeeds = [
    { classSlug: 'ssc', subjectSlug: 'physics', chapterSlug: 'physical-world-measurement', uddeepok: 'একটি স্টিলের রডের দৈর্ঘ্য মিটার স্কেলে ৫.২ cm ও স্লাইড ক্যালিপার্সে ৫.২৫ cm।', question1: 'কোনটির পরিমাপ বেশি নির্ভুল?', question2: 'স্লাইড ক্যালিপার্সের লঘিষ্ঠ গণন কত?', question3: 'পরিমাপের নির্ভুলতা বাড়ানোর উপায়?', question4: 'দৈর্ঘ্যের SI একক কী?', answer1: 'স্লাইড ক্যালিপার্স (লঘিষ্ঠ গণন কম)।', answer2: '০.০১ cm', answer3: 'উপযুক্ত যন্ত্র ও একাধিক মাপের গড়।', answer4: 'মিটার (m)', board: 'dhaka', year: '2024', difficulty: 'medium', isPremium: false },
    { classSlug: 'ssc', subjectSlug: 'chemistry', chapterSlug: 'intro-chemistry', uddeepok: 'CaCO₃ → CaO + CO₂', question1: 'এটি কোন ধরনের বিক্রিয়া?', question2: 'সমীকরণ সমন্বয় করো।', question3: '১০০g CaCO₃ থেকে কত CaO?', answer1: 'তাপীয় বিয়োজন।', answer2: 'CaCO₃ → CaO + CO₂', answer3: '৫৬g', board: 'rajshahi', year: '2023', difficulty: 'hard', isPremium: true, question4: 'STP তে CO₂ এর আয়তন?', answer4: '২২.৪ L' },
    { classSlug: 'hsc', subjectSlug: 'physics', chapterSlug: 'vectors', uddeepok: 'F₁ = 3i + 4j, F₂ = 5i - 2j', question1: 'লব্ধি বলের মান?', question2: 'F₁ ও F₂ এর মধ্যবর্তী কোণ?', question3: 'লব্ধি বলের দিক?', question4: 'F₁ বরাবর একক ভেক্টর?', answer1: '|F| = 2√17 N', answer2: 'cosθ = 7/(5√29)', answer3: 'tanα = 0.25', answer4: '(3i+4j)/5', board: 'dhaka', year: '2024', difficulty: 'hard', isPremium: true },
  ]
  for (const cq of boardCqSeeds) {
    const cc = await db.classCategory.findUnique({ where: { slug: cq.classSlug } })
    if (!cc) continue
    const subj = await db.subject.findFirst({ where: { slug: cq.subjectSlug, classId: cc.id } })
    if (!subj) continue
    const ch = await db.chapter.findFirst({ where: { slug: cq.chapterSlug, subjectId: subj.id } })
    if (!ch) continue
    const existing = await db.cQ.findFirst({ where: { uddeepok: cq.uddeepok } })
    if (!existing) {
      await db.cQ.create({
        data: {
          uddeepok: cq.uddeepok, question1: cq.question1, question2: cq.question2, question3: cq.question3, question4: cq.question4,
          answer1: cq.answer1, answer2: cq.answer2, answer3: cq.answer3, answer4: cq.answer4,
          chapterId: ch.id, classLevel: cq.classSlug, subjectId: subj.id, difficulty: cq.difficulty, isPremium: cq.isPremium,
          price: cq.isPremium ? 20 : 0, board: cq.board, year: cq.year, isActive: true,
        },
      })
    }
  }
  console.log('✅ Board CQs seeded')

  // ── Content Bundle ──
  const existingBundle = await db.contentBundle.findFirst({ where: { slug: 'ssc-physics-complete-bundle' } })
  if (!existingBundle) {
    const bundle = await db.contentBundle.create({
      data: { title: 'এসএসসি পদার্থবিজ্ঞান সম্পূর্ণ বান্ডেল', slug: 'ssc-physics-complete-bundle', description: 'সকল অধ্যায়ের MCQ, CQ ও লেকচার', price: 199, originalPrice: 350, classLevel: 'ssc', type: 'mixed', isActive: true, order: 1 },
    })
    const mcqs = await db.mCQ.findMany({ where: { subjectId: physicsSubject?.id, classLevel: 'ssc' }, take: 5 })
    const cqs = await db.cQ.findMany({ where: { subjectId: physicsSubject?.id, classLevel: 'ssc' }, take: 2 })
    let o = 1
    for (const item of mcqs) { await db.bundleItem.create({ data: { bundleId: bundle.id, contentType: 'mcq', contentId: item.id, order: o++ } }) }
    for (const item of cqs) { await db.bundleItem.create({ data: { bundleId: bundle.id, contentType: 'cq', contentId: item.id, order: o++ } }) }
  }
  console.log('✅ Content bundle seeded')

  // ── Board MCQs ──
  if (physicsSubject) {
    const sscPhysicsCh1 = await db.chapter.findFirst({ where: { slug: 'physical-world-measurement', subjectId: physicsSubject.id } })
    if (sscPhysicsCh1) {
      const boardMcqs = [
        { question: 'ঢাকা বোর্ড ২০২৪: দৈর্ঘ্যের SI একক?', optionA: 'ফুট', optionB: 'মিটার', optionC: 'সেন্টিমিটার', optionD: 'ইঞ্চি', correctAnswer: 'B', explanation: 'মিটার।', difficulty: 'easy', isPremium: false, board: 'dhaka', year: '2024' },
        { question: 'ঢাকা বোর্ড ২০২৪: স্কেলার রাশি কোনটি?', optionA: 'বেগ', optionB: 'বল', optionC: 'ভর', optionD: 'ত্বরণ', correctAnswer: 'C', explanation: 'ভরের কেবল মান আছে।', difficulty: 'easy', isPremium: false, board: 'dhaka', year: '2024' },
        { question: 'ঢাকা বোর্ড ২০২৪: নিউটনের দ্বিতীয় সূত্র?', optionA: 'F=ma', optionB: 'E=mc²', optionC: 'F=mv', optionD: 'W=Fd', correctAnswer: 'A', explanation: 'বল = ভর × ত্বরণ', difficulty: 'easy', isPremium: false, board: 'dhaka', year: '2024' },
        { question: 'রাজশাহী বোর্ড ২০২৩: ভেক্টর রাশি?', optionA: 'ভর', optionB: 'তাপমাত্রা', optionC: 'বেগ', optionD: 'সময়', correctAnswer: 'C', explanation: 'বেগের মান ও দিক আছে।', difficulty: 'easy', isPremium: false, board: 'rajshahi', year: '2023' },
        { question: 'চট্টগ্রাম বোর্ড ২০২২: পতনশীল বস্তুর ত্বরণ?', optionA: '9.8', optionB: '10.8', optionC: '8.9', optionD: '11.2', correctAnswer: 'A', explanation: 'g = 9.8 m/s²', difficulty: 'easy', isPremium: false, board: 'chittagong', year: '2022' },
      ]
      for (const mcq of boardMcqs) {
        const existing = await db.mCQ.findFirst({ where: { question: mcq.question } })
        if (!existing) {
          await db.mCQ.create({ data: { ...mcq, chapterId: sscPhysicsCh1.id, classLevel: 'ssc', subjectId: physicsSubject.id } })
        }
      }
    }
  }
  console.log('✅ Board MCQs seeded')

  // ── Site Settings ──
  const siteSettings = [
    { key: 'siteName', value: 'শিক্ষা বাংলা', group: 'general', label: 'সাইট নাম' },
    { key: 'siteDescription', value: 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম', group: 'general', label: 'সাইট বিবরণ' },
    { key: 'contactEmail', value: 'info@shikhabangla.com', group: 'contact', label: 'ইমেইল' },
    { key: 'contactPhone', value: '+8801712345678', group: 'contact', label: 'ফোন' },
    { key: 'contactAddress', value: 'ঢাকা, বাংলাদেশ', group: 'contact', label: 'ঠিকানা' },
    { key: 'facebook', value: 'https://facebook.com/shikhabangla', group: 'social', label: 'ফেসবুক' },
    { key: 'youtube', value: 'https://youtube.com/@shikhabangla', group: 'social', label: 'ইউটিউব' },
    { key: 'telegram', value: 'https://t.me/shikhabangla', group: 'social', label: 'টেলিগ্রাম' },
    { key: 'bkash', value: '01712345678', group: 'payment', label: 'বিকাশ নম্বর' },
    { key: 'nagad', value: '01812345678', group: 'payment', label: 'নগদ নম্বর' },
    { key: 'rocket', value: '01912345678', group: 'payment', label: 'রকেট নম্বর' },
    { key: 'paymentBkashInstructions', value: JSON.stringify(['bKash অ্যাপ খুলুন', 'Send Money অপশনে যান', '{account} নম্বরে টাকা পাঠান', 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']), group: 'payment', label: 'বিকাশ নির্দেশনা' },
    { key: 'paymentNagadInstructions', value: JSON.stringify(['Nagad অ্যাপ খুলুন', 'Send Money অপশনে যান', '{account} নম্বরে টাকা পাঠান', 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']), group: 'payment', label: 'নগদ নির্দেশনা' },
    { key: 'paymentRocketInstructions', value: JSON.stringify(['Rocket অ্যাপ খুলুন', 'Send Money অপশনে যান', '{account} নম্বরে টাকা পাঠান', 'টাকার পরিমাণ লিখুন', 'রেফারেন্সে আপনার নাম লিখুন']), group: 'payment', label: 'রকেট নির্দেশনা' },
    { key: 'rate_limit_api_max', value: '60', group: 'rate_limit', label: 'API রেট লিমিট' },
    { key: 'rate_limit_upload_max', value: '10', group: 'rate_limit', label: 'আপলোড রেট লিমিট' },
    { key: 'rate_limit_auth_max', value: '10', group: 'rate_limit', label: 'অথ রেট লিমিট' },
    { key: 'heroBadge', value: 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম', group: 'homepage', label: 'হিরো ব্যাজ' },
    { key: 'heroTitle', value: 'বাংলাদেশের সেরা', group: 'homepage', label: 'হিরো শিরোনাম' },
    { key: 'heroSubtitle', value: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন', group: 'homepage', label: 'হিরো উপশিরোনাম' },
    { key: 'statsSubtitle', value: 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি', group: 'homepage', label: 'পরিসংখ্যান বিবরণ' },
    { key: 'footerDescription', value: 'শিক্ষা বাংলা — বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন শিক্ষা প্ল্যাটফর্ম', group: 'general', label: 'ফুটার বিবরণ' },
    { key: 'premiumFeatures', value: JSON.stringify(['সকল লেকচার অ্যাক্সেস', 'সকল MCQ প্র্যাকটিস', 'সকল সৃজনশীল প্রশ্ন', 'সকল বোর্ড প্রশ্ন', 'মডেল টেস্ট']), group: 'homepage', label: 'প্রিমিয়াম ফিচার' },
    { key: 'mcqFeatures', value: JSON.stringify(['অধ্যায়ভিত্তিক MCQ', 'বোর্ড প্রশ্ন MCQ', 'এক্সাম প্যাকেজ', 'বিস্তারিত ব্যাখ্যা']), group: 'homepage', label: 'MCQ ফিচার' },
    { key: 'searchSuggestions', value: JSON.stringify(['পদার্থবিজ্ঞান', 'গণিত', 'বাংলা', 'ইংরেজি', 'রসায়ন', 'এসএসসি', 'এইচএসসি']), group: 'homepage', label: 'সার্চ সাজেশন' },
    { key: 'homepage_classes_badge', value: 'শিক্ষা যাত্রা', group: 'homepage', label: 'শ্রেণি ব্যাজ' },
    { key: 'homepage_classes_title', value: 'আপনার ক্লাস বেছে নিন', group: 'homepage', label: 'শ্রেণি শিরোনাম' },
    { key: 'homepage_classes_subtitle', value: 'শ্রেণি অনুযায়ী সকল বিষয় ও কন্টেন্ট', group: 'homepage', label: 'শ্রেণি উপশিরোনাম' },
    { key: 'homepage_board_title', value: 'বোর্ড প্রশ্ন সমাধান', group: 'homepage', label: 'বোর্ড প্রশ্ন শিরোনাম' },
    { key: 'homepage_board_subtitle', value: 'সকল বোর্ডের বিগত বছরের প্রশ্ন', group: 'homepage', label: 'বোর্ড প্রশ্ন উপশিরোনাম' },
    { key: 'homepage_mcq_title', value: 'MCQ প্র্যাকটিস', group: 'homepage', label: 'MCQ শিরোনাম' },
    { key: 'homepage_mcq_subtitle', value: 'সময় নির্ধারিত পরীক্ষায় অংশ নিন', group: 'homepage', label: 'MCQ উপশিরোনাম' },
    { key: 'homepage_faq_title', value: 'সচরাচর জিজ্ঞাসা', group: 'homepage', label: 'FAQ শিরোনাম' },
    { key: 'homepage_faq_subtitle', value: 'আপনার প্রশ্নের উত্তর এখানে', group: 'homepage', label: 'FAQ উপশিরোনাম' },
    { key: 'homepage_testimonials_title', value: 'শিক্ষার্থীরা যা বলেন', group: 'homepage', label: 'টেস্টিমোনিয়াল শিরোনাম' },
    { key: 'homepage_testimonials_subtitle', value: 'প্ল্যাটফর্ম ব্যবহারকারীদের মতামত', group: 'homepage', label: 'টেস্টিমোনিয়াল উপশিরোনাম' },
    { key: 'homepage_teachers_title', value: 'আমাদের শিক্ষকবৃন্দ', group: 'homepage', label: 'শিক্ষক শিরোনাম' },
    { key: 'homepage_teachers_subtitle', value: 'অভিজ্ঞ শিক্ষকদের দ্বারা পরিচালিত', group: 'homepage', label: 'শিক্ষক উপশিরোনাম' },
    { key: 'homepage_stats_title', value: 'আমাদের অর্জন', group: 'homepage', label: 'পরিসংখ্যান শিরোনাম' },
    { key: 'homepage_stats_subtitle', value: 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে', group: 'homepage', label: 'পরিসংখ্যান উপশিরোনাম' },
    { key: 'homepage_featured_title', value: 'ফিচার্ড কন্টেন্ট', group: 'homepage', label: 'ফিচার্ড শিরোনাম' },
    { key: 'homepage_featured_subtitle', value: 'আমাদের সেরা কন্টেন্টসমূহ', group: 'homepage', label: 'ফিচার্ড উপশিরোনাম' },
    { key: 'homepage_premium_title', value: 'প্রিমিয়াম কন্টেন্ট', group: 'homepage', label: 'প্রিমিয়াম শিরোনাম' },
    { key: 'homepage_premium_subtitle', value: 'বান্ডেলে আকর্ষণীয় ছাড়ে পান!', group: 'homepage', label: 'প্রিমিয়াম উপশিরোনাম' },
    { key: 'logo', value: '', group: 'general', label: 'লোগো' },
    { key: 'favicon', value: '', group: 'general', label: 'ফেভিকন' },
    // ── Per-page SEO metadata ──
    { key: 'seo_page_home_title', value: 'শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম', group: 'seo', label: 'SEO - হোম পেজ শিরোনাম' },
    { key: 'seo_page_home_description', value: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।', group: 'seo', label: 'SEO - হোম পেজ বিবরণ' },
    { key: 'seo_page_login_title', value: 'লগইন করুন - শিক্ষা বাংলা', group: 'seo', label: 'SEO - লগইন পেজ' },
    { key: 'seo_page_login_description', value: 'আপনার শিক্ষা বাংলা অ্যাকাউন্টে লগইন করুন এবং পড়া শুরু করুন।', group: 'seo', label: 'SEO - লগইন বিবরণ' },
    { key: 'seo_page_register_title', value: 'নিবন্ধন করুন - শিক্ষা বাংলা', group: 'seo', label: 'SEO - রেজিস্টার পেজ' },
    { key: 'seo_page_register_description', value: 'নতুন অ্যাকাউন্ট খুলুন এবং বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্মে পড়া শুরু করুন।', group: 'seo', label: 'SEO - রেজিস্টার বিবরণ' },
    { key: 'seo_page_class-list_title', value: 'ক্লাস সমূহ - শিক্ষা বাংলা', group: 'seo', label: 'SEO - ক্লাস লিস্ট' },
    { key: 'seo_page_class-list_description', value: 'Class 6 থেকে HSC পর্যন্ত সকল ক্লাসের বিষয় ও কন্টেন্ট দেখুন।', group: 'seo', label: 'SEO - ক্লাস লিস্ট বিবরণ' },
    { key: 'seo_page_board-questions_title', value: 'বোর্ড প্রশ্ন - শিক্ষা বাংলা', group: 'seo', label: 'SEO - বোর্ড প্রশ্ন' },
    { key: 'seo_page_board-questions_description', value: 'পূর্বের বছরের বোর্ড পরীক্ষার প্রশ্ন দেখুন এবং প্র্যাকটিস করুন।', group: 'seo', label: 'SEO - বোর্ড প্রশ্ন বিবরণ' },
    { key: 'seo_page_premium_title', value: 'প্রিমিয়াম - শিক্ষা বাংলা', group: 'seo', label: 'SEO - প্রিমিয়াম' },
    { key: 'seo_page_premium_description', value: 'প্রিমিয়াম সাবস্ক্রিপশন ও বান্ডেল কিনুন এবং সব কন্টেন্ট আনলক করুন।', group: 'seo', label: 'SEO - প্রিমিয়াম বিবরণ' },
    { key: 'seo_page_search_title', value: 'সার্চ ফলাফল - শিক্ষা বাংলা', group: 'seo', label: 'SEO - সার্চ' },
    { key: 'seo_page_search_description', value: 'আপনার পছন্দের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও অন্যান্য কন্টেন্ট খুঁজুন।', group: 'seo', label: 'SEO - সার্চ বিবরণ' },
  ]
  for (const s of siteSettings) {
    await db.siteSetting.upsert({ where: { key: s.key }, update: s, create: s })
  }
  console.log('✅ Site settings seeded')

  // ── Navigation ──
  const navItems = [
    { label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1 },
    { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2 },
    { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 3 },
    { label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 4 },
    { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 5 },
    { label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 6 },
    { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 7 },
    { label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 8, isAdminOnly: true },
    { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1 },
    { label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2 },
    { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3 },
    { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4 },
    { label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true },
    { label: 'হোম', route: 'home', icon: 'Home', location: 'footer', order: 1 },
    { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2 },
    { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3 },
    { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4 },
  ]
  for (const item of navItems) {
    const existing = await db.navigation.findFirst({ where: { route: item.route, location: item.location } })
    if (!existing) await db.navigation.create({ data: { ...item, isActive: true, isAuthOnly: item.isAuthOnly ?? false, isAdminOnly: item.isAdminOnly ?? false } })
    else await db.navigation.update({ where: { id: existing.id }, data: item })
  }
  console.log('✅ Navigation seeded')

  // ── Featured Content ──
  let fo = 1
  const physSubject = sscClass ? await db.subject.findFirst({ where: { slug: 'physics', classId: sscClass.id } }) : null
  if (physSubject) {
    const lectures = await db.lecture.findMany({ where: { chapter: { subjectId: physSubject.id } }, take: 2 })
    for (const lec of lectures) {
      if (!await db.featuredContent.findFirst({ where: { section: 'homepage', contentType: 'lecture', contentId: lec.id } })) {
        await db.featuredContent.create({ data: { contentType: 'lecture', contentId: lec.id, section: 'homepage', isActive: true, order: fo++ } })
      }
    }
    const mcq = await db.mCQ.findFirst({ where: { subjectId: physSubject.id } })
    if (mcq && !await db.featuredContent.findFirst({ where: { section: 'homepage', contentType: 'mcq', contentId: mcq.id } })) {
      await db.featuredContent.create({ data: { contentType: 'mcq', contentId: mcq.id, section: 'homepage', isActive: true, order: fo++ } })
    }
  }
  const bundle = await db.contentBundle.findFirst({ where: { slug: 'ssc-physics-complete-bundle' } })
  if (bundle && !await db.featuredContent.findFirst({ where: { section: 'homepage', contentType: 'bundle', contentId: bundle.id } })) {
    await db.featuredContent.create({ data: { contentType: 'bundle', contentId: bundle.id, section: 'homepage', isActive: true, order: fo++ } })
  }
  const pkg = await db.contentPackage.findFirst({ where: { slug: 'monthly-package' } })
  if (pkg && !await db.featuredContent.findFirst({ where: { section: 'homepage', contentType: 'package', contentId: pkg.id } })) {
    await db.featuredContent.create({ data: { contentType: 'package', contentId: pkg.id, section: 'homepage', isActive: true, order: fo++ } })
  }
  console.log('✅ Featured content seeded')

  // ── RBAC Permissions ──
  const PERMISSIONS = [
    { name: 'payment.approve', group: 'payment', description: 'পেমেন্ট অনুমোদন/অস্বীকার' },
    { name: 'payment.view', group: 'payment', description: 'পেমেন্ট দেখুন' },
    { name: 'content.manage', group: 'content', description: 'সমস্ত কন্টেন্ট পরিচালনা' },
    { name: 'content.create', group: 'content', description: 'নতুন কন্টেন্ট তৈরি' },
    { name: 'content.edit', group: 'content', description: 'কন্টেন্ট সম্পাদনা' },
    { name: 'content.delete', group: 'content', description: 'কন্টেন্ট মুছুন' },
    { name: 'users.manage', group: 'users', description: 'ব্যবহারকারী পরিচালনা' },
    { name: 'users.view', group: 'users', description: 'ব্যবহারকারী দেখুন' },
    { name: 'system.settings', group: 'system', description: 'সাইট সেটিংস পরিচালনা' },
    { name: 'system.banners', group: 'system', description: 'ব্যানার পরিচালনা' },
    { name: 'system.faqs', group: 'system', description: 'FAQ পরিচালনা' },
    { name: 'system.testimonials', group: 'system', description: 'টেস্টিমোনিয়াল পরিচালনা' },
    { name: 'system.notices', group: 'system', description: 'নোটিশ পরিচালনা' },
    { name: 'system.navigation', group: 'system', description: 'নেভিগেশন পরিচালনা' },
    { name: 'system.rbac', group: 'system', description: 'RBAC/পারমিশন পরিচালনা' },
    { name: 'system.audit', group: 'system', description: 'অডিট লগ দেখুন' },
    { name: 'exam.grade', group: 'exam', description: 'CQ উত্তর মূল্যায়ন' },
    { name: 'exam.retake', group: 'exam', description: 'রিটেক অনুরোধ অনুমোদন/অস্বীকার' },
  ]
  const permIds: Record<string, string> = {}
  for (const p of PERMISSIONS) {
    const perm = await db.permission.upsert({
      where: { name: p.name },
      update: { group: p.group, description: p.description },
      create: { name: p.name, group: p.group, description: p.description },
    })
    permIds[perm.name] = perm.id
  }
  for (const [name, id] of Object.entries(permIds)) {
    await db.rolePermission.upsert({
      where: { role_permissionId: { role: 'SUPER_ADMIN', permissionId: id } },
      update: {}, create: { role: 'SUPER_ADMIN', permissionId: id },
    })
    if (name !== 'system.rbac') {
      await db.rolePermission.upsert({
        where: { role_permissionId: { role: 'ADMIN', permissionId: id } },
        update: {}, create: { role: 'ADMIN', permissionId: id },
      })
    }
  }
  console.log('✅ RBAC permissions seeded')

  // ── Knowledge Questions ──
  const kqSubjectSlugs = ['physics', 'chemistry', 'math', 'bangla', 'english']
  const kqClassSlugs = ['ssc', 'hsc']
  for (const cs of kqClassSlugs) {
    const cc = await db.classCategory.findUnique({ where: { slug: cs } })
    if (!cc) continue
    for (const ss of kqSubjectSlugs) {
      const subj = await db.subject.findFirst({ where: { slug: ss, classId: cc.id } })
      if (!subj) continue
      const chapters = await db.chapter.findMany({ where: { subjectId: subj.id }, orderBy: { order: 'asc' }, take: 2 })
      for (const ch of chapters) {
        const existing = await db.knowledgeQuestion.findFirst({ where: { chapterId: ch.id, type: 'knowledge' } })
        if (existing) continue
        await db.knowledgeQuestion.create({
          data: { chapterId: ch.id, type: 'knowledge', question: `${ch.name} - জ্ঞানমূলক প্রশ্ন: মূল ধারণাটি ব্যাখ্যা করো।`, answer: 'জ্ঞানমূলক প্রশ্নের উত্তর সম্পর্কিত পাঠ্যবই থেকে নেওয়া হয়েছে।', order: 1, isActive: true },
        })
        await db.knowledgeQuestion.create({
          data: { chapterId: ch.id, type: 'comprehension', question: `${ch.name} - অনুধাবনমূলক প্রশ্ন: উদাহরণসহ ব্যাখ্যা করো।`, answer: 'অনুধাবনমূলক প্রশ্নের উত্তর বিস্তারিত ব্যাখ্যাসহ।', order: 2, isActive: true, isPremium: ch.order === 1, price: 10 },
        })
      }
    }
  }
  console.log('✅ Knowledge questions seeded')

  // ── Sample Payments ──
  const payUsers = await db.user.findMany({ where: { role: 'STUDENT' }, take: 2 })
  if (payUsers.length >= 2) {
    const payMethods = ['bkash', 'nagad', 'rocket']
    for (let i = 0; i < payUsers.length; i++) {
      const existingPending = await db.payment.findFirst({ where: { userId: payUsers[i].id, status: 'pending' } })
      if (!existingPending) {
        await db.payment.create({ data: { userId: payUsers[i].id, amount: 99, method: payMethods[i], transactionId: `TXN${Date.now()}${i}`, paymentNumber: '01712345678', contentType: 'package', contentTitle: 'মাসিক প্যাকেজ', classLevel: 'ssc', status: 'pending', idempotencyKey: `seed-pending-${i}` } })
      }
      const existingApproved = await db.payment.findFirst({ where: { userId: payUsers[i].id, status: 'approved' } })
      if (!existingApproved) {
        await db.payment.create({ data: { userId: payUsers[i].id, amount: 299, method: payMethods[(i + 1) % 3], transactionId: `TXN${Date.now()}${i + 100}`, paymentNumber: '01812345678', contentType: 'package', contentTitle: 'ছয় মাসিক প্যাকেজ', classLevel: 'ssc', status: 'approved', reviewedBy: (await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } }))?.id, reviewedAt: new Date(), idempotencyKey: `seed-approved-${i}` } })
      }
    }
  }
  console.log('✅ Sample payments seeded')

  // ── Sample Notifications ──
  for (const user of await db.user.findMany({ where: { role: { not: 'SUPER_ADMIN' } }, take: 5 })) {
    const existing = await db.notification.findFirst({ where: { userId: user.id, type: 'info' } })
    if (!existing) {
      await db.notification.create({ data: { userId: user.id, title: 'স্বাগতম!', message: 'শিক্ষা বাংলায় আপনাকে স্বাগতম। আপনার পড়াশোনা শুরু করুন!', type: 'info', isRead: false } })
      await db.notification.create({ data: { userId: user.id, title: 'নতুন কন্টেন্ট', message: 'নতুন লেকচার ও MCQ যোগ করা হয়েছে।', type: 'success', isRead: false } })
    }
  }
  console.log('✅ Notifications seeded')

  // ── User Subscriptions ──
  const premiumStudent = await db.user.findFirst({ where: { email: 'sakib@student.com' } })
  const monthlyPkg = await db.contentPackage.findFirst({ where: { slug: 'monthly-package' } })
  if (premiumStudent && monthlyPkg) {
    const existing = await db.userSubscription.findFirst({ where: { userId: premiumStudent.id, packageId: monthlyPkg.id } })
    if (!existing) {
      await db.userSubscription.create({ data: { userId: premiumStudent.id, packageId: monthlyPkg.id, classLevel: 'hsc', startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true } })
    }
  }
  console.log('✅ User subscriptions seeded')

  // ── Sample Audit Logs ──
  const adminUser = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (adminUser) {
    const existing = await db.auditLog.findFirst({ where: { adminId: adminUser.id, action: 'content_create' } })
    if (!existing) {
      await db.auditLog.create({ data: { adminId: adminUser.id, action: 'content_create', entityType: 'lecture', entityId: 'seed-init', newData: { note: 'Initial seed data creation' } } })
      await db.auditLog.create({ data: { adminId: adminUser.id, action: 'user_update', entityType: 'user', entityId: adminUser.id, newData: { note: 'Super admin created during seed' } } })
    }
  }
  console.log('✅ Audit logs seeded')

  console.log('\n🎉 Seeding complete!')
}

// ────────────────────────────────────────────────────────────────────────────
//  RUN
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting comprehensive seed...\n')
  await seed()
  await seedContent()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
