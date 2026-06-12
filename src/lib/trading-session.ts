export type MarketSession = 'Asian' | 'London' | 'Overlap' | 'New York'
export type ForexMarketStatus = {
  isOpen: boolean
  label: 'Market Open' | 'Market Closed'
}

export function getTimeParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0
  )

  return { hour: hour === 24 ? 0 : hour, minute }
}

function getWeekday(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: timezone,
  }).format(date)
}

export function getMarketSession(date: Date, timezone: string): MarketSession {
  const { hour } = getTimeParts(date, timezone)
  if (hour >= 0 && hour < 7) return 'Asian'
  if (hour >= 7 && hour < 12) return 'London'
  if (hour >= 12 && hour < 17) return 'Overlap'
  return 'New York'
}

export function formatClockTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date)
}

export function getForexMarketStatus(date: Date): ForexMarketStatus {
  const { hour } = getTimeParts(date, 'America/New_York')
  const weekday = getWeekday(date, 'America/New_York')

  const isOpen =
    (weekday === 'Sun' && hour >= 17) ||
    ['Mon', 'Tue', 'Wed', 'Thu'].includes(weekday) ||
    (weekday === 'Fri' && hour < 17)

  return {
    isOpen,
    label: isOpen ? 'Market Open' : 'Market Closed',
  }
}
