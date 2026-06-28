import { db } from '@/lib/db'
import { apiResponse } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      eventType,
      eventName,
      userId,
      entityType,
      entityId,
      metadata,
      sessionId,
      deviceType,
      browser,
      os,
      screenRes,
      duration,
      value,
      url,
      referrer,
    } = body

    if (!eventType || !eventName) {
      return apiResponse({ success: true }, 200)
    }

    await db.analyticsEvent.create({
      data: {
        eventType,
        eventName,
        userId: userId || null,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || undefined,
        sessionId: sessionId || null,
        deviceType: deviceType || null,
        browser: browser || null,
        os: os || null,
        screenRes: screenRes || null,
        duration: duration ? parseInt(duration) : null,
        value: value ? parseFloat(value) : null,
        url: url || null,
        referrer: referrer || null,
      },
    })

    return apiResponse({ success: true }, 201)
  } catch (error) {
    return handleApiError(error, 'Track Event')
  }
}
