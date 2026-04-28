import { ArrowDownRight, ArrowUpRight, Target, Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTrades } from '@/stores/trades-store'
import {
  computeStats,
  groupByPair,
  groupBySession,
  groupByStrategy,
} from '@/features/trades/data/stats'
import { AnalyticsChart } from './analytics-chart'

export function Analytics() {
  const trades = useTrades()
  const stats = computeStats(trades)
  const byPair = groupByPair(trades).slice(0, 6)
  const byStrategy = groupByStrategy(trades)
  const bySession = groupBySession(trades)

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>
            Net P&L and trade count for the last 14 trading days.
          </CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <AnalyticsChart />
        </CardContent>
      </Card>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <MiniCard
          title='Largest Win'
          value={`+$${stats.bestTrade.toFixed(2)}`}
          hint='single trade'
          icon={Trophy}
          positive
        />
        <MiniCard
          title='Largest Loss'
          value={`$${stats.worstTrade.toFixed(2)}`}
          hint='single trade'
          icon={ArrowDownRight}
        />
        <MiniCard
          title='Avg R Multiple'
          value={stats.avgR.toFixed(2)}
          hint={`across ${stats.total} trades`}
          icon={Target}
          positive={stats.avgR >= 0}
        />
        <MiniCard
          title='Win Streak'
          value={`${stats.largestWinStreak}`}
          hint={`worst losing streak ${stats.largestLossStreak}`}
          icon={ArrowUpRight}
          positive
        />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>Performance by Pair</CardTitle>
            <CardDescription>Top symbols by net P&L</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={byPair.map((p) => ({ name: p.pair, value: p.pnl }))}
              valueFormatter={(n) => `${n >= 0 ? '+' : ''}$${n.toFixed(0)}`}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader>
            <CardTitle>By Session</CardTitle>
            <CardDescription>When you make money</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={bySession.map((s) => ({ name: s.session, value: s.pnl }))}
              valueFormatter={(n) => `${n >= 0 ? '+' : ''}$${n.toFixed(0)}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Breakdown</CardTitle>
          <CardDescription>P&L and win rate per strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarList
            items={byStrategy.map((s) => ({ name: s.strategy, value: s.pnl }))}
            valueFormatter={(n) => `${n >= 0 ? '+' : ''}$${n.toFixed(0)}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function MiniCard({
  title,
  value,
  hint,
  icon: Icon,
  positive,
}: {
  title: string
  value: string
  hint: string
  icon: React.ElementType
  positive?: boolean
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
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
        <p className='text-xs text-muted-foreground'>{hint}</p>
      </CardContent>
    </Card>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1)
  return (
    <ul className='space-y-3'>
      {items.map((i) => {
        const positive = i.value >= 0
        const width = `${Math.round((Math.abs(i.value) / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 truncate text-xs text-muted-foreground'>
                {i.name}
              </div>
              <div className='h-2.5 w-full rounded-full bg-muted'>
                <div
                  className={
                    'h-2.5 rounded-full ' +
                    (positive ? 'bg-emerald-500' : 'bg-red-500')
                  }
                  style={{ width }}
                />
              </div>
            </div>
            <div
              className={
                'ps-2 text-xs font-medium tabular-nums ' +
                (positive ? 'text-emerald-600' : 'text-red-600')
              }
            >
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
