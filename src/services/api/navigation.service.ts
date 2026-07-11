import { api } from '@/lib/api-client'

export interface NavigationRecord {
  id: string
  label: string
  route: string
  icon: string | null
  location: string
  order: number
  isAuthOnly: boolean
  isAdminOnly: boolean
  isActive: boolean
}

export type NavigationInput = {
  label: string
  route: string
  icon?: string
  location?: string
  order?: number
  isAuthOnly?: boolean
  isAdminOnly?: boolean
  isActive?: boolean
}

export const navigationService = {
  list: () => api.get<NavigationRecord[]>('admin/navigation'),
  create: (data: NavigationInput) => api.post<NavigationRecord>('admin/navigation', data),
  update: (id: string, data: Partial<NavigationInput>) =>
    api.put<NavigationRecord>('admin/navigation', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/navigation', { id }),
}
