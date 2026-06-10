import type { RoutePath } from '@/store/router'

export interface PageMeta {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  canonical?: string
}

const SITE_NAME = 'শিক্ষা বাংলা'
const DEFAULT_DESC = 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।'
const DEFAULT_KEYWORDS = 'শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ'

export const routeMeta: Record<string, PageMeta> = {
  home: {
    title: `${SITE_NAME} - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম`,
    description: DEFAULT_DESC,
    keywords: DEFAULT_KEYWORDS,
  },
  login: {
    title: `লগইন করুন - ${SITE_NAME}`,
    description: 'আপনার শিক্ষা বাংলা অ্যাকাউন্টে লগইন করুন এবং পড়া শুরু করুন।',
  },
  register: {
    title: `নিবন্ধন করুন - ${SITE_NAME}`,
    description: 'নতুন অ্যাকাউন্ট খুলুন এবং বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্মে পড়া শুরু করুন।',
  },
  'forgot-password': {
    title: `পাসওয়ার্ড রিসেট - ${SITE_NAME}`,
    description: 'আপনার পাসওয়ার্ড ভুলে গেছেন? সহজেই পাসওয়ার্ড রিসেট করুন।',
  },
  search: {
    title: `সার্চ ফলাফল - ${SITE_NAME}`,
    description: 'আপনার পছন্দের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও অন্যান্য কন্টেন্ট খুঁজুন।',
  },
  'class-list': {
    title: `ক্লাস সমূহ - ${SITE_NAME}`,
    description: 'Class 6 থেকে HSC পর্যন্ত সকল ক্লাসের বিষয় ও কন্টেন্ট দেখুন।',
  },
  'class-detail': {
    title: `ক্লাস ডিটেলস - ${SITE_NAME}`,
    description: 'আপনার ক্লাসের সকল বিষয়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।',
  },
  'subject-detail': {
    title: `বিষয় ডিটেলস - ${SITE_NAME}`,
    description: 'বিষয়ের সকল অধ্যায়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।',
  },
  'chapter-detail': {
    title: `অধ্যায় - ${SITE_NAME}`,
    description: 'অধ্যায়ের সকল লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন এবং পড়া শুরু করুন।',
  },
  'lecture-list': {
    title: `লেকচার সমূহ - ${SITE_NAME}`,
    description: 'সকল লেকচার দেখুন এবং আপনার পড়া শুরু করুন।',
  },
  'lecture-viewer': {
    title: `লেকচার ভিউয়ার - ${SITE_NAME}`,
    description: 'লেকচার দেখুন এবং নোট নিন।',
  },
  'mcq-practice': {
    title: `MCQ প্র্যাকটিস - ${SITE_NAME}`,
    description: 'MCQ প্র্যাকটিস করুন এবং আপনার প্রস্তুতি যাচাই করুন।',
  },
  'mcq-exam': {
    title: `MCQ পরীক্ষা - ${SITE_NAME}`,
    description: 'সময় বাঁধাই MCQ পরীক্ষা দিন এবং আপনার ফলাফল দেখুন।',
  },
  'mcq-result': {
    title: `MCQ ফলাফল - ${SITE_NAME}`,
    description: 'আপনার MCQ পরীক্ষার ফলাফল ও বিশ্লেষণ দেখুন।',
  },
  'cq-list': {
    title: `সৃজনশীল প্রশ্ন - ${SITE_NAME}`,
    description: 'সৃজনশীল প্রশ্ন দেখুন এবং সমাধান করুন।',
  },
  'cq-viewer': {
    title: `সৃজনশীল প্রশ্ন ভিউয়ার - ${SITE_NAME}`,
    description: 'সৃজনশীল প্রশ্ন দেখুন এবং উত্তর লিখুন।',
  },
  'board-questions': {
    title: `বোর্ড প্রশ্ন - ${SITE_NAME}`,
    description: 'পূর্বের বছরের বোর্ড পরীক্ষার প্রশ্ন দেখুন এবং প্র্যাকটিস করুন।',
  },
  notices: {
    title: `নোটিশ - ${SITE_NAME}`,
    description: 'সকল নোটিশ ও গুরুত্বপূর্ণ তথ্য দেখুন।',
  },
  'notice-detail': {
    title: `নোটিশ - ${SITE_NAME}`,
    description: 'নোটিশ বিস্তারিত পড়ুন।',
  },
  suggestions: {
    title: `সাজেশন - ${SITE_NAME}`,
    description: 'পরীক্ষার সাজেশন ও গুরুত্বপূর্ণ টপিক দেখুন।',
  },
  'suggestion-detail': {
    title: `সাজেশন - ${SITE_NAME}`,
    description: 'সাজেশন বিস্তারিত পড়ুন।',
  },
  premium: {
    title: `প্রিমিয়াম - ${SITE_NAME}`,
    description: 'প্রিমিয়াম সাবস্ক্রিপশন ও বান্ডেল কিনুন এবং সব কন্টেন্ট আনলক করুন।',
  },
  payment: {
    title: `পেমেন্ট - ${SITE_NAME}`,
    description: 'আপনার পেমেন্ট সম্পন্ন করুন।',
  },
  'user-dashboard': {
    title: `ড্যাশবোর্ড - ${SITE_NAME}`,
    description: 'আপনার ড্যাশবোর্ড থেকে পড়ার অগ্রগতি ও অন্যান্য তথ্য দেখুন।',
  },
  'exam-center': {
    title: `পরীক্ষা সেন্টার - ${SITE_NAME}`,
    description: 'আপনার পরীক্ষা ও ফলাফল দেখুন।',
  },
  'mcq-exam-package-list': {
    title: `MCQ পরীক্ষা প্যাকেজ - ${SITE_NAME}`,
    description: 'MCQ পরীক্ষার প্যাকেজ সমূহ দেখুন এবং অংশ নিন।',
  },
  'mcq-exam-package-detail': {
    title: `MCQ পরীক্ষা প্যাকেজ - ${SITE_NAME}`,
    description: 'MCQ পরীক্ষার প্যাকেজ বিস্তারিত দেখুন।',
  },
  'mcq-exam-history': {
    title: `পরীক্ষার ইতিহাস - ${SITE_NAME}`,
    description: 'আপনার পূর্বের পরীক্ষাগুলোর ফলাফল দেখুন।',
  },
}

export function getPageMeta(route: RoutePath, params?: Record<string, string>): PageMeta {
  const base = routeMeta[route]
  if (!base) {
    return {
      title: `${SITE_NAME} - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম`,
      description: DEFAULT_DESC,
    }
  }

  const meta = { ...base }

  if (params?.searchQuery && route === 'search') {
    meta.title = `"${params.searchQuery}" - সার্চ ফলাফল - ${SITE_NAME}`
    meta.description = `"${params.searchQuery}" এর জন্য সার্চ ফলাফল। ${DEFAULT_DESC}`
  }

  if (params?.contentTitle && ['premium', 'payment'].includes(route)) {
    meta.title = `${params.contentTitle} - ${SITE_NAME}`
    meta.description = `${params.contentTitle} - ${meta.description}`
  }

  if (params?.classSlug && route === 'class-detail') {
    meta.title = `${params.classSlug} - ক্লাস ডিটেলস - ${SITE_NAME}`
  }

  if (params?.subjectSlug && route === 'subject-detail') {
    meta.title = `${params.subjectSlug} - বিষয় ডিটেলস - ${SITE_NAME}`
  }

  if (params?.chapterSlug && route === 'chapter-detail') {
    meta.title = `${params.chapterSlug} - অধ্যায় - ${SITE_NAME}`
  }

  return meta
}

export function getSiteUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'
}
