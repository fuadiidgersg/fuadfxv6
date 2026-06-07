import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  useTradingSettings,
  TIMEZONES,
  type CurrencySymbol,
} from '@/stores/trading-settings-store'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { STRATEGIES } from '@/features/trades/data/schema'
import { ContentSection } from '../components/content-section'

const schema = z.object({
  timezone: z.string().min(1),
  currencySymbol: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']),
  defaultRiskPct: z.coerce.number().min(0.1).max(100),
  ftmoMode: z.boolean(),
  ftmoAccountSize: z.coerce.number().min(1000),
  ftmoDailyLossLimitPct: z.coerce.number().min(0.1).max(100),
  ftmoMaxDrawdownPct: z.coerce.number().min(0.1).max(100),
  ftmoProfitTargetPct: z.coerce.number().min(0.1).max(100),
  weeklyTargetUsd: z.coerce.number().min(0),
  monthlyTargetUsd: z.coerce.number().min(0),
  dailyLossLimitUsd: z.coerce.number().min(0),
  autoAssignImportedStrategy: z.boolean(),
  importedTradeStrategy: z.enum(STRATEGIES),
})

type FormValues = z.infer<typeof schema>

export function SettingsTrading() {
  const settings = useTradingSettings()

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      timezone: settings.timezone,
      currencySymbol: settings.currencySymbol,
      defaultRiskPct: settings.defaultRiskPct,
      ftmoMode: settings.ftmoMode,
      ftmoAccountSize: settings.ftmoAccountSize,
      ftmoDailyLossLimitPct: settings.ftmoDailyLossLimitPct,
      ftmoMaxDrawdownPct: settings.ftmoMaxDrawdownPct,
      ftmoProfitTargetPct: settings.ftmoProfitTargetPct,
      weeklyTargetUsd: settings.weeklyTargetUsd,
      monthlyTargetUsd: settings.monthlyTargetUsd,
      dailyLossLimitUsd: settings.dailyLossLimitUsd,
      autoAssignImportedStrategy: settings.autoAssignImportedStrategy,
      importedTradeStrategy:
        settings.importedTradeStrategy as (typeof STRATEGIES)[number],
    },
  })

  const ftmoMode = form.watch('ftmoMode')
  const autoAssignImportedStrategy = form.watch('autoAssignImportedStrategy')

  function onSubmit(values: FormValues) {
    settings.setTimezone(values.timezone)
    settings.setCurrencySymbol(values.currencySymbol as CurrencySymbol)
    settings.setDefaultRiskPct(values.defaultRiskPct)
    settings.setFtmoMode(values.ftmoMode)
    settings.setFtmoAccountSize(values.ftmoAccountSize)
    settings.setFtmoDailyLossLimitPct(values.ftmoDailyLossLimitPct)
    settings.setFtmoMaxDrawdownPct(values.ftmoMaxDrawdownPct)
    settings.setFtmoProfitTargetPct(values.ftmoProfitTargetPct)
    settings.setWeeklyTargetUsd(values.weeklyTargetUsd)
    settings.setMonthlyTargetUsd(values.monthlyTargetUsd)
    settings.setDailyLossLimitUsd(values.dailyLossLimitUsd)
    settings.setAutoAssignImportedStrategy(values.autoAssignImportedStrategy)
    settings.setImportedTradeStrategy(values.importedTradeStrategy)
    toast.success('Trading settings saved.')
  }

  return (
    <ContentSection
      title='Trading Settings'
      desc='Configure your timezone, currency, risk parameters, and performance targets.'
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Timezone */}
          <FormField
            control={form.control}
            name='timezone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account / Broker Timezone</FormLabel>
                <FormDescription>
                  Used for session labels (London, NY, Tokyo) and hour-of-day
                  analytics. Set this to your broker's server time zone.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className='w-full max-w-sm'>
                      <SelectValue placeholder='Select timezone' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className='max-h-64'>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name='currencySymbol'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Currency</FormLabel>
                <FormDescription>
                  The currency your P&L is denominated in.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      [
                        'USD',
                        'EUR',
                        'GBP',
                        'JPY',
                        'AUD',
                        'CAD',
                        'CHF',
                      ] as CurrencySymbol[]
                    ).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Default Risk % */}
          <FormField
            control={form.control}
            name='defaultRiskPct'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Risk Per Trade (%)</FormLabel>
                <FormDescription>
                  Pre-filled when logging a new trade. Typically 0.5–2%.
                </FormDescription>
                <FormControl>
                  <Input
                    type='number'
                    step='0.1'
                    min='0.1'
                    max='100'
                    className='w-32'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='autoAssignImportedStrategy'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <div>
                    <FormLabel className='text-base'>
                      Auto-assign Strategy on Imports
                    </FormLabel>
                    <FormDescription>
                      MT5 statements do not include your playbook. Keep this off
                      to import trades as Unassigned, or turn it on to tag every
                      imported trade with one default strategy.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {autoAssignImportedStrategy && (
              <FormField
                control={form.control}
                name='importedTradeStrategy'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imported Trade Strategy</FormLabel>
                    <FormDescription>
                      Applied only when auto-assignment is enabled.
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full max-w-sm'>
                          <SelectValue placeholder='Select strategy' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STRATEGIES.map((strategy) => (
                          <SelectItem key={strategy} value={strategy}>
                            {strategy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* Goals */}
          <div className='space-y-4'>
            <div>
              <h4 className='text-sm font-semibold'>Performance Goals</h4>
              <p className='text-xs text-muted-foreground'>
                Set targets to track progress on the dashboard.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <FormField
                control={form.control}
                name='dailyLossLimitUsd'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Loss Limit ($)</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormDescription className='text-[11px]'>
                      0 = no limit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='weeklyTargetUsd'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Target ($)</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormDescription className='text-[11px]'>
                      0 = no target
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='monthlyTargetUsd'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Target ($)</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormDescription className='text-[11px]'>
                      0 = no target
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* FTMO Mode */}
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='ftmoMode'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <div>
                    <FormLabel className='text-base'>
                      Prop Firm / FTMO Mode
                    </FormLabel>
                    <FormDescription>
                      Track your account against funded account challenge rules.
                      Shows a compliance tracker on the Risk analytics tab.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {ftmoMode && (
              <div className='space-y-4 rounded-lg border p-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Prop Firm Rules
                </p>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='ftmoAccountSize'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Size ($)</FormLabel>
                        <FormControl>
                          <Input type='number' min='1000' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='ftmoProfitTargetPct'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profit Target (%)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0.1'
                            step='0.1'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className='text-[11px]'>
                          FTMO: 10%
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='ftmoDailyLossLimitPct'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Loss Limit (%)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0.1'
                            step='0.1'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className='text-[11px]'>
                          FTMO: 5%
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='ftmoMaxDrawdownPct'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Drawdown (%)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0.1'
                            step='0.1'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className='text-[11px]'>
                          FTMO: 10%
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type='submit'>Save settings</Button>
        </form>
      </Form>
    </ContentSection>
  )
}
