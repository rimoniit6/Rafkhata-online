'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface FunnelStep {
  name: string
  count: number
  conversionRate: number
  dropRate: number
}

interface FunnelChartProps {
  data: FunnelStep[]
  height?: number
  onBarClick?: (entry: FunnelStep) => void
}

const funnelColors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#e4f5ec']

export default function FunnelChart({ data, height = 400, onBarClick }: FunnelChartProps) {
  const reversed = [...data].reverse()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={reversed}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 100, bottom: 5 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          className="fill-muted-foreground"
          width={90}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [value.toLocaleString(), 'Users']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}
          onClick={onBarClick ? (entry: FunnelStep) => onBarClick(entry) : undefined}
          style={{ cursor: onBarClick ? 'pointer' : 'default' }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={funnelColors[index % funnelColors.length]} />
          ))}
          <LabelList
            dataKey="conversionRate"
            position="right"
            formatter={(val: number) => `${val}%`}
            className="fill-muted-foreground text-xs font-medium"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
