import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as TasksRoute } from '@/routes/_authenticated/tasks/index'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { computeStats } from '@/features/trades/data/stats'
import { useTrades } from '@/stores/trades-store'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider, useTasks } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'

function NewTradeIntent() {
  const search = TasksRoute.useSearch()
  const navigate = useNavigate()
  const { setOpen } = useTasks()
  useEffect(() => {
    if (search.new) {
      setOpen('create')
      navigate({ to: '/tasks', search: { ...search, new: undefined }, replace: true })
    }
  }, [search, setOpen, navigate])
  return null
}

export function Tasks() {
  const trades = useTrades()
  const stats = useMemo(() => computeStats(trades), [trades])

  return (
    <TasksProvider>
      <NewTradeIntent />
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Trade Journal</h2>
            <p className='text-muted-foreground'>
              All recorded trades. Filter, review and learn from your edge.
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <MiniStat
            label='Net P&L'
            value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
            tone={stats.totalPnl >= 0 ? 'positive' : 'negative'}
          />
          <MiniStat
            label='Win Rate'
            value={`${stats.winRate.toFixed(1)}%`}
          />
          <MiniStat
            label='Profit Factor'
            value={stats.profitFactor.toFixed(2)}
            tone={stats.profitFactor >= 1 ? 'positive' : 'negative'}
          />
          <MiniStat
            label='Total Trades'
            value={`${stats.total}`}
          />
        </div>

        <TasksTable data={trades} />
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}

function MiniStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
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
            'text-xl font-bold tabular-nums ' +
            (tone === 'positive'
              ? 'text-emerald-600'
              : tone === 'negative'
                ? 'text-red-600'
                : '')
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
