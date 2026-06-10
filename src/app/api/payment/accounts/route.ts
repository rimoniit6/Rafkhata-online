import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Public endpoint — returns only payment-related account numbers
// This is needed so the PaymentPage can show real bKash/Nagad/Rocket numbers
// without requiring admin authentication
export async function GET() {
  try {
    const paymentKeys = ['bkash', 'nagad', 'rocket']
    const settings = await db.siteSetting.findMany({
      where: {
        key: { in: paymentKeys },
      },
    })

    const accounts: Record<string, string> = {
      bkash: '017XXXXXXXX',
      nagad: '018XXXXXXXX',
      rocket: '016XXXXXXXX',
    }

    for (const setting of settings) {
      if (setting.value) {
        accounts[setting.key] = setting.value
      }
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Get payment accounts error:', error)
    // Return fallback accounts even on error
    return NextResponse.json({
      accounts: {
        bkash: '017XXXXXXXX',
        nagad: '018XXXXXXXX',
        rocket: '016XXXXXXXX',
      },
    })
  }
}
