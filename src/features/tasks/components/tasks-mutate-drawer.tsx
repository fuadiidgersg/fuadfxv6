import { useRef, useState } from 'react'
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

const formSchema = z.object({
  pair: z.string().min(1),
  direction: z.enum(['long', 'short']),
  strategy: z.string().min(1),
  session: z.string().min(1),
  timeframe: z.string().optional(),
  emotion: z.string().optional(),
  entry: z.number(),
  exit: z.number(),
  lotSize: z.number().positive(),
  pnl: z.number(),
  riskAmount: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
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
  const [preview, setPreview] = useState<string | undefined>(
    currentRow?.screenshotUrl
  )

  const account = useActiveAccount()
  const addTradesForAccount = useTradesStore((s) => s.addTradesForAccount)

  // ✅ FIXED: fully typed RHF (this removes ALL TS2322 errors)
  const form = useForm<TradeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pair: currentRow?.pair ?? '',
      direction: (currentRow?.direction as any) ?? 'long',
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

  const onSubmit = (data: TradeForm) => {
    if (!account) {
      toast.error('Add a trading account first.')
      return
    }

    if (isUpdate && currentRow) {
      const updated = useTradesStore.getState().trades.map((t) =>
        t.id === currentRow.id
          ? buildTradeFromForm(data, account.id, account.name, currentRow)
          : t
      )
      useTradesStore.setState({ trades: updated })
      toast.success('Trade updated.')
    } else {
      const trade = buildTradeFromForm(data, account.id, account.name)
      addTradesForAccount(account.id, account.name, [trade])
      toast.success('Trade saved.')
    }

    onOpenChange(false)
    form.reset()
    setPreview(undefined)
  }

  const handleFile = (file: File) => {
    if (!file) return
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
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isUpdate ? 'Update' : 'Log'} Trade</SheetTitle>
          <SheetDescription>
            Fill in your trade details below.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='trade-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-4'
          >
            {/* Pair */}
            <FormField
              control={form.control}
              name='pair'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pair</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select pair'
                    items={PAIRS.map((p) => ({ label: p, value: p }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Direction FIXED */}
            <FormField
              control={form.control}
              name='direction'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className='flex gap-4'
                  >
                    <RadioGroupItem value='long' /> Long
                    <RadioGroupItem value='short' /> Short
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry / Exit FIXED numeric */}
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='entry'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='exit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* PnL FIXED */}
            <FormField
              control={form.control}
              name='pnl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>P&L</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Screenshot */}
            <div>
              <input
                ref={fileInputRef}
                type='file'
                className='hidden'
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />

              {preview ? (
                <div className='relative'>
                  <img src={preview} className='rounded-md' />
                  <Button
                    type='button'
                    onClick={() => {
                      setPreview(undefined)
                      form.setValue('screenshotUrl', '')
                    }}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <Button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus /> Upload
                </Button>
              )}
            </div>
          </form>
        </Form>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button form='trade-form' type='submit'>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
