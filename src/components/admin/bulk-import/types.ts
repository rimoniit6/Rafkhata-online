export interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
  total: number
}

export interface ImportHistoryItem {
  id: string
  type: 'mcq' | 'cq'
  isBoard: boolean
  fileName: string
  totalRows: number
  successCount: number
  errorCount: number
  timestamp: Date
}

export type Step = 1 | 2 | 3 | 4
