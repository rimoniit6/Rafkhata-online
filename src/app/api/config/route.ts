import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Helper to safely parse JSON strings (returns fallback on failure)
function safeJSONParse(str: string | undefined | null, fallback: string[] = []): string[] {
  if (!str) return fallback
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

// GET /api/config - Public site configuration
// Returns site name, description, contact info, social links, payment accounts, UI content, homepage sections, and messages
export async function GET() {
  const defaultConfig = {
    siteName: 'শিক্ষা বাংলা',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    facebook: '',
    youtube: '',
    telegram: '',
    bkash: '',
    nagad: '',
    rocket: '',
    logo: '',
    favicon: '',
    // DB-driven UI content fields
    heroBadge: '',
    heroTitle: '',
    heroSubtitle: '',
    statsSubtitle: '',
    footerDescription: '',
    premiumFeatures: [] as string[],
    mcqFeatures: [] as string[],
    searchSuggestions: [] as string[],
    // Homepage section text
    homepageClassesBadge: '',
    homepageClassesTitle: '',
    homepageClassesSubtitle: '',
    homepageBoardTitle: '',
    homepageBoardSubtitle: '',
    homepageMcqTitle: '',
    homepageMcqSubtitle: '',
    homepageFaqTitle: '',
    homepageFaqSubtitle: '',
    homepageTestimonialsTitle: '',
    homepageTestimonialsSubtitle: '',
    homepageStatsTitle: '',
    homepageStatsSubtitle: '',
    homepageFeaturedTitle: '',
    homepageFeaturedSubtitle: '',
    homepagePremiumTitle: '',
    homepagePremiumSubtitle: '',
    // Admin-controllable empty state messages
    messages: {
      contentComingSoon: 'কন্টেন্ট শীঘ্রই আসবে',
      chaptersComingSoon: 'এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে',
      chapterContentSoon: 'এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে',
      mcqComingSoon: 'শীঘ্রই নতুন প্রশ্ন যোগ করা হবে',
      cqComingSoon: 'শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে',
      lectureComingSoon: 'শীঘ্রই নতুন লেকচার যোগ করা হবে',
      boardComingSoon: 'শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে',
      contentLoadError: 'কন্টেন্ট লোড করতে সমস্যা হয়েছে',
      contentTypeSoon: 'শীঘ্রই কন্টেন্ট আসবে',
      noQuestionsFound: 'কোনো প্রশ্ন পাওয়া যায়নি',
      footerClassesSoon: 'শীঘ্রই শ্রেণি যোগ করা হবে',
      footerContactSoon: 'শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে',
      subjectsComingSoon: 'এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে',
    } as Record<string, string>,
  }

  try {
    const settings = await db.siteSetting.findMany()
    const config: Record<string, string> = {}
    for (const s of settings) {
      config[s.key] = s.value
    }

    return NextResponse.json({
      success: true,
      data: {
        siteName: config.siteName || defaultConfig.siteName,
        siteDescription: config.siteDescription || '',
        contactEmail: config.contactEmail || '',
        contactPhone: config.contactPhone || '',
        contactAddress: config.contactAddress || '',
        facebook: config.facebook || '',
        youtube: config.youtube || '',
        telegram: config.telegram || '',
        bkash: config.bkash || config.default_bkash_number || '',
        nagad: config.nagad || config.default_nagad_number || '',
        rocket: config.rocket || config.default_rocket_number || '',
        logo: config.logo || '',
        favicon: config.favicon || '',
        // DB-driven UI content fields
        heroBadge: config.heroBadge || config.homepage_hero_badge || '',
        heroTitle: config.heroTitle || config.homepage_hero_title || '',
        heroSubtitle: config.heroSubtitle || config.homepage_hero_subtitle || '',
        statsSubtitle: config.statsSubtitle || config.homepage_stats_subtitle || '',
        footerDescription: config.footerDescription || '',
        premiumFeatures: safeJSONParse(config.premiumFeatures),
        mcqFeatures: safeJSONParse(config.mcqFeatures),
        searchSuggestions: safeJSONParse(config.searchSuggestions),
        // Homepage section text (from SiteSetting keys)
        homepageClassesBadge: config.homepage_classes_badge || '',
        homepageClassesTitle: config.homepage_classes_title || '',
        homepageClassesSubtitle: config.homepage_classes_subtitle || '',
        homepageBoardTitle: config.homepage_board_title || '',
        homepageBoardSubtitle: config.homepage_board_subtitle || '',
        homepageMcqTitle: config.homepage_mcq_title || '',
        homepageMcqSubtitle: config.homepage_mcq_subtitle || '',
        homepageFaqTitle: config.homepage_faq_title || '',
        homepageFaqSubtitle: config.homepage_faq_subtitle || '',
        homepageTestimonialsTitle: config.homepage_testimonials_title || '',
        homepageTestimonialsSubtitle: config.homepage_testimonials_subtitle || '',
        homepageStatsTitle: config.homepage_stats_title || '',
        homepageStatsSubtitle: config.homepage_stats_subtitle || config.statsSubtitle || '',
        homepageFeaturedTitle: config.homepage_featured_title || '',
        homepageFeaturedSubtitle: config.homepage_featured_subtitle || '',
        homepagePremiumTitle: config.homepage_premium_title || '',
        homepagePremiumSubtitle: config.homepage_premium_subtitle || '',
        // Admin-controllable empty state messages (from SiteSetting keys starting with 'msg')
        messages: {
          contentComingSoon: config.msg_contentComingSoon || config.msgContentComingSoon || defaultConfig.messages.contentComingSoon,
          chaptersComingSoon: config.msg_chaptersComingSoon || config.msgChaptersComingSoon || defaultConfig.messages.chaptersComingSoon,
          chapterContentSoon: config.msg_chapterContentSoon || config.msgChapterContentSoon || defaultConfig.messages.chapterContentSoon,
          mcqComingSoon: config.msg_mcqComingSoon || config.msgMcqComingSoon || defaultConfig.messages.mcqComingSoon,
          cqComingSoon: config.msg_cqComingSoon || config.msgCqComingSoon || defaultConfig.messages.cqComingSoon,
          lectureComingSoon: config.msg_lectureComingSoon || config.msgLectureComingSoon || defaultConfig.messages.lectureComingSoon,
          boardComingSoon: config.msg_boardComingSoon || config.msgBoardComingSoon || defaultConfig.messages.boardComingSoon,
          contentLoadError: config.msg_contentLoadError || config.msgContentLoadError || defaultConfig.messages.contentLoadError,
          contentTypeSoon: config.msg_contentTypeSoon || config.msgContentTypeSoon || defaultConfig.messages.contentTypeSoon,
          noQuestionsFound: config.msg_noQuestionsFound || config.msgNoQuestionsFound || defaultConfig.messages.noQuestionsFound,
          footerClassesSoon: config.msg_footerClassesSoon || config.msgFooterClassesSoon || defaultConfig.messages.footerClassesSoon,
          footerContactSoon: config.msg_footerContactSoon || config.msgFooterContactSoon || defaultConfig.messages.footerContactSoon,
          subjectsComingSoon: config.msg_subjectsComingSoon || config.msgSubjectsComingSoon || defaultConfig.messages.subjectsComingSoon,
        },
      },
    })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json({ success: true, data: defaultConfig })
  }
}
