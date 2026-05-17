import { create } from 'zustand'

export type OnboardingData = {
  displayName: string
  experience: 'beginner' | 'intermediate' | 'advanced' | 'pro'
  preferredPair: string
  startingCapital: number
}

interface OnboardingStore {
  profile: OnboardingData | null
  setProfile: (data: OnboardingData) => void
  clearProfile: () => void
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  profile: null,
  setProfile: (data) => set({ profile: data }),
  clearProfile: () => set({ profile: null }),
}))
