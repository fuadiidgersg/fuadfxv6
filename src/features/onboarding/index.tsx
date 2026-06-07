import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileStore } from '@/stores/profile-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'

const schema = z.object({
  displayName: z.string().min(1, 'Required'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Required'),
  startingCapital: z.coerce.number().min(1, 'Must be greater than 0'),
})

type FormData = z.infer<typeof schema>

export default function Onboarding() {
  const navigate = useNavigate()
  const setProfile = useProfileStore((s) => s.setProfile)
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding)
  const user = useAuthStore((s) => s.auth.user)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      displayName: user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '',
      experience: 'beginner',
      preferredPair: '',
      startingCapital: 10000,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      setProfile({
        email: user?.email ?? '',
        displayName: data.displayName,
        experience: data.experience,
        preferredPair: data.preferredPair,
        startingCapital: data.startingCapital,
      })
      completeOnboarding()
      toast.success('Welcome to FUADFX! Your profile is set up.')
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto w-full max-w-md space-y-6 py-8'>
        <div className='space-y-1 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Welcome to FUADFX
          </h1>
          <p className='text-sm text-muted-foreground'>
            Set your trading profile, then import your statement or log your
            first trade.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='displayName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter your name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='experience'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trading Experience</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    isControlled
                    onValueChange={(val: string) => field.onChange(val)}
                    items={[
                      { label: 'Beginner', value: 'beginner' },
                      { label: 'Intermediate', value: 'intermediate' },
                      { label: 'Advanced', value: 'advanced' },
                      { label: 'Pro', value: 'pro' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='preferredPair'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Pair</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. EURUSD' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='startingCapital'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Capital ($)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      placeholder='1000'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading && <Loader2 className='animate-spin' />}
              Create profile
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
