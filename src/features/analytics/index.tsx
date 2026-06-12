import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  CandlestickChart,
  Clock,
  Download,
  Flame,
  Info,
  Shield,
  Snowflake,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
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
  useDateRangeStore,
  filterTradesByDateRange,
} from '@/stores/date-range-store'
import { useTrades } from '@/stores/trades-store'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { cn } from '@/lib/utils'
import { useActiveAccount } from '@/hooks/use-accounts-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfigDrawer } from '@/components/config-drawer'
import { DateRangeFilter } from '@/components/date-range-filter'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { MonthlyPnl } from '@/features/dashboard/components/monthly-pnl'
import type { Trade } from '@/features/trades/data/schema'
import {
  computeStats,
  computeAdvancedStats,
  formatProfitFactor,
  rollingStats,
  bestWorstPeriods,
  calendarHeatmap,
  plannedVsActualRR,
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
  tooltip,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
  icon?: React.ElementType
  tooltip?: string
}) {
  const cell = (
    <div className='cursor-default border-b px-1 py-3 last:border-r-0 sm:border-r sm:border-b-0 sm:px-4'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1'>
          <p className='text-xs font-medium text-muted-foreground uppercase'>
            {label}
          </p>
          {tooltip && <Info className='size-3 text-muted-foreground/50' />}
        </div>
        {Icon && <Icon className='size-3.5 text-muted-foreground' />}
      </div>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          positive === true && 'text-emerald-600',
          positive === false && 'text-red-500'
        )}
      >
        {value}
      </p>
      {sub && <p className='mt-0.5 text-xs text-muted-foreground'>{sub}</p>}
    </div>
  )

  if (!tooltip) return cell
  return (
    <UITooltip>
      <TooltipTrigger asChild>{cell}</TooltipTrigger>
      <TooltipContent className='max-w-56 text-xs' side='top'>
        {tooltip}
      </TooltipContent>
    </UITooltip>
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
    <div className='flex items-center justify-between gap-3 border-b py-2 last:border-b-0'>
      <span className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </span>
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
  )
}

