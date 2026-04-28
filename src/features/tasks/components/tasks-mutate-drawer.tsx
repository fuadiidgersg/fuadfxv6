import type { Resolver } from 'react-hook-form'

const resolver: Resolver<TradeForm> = zodResolver(formSchema) as Resolver<TradeForm>

const form = useForm<TradeForm, any, TradeForm>({
  resolver,
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
