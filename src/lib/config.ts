export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || ''

export const APP_CONFIG = {
  maxUploadSize: 10 * 1024 * 1024,
  premiumDurationDays: 30,
} as const
