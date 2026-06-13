import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

function isMissingColumnError(error: any) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  return (
    text.includes('42703') ||
    text.includes('pgrst204') ||
    text.includes('could not find') ||
    text.includes('does not exist') ||
    text.includes('schema cache')
  )
}

function parseBioState(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function fromRow(row: any, fallback: { id: string; email?: string }) {
  const legacy = parseBioState(row?.bio) as Record<string, any>
  const legacyProfile = (legacy.profile ?? {}) as Record<string, any>
  const legacySettings = (legacy.tradingSettings ?? {}) as Record<string, any>

  return {
    id: row?.id ?? fallback.id,
    email: row?.email ?? fallback.email ?? '',
    displayName: row?.full_name ?? legacyProfile.displayName ?? '',
    avatarUrl: row?.avatar_url ?? legacyProfile.avatarUrl ?? '',
    experience: row?.experience ?? legacyProfile.experience ?? 'beginner',
    preferredPair:
      row?.preferred_pair ?? legacyProfile.preferredPair ?? 'EUR/USD',
    startingCapital: Number(
      row?.starting_capital ?? legacyProfile.startingCapital ?? 0
    ),
    onboardingComplete: Boolean(
      row?.onboarding_complete ?? legacyProfile.onboardingComplete ?? false
    ),
    onboardedAt: row?.onboarded_at ?? legacyProfile.onboardedAt ?? null,
    tradingSettings: row?.trading_settings ?? legacySettings ?? {},
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  }
}

function toProfileRow(body: any, req: AuthRequest) {
  const profile = body.profile ?? body
  const tradingSettings = body.tradingSettings ?? profile.tradingSettings ?? {}
  const row: Record<string, any> = {
    id: req.user!.id,
    email: profile.email ?? req.user!.email ?? null,
    updated_at: new Date().toISOString(),
  }

  if (profile.displayName !== undefined || profile.fullName !== undefined) {
    row.full_name = profile.displayName ?? profile.fullName
  }
  if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl
  if (profile.experience !== undefined) row.experience = profile.experience
  if (profile.preferredPair !== undefined) {
    row.preferred_pair = profile.preferredPair
  }
  if (profile.startingCapital !== undefined) {
    row.starting_capital = profile.startingCapital
  }
  if (profile.onboardingComplete !== undefined) {
    row.onboarding_complete = Boolean(profile.onboardingComplete)
  }
  if (profile.onboardedAt !== undefined) row.onboarded_at = profile.onboardedAt
  if (profile.timezone !== undefined || tradingSettings.timezone !== undefined) {
    row.timezone = tradingSettings.timezone ?? profile.timezone
  }
  if (
    profile.currency !== undefined ||
    tradingSettings.currencySymbol !== undefined
  ) {
    row.currency = tradingSettings.currencySymbol ?? profile.currency
  }
  if (Object.keys(tradingSettings).length > 0) {
    row.trading_settings = tradingSettings
  }

  return row
}

function toLegacyProfileRow(row: Record<string, any>, existing?: any) {
  const {
    experience,
    preferred_pair,
    starting_capital,
    onboarding_complete,
    onboarded_at,
    trading_settings,
    ...base
  } = row
  const current = parseBioState(existing?.bio) as Record<string, any>
  const currentProfile = (current.profile ?? {}) as Record<string, any>
  const currentSettings = (current.tradingSettings ?? {}) as Record<string, any>

  return {
    ...base,
    bio: JSON.stringify({
      profile: {
        ...currentProfile,
        ...(experience !== undefined ? { experience } : {}),
        ...(preferred_pair !== undefined ? { preferredPair: preferred_pair } : {}),
        ...(starting_capital !== undefined
          ? { startingCapital: starting_capital }
          : {}),
        ...(onboarding_complete !== undefined
          ? { onboardingComplete: onboarding_complete }
          : {}),
        ...(onboarded_at !== undefined ? { onboardedAt: onboarded_at } : {}),
        ...(row.full_name !== undefined ? { displayName: row.full_name } : {}),
        ...(row.avatar_url !== undefined ? { avatarUrl: row.avatar_url } : {}),
      },
      tradingSettings: {
        ...currentSettings,
        ...(trading_settings ?? {}),
      },
    }),
  }
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single()

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    res.json(fromRow(data, { id: req.user!.id, email: req.user!.email }))
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/', async (req: AuthRequest, res) => {
  try {
    const row = toProfileRow(req.body, req)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(row)
      .select()
      .single()

    if (error && isMissingColumnError(error)) {
      const existing = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user!.id)
        .single()
      const fallback = await supabaseAdmin
        .from('profiles')
        .upsert(toLegacyProfileRow(row, existing.data))
        .select()
        .single()
      if (fallback.error) {
        return res.status(400).json({ error: fallback.error.message })
      }
      return res.json(
        fromRow(fallback.data, { id: req.user!.id, email: req.user!.email })
      )
    }
    if (error) return res.status(400).json({ error: error.message })
    res.json(fromRow(data, { id: req.user!.id, email: req.user!.email }))
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
