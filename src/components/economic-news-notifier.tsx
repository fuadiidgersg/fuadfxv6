import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { getPlatformNow } from '@/lib/platform-time'
import { news } from '@/features/news/data/news'

const notifiedKey = 'fuadfx-news-alerts-sent'

function readNotifiedIds() {
  try {
    return new Set<string>(
      JSON.parse(window.localStorage.getItem(notifiedKey) || '[]')
    )
  } catch {
    return new Set<string>()
  }
}

function writeNotifiedIds(ids: Set<string>) {
  window.localStorage.setItem(notifiedKey, JSON.stringify(Array.from(ids)))
}

export function EconomicNewsNotifier() {
  const enabled = useTradingSettings((s) => s.newsNotificationsEnabled)
  const leadMinutes = useTradingSettings((s) => s.newsNotificationLeadMinutes)
  const countries = useTradingSettings((s) => s.newsFilterCountries)
  const impacts = useTradingSettings((s) => s.newsFilterImpacts)
  const platformDateOverride = useTradingSettings((s) => s.platformDateOverride)

  useEffect(() => {
    if (!enabled) return
    if (typeof Notification === 'undefined') {
      toast.error('This browser does not support desktop notifications.')
      return
    }
    if (Notification.permission !== 'granted') return

    const checkEvents = () => {
      const now = getPlatformNow(platformDateOverride)
      const leadMs = leadMinutes * 60_000
      const notified = readNotifiedIds()
      let changed = false

      for (const event of news) {
        if (notified.has(event.id)) continue
        if (impacts.length > 0 && !impacts.includes(event.impact)) continue
        if (countries.length > 0 && !countries.includes(event.country)) continue

        const timeUntil = new Date(event.time).getTime() - now.getTime()
        if (timeUntil < 0 || timeUntil > leadMs) continue

        new Notification(
          `${event.impact.toUpperCase()} news in ${Math.max(1, Math.ceil(timeUntil / 60_000))} min`,
          {
            body: `${event.currency} ${event.title} - ${event.country}`,
            tag: `fuadfx-news-${event.id}`,
          }
        )
        notified.add(event.id)
        changed = true
      }

      if (changed) writeNotifiedIds(notified)
    }

    checkEvents()
    const timer = window.setInterval(checkEvents, 30_000)
    return () => window.clearInterval(timer)
  }, [enabled, leadMinutes, countries, impacts, platformDateOverride])

  return null
}
