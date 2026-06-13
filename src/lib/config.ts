import { db } from './db'

export type AppSetting = 'maxUploadSize' | 'premiumDurationDays'

const defaultConfig: Record<AppSetting, string> = {
  maxUploadSize: String(10 * 1024 * 1024),
  premiumDurationDays: '30',
}

let cached: Record<string, string> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

async function loadConfig(): Promise<Record<string, string>> {
  if (cached && Date.now() - cacheTimestamp < CACHE_TTL) return cached
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['maxUploadSize', 'premiumDurationDays'] } },
    })
    cached = { ...defaultConfig }
    for (const s of settings) {
      cached[s.key] = s.value
    }
    cacheTimestamp = Date.now()
    return cached
  } catch {
    return { ...defaultConfig }
  }
}

export async function getAppConfig(): Promise<Record<string, string>> {
  return loadConfig()
}

export function invalidateAppConfigCache(): void {
  cached = null
  cacheTimestamp = 0
}

export { loadConfig as reloadAppConfig }
