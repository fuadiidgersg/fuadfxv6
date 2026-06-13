import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/supabase/auth'
import { isServerOnboarded } from '@/hooks/use-profile-query'
import Onboarding from '@/features/onboarding'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    if (await isServerOnboarded(session.user.id)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Onboarding,
})
