'use client'

import { useQuery } from '@tanstack/react-query'
import { useAnalyticsStore } from '@/store/analytics'
import { queryKeys } from '@/lib/query-keys'
import type {
  AnalyticsRevenue,
  AnalyticsStudents,
  RetentionData,
  ConversionFunnel,
  DropOffData,
  CourseAnalytics,
  LectureAnalytics,
  McqAnalytics,
  CqAnalytics,
  PaymentAnalytics,
  AcquisitionData,
  SearchAnalytics,
  DeviceAnalytics,
  GeoAnalytics,
  RealtimeData,
  AiInsight,
  PredictionData,
  AlertData,
  AnalyticsSection,
} from '@/types/analytics'

type AnalyticsParams = Record<string, string>

function buildParams(): AnalyticsParams {
  const { dateRange, previousDateRange } = useAnalyticsStore()
  return {
    from: dateRange.from,
    to: dateRange.to,
    prevFrom: previousDateRange.from,
    prevTo: previousDateRange.to,
  }
}

function useParams(): AnalyticsParams {
  const { dateRange, previousDateRange } = useAnalyticsStore()
  return {
    from: dateRange.from,
    to: dateRange.to,
    prevFrom: previousDateRange.from,
    prevTo: previousDateRange.to,
  }
}

function fetchAnalytics<T>(endpoint: string, params: AnalyticsParams): Promise<T> {
  const searchParams = new URLSearchParams(params)
  return fetch(`/api/admin/analytics/${endpoint}?${searchParams}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Analytics fetch failed: ${endpoint}`)
      return r.json()
    })
    .then((json) => json.data as T)
}

export function useRevenueAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.revenue(params),
    queryFn: () => fetchAnalytics<AnalyticsRevenue>('revenue', params),
    staleTime: 60_000,
  })
}

export function useStudentAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.students(params),
    queryFn: () => fetchAnalytics<AnalyticsStudents>('students', params),
    staleTime: 60_000,
  })
}

export function useRetentionAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.retention(params),
    queryFn: () => fetchAnalytics<RetentionData>('retention', params),
    staleTime: 120_000,
  })
}

export function useConversionFunnel() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.conversion(params),
    queryFn: () => fetchAnalytics<ConversionFunnel>('conversion', params),
    staleTime: 120_000,
  })
}

export function useDropOffAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.dropoff(params),
    queryFn: () => fetchAnalytics<DropOffData>('dropoff', params),
    staleTime: 120_000,
  })
}

export function useCourseAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.courses(params),
    queryFn: () => fetchAnalytics<CourseAnalytics>('courses', params),
    staleTime: 60_000,
  })
}

export function useLectureAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.lectures(params),
    queryFn: () => fetchAnalytics<LectureAnalytics>('lectures', params),
    staleTime: 60_000,
  })
}

export function useMcqAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.mcq(params),
    queryFn: () => fetchAnalytics<McqAnalytics>('mcq', params),
    staleTime: 60_000,
  })
}

export function useCqAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.cq(params),
    queryFn: () => fetchAnalytics<CqAnalytics>('cq', params),
    staleTime: 60_000,
  })
}

export function usePaymentAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.payments(params),
    queryFn: () => fetchAnalytics<PaymentAnalytics>('payments', params),
    staleTime: 60_000,
  })
}

export function useAcquisitionAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.acquisition(params),
    queryFn: () => fetchAnalytics<AcquisitionData>('acquisition', params),
    staleTime: 120_000,
  })
}

export function useSearchAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.search(params),
    queryFn: () => fetchAnalytics<SearchAnalytics>('search', params),
    staleTime: 60_000,
  })
}

export function useDeviceAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.devices(params),
    queryFn: () => fetchAnalytics<DeviceAnalytics>('devices', params),
    staleTime: 120_000,
  })
}

export function useGeoAnalytics() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.geo(params),
    queryFn: () => fetchAnalytics<GeoAnalytics>('geo', params),
    staleTime: 120_000,
  })
}

export function useRealtimeData() {
  return useQuery({
    queryKey: queryKeys.analytics.realtime(),
    queryFn: () => fetchAnalytics<RealtimeData>('realtime', {} as AnalyticsParams),
    refetchInterval: 15_000,
    staleTime: 5_000,
  })
}

export function useAiInsights(section: AnalyticsSection) {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.insights({ ...params, section }),
    queryFn: () => fetchAnalytics<AiInsight[]>('insights', { ...params, section } as unknown as AnalyticsParams),
    staleTime: 300_000,
  })
}

export function usePredictions() {
  const params = useParams()
  return useQuery({
    queryKey: queryKeys.analytics.predictions(params),
    queryFn: () => fetchAnalytics<PredictionData>('predictions', params),
    staleTime: 300_000,
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.analytics.alerts(),
    queryFn: () => fetchAnalytics<AlertData[]>('alerts', {} as AnalyticsParams),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useReports() {
  return useQuery({
    queryKey: queryKeys.analytics.reports(),
    queryFn: () => fetchAnalytics<unknown[]>('reports', {} as AnalyticsParams),
    staleTime: 30_000,
  })
}
