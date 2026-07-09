import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { section, format, data } = body as {
      section: string
      format: 'xlsx' | 'csv' | 'pdf'
      data: Record<string, unknown>
    }

    const wb = XLSX.utils.book_new()

    switch (section) {
      case 'revenue': {
        if (data.revenueByMethod) {
          const ws = XLSX.utils.json_to_sheet(data.revenueByMethod as Record<string, unknown>[])
          XLSX.utils.book_append_sheet(wb, ws, 'Revenue by Method')
        }
        if (data.dailyRevenue) {
          const ws = XLSX.utils.json_to_sheet(data.dailyRevenue as Record<string, unknown>[])
          XLSX.utils.book_append_sheet(wb, ws, 'Daily Revenue')
        }
        if (data.monthlyRevenue) {
          const ws = XLSX.utils.json_to_sheet(data.monthlyRevenue as Record<string, unknown>[])
          XLSX.utils.book_append_sheet(wb, ws, 'Monthly Revenue')
        }
        if (data.topSources) {
          const ws = XLSX.utils.json_to_sheet(data.topSources as Record<string, unknown>[])
          XLSX.utils.book_append_sheet(wb, ws, 'Top Sources')
        }
        const summaryWs = XLSX.utils.json_to_sheet([
          { metric: 'Total Revenue', value: data.totalRevenue },
        ])
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
        break
      }
      default: {
        const ws = XLSX.utils.json_to_sheet([{ section, exportedAt: new Date().toISOString() }])
        XLSX.utils.book_append_sheet(wb, ws, 'Data')
      }
    }

    if (format === 'csv') {
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const csv = XLSX.utils.sheet_to_csv(firstSheet)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${section}-analytics.csv"`,
        },
      })
    }

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${section}-analytics.xlsx"`,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Analytics Export')
  }
}
