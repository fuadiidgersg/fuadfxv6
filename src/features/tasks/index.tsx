import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as TasksRoute } from '@/routes/_authenticated/tasks/index'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
} from 'lucide-react'
import { useTrades } from '@/stores/trades-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { computeStats, formatProfitFactor } from '@/features/trades/data/stats'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider, useTasks } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import type { Task as Trade } from './data/schema'

function TradeDialogIntent() {
  const search = TasksRoute.useSearch()
  const navigate = useNavigate()
  const { setOpen } = useTasks()
  useEffect(() => {
    if (search.new) {
      setOpen('create')
      navigate({
        to: '/tasks',
        search: { ...search, new: undefined },
        replace: true,
      })
    }
    if (search.import) {
      setOpen('import')
      navigate({
        to: '/tasks',
        search: { ...search, import: undefined },
        replace: true,
      })
    }
  }, [search, setOpen, navigate])
  return null
}

export function Tasks() {
  const trades = useTrades()
  const stats = useMemo(() => computeStats(trades), [trades])

  return (
    <TasksProvider>
      <TradeDialogIntent />
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
          <MiniStat label='Win Rate' value={`${stats.winRate.toFixed(1)}%`} />
          <MiniStat
            label='Profit Factor'
            value={formatProfitFactor(stats.profitFactor)}
            tone={stats.profitFactor >= 1 ? 'positive' : 'negative'}
          />
          <MiniStat label='Total Trades' value={`${stats.total}`} />
        </div>

        <ReviewWorkflowPanel trades={trades} />

        <TasksTable data={trades} />
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}

function tagValue(tags: string[] = [], key: string) {
  return (
    tags.find((tag) => tag.startsWith(`${key}:`))?.slice(key.length + 1) ?? ''
  )
}

function needsReview(trade: Trade) {
  const hasExecutionReview =
    tagValue(trade.tags, 'entry') ||
    tagValue(trade.tags, 'exit') ||
    tagValue(trade.tags, 'plan') ||
    tagValue(trade.tags, 'manage')

  return (
    trade.strategy === 'Unassigned' ||
    !hasExecutionReview ||
    !trade.notes?.trim()
  )
}

function ReviewWorkflowPanel({ trades }: { trades: Trade[] }) {
  const { setOpen, setCurrentRow } = useTasks()
  const reviewQueue = useMemo(() => trades.filter(needsReview), [trades])
  const importedTrades = trades.filter((trade) => trade.tags?.includes('mt5'))
  const ruleBreaks = trades.filter(
    (trade) => tagValue(trade.tags, 'plan') === 'broken' || trade.mistakes
  )
  const reviewedCount = Math.max(0, trades.length - reviewQueue.length)
  const reviewRate = trades.length
    ? Math.round((reviewedCount / trades.length) * 100)
    : 0
  const nextTrade = reviewQueue[0]

  const openNextReview = () => {
    if (!nextTrade) return
    setCurrentRow(nextTrade)
    setOpen('update')
  }

  return (
    <Card>
      <CardHeader className='flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ClipboardCheck className='size-4' />
            Review Workflow
          </CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            Connect the account, then review setup, execution, mistakes and
            lessons before trusting the analytics.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={() => setOpen('import')}>
            <Download className='size-4' />
            Connect account
          </Button>
          <Button onClick={openNextReview} disabled={!nextTrade}>
            <ClipboardCheck className='size-4' />
            Review next trade
          </Button>
        </div>
      </CardHeader>
      <CardContent className='grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4'>
        <WorkflowMetric
          label='Review complete'
          value={`${reviewRate}%`}
          detail={`${reviewedCount}/${trades.length} trades reviewed`}
          tone={reviewRate >= 80 ? 'good' : 'neutral'}
        />
        <WorkflowMetric
          label='Needs review'
          value={String(reviewQueue.length)}
          detail='Missing notes, setup, plan or strategy'
          tone={reviewQueue.length > 0 ? 'warn' : 'good'}
        />
        <WorkflowMetric
          label='MT5 imports'
          value={String(importedTrades.length)}
          detail='Connected from trading account history'
          tone={importedTrades.length > 0 ? 'good' : 'neutral'}
        />
        <WorkflowMetric
          label='Rule breaks'
          value={String(ruleBreaks.length)}
          detail='Broken plan or recorded mistakes'
          tone={ruleBreaks.length > 0 ? 'warn' : 'good'}
        />
      </CardContent>
    </Card>
  )
}

function WorkflowMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'good' | 'warn' | 'neutral'
}) {
  return (
    <div className='rounded-md border bg-muted/20 p-3'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <p className='text-xs font-medium text-muted-foreground'>{label}</p>
        <Badge
          variant={tone === 'warn' ? 'destructive' : 'secondary'}
          className='h-5 gap-1 px-1.5 text-[10px] font-normal'
        >
          {tone === 'good' ? (
            <CheckCircle2 className='size-3' />
          ) : tone === 'warn' ? (
            <AlertTriangle className='size-3' />
          ) : null}
          {tone === 'warn' ? 'Action' : tone === 'good' ? 'Good' : 'Track'}
        </Badge>
      </div>
      <div className='text-2xl font-bold tabular-nums'>{value}</div>
      <p className='mt-1 text-xs leading-5 text-muted-foreground'>{detail}</p>
    </div>
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
