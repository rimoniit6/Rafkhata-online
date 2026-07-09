'use client'

import { useEffect } from 'react'
import { useSiteConfig } from '@/hooks/use-metadata'

/**
 * Dynamically updates the browser tab favicon based on the site config.
 * Renders nothing to the DOM.
 */
export default function DynamicFavicon() {
  const { config } = useSiteConfig()

  useEffect(() => {
    if (!config?.favicon) return

    // Find existing favicon link element or create one
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    // Add cache-busting query param to force browser refresh
    const separator = config.favicon.includes('?') ? '&' : '?'
    link.href = `${config.favicon}${separator}t=${Date.now()}`
    link.type = 'image/x-icon' // Browser will figure out actual type

    // Also update apple-touch-icon if present
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel~='apple-touch-icon']")
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = config.favicon
  }, [config?.favicon])

  return null
}
