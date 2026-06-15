import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfileStore, type ExperienceLevel } from '@/stores/profile-store'
import {
  useTradingSettings,
  type TradingSettingsState,
} from '@/stores/trading-settings-store'
import apiClient from '@/lib/api'

export const PROFILE_KEY = ['profile'] as const

export type ServerProfile = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  experience: ExperienceLevel
  preferredPair: string
  startingCapital: number
  onboardingComplete: boolean
  onboardedAt?: string | null
  tradingSettings: Partial<TradingSettingsState>
}

const defaultPersistentTradingSettings: Partial<TradingSettingsState> = {
  platformCountry: '',
  ftmoMode: false,
  propFirmTemplate: 'ftmo',
  ftmoAccountSize: 10000,
  ftmoDailyLossLimitPct: 5,
  ftmoMaxDrawdownPct: 10,
  ftmoProfitTargetPct: 10,
}

export function toLocalProfile(profile: ServerProfile) {
  return {
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    experience: profile.experience,
    preferredPair: profile.preferredPair,
    startingCapital: profile.startingCapital,
    avatarUrl: profile.avatarUrl,
    onboardedAt: profile.onboardedAt ?? undefined,
  }
}

export function serializeTradingSettings(
  settings: Partial<TradingSettingsState>
): Partial<TradingSettingsState> {
  const keys = [
    'timezone',
    'platformCountry',
    'platformDateOverride',
    'currencySymbol',
    'defaultRiskPct',
    'ftmoMode',
    'propFirmTemplate',
    'ftmoAccountSize',
    'ftmoDailyLossLimitPct',
    'ftmoMaxDrawdownPct',
    'ftmoProfitTargetPct',
    'weeklyTargetUsd',
    'monthlyTargetUsd',
    'dailyLossLimitUsd',
    'showPipsInsteadOfPoints',
    'autoAssignImportedStrategy',
    'importedTradeStrategy',
    'newsNotificationsEnabled',
    'newsNotificationLeadMinutes',
    'newsFilterCountries',
    'newsFilterImpacts',
  ] as const

  return Object.fromEntries(
    keys
      .map((key) => [key, settings[key]])
      .filter(([, value]) => value !== undefined)
  ) as Partial<TradingSettingsState>
}

export async function fetchServerProfile() {
  const { data } = await apiClient.get('/profile')
  return data as ServerProfile
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(
        () => reject(new Error('Profile check timed out.')),
        timeoutMs
      )
    }),
  ])
}

export async function isServerOnboarded(userId: string) {
  try {
    const profile = await withTimeout(fetchServerProfile(), 3500)
    return profile.id === userId && profile.onboardingComplete
  } catch {
    return useProfileStore.getState().isOnboardedForUser(userId)
  }
}

export function useProfileQuery() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchServerProfile,
    staleTime: 30 * 1000,
  })
}

export function useHydratePersistentProfile() {
  const { data } = useProfileQuery()
  const setProfile = useProfileStore((s) => s.setProfile)
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding)
  const applySettings = useTradingSettings((s) => s.applySettings)

  useEffect(() => {
    if (!data) return
    setProfile(toLocalProfile(data))
    if (data.onboardingComplete) completeOnboarding(data.onboardedAt ?? null)
    applySettings({
      ...defaultPersistentTradingSettings,
      ...(data.tradingSettings ?? {}),
    })
  }, [applySettings, completeOnboarding, data, setProfile])
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const localProfile = useProfileStore((s) => s.profile)
  const tradingSettings = useTradingSettings()

  return useMutation({
    mutationFn: async (payload: {
      profile?: Partial<ServerProfile>
      tradingSettings?: Partial<TradingSettingsState>
    }) => {
      const { data } = await apiClient.put('/profile', {
        profile: {
          ...localProfile,
          ...payload.profile,
        },
        tradingSettings: {
          ...serializeTradingSettings(tradingSettings),
          ...serializeTradingSettings(payload.tradingSettings ?? {}),
        },
      })
      return data as ServerProfile
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  })
}
