import { createFileRoute, redirect } from '@tanstack/react-router'
import { useProfileStore } from '@/stores/profile-store'
import { getSession } from '@/lib/supabase/auth'
import Onboarding from '@/features/onboarding'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    const { isOnboardedForUser } = useProfileStore.getState()
    if (isOnboardedForUser(session.user.id)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Onboarding,
})
