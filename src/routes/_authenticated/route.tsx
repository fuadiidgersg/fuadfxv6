import { createFileRoute, redirect } from '@tanstack/react-router'
import { useProfileStore } from '@/stores/profile-store'
import { getSession } from '@/lib/supabase/auth'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    const { isOnboardedForUser } = useProfileStore.getState()
    if (!isOnboardedForUser(session.user.id)) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: AuthenticatedLayout,
})
