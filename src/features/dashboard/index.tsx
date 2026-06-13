import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  Percent,
  Wallet,
  Trophy,
  CandlestickChart,
  Download,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTrades } from '@/stores/trades-store'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAccountsQuery, useActiveAccount } from '@/hooks/use-accounts-query'
import { useAllTradesQuery } from '@/hooks/use-trades-query'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSidebar } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import type { Trade } from '@/features/trades/data/schema'
import { computeStats, formatProfitFactor } from '@/features/trades/data/stats'
import { Analytics } from './components/analytics'
import { DashboardTrades } from './components/dashboard-trades'
import { EquityCurve } from './components/equity-curve'
import { RecentTrades } from './components/recent-trades'

export function Dashboard() {
  const trades = useTrades()
  const activeAccount = useActiveAccount()
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
    error: accountsQueryError,
  } = useAccountsQuery()
  const {
    isLoading: tradesLoading,
    isError: tradesError,
    error: tradesQueryError,
  } = useAllTradesQuery()
  const tradingSettings = useTradingSettings()
  const stats = useMemo(() => computeStats(trades), [trades])
  const hasTrades = trades.length > 0
  const hasAccounts = accounts.some((account) => !account.isArchived)
  const isLoading = accountsLoading || tradesLoading
  const queryError = accountsError
    ? getApiErrorMessage(accountsQueryError, 'Could not load accounts.')
    : tradesError
      ? getApiErrorMessage(tradesQueryError, 'Could not load trades.')
      : null
  const { state: sidebarState, isMobile, openMobile } = useSidebar()
  const showTopNav = isMobile ? !openMobile : sidebarState === 'collapsed'

  const handleExport = () => {
    if (!hasTrades) return
    exportTradesCsv(trades, activeAccount?.name ?? 'fuadfx-account')
    toast.success(
      `Exported ${trades.length} trade${trades.length === 1 ? '' : 's'} to CSV.`
    )
  }

  return (
    <>
      <Header>
        {showTopNav && <TopNav links={topNav} className='me-auto' />}
        <Search className={showTopNav ? '' : 'me-auto'} />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Trading Dashboard
              </h1>
              <p className='text-sm text-muted-foreground'>
                Track your performance, review trades, and grow your edge.
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              disabled={!hasTrades}
              onClick={handleExport}
            >
              <Download className='size-4' />
              Export
            </Button>
            <Button asChild>
              <Link to='/tasks' search={{ new: true }}>
                <CandlestickChart className='size-4' />
                <span>New Trade</span>
              </Link>
            </Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='overview' className='space-y-4'>
            {queryError && <DashboardNotice message={queryError} />}
            {isLoading && <DashboardLoading />}
            {!isLoading && !queryError && (
              <AccountOverviewStrip
                account={activeAccount}
                hasAccounts={hasAccounts}
                tradeCount={trades.length}
                netPnl={stats.totalPnl}
              />
            )}
            {tradingSettings.ftmoMode && (
              <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm'>
                <div className='flex items-center gap-2'>
                  <ShieldCheck className='size-4 text-amber-500' />
                  <span className='font-medium'>Prop firm mode active</span>
                  <span className='text-muted-foreground'>
                    Dashboard is tracking profit target, daily loss and max
                    drawdown rules.
                  </span>
                </div>
                <Link
                  to='/settings/trading'
                  className='font-medium text-amber-600 hover:underline'
                >
                  Edit rules
                </Link>
              </div>
            )}
            {!isLoading && !queryError && !hasTrades && (
              <EmptyTradingState hasAccounts={hasAccounts} />
            )}

            {!isLoading && !queryError && hasAccounts && (
              <>
                <div
                  className={cn(
                    'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
                    isLoading && 'opacity-60'
                  )}
                >
                  <KpiCard
                    title='Net P&L'
                    value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    hint={`${stats.closed} trades closed`}
                    icon={Wallet}
                    tone={stats.totalPnl >= 0 ? 'positive' : 'negative'}
                  />
                  <KpiCard
                    title='Win Rate'
                    value={`${stats.winRate.toFixed(1)}%`}
                    hint={`${stats.wins}W / ${stats.losses}L`}
                    icon={Percent}
                    tone='neutral'
                  />
                  <KpiCard
                    title='Profit Factor'
                    value={formatProfitFactor(stats.profitFactor)}
                    hint={`Avg R: ${stats.avgR.toFixed(2)}`}
                    icon={Activity}
                    tone={stats.profitFactor >= 1 ? 'positive' : 'negative'}
                  />
                  <KpiCard
                    title='Best / Worst'
                    value={
                      hasTrades
                        ? `${stats.bestTrade >= 0 ? '+' : ''}$${stats.bestTrade.toFixed(0)} / ${stats.worstTrade >= 0 ? '+' : ''}$${stats.worstTrade.toFixed(0)}`
                        : '$0 / $0'
                    }
                    hint={`Streak ${stats.largestWinStreak}W · ${stats.largestLossStreak}L`}
                    icon={Trophy}
                    tone='neutral'
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                  <Card className='col-span-1 lg:col-span-4'>
                    <CardHeader>
                      <CardTitle>Equity Curve</CardTitle>
                      <CardDescription>
                        Cumulative balance from the active account starting
                        balance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='ps-2'>
                      <EquityCurve />
                    </CardContent>
                  </Card>
                  <Card className='col-span-1 lg:col-span-3'>
                    <CardHeader>
                      <CardTitle>Recent Trades</CardTitle>
                      <CardDescription>
                        Your latest closed positions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentTrades />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Trade Journal</CardTitle>
                    <CardDescription>
                      Filter, review and edit your recorded trades. Click a
                      row's menu to open the full editor with screenshot,
                      mistakes and lessons learned.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DashboardTrades />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function EmptyTradingState({ hasAccounts }: { hasAccounts: boolean }) {
  return (
    <Card className='border-dashed'>
      <CardHeader className='items-center text-center'>
        <div className='mb-2 flex size-12 items-center justify-center rounded-full bg-muted'>
          <CandlestickChart className='size-5' />
        </div>
        <CardTitle className='text-base'>
          Start with your trade history
        </CardTitle>
        <CardDescription className='max-w-xl'>
          {hasAccounts
            ? 'Import an MT5 detailed report to fill your dashboard instantly, or log a single trade if you want to test the workflow first.'
            : 'Create or connect your first trading account so FUADFX knows where to place your journal data.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap justify-center gap-2'>
        {hasAccounts ? (
          <Button asChild>
            <Link to='/tasks' search={{ import: true }}>
              <Download className='size-4' />
              Import MT5 report
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to='/users'>
              <Wallet className='size-4' />
              Create account
            </Link>
          </Button>
        )}
        <Button variant='outline' asChild>
          <Link
            to={hasAccounts ? '/tasks' : '/onboarding'}
            search={hasAccounts ? { new: true } : undefined}
          >
            <CandlestickChart className='size-4' />
            {hasAccounts ? 'Log one trade' : 'Open onboarding'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AccountOverviewStrip({
  account,
  hasAccounts,
  tradeCount,
  netPnl,
}: {
  account: ReturnType<typeof useActiveAccount>
  hasAccounts: boolean
  tradeCount: number
  netPnl: number
}) {
  if (!hasAccounts) return null

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-xs'>
      <div className='min-w-0'>
        <p className='font-medium'>
          {account?.name ?? 'No active account selected'}
        </p>
        <p className='truncate text-xs text-muted-foreground'>
          {account
            ? `${account.broker} / ${account.number} / ${account.type.toUpperCase()}`
            : 'Choose an account from the sidebar selector.'}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-4 text-xs'>
        <span className='text-muted-foreground'>
          Trades <strong className='text-foreground'>{tradeCount}</strong>
        </span>
        <span className='text-muted-foreground'>
          Net{' '}
          <strong
            className={cn(
              'tabular-nums',
              netPnl >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
          </strong>
        </span>
        <Button variant='outline' size='sm' asChild>
          <Link to='/users'>Manage accounts</Link>
        </Button>
      </div>
    </div>
  )
}

function DashboardNotice({ message }: { message: string }) {
  return (
    <div className='rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600'>
      {message}
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className='space-y-2 pb-2'>
            <div className='h-4 w-24 animate-pulse rounded bg-muted' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <div className='h-8 w-28 animate-pulse rounded bg-muted' />
            <div className='h-3 w-20 animate-pulse rounded bg-muted' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  title: string
  value: string
  hint: string
  icon: React.ElementType
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold tabular-nums',
            tone === 'positive' && 'text-emerald-600',
            tone === 'negative' && 'text-red-600'
          )}
        >
          {value}
        </div>
        <p className='text-xs text-muted-foreground'>{hint}</p>
      </CardContent>
    </Card>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: '/',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Trades',
    href: '/tasks',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    isActive: false,
    disabled: false,
  },
]

function exportTradesCsv(trades: Trade[], accountName: string) {
  const headers = [
    'pair',
    'direction',
    'status',
    'lots',
    'entry',
    'exit',
    'pips',
    'pnl',
    'rMultiple',
    'strategy',
    'session',
    'openedAt',
    'closedAt',
  ]
  const rows = trades.map((trade) =>
    headers.map((key) => csvCell(formatTradeCsvValue(trade, key)))
  )
  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  )
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  link.href = url
  link.download = `${safeName || 'fuadfx'}-trades.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function formatTradeCsvValue(trade: Trade, key: string) {
  const value = trade[key as keyof Trade]
  if (value instanceof Date) return value.toISOString()
  return value ?? ''
}

function csvCell(value: unknown) {
  const text = String(value).replace(/"/g, '""')
  return `"${text}"`
}
