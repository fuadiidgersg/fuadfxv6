import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  useTradingSettings,
  TIMEZONES,
  type CurrencySymbol,
  type NewsImpactFilter,
  type PropFirmTemplate,
} from '@/stores/trading-settings-store'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateInputValue } from '@/lib/platform-time'
import { useUpdateProfile } from '@/hooks/use-profile-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { news } from '@/features/news/data/news'
import { STRATEGIES } from '@/features/trades/data/schema'
import { ContentSection } from '../components/content-section'

const schema = z.object({
  timezone: z.string().min(1),
  platformCountry: z.string(),
  platformDateOverride: z.string(),
  currencySymbol: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']),
  defaultRiskPct: z.coerce.number().min(0.1).max(100),
  ftmoMode: z.boolean(),
  propFirmTemplate: z.enum(['custom', 'ftmo', 'fundednext', 'the5ers', 'e8']),
  ftmoAccountSize: z.coerce.number().min(1000),
  ftmoDailyLossLimitPct: z.coerce.number().min(0.1).max(100),
  ftmoMaxDrawdownPct: z.coerce.number().min(0.1).max(100),
  ftmoProfitTargetPct: z.coerce.number().min(0.1).max(100),
  weeklyTargetUsd: z.coerce.number().min(0),
  monthlyTargetUsd: z.coerce.number().min(0),
  dailyLossLimitUsd: z.coerce.number().min(0),
  autoAssignImportedStrategy: z.boolean(),
  importedTradeStrategy: z.enum(STRATEGIES),
  newsNotificationsEnabled: z.boolean(),
  newsNotificationLeadMinutes: z.coerce.number().min(1).max(240),
  newsFilterCountries: z.array(z.string()),
  newsFilterImpacts: z.array(z.enum(['high', 'medium', 'low'])).min(1),
})

type FormValues = z.infer<typeof schema>

const NEWS_IMPACTS: {
  value: NewsImpactFilter
  label: string
  description: string
}[] = [
  {
    value: 'high',
    label: 'High',
    description: 'Rate decisions, CPI, NFP, GDP and major central-bank events.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Speeches, secondary inflation, employment and activity data.',
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Low-volatility releases and minor survey data.',
  },
]

const DEFAULT_COUNTRIES = [
  'Australia',
  'Canada',
  'Germany',
  'Japan',
  'Kenya',
  'South Africa',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
]

const PROP_FIRMS: Record<
  Exclude<PropFirmTemplate, 'custom'>,
  {
    label: string
    profitTargetPct: number
    dailyLossLimitPct: number
    maxDrawdownPct: number
  }
> = {
  ftmo: {
    label: 'FTMO',
    profitTargetPct: 10,
    dailyLossLimitPct: 5,
    maxDrawdownPct: 10,
  },
  fundednext: {
    label: 'FundedNext',
    profitTargetPct: 10,
    dailyLossLimitPct: 5,
    maxDrawdownPct: 10,
  },
  the5ers: {
    label: 'The5ers',
    profitTargetPct: 8,
    dailyLossLimitPct: 3,
    maxDrawdownPct: 6,
  },
  e8: {
    label: 'E8 Funding',
    profitTargetPct: 8,
    dailyLossLimitPct: 5,
    maxDrawdownPct: 8,
  },
}

