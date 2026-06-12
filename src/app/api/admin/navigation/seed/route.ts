import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { withCsrf } from '@/lib/api-utils'

const DEFAULT_NAVIGATION_ITEMS = [
  // Header nav items
  { label: 'হোম', route: 'home', icon: 'BookOpen', location: 'header', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 4, isAuthOnly: false, isAdminOnly: false },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 5, isAuthOnly: false, isAdminOnly: false },
  { label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 6, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 7, isAuthOnly: false, isAdminOnly: false },
  { label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 8, isAuthOnly: false, isAdminOnly: true },

  // Bottom nav items
  { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true, isAdminOnly: false },

  // Footer nav items
  { label: 'হোম', route: 'home', icon: 'BookOpen', location: 'footer', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4, isAuthOnly: false, isAdminOnly: false },
]

// POST /api/admin/navigation/seed — seed default navigation items (super_admin only)
export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 403 })
    }

    let created = 0
    let skipped = 0

    for (const navItem of DEFAULT_NAVIGATION_ITEMS) {
      // Check if a navigation item with the same label + route + location already exists
      const existing = await db.navigation.findFirst({
        where: {
          label: navItem.label,
          route: navItem.route,
          location: navItem.location,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await db.navigation.create({
        data: navItem,
      })
      created++
    }

    return NextResponse.json({
      success: true,
      message: `${created}টি তৈরি, ${skipped}টি আগে থেকেই আছে`,
      created,
      skipped,
    })
  } catch (error) {
    console.error('[Admin Navigation Seed] POST error:', error)
    return NextResponse.json(
      { error: 'নেভিগেশন seed করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
