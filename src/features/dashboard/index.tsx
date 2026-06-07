import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  Percent,
  Wallet,
  Trophy,
  CandlestickChart,
  Download,
} from 'lucide-react'
import { useTrades } from '@/stores/trades-store'
import { cn } from '@/lib/utils'
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
import { computeStats, formatProfitFactor } from '@/features/trades/data/stats'
import { Analytics } from './components/analytics'
import { DashboardTrades } from './components/dashboard-trades'
import { EquityCurve } from './components/equity-curve'
import { RecentTrades } from './components/recent-trades'

export function Dashboard() {
  const trades = useTrades()
  const stats = useMemo(() => computeStats(trades), [trades])
  const hasTrades = trades.length > 0
  const { state: sidebarState, isMobile, openMobile } = useSidebar()
  const showTopNav = isMobile ? !openMobile : sidebarState === 'collapsed'

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
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Trading Dashboard
            </h1>
            <p className='text-sm text-muted-foreground'>
              Track your performance, review trades, and grow your edge.
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' disabled={!hasTrades}>
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
            {!hasTrades && <EmptyTradingState />}

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
                    Cumulative balance from the active account starting balance.
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
                  Filter, review and edit your recorded trades. Click a row's
                  menu to open the full editor with screenshot, mistakes and
                  lessons learned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardTrades />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function EmptyTradingState() {
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
          Import an MT5 detailed report to fill your dashboard instantly, or log
          a single trade if you want to test the workflow first.
        </CardDescription>
      </CardHeader>
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
    </Card>
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