function computeTraderScore(
  stats: ReturnType<typeof computeStats>,
  emotionData: ReturnType<typeof groupByEmotion>
) {
  const wrScore = Math.min(30, (stats.winRate / 60) * 30)
  const pfScore = Math.min(
    25,
    (Math.min(Math.max(stats.profitFactor, 0), 2) / 2) * 25
  )
  const rScore = Math.min(
    25,
    (Math.max(0, Math.min(stats.avgR, 1.5)) / 1.5) * 25
  )
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

function tagValue(tags: string[] = [], key: string) {
  return (
    tags.find((tag) => tag.startsWith(`${key}:`))?.slice(key.length + 1) ?? ''
  )
}

function labelize(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function computeProcessReview(trades: Trade[]) {
  const closed = trades.filter((t) => t.status !== 'open')
  const reviewed = closed.filter((t) =>
    ['entry', 'exit', 'plan', 'market', 'manage'].some((key) =>
      t.tags?.some((tag) => tag.startsWith(`${key}:`))
    )
  )
  const followedPlan = closed.filter(
    (t) => tagValue(t.tags, 'plan') === 'followed'
  )
  const brokenPlan = closed.filter((t) => tagValue(t.tags, 'plan') === 'broken')
  const aGrade = closed.filter((t) =>
    ['A+', 'A'].includes(tagValue(t.tags, 'entry'))
  )
  const management = new Map<
    string,
    { label: string; trades: number; pnl: number }
  >()
  for (const trade of closed) {
    const key = tagValue(trade.tags, 'manage')
    if (!key) continue
    const cur = management.get(key) ?? { label: key, trades: 0, pnl: 0 }
    cur.trades += 1
    cur.pnl += trade.pnl
    management.set(key, cur)
  }
  const managementRows = Array.from(management.values())
    .map((row) => ({
      ...row,
      label: labelize(row.label),
      pnl: parseFloat(row.pnl.toFixed(2)),
      avg: row.trades ? parseFloat((row.pnl / row.trades).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl)

  return {
    reviewed,
    reviewedPct: closed.length ? (reviewed.length / closed.length) * 100 : 0,
    followedPlanPct: closed.length
      ? (followedPlan.length / closed.length) * 100
      : 0,
    brokenPlan: brokenPlan.length,
    aGradePct: closed.length ? (aGrade.length / closed.length) * 100 : 0,
    bestManagement: managementRows[0],
    worstManagement: managementRows[managementRows.length - 1],
    managementRows,
  }
}

function detectWeaknesses(
  stats: ReturnType<typeof computeStats>,
  emotionData: ReturnType<typeof groupByEmotion>,
  revenge: { count: number; pct: number }
): string[] {
  const issues: string[] = []
  if (stats.winRate < 40)
    issues.push('Win rate below 40% — review your entry criteria')
  if (stats.profitFactor < 1)
    issues.push('Profit factor below 1.0 — you are losing money overall')
  if (stats.avgR < 0)
    issues.push('Negative average R — losses outweigh gains per trade')
  if (revenge.pct > 20)
    issues.push(
      `High revenge trading rate (${revenge.pct.toFixed(0)}%) — take breaks after losses`
    )
  const badEmotions = ['fomo', 'revenge', 'tilted', 'greedy', 'fearful']
  const totalEm = emotionData.reduce((s, e) => s + e.trades, 0)
  const badTrades = emotionData
    .filter((e) => badEmotions.includes(e.emotion))
    .reduce((s, e) => s + e.trades, 0)
  if (totalEm > 0 && badTrades / totalEm > 0.3)
    issues.push('Over 30% of trades tagged with negative emotions')
  if (stats.largestLossStreak >= 5)
    issues.push(
      `Loss streak of ${stats.largestLossStreak} — consider daily loss limits`
    )
  return issues
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function formatMoney(value: number) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`
}

function formatWinShare(wins: number, total: number) {
  const pct = total > 0 ? (wins / total) * 100 : 0
  return `(${wins}/${total}) ${pct.toFixed(0)}%`
}

function coachToneClass(tone: 'good' | 'warn' | 'bad' | 'neutral') {
  if (tone === 'good') return 'border-emerald-500/30 bg-emerald-500/5'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/5'
  if (tone === 'bad') return 'border-red-500/30 bg-red-500/5'
  return 'bg-card'
}

function CoachCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
  tone?: 'good' | 'warn' | 'bad' | 'neutral'
}) {
  return (
    <div
      className={cn('border-b px-1 py-3 last:border-b-0', coachToneClass(tone))}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-medium text-muted-foreground uppercase'>
            {title}
          </p>
          <p className='mt-1 text-base leading-tight font-semibold'>{value}</p>
        </div>
        <Icon className='size-4 shrink-0 text-muted-foreground' />
      </div>
      <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
    </div>
  )
}

function EmptyAnalyticsState({ hasAnyTrades }: { hasAnyTrades: boolean }) {
  return (
    <Card className='border-dashed'>
      <CardHeader className='items-center text-center'>
        <div className='mb-2 flex size-12 items-center justify-center rounded-full bg-muted'>
          <TrendingUp className='size-5' />
        </div>
        <CardTitle className='text-base'>
          {hasAnyTrades
            ? 'No trades in this date range'
            : 'Analytics starts after your first trades'}
        </CardTitle>
        <CardDescription className='max-w-xl'>
          {hasAnyTrades
            ? 'Change the date range to bring trades back into the report.'
            : 'Import an MT5 detailed report to unlock your edge, risk, timing and psychology breakdowns.'}
        </CardDescription>
      </CardHeader>
      {!hasAnyTrades && (
        <CardContent className='flex flex-wrap justify-center gap-2'>
          <Button asChild>
            <Link to='/tasks' search={{ import: true }}>
              <Download className='size-4' />
              Import MT5 report
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link to='/tasks' search={{ new: true }}>
              <CandlestickChart className='size-4' />
              Log one trade
            </Link>
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

export function Analytics() {
  const allTrades = useTrades()
  const activeAccount = useActiveAccount()
  const dateRange = useDateRangeStore()
  const tradingSettings = useTradingSettings()
  const range = dateRange.getRange()
  const trades = filterTradesByDateRange(allTrades, range)
  const startingBalance = activeAccount?.startingBalance ?? 10000

  const stats = computeStats(trades)
  const advanced = computeAdvancedStats(trades, startingBalance)
  const rolling10 = rollingStats(trades, 10)
  const rolling20 = rollingStats(trades, 20)
  const periods = bestWorstPeriods(trades)
  const heatmapData = calendarHeatmap(trades, 3)
  const rrData = plannedVsActualRR(trades)
  const emotionData = groupByEmotion(trades)
  const revenge = detectRevengeTrades(trades)
  const processReview = computeProcessReview(trades)
  const weaknesses = detectWeaknesses(stats, emotionData, revenge)
  const traderScore = computeTraderScore(stats, emotionData)

  const eq = equityCurve(trades, startingBalance).map((d) => ({
    date: formatMonthDay(d.date),
    equity: Math.round(d.balance),
  }))
  const dd = drawdownSeries(trades, startingBalance)
  const ddChart = dd.series.map((d) => ({
    date: formatMonthDay(d.date),
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

  const ftmoSize = tradingSettings.ftmoAccountSize
  const ftmoDailyLimit =
    (ftmoSize * tradingSettings.ftmoDailyLossLimitPct) / 100
  const ftmoMaxDD = (ftmoSize * tradingSettings.ftmoMaxDrawdownPct) / 100
  const ftmoProfitTarget =
    (ftmoSize * tradingSettings.ftmoProfitTargetPct) / 100
  const ftmoCurrentDD = Math.abs(dd.maxDrawdown)
  const ftmoProfit = stats.totalPnl

  const scoreColor =
    traderScore >= 70
      ? 'text-emerald-600'
      : traderScore >= 45
        ? 'text-amber-500'
        : 'text-red-500'
  const scoreLabel =
    traderScore >= 70
      ? 'Elite'
      : traderScore >= 45
        ? 'Developing'
        : 'Needs Work'

  const goodEmotions = ['disciplined', 'calm', 'confident']
  const badEmotions = ['fomo', 'revenge', 'tilted', 'greedy', 'fearful']
  const closedTrades = stats.wins + stats.losses + stats.breakeven
  const bestPair = byPairDetailed[0]
  const bestStrategy = byStrategy[0]
  const bestSession = [...bySession].sort((a, b) => b.pnl - a.pnl)[0]
  const hasFilteredTrades = trades.length > 0
  const primaryFocus =
    closedTrades < 10
      ? {
          value: 'Collect more data',
          description:
            'Log at least 10 closed trades before trusting the deeper signals.',
          tone: 'neutral' as const,
        }
      : weaknesses[0]
        ? {
            value: weaknesses[0].split(' — ')[0],
            description:
              weaknesses[0].split(' — ')[1] ??
              'Review this area before taking the next setup.',
            tone: 'warn' as const,
          }
        : stats.totalPnl >= 0 && stats.profitFactor >= 1.2
          ? {
              value: 'Protect what is working',
              description:
                'Your edge is positive. Focus on repeating the same A-grade setups.',
              tone: 'good' as const,
            }
          : {
              value: 'Tighten risk first',
              description:
                'Before chasing win rate, reduce losses and keep risk consistent.',
              tone: 'bad' as const,
            }
  const bestEdge =
    bestPair && bestPair.trades >= 2
      ? {
          value: bestPair.pair,
          description: `${formatMoney(bestPair.pnl)} across ${bestPair.trades} trades, ${bestPair.winRate}% win rate.`,
        }
      : bestStrategy
        ? {
            value: bestStrategy.strategy,
            description: `${formatMoney(bestStrategy.pnl)} across ${bestStrategy.trades} trades, ${bestStrategy.winRate.toFixed(1)}% win rate.`,
          }
        : bestSession
          ? {
              value: `${bestSession.session} session`,
              description: `${formatMoney(bestSession.pnl)} across ${bestSession.trades} trades, ${bestSession.winRate}% win rate.`,
            }
          : {
              value: 'No clear edge yet',
              description:
                'Your best pair or setup will appear once you have more closed trades.',
            }
  const riskTone =
    dd.maxDrawdownPct >= tradingSettings.ftmoMaxDrawdownPct * 0.75
      ? 'bad'
      : stats.profitFactor >= 1.2
        ? 'good'
        : 'warn'
  const riskValue =
    dd.maxDrawdownPct > 0
      ? `${dd.maxDrawdownPct.toFixed(1)}% drawdown`
      : 'No drawdown yet'
  const riskDescription =
    riskTone === 'bad'
      ? 'Drawdown is getting close to your limit. Reduce size until the curve stabilizes.'
      : riskTone === 'good'
        ? 'Risk is under control relative to your current results.'
        : 'Keep position size consistent while the edge is still forming.'
  const disciplineValue =
    revenge.count > 0
      ? `${revenge.count} revenge trade${revenge.count === 1 ? '' : 's'}`
      : 'No revenge pattern'
  const disciplineTone =
    revenge.pct > 20 ? 'bad' : revenge.count > 0 ? 'warn' : 'good'
  const disciplineDescription =
    revenge.count > 0
      ? `${revenge.pct.toFixed(0)}% of post-loss trades happened within 15 minutes.`
      : 'No fast post-loss revenge pattern detected in this range.'

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <DateRangeFilter />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>
            Start with the coaching cards, then open the deeper reports when you
            need the detail.
          </p>
        </div>

        {!hasFilteredTrades ? (
          <EmptyAnalyticsState hasAnyTrades={allTrades.length > 0} />
        ) : (
          <>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle>Trading Report</CardTitle>
                <CardDescription>
                  Focus, edge, risk, and discipline without the extra clutter
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-x-6 md:grid-cols-2 xl:grid-cols-4'>
                <CoachCard
                  title='Next focus'
                  value={primaryFocus.value}
                  description={primaryFocus.description}
                  icon={Target}
                  tone={primaryFocus.tone}
                />
                <CoachCard
                  title='Best edge'
                  value={bestEdge.value}
                  description={bestEdge.description}
                  icon={Trophy}
                  tone={bestPair || bestStrategy ? 'good' : 'neutral'}
                />
                <CoachCard
                  title='Risk status'
                  value={riskValue}
                  description={riskDescription}
                  icon={Shield}
                  tone={riskTone}
                />
                <CoachCard
                  title='Discipline check'
                  value={disciplineValue}
                  description={disciplineDescription}
                  icon={Brain}
                  tone={disciplineTone}
                />
              </CardContent>
            </Card>

            <Tabs defaultValue='overview' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-3 lg:grid-cols-6'>
                <TabsTrigger value='overview'>Coach</TabsTrigger>
                <TabsTrigger value='performance'>Results</TabsTrigger>
                <TabsTrigger value='psychology'>Mindset</TabsTrigger>
                <TabsTrigger value='risk'>Risk</TabsTrigger>
                <TabsTrigger value='time'>Timing</TabsTrigger>
                <TabsTrigger value='symbols'>Pairs</TabsTrigger>
              </TabsList>

              {/* ─── OVERVIEW ─── */}
              <TabsContent value='overview' className='space-y-6'>
                {/* Trader Score */}
                <Card>
                  <CardContent className='pt-6'>
                    <div className='flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-8'>
                      <div className='flex flex-col items-center'>
                        <div
                          className={cn(
                            'text-7xl font-black tabular-nums',
                            scoreColor
                          )}
                        >
                          {traderScore}
                        </div>
                        <div className='mt-1 text-sm font-semibold text-muted-foreground'>
                          / 100 — {scoreLabel}
                        </div>
                        <div className='mt-2 flex items-center gap-1'>
                          <Trophy className='size-4 text-amber-500' />
                          <span className='text-xs text-muted-foreground'>
                            Overall Trader Score
                          </span>
                        </div>
                      </div>
                      <div className='flex-1 space-y-2 text-sm'>
                        <p className='font-medium'>Score Breakdown</p>
                        {[
                          {
                            label: 'Win Rate',
                            pts: Math.round(
                              Math.min(30, (stats.winRate / 60) * 30)
                            ),
                            max: 30,
                          },
                          {
                            label: 'Profit Factor',
                            pts: Math.round(
                              Math.min(
                                25,
                                (Math.min(Math.max(stats.profitFactor, 0), 2) /
                                  2) *
                                  25
                              )
                            ),
                            max: 25,
                          },
                          {
                            label: 'Avg R Multiple',
                            pts: Math.round(
                              Math.min(
                                25,
                                (Math.max(0, Math.min(stats.avgR, 1.5)) / 1.5) *
                                  25
                              )
                            ),
                            max: 25,
                          },
                          {
                            label: 'Discipline',
                            pts: Math.round(
                              (() => {
                                const totalEm = emotionData.reduce(
                                  (s, e) => s + e.trades,
                                  0
                                )
                                const discTrades = emotionData
                                  .filter((e) =>
                                    goodEmotions.includes(e.emotion)
                                  )
                                  .reduce((s, e) => s + e.trades, 0)
                                return totalEm > 0
                                  ? (discTrades / totalEm) * 20
                                  : 10
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
                                style={{
                                  width: `${(row.pts / row.max) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {weaknesses.length > 0 && (
                        <div className='flex-1 space-y-2'>
                          <p className='flex items-center gap-1 text-sm font-medium text-amber-600'>
                            <AlertTriangle className='size-4' /> Weaknesses
                            Detected
                          </p>
                          <ul className='space-y-1'>
                            {weaknesses.map((w, i) => (
                              <li
                                key={i}
                                className='text-xs text-muted-foreground'
                              >
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
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
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
                    value={formatProfitFactor(stats.profitFactor)}
                    positive={stats.profitFactor >= 1}
                  />
                  <Stat
                    label='Expectancy'
                    value={`$${stats.expectancy.toFixed(2)}`}
                    sub='per trade'
                    positive={stats.expectancy >= 0}
                  />
                </div>
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
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
                    value={`${stats.bestTrade >= 0 ? '+' : ''}$${stats.bestTrade.toFixed(0)} / ${stats.worstTrade >= 0 ? '+' : ''}$${stats.worstTrade.toFixed(0)}`}
                  />
                  <Stat
                    label='Avg Hold Time'
                    value={formatHoldTime(hold.avgAllMin)}
                    sub={`Wins ${formatHoldTime(hold.avgWinMin)} · Losses ${formatHoldTime(hold.avgLossMin)}`}
                    tooltip='Average time in a trade. Winning trades held longer than losses is a healthy sign.'
                  />
                </div>

                {/* Advanced Ratios Row 1 */}
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
                  <Stat
                    label='Sharpe Ratio'
                    value={
                      isFinite(advanced.sharpeRatio)
                        ? advanced.sharpeRatio.toFixed(2)
                        : '—'
                    }
                    positive={advanced.sharpeRatio > 0}
                    tooltip='Risk-adjusted return (annualised). Above 1.0 is good, above 2.0 is excellent. Negative means you are losing more than the risk taken.'
                  />
                  <Stat
                    label='Sortino Ratio'
                    value={
                      isFinite(advanced.sortinoRatio)
                        ? advanced.sortinoRatio.toFixed(2)
                        : '—'
                    }
                    positive={advanced.sortinoRatio > 0}
                    tooltip='Like Sharpe but only penalises downside volatility. A Sortino above 1.5 is strong for retail traders.'
                  />
                  <Stat
                    label='Calmar Ratio'
                    value={
                      isFinite(advanced.calmarRatio)
                        ? advanced.calmarRatio.toFixed(2)
                        : '—'
                    }
                    positive={advanced.calmarRatio > 0}
                    tooltip='Annualised return divided by max drawdown %. Higher is better. Below 0.5 means your drawdown is eating your returns.'
                  />
                  <Stat
                    label='Payoff Ratio'
                    value={
                      isFinite(advanced.payoffRatio) &&
                      advanced.payoffRatio < 99
                        ? advanced.payoffRatio.toFixed(2)
                        : stats.avgLoss === 0
                          ? '∞'
                          : '—'
                    }
                    positive={advanced.payoffRatio >= 1}
                    tooltip='Average win divided by average loss. Above 1.0 means your winners are bigger than your losers. Aim for 1.5+.'
                  />
                </div>

                {/* Advanced Ratios Row 2 */}
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
                  <Stat
                    label='Recovery Factor'
                    value={
                      isFinite(advanced.recoveryFactor)
                        ? advanced.recoveryFactor.toFixed(2)
                        : '—'
                    }
                    positive={advanced.recoveryFactor > 1}
                    tooltip='Net P&L divided by max drawdown in dollars. Above 3.0 is very good — you earn back losses quickly.'
                  />
                  <Stat
                    label='Z-Score'
                    value={
                      isFinite(advanced.zScore)
                        ? advanced.zScore.toFixed(2)
                        : '—'
                    }
                    tooltip='Statistical runs test. Negative Z-Score means wins and losses cluster (streaky). Near 0 is random, as expected.'
                  />
                  <Stat
                    label='Kelly %'
                    value={`${advanced.kellyPct.toFixed(1)}%`}
                    positive={advanced.kellyPct > 0}
                    tooltip='Mathematically optimal % of account to risk per trade. In practice, use 25–50% of Kelly to stay conservative.'
                  />
                  <Stat
                    label='Consistency'
                    value={`${advanced.consistencyPct.toFixed(1)}%`}
                    sub={`${advanced.profitableDays}P · ${advanced.losingDays}L days`}
                    positive={advanced.consistencyPct >= 50}
                    tooltip='Percentage of trading days that were profitable. Top traders aim for 60%+ consistent profitable days.'
                  />
                </div>

                {/* Gross P&L + Rolling Performance */}
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gross P&L Breakdown</CardTitle>
                      <CardDescription>
                        Total winning vs losing amounts before netting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4 pt-2'>
                      <div className='flex items-center justify-between rounded-lg bg-emerald-500/10 p-3'>
                        <span className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                          Gross Profit
                        </span>
                        <span className='text-lg font-bold text-emerald-600 tabular-nums'>
                          +${advanced.grossProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between rounded-lg bg-red-500/10 p-3'>
                        <span className='text-sm font-medium text-red-700 dark:text-red-400'>
                          Gross Loss
                        </span>
                        <span className='text-lg font-bold text-red-500 tabular-nums'>
                          -${advanced.grossLoss.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between rounded-lg border p-3'>
                        <span className='text-sm font-medium text-muted-foreground'>
                          Net P&L
                        </span>
                        <span
                          className={cn(
                            'text-lg font-bold tabular-nums',
                            stats.totalPnl >= 0
                              ? 'text-emerald-600'
                              : 'text-red-500'
                          )}
                        >
                          {stats.totalPnl >= 0 ? '+' : ''}$
                          {stats.totalPnl.toFixed(2)}
                        </span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-center'>
                        <div className='rounded-md bg-muted/50 p-2'>
                          <div className='text-xs text-muted-foreground'>
                            Expectancy / pip
                          </div>
                          <div
                            className={cn(
                              'text-sm font-bold',
                              advanced.expectancyPips >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            )}
                          >
                            {advanced.expectancyPips >= 0 ? '+' : ''}
                            {advanced.expectancyPips.toFixed(1)} pips
                          </div>
                        </div>
                        <div className='rounded-md bg-muted/50 p-2'>
                          <div className='text-xs text-muted-foreground'>
                            Trades / week
                          </div>
                          <div className='text-sm font-bold'>
                            {advanced.avgTradesPerWeek}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Rolling Performance</CardTitle>
                      <CardDescription>
                        Recent form — are you improving?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4 pt-2'>
                      {[
                        { label: 'Last 10 trades', data: rolling10 },
                        { label: 'Last 20 trades', data: rolling20 },
                        {
                          label: 'All time',
                          data: {
                            trades: stats.closed,
                            winRate: stats.winRate,
                            pnl: stats.totalPnl,
                            avgR: stats.avgR,
                          },
                        },
                      ].map(({ label, data }) => (
                        <div key={label} className='rounded-lg border p-3'>
                          <div className='mb-2 flex items-center justify-between'>
                            <span className='text-xs font-medium text-muted-foreground'>
                              {label}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {data.trades} trades
                            </span>
                          </div>
                          <div className='grid grid-cols-3 gap-2 text-center'>
                            <div>
                              <div className='text-xs text-muted-foreground'>
                                Win Rate
                              </div>
                              <div
                                className={cn(
                                  'text-sm font-bold',
                                  data.winRate >= 50
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                )}
                              >
                                {data.winRate.toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className='text-xs text-muted-foreground'>
                                P&L
                              </div>
                              <div
                                className={cn(
                                  'text-sm font-bold',
                                  data.pnl >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                )}
                              >
                                {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(0)}
                              </div>
                            </div>
                            <div>
                              <div className='text-xs text-muted-foreground'>
                                Avg R
                              </div>
                              <div
                                className={cn(
                                  'text-sm font-bold',
                                  data.avgR >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                )}
                              >
                                {data.avgR.toFixed(2)}R
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Equity Curve */}
                <Card>
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                    <CardDescription>
                      Cumulative account growth from the active account starting
                      balance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[320px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart
                        data={eq}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                        {stats.winRate.toFixed(1)}% win rate over {stats.closed}{' '}
                        closed trades
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
                        <AreaChart
                          data={ddChart}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id='ddFill'
                              x1='0'
                              y1='0'
                              x2='0'
                              y2='1'
                            >
                              <stop
                                offset='0%'
                                stopColor='#ef4444'
                                stopOpacity={0.4}
                              />
                              <stop
                                offset='100%'
                                stopColor='#ef4444'
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-muted'
                          />
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
                      Win rate, RR tracking, profit factor, session & pair
                      performance
                    </p>
                  </div>
                </div>

                {/* KPIs */}
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
                  <Stat
                    label='Win Rate'
                    value={`${stats.winRate.toFixed(1)}%`}
                    sub={`${stats.wins}W · ${stats.losses}L`}
                    positive={stats.winRate >= 50}
                  />
                  <Stat
                    label='Profit Factor'
                    value={formatProfitFactor(stats.profitFactor)}
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
                    <CardDescription>
                      Net realised profit and loss by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='ps-2'>
                    <MonthlyPnl />
                  </CardContent>
                </Card>

                {/* R-Multiple Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>R-Multiple Distribution</CardTitle>
                    <CardDescription>
                      Risk-adjusted outcome buckets — your true edge
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[280px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={rDist}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                            const positive =
                              r.bucket.startsWith('+') || r.bucket === '≥ +3R'
                            const neutral = r.bucket === '0R'
                            return (
                              <Cell
                                key={i}
                                fill={
                                  neutral
                                    ? '#94a3b8'
                                    : positive
                                      ? '#10b981'
                                      : '#ef4444'
                                }
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
                      <CardDescription>
                        P&L and win rate by trade direction
                      </CardDescription>
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
                                style={{
                                  width: `${Math.min(100, d.winRate)}%`,
                                }}
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
                      <CardDescription>
                        How active you were each month
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='h-[260px] px-2'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={monthVol}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-muted'
                          />
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
                          <Bar
                            dataKey='trades'
                            fill='#0ea5e9'
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Strategy Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Performance</CardTitle>
                    <CardDescription>
                      Wins, losses and net P&L by playbook setup
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='overflow-x-auto'>
                      <table className='w-full min-w-[640px] text-sm'>
                        <thead className='text-xs text-muted-foreground uppercase'>
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
                            <tr
                              key={s.strategy}
                              className='border-b last:border-0'
                            >
                              <td className='py-2 font-medium'>{s.strategy}</td>
                              <td className='py-2 text-end tabular-nums'>
                                {s.trades}
                              </td>
                              <td className='py-2 text-end text-emerald-600 tabular-nums'>
                                {s.wins}
                              </td>
                              <td className='py-2 text-end text-red-600 tabular-nums'>
                                {s.trades - s.wins}
                              </td>
                              <td className='py-2 text-end tabular-nums'>
                                {s.winRate.toFixed(1)}%
                              </td>
                              <td
                                className={cn(
                                  'py-2 text-end font-semibold tabular-nums',
                                  s.pnl >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
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
                    <CardDescription>
                      Which chart timeframe yields best results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[260px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={byTimeframe}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                            <Cell
                              key={i}
                              fill={t.pnl >= 0 ? '#6366f1' : '#f43f5e'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Best / Worst Periods */}
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {[
                    {
                      label: 'Best Day',
                      value: periods.bestDay.pnl,
                      date: periods.bestDay.date,
                      positive: true,
                    },
                    {
                      label: 'Worst Day',
                      value: periods.worstDay.pnl,
                      date: periods.worstDay.date,
                      positive: false,
                    },
                    {
                      label: 'Best Month',
                      value: periods.bestMonth.pnl,
                      date: periods.bestMonth.month,
                      positive: true,
                    },
                    {
                      label: 'Worst Month',
                      value: periods.worstMonth.pnl,
                      date: periods.worstMonth.month,
                      positive: false,
                    },
                  ].map(({ label, value, date, positive }) => (
                    <Card key={label}>
                      <CardContent className='pt-6'>
                        <p className='text-sm font-medium text-muted-foreground'>
                          {label}
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-2xl font-bold tabular-nums',
                            positive ? 'text-emerald-600' : 'text-red-500'
                          )}
                        >
                          {value >= 0 ? '+' : ''}${value.toFixed(2)}
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {date}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Planned vs Actual RR */}
                {rrData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Planned vs Actual RR</CardTitle>
                      <CardDescription>
                        Did you hit your planned risk-reward? ({rrData.length}{' '}
                        trades with SL/TP set)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='overflow-x-auto'>
                        <table className='w-full min-w-[480px] text-sm'>
                          <thead className='text-xs text-muted-foreground uppercase'>
                            <tr className='border-b'>
                              <th className='py-2 text-start'>Pair</th>
                              <th className='py-2 text-end'>Planned RR</th>
                              <th className='py-2 text-end'>Actual RR</th>
                              <th className='py-2 text-end'>Difference</th>
                              <th className='py-2 text-end'>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rrData.slice(0, 20).map((r, i) => {
                              const diff = r.actual - r.planned
                              return (
                                <tr key={i} className='border-b last:border-0'>
                                  <td className='py-2 font-medium'>{r.pair}</td>
                                  <td className='py-2 text-end tabular-nums'>
                                    {r.planned.toFixed(2)}R
                                  </td>
                                  <td
                                    className={cn(
                                      'py-2 text-end font-semibold tabular-nums',
                                      r.actual >= 0
                                        ? 'text-emerald-600'
                                        : 'text-red-500'
                                    )}
                                  >
                                    {r.actual.toFixed(2)}R
                                  </td>
                                  <td
                                    className={cn(
                                      'py-2 text-end tabular-nums',
                                      diff >= 0
                                        ? 'text-emerald-600'
                                        : 'text-red-500'
                                    )}
                                  >
                                    {diff >= 0 ? '+' : ''}
                                    {diff.toFixed(2)}R
                                  </td>
                                  <td className='py-2 text-end'>
                                    <Badge
                                      variant={
                                        r.status === 'win'
                                          ? 'default'
                                          : r.status === 'loss'
                                            ? 'destructive'
                                            : 'secondary'
                                      }
                                      className='text-xs'
                                    >
                                      {r.status}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ─── PSYCHOLOGY (Psychology & Discipline Model) ─── */}
              <TabsContent value='psychology' className='space-y-6'>
                <div className='flex items-center gap-2'>
                  <Brain className='size-5 text-purple-600' />
                  <div>
                    <h3 className='font-semibold'>
                      Psychology & Discipline Model
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Emotional state tracking, discipline scoring, and revenge
                      trading detection
                    </p>
                  </div>
                </div>

                {/* Discipline Summary Cards */}
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardContent className='pt-6'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Discipline Score
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-3xl font-black tabular-nums',
                          (() => {
                            const totalEm = emotionData.reduce(
                              (s, e) => s + e.trades,
                              0
                            )
                            const discTrades = emotionData
                              .filter((e) => goodEmotions.includes(e.emotion))
                              .reduce((s, e) => s + e.trades, 0)
                            const pct =
                              totalEm > 0 ? (discTrades / totalEm) * 100 : 0
                            return pct >= 70
                              ? 'text-emerald-600'
                              : pct >= 40
                                ? 'text-amber-500'
                                : 'text-red-500'
                          })()
                        )}
                      >
                        {(() => {
                          const totalEm = emotionData.reduce(
                            (s, e) => s + e.trades,
                            0
                          )
                          const discTrades = emotionData
                            .filter((e) => goodEmotions.includes(e.emotion))
                            .reduce((s, e) => s + e.trades, 0)
                          return totalEm > 0
                            ? `${((discTrades / totalEm) * 100).toFixed(0)}%`
                            : 'N/A'
                        })()}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Disciplined trade ratio
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='pt-6'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Revenge Trades
                      </p>
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
                      <p className='text-sm font-medium text-muted-foreground'>
                        A-Game Trades
                      </p>
                      <p className='mt-1 text-3xl font-black text-emerald-600 tabular-nums'>
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
                      <p className='text-sm font-medium text-muted-foreground'>
                        B-Game Trades
                      </p>
                      <p className='mt-1 text-3xl font-black text-red-500 tabular-nums'>
                        {emotionData
                          .filter((e) => badEmotions.includes(e.emotion))
                          .reduce((s, e) => s + e.trades, 0)}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        FOMO / revenge / tilted
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Process Review</CardTitle>
                    <CardDescription>
                      Execution quality, plan discipline, and trade management
                      from your reviewed trades
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
                      <Stat
                        label='Reviewed'
                        value={`${processReview.reviewedPct.toFixed(0)}%`}
                        sub={`${processReview.reviewed.length}/${stats.closed} closed trades`}
                        icon={BookOpen}
                        positive={processReview.reviewedPct >= 70}
                      />
                      <Stat
                        label='Followed Plan'
                        value={`${processReview.followedPlanPct.toFixed(0)}%`}
                        icon={Shield}
                        positive={processReview.followedPlanPct >= 70}
                      />
                      <Stat
                        label='Broken Plan'
                        value={`${processReview.brokenPlan}`}
                        icon={AlertTriangle}
                        positive={processReview.brokenPlan === 0}
                      />
                      <Stat
                        label='A-Grade Entry'
                        value={`${processReview.aGradePct.toFixed(0)}%`}
                        icon={Trophy}
                        positive={processReview.aGradePct >= 50}
                      />
                    </div>

                    {processReview.managementRows.length > 0 && (
                      <div className='overflow-x-auto rounded-md border'>
                        <table className='w-full min-w-[520px] text-sm'>
                          <thead className='bg-muted/50 text-xs text-muted-foreground uppercase'>
                            <tr>
                              <th className='px-3 py-2 text-start'>
                                Management
                              </th>
                              <th className='px-3 py-2 text-end'>Trades</th>
                              <th className='px-3 py-2 text-end'>Avg P&L</th>
                              <th className='px-3 py-2 text-end'>Net P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processReview.managementRows.map((row) => (
                              <tr key={row.label} className='border-t'>
                                <td className='px-3 py-2 font-medium'>
                                  {row.label}
                                </td>
                                <td className='px-3 py-2 text-end tabular-nums'>
                                  {row.trades}
                                </td>
                                <td
                                  className={cn(
                                    'px-3 py-2 text-end tabular-nums',
                                    row.avg >= 0
                                      ? 'text-emerald-600'
                                      : 'text-red-500'
                                  )}
                                >
                                  ${row.avg.toFixed(2)}
                                </td>
                                <td
                                  className={cn(
                                    'px-3 py-2 text-end font-semibold tabular-nums',
                                    row.pnl >= 0
                                      ? 'text-emerald-600'
                                      : 'text-red-500'
                                  )}
                                >
                                  {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      <BarChart
                        data={emotionData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                      <BarChart
                        data={emotionData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                    <CardDescription>
                      Full stats by emotional state at entry
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='overflow-x-auto'>
                      <table className='w-full min-w-[560px] text-sm'>
                        <thead className='text-xs text-muted-foreground uppercase'>
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
                              <tr
                                key={e.emotion}
                                className='border-b last:border-0'
                              >
                                <td className='py-2 font-medium capitalize'>
                                  {e.emotion}
                                </td>
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
                                <td className='py-2 text-end tabular-nums'>
                                  {e.trades}
                                </td>
                                <td className='py-2 text-end tabular-nums'>
                                  {e.winRate}%
                                </td>
                                <td
                                  className={cn(
                                    'py-2 text-end font-semibold tabular-nums',
                                    e.pnl >= 0
                                      ? 'text-emerald-600'
                                      : 'text-red-500'
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
                            revenge.count === 0
                              ? 'text-emerald-600'
                              : 'text-red-500'
                          )}
                        >
                          {revenge.count}
                        </div>
                        <div className='mt-1 text-xs text-muted-foreground'>
                          Revenge Trades
                        </div>
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
                        <div className='mt-1 text-xs text-muted-foreground'>
                          of all trades
                        </div>
                      </div>
                      <div className='rounded-lg border p-4 text-center'>
                        <div className='text-3xl font-black text-muted-foreground'>
                          {revenge.count === 0
                            ? '✓'
                            : revenge.pct > 20
                              ? '✗'
                              : '!'}
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
                      Position sizing, drawdown, exposure limits, and
                      consecutive loss protection
                    </p>
                  </div>
                </div>

                {/* Risk KPIs */}
                <div className='grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4'>
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
                      <AreaChart
                        data={ddChart}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id='ddFill2'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                          >
                            <stop
                              offset='0%'
                              stopColor='#ef4444'
                              stopOpacity={0.4}
                            />
                            <stop
                              offset='100%'
                              stopColor='#ef4444'
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                      <CardDescription>
                        Position sizing consistency — stay in your lane
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='h-[280px] px-2'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={lotDist}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-muted'
                          />
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
                          <Bar
                            dataKey='count'
                            fill='#6366f1'
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Risk Snapshot */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Snapshot</CardTitle>
                      <CardDescription>
                        Key risk metrics at a glance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4 pt-4'>
                      <RiskRow
                        label='Average Win'
                        value={`${stats.avgWinPips >= 0 ? '+' : ''}${stats.avgWinPips.toFixed(1)} pips / +$${stats.avgWin.toFixed(2)}`}
                        icon={TrendingUp}
                        positive
                      />
                      <RiskRow
                        label='Average Loss'
                        value={`${stats.avgLossPips >= 0 ? '+' : ''}${stats.avgLossPips.toFixed(1)} pips / -$${stats.avgLoss.toFixed(2)}`}
                        icon={TrendingDown}
                        positive={false}
                      />
                      <RiskRow
                        label='Expectancy / Trade'
                        value={`${advanced.expectancyPips >= 0 ? '+' : ''}${advanced.expectancyPips.toFixed(1)} pips / $${stats.expectancy.toFixed(2)}`}
                        icon={Target}
                        positive={stats.expectancy >= 0}
                      />
                      <RiskRow
                        label='Pips Won'
                        value={`+${stats.totalPipsWon.toFixed(1)}`}
                        icon={TrendingUp}
                        positive
                      />
                      <RiskRow
                        label='Pips Lost'
                        value={`-${stats.totalPipsLost.toFixed(1)}`}
                        icon={TrendingDown}
                        positive={false}
                      />
                      <RiskRow
                        label='Net Pips'
                        value={`${stats.totalPips.toFixed(1)}`}
                        icon={ArrowDownRight}
                        positive={stats.totalPips >= 0}
                      />
                      <RiskRow
                        label='Best Trade (Pips)'
                        value={`${stats.bestTradePips >= 0 ? '+' : ''}${stats.bestTradePips.toFixed(1)}`}
                        icon={Trophy}
                        positive={stats.bestTradePips >= 0}
                      />
                      <RiskRow
                        label='Worst Trade (Pips)'
                        value={`${stats.worstTradePips >= 0 ? '+' : ''}${stats.worstTradePips.toFixed(1)}`}
                        icon={AlertTriangle}
                        positive={false}
                      />
                      <RiskRow
                        label='Longs Won'
                        value={formatWinShare(stats.longsWon, stats.longs)}
                        icon={ArrowUpRight}
                        positive={
                          stats.longs > 0
                            ? stats.longsWon / stats.longs >= 0.5
                            : undefined
                        }
                      />
                      <RiskRow
                        label='Shorts Won'
                        value={formatWinShare(stats.shortsWon, stats.shorts)}
                        icon={ArrowDownRight}
                        positive={
                          stats.shorts > 0
                            ? stats.shortsWon / stats.shorts >= 0.5
                            : undefined
                        }
                      />
                      <RiskRow
                        label='Lots'
                        value={stats.totalLots.toFixed(2)}
                        icon={CandlestickChart}
                      />
                      <RiskRow
                        label='Open Positions'
                        value={`${stats.open}`}
                        icon={ArrowUpRight}
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
                      <BarChart
                        data={pipDist}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                                p.bucket.startsWith('+') ||
                                p.bucket.startsWith('0 to')
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

                {/* Prop Firm Tracker */}
                {tradingSettings.ftmoMode && (
                  <Card className='border-amber-500/30 bg-amber-500/5'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Target className='size-4 text-amber-500' />
                        Prop Firm Compliance Tracker
                      </CardTitle>
                      <CardDescription>
                        Account: ${ftmoSize.toLocaleString()} — tracking against
                        your funded account rules
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {[
                        {
                          label: 'Profit Target',
                          current: Math.max(0, ftmoProfit),
                          target: ftmoProfitTarget,
                          good: true,
                          format: (v: number) => `$${v.toFixed(0)}`,
                          desc: `${tradingSettings.ftmoProfitTargetPct}% target = $${ftmoProfitTarget.toFixed(0)}`,
                        },
                        {
                          label: 'Max Drawdown Used',
                          current: ftmoCurrentDD,
                          target: ftmoMaxDD,
                          good: false,
                          format: (v: number) => `$${v.toFixed(0)}`,
                          desc: `${tradingSettings.ftmoMaxDrawdownPct}% limit = $${ftmoMaxDD.toFixed(0)}`,
                        },
                        {
                          label: 'Daily Loss Limit',
                          current: 0,
                          target: ftmoDailyLimit,
                          good: false,
                          format: (v: number) => `$${v.toFixed(0)}`,
                          desc: `${tradingSettings.ftmoDailyLossLimitPct}% limit = $${ftmoDailyLimit.toFixed(0)} per day`,
                        },
                      ].map(
                        ({ label, current, target, good, format, desc }) => {
                          const pct =
                            target > 0
                              ? Math.min(100, (current / target) * 100)
                              : 0
                          const isBreached = !good && pct >= 100
                          const isAchieved = good && pct >= 100
                          return (
                            <div key={label}>
                              <div className='mb-1 flex items-center justify-between text-sm'>
                                <span className='font-medium'>{label}</span>
                                <span
                                  className={cn(
                                    'font-mono text-xs',
                                    isBreached
                                      ? 'text-red-500'
                                      : isAchieved
                                        ? 'text-emerald-600'
                                        : 'text-muted-foreground'
                                  )}
                                >
                                  {format(current)} / {format(target)}
                                </span>
                              </div>
                              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    isBreached
                                      ? 'bg-red-500'
                                      : isAchieved
                                        ? 'bg-emerald-500'
                                        : good
                                          ? 'bg-emerald-500/60'
                                          : 'bg-amber-500/60'
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className='mt-1 text-[11px] text-muted-foreground'>
                                {desc}
                              </p>
                            </div>
                          )
                        }
                      )}
                      <div
                        className={cn(
                          'rounded-lg border p-3 text-center text-sm font-semibold',
                          ftmoCurrentDD >= ftmoMaxDD
                            ? 'border-red-500/30 bg-red-500/10 text-red-500'
                            : ftmoProfit >= ftmoProfitTarget
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                              : 'border-amber-500/30 text-amber-600'
                        )}
                      >
                        {ftmoCurrentDD >= ftmoMaxDD
                          ? '❌ Challenge Failed — Max drawdown exceeded'
                          : ftmoProfit >= ftmoProfitTarget
                            ? '✅ Profit Target Hit — Challenge Passed!'
                            : '⏳ In Progress — Keep following the rules'}
                      </div>
                    </CardContent>
                  </Card>
                )}
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

                {/* Calendar Heatmap */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily P&L Calendar</CardTitle>
                    <CardDescription>
                      Last 3 months — green = profitable day, red = losing day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {heatmapData.length === 0 ? (
                      <p className='py-8 text-center text-sm text-muted-foreground'>
                        No trade data for the last 3 months.
                      </p>
                    ) : (
                      <div className='space-y-3'>
                        {(() => {
                          const maxAbs = Math.max(
                            ...heatmapData.map((d) => Math.abs(d.pnl)),
                            1
                          )
                          const byMonth = new Map<string, typeof heatmapData>()
                          for (const d of heatmapData) {
                            const m = d.date.slice(0, 7)
                            if (!byMonth.has(m)) byMonth.set(m, [])
                            byMonth.get(m)!.push(d)
                          }
                          return Array.from(byMonth.entries()).map(
                            ([month, days]) => {
                              const [yr, mo] = month.split('-').map(Number)
                              const firstDay = new Date(yr, mo - 1, 1).getDay()
                              const daysInMonth = new Date(yr, mo, 0).getDate()
                              const dayMap = new Map(
                                days.map((d) => [
                                  parseInt(d.date.slice(8, 10)),
                                  d.pnl,
                                ])
                              )
                              const label = new Date(
                                yr,
                                mo - 1,
                                1
                              ).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })
                              return (
                                <div key={month}>
                                  <p className='mb-2 text-xs font-semibold text-muted-foreground'>
                                    {label}
                                  </p>
                                  <div className='grid grid-cols-7 gap-1'>
                                    {[
                                      'Su',
                                      'Mo',
                                      'Tu',
                                      'We',
                                      'Th',
                                      'Fr',
                                      'Sa',
                                    ].map((d) => (
                                      <div
                                        key={d}
                                        className='text-center text-[10px] text-muted-foreground/50'
                                      >
                                        {d}
                                      </div>
                                    ))}
                                    {Array.from({ length: firstDay }).map(
                                      (_, i) => (
                                        <div key={`empty-${i}`} />
                                      )
                                    )}
                                    {Array.from({ length: daysInMonth }).map(
                                      (_, i) => {
                                        const day = i + 1
                                        const pnl = dayMap.get(day)
                                        const intensity =
                                          pnl !== undefined
                                            ? Math.min(
                                                0.9,
                                                Math.max(
                                                  0.15,
                                                  Math.abs(pnl) / maxAbs
                                                )
                                              )
                                            : 0
                                        return (
                                          <UITooltip key={day}>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={cn(
                                                  'flex aspect-square cursor-default items-center justify-center rounded text-[10px] font-medium',
                                                  pnl === undefined
                                                    ? 'bg-muted/30 text-muted-foreground/30'
                                                    : pnl > 0
                                                      ? 'text-emerald-100'
                                                      : 'text-red-100'
                                                )}
                                                style={
                                                  pnl !== undefined
                                                    ? {
                                                        backgroundColor:
                                                          pnl > 0
                                                            ? `rgba(16,185,129,${intensity})`
                                                            : `rgba(239,68,68,${intensity})`,
                                                      }
                                                    : undefined
                                                }
                                              >
                                                {day}
                                              </div>
                                            </TooltipTrigger>
                                            {pnl !== undefined && (
                                              <TooltipContent className='text-xs'>
                                                {`${month}-${String(day).padStart(2, '0')}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                                              </TooltipContent>
                                            )}
                                          </UITooltip>
                                        )
                                      }
                                    )}
                                  </div>
                                </div>
                              )
                            }
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className='grid gap-4 lg:grid-cols-2'>
                  {/* By Session */}
                  <Card>
                    <CardHeader>
                      <CardTitle>By Trading Session</CardTitle>
                      <CardDescription>
                        When are you most profitable?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='h-[280px] px-2'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={bySession}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-muted'
                          />
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
                              <Cell
                                key={i}
                                fill={s.pnl >= 0 ? '#0ea5e9' : '#f43f5e'}
                              />
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
                      <CardDescription>
                        Profitability across weekdays
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='h-[280px] px-2'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={byDow}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-muted'
                          />
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
                              <Cell
                                key={i}
                                fill={d.pnl >= 0 ? '#8b5cf6' : '#fb7185'}
                              />
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
                    <CardDescription>
                      P&L by trade open hour (local time)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[280px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={byHour}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                            <Cell
                              key={i}
                              fill={h.pnl >= 0 ? '#22c55e' : '#f97316'}
                            />
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
                      How long you hold trades — avg wins{' '}
                      {formatHoldTime(hold.avgWinMin)} vs losses{' '}
                      {formatHoldTime(hold.avgLossMin)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[260px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={holdDist}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                        <Bar
                          dataKey='count'
                          fill='#f59e0b'
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Session Win Rate Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Breakdown</CardTitle>
                    <CardDescription>
                      Detailed stats per session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='overflow-x-auto'>
                      <table className='w-full min-w-[500px] text-sm'>
                        <thead className='text-xs text-muted-foreground uppercase'>
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
                            <tr
                              key={s.session}
                              className='border-b last:border-0'
                            >
                              <td className='py-2 font-medium'>{s.session}</td>
                              <td className='py-2 text-end tabular-nums'>
                                {s.trades}
                              </td>
                              <td className='py-2 text-end tabular-nums'>
                                {s.winRate}%
                              </td>
                              <td
                                className={cn(
                                  'py-2 text-end tabular-nums',
                                  s.pips >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                )}
                              >
                                {s.pips >= 0 ? '+' : ''}
                                {s.pips}
                              </td>
                              <td
                                className={cn(
                                  'py-2 text-end font-semibold tabular-nums',
                                  s.pnl >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
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
                    <h3 className='font-semibold'>
                      Market Pattern & Symbol Model
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Which pairs and setups perform best — session-based pair
                      behavior
                    </p>
                  </div>
                </div>

                {/* P&L by Pair */}
                <Card>
                  <CardHeader>
                    <CardTitle>P&L by Pair</CardTitle>
                    <CardDescription>
                      Net profit and loss per symbol
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[300px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={byPair}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                            <Cell
                              key={i}
                              fill={p.pnl >= 0 ? '#10b981' : '#ef4444'}
                            />
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
                    <CardDescription>
                      Total pip gain/loss per symbol
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='h-[280px] px-2'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={byPair}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-muted'
                        />
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
                            <Cell
                              key={i}
                              fill={p.pips >= 0 ? '#0ea5e9' : '#f97316'}
                            />
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
                    <CardDescription>
                      Full breakdown per currency pair
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='overflow-x-auto'>
                      <table className='w-full min-w-[720px] text-sm'>
                        <thead className='text-xs text-muted-foreground uppercase'>
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
                              <td className='py-2 text-end tabular-nums'>
                                {p.trades}
                              </td>
                              <td className='py-2 text-end text-emerald-600 tabular-nums'>
                                {p.wins}
                              </td>
                              <td className='py-2 text-end text-red-500 tabular-nums'>
                                {p.losses}
                              </td>
                              <td className='py-2 text-end tabular-nums'>
                                {p.winRate}%
                              </td>
                              <td
                                className={cn(
                                  'py-2 text-end tabular-nums',
                                  p.avgPips >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                )}
                              >
                                {p.avgPips >= 0 ? '+' : ''}
                                {p.avgPips}
                              </td>
                              <td className='py-2 text-end tabular-nums'>
                                {p.avgLotSize}
                              </td>
                              <td className='py-2 text-end tabular-nums'>
                                {formatHoldTime(p.avgHoldMin)}
                              </td>
                              <td
                                className={cn(
                                  'py-2 text-end font-semibold tabular-nums',
                                  p.pnl >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
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
          </>
        )}
      </Main>
    </>
  )
}
