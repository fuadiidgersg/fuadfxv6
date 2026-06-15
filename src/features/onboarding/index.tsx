import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bot, Loader2, Upload, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccountsStore,
  type AccountCurrency,
  type AccountType,
} from '@/stores/accounts-store'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileStore } from '@/stores/profile-store'
import { getApiErrorMessage } from '@/lib/api'
import { useCreateAccount } from '@/hooks/use-accounts-query'
import { useUpdateProfile } from '@/hooks/use-profile-query'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectDropdown } from '@/components/select-dropdown'
import { TasksImportDialog } from '@/features/tasks/components/tasks-import-dialog'

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
  const profile = useProfileStore((s) => s.profile)
  const setActiveAccount = useAccountsStore((s) => s.setActive)
  const createAccount = useCreateAccount()
  const updateProfile = useUpdateProfile()

  const [step, setStep] = useState<'profile' | 'account'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [broker, setBroker] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('live')
  const [currency, setCurrency] = useState<AccountCurrency>('USD')
  const [startingBalance, setStartingBalance] = useState('10000')

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      displayName:
        user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '',
      experience: 'beginner',
      preferredPair: '',
      startingCapital: 10000,
    },
  })

  const finishSetup = async () => {
    const onboardedAt = new Date().toISOString()
    const nextProfile = {
      ...profile,
      userId: user?.id,
      email: profile?.email ?? user?.email ?? '',
      displayName:
        profile?.displayName ??
        user?.user_metadata?.full_name ??
        user?.email?.split('@')[0] ??
        '',
      experience: profile?.experience ?? 'beginner',
      preferredPair: profile?.preferredPair ?? 'EUR/USD',
      startingCapital: profile?.startingCapital ?? Number(startingBalance) ?? 0,
      onboardingComplete: true,
      onboardedAt,
    }

    try {
      await updateProfile.mutateAsync({ profile: nextProfile })
      setProfile(nextProfile)
      completeOnboarding(onboardedAt)
      toast.success('Welcome to FUADFX. Your account is ready.')
      navigate({ to: '/dashboard' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save onboarding.'))
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      setProfile({
        userId: user?.id,
        email: user?.email ?? '',
        displayName: data.displayName,
        experience: data.experience,
        preferredPair: data.preferredPair,
        startingCapital: data.startingCapital,
      })
      setStartingBalance(String(data.startingCapital))
      if (!accountName) setAccountName(`${data.displayName}'s MT5`)
      setStep('account')
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!accountName.trim() || !broker.trim()) {
      toast.error('Enter an account name and broker.')
      return
    }

    try {
      const account = await createAccount.mutateAsync({
        name: accountName.trim(),
        broker: broker.trim(),
        number: accountNumber.trim() || '-',
        type: accountType,
        currency,
        startingBalance: Number(startingBalance) || 0,
      })
      setActiveAccount(account.id)
      await finishSetup()
    } catch {
      toast.error('Failed to create account. Please try again.')
    }
  }

  return (
    <div className='container grid min-h-svh max-w-none items-center justify-center'>
      <div className='mx-auto w-full max-w-2xl space-y-6 py-8'>
        <div className='space-y-1 text-center'>
          <div className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
            Step {step === 'profile' ? '1' : '2'} of 2
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {step === 'profile'
              ? 'Set up your trader profile'
              : 'Connect your first trading account'}
          </h1>
          <p className='mx-auto max-w-xl text-sm text-muted-foreground'>
            {step === 'profile'
              ? 'Tell FUADFX how you trade so the journal can organize your reviews around your account and preferred market.'
              : 'Create your account, then choose EA sync for ongoing closed trades or manual upload for bulk history.'}
          </p>
        </div>

        {step === 'profile' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                        placeholder='10000'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading && <Loader2 className='animate-spin' />}
                Continue
              </Button>
            </form>
          </Form>
        ) : (
          <div className='space-y-5'>
            <div className='grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 font-medium'>
                  <Bot className='size-4' />
                  Choose your MT5 sync method
                </div>
                <p className='text-sm text-muted-foreground'>
                  Use the Expert Advisor for ongoing closed-trade sync, or bulk
                  upload an MT5 detailed report to import trading history now.
                </p>
              </div>
              <Button onClick={() => setImportOpen(true)}>
                <Upload className='size-4' />
                Connect or upload
              </Button>
            </div>

            <div className='relative text-center text-xs tracking-wide text-muted-foreground uppercase before:absolute before:top-1/2 before:left-0 before:h-px before:w-[42%] before:bg-border after:absolute after:top-1/2 after:right-0 after:h-px after:w-[42%] after:bg-border'>
              Or
            </div>

            <div className='space-y-4 rounded-lg border bg-card p-4'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 font-medium'>
                  <Wallet className='size-4' />
                  Create account manually
                </div>
                <p className='text-sm text-muted-foreground'>
                  Use this if you want to add the account now and upload or log
                  trades later.
                </p>
              </div>

              <div className='grid gap-3'>
                <div className='grid gap-1.5'>
                  <Label htmlFor='onboarding-account-name'>Account name</Label>
                  <Input
                    id='onboarding-account-name'
                    placeholder='e.g. FTMO 100k Challenge'
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='grid gap-1.5'>
                    <Label htmlFor='onboarding-broker'>Broker</Label>
                    <Input
                      id='onboarding-broker'
                      placeholder='IC Markets, FTMO, OANDA'
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                    />
                  </div>
                  <div className='grid gap-1.5'>
                    <Label htmlFor='onboarding-account-number'>
                      Account number
                    </Label>
                    <Input
                      id='onboarding-account-number'
                      placeholder='Optional'
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='grid gap-1.5'>
                    <Label>Type</Label>
                    <Select
                      value={accountType}
                      onValueChange={(v) => setAccountType(v as AccountType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='live'>Live</SelectItem>
                        <SelectItem value='demo'>Demo</SelectItem>
                        <SelectItem value='prop'>Prop firm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-1.5'>
                    <Label>Currency</Label>
                    <Select
                      value={currency}
                      onValueChange={(v) => setCurrency(v as AccountCurrency)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='USD'>USD</SelectItem>
                        <SelectItem value='EUR'>EUR</SelectItem>
                        <SelectItem value='GBP'>GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-1.5'>
                    <Label htmlFor='onboarding-starting-balance'>
                      Starting balance
                    </Label>
                    <Input
                      id='onboarding-starting-balance'
                      type='number'
                      inputMode='decimal'
                      min={0}
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap justify-between gap-2 pt-1'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep('profile')}
                >
                  <ArrowLeft className='size-4' />
                  Back
                </Button>
                <Button
                  type='button'
                  onClick={handleCreateAccount}
                  disabled={createAccount.isPending}
                >
                  {createAccount.isPending ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Wallet className='size-4' />
                  )}
                  {createAccount.isPending ? 'Creating...' : 'Create account'}
                </Button>
              </div>
            </div>

            <TasksImportDialog
              open={importOpen}
              onOpenChange={setImportOpen}
              onImported={finishSetup}
            />
          </div>
        )}
      </div>
    </div>
  )
}
