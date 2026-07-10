let xlsxModule: typeof import('xlsx') | null = null

async function getXLSX() {
  if (!xlsxModule) xlsxModule = await import('xlsx')
  return xlsxModule
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ROWS = 10000
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const _ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]

export interface ParseResult {
  rows: Record<string, string | number | boolean | undefined>[]
  sheetName: string
}

export class ExcelParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExcelParseError'
  }
}

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new ExcelParseError('ফাইলের সাইজ ৫MB এর বেশি হতে পারবে না')
  }
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ExcelParseError('শুধুমাত্র .xlsx বা .xls ফাইল অনুমোদিত')
  }
}

function checkRowLimit(rows: unknown[]): void {
  if (rows.length > MAX_ROWS) {
    throw new ExcelParseError(`সর্বোচ্চ ${MAX_ROWS}টি সারি অনুমোদিত, আপনার ফাইলে ${rows.length}টি সারি আছে`)
  }
}

export async function safeParseExcel(data: ArrayBuffer): Promise<ParseResult> {
  const XLSX = await getXLSX()
  const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellHTML: false, cellText: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new ExcelParseError('ফাইলে কোনো শীট নেই')
  }
  const worksheet = workbook.Sheets[sheetName]
  const rows: Record<string, string | number | boolean | undefined>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true })
  checkRowLimit(rows)
  return { rows, sheetName }
}

export async function safeParseExcelFromFile(file: File): Promise<ParseResult> {
  validateFile(file)
  const buffer = await file.arrayBuffer()
  return safeParseExcel(buffer)
}

export async function safeParseExcelClient(file: File): Promise<ParseResult> {
  validateFile(file)
  const buffer = await file.arrayBuffer()
  return safeParseExcel(buffer)
}
