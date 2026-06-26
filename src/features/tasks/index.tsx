import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as TasksRoute } from '@/routes/_authenticated/tasks/index'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  NotebookPen,
  SearchCheck,
  Tags,
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
              Your working desk for MT5 history, trade review, mistakes,
              setups and lessons.
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>

        <div className='grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4'>
          <MiniStat
            label='Journal P&L'
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

        <JournalWorkflowPanel trades={trades} />

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

function JournalWorkflowPanel({ trades }: { trades: Trade[] }) {
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
    <Card className='overflow-hidden'>
      <CardHeader className='flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle className='flex items-center gap-2 text-base'>
            <NotebookPen className='size-4' />
            Daily Journal Flow
          </CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            Import or sync trades, review the execution, tag your setup, then
            use analytics only after the journal is clean.
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
      <CardContent className='grid gap-0 p-0 lg:grid-cols-4'>
        <WorkflowStep
          step='1'
          label='Sync account'
          value={`${importedTrades.length} MT5 trade${importedTrades.length === 1 ? '' : 's'}`}
          detail='EA sync or manual statement upload'
          icon={Download}
          tone={importedTrades.length > 0 ? 'good' : 'neutral'}
        />
        <WorkflowStep
          step='2'
          label='Review trades'
          value={`${reviewQueue.length} open review${reviewQueue.length === 1 ? '' : 's'}`}
          detail={`${reviewedCount}/${trades.length} trades complete (${reviewRate}%)`}
          icon={ClipboardCheck}
          tone={reviewQueue.length > 0 ? 'warn' : 'good'}
        />
        <WorkflowStep
          step='3'
          label='Tag behavior'
          value={`${ruleBreaks.length} rule break${ruleBreaks.length === 1 ? '' : 's'}`}
          detail='Plan, mistakes, management and lessons'
          icon={Tags}
          tone={ruleBreaks.length > 0 ? 'warn' : 'good'}
        />
        <WorkflowStep
          step='4'
          label='Study edge'
          value={trades.length > 0 ? 'Ready to analyze' : 'Waiting for data'}
          detail='Use analytics after review quality is high'
          icon={SearchCheck}
          tone={reviewRate >= 80 ? 'good' : 'neutral'}
        />
      </CardContent>
    </Card>
  )
}

function WorkflowStep({
  step,
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  step: string
  label: string
  value: string
  detail: string
  icon: React.ElementType
  tone: 'good' | 'warn' | 'neutral'
}) {
  return (
    <div className='border-b p-4 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <span className='flex size-6 items-center justify-center rounded-full border text-xs font-semibold'>
            {step}
          </span>
          <p className='text-sm font-medium'>{label}</p>
        </div>
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
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='text-base font-semibold tabular-nums'>{value}</div>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>
            {detail}
          </p>
        </div>
        <Icon className='size-4 shrink-0 text-muted-foreground' />
      </div>
      <ArrowRight className='mt-3 hidden size-4 text-muted-foreground lg:block' />
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
    <div className='border-b px-1 py-2 last:border-b-0 sm:border-r sm:border-b-0 sm:px-3 sm:last:border-r-0'>
      <div className='text-xs font-medium text-muted-foreground'>{label}</div>
      <div
        className={
          'mt-1 text-xl font-bold tabular-nums ' +
          (tone === 'positive'
            ? 'text-emerald-600'
            : tone === 'negative'
              ? 'text-red-600'
              : '')
        }
      >
        {value}
      </div>
    </div>
  )
}
