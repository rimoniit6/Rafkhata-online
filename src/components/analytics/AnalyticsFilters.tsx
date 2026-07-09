'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useAnalyticsStore, type AnalyticsPeriod } from '@/store/analytics'
import { useState } from 'react'

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export default function AnalyticsFilters() {
  const { period, dateRange, setPeriod, setCustomRange } = useAnalyticsStore()
  const [customOpen, setCustomOpen] = useState(false)
  const [calFrom, setCalFrom] = useState<Date | undefined>(
    period === 'custom' ? new Date(dateRange.from) : undefined
  )
  const [calTo, setCalTo] = useState<Date | undefined>(
    period === 'custom' ? new Date(dateRange.to) : undefined
  )

  const handleApplyCustom = () => {
    if (calFrom && calTo) {
      setCustomRange(
        format(calFrom, 'yyyy-MM-dd'),
        format(calTo, 'yyyy-MM-dd')
      )
      setCustomOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {periodOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={period === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (opt.value !== 'custom') {
                setPeriod(opt.value)
              }
            }}
            className={cn(
              'text-xs h-8',
              period === opt.value && 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setCustomOpen(true)}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {period === 'custom'
              ? `${dateRange.from} – ${dateRange.to}`
              : 'Custom'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-3">
            <div className="grid gap-2">
              <p className="text-sm font-medium">From</p>
              <Calendar
                mode="single"
                selected={calFrom}
                onSelect={setCalFrom}
                initialFocus
              />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">To</p>
              <Calendar
                mode="single"
                selected={calTo}
                onSelect={setCalTo}
                initialFocus
              />
            </div>
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!calFrom || !calTo}
              onClick={handleApplyCustom}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
