import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveAccount } from '@/stores/accounts-store'
import { useTradesStore } from '@/stores/trades-store'
import {
  EMOTIONS,
  PAIRS,
  SESSIONS,
  STRATEGIES,
  TIMEFRAMES,
  type Trade,
  type TradeDirection,
  type TradeStrategy,
  type TradeSession,
  type TradeStatus,
  type TradeTimeframe,
  type TradeEmotion,
} from '@/features/trades/data/schema'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'

type TradeMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Trade
}

const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v)

const formSchema = z.object({
  pair: z.string().min(1),
  direction: z.string().min(1),
  strategy: z.string().min(1),
  session: z.string().min(1),
  timeframe: z.string().optional(),
  emotion: z.string().optional(),

  entry: z.coerce.number(),
  exit: z.coerce.number(),
  lotSize: z.coerce.number().positive(),
  pnl: z.coerce.number(),

  riskAmount: z.coerce.number().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),

  notes: z.string().optional(),
  mistakes: z.string().optional(),
  lessons: z.string().optional(),
  screenshotUrl: z.string().optional(),
})

type TradeForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TradeMutateDrawerProps) {
  const isUpdate = !!currentRow
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | undefined>(undefined)

  const account = useActiveAccount()
  const addTradesForAccount = useTradesStore((s) => s.addTradesForAccount)

  const form = useForm<TradeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pair: currentRow?.pair ?? '',
      direction: currentRow?.direction ?? '',
      strategy: currentRow?.strategy ?? '',
      session: currentRow?.session ?? '',
      timeframe: currentRow?.timeframe ?? '',
      emotion: currentRow?.emotion ?? '',
      entry: currentRow?.entry ?? 0,
      exit: currentRow?.exit ?? 0,
      lotSize: currentRow?.lotSize ?? 0.1,
      pnl: currentRow?.pnl ?? 0,
      riskAmount: currentRow?.riskAmount ?? undefined,
      stopLoss: currentRow?.stopLoss ?? undefined,
      takeProfit: currentRow?.takeProfit ?? undefined,
      notes: currentRow?.notes ?? '',
      mistakes: currentRow?.mistakes ?? '',
      lessons: currentRow?.lessons ?? '',
      screenshotUrl: currentRow?.screenshotUrl ?? '',
    },
  })

  // FIX: safe sync instead of useState hack (removes re-render loop bug)
  useEffect(() => {
    if (!currentRow) return

    form.reset({
      pair: currentRow.pair,
      direction: currentRow.direction,
      strategy: currentRow.strategy,
      session: currentRow.session,
      timeframe: currentRow.timeframe ?? '',
      emotion: currentRow.emotion ?? '',
      entry: currentRow.entry,
      exit: currentRow.exit,
      lotSize: currentRow.lotSize,
      pnl: currentRow.pnl,
      riskAmount: currentRow.riskAmount,
      stopLoss: currentRow.stopLoss,
      takeProfit: currentRow.takeProfit,
      notes: currentRow.notes ?? '',
      mistakes: currentRow.mistakes ?? '',
      lessons: currentRow.lessons ?? '',
      screenshotUrl: currentRow.screenshotUrl ?? '',
    })

    setPreview(currentRow.screenshotUrl)
  }, [currentRow, form])

  const onSubmit = (data: TradeForm) => {
    if (!account) {
      toast.error('Add account first')
      return
    }

    const trade: Trade = buildTradeFromForm(data, account.id, account.name)

    if (isUpdate && currentRow) {
      const updated = useTradesStore
        .getState()
        .trades.map((t) => (t.id === currentRow.id ? trade : t))

      useTradesStore.setState({ trades: updated })
      toast.success('Trade updated')
    } else {
      addTradesForAccount(account.id, account.name, [trade])
      toast.success('Trade saved')
    }

    onOpenChange(false)
    form.reset()
    setPreview(undefined)
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreview(url)
      form.setValue('screenshotUrl', url)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-xl">

        <SheetHeader>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Trade</SheetTitle>
          <SheetDescription>Log your trade details</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto px-4">

            <FormField
              control={form.control}
              name="entry"
              render={({ field }) => (
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />

            <Button type="submit">Save</Button>

          </form>
        </Form>

      </SheetContent>
    </Sheet>
  )
}
