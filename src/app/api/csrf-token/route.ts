import { NextResponse } from 'next/server'
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf'

export async function GET() {
  try {
    const token = await generateCsrfToken()
    await setCsrfCookie(token)
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 })
  }
}