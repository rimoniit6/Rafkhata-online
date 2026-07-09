'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface BarSeries {
  key: string
  name: string
  color: string
}

interface BarChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  series: BarSeries[]
  height?: number
  showGrid?: boolean
  stacked?: boolean
  layout?: 'horizontal' | 'vertical'
  formatY?: (value: number) => string
  barSize?: number
  onBarClick?: (entry: Record<string, unknown>) => void
}

export default function BarChart({
  data,
  xKey,
  series,
  height = 300,
  showGrid = true,
  stacked = false,
  layout = 'horizontal',
  formatY,
  barSize = 32,
  onBarClick,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
        barSize={barSize}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />}
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" />
            <YAxis tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" tickFormatter={formatY} />
          </>
        ) : (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" tickFormatter={formatY} />
            <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" width={120} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [formatY ? formatY(value) : value.toLocaleString(), name]}
        />
        {series.length > 1 && <Legend />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
            onClick={onBarClick ? (entry: Record<string, unknown>) => onBarClick(entry) : undefined}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
