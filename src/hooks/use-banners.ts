'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'
import { queryKeys } from '@/lib/query-keys'

export interface BannerData {
  id: string
  title: string
  subtitle: string | null
  image?: string | null
  link: string | null
  buttonText: string | null
  isActive: boolean
  order: number
  startDate?: string | null
  endDate?: string | null
}

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners,
    queryFn: async () => {
      const json = await fetchJSON<{ banners?: BannerData[] }>('/api/banners')
      return json.banners || []
    },
  })
}
