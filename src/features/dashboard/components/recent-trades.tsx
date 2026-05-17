import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useTrades } from '@/stores/trades-store'

export function RecentTrades() {
  const trades = useTrades()
  const recent = [...trades]
    .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime())
    .slice(0, 6)
  return (
    <div className='space-y-5'>
      {recent.map((t) => {
        const positive = t.pnl >= 0
        return (
          <div key={t.id} className='flex items-center gap-4'>
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                positive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              )}
            >
              {t.direction === 'long' ? (
                <ArrowUpRight className='size-4' />
              ) : (
                <ArrowDownRight className='size-4' />
              )}
            </div>
            <div className='flex flex-1 flex-wrap items-center justify-between gap-1'>
              <div className='space-y-0.5'>
                <p className='flex items-center gap-2 text-sm leading-none font-medium'>
                  {t.pair}
                  <Badge variant='outline' className='text-[10px]'>
                    {t.direction.toUpperCase()}
                  </Badge>
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t.strategy} · {t.closedAt.toLocaleDateString()}
                </p>
              </div>
              <div
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  positive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {positive ? '+' : ''}${t.pnl.toFixed(2)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
