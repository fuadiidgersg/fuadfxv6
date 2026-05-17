import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useProfileStore } from '@/stores/profile-store'

export function AuthCallback() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          navigate({ to: '/sign-in', replace: true })
          return
        }

        const { onboardingComplete } = useProfileStore.getState()
        if (!onboardingComplete) {
          navigate({ to: '/onboarding', replace: true })
        } else {
          navigate({ to: '/', replace: true })
        }
      } catch {
        navigate({ to: '/sign-in', replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col items-center gap-3'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>Signing you in…</p>
      </div>
    </div>
  )
}