export function SettingsTrading() {
  const settings = useTradingSettings()
  const updateProfile = useUpdateProfile()
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined'
      ? 'unsupported'
      : Notification.permission
  )

  const countries = useMemo(
    () =>
      Array.from(
        new Set([...DEFAULT_COUNTRIES, ...news.map((event) => event.country)])
      ).sort(),
    []
  )

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      timezone: settings.timezone,
      platformCountry: settings.platformCountry,
      platformDateOverride: settings.platformDateOverride,
      currencySymbol: settings.currencySymbol,
      defaultRiskPct: settings.defaultRiskPct,
      ftmoMode: settings.ftmoMode,
      propFirmTemplate: settings.propFirmTemplate,
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
      newsNotificationsEnabled: settings.newsNotificationsEnabled,
      newsNotificationLeadMinutes: settings.newsNotificationLeadMinutes,
      newsFilterCountries: settings.newsFilterCountries,
      newsFilterImpacts: settings.newsFilterImpacts,
    },
  })

  const ftmoMode = form.watch('ftmoMode')
  const autoAssignImportedStrategy = form.watch('autoAssignImportedStrategy')
  const newsNotificationsEnabled = form.watch('newsNotificationsEnabled')

  async function onSubmit(values: FormValues) {
    if (values.platformCountry === 'unset') values.platformCountry = ''

    if (
      values.newsNotificationsEnabled &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission !== 'granted') {
        values.newsNotificationsEnabled = false
        form.setValue('newsNotificationsEnabled', false)
        toast.error('Browser notification permission was not granted.')
      }
    }

    settings.setTimezone(values.timezone)
    settings.setPlatformCountry(values.platformCountry)
    settings.setPlatformDateOverride(values.platformDateOverride)
    settings.setCurrencySymbol(values.currencySymbol as CurrencySymbol)
    settings.setDefaultRiskPct(values.defaultRiskPct)
    settings.setFtmoMode(values.ftmoMode)
    settings.setPropFirmTemplate(values.propFirmTemplate)
    settings.setFtmoAccountSize(values.ftmoAccountSize)
    settings.setFtmoDailyLossLimitPct(values.ftmoDailyLossLimitPct)
    settings.setFtmoMaxDrawdownPct(values.ftmoMaxDrawdownPct)
    settings.setFtmoProfitTargetPct(values.ftmoProfitTargetPct)
    settings.setWeeklyTargetUsd(values.weeklyTargetUsd)
    settings.setMonthlyTargetUsd(values.monthlyTargetUsd)
    settings.setDailyLossLimitUsd(values.dailyLossLimitUsd)
    settings.setAutoAssignImportedStrategy(values.autoAssignImportedStrategy)
    settings.setImportedTradeStrategy(values.importedTradeStrategy)
    settings.setNewsNotificationsEnabled(values.newsNotificationsEnabled)
    settings.setNewsNotificationLeadMinutes(values.newsNotificationLeadMinutes)
    settings.setNewsFilterCountries(values.newsFilterCountries)
    settings.setNewsFilterImpacts(values.newsFilterImpacts)

    try {
      await updateProfile.mutateAsync({ tradingSettings: values })
      toast.success('Trading settings saved.')
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, 'Trading settings could not be saved.')
      )
    }
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

          <FormField
            control={form.control}
            name='platformCountry'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Country / Region</FormLabel>
                <FormDescription>
                  Used for global defaults, calendar filtering, and clock
                  context. Leave unset if you want the app to stay neutral.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'unset'}
                >
                  <FormControl>
                    <SelectTrigger className='w-full max-w-sm'>
                      <SelectValue placeholder='Select country' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className='max-h-64'>
                    <SelectItem value='unset'>Not set</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='platformDateOverride'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Date</FormLabel>
                <FormDescription>
                  Overrides the app's working date for the top navigation clock
                  and economic-news alerts. Leave empty to use today's real
                  date.
                </FormDescription>
                <div className='flex flex-wrap gap-2'>
                  <FormControl>
                    <Input type='date' className='w-48' {...field} />
                  </FormControl>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      form.setValue(
                        'platformDateOverride',
                        formatDateInputValue(new Date())
                      )
                    }
                  >
                    Use today
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => form.setValue('platformDateOverride', '')}
                  >
                    Clear
                  </Button>
                </div>
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
            <div>
              <h4 className='text-sm font-semibold'>Economic News Alerts</h4>
              <p className='text-xs text-muted-foreground'>
                Filter the calendar and receive browser alerts before matching
                events drop.
              </p>
            </div>

            <FormField
              control={form.control}
              name='newsNotificationsEnabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <div>
                    <FormLabel className='text-base'>
                      News Notifications
                    </FormLabel>
                    <FormDescription>
                      Alert me before filtered economic-calendar events. Current
                      browser permission: {notificationPermission}.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={notificationPermission === 'unsupported'}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {newsNotificationsEnabled && (
              <FormField
                control={form.control}
                name='newsNotificationLeadMinutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notify Before News Drops</FormLabel>
                    <FormDescription>
                      Minutes before the event time. Use 5-60 minutes for most
                      trading workflows.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        max='240'
                        className='w-32'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='newsFilterImpacts'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact Levels</FormLabel>
                  <FormDescription>
                    Controls the Economic News page and alert matching.
                  </FormDescription>
                  <div className='grid gap-2 sm:grid-cols-3'>
                    {NEWS_IMPACTS.map((impact) => {
                      const checked = field.value.includes(impact.value)
                      return (
                        <label
                          key={impact.value}
                          className='flex cursor-pointer gap-3 rounded-lg border p-3'
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const next = value
                                ? [...field.value, impact.value]
                                : field.value.filter((v) => v !== impact.value)
                              if (next.length > 0) field.onChange(next)
                            }}
                          />
                          <span className='space-y-1'>
                            <span className='block text-sm font-medium'>
                              {impact.label}
                            </span>
                            <span className='block text-xs text-muted-foreground'>
                              {impact.description}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='newsFilterCountries'
              render={({ field }) => (
                <FormItem>
                  <div className='flex flex-wrap items-end justify-between gap-2'>
                    <div>
                      <FormLabel>Countries</FormLabel>
                      <FormDescription>
                        Leave empty to include all countries.
                      </FormDescription>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => field.onChange([])}
                    >
                      All countries
                    </Button>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                    {countries.map((country) => {
                      const checked = field.value.includes(country)
                      return (
                        <label
                          key={country}
                          className='flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm'
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              field.onChange(
                                value
                                  ? [...field.value, country]
                                  : field.value.filter((v) => v !== country)
                              )
                            }}
                          />
                          {country}
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {/* Prop firm mode */}
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='ftmoMode'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <div>
                    <FormLabel className='text-base'>Prop Firm Mode</FormLabel>
                    <FormDescription>
                      Track your dashboard and analytics against funded account
                      challenge rules.
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
                <FormField
                  control={form.control}
                  name='propFirmTemplate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prop firm template</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value !== 'custom') {
                            const preset =
                              PROP_FIRMS[
                                value as Exclude<PropFirmTemplate, 'custom'>
                              ]
                            form.setValue(
                              'ftmoProfitTargetPct',
                              preset.profitTargetPct
                            )
                            form.setValue(
                              'ftmoDailyLossLimitPct',
                              preset.dailyLossLimitPct
                            )
                            form.setValue(
                              'ftmoMaxDrawdownPct',
                              preset.maxDrawdownPct
                            )
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full max-w-sm'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='ftmo'>FTMO</SelectItem>
                          <SelectItem value='fundednext'>FundedNext</SelectItem>
                          <SelectItem value='the5ers'>The5ers</SelectItem>
                          <SelectItem value='e8'>E8 Funding</SelectItem>
                          <SelectItem value='custom'>Custom rules</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Pick a preset, then adjust any rule that differs from
                        your exact challenge.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          Preset value updates when you choose a prop firm.
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
                          Daily rule for the selected challenge.
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
                          Overall drawdown rule for the selected challenge.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type='submit' disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save settings'}
          </Button>
        </form>
      </Form>
    </ContentSection>
  )
}
