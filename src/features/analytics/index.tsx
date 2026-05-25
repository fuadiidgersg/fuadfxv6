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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Clock,
  Flame,
  Shield,
  Snowflake,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MonthlyPnl } from '@/features/dashboard/components/monthly-pnl'
import {
  computeStats,
  drawdownSeries,
  equityCurve,
  groupByDayOfWeek,
  groupByDirection,
  groupByEmotion,
  groupByHour,
  groupByPairDetailed,
  groupBySession,
  groupByStrategy,
  groupByTimeframe,
  holdTimeDistribution,
  holdTimeStats,
  lotSizeDistribution,
  pipDistribution,
  rMultipleDistribution,
  tradesByMonth,
} from '@/features/trades/data/stats'
import { useTrades } from '@/stores/trades-store'
import type { Trade } from '@/features/trades/data/schema'

const winLossColors = ['#10b981', '#ef4444', '#94a3b8']

function formatHoldTime(min: number) {
  if (!isFinite(min) || min <= 0) return '—'
  if (min < 60) return `${min.toFixed(0)}m`
  const h = min / 60
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function Stat({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
  icon?: React.ElementType
}) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium text-muted-foreground'>{label}</p>
          {Icon && <Icon className='size-4 text-muted-foreground' />}
        </div>
        <p
          className={cn(
            'mt-1 text-2xl font-bold tabular-nums',
            positive === true && 'text-emerald-600',
            positive === false && 'text-red-500'
          )}
        >
          {value}
        </p>
        {sub && <p className='mt-1 text-xs text-muted-foreground'>{sub}</p>}
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
    <div className='flex items-center gap-3'>
      <div className='flex size-8 items-center justify-center rounded-full bg-muted'>
        <Icon className='size-4 text-muted-foreground' />
      </div>
      <div className='flex flex-1 items-center justify-between'>
        <span className='text-sm text-muted-foreground'>{label}</span>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            positive === true && 'text-emerald-600',
            positive === false && 'text-red-500'
          )}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function computeTraderScore(
  stats: ReturnType<typeof computeStats>,
  emotionData: ReturnType<typeof groupByEmotion>
) {
  const wrScore = Math.min(30, (stats.winRate / 60) * 30)
  const pfScore = Math.min(25, (Math.min(Math.max(stats.profitFactor, 0), 2) / 2) * 25)
  const rScore = Math.min(25, (Math.max(0, Math.min(stats.avgR, 1.5)) / 1.5) * 25)
  const goodEmotions = ['disciplined', 'calm', 'confident']
  const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
  const discTrades = emotionData
    .filter((e) => goodEmotions.includes(e.emotion))
    .reduce((s, e) => s + e.trades, 0)
  const discScore = totalEm > 0 ? (discTrades / totalEm) * 20 : 10
  return Math.round(wrScore + pfScore + rScore + discScore)
}

function detectRevengeTrades(trades: Trade[]) {
  const closed = [...trades]
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())
  let revengeCount = 0
  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1]
    const curr = closed[i]
    if (prev.status === 'loss') {
      const gapMin = (curr.openedAt.getTime() - prev.closedAt.getTime()) / 60000
      if (gapMin >= 0 && gapMin <= 15) revengeCount++
    }
  }
  return {
    count: revengeCount,
    pct: closed.length > 1 ? (revengeCount / (closed.length - 1)) * 100 : 0,
  }
}

function detectWeaknesses(
  stats: ReturnType<typeof computeStats>,
  emotionData: ReturnType<typeof groupByEmotion>,
  revenge: { count: number; pct: number }
): string[] {
  const issues: string[] = []
  if (stats.winRate < 40) issues.push('Win rate below 40% — review your entry criteria')
  if (stats.profitFactor < 1) issues.push('Profit factor below 1.0 — you are losing money overall')
  if (stats.avgR < 0) issues.push('Negative average R — losses outweigh gains per trade')
  if (revenge.pct > 20) issues.push(`High revenge trading rate (${revenge.pct.toFixed(0)}%) — take breaks after losses`)
  const badEmotions = ['fomo', 'revenge', 'tilted', 'greedy', 'fearful']
  const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
  const badTrades = emotionData
    .filter((e) => badEmotions.includes(e.emotion))
    .reduce((s, e) => s + e.trades, 0)
  if (totalEm > 0 && badTrades / totalEm > 0.3)
    issues.push('Over 30% of trades tagged with negative emotions')
  if (stats.largestLossStreak >= 5)
    issues.push(`Loss streak of ${stats.largestLossStreak} — consider daily loss limits`)
  return issues
}

