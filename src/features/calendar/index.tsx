import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { useTrades } from '@/stores/trades-store'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function Calendar() {
  const trades = useTrades()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const map = useMemo(() => {
    const m = new Map<string, { pnl: number; count: number }>()
    for (const t of trades) {
      const key = fmtKey(t.closedAt)
      const cur = m.get(key) ?? { pnl: 0, count: 0 }
      cur.pnl += t.pnl
      cur.count += 1
      m.set(key, cur)
    }
    return m
  }, [trades])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7 // make Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  // weekly aggregations
  const weeks: { pnl: number; count: number }[] = []
  for (let i = 0; i < cells.length; i += 7) {
    const slice = cells.slice(i, i + 7)
    const agg = slice.reduce(
      (acc, d) => {
        if (!d) return acc
        const v = map.get(fmtKey(d))
        if (v) {
          acc.pnl += v.pnl
          acc.count += v.count
        }
        return acc
      },
      { pnl: 0, count: 0 }
    )
    weeks.push(agg)
  }

  const monthStats = cells.reduce(
    (acc, d) => {
      if (!d) return acc
      const v = map.get(fmtKey(d))
      if (v) {
        acc.pnl += v.pnl
        acc.count += v.count
        if (v.pnl > 0) acc.greenDays++
        else if (v.pnl < 0) acc.redDays++
      }
      return acc
    },
    { pnl: 0, count: 0, greenDays: 0, redDays: 0 }
  )

  const monthName = cursor.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  function shift(delta: number) {
    setCursor(new Date(year, month + delta, 1))
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>P&L Calendar</h2>
            <p className='text-muted-foreground'>
              See how your daily and weekly results stack up across the month.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' onClick={() => shift(-1)}>
              <ChevronLeft className='size-4' />
            </Button>
            <div className='min-w-[160px] text-center font-medium'>
              {monthName}
            </div>
            <Button variant='outline' size='icon' onClick={() => shift(1)}>
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-4'>
          <SummaryCard label='Month P&L' value={monthStats.pnl} format='money' />
          <SummaryCard label='Trading Days' value={monthStats.count} format='int' />
          <SummaryCard label='Green Days' value={monthStats.greenDays} format='int' tone='positive' />
          <SummaryCard label='Red Days' value={monthStats.redDays} format='int' tone='negative' />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{monthName}</CardTitle>
            <CardDescription>
              Each tile shows the net P&L and number of trades for that day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-8 gap-1.5 text-xs'>
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className='py-1 text-center font-medium text-muted-foreground'
                >
                  {d}
                </div>
              ))}
              <div className='py-1 text-center font-medium text-muted-foreground'>
                Week
              </div>

              {Array.from({ length: weeks.length }).map((_, w) => {
                const weekCells = cells.slice(w * 7, w * 7 + 7)
                const weekly = weeks[w]
                return (
                  <div key={w} className='contents'>
                    {weekCells.map((d, idx) => (
                      <DayCell key={idx} date={d} entry={d ? map.get(fmtKey(d)) : undefined} />
                    ))}
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center rounded-md border bg-muted/40 p-2 text-center',
                        weekly.pnl > 0 && 'border-emerald-500/30 bg-emerald-500/10',
                        weekly.pnl < 0 && 'border-red-500/30 bg-red-500/10'
                      )}
                    >
                      {weekly.count > 0 ? (
                        <>
                          <span
                            className={cn(
                              'text-xs font-semibold tabular-nums',
                              weekly.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {weekly.pnl >= 0 ? '+' : ''}$
                            {Math.abs(weekly.pnl).toFixed(0)}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>
                            {weekly.count} trades
                          </span>
                        </>
                      ) : (
                        <span className='text-[10px] text-muted-foreground'>
                          —
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
              <LegendSwatch className='bg-emerald-500/80' label='Big winning day' />
              <LegendSwatch className='bg-emerald-500/30' label='Winning day' />
              <LegendSwatch className='bg-muted' label='No trades' />
              <LegendSwatch className='bg-red-500/30' label='Losing day' />
              <LegendSwatch className='bg-red-500/80' label='Big losing day' />
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

function DayCell({
  date,
  entry,
}: {
  date: Date | null
  entry: { pnl: number; count: number } | undefined
}) {
  if (!date)
    return <div className='aspect-square rounded-md border border-transparent' />

  const pnl = entry?.pnl ?? 0
  const count = entry?.count ?? 0
  const intensity =
    Math.min(1, Math.abs(pnl) / 400) // scale by $400
  const bg =
    !entry || count === 0
      ? 'bg-muted/40 border'
      : pnl >= 0
        ? `border border-emerald-500/30`
        : `border border-red-500/30`
  const overlay =
    count === 0
      ? ''
      : pnl >= 0
        ? `bg-emerald-500/[${(0.15 + intensity * 0.5).toFixed(2)}]`
        : `bg-red-500/[${(0.15 + intensity * 0.5).toFixed(2)}]`

  return (
    <div
      className={cn(
        'relative flex aspect-square flex-col justify-between overflow-hidden rounded-md p-1.5 text-[10px]',
        bg
      )}
      style={{
        backgroundColor:
          count === 0
            ? undefined
            : pnl >= 0
              ? `rgba(16,185,129,${(0.12 + intensity * 0.55).toFixed(2)})`
              : `rgba(239,68,68,${(0.12 + intensity * 0.55).toFixed(2)})`,
      }}
    >
      <div className='flex items-center justify-between'>
        <span className='font-medium text-foreground'>{date.getDate()}</span>
        {count > 0 && (
          <Badge variant='outline' className='h-4 px-1 text-[9px]'>
            {count}
          </Badge>
        )}
      </div>
      {count > 0 && (
        <div
          className={cn(
            'text-xs font-semibold tabular-nums',
            pnl >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
          )}
        >
          {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
        </div>
      )}
      <span className='hidden'>{overlay}</span>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  format,
  tone,
}: {
  label: string
  value: number
  format: 'money' | 'int'
  tone?: 'positive' | 'negative'
}) {
  const display =
    format === 'money'
      ? `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`
      : value.toString()
  const colored =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
        ? 'text-red-600'
        : format === 'money'
          ? value >= 0
            ? 'text-emerald-600'
            : 'text-red-600'
          : ''
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-xs font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', colored)}>
          {display}
        </div>
      </CardContent>
    </Card>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span className={cn('inline-block size-3 rounded-sm border', className)} />
      {label}
    </span>
  )
}
