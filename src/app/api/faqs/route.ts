import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET() {
  try {
    const faqs = await db.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ faqs }, { headers: cacheHeaders.public.long })
  } catch (error) {
    console.error('Get FAQs error:', error)
    return NextResponse.json(
      { error: 'FAQ এর তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
