import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTrades } from '@/stores/trades-store'
import { equityCurve } from '@/features/trades/data/stats'

export function EquityCurve() {
  const trades = useTrades()
  const data = equityCurve(trades).map((d) => ({
    name: d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    balance: d.balance,
  }))

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id='equityGrad' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='currentColor' stopOpacity={0.4} />
            <stop offset='95%' stopColor='currentColor' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
        <XAxis
          dataKey='name'
          stroke='#888'
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval='preserveStartEnd'
          minTickGap={32}
        />
        <YAxis
          stroke='#888'
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
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
      return [`$${value.toLocaleString()}`, 'Equity']
    }
    return ['$0', 'Equity']
  }}
        />
        <Area
          type='monotone'
          dataKey='balance'
          stroke='currentColor'
          className='text-primary'
          strokeWidth={2}
          fill='url(#equityGrad)'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
