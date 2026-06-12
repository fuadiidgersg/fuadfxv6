import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileStore, type ExperienceLevel } from '@/stores/profile-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.email(),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Preferred pair is required.'),
  startingCapital: z.coerce.number().min(0),
  avatarUrl: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const user = useAuthStore((s) => s.auth.user)
  const profile = useProfileStore((s) => s.profile)
  const setProfile = useProfileStore((s) => s.setProfile)

  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      displayName:
        profile?.displayName ??
        user?.user_metadata?.full_name ??
        user?.email?.split('@')[0] ??
        '',
      email: profile?.email ?? user?.email ?? '',
      experience: profile?.experience ?? 'beginner',
      preferredPair: profile?.preferredPair ?? 'EUR/USD',
      startingCapital: profile?.startingCapital ?? 0,
      avatarUrl: profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? '',
    }),
    [profile, user]
  )

  const form = useForm<ProfileFormValues, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues,
    values: defaultValues,
  })

  function handleAvatar(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 1_500_000) {
      toast.error('Use an image smaller than 1.5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => form.setValue('avatarUrl', String(reader.result))
    reader.readAsDataURL(file)
  }

  function onSubmit(values: ProfileFormValues) {
    setProfile({
      ...profile,
      userId: user?.id,
      email: values.email,
      displayName: values.displayName,
      experience: values.experience as ExperienceLevel,
      preferredPair: values.preferredPair,
      startingCapital: values.startingCapital,
      avatarUrl: values.avatarUrl,
      onboardedAt: profile?.onboardedAt,
    })
    toast.success('Profile updated.')
  }

  const avatarUrl = form.watch('avatarUrl')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex size-20 items-center justify-center overflow-hidden rounded-full border bg-muted'>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt='Profile'
                className='size-full object-cover'
              />
            ) : (
              <UserRound className='size-8 text-muted-foreground' />
            )}
          </div>
          <div className='space-y-2'>
            <FormLabel htmlFor='profile-photo'>Profile picture</FormLabel>
            <Input
              id='profile-photo'
              type='file'
              accept='image/*'
              className='max-w-xs'
              onChange={(e) => handleAvatar(e.target.files?.[0])}
            />
            <p className='text-xs text-muted-foreground'>
              Used in the sidebar and top navigation.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name='displayName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder='Your trader name' {...field} />
              </FormControl>
              <FormDescription>
                This is how your name appears across FUADFX.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' disabled {...field} />
              </FormControl>
              <FormDescription>
                Authentication email comes from your Supabase account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid gap-4 sm:grid-cols-3'>
          <FormField
            control={form.control}
            name='experience'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='beginner'>Beginner</SelectItem>
                    <SelectItem value='intermediate'>Intermediate</SelectItem>
                    <SelectItem value='advanced'>Advanced</SelectItem>
                    <SelectItem value='pro'>Pro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='preferredPair'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred pair</FormLabel>
                <FormControl>
                  <Input placeholder='EUR/USD' {...field} />
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
                <FormLabel>Starting capital</FormLabel>
                <FormControl>
                  <Input type='number' min='0' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type='submit'>
          <Camera className='size-4' />
          Update profile
        </Button>
      </form>
    </Form>
  )
}
