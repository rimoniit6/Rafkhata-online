'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  innerRadius?: number
  outerRadius?: number
  formatValue?: (value: number) => string
  onSliceClick?: (entry: { name: string; value: number }) => void
}

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

export default function DonutChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  formatValue,
  onSliceClick,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          onClick={onSliceClick ? (entry: { name: string; value: number }) => onSliceClick(entry) : undefined}
          style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            formatValue ? formatValue(value) : value.toLocaleString(),
            name,
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
