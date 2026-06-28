import { create } from 'zustand'

export type AnalyticsPeriod = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export interface DateRange {
  from: string
  to: string
}

export interface AnalyticsFilterState {
  period: AnalyticsPeriod
  dateRange: DateRange
  previousDateRange: DateRange
  granularity: 'day' | 'week' | 'month'
  setPeriod: (period: AnalyticsPeriod) => void
  setCustomRange: (from: string, to: string) => void
  setGranularity: (granularity: 'day' | 'week' | 'month') => void
}

function computeDateRange(period: AnalyticsPeriod): { dateRange: DateRange; previousDateRange: DateRange } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  const fmt = (date: Date) => date.toISOString().split('T')[0]

  switch (period) {
    case 'today': {
      const today = fmt(now)
      const yesterday = fmt(new Date(now.getTime() - 86400000))
      return { dateRange: { from: today, to: today }, previousDateRange: { from: yesterday, to: yesterday } }
    }
    case 'yesterday': {
      const yesterday = fmt(new Date(now.getTime() - 86400000))
      const dayBefore = fmt(new Date(now.getTime() - 2 * 86400000))
      return { dateRange: { from: yesterday, to: yesterday }, previousDateRange: { from: dayBefore, to: dayBefore } }
    }
    case '7d': {
      const to = fmt(now)
      const from = fmt(new Date(now.getTime() - 6 * 86400000))
      const prevFrom = fmt(new Date(now.getTime() - 13 * 86400000))
      const prevTo = fmt(new Date(now.getTime() - 7 * 86400000))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    case '30d': {
      const to = fmt(now)
      const from = fmt(new Date(now.getTime() - 29 * 86400000))
      const prevFrom = fmt(new Date(now.getTime() - 59 * 86400000))
      const prevTo = fmt(new Date(now.getTime() - 30 * 86400000))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    case '90d': {
      const to = fmt(now)
      const from = fmt(new Date(now.getTime() - 89 * 86400000))
      const prevFrom = fmt(new Date(now.getTime() - 179 * 86400000))
      const prevTo = fmt(new Date(now.getTime() - 90 * 86400000))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    case 'thisMonth': {
      const from = fmt(new Date(y, m, 1))
      const to = fmt(now)
      const prevFrom = fmt(new Date(y, m - 1, 1))
      const prevTo = fmt(new Date(y, m, 0))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    case 'lastMonth': {
      const from = fmt(new Date(y, m - 1, 1))
      const to = fmt(new Date(y, m, 0))
      const prevFrom = fmt(new Date(y, m - 2, 1))
      const prevTo = fmt(new Date(y, m - 1, 0))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    case 'thisYear': {
      const from = fmt(new Date(y, 0, 1))
      const to = fmt(now)
      const prevFrom = fmt(new Date(y - 1, 0, 1))
      const prevTo = fmt(new Date(y - 1, 11, 31))
      return { dateRange: { from, to }, previousDateRange: { from: prevFrom, to: prevTo } }
    }
    default:
      return { dateRange: { from: fmt(now), to: fmt(now) }, previousDateRange: { from: fmt(now), to: fmt(now) } }
  }
}

export const useAnalyticsStore = create<AnalyticsFilterState>()((set) => {
  const initial = computeDateRange('30d')
  return {
    period: '30d',
    dateRange: initial.dateRange,
    previousDateRange: initial.previousDateRange,
    granularity: 'day',
    setPeriod: (period) => {
      const ranges = computeDateRange(period)
      const granularity = period === 'thisYear' || period === '90d' ? 'month' : period === '30d' ? 'week' : 'day'
      set({ period, ...ranges, granularity })
    },
    setCustomRange: (from, to) => {
      const diffMs = new Date(to).getTime() - new Date(from).getTime()
      const diffDays = diffMs / 86400000
      const prevFrom = new Date(new Date(from).getTime() - diffMs - 86400000).toISOString().split('T')[0]
      const prevTo = new Date(new Date(from).getTime() - 86400000).toISOString().split('T')[0]
      const granularity = diffDays > 60 ? 'month' : diffDays > 14 ? 'week' : 'day'
      set({
        period: 'custom',
        dateRange: { from, to },
        previousDateRange: { from: prevFrom, to: prevTo },
        granularity,
      })
    },
    setGranularity: (granularity) => set({ granularity }),
  }
})