export function Analytics() {
  const trades = useTrades()
  const stats = computeStats(trades)
  const emotionData = groupByEmotion(trades)
  const revenge = detectRevengeTrades(trades)
  const weaknesses = detectWeaknesses(stats, emotionData, revenge)
  const traderScore = computeTraderScore(stats, emotionData)

  const eq = equityCurve(trades, 10000).map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    equity: Math.round(d.balance),
  }))
  const dd = drawdownSeries(trades, 10000)
  const ddChart = dd.series.map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    drawdown: d.drawdown,
  }))
  const byPairDetailed = groupByPairDetailed(trades)
  const byPair = byPairDetailed.slice(0, 10)
  const byStrategy = groupByStrategy(trades)
  const bySession = groupBySession(trades)
  const byDow = groupByDayOfWeek(trades)
  const byDirection = groupByDirection(trades)
  const byHour = groupByHour(trades)
  const byTimeframe = groupByTimeframe(trades)
  const rDist = rMultipleDistribution(trades)
  const lotDist = lotSizeDistribution(trades)
  const monthVol = tradesByMonth(trades)
  const holdDist = holdTimeDistribution(trades)
  const hold = holdTimeStats(trades)
  const pipDist = pipDistribution(trades)
  const winLossData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'Breakeven', value: stats.breakeven },
  ]

  const scoreColor =
    traderScore >= 70
      ? 'text-emerald-600'
      : traderScore >= 45
        ? 'text-amber-500'
        : 'text-red-500'
  const scoreLabel =
    traderScore >= 70 ? 'Elite' : traderScore >= 45 ? 'Developing' : 'Needs Work'

  const goodEmotions = ['disciplined', 'calm', 'confident']
  const badEmotions = ['fomo', 'revenge', 'tilted', 'greedy', 'fearful']

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
            Deep dive into your trading performance, edge, psychology, and risk.
          </p>
        </div>

        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3 lg:grid-cols-6'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='performance'>Performance</TabsTrigger>
            <TabsTrigger value='psychology'>Psychology</TabsTrigger>
            <TabsTrigger value='risk'>Risk</TabsTrigger>
            <TabsTrigger value='time'>Time</TabsTrigger>
            <TabsTrigger value='symbols'>Symbols</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW ─── */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Trader Score */}
            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-8'>
                  <div className='flex flex-col items-center'>
                    <div className={cn('text-7xl font-black tabular-nums', scoreColor)}>
                      {traderScore}
                    </div>
                    <div className='mt-1 text-sm font-semibold text-muted-foreground'>
                      / 100 — {scoreLabel}
                    </div>
                    <div className='mt-2 flex items-center gap-1'>
                      <Trophy className='size-4 text-amber-500' />
                      <span className='text-xs text-muted-foreground'>Overall Trader Score</span>
                    </div>
                  </div>
                  <div className='flex-1 space-y-2 text-sm'>
                    <p className='font-medium'>Score Breakdown</p>
                    {[
                      {
                        label: 'Win Rate',
                        pts: Math.round(Math.min(30, (stats.winRate / 60) * 30)),
                        max: 30,
                      },
                      {
                        label: 'Profit Factor',
                        pts: Math.round(
                          Math.min(25, (Math.min(Math.max(stats.profitFactor, 0), 2) / 2) * 25)
                        ),
                        max: 25,
                      },
                      {
                        label: 'Avg R Multiple',
                        pts: Math.round(
                          Math.min(25, (Math.max(0, Math.min(stats.avgR, 1.5)) / 1.5) * 25)
                        ),
                        max: 25,
                      },
                      {
                        label: 'Discipline',
                        pts: Math.round(
                          (() => {
                            const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
                            const discTrades = emotionData
                              .filter((e) => goodEmotions.includes(e.emotion))
                              .reduce((s, e) => s + e.trades, 0)
                            return totalEm > 0 ? (discTrades / totalEm) * 20 : 10
                          })()
                        ),
                        max: 20,
                      },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className='mb-1 flex justify-between text-xs text-muted-foreground'>
                          <span>{row.label}</span>
                          <span>
                            {row.pts} / {row.max}
                          </span>
                        </div>
                        <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                          <div
                            className='h-full rounded-full bg-emerald-500 transition-all'
                            style={{ width: `${(row.pts / row.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {weaknesses.length > 0 && (
                    <div className='flex-1 space-y-2'>
                      <p className='flex items-center gap-1 text-sm font-medium text-amber-600'>
                        <AlertTriangle className='size-4' /> Weaknesses Detected
                      </p>
                      <ul className='space-y-1'>
                        {weaknesses.map((w, i) => (
                          <li key={i} className='text-xs text-muted-foreground'>
                            • {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Stat
                label='Net P&L'
                value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
                positive={stats.totalPnl >= 0}
                icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
              />
              <Stat
                label='Win Rate'
                value={`${stats.winRate.toFixed(1)}%`}
                sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE`}
                positive={stats.winRate >= 50}
              />
              <Stat
                label='Profit Factor'
                value={stats.profitFactor.toFixed(2)}
                positive={stats.profitFactor >= 1}
              />
              <Stat
                label='Expectancy'
                value={`$${stats.expectancy.toFixed(2)}`}
                sub='per trade'
                positive={stats.expectancy >= 0}
              />
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Stat
                label='Avg R Multiple'
                value={`${stats.avgR.toFixed(2)}R`}
                positive={stats.avgR >= 0}
              />
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
                label='Avg Hold Time'
                value={formatHoldTime(hold.avgAllMin)}
                sub={`Wins ${formatHoldTime(hold.avgWinMin)} · Losses ${formatHoldTime(hold.avgLossMin)}`}
              />
            </div>

            {/* Equity Curve */}
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
                    <XAxis
                      dataKey='date'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toLocaleString()}`, 'Equity']
                          : ['$0', 'Equity']
                      }
                    />
                    <Line
                      type='monotone'
                      dataKey='equity'
                      stroke='#10b981'
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Win / Loss Donut */}
              <Card>
                <CardHeader>
                  <CardTitle>Win / Loss Distribution</CardTitle>
                  <CardDescription>
                    {stats.winRate.toFixed(1)}% win rate over {stats.total} trades
                  </CardDescription>
                </CardHeader>
                <CardContent className='h-[280px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={winLossData}
                        dataKey='value'
                        nameKey='name'
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
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

              {/* Drawdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Drawdown</CardTitle>
                  <CardDescription>
                    Distance below running equity peak — keep it shallow
                  </CardDescription>
                </CardHeader>
                <CardContent className='h-[280px] px-2'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={ddChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id='ddFill' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='0%' stopColor='#ef4444' stopOpacity={0.4} />
                          <stop offset='100%' stopColor='#ef4444' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis
                        dataKey='date'
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        formatter={(value: unknown) =>
                          typeof value === 'number'
                            ? [`$${value.toFixed(2)}`, 'Drawdown']
                            : ['$0.00', 'Drawdown']
                        }
                      />
                      <Area
                        type='monotone'
                        dataKey='drawdown'
                        stroke='#ef4444'
                        strokeWidth={2}
                        fill='url(#ddFill)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── PERFORMANCE (Trade Performance Model) ─── */}
          <TabsContent value='performance' className='space-y-6'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='size-5 text-emerald-600' />
              <div>
                <h3 className='font-semibold'>Trade Performance Model</h3>
                <p className='text-sm text-muted-foreground'>
                  Win rate, RR tracking, profit factor, session & pair performance
                </p>
              </div>
            </div>

            {/* KPIs */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Stat
                label='Win Rate'
                value={`${stats.winRate.toFixed(1)}%`}
                sub={`${stats.wins}W · ${stats.losses}L`}
                positive={stats.winRate >= 50}
              />
              <Stat
                label='Profit Factor'
                value={stats.profitFactor.toFixed(2)}
                positive={stats.profitFactor >= 1}
              />
              <Stat
                label='Avg R Multiple'
                value={`${stats.avgR.toFixed(2)}R`}
                positive={stats.avgR >= 0}
              />
              <Stat
                label='Avg Win / Loss'
                value={`$${stats.avgWin.toFixed(0)} / $${stats.avgLoss.toFixed(0)}`}
                positive={stats.avgWin >= stats.avgLoss}
              />
            </div>

            {/* Monthly P&L */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly P&L</CardTitle>
                <CardDescription>Net realised profit and loss by month</CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <MonthlyPnl />
              </CardContent>
            </Card>

            {/* R-Multiple Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>R-Multiple Distribution</CardTitle>
                <CardDescription>Risk-adjusted outcome buckets — your true edge</CardDescription>
              </CardHeader>
              <CardContent className='h-[280px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={rDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='bucket'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        typeof value === 'number' ? value : 0,
                        name === 'count' ? 'Trades' : String(name ?? ''),
                      ]}
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

            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Long vs Short */}
              <Card>
                <CardHeader>
                  <CardTitle>Long vs Short</CardTitle>
                  <CardDescription>P&L and win rate by trade direction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-4'>
                    {byDirection.map((d) => (
                      <div key={d.direction} className='rounded-lg border p-4'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-muted-foreground'>
                            {d.direction}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-medium',
                              d.direction === 'Long' ? 'text-emerald-600' : 'text-rose-600'
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
                              d.direction === 'Long' ? 'bg-emerald-500' : 'bg-rose-500'
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

              {/* Trade Volume by Month */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade Volume by Month</CardTitle>
                  <CardDescription>How active you were each month</CardDescription>
                </CardHeader>
                <CardContent className='h-[260px] px-2'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={monthVol} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis
                        dataKey='month'
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Bar dataKey='trades' fill='#0ea5e9' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Performance</CardTitle>
                <CardDescription>Wins, losses and net P&L by playbook setup</CardDescription>
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
                          <td className='py-2 text-end tabular-nums text-red-600'>
                            {s.trades - s.wins}
                          </td>
                          <td className='py-2 text-end tabular-nums'>{s.winRate.toFixed(1)}%</td>
                          <td
                            className={cn(
                              'py-2 text-end tabular-nums font-semibold',
                              s.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}
                          >
                            {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {byStrategy.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className='py-8 text-center text-sm text-muted-foreground'
                          >
                            No data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Timeframe Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Timeframe</CardTitle>
                <CardDescription>Which chart timeframe yields best results</CardDescription>
              </CardHeader>
              <CardContent className='h-[260px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={byTimeframe} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='timeframe'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toFixed(2)}`, 'P&L']
                          : ['$0.00', 'P&L']
                      }
                    />
                    <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
                      {byTimeframe.map((t, i) => (
                        <Cell key={i} fill={t.pnl >= 0 ? '#6366f1' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PSYCHOLOGY (Psychology & Discipline Model) ─── */}
          <TabsContent value='psychology' className='space-y-6'>
            <div className='flex items-center gap-2'>
              <Brain className='size-5 text-purple-600' />
              <div>
                <h3 className='font-semibold'>Psychology & Discipline Model</h3>
                <p className='text-sm text-muted-foreground'>
                  Emotional state tracking, discipline scoring, and revenge trading detection
                </p>
              </div>
            </div>

            {/* Discipline Summary Cards */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardContent className='pt-6'>
                  <p className='text-sm font-medium text-muted-foreground'>Discipline Score</p>
                  <p
                    className={cn(
                      'mt-1 text-3xl font-black tabular-nums',
                      (() => {
                        const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
                        const discTrades = emotionData
                          .filter((e) => goodEmotions.includes(e.emotion))
                          .reduce((s, e) => s + e.trades, 0)
                        const pct = totalEm > 0 ? (discTrades / totalEm) * 100 : 0
                        return pct >= 70
                          ? 'text-emerald-600'
                          : pct >= 40
                            ? 'text-amber-500'
                            : 'text-red-500'
                      })()
                    )}
                  >
                    {(() => {
                      const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
                      const discTrades = emotionData
                        .filter((e) => goodEmotions.includes(e.emotion))
                        .reduce((s, e) => s + e.trades, 0)
                      return totalEm > 0 ? `${((discTrades / totalEm) * 100).toFixed(0)}%` : 'N/A'
                    })()}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>Disciplined trade ratio</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='pt-6'>
                  <p className='text-sm font-medium text-muted-foreground'>Revenge Trades</p>
                  <p
                    className={cn(
                      'mt-1 text-3xl font-black tabular-nums',
                      revenge.count === 0
                        ? 'text-emerald-600'
                        : revenge.pct > 20
                          ? 'text-red-500'
                          : 'text-amber-500'
                    )}
                  >
                    {revenge.count}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {revenge.pct.toFixed(1)}% of all trades
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='pt-6'>
                  <p className='text-sm font-medium text-muted-foreground'>A-Game Trades</p>
                  <p className='mt-1 text-3xl font-black tabular-nums text-emerald-600'>
                    {emotionData
                      .filter((e) => goodEmotions.includes(e.emotion))
                      .reduce((s, e) => s + e.trades, 0)}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Disciplined / calm / confident
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='pt-6'>
                  <p className='text-sm font-medium text-muted-foreground'>B-Game Trades</p>
                  <p className='mt-1 text-3xl font-black tabular-nums text-red-500'>
                    {emotionData
                      .filter((e) => badEmotions.includes(e.emotion))
                      .reduce((s, e) => s + e.trades, 0)}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>FOMO / revenge / tilted</p>
                </CardContent>
              </Card>
            </div>

            {/* Emotion P&L Chart */}
            <Card>
              <CardHeader>
                <CardTitle>P&L by Emotional State</CardTitle>
                <CardDescription>
                  How your mindset at entry affects your bottom line
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[300px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={emotionData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='emotion'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toFixed(2)}`, 'P&L']
                          : ['$0.00', 'P&L']
                      }
                    />
                    <Bar dataKey='pnl' radius={[4, 4, 0, 0]}>
                      {emotionData.map((e, i) => (
                        <Cell
                          key={i}
                          fill={
                            goodEmotions.includes(e.emotion)
                              ? '#10b981'
                              : badEmotions.includes(e.emotion)
                                ? '#ef4444'
                                : '#94a3b8'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Win Rate by Emotion Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Win Rate by Emotion</CardTitle>
                <CardDescription>
                  Your accuracy when trading in different mental states
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[280px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={emotionData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='emotion'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`${value.toFixed(1)}%`, 'Win Rate']
                          : ['0%', 'Win Rate']
                      }
                    />
                    <Bar dataKey='winRate' radius={[4, 4, 0, 0]}>
                      {emotionData.map((e, i) => (
                        <Cell
                          key={i}
                          fill={
                            goodEmotions.includes(e.emotion)
                              ? '#6366f1'
                              : badEmotions.includes(e.emotion)
                                ? '#f97316'
                                : '#94a3b8'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emotion Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Emotion Breakdown Table</CardTitle>
                <CardDescription>Full stats by emotional state at entry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[560px] text-sm'>
                    <thead className='text-xs uppercase text-muted-foreground'>
                      <tr className='border-b'>
                        <th className='py-2 text-start'>Emotion</th>
                        <th className='py-2 text-center'>Type</th>
                        <th className='py-2 text-end'>Trades</th>
                        <th className='py-2 text-end'>Win %</th>
                        <th className='py-2 text-end'>Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emotionData.map((e) => {
                        const type = goodEmotions.includes(e.emotion)
                          ? 'A-Game'
                          : badEmotions.includes(e.emotion)
                            ? 'B-Game'
                            : 'Neutral'
                        return (
                          <tr key={e.emotion} className='border-b last:border-0'>
                            <td className='py-2 font-medium capitalize'>{e.emotion}</td>
                            <td className='py-2 text-center'>
                              <Badge
                                variant={
                                  type === 'A-Game'
                                    ? 'default'
                                    : type === 'B-Game'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className='text-xs'
                              >
                                {type}
                              </Badge>
                            </td>
                            <td className='py-2 text-end tabular-nums'>{e.trades}</td>
                            <td className='py-2 text-end tabular-nums'>{e.winRate}%</td>
                            <td
                              className={cn(
                                'py-2 text-end tabular-nums font-semibold',
                                e.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                              )}
                            >
                              {e.pnl >= 0 ? '+' : ''}${e.pnl.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                      {emotionData.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className='py-8 text-center text-sm text-muted-foreground'
                          >
                            Tag your trades with emotions to see data here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Revenge Trading Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <AlertTriangle className='size-4 text-amber-500' />
                  Revenge Trading Detection
                </CardTitle>
                <CardDescription>
                  Trades opened within 15 minutes of a losing trade closing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 sm:grid-cols-3'>
                  <div className='rounded-lg border p-4 text-center'>
                    <div
                      className={cn(
                        'text-3xl font-black',
                        revenge.count === 0 ? 'text-emerald-600' : 'text-red-500'
                      )}
                    >
                      {revenge.count}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>Revenge Trades</div>
                  </div>
                  <div className='rounded-lg border p-4 text-center'>
                    <div
                      className={cn(
                        'text-3xl font-black',
                        revenge.pct < 10
                          ? 'text-emerald-600'
                          : revenge.pct < 25
                            ? 'text-amber-500'
                            : 'text-red-500'
                      )}
                    >
                      {revenge.pct.toFixed(1)}%
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>of all trades</div>
                  </div>
                  <div className='rounded-lg border p-4 text-center'>
                    <div className='text-3xl font-black text-muted-foreground'>
                      {revenge.count === 0 ? '✓' : revenge.pct > 20 ? '✗' : '!'}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {revenge.count === 0
                        ? 'Clean — no revenge trading'
                        : revenge.pct > 20
                          ? 'High — take breaks after losses'
                          : 'Moderate — watch your entries'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── RISK (Risk Management Model) ─── */}
          <TabsContent value='risk' className='space-y-6'>
            <div className='flex items-center gap-2'>
              <Shield className='size-5 text-blue-600' />
              <div>
                <h3 className='font-semibold'>Risk Management Model</h3>
                <p className='text-sm text-muted-foreground'>
                  Position sizing, drawdown, exposure limits, and consecutive loss protection
                </p>
              </div>
            </div>

            {/* Risk KPIs */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Stat
                label='Max Drawdown'
                value={`$${Math.abs(dd.maxDrawdown).toFixed(2)}`}
                sub={`${Math.abs(dd.maxDrawdownPct).toFixed(2)}% of peak`}
                positive={false}
              />
              <Stat
                label='Largest Loss Streak'
                value={`${stats.largestLossStreak} trades`}
                positive={stats.largestLossStreak <= 3}
                icon={Snowflake}
              />
              <Stat
                label='Best Win Streak'
                value={`${stats.largestWinStreak} trades`}
                positive={true}
                icon={Flame}
              />
              <Stat
                label='Avg R per Trade'
                value={`${stats.avgR.toFixed(2)}R`}
                positive={stats.avgR >= 0}
                icon={Target}
              />
            </div>

            {/* Drawdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Drawdown Curve</CardTitle>
                <CardDescription>
                  Max drawdown: ${Math.abs(dd.maxDrawdown).toFixed(2)} (
                  {Math.abs(dd.maxDrawdownPct).toFixed(2)}%)
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[300px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={ddChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id='ddFill2' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#ef4444' stopOpacity={0.4} />
                        <stop offset='100%' stopColor='#ef4444' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='date'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toFixed(2)}`, 'Drawdown']
                          : ['$0.00', 'Drawdown']
                      }
                    />
                    <Area
                      type='monotone'
                      dataKey='drawdown'
                      stroke='#ef4444'
                      strokeWidth={2}
                      fill='url(#ddFill2)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Lot Size Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lot Size Distribution</CardTitle>
                  <CardDescription>Position sizing consistency — stay in your lane</CardDescription>
                </CardHeader>
                <CardContent className='h-[280px] px-2'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={lotDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis
                        dataKey='bucket'
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Bar dataKey='count' fill='#6366f1' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Snapshot</CardTitle>
                  <CardDescription>Key risk metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 pt-4'>
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
                    positive={false}
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

            {/* Pip Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Pip Distribution</CardTitle>
                <CardDescription>
                  Frequency of pip outcomes across all closed trades
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[260px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={pipDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='bucket'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar dataKey='count' radius={[4, 4, 0, 0]}>
                      {pipDist.map((p, i) => (
                        <Cell
                          key={i}
                          fill={
                            p.bucket.startsWith('+') || p.bucket.startsWith('0 to')
                              ? '#10b981'
                              : '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TIME ─── */}
          <TabsContent value='time' className='space-y-6'>
            <div className='flex items-center gap-2'>
              <Clock className='size-5 text-amber-600' />
              <div>
                <h3 className='font-semibold'>Time-Based Analysis</h3>
                <p className='text-sm text-muted-foreground'>
                  Session, hour, day of week, and hold time patterns
                </p>
              </div>
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              {/* By Session */}
              <Card>
                <CardHeader>
                  <CardTitle>By Trading Session</CardTitle>
                  <CardDescription>When are you most profitable?</CardDescription>
                </CardHeader>
                <CardContent className='h-[280px] px-2'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={bySession} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis
                        dataKey='session'
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        formatter={(value: unknown) =>
                          typeof value === 'number'
                            ? [`$${value.toFixed(2)}`, 'P&L']
                            : ['$0.00', 'P&L']
                        }
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

              {/* By Day of Week */}
              <Card>
                <CardHeader>
                  <CardTitle>By Day of Week</CardTitle>
                  <CardDescription>Profitability across weekdays</CardDescription>
                </CardHeader>
                <CardContent className='h-[280px] px-2'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={byDow} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis
                        dataKey='day'
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        stroke='#888'
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        formatter={(value: unknown) =>
                          typeof value === 'number'
                            ? [`$${value.toFixed(2)}`, 'P&L']
                            : ['$0.00', 'P&L']
                        }
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
            </div>

            {/* Hour of Day */}
            <Card>
              <CardHeader>
                <CardTitle>By Hour of Day</CardTitle>
                <CardDescription>P&L by trade open hour (local time)</CardDescription>
              </CardHeader>
              <CardContent className='h-[280px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={byHour} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='label'
                      fontSize={10}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      interval={1}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toFixed(2)}`, 'P&L']
                          : ['$0.00', 'P&L']
                      }
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

            {/* Hold Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Hold Time Distribution</CardTitle>
                <CardDescription>
                  How long you hold trades — avg wins {formatHoldTime(hold.avgWinMin)} vs losses{' '}
                  {formatHoldTime(hold.avgLossMin)}
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[260px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={holdDist} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='bucket'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar dataKey='count' fill='#f59e0b' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Win Rate Table */}
            <Card>
              <CardHeader>
                <CardTitle>Session Breakdown</CardTitle>
                <CardDescription>Detailed stats per session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[500px] text-sm'>
                    <thead className='text-xs uppercase text-muted-foreground'>
                      <tr className='border-b'>
                        <th className='py-2 text-start'>Session</th>
                        <th className='py-2 text-end'>Trades</th>
                        <th className='py-2 text-end'>Win %</th>
                        <th className='py-2 text-end'>Total Pips</th>
                        <th className='py-2 text-end'>Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bySession.map((s) => (
                        <tr key={s.session} className='border-b last:border-0'>
                          <td className='py-2 font-medium'>{s.session}</td>
                          <td className='py-2 text-end tabular-nums'>{s.trades}</td>
                          <td className='py-2 text-end tabular-nums'>{s.winRate}%</td>
                          <td
                            className={cn(
                              'py-2 text-end tabular-nums',
                              s.pips >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}
                          >
                            {s.pips >= 0 ? '+' : ''}
                            {s.pips}
                          </td>
                          <td
                            className={cn(
                              'py-2 text-end tabular-nums font-semibold',
                              s.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}
                          >
                            {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {bySession.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className='py-8 text-center text-sm text-muted-foreground'
                          >
                            No data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SYMBOLS (Market Pattern / Setup Model) ─── */}
          <TabsContent value='symbols' className='space-y-6'>
            <div className='flex items-center gap-2'>
              <Zap className='size-5 text-yellow-500' />
              <div>
                <h3 className='font-semibold'>Market Pattern & Symbol Model</h3>
                <p className='text-sm text-muted-foreground'>
                  Which pairs and setups perform best — session-based pair behavior
                </p>
              </div>
            </div>

            {/* P&L by Pair */}
            <Card>
              <CardHeader>
                <CardTitle>P&L by Pair</CardTitle>
                <CardDescription>Net profit and loss per symbol</CardDescription>
              </CardHeader>
              <CardContent className='h-[300px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={byPair} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='pair'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`$${value.toFixed(2)}`, 'P&L']
                          : ['$0.00', 'P&L']
                      }
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

            {/* Pips by Pair */}
            <Card>
              <CardHeader>
                <CardTitle>Pips by Pair</CardTitle>
                <CardDescription>Total pip gain/loss per symbol</CardDescription>
              </CardHeader>
              <CardContent className='h-[280px] px-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={byPair} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='pair'
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke='#888'
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown) =>
                        typeof value === 'number'
                          ? [`${value.toFixed(1)} pips`, 'Pips']
                          : ['0 pips', 'Pips']
                      }
                    />
                    <Bar dataKey='pips' radius={[4, 4, 0, 0]}>
                      {byPair.map((p, i) => (
                        <Cell key={i} fill={p.pips >= 0 ? '#0ea5e9' : '#f97316'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pair Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Symbol Deep Dive</CardTitle>
                <CardDescription>Full breakdown per currency pair</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[720px] text-sm'>
                    <thead className='text-xs uppercase text-muted-foreground'>
                      <tr className='border-b'>
                        <th className='py-2 text-start'>Pair</th>
                        <th className='py-2 text-end'>Trades</th>
                        <th className='py-2 text-end'>Wins</th>
                        <th className='py-2 text-end'>Losses</th>
                        <th className='py-2 text-end'>Win %</th>
                        <th className='py-2 text-end'>Avg Pips</th>
                        <th className='py-2 text-end'>Avg Lot</th>
                        <th className='py-2 text-end'>Avg Hold</th>
                        <th className='py-2 text-end'>Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byPairDetailed.map((p) => (
                        <tr key={p.pair} className='border-b last:border-0'>
                          <td className='py-2 font-medium'>{p.pair}</td>
                          <td className='py-2 text-end tabular-nums'>{p.trades}</td>
                          <td className='py-2 text-end tabular-nums text-emerald-600'>{p.wins}</td>
                          <td className='py-2 text-end tabular-nums text-red-500'>{p.losses}</td>
                          <td className='py-2 text-end tabular-nums'>{p.winRate}%</td>
                          <td
                            className={cn(
                              'py-2 text-end tabular-nums',
                              p.avgPips >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}
                          >
                            {p.avgPips >= 0 ? '+' : ''}
                            {p.avgPips}
                          </td>
                          <td className='py-2 text-end tabular-nums'>{p.avgLotSize}</td>
                          <td className='py-2 text-end tabular-nums'>
                            {formatHoldTime(p.avgHoldMin)}
                          </td>
                          <td
                            className={cn(
                              'py-2 text-end tabular-nums font-semibold',
                              p.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}
                          >
                            {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {byPairDetailed.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className='py-8 text-center text-sm text-muted-foreground'
                          >
                            No closed trades yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
