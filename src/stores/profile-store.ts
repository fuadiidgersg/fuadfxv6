import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro'

export type Profile = {
  email: string
  displayName: string
  experience: ExperienceLevel
  preferredPair: string
  startingCapital: number
  onboardedAt?: string
}

type ProfileState = {
  profile: Profile | null
  onboardingComplete: boolean
  setProfile: (profile: Profile) => void
  completeOnboarding: () => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      onboardingComplete: false,
      setProfile: (profile) => set({ profile }),
      completeOnboarding: () =>
        set((state) => ({
          onboardingComplete: true,
          profile: state.profile
            ? { ...state.profile, onboardedAt: new Date().toISOString() }
            : state.profile,
        })),
      reset: () => set({ profile: null, onboardingComplete: false }),
    }),
    { name: 'forex-journal-profile' }
  )
)
