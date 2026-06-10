import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST - Creates or updates the super admin from .env credentials
// This endpoint is special: it allows creation even when NO super admin exists (bootstrap scenario)
export async function POST(request: Request) {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL
    const password = process.env.SUPER_ADMIN_PASSWORD

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'সুপার অ্যাডমিন ক্রেডেনশিয়াল .env ফাইলে কনফিগার করা নেই। SUPER_ADMIN_EMAIL ও SUPER_ADMIN_PASSWORD সেট করুন।' },
        { status: 500 }
      )
    }

    // Check if any super admin already exists
    const existingSuperAdmin = await db.user.findFirst({ where: { role: 'super_admin' } })

    if (existingSuperAdmin && existingSuperAdmin.email !== email) {
      // A different super admin exists — require super admin auth to change
      // For security, we verify the request is from the existing super admin
      const { requireSuperAdmin } = await import('@/lib/auth')
      const auth = await requireSuperAdmin(request)
      if (!auth) {
        return NextResponse.json(
          { success: false, error: 'অন্য একটি সুপার অ্যাডমিন আছে। পরিবর্তন করতে বর্তমান সুপার অ্যাডমিন হিসেবে লগইন করুন।', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
    }

    const { hashPassword } = await import('@/lib/password')
    const hashedPassword = hashPassword(password)
    const existing = await db.user.findUnique({ where: { email } })

    if (existing) {
      const updated = await db.user.update({
        where: { email },
        data: { role: 'super_admin', password: hashedPassword, name: existing.name || 'Super Admin', isVerified: true },
      })
      return NextResponse.json({ success: true, data: { message: 'সুপার অ্যাডমিন আপডেট হয়েছে', user: { id: updated.id, email: updated.email, role: updated.role } } })
    }

    const created = await db.user.create({
      data: { email, name: 'Super Admin', password: hashedPassword, role: 'super_admin', isVerified: true },
    })
    return NextResponse.json({ success: true, data: { message: 'সুপার অ্যাডমিন তৈরি হয়েছে', user: { id: created.id, email: created.email, role: created.role } } })
  } catch (error) {
    console.error('Ensure super admin error:', error)
    return NextResponse.json({ success: false, error: 'সুপার অ্যাডমিন তৈরি/আপডেট করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}

// GET - Check if super admin exists and return config info
export async function GET() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL

    if (!email) {
      return NextResponse.json({
        success: true,
        data: {
          configured: false,
          exists: false,
          email: null,
          isSuperAdmin: false,
          message: '.env ফাইলে SUPER_ADMIN_EMAIL ও SUPER_ADMIN_PASSWORD সেট করা হয়নি',
        },
      })
    }

    const existing = await db.user.findUnique({ where: { email } })

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        exists: !!existing,
        email,
        isSuperAdmin: existing?.role === 'super_admin',
        message: existing
          ? existing.role === 'super_admin'
            ? 'সুপার অ্যাডমিন সক্রিয় আছে'
            : 'অ্যাকাউন্ট আছে কিন্তু সুপার অ্যাডমিন নয়'
          : 'সুপার অ্যাডমিন তৈরি হয়নি',
      },
    })
  } catch (error) {
    console.error('Check super admin error:', error)
    return NextResponse.json({ success: false, data: { exists: false, configured: false } }, { status: 500 })
  }
}
