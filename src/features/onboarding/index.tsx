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
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3))
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
        toast.warning('No trades found in file.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'File error')
    } finally {
      setParsing(false)
    }
  }

  function handleImportAndContinue() {
    if (!preview || preview.trades.length === 0) {
      toast.error('Invalid file')
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

    const result = addTradesForAccount(accountId, accountName, preview.trades)

    setImportedCount(result.added)

    toast.success(`Imported ${result.added} trades`)

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
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{currentStep.label}</CardTitle>
          <CardDescription>Onboarding step</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {currentStep.key === 'profile' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">

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

                <FormField
                  control={form.control}
                  name="startingCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capital</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">
                  Continue <ArrowRight />
                </Button>

              </form>
            </Form>
          )}

          {currentStep.key === 'upload' && (
            <div className="space-y-4">
              <Input type="file" onChange={(e) => handleHtml(e.target.files?.[0] ?? null)} />

              <Button onClick={handleImportAndContinue}>
                Import & Continue
              </Button>

              <Button variant="outline" onClick={handleSkipUpload}>
                Skip
              </Button>
            </div>
          )}

          {currentStep.key === 'done' && (
            <div className="space-y-4">
              <p>Setup complete</p>

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
