import { api } from '@/lib/api-client'

export interface PermissionRecord {
  id: string
  name: string
  group: string
  description: string | null
  roles: string[]
}

export const permissionService = {
  list: () => api.get<PermissionRecord[]>('admin/permissions'),
  update: (permissionId: string, roles: string[]) =>
    api.put<{ message: string }>('admin/permissions', { permissionId, roles }),
}
