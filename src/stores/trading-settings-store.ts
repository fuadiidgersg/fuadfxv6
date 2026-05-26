import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencySymbol = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF'

export type TradingSettingsState = {
  timezone: string
  currencySymbol: CurrencySymbol
  defaultRiskPct: number
  ftmoMode: boolean
  ftmoAccountSize: number
  ftmoDailyLossLimitPct: number
  ftmoMaxDrawdownPct: number
  ftmoProfitTargetPct: number
  weeklyTargetUsd: number
  monthlyTargetUsd: number
  dailyLossLimitUsd: number
  showPipsInsteadOfPoints: boolean
  setTimezone: (tz: string) => void
  setCurrencySymbol: (c: CurrencySymbol) => void
  setDefaultRiskPct: (v: number) => void
  setFtmoMode: (v: boolean) => void
  setFtmoAccountSize: (v: number) => void
  setFtmoDailyLossLimitPct: (v: number) => void
  setFtmoMaxDrawdownPct: (v: number) => void
  setFtmoProfitTargetPct: (v: number) => void
  setWeeklyTargetUsd: (v: number) => void
  setMonthlyTargetUsd: (v: number) => void
  setDailyLossLimitUsd: (v: number) => void
  setShowPipsInsteadOfPoints: (v: boolean) => void
}

export const useTradingSettings = create<TradingSettingsState>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currencySymbol: 'USD',
      defaultRiskPct: 1,
      ftmoMode: false,
      ftmoAccountSize: 10000,
      ftmoDailyLossLimitPct: 5,
      ftmoMaxDrawdownPct: 10,
      ftmoProfitTargetPct: 10,
      weeklyTargetUsd: 0,
      monthlyTargetUsd: 0,
      dailyLossLimitUsd: 0,
      showPipsInsteadOfPoints: true,

      setTimezone: (tz) => set({ timezone: tz }),
      setCurrencySymbol: (c) => set({ currencySymbol: c }),
      setDefaultRiskPct: (v) => set({ defaultRiskPct: v }),
      setFtmoMode: (v) => set({ ftmoMode: v }),
      setFtmoAccountSize: (v) => set({ ftmoAccountSize: v }),
      setFtmoDailyLossLimitPct: (v) => set({ ftmoDailyLossLimitPct: v }),
      setFtmoMaxDrawdownPct: (v) => set({ ftmoMaxDrawdownPct: v }),
      setFtmoProfitTargetPct: (v) => set({ ftmoProfitTargetPct: v }),
      setWeeklyTargetUsd: (v) => set({ weeklyTargetUsd: v }),
      setMonthlyTargetUsd: (v) => set({ monthlyTargetUsd: v }),
      setDailyLossLimitUsd: (v) => set({ dailyLossLimitUsd: v }),
      setShowPipsInsteadOfPoints: (v) => set({ showPipsInsteadOfPoints: v }),
    }),
    { name: 'fuadfx-trading-settings', version: 1 }
  )
)

export const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'New York (ET)', value: 'America/New_York' },
  { label: 'Chicago (CT)', value: 'America/Chicago' },
  { label: 'Los Angeles (PT)', value: 'America/Los_Angeles' },
  { label: 'Toronto (ET)', value: 'America/Toronto' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
  { label: 'Frankfurt (CET)', value: 'Europe/Berlin' },
  { label: 'Paris (CET)', value: 'Europe/Paris' },
  { label: 'Amsterdam (CET)', value: 'Europe/Amsterdam' },
  { label: 'Zurich (CET)', value: 'Europe/Zurich' },
  { label: 'Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'Istanbul (TRT)', value: 'Europe/Istanbul' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Riyadh (AST)', value: 'Asia/Riyadh' },
  { label: 'Mumbai (IST)', value: 'Asia/Kolkata' },
  { label: 'Dhaka (BST)', value: 'Asia/Dhaka' },
  { label: 'Karachi (PKT)', value: 'Asia/Karachi' },
  { label: 'Bangkok (ICT)', value: 'Asia/Bangkok' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Seoul (KST)', value: 'Asia/Seoul' },
  { label: 'Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Auckland (NZST)', value: 'Pacific/Auckland' },
]
