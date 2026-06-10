'use client'

import { useEffect } from 'react'
import { useRouterStore, type RoutePath } from '@/store/router'
import { getPageMeta, getSiteUrl } from '@/lib/seo'

export function usePageMeta() {
  const { currentRoute, params } = useRouterStore()

  useEffect(() => {
    const meta = getPageMeta(currentRoute, params as Record<string, string>)
    const siteUrl = getSiteUrl()
    const canonical = params?.classSlug || params?.subjectSlug || params?.chapterSlug
      ? `${siteUrl}/${currentRoute}` + (params?.classSlug ? `/${params.classSlug}` : '') + (params?.subjectSlug ? `/${params.subjectSlug}` : '') + (params?.chapterSlug ? `/${params.chapterSlug}` : '')
      : siteUrl

    document.title = meta.title

    function setMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        if (name.startsWith('og:')) {
          el.setAttribute('property', name)
        } else {
          el.setAttribute('name', name)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', meta.description)
    if (meta.keywords) setMeta('keywords', meta.keywords)
    setMeta('og:title', meta.title)
    setMeta('og:description', meta.description)
    setMeta('og:url', canonical)
    setMeta('og:site_name', 'শিক্ষা বাংলা')
    setMeta('og:type', 'website')
    setMeta('og:image', meta.ogImage || `${siteUrl}/icon-512.png`)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', meta.title)
    setMeta('twitter:description', meta.description)
    setMeta('twitter:image', meta.ogImage || `${siteUrl}/icon-512.png`)

    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonical)
  }, [currentRoute, params])
}
