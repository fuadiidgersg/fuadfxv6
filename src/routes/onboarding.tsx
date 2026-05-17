import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/supabase/auth'
import { useProfileStore } from '@/stores/profile-store'
import Onboarding from '@/features/onboarding'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    const { onboardingComplete } = useProfileStore.getState()
    if (onboardingComplete) {
      throw redirect({ to: '/' })
    }
  },
  component: Onboarding,
})
