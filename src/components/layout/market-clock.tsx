import { useEffect, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { formatClockTime, getMarketSession } from '@/lib/trading-session'

export function MarketClock() {
  const timezone = useTradingSettings((s) => s.timezone)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const session = useMemo(
    () => getMarketSession(now, timezone),
    [now, timezone]
  )
  const time = useMemo(() => formatClockTime(now, timezone), [now, timezone])
  const zoneLabel = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone

  return (
    <div className='hidden items-center gap-2 rounded-md border bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground sm:flex'>
      <Clock3 className='size-3.5' />
      <span className='font-medium text-foreground tabular-nums'>{time}</span>
      <span className='hidden md:inline'>{zoneLabel}</span>
      <span className='rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground'>
        {session}
      </span>
    </div>
  )
}
