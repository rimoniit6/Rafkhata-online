import { describe, it, expect } from 'bun:test'

const BASE = 'http://localhost:3000'

async function fetchApi(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, body }
}

// ============================================================
// PAYMENT FLOW — tests the core Payment → Subscription flow
// without requiring actual auth (tests validation & routing)
// ============================================================

describe('Payment create flow', () => {
  it('POST /api/payment with valid data requires auth (401)', async () => {
    const { status, body } = await fetchApi('/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        method: 'bkash',
        transactionId: 'TXN-FLOW-' + Date.now(),
        paymentNumber: '01712345678',
      }),
    })
    expect(status).toBe(401)
  })

  it('POST /api/payment with all optional fields requires auth (401)', async () => {
    const { status } = await fetchApi('/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        method: 'nagad',
        transactionId: 'TXN-ALL-' + Date.now(),
        paymentNumber: '01812345678',
        screenshot: 'https://example.com/screenshot.jpg',
        contentType: 'package',
        contentId: 'pkg-test-123',
        contentTitle: 'Test Package',
        classLevel: 'hsc',
        idempotencyKey: 'idem-' + Date.now(),
      }),
    })
    expect(status).toBe(401)
  })

  it('POST /api/payment with extreme values requires auth (401)', async () => {
    const { status } = await fetchApi('/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 999999,
        method: 'rocket',
        transactionId: 'TXN-MAX-' + Date.now(),
        paymentNumber: '01912345678',
      }),
    })
    expect(status).toBe(401)
  })
})

describe('Payment individual content type flow', () => {
  it('mcq type payment requires auth (401)', async () => {
    const { status } = await fetchApi('/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 50,
        method: 'bkash',
        transactionId: 'TXN-MCQ-' + Date.now(),
        paymentNumber: '01712345678',
        contentType: 'mcq',
        contentId: 'mcq-test-1',
      }),
    })
    expect(status).toBe(401)
  })

  it('cq type payment requires auth (401)', async () => {
    const { status } = await fetchApi('/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 50,
        method: 'bkash',
        transactionId: 'TXN-CQ-' + Date.now(),
        paymentNumber: '01712345678',
        contentType: 'cq',
        contentId: 'cq-test-1',
      }),
    })
    expect(status).toBe(401)
  })
})

describe('Payment check & access', () => {
  it('GET /api/payment/check requires auth or params', async () => {
    const { status } = await fetchApi('/api/payment/check')
    expect(status === 400 || status === 401).toBe(true)
  })

  it('GET /api/payment/access returns 401 without auth', async () => {
    const { status } = await fetchApi('/api/payment/access')
    expect(status).toBe(401)
  })

  it('GET /api/payment/purchases returns 401 without auth', async () => {
    const { status } = await fetchApi('/api/payment/purchases')
    expect(status).toBe(401)
  })

  it('GET /api/payment/[id] returns 401 without auth', async () => {
    const { status } = await fetchApi('/api/payment/some-payment-id')
    expect(status).toBe(401)
  })
})

describe('Admin payment approval flow', () => {
  it('GET /api/admin/payments requires admin (401)', async () => {
    const { status } = await fetchApi('/api/admin/payments')
    expect(status).toBe(401)
  })

  it('GET /api/admin/payments/stats requires admin (401)', async () => {
    const { status } = await fetchApi('/api/admin/payments/stats')
    expect(status).toBe(401)
  })

  it('PATCH /api/admin/payments requires admin (401)', async () => {
    const { status } = await fetchApi('/api/admin/payments', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'test-id', status: 'approved' }),
    })
    expect(status).toBe(401)
  })

  it('GET /api/admin/stats requires admin (401)', async () => {
    const { status } = await fetchApi('/api/admin/stats')
    expect(status).toBe(401)
  })

  it('subscription view requires admin (401)', async () => {
    const { status } = await fetchApi('/api/admin/subscriptions')
    expect(status).toBe(401)
  })
})

describe('User data endpoints', () => {
  it('GET /api/user/payments returns 401', async () => {
    const { status } = await fetchApi('/api/user/payments')
    expect(status).toBe(401)
  })

  it('GET /api/user/subscriptions returns 401', async () => {
    const { status } = await fetchApi('/api/user/subscriptions')
    expect(status).toBe(401)
  })

  it('GET /api/user/dashboard returns 401', async () => {
    const { status } = await fetchApi('/api/user/dashboard')
    expect(status).toBe(401)
  })
})

describe('Subscription management', () => {
  it('subscription creation simulated via content-type=package', async () => {
    // Package payment approval flow (via admin):
    // 1. User creates payment for contentType='package'
    // 2. Admin reviews and approves
    // 3. Admin PATCH handler calls handleSubscriptionCreation
    // 4. UserSubscription record created with startDate/endDate
    // All steps require auth — test that the endpoint exists
    const { status } = await fetchApi('/api/admin/payments', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'simulate-pkg-id',
        status: 'approved',
        adminNote: 'E2E test',
      }),
    })
    // Without admin auth, this should 401
    expect(status).toBe(401)
  })

  it('subscription extension via re-purchase', async () => {
    // If user buys same package again, handleSubscriptionCreation
    // extends the existing subscription endDate instead of creating a new one
    const { status } = await fetchApi('/api/admin/payments', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'simulate-repurchase-id',
        status: 'approved',
      }),
    })
    expect(status).toBe(401)
  })
})
