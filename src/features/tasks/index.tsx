import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as TasksRoute } from '@/routes/_authenticated/tasks/index'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  KeyRound,
  NotebookPen,
  SearchCheck,
  Tags,
  Target,
  Wifi,
} from 'lucide-react'
import { useTrades } from '@/stores/trades-store'
import { useApiKeysQuery } from '@/hooks/use-api-keys-query'
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
  const activeAccount = useActiveAccount()
  const { data: apiKeys = [] } = useApiKeysQuery(activeAccount?.id)
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

        <div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
          <JournalWorkflowPanel trades={trades} />
          <Mt5SyncStatusCard
            activeAccountName={activeAccount?.name}
            activeAccountNumber={activeAccount?.number}
            syncKeys={apiKeys}
            mt5TradeCount={
              trades.filter((trade) => trade.tags?.includes('mt5')).length
            }
          />
        </div>

        <TodayReviewPanel trades={trades} />

        <TasksTable data={trades} />
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}

function TodayReviewPanel({ trades }: { trades: Trade[] }) {
  const { setOpen, setCurrentRow } = useTasks()
  const today = new Date()
  const todayTrades = trades.filter((trade) => isSameDay(trade.closedAt, today))
  const reviewQueue = trades.filter(needsReview)
  const ruleBreaks = trades.filter(
    (trade) => tagValue(trade.tags, 'plan') === 'broken' || trade.mistakes
  )
  const worstMistake = computeWorstMistake(ruleBreaks)
  const bestTrade = todayTrades
    .filter((trade) => trade.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl)[0]
  const worstTrade = todayTrades
    .filter((trade) => trade.pnl < 0)
    .sort((a, b) => a.pnl - b.pnl)[0]

  const openTrade = (trade?: Trade) => {
    if (!trade) return
    setCurrentRow(trade)
    setOpen('update')
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Target className='size-4' />
              Today's Review
            </CardTitle>
            <CardDescription>
              A trader-first checklist before you trust the analytics.
            </CardDescription>
          </div>
          <Button
            type='button'
            variant='outline'
            disabled={!reviewQueue[0]}
            onClick={() => openTrade(reviewQueue[0])}
          >
            <ClipboardCheck className='size-4' />
            Review next
          </Button>
        </div>
      </CardHeader>
      <CardContent className='grid gap-0 p-0 md:grid-cols-4'>
        <ReviewCell
          label='Closed today'
          value={`${todayTrades.length}`}
          detail={
            todayTrades.length
              ? `${formatMoney(todayTrades.reduce((sum, trade) => sum + trade.pnl, 0))} net today`
              : 'No closed trades yet today'
          }
        />
        <ReviewCell
          label='Needs review'
          value={`${reviewQueue.length}`}
          detail='Missing setup, strategy, notes or execution tags'
          tone={reviewQueue.length > 0 ? 'warn' : 'good'}
        />
        <ReviewCell
          label='Costliest mistake'
          value={worstMistake?.label ?? 'None logged'}
          detail={
            worstMistake
              ? `${formatMoney(worstMistake.pnl)} across ${worstMistake.count} trade${worstMistake.count === 1 ? '' : 's'}`
              : 'Tag mistakes to see what is costing money'
          }
          tone={worstMistake ? 'warn' : 'good'}
        />
        <div className='border-t p-4 md:border-t-0 md:border-l'>
          <div className='text-xs font-medium text-muted-foreground'>
            Best / worst today
          </div>
          <div className='mt-2 grid gap-2 text-sm'>
            <button
              type='button'
              disabled={!bestTrade}
              onClick={() => openTrade(bestTrade)}
              className='flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-start disabled:cursor-default disabled:opacity-60'
            >
              <span>{bestTrade ? bestTrade.pair : 'Best trade'}</span>
              <span className='font-semibold text-emerald-600'>
                {bestTrade ? formatMoney(bestTrade.pnl) : '-'}
              </span>
            </button>
            <button
              type='button'
              disabled={!worstTrade}
              onClick={() => openTrade(worstTrade)}
              className='flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-start disabled:cursor-default disabled:opacity-60'
            >
              <span>{worstTrade ? worstTrade.pair : 'Worst trade'}</span>
              <span className='font-semibold text-red-500'>
                {worstTrade ? formatMoney(worstTrade.pnl) : '-'}
              </span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewCell({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string
  value: string
  detail: string
  tone?: 'good' | 'warn' | 'neutral'
}) {
  return (
    <div className='border-t p-4 first:border-t-0 md:border-t-0 md:border-r md:first:border-t-0 md:last:border-r-0'>
      <div className='flex items-center justify-between gap-2'>
        <div className='text-xs font-medium text-muted-foreground'>
          {label}
        </div>
        {tone !== 'neutral' && (
          <Badge
            variant={tone === 'warn' ? 'destructive' : 'secondary'}
            className='h-5 px-1.5 text-[10px] font-normal'
          >
            {tone === 'warn' ? 'Action' : 'Good'}
          </Badge>
        )}
      </div>
      <div className='mt-2 truncate text-lg font-semibold'>{value}</div>
      <p className='mt-1 text-xs leading-5 text-muted-foreground'>{detail}</p>
    </div>
  )
}

function Mt5SyncStatusCard({
  activeAccountName,
  activeAccountNumber,
  syncKeys,
  mt5TradeCount,
}: {
  activeAccountName?: string
  activeAccountNumber?: string
  syncKeys: { last4: string; lastUsedAt: string | null }[]
  mt5TradeCount: number
}) {
  const { setOpen } = useTasks()
  const activeKey = syncKeys[0]
  const lastSync = activeKey?.lastUsedAt
    ? new Date(activeKey.lastUsedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Wifi className='size-4' />
          MT5 Sync Status
        </CardTitle>
        <CardDescription>
          Check whether the journal is receiving trades from your account.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <div className='grid gap-2'>
          <StatusLine label='Journal' value={activeAccountName ?? 'No account'} />
          <StatusLine label='Account' value={activeAccountNumber ?? 'Not set'} />
          <StatusLine
            label='Sync key'
            value={activeKey ? `Active - ends ${activeKey.last4}` : 'Not installed'}
          />
          <StatusLine label='Last sync' value={lastSync ?? 'Waiting for EA'} />
          <StatusLine label='MT5 trades' value={`${mt5TradeCount}`} />
        </div>
        <Button
          type='button'
          variant={activeKey ? 'outline' : 'default'}
          className='w-full'
          onClick={() => setOpen('import')}
        >
          <KeyRound className='size-4' />
          {activeKey ? 'Manage MT5 sync' : 'Install MT5 sync'}
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3 border-b py-2 last:border-b-0'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-end font-medium'>{value}</span>
    </div>
  )
}

function tagValue(tags: string[] = [], key: string) {
  return (
    tags.find((tag) => tag.startsWith(`${key}:`))?.slice(key.length + 1) ?? ''
  )
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatMoney(value: number) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`
}

function computeWorstMistake(trades: Trade[]) {
  const mistakes = new Map<string, { label: string; pnl: number; count: number }>()
  for (const trade of trades) {
    const labels = [
      tagValue(trade.tags, 'plan') === 'broken' ? 'Broke plan' : '',
      ...(trade.mistakes ?? '')
        .split(/[,.;\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ].filter(Boolean)

    for (const label of labels.length ? labels : ['Unclassified mistake']) {
      const current = mistakes.get(label) ?? { label, pnl: 0, count: 0 }
      current.pnl += trade.pnl
      current.count += 1
      mistakes.set(label, current)
    }
  }

  return Array.from(mistakes.values()).sort((a, b) => a.pnl - b.pnl)[0]
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
