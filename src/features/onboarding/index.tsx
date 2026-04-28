import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* -------------------- TYPES -------------------- */

const profileSchema = z.object({
  displayName: z.string().min(1).max(40),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1),
  startingCapital: z.number().min(0),
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
  const [preview, setPreview] = useState<any>(null)
  const [parsing, setParsing] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  /* -------------------- FIXED FORM -------------------- */
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      displayName: '',
      experience: 'intermediate',
      preferredPair: 'EUR/USD',
      startingCapital: 10000,
    },
  })

  const sortedPairs = [...PAIRS].sort()

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

    toast.success('Profile saved')
    goNext()
  }

  async function decodeMT5File(file: File) {
    const text = await file.text()
    return text
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
    } catch {
      toast.error('Failed to parse file')
    } finally {
      setParsing(false)
    }
  }

  function handleImportAndContinue() {
    if (!preview?.trades?.length) {
      toast.error('No trades found')
      return
    }

    const accountId = upsertFromImport({
      broker: preview.broker,
      number: preview.account,
      nameHint: preview.broker,
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
    toast.success(`Imported ${result.added} trades`)

    goNext()
  }

  function handleFinish() {
    completeOnboarding()
    navigate({ to: '/', replace: true })
  }

  const step = STEPS[stepIndex]

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{step.label}</CardTitle>
          <CardDescription>
            {step.key === 'profile' &&
              'Set up your trading profile'}
            {step.key === 'upload' &&
              'Import MT5 history'}
            {step.key === 'done' &&
              'You are ready'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step.key === 'profile' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)}>
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">
                  Continue
                </Button>
              </form>
            </Form>
          )}

          {step.key === 'upload' && (
            <div>
              <input
                type="file"
                onChange={(e) =>
                  handleHtml(e.target.files?.[0] ?? null)
                }
              />

              {parsing && <Loader2 className="animate-spin" />}

              {preview && (
                <Button onClick={handleImportAndContinue}>
                  Import
                </Button>
              )}
            </div>
          )}

          {step.key === 'done' && (
            <div>
              <CheckCircle2 />
              <Button onClick={handleFinish}>
                Go to dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
