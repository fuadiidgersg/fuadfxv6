import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Trade } from '@/features/trades/data/schema'
import { useTrades } from '@/stores/trades-store'

function buildMonthly(trades: Trade[]) {
  const map = new Map<string, number>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = `${t.closedAt.getFullYear()}-${String(t.closedAt.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + t.pnl)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => {
      const [, m] = k.split('-')
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return { name: monthNames[parseInt(m) - 1], pnl: parseFloat(v.toFixed(2)) }
    })
}

export function MonthlyPnl() {
  const trades = useTrades()
  const data = buildMonthly(trades)
  return (
    <ResponsiveContainer width='100%' height={300}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <XAxis
          dataKey='name'
          stroke='#888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toLocaleString()}`, 'P&L']
    }
    return ['$0', 'P&L']
  }}
        />
        <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.name}
              className={d.pnl >= 0 ? 'fill-emerald-500' : 'fill-red-500'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
