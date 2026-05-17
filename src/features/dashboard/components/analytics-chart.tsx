import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTrades } from '@/stores/trades-store'
import { dailyPnl } from '@/features/trades/data/stats'

export function AnalyticsChart() {
  const trades = useTrades()
  const data = dailyPnl(trades)
    .slice(-14)
    .map((d) => ({
      name: d.date.slice(5),
      pnl: d.pnl,
      trades: d.trades,
    }))

  return (
    <ResponsiveContainer width='100%' height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
        <XAxis dataKey='name' stroke='#888' fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId='left'
          stroke='#888'
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          yAxisId='right'
          orientation='right'
          stroke='#888'
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(value: unknown, name: unknown) => {
            if (name === 'pnl' && typeof value === 'number') {
              return [`$${value.toFixed(2)}`, 'P&L']
            }
            return [`${value}`, 'Trades']
          }}
        />
        <Bar
          yAxisId='left'
          dataKey='pnl'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
        <Line
          yAxisId='right'
          type='monotone'
          dataKey='trades'
          stroke='currentColor'
          strokeWidth={2}
          className='text-muted-foreground'
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
