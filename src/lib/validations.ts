import { z } from 'zod'

// ============ PAYMENT SCHEMAS ============

export const createPaymentSchema = z.object({
  amount: z.number().positive('পরিমাণ অবশ্যই ধনাত্মক হতে হবে'),
  method: z.enum(['bkash', 'nagad', 'rocket'] as const, { message: 'অবৈধ পেমেন্ট মেথড' }),
  transactionId: z.string().min(1, 'ট্রানজেকশন আইডি প্রয়োজন').max(100),
  paymentNumber: z.string().min(1, 'পেমেন্ট নম্বর প্রয়োজন').max(20),
  screenshot: z.string().optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  contentTitle: z.string().optional(),
  classLevel: z.string().optional(), // For package purchases: which class the user selected
  idempotencyKey: z.string().min(1, 'ইডেমপটেন্সি কি প্রয়োজন').max(64).optional(), // Client-generated unique key for idempotency
})

export const reviewPaymentSchema = z.object({
  id: z.string().min(1, 'পেমেন্ট ID আবশ্যক'),
  status: z.enum(['approved', 'rejected'] as const, { message: 'স্ট্যাটাস approved বা rejected হতে হবে' }),
  adminNote: z.string().optional(),
})

// ============ CONTENT SCHEMAS ============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const mcqSchema = z.object({
  question: z.string().min(1, 'প্রশ্ন লিখুন'),
  optionA: z.string().min(1, 'অপশন A লিখুন'),
  optionB: z.string().min(1, 'অপশন B লিখুন'),
  optionC: z.string().min(1, 'অপশন C লিখুন'),
  optionD: z.string().min(1, 'অপশন D লিখুন'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D'] as const, { message: 'সঠিক উত্তর A, B, C, বা D হতে হবে' }),
  explanation: z.string().optional(),
  chapterId: z.string().min(1, 'অধ্যায় নির্বাচন করুন'),
  classLevel: z.string().min(1, 'শ্রেণি নির্বাচন করুন'),
  subjectId: z.string().min(1, 'বিষয় নির্বাচন করুন'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).default(0),
})

export const cqSchema = z.object({
  uddeepok: z.string().min(1, 'উদ্দীপক লিখুন'),
  question1: z.string().min(1, 'প্রশ্ন ১ লিখুন'),
  question2: z.string().min(1, 'প্রশ্ন ২ লিখুন'),
  question3: z.string().min(1, 'প্রশ্ন ৩ লিখুন'),
  question4: z.string().min(1, 'প্রশ্ন ৪ লিখুন'),
  answer1: z.string().min(1, 'উত্তর ১ লিখুন'),
  answer2: z.string().min(1, 'উত্তর ২ লিখুন'),
  answer3: z.string().min(1, 'উত্তর ৩ লিখুন'),
  answer4: z.string().min(1, 'উত্তর ৪ লিখুন'),
  chapterId: z.string().min(1, 'অধ্যায় নির্বাচন করুন'),
  classLevel: z.string().min(1, 'শ্রেণি নির্বাচন করুন'),
  subjectId: z.string().min(1, 'বিষয় নির্বাচন করুন'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).default(0),
})

// ============ USER SCHEMAS ============

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  institute: z.string().optional(),
  classLevel: z.string().optional(),
  board: z.string().optional(),
  avatar: z.string().optional(),
})

// ============ DATABASE SCHEMAS ============

export const databaseResetSchema = z.object({
  confirmation: z.literal('DELETE_ALL_DATA_CONFIRMED', {
    message: 'কনফারমেশন স্ট্রিং মেলেনি',
  }),
})
