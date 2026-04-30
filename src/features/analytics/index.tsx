import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Flame,
  Snowflake,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MonthlyPnl } from '@/features/dashboard/components/monthly-pnl'
import {
  computeStats,
  drawdownSeries,
  equityCurve,
  groupByDayOfWeek,
  groupByDirection,
  groupByHour,
  groupByPair,
  groupBySession,
  groupByStrategy,
  holdTimeStats,
  lotSizeDistribution,
  rMultipleDistribution,
  tradesByMonth,
} from '@/features/trades/data/stats'
import { useTrades } from '@/stores/trades-store'

const winLossColors = ['#10b981', '#ef4444', '#94a3b8']

function formatHoldTime(min: number) {
  if (!isFinite(min) || min <= 0) return '—'
  if (min < 60) return `${min.toFixed(0)}m`
  const h = min / 60
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function Analytics() {
  const trades = useTrades()
  const stats = computeStats(trades)
  const eq = equityCurve(trades, 10000).map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    equity: Math.round(d.balance),
  }))
  const dd = drawdownSeries(trades, 10000)
  const ddChart = dd.series.map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    drawdown: d.drawdown,
  }))
  const byPair = groupByPair(trades).slice(0, 8)
  const byStrategy = groupByStrategy(trades)
  const bySession = groupBySession(trades)
  const byDow = groupByDayOfWeek(trades)
  const byDirection = groupByDirection(trades)
  const byHour = groupByHour(trades)
  const rDist = rMultipleDistribution(trades)
  const lotDist = lotSizeDistribution(trades)
  const monthVol = tradesByMonth(trades)
  const hold = holdTimeStats(trades)
  const winLossData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'Breakeven', value: stats.breakeven },
  ]

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>
            Deep dive into your trading performance, edge and habits.
          </p>
        </div>

        {/* Headline KPIs */}
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat
            label='Net P&L'
            value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
            positive={stats.totalPnl >= 0}
          />
          <Stat
            label='Profit Factor'
            value={stats.profitFactor.toFixed(2)}
            positive={stats.profitFactor >= 1}
          />
          <Stat
            label='Expectancy'
            value={`$${stats.expectancy.toFixed(2)} / trade`}
            positive={stats.expectancy >= 0}
          />
          <Stat
            label='Avg R'
            value={`${stats.avgR.toFixed(2)}R`}
            positive={stats.avgR >= 0}
          />
        </div>

        {/* Secondary KPIs — drawdown, streaks, hold time */}
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat
            label='Max Drawdown'
            value={`$${dd.maxDrawdown.toFixed(2)}`}
            sub={`${dd.maxDrawdownPct.toFixed(2)}% of peak`}
            positive={false}
          />
          <Stat
            label='Best / Worst Trade'
            value={`+$${stats.bestTrade.toFixed(0)} / -$${Math.abs(stats.worstTrade).toFixed(0)}`}
          />
          <Stat
            label='Longest Streaks'
            value={`${stats.largestWinStreak}W · ${stats.largestLossStreak}L`}
          />
          <Stat
            label='Avg Hold Time'
            value={formatHoldTime(hold.avgAllMin)}
            sub={`Wins ${formatHoldTime(hold.avgWinMin)} · Losses ${formatHoldTime(hold.avgLossMin)}`}
          />
        </div>

        {/* Equity curve */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
            <CardDescription>
              Cumulative account growth from $10,000 starting balance
            </CardDescription>
          </CardHeader>
          <CardContent className='h-[320px] px-2'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={eq} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <XAxis dataKey='date' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toLocaleString()}`, 'Equity']
    }
    return ['$0', 'Equity']
  }} 
/>
                <Line type='monotone' dataKey='equity' stroke='currentColor' strokeWidth={2} className='text-emerald-500' dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Drawdown */}
        <Card>
          <CardHeader>
            <CardTitle>Drawdown</CardTitle>
            <CardDescription>
              Distance below the running equity peak — keep it shallow.
            </CardDescription>
          </CardHeader>
          <CardContent className='h-[260px] px-2'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={ddChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id='ddFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#ef4444' stopOpacity={0.4} />
                    <stop offset='100%' stopColor='#ef4444' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <XAxis dataKey='date' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, 'Drawdown']
    }
    return ['$0.00', 'Drawdown']
  }} 
/>
                <Area type='monotone' dataKey='drawdown' stroke='#ef4444' strokeWidth={2} fill='url(#ddFill)' />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>P&L by Pair</CardTitle>
              <CardDescription>Top performing symbols</CardDescription>
            </CardHeader>
            <CardContent className='h-[300px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={byPair} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='pair' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, 'P&L']
    }
    return ['$0.00', 'P&L']
  }} 
/>
                  <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
                    {byPair.map((p, i) => (
                      <Cell key={i} fill={p.pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Win / Loss Distribution</CardTitle>
              <CardDescription>
                {stats.winRate.toFixed(1)}% win rate over {stats.total} trades
              </CardDescription>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie data={winLossData} dataKey='value' nameKey='name' innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {winLossData.map((_, i) => (
                      <Cell key={i} fill={winLossColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Trading Session</CardTitle>
              <CardDescription>When are you most profitable?</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={bySession} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='session' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, 'P&L']
    }
    return ['$0.00', 'P&L']
  }} 
/>
                  <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
                    {bySession.map((s, i) => (
                      <Cell key={i} fill={s.pnl >= 0 ? '#0ea5e9' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Day of Week</CardTitle>
              <CardDescription>Profitability across weekdays</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={byDow} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='day' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, 'P&L']
    }
    return ['$0.00', 'P&L']
  }} 
/>
                  <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
                    {byDow.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? '#8b5cf6' : '#fb7185'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Hour of Day</CardTitle>
              <CardDescription>P&L bucketed by trade open hour (local time)</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={byHour} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='label' fontSize={10} stroke='#888' tickLine={false} axisLine={false} interval={1} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
  formatter={(value: unknown) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, 'P&L']
    }
    return ['$0.00', 'P&L']
  }} 
/>
                  <Bar dataKey='pnl' radius={[3, 3, 0, 0]}>
                    {byHour.map((h, i) => (
                      <Cell key={i} fill={h.pnl >= 0 ? '#22c55e' : '#f97316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>R-Multiple Distribution</CardTitle>
              <CardDescription>Risk-adjusted outcome buckets</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={rDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='bucket' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
  formatter={(value: unknown, name: unknown) => {
    const numValue = typeof value === 'number' ? value : 0
    const label = name === 'count' ? 'Trades' : String(name ?? '')
    return [numValue, label]
  }} 
/>
                  <Bar dataKey='count' radius={[4, 4, 0, 0]}>
                    {rDist.map((r, i) => {
                      const positive = r.bucket.startsWith('+') || r.bucket === '≥ +3R'
                      const neutral = r.bucket === '0R'
                      return (
                        <Cell
                          key={i}
                          fill={neutral ? '#94a3b8' : positive ? '#10b981' : '#ef4444'}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Long vs Short + Lot size */}
        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Long vs Short</CardTitle>
              <CardDescription>P&L and win rate by direction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                {byDirection.map((d) => (
                  <div
                    key={d.direction}
                    className='rounded-lg border p-4'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-muted-foreground'>
                        {d.direction}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          d.direction === 'Long'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        )}
                      >
                        {d.trades} trades
                      </span>
                    </div>
                    <div
                      className={cn(
                        'mt-2 text-2xl font-bold tabular-nums',
                        d.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      Win rate {d.winRate.toFixed(1)}%
                    </div>
                    <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className={cn(
                          'h-full',
                          d.direction === 'Long'
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        )}
                        style={{ width: `${Math.min(100, d.winRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {byDirection.length === 0 && (
                  <p className='col-span-2 py-8 text-center text-sm text-muted-foreground'>
                    No closed trades yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lot Size Distribution</CardTitle>
              <CardDescription>Position sizing habits</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={lotDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='bucket' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey='count' fill='#6366f1' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trade volume by month */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Volume by Month</CardTitle>
            <CardDescription>How much you traded each month</CardDescription>
          </CardHeader>
          <CardContent className='h-[260px] px-2'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={monthVol} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <XAxis dataKey='month' fontSize={11} stroke='#888' tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke='#888' tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='trades' fill='#0ea5e9' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='col-span-1 lg:col-span-4'>
            <CardHeader>
              <CardTitle>Monthly P&L</CardTitle>
              <CardDescription>
                Net realised profit and loss by month.
              </CardDescription>
            </CardHeader>
            <CardContent className='ps-2'>
              <MonthlyPnl />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-3'>
            <CardHeader>
              <CardTitle>Risk Snapshot</CardTitle>
              <CardDescription>Current exposure and habits.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <RiskRow
                label='Average Win'
                value={`+$${stats.avgWin.toFixed(2)}`}
                icon={TrendingUp}
                positive
              />
              <RiskRow
                label='Average Loss'
                value={`-$${stats.avgLoss.toFixed(2)}`}
                icon={TrendingDown}
              />
              <RiskRow
                label='Expectancy / Trade'
                value={`$${stats.expectancy.toFixed(2)}`}
                icon={Target}
                positive={stats.expectancy >= 0}
              />
              <RiskRow
                label='Open Positions'
                value={`${stats.open}`}
                icon={ArrowUpRight}
              />
              <RiskRow
                label='Total Pips'
                value={`${stats.totalPips.toFixed(1)}`}
                icon={ArrowDownRight}
                positive={stats.totalPips >= 0}
              />
              <RiskRow
                label='Best Win Streak'
                value={`${stats.largestWinStreak} trades`}
                icon={Flame}
                positive
              />
              <RiskRow
                label='Worst Loss Streak'
                value={`${stats.largestLossStreak} trades`}
                icon={Snowflake}
                positive={false}
              />
              <RiskRow
                label='Avg Hold (winners)'
                value={formatHoldTime(hold.avgWinMin)}
                icon={Clock}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Strategy Performance</CardTitle>
            <CardDescription>Wins, losses and net P&L by playbook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[640px] text-sm'>
                <thead className='text-xs uppercase text-muted-foreground'>
                  <tr className='border-b'>
                    <th className='py-2 text-start'>Strategy</th>
                    <th className='py-2 text-end'>Trades</th>
                    <th className='py-2 text-end'>Wins</th>
                    <th className='py-2 text-end'>Losses</th>
                    <th className='py-2 text-end'>Win %</th>
                    <th className='py-2 text-end'>Net P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {byStrategy.map((s) => (
                    <tr key={s.strategy} className='border-b last:border-0'>
                      <td className='py-2 font-medium'>{s.strategy}</td>
                      <td className='py-2 text-end tabular-nums'>{s.trades}</td>
                      <td className='py-2 text-end tabular-nums text-emerald-600'>{s.wins}</td>
                      <td className='py-2 text-end tabular-nums text-red-600'>{s.trades - s.wins}</td>
                      <td className='py-2 text-end tabular-nums'>{s.winRate.toFixed(1)}%</td>
                      <td
                        className={
                          'py-2 text-end font-semibold tabular-nums ' +
                          (s.pnl >= 0 ? 'text-emerald-600' : 'text-red-600')
                        }
                      >
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {byStrategy.length === 0 && (
                    <tr>
                      <td colSpan={6} className='py-6 text-center text-muted-foreground'>
                        No closed trades yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

function Stat({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-xs font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={
            'text-2xl font-bold tabular-nums ' +
            (positive === true
              ? 'text-emerald-600'
              : positive === false
                ? 'text-red-600'
                : '')
          }
        >
          {value}
        </div>
        {sub && (
          <div className='mt-1 text-xs text-muted-foreground'>{sub}</div>
        )}
      </CardContent>
    </Card>
  )
}

function RiskRow({
  label,
  value,
  icon: Icon,
  positive,
}: {
  label: string
  value: string
  icon: React.ElementType
  positive?: boolean
}) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Icon className='size-4' />
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-semibold tabular-nums',
          positive === true && 'text-emerald-600',
          positive === false && 'text-red-600'
        )}
      >
        {value}
      </div>
    </div>
  )
}
