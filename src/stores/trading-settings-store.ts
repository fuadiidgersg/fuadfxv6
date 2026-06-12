import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencySymbol =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'

export type NewsImpactFilter = 'high' | 'medium' | 'low'
export type PropFirmTemplate =
  | 'custom'
  | 'ftmo'
  | 'fundednext'
  | 'the5ers'
  | 'e8'

export type TradingSettingsState = {
  timezone: string
  platformDateOverride: string
  currencySymbol: CurrencySymbol
  defaultRiskPct: number
  ftmoMode: boolean
  propFirmTemplate: PropFirmTemplate
  ftmoAccountSize: number
  ftmoDailyLossLimitPct: number
  ftmoMaxDrawdownPct: number
  ftmoProfitTargetPct: number
  weeklyTargetUsd: number
  monthlyTargetUsd: number
  dailyLossLimitUsd: number
  showPipsInsteadOfPoints: boolean
  autoAssignImportedStrategy: boolean
  importedTradeStrategy: string
  newsNotificationsEnabled: boolean
  newsNotificationLeadMinutes: number
  newsFilterCountries: string[]
  newsFilterImpacts: NewsImpactFilter[]
  setTimezone: (tz: string) => void
  setPlatformDateOverride: (date: string) => void
  setCurrencySymbol: (c: CurrencySymbol) => void
  setDefaultRiskPct: (v: number) => void
  setFtmoMode: (v: boolean) => void
  setPropFirmTemplate: (v: PropFirmTemplate) => void
  setFtmoAccountSize: (v: number) => void
  setFtmoDailyLossLimitPct: (v: number) => void
  setFtmoMaxDrawdownPct: (v: number) => void
  setFtmoProfitTargetPct: (v: number) => void
  setWeeklyTargetUsd: (v: number) => void
  setMonthlyTargetUsd: (v: number) => void
  setDailyLossLimitUsd: (v: number) => void
  setShowPipsInsteadOfPoints: (v: boolean) => void
  setAutoAssignImportedStrategy: (v: boolean) => void
  setImportedTradeStrategy: (v: string) => void
  setNewsNotificationsEnabled: (v: boolean) => void
  setNewsNotificationLeadMinutes: (v: number) => void
  setNewsFilterCountries: (v: string[]) => void
  setNewsFilterImpacts: (v: NewsImpactFilter[]) => void
}

export const useTradingSettings = create<TradingSettingsState>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platformDateOverride: '',
      currencySymbol: 'USD',
      defaultRiskPct: 1,
      ftmoMode: false,
      propFirmTemplate: 'ftmo',
      ftmoAccountSize: 10000,
      ftmoDailyLossLimitPct: 5,
      ftmoMaxDrawdownPct: 10,
      ftmoProfitTargetPct: 10,
      weeklyTargetUsd: 0,
      monthlyTargetUsd: 0,
      dailyLossLimitUsd: 0,
      showPipsInsteadOfPoints: true,
      autoAssignImportedStrategy: false,
      importedTradeStrategy: 'Unassigned',
      newsNotificationsEnabled: false,
      newsNotificationLeadMinutes: 15,
      newsFilterCountries: [],
      newsFilterImpacts: ['high'],

      setTimezone: (tz) => set({ timezone: tz }),
      setPlatformDateOverride: (date) => set({ platformDateOverride: date }),
      setCurrencySymbol: (c) => set({ currencySymbol: c }),
      setDefaultRiskPct: (v) => set({ defaultRiskPct: v }),
      setFtmoMode: (v) => set({ ftmoMode: v }),
      setPropFirmTemplate: (v) => set({ propFirmTemplate: v }),
      setFtmoAccountSize: (v) => set({ ftmoAccountSize: v }),
      setFtmoDailyLossLimitPct: (v) => set({ ftmoDailyLossLimitPct: v }),
      setFtmoMaxDrawdownPct: (v) => set({ ftmoMaxDrawdownPct: v }),
      setFtmoProfitTargetPct: (v) => set({ ftmoProfitTargetPct: v }),
      setWeeklyTargetUsd: (v) => set({ weeklyTargetUsd: v }),
      setMonthlyTargetUsd: (v) => set({ monthlyTargetUsd: v }),
      setDailyLossLimitUsd: (v) => set({ dailyLossLimitUsd: v }),
      setShowPipsInsteadOfPoints: (v) => set({ showPipsInsteadOfPoints: v }),
      setAutoAssignImportedStrategy: (v) =>
        set({ autoAssignImportedStrategy: v }),
      setImportedTradeStrategy: (v) => set({ importedTradeStrategy: v }),
      setNewsNotificationsEnabled: (v) => set({ newsNotificationsEnabled: v }),
      setNewsNotificationLeadMinutes: (v) =>
        set({ newsNotificationLeadMinutes: v }),
      setNewsFilterCountries: (v) => set({ newsFilterCountries: v }),
      setNewsFilterImpacts: (v) => set({ newsFilterImpacts: v }),
    }),
    {
      name: 'fuadfx-trading-settings',
      version: 2,
      migrate: (state: any) => ({
        ...state,
        platformDateOverride: state?.platformDateOverride ?? '',
        newsNotificationsEnabled: state?.newsNotificationsEnabled ?? false,
        newsNotificationLeadMinutes: state?.newsNotificationLeadMinutes ?? 15,
        newsFilterCountries: state?.newsFilterCountries ?? [],
        newsFilterImpacts: state?.newsFilterImpacts ?? ['high'],
        propFirmTemplate: state?.propFirmTemplate ?? 'ftmo',
      }),
    }
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
