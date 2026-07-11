import { api } from '@/lib/api-client'

export interface BulkImportResult {
  success: number
  errors: { row: number; message: string }[]
  total: number
}

export interface BulkImportPayload {
  file: FormData
}

export const bulkImportService = {
  import: (formData: FormData) =>
    api.post<BulkImportResult>('admin/bulk-import', formData),
}
