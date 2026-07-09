'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
  onExport: (format: 'xlsx' | 'csv' | 'pdf') => Promise<void>
  label?: string
}

export default function ExportButton({ onExport, label = 'Export' }: ExportButtonProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    setExporting(format)
    try {
      await onExport(format)
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={exporting === 'xlsx'}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
          {exporting === 'xlsx' ? 'Exporting...' : 'Excel (.xlsx)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={exporting === 'csv'}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          {exporting === 'csv' ? 'Exporting...' : 'CSV (.csv)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}>
          <FileJson className="h-4 w-4 mr-2 text-red-600" />
          {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
