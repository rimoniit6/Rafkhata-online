'use client'

import { getPageMeta,getSiteUrl } from '@/lib/seo'
import { useRouterStore } from '@/store/router'
import { useEffect } from 'react'

export function usePageMeta() {
  const currentRoute = useRouterStore((s) => s.currentRoute)
  const params = useRouterStore((s) => s.params)

  useEffect(() => {
    document.querySelectorAll('[data-pagemeta="true"]').forEach(el => el.remove())

    const meta = getPageMeta(currentRoute, params as Record<string, string>)
    const siteUrl = getSiteUrl()
    const canonical = params?.classSlug || params?.subjectSlug || params?.chapterSlug
      ? `${siteUrl}/${currentRoute}` + (params?.classSlug ? `/${params.classSlug}` : '') + (params?.subjectSlug ? `/${params.subjectSlug}` : '') + (params?.chapterSlug ? `/${params.chapterSlug}` : '')
      : siteUrl

    document.title = meta.title

    function createMeta(name: string, content: string) {
      const el = document.createElement('meta')
      el.setAttribute('data-pagemeta', 'true')
      if (name.startsWith('og:')) {
        el.setAttribute('property', name)
      } else {
        el.setAttribute('name', name)
      }
      el.setAttribute('content', content)
      document.head.appendChild(el)
    }

    createMeta('description', meta.description)
    if (meta.keywords) createMeta('keywords', meta.keywords)
    createMeta('og:title', meta.title)
    createMeta('og:description', meta.description)
    createMeta('og:url', canonical)
    createMeta('og:site_name', 'শিক্ষা বাংলা')
    createMeta('og:type', 'website')
    createMeta('og:image', meta.ogImage || `${siteUrl}/icon-512.png`)
    createMeta('twitter:card', 'summary_large_image')
    createMeta('twitter:title', meta.title)
    createMeta('twitter:description', meta.description)
    createMeta('twitter:image', meta.ogImage || `${siteUrl}/icon-512.png`)

    const canonicalLink = document.createElement('link')
    canonicalLink.setAttribute('rel', 'canonical')
    canonicalLink.setAttribute('href', canonical)
    canonicalLink.setAttribute('data-pagemeta', 'true')
    canonicalLink.setAttribute('aria-hidden', 'true')
    document.head.appendChild(canonicalLink)
  }, [currentRoute, params])
}
