import { api } from '@/lib/api-client'

export interface SiteSettingRecord {
  id: string
  key: string
  value: string
  group: string | null
  label: string | null
}

export interface SettingsListResponse {
  data: SiteSettingRecord[]
  map: Record<string, string>
}

export interface SettingInput {
  key: string
  value: string
  group?: string | null
  label?: string | null
}

export const settingsService = {
  list: () => api.get<SettingsListResponse>('admin/settings'),
  update: (settings: SettingInput[]) =>
    api.patch<{ data: { updated: number } }>('admin/settings', { settings }),
}
