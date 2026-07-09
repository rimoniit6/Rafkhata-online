'use client'

import { useState, useMemo } from 'react'
import { FileText, Plus, Download, Trash2, Clock, RefreshCw, Calendar, Mail, FileSpreadsheet } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'

interface ReportItem {
  id: string
  name: string
  description: string | null
  type: string
  format: string
  schedule: string | null
  recipients: string[] | null
  lastGenerated: string | null
  createdAt: string
  updatedAt: string
}

const REPORT_TYPES = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'students', label: 'Students' },
  { value: 'courses', label: 'Courses' },
  { value: 'lectures', label: 'Lectures' },
  { value: 'mcq', label: 'MCQ' },
  { value: 'cq', label: 'CQ' },
  { value: 'payments', label: 'Payments' },
]

const SCHEDULE_OPTIONS = [
  { value: '', label: 'No schedule' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function fetchReports(): Promise<ReportItem[]> {
  return fetch('/api/admin/analytics/reports').then((r) => {
    if (!r.ok) throw new Error('Failed to fetch reports')
    return r.json().then((j) => j.data)
  })
}

function createReport(data: { name: string; description?: string; type: string; format?: string; schedule?: string }) {
  return fetch('/api/admin/analytics/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to create report')
    return r.json().then((j) => j.data)
  })
}

function deleteReport(id: string) {
  return fetch(`/api/admin/analytics/reports?id=${id}`, { method: 'DELETE' }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete report')
  })
}

function generateReport(reportId: string) {
  return fetch('/api/admin/analytics/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId }),
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to generate report')
    return r.blob()
  })
}

export default function ReportsDashboard() {
  const queryClient = useQueryClient()
  const { data: reports, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.analytics.reports(),
    queryFn: fetchReports,
  })
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('revenue')
  const [formSchedule, setFormSchedule] = useState('')

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.reports() })
      setShowForm(false)
      setFormName('')
      setFormDesc('')
      setFormType('revenue')
      setFormSchedule('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.reports() }),
  })

  const handleGenerate = async (report: ReportItem) => {
    try {
      const blob = await generateReport(report.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.type}-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.reports() })
    } catch {
      // handled by the mutation error boundary
    }
  }

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'reports', format, data: { reports } }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reports-list.${format}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />

  const scheduleBadge = (sched: string | null) => {
    if (!sched) return null
    const colors: Record<string, string> = { daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', weekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', monthly: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
    return <Badge className={cn('text-xs font-medium', colors[sched] || 'bg-muted text-muted-foreground')}>{sched}</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Scheduled Reports</p>
          <p className="text-xs text-muted-foreground mt-0.5">Manage automated analytics reports</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExport={handleExport} />
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Report
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-border/50 border-emerald-200/50 dark:border-emerald-900/30">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm font-semibold">Create New Report</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Report Name</Label>
                <Input placeholder="e.g. Weekly Revenue Summary" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Report Type</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors" value={formType} onChange={(e) => setFormType(e.target.value)}>
                  {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Schedule</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors" value={formSchedule} onChange={(e) => setFormSchedule(e.target.value)}>
                  {SCHEDULE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Input placeholder="Brief description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" disabled={!formName || createMutation.isPending} onClick={() => createMutation.mutate({ name: formName, description: formDesc, type: formType, format: 'xlsx', schedule: formSchedule || undefined })}>
                {createMutation.isPending ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!reports || reports.length === 0) ? (
        <AnalyticsEmptyState />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="border-border/50 hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{report.name}</p>
                        <Badge variant="outline" className="text-xs">{report.type}</Badge>
                        {scheduleBadge(report.schedule)}
                      </div>
                      {report.description && <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" />
                          {report.format.toUpperCase()}
                        </span>
                        {report.lastGenerated && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {new Date(report.lastGenerated).toLocaleDateString('bn-BD')}
                          </span>
                        )}
                        {report.schedule && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.schedule}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGenerate(report)} title="Generate Now">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => deleteMutation.mutate(report.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
