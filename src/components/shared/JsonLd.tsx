'use client'

import { useEffect } from 'react'
import { useRouterStore } from '@/store/router'
import { getSiteUrl } from '@/lib/seo'

export function OrganizationSchema() {
  const siteUrl = getSiteUrl()
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'শিক্ষা বাংলা',
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    description: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।',
    address: { '@type': 'PostalAddress', addressCountry: 'BD' },
    sameAs: [
      'https://facebook.com/sikkhabangla',
      'https://youtube.com/@sikkhabangla',
      'https://t.me/sikkhabangla',
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

export function WebsiteSchema() {
  const siteUrl = getSiteUrl()
  const json = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'শিক্ষা বাংলা',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

export function FAQSchema({ questions }: { questions: Array<{ question: string; answer: string }> }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

export function EducationalOccupationalProgramSchema({
  name, description, provider, url,
}: {
  name: string; description: string; provider: string; url: string
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name,
    description,
    url,
    provider: { '@type': 'Organization', name: provider },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

export default function GlobalStructuredData() {
  const { currentRoute } = useRouterStore()

  useEffect(() => {
    const existing = document.getElementById('seo-schema')
    if (existing) existing.remove()

    if (currentRoute === 'home') {
      const script = document.createElement('script')
      script.id = 'seo-schema'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: 'শিক্ষা বাংলা',
            url: getSiteUrl(),
            logo: `${getSiteUrl()}/icon-512.png`,
            description: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।',
            sameAs: [
              'https://facebook.com/sikkhabangla',
              'https://youtube.com/@sikkhabangla',
              'https://t.me/sikkhabangla',
            ],
          },
          {
            '@type': 'WebSite',
            name: 'শিক্ষা বাংলা',
            url: getSiteUrl(),
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${getSiteUrl()}/search?q={search_term_string}` },
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      })
      document.head.appendChild(script)
    }
  }, [currentRoute])

  return null
}
