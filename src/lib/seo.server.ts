import "server-only"

import { getPageMeta } from "@/lib/seo"
import type { PageMeta } from "@/lib/seo"
import type { RoutePath } from "@/store/router"

/**
 * Server-only: fetch per-page SEO metadata from SiteSetting DB table.
 * Falls back to hardcoded routeMeta if no DB entry exists.
 */
export async function getServerPageMeta(
  route: string,
  params?: Record<string, string>,
): Promise<PageMeta> {
  try {
    const { db } = await import("@/lib/db")
    const prefix = `seo_page_${route}_`
    const settings = await db.siteSetting.findMany({
      where: { key: { startsWith: prefix } },
      select: { key: true, value: true },
    })
    const dbMeta: Record<string, string> = {}
    for (const s of settings) {
      const field = s.key.replace(prefix, "")
      dbMeta[field] = s.value
    }

    if (dbMeta.title || dbMeta.description) {
      const meta: PageMeta = {
        title: dbMeta.title || "",
        description: dbMeta.description || "",
      }
      if (dbMeta.keywords) meta.keywords = dbMeta.keywords
      if (dbMeta.ogImage) meta.ogImage = dbMeta.ogImage
      return getPageMeta(route as RoutePath, params, meta)
    }
  } catch {
    // DB unavailable — fall through to hardcoded
  }

  return getPageMeta(route as RoutePath, params)
}