'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AreaChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  series: Array<{
    key: string
    name: string
    color: string
  }>
  height?: number
  showGrid?: boolean
  formatY?: (value: number) => string
  onDotClick?: (entry: Record<string, unknown>) => void
}

export default function AreaChart({
  data,
  xKey,
  series,
  height = 300,
  showGrid = true,
  formatY,
  onDotClick,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />}
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          className="fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          className="fill-muted-foreground"
          tickFormatter={formatY}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [formatY ? formatY(value) : value.toLocaleString(), name]}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, onClick: onDotClick ? (entry: Record<string, unknown>) => onDotClick(entry) : undefined }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
