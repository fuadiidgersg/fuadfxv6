import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro'

export type Profile = {
  userId?: string
  email: string
  displayName: string
  experience: ExperienceLevel
  preferredPair: string
  startingCapital: number
  avatarUrl?: string
  onboardedAt?: string
}

type ProfileState = {
  profile: Profile | null
  onboardingComplete: boolean
  isOnboardedForUser: (userId: string | undefined | null) => boolean
  setProfile: (profile: Profile) => void
  completeOnboarding: (onboardedAt?: string | null) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get): ProfileState => ({
      profile: null,
      onboardingComplete: false,
      isOnboardedForUser: (userId) =>
        Boolean(
          userId && get().onboardingComplete && get().profile?.userId === userId
        ),
      setProfile: (profile) => set({ profile }),
      completeOnboarding: (onboardedAt) =>
        set((state) => ({
          onboardingComplete: true,
          profile: state.profile
            ? {
                ...state.profile,
                onboardedAt: onboardedAt ?? new Date().toISOString(),
              }
            : state.profile,
        })),
      reset: () => set({ profile: null, onboardingComplete: false }),
    }),
    { name: 'forex-journal-profile' }
  )
)
