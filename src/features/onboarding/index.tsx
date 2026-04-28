import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  PartyPopper,
  Upload,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { parseMT5Html } from '@/lib/mt5-import'
import { useAccountsStore } from '@/stores/accounts-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  useProfileStore,
  type ExperienceLevel,
} from '@/stores/profile-store'
import { useTradesStore } from '@/stores/trades-store'
import { cn } from '@/lib/utils'
import { AuthLayout } from '@/features/auth/auth-layout'
import { PAIRS } from '@/features/trades/data/schema'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

type Mt5Preview = ReturnType<typeof parseMT5Html> | null

const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Please enter a display name.')
    .max(40, 'Keep it under 40 characters.'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Pick a pair you trade most.'),
  startingCapital: z.coerce
    .number({ message: 'Enter a number.' })
    .min(0, 'Cannot be negative.'),
})

type ProfileValues = z.infer<typeof profileSchema>

const STEPS = [
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'upload', label: 'Import trades', icon: Upload },
  { key: 'done', label: 'Finish', icon: PartyPopper },
] as const

export function Onboarding() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const setProfile = useProfileStore((s) => s.setProfile)
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding)
  const addTradesForAccount = useTradesStore((s) => s.addTradesForAccount)
  const upsertFromImport = useAccountsStore((s) => s.upsertFromImport)

  const [stepIndex, setStepIndex] = useState(0)
  const [savedProfile, setSavedProfile] = useState<ProfileValues | null>(null)

  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Mt5Preview>(null)
  const [parsing, setParsing] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      experience: 'intermediate',
      preferredPair: 'EUR/USD',
      startingCapital: 10000,
    },
  })

  const sortedPairs = useMemo(() => [...PAIRS].sort(), [])

  function goNext() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }
  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function handleProfileSubmit(values: ProfileValues) {
    setSavedProfile(values)
    setProfile({
      email: auth.user?.email ?? '',
      displayName: values.displayName,
      experience: values.experience as ExperienceLevel,
      preferredPair: values.preferredPair,
      startingCapital: values.startingCapital,
    })
    toast.success('Profile saved.')
    goNext()
  }

  const decodeMT5File = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2))
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2))
    }
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3))
    }
    if (bytes.length > 64) {
      let zeros = 0
      for (let i = 1; i < 64; i += 2) if (bytes[i] === 0) zeros++
      if (zeros > 24) {
        return new TextDecoder('utf-16le').decode(bytes)
      }
    }
    return new TextDecoder('utf-8').decode(bytes)
  }

  async function handleHtml(file: File | null) {
    setHtmlFile(file)
    setPreview(null)
    if (!file) return
    setParsing(true)
    try {
      const text = await decodeMT5File(file)
      const result = parseMT5Html(text)
      setPreview(result)
      if (result.trades.length === 0) {
        toast.warning(
          'No trades were found in this HTML file. Make sure you exported the "Detailed Report" or "History" from MT5.'
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not read this HTML file.'
      )
    } finally {
      setParsing(false)
    }
  }

  function handleImportAndContinue() {
    if (!preview || preview.trades.length === 0) {
      toast.error('Pick a valid MT5 HTML file first.')
      return
    }
    const accountId = upsertFromImport({
      broker: preview.broker,
      number: preview.account,
      nameHint: preview.account
        ? `${preview.broker ?? 'MT5'} ${preview.account}`
        : preview.broker,
    })
    const accountName =
      useAccountsStore.getState().accounts.find((a) => a.id === accountId)
        ?.name ?? 'MT5 Import'
    const result = addTradesForAccount(
      accountId,
      accountName,
      preview.trades
    )
    setImportedCount(result.added)
    if (result.duplicates > 0) {
      toast.success(
        `Imported ${result.added} trade${result.added === 1 ? '' : 's'} (${result.duplicates} duplicate${result.duplicates === 1 ? '' : 's'} skipped).`
      )
    } else {
      toast.success(
        `Imported ${result.added} trade${result.added === 1 ? '' : 's'} into "${accountName}".`
      )
    }
    goNext()
  }

  function handleSkipUpload() {
    setImportedCount(0)
    goNext()
  }

  function handleFinish() {
    completeOnboarding()
    navigate({ to: '/', replace: true })
  }

  const currentStep = STEPS[stepIndex]

  return (
    <AuthLayout>
      <Card className='w-full max-w-xl gap-4'>
        <CardHeader>
          <Stepper activeIndex={stepIndex} />
          <CardTitle className='mt-4 text-lg tracking-tight'>
            {currentStep.key === 'profile' && 'Set up your trader profile'}
            {currentStep.key === 'upload' && 'Import your MT5 history'}
            {currentStep.key === 'done' && "You're all set"}
          </CardTitle>
          <CardDescription>
            {currentStep.key === 'profile' &&
              'Tell us a little about how you trade so we can tailor the journal.'}
            {currentStep.key === 'upload' &&
              'Drop in the HTML report from MetaTrader 5 to seed your journal with real trades.'}
            {currentStep.key === 'done' &&
              'Your account is ready. Jump into the dashboard to see your trades, stats, and analytics.'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {currentStep.key === 'profile' && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleProfileSubmit)}
                className='grid gap-4'
              >
                <FormField
                  control={form.control}
                  name='displayName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Alex Morgan' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='experience'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select level' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='beginner'>
                              Beginner (&lt; 1 yr)
                            </SelectItem>
                            <SelectItem value='intermediate'>
                              Intermediate (1-3 yrs)
                            </SelectItem>
                            <SelectItem value='advanced'>
                              Advanced (3-5 yrs)
                            </SelectItem>
                            <SelectItem value='pro'>
                              Professional (5+ yrs)
                            </SelectItem>
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select pair' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className='max-h-60'>
                            {sortedPairs.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='startingCapital'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting capital (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          inputMode='decimal'
                          min={0}
                          step={100}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex items-center justify-between pt-2'>
                  <span className='text-xs text-muted-foreground'>
                    Step 1 of {STEPS.length}
                  </span>
                  <Button type='submit'>
                    Continue
                    <ArrowRight className='size-4' />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep.key === 'upload' && (
            <div className='space-y-4'>
              <div className='rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground'>
                In MT5, open <strong>Toolbox &rarr; History</strong>, right-click
                and choose <strong>Report &rarr; HTML (Detailed)</strong>. Drop
                the saved file below.
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='onboarding-mt5-html'>
                  MT5 statement (.htm or .html)
                </Label>
                <Input
                  id='onboarding-mt5-html'
                  type='file'
                  accept='.htm,.html,text/html'
                  className='h-9 py-1.5'
                  onChange={(e) => handleHtml(e.target.files?.[0] ?? null)}
                />
              </div>

              {parsing && (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='size-4 animate-spin' />
                  Parsing your statement...
                </div>
              )}

              {!parsing && htmlFile && preview && (
                <div className='rounded-md border p-3 text-sm'>
                  <div className='mb-2 flex items-center gap-2 font-medium'>
                    <FileText className='size-4' />
                    {htmlFile.name}
                  </div>
                  <div className='grid grid-cols-2 gap-y-1 text-xs text-muted-foreground'>
                    <span>Trades detected</span>
                    <span className='text-end font-semibold tabular-nums text-emerald-600'>
                      {preview.trades.length}
                    </span>
                    <span>Skipped (non-trade rows)</span>
                    <span className='text-end tabular-nums text-foreground'>
                      {preview.skipped}
                    </span>
                    {preview.account && (
                      <>
                        <span>Account</span>
                        <span className='text-end text-foreground'>
                          {preview.account}
                        </span>
                      </>
                    )}
                    {preview.broker && (
                      <>
                        <span>Broker</span>
                        <span className='text-end text-foreground'>
                          {preview.broker}
                        </span>
                      </>
                    )}
                  </div>

                  {preview.trades.length > 0 && (
                    <div className='mt-3 max-h-40 overflow-y-auto rounded border'>
                      <table className='w-full text-xs'>
                        <thead className='bg-muted text-muted-foreground'>
                          <tr>
                            <th className='px-2 py-1 text-start'>Pair</th>
                            <th className='px-2 py-1 text-start'>Side</th>
                            <th className='px-2 py-1 text-end'>Lots</th>
                            <th className='px-2 py-1 text-end'>P&amp;L</th>
                            <th className='px-2 py-1 text-end'>Closed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.trades.slice(0, 6).map((t) => (
                            <tr key={t.id} className='border-t'>
                              <td className='px-2 py-1 font-medium'>
                                {t.pair}
                              </td>
                              <td className='px-2 py-1 capitalize'>
                                {t.direction}
                              </td>
                              <td className='px-2 py-1 text-end tabular-nums'>
                                {t.lotSize.toFixed(2)}
                              </td>
                              <td
                                className={cn(
                                  'px-2 py-1 text-end font-semibold tabular-nums',
                                  t.pnl >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                )}
                              >
                                {t.pnl >= 0 ? '+' : ''}
                                {t.pnl.toFixed(2)}
                              </td>
                              <td className='px-2 py-1 text-end text-muted-foreground'>
                                {t.closedAt.toISOString().slice(0, 10)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.trades.length > 6 && (
                        <div className='border-t bg-muted/30 px-2 py-1 text-center text-xs text-muted-foreground'>
                          + {preview.trades.length - 6} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className='flex items-center justify-between pt-2'>
                <Button type='button' variant='ghost' onClick={goBack}>
                  <ArrowLeft className='size-4' />
                  Back
                </Button>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleSkipUpload}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type='button'
                    onClick={handleImportAndContinue}
                    disabled={
                      !preview || preview.trades.length === 0 || parsing
                    }
                  >
                    <Upload className='size-4' />
                    Import {preview?.trades.length ?? 0} &amp; continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep.key === 'done' && (
            <div className='space-y-4'>
              <div className='flex flex-col items-center gap-3 rounded-md border bg-muted/30 p-6 text-center'>
                <div className='flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600'>
                  <CheckCircle2 className='size-7' />
                </div>
                <div>
                  <p className='font-medium'>
                    Welcome aboard
                    {savedProfile?.displayName
                      ? `, ${savedProfile.displayName}`
                      : ''}
                    .
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {importedCount > 0
                      ? `${importedCount} trade${importedCount === 1 ? '' : 's'} imported. Your dashboard is ready.`
                      : 'You can import an MT5 report any time from the Trade Journal.'}
                  </p>
                </div>
              </div>

              {savedProfile && (
                <div className='rounded-md border p-3 text-sm'>
                  <div className='mb-2 font-medium'>Profile summary</div>
                  <div className='grid grid-cols-2 gap-y-1 text-xs text-muted-foreground'>
                    <span>Display name</span>
                    <span className='text-end text-foreground'>
                      {savedProfile.displayName}
                    </span>
                    <span>Experience</span>
                    <span className='text-end capitalize text-foreground'>
                      {savedProfile.experience}
                    </span>
                    <span>Preferred pair</span>
                    <span className='text-end text-foreground'>
                      {savedProfile.preferredPair}
                    </span>
                    <span>Starting capital</span>
                    <span className='text-end tabular-nums text-foreground'>
                      ${savedProfile.startingCapital.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-between pt-2'>
                <Button type='button' variant='ghost' onClick={goBack}>
                  <ArrowLeft className='size-4' />
                  Back
                </Button>
                <Button type='button' onClick={handleFinish}>
                  Go to dashboard
                  <ArrowRight className='size-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

function Stepper({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className='flex items-center gap-2'>
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i === activeIndex
        const isComplete = i < activeIndex
        return (
          <li
            key={step.key}
            className='flex flex-1 items-center gap-2'
            aria-current={isActive ? 'step' : undefined}
          >
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                isComplete &&
                  'border-emerald-500 bg-emerald-500 text-emerald-foreground',
                isActive && 'border-primary bg-primary text-primary-foreground',
                !isActive &&
                  !isComplete &&
                  'border-border bg-muted text-muted-foreground'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className='size-4' />
              ) : (
                <Icon className='size-4' />
              )}
            </div>
            <span
              className={cn(
                'truncate text-xs font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 transition-colors',
                  isComplete ? 'bg-emerald-500' : 'bg-border'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
