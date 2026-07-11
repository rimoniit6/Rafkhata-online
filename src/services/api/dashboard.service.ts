import { api } from '@/lib/api-client'
import type { Stats } from '@/components/admin/AdminDashboardCharts'

export type DashboardStats = Stats

export const dashboardService = {
  getStats: () => api.get<{ stats: Stats }>('admin/stats'),
}
