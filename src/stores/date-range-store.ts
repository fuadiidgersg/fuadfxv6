import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DatePreset = '7d' | '30d' | '90d' | 'ytd' | 'all' | 'custom'

export type DateRangeState = {
  preset: DatePreset
  startDate: string | null
  endDate: string | null
  setPreset: (p: DatePreset) => void
  setCustomRange: (start: string, end: string) => void
  getRange: () => { start: Date | null; end: Date | null }
}

function presetToDates(preset: DatePreset): { start: Date | null; end: Date | null } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === 'all') return { start: null, end: null }

  if (preset === '7d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (preset === '30d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (preset === '90d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 89)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (preset === 'ytd') {
    const start = new Date(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  return { start: null, end: null }
}

export const useDateRangeStore = create<DateRangeState>()(
  persist(
    (set, get) => ({
      preset: 'all',
      startDate: null,
      endDate: null,

      setPreset: (p) => set({ preset: p, startDate: null, endDate: null }),
      setCustomRange: (start, end) =>
        set({ preset: 'custom', startDate: start, endDate: end }),

      getRange: () => {
        const { preset, startDate, endDate } = get()
        if (preset === 'custom' && startDate && endDate) {
          return {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        }
        return presetToDates(preset)
      },
    }),
    { name: 'fuadfx-date-range', version: 1 }
  )
)

export function filterTradesByDateRange<T extends { closedAt: Date; openedAt: Date }>(
  trades: T[],
  range: { start: Date | null; end: Date | null }
): T[] {
  if (!range.start && !range.end) return trades
  return trades.filter((t) => {
    const d = t.closedAt ?? t.openedAt
    if (range.start && d < range.start) return false
    if (range.end && d > range.end) return false
    return true
  })
}

export const PRESET_LABELS: Record<DatePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
  all: 'All time',
  custom: 'Custom',
}
