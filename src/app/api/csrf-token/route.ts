import { NextResponse } from 'next/server'
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf'

export async function GET() {
  try {
    const token = await generateCsrfToken()
    await setCsrfCookie(token)
    return NextResponse.json(
      { token },
      {
        headers: {
          'Access-Control-Expose-Headers': 'x-csrf-token',
          'x-csrf-token': token,
        },
      }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'CSRF টোকেন জেনারেট করতে ব্যর্থ' },
      { status: 500 }
    )
  }
}