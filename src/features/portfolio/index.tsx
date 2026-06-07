import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import {
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
import { cn } from '@/lib/utils'
import { useAccountsQuery } from '@/hooks/use-accounts-query'
import { useAllTradesQuery } from '@/hooks/use-trades-query'
import { Badge } from '@/components/ui/badge'
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
import type { Trade } from '@/features/trades/data/schema'
import { computeStats, equityCurve } from '@/features/trades/data/stats'

const ACCOUNT_COLORS = [
  '#10b981',
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
]

function groupByAccount(trades: Trade[]) {
  const map = new Map<
    string,
    { account: string; pnl: number; trades: number; wins: number; pips: number }
  >()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.account || 'Default'
    const cur = map.get(key) ?? {
      account: key,
      pnl: 0,
      trades: 0,
      wins: 0,
      pips: 0,
    }
    cur.pnl += t.pnl
    cur.trades += 1
    cur.pips += t.pips
    if (t.status === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.values())
    .map((g) => ({
      ...g,
      pnl: parseFloat(g.pnl.toFixed(2)),
      pips: parseFloat(g.pips.toFixed(1)),
      winRate:
        g.trades > 0 ? parseFloat(((g.wins / g.trades) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

export function Portfolio() {
  const { data: trades = [] } = useAllTradesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const activeAccounts = accounts.filter((account) => !account.isArchived)
  const activeAccountIds = new Set(activeAccounts.map((account) => account.id))
  const portfolioTrades = trades.filter(
    (trade) => !trade.accountId || activeAccountIds.has(trade.accountId)
  )
  const stats = computeStats(portfolioTrades)
  const byAccount = groupByAccount(portfolioTrades)
  const totalTrades = byAccount.reduce((s, a) => s + a.trades, 0)

  const startingBalance = activeAccounts.reduce(
    (sum, account) => sum + account.startingBalance,
    0
  )
  const baseline = startingBalance || 10000
  const eq = equityCurve(portfolioTrades, baseline).map((d) => ({
    date: d.date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    equity: Math.round(d.balance),
  }))
  const currentEquity = eq.length > 0 ? eq[eq.length - 1].equity : baseline
  const growthPct =
    baseline > 0 ? ((currentEquity - baseline) / baseline) * 100 : 0

  const allocationData = byAccount.map((a) => ({
    name: a.account,
    value: a.trades,
  }))

  const pnlByAccount = byAccount.map((a) => ({
    account: a.account.length > 12 ? a.account.slice(0, 12) + '…' : a.account,
    fullName: a.account,
    pnl: a.pnl,
  }))

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
          <h2 className='text-2xl font-bold tracking-tight'>Portfolio</h2>
          <p className='text-muted-foreground'>
            Overall portfolio health across all your trading accounts.
          </p>
        </div>

        {/* Top KPIs */}
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Portfolio Value
                </p>
                <Wallet className='size-4 text-muted-foreground' />
              </div>
              <p className='mt-1 text-2xl font-bold tabular-nums'>
                ${currentEquity.toLocaleString()}
              </p>
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {growthPct >= 0 ? '+' : ''}
                {growthPct.toFixed(2)}% from $
                {baseline.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Net P&L
                </p>
                {stats.totalPnl >= 0 ? (
                  <TrendingUp className='size-4 text-emerald-600' />
                ) : (
                  <TrendingDown className='size-4 text-red-500' />
                )}
              </div>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold tabular-nums',
                  stats.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {stats.total} total trades
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-6'>
              <p className='text-sm font-medium text-muted-foreground'>
                Win Rate
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold tabular-nums',
                  stats.winRate >= 50 ? 'text-emerald-600' : 'text-amber-500'
                )}
              >
                {stats.winRate.toFixed(1)}%
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {stats.wins}W · {stats.losses}L · {stats.breakeven}BE
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-6'>
              <p className='text-sm font-medium text-muted-foreground'>
                Accounts
              </p>
              <p className='mt-1 text-2xl font-bold tabular-nums'>
                {byAccount.length}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                Active trading accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Equity Curve</CardTitle>
            <CardDescription>
              Combined account growth from your active account starting balances
            </CardDescription>
          </CardHeader>
          <CardContent className='h-[320px] px-2'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={eq}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
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
          {/* P&L by Account */}
          <Card>
            <CardHeader>
              <CardTitle>P&L by Account</CardTitle>
              <CardDescription>Net profit per trading account</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px] px-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={pnlByAccount}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    className='stroke-muted'
                  />
                  <XAxis
                    dataKey='account'
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
                    {pnlByAccount.map((a, i) => (
                      <Cell
                        key={i}
                        fill={
                          a.pnl >= 0
                            ? ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade Allocation Donut */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Allocation</CardTitle>
              <CardDescription>Share of trades across accounts</CardDescription>
            </CardHeader>
            <CardContent className='h-[280px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {allocationData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      typeof value === 'number'
                        ? `${value} trades`
                        : '0 trades',
                      String(name ?? ''),
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Account Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Account Breakdown</CardTitle>
            <CardDescription>Detailed performance per account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[600px] text-sm'>
                <thead className='text-xs text-muted-foreground uppercase'>
                  <tr className='border-b'>
                    <th className='py-2 text-start'>Account</th>
                    <th className='py-2 text-end'>Trades</th>
                    <th className='py-2 text-end'>Allocation</th>
                    <th className='py-2 text-end'>Win %</th>
                    <th className='py-2 text-end'>Total Pips</th>
                    <th className='py-2 text-end'>Net P&L</th>
                    <th className='py-2 text-end'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {byAccount.map((a, i) => (
                    <tr key={a.account} className='border-b last:border-0'>
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{
                              backgroundColor:
                                ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
                            }}
                          />
                          <span className='font-medium'>{a.account}</span>
                        </div>
                      </td>
                      <td className='py-3 text-end tabular-nums'>{a.trades}</td>
                      <td className='py-3 text-end text-muted-foreground tabular-nums'>
                        {totalTrades > 0
                          ? ((a.trades / totalTrades) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                      <td className='py-3 text-end tabular-nums'>
                        {a.winRate}%
                      </td>
                      <td
                        className={cn(
                          'py-3 text-end tabular-nums',
                          a.pips >= 0 ? 'text-emerald-600' : 'text-red-500'
                        )}
                      >
                        {a.pips >= 0 ? '+' : ''}
                        {a.pips}
                      </td>
                      <td
                        className={cn(
                          'py-3 text-end font-semibold tabular-nums',
                          a.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                        )}
                      >
                        {a.pnl >= 0 ? '+' : ''}${a.pnl.toFixed(2)}
                      </td>
                      <td className='py-3 text-end'>
                        <Badge
                          variant={a.pnl >= 0 ? 'default' : 'destructive'}
                          className='text-xs'
                        >
                          {a.pnl >= 0 ? 'Profitable' : 'Negative'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {byAccount.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className='py-8 text-center text-sm text-muted-foreground'
                      >
                        No closed trades yet. Add trades with account names to
                        see your portfolio breakdown.
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
