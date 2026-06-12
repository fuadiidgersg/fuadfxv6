import { useEffect, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { getPlatformNow } from '@/lib/platform-time'
import {
  formatClockTime,
  getForexMarketStatus,
  getMarketSession,
} from '@/lib/trading-session'
import { cn } from '@/lib/utils'

export function MarketClock() {
  const timezone = useTradingSettings((s) => s.timezone)
  const platformDateOverride = useTradingSettings((s) => s.platformDateOverride)
  const [now, setNow] = useState(() => getPlatformNow(platformDateOverride))

  useEffect(() => {
    setNow(getPlatformNow(platformDateOverride))
    const timer = window.setInterval(
      () => setNow(getPlatformNow(platformDateOverride)),
      30_000
    )
    return () => window.clearInterval(timer)
  }, [platformDateOverride])

  const session = useMemo(
    () => getMarketSession(now, timezone),
    [now, timezone]
  )
  const marketStatus = useMemo(() => getForexMarketStatus(now), [now])
  const time = useMemo(() => formatClockTime(now, timezone), [now, timezone])
  const zoneLabel = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone
  const dateLabel = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className='hidden h-9 items-center overflow-hidden rounded-md border bg-background/80 text-xs shadow-sm sm:flex'>
      <div className='flex h-full items-center gap-2 border-e px-3 text-muted-foreground'>
        <Clock3 className='size-3.5' />
        <span className='font-semibold text-foreground tabular-nums'>
          {time}
        </span>
        <span className='hidden lg:inline'>{dateLabel}</span>
        <span className='hidden xl:inline'>{zoneLabel}</span>
      </div>
      <div className='flex h-full items-center border-e px-3 font-medium text-foreground'>
        {session} Session
      </div>
      <div
        className={cn(
          'flex h-full items-center gap-2 px-3 font-semibold',
          marketStatus.isOpen
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
            : 'bg-red-500/10 text-red-600 dark:text-red-300'
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full',
            marketStatus.isOpen ? 'bg-emerald-500' : 'bg-red-500'
          )}
        />
        <span className='hidden md:inline'>{marketStatus.label}</span>
        <span className='md:hidden'>
          {marketStatus.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
    </div>
  )
}
