import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useTradingSettings,
  type NewsImpactFilter,
} from '@/stores/trading-settings-store'
import { getApiErrorMessage } from '@/lib/api'
import { useUpdateProfile } from '@/hooks/use-profile-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { news } from '@/features/news/data/news'

const impactOptions: { value: NewsImpactFilter; label: string }[] = [
  { value: 'high', label: 'High impact news' },
  { value: 'medium', label: 'Medium impact news' },
  { value: 'low', label: 'Low impact news' },
]

export function NotificationsForm() {
  const settings = useTradingSettings()
  const updateProfile = useUpdateProfile()
  const [enabled, setEnabled] = useState(settings.newsNotificationsEnabled)
  const [leadMinutes, setLeadMinutes] = useState(
    String(settings.newsNotificationLeadMinutes)
  )
  const [impacts, setImpacts] = useState<NewsImpactFilter[]>(
    settings.newsFilterImpacts
  )
  const [countries, setCountries] = useState<string[]>(
    settings.newsFilterCountries
  )
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined'
      ? 'unsupported'
      : Notification.permission
  )

  const countryOptions = useMemo(
    () => Array.from(new Set(news.map((event) => event.country))).sort(),
    []
  )

  async function save() {
    let nextEnabled = enabled
    if (
      nextEnabled &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        nextEnabled = false
        setEnabled(false)
        toast.error('Browser notification permission was not granted.')
      }
    }

    const minutes = Math.min(240, Math.max(1, Number(leadMinutes) || 15))
    settings.setNewsNotificationsEnabled(nextEnabled)
    settings.setNewsNotificationLeadMinutes(minutes)
    settings.setNewsFilterImpacts(impacts.length ? impacts : ['high'])
    settings.setNewsFilterCountries(countries)
    try {
      await updateProfile.mutateAsync({
        tradingSettings: {
          newsNotificationsEnabled: nextEnabled,
          newsNotificationLeadMinutes: minutes,
          newsFilterImpacts: impacts.length ? impacts : ['high'],
          newsFilterCountries: countries,
        },
      })
      toast.success('Notification settings saved.')
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, 'Notification settings could not be saved.')
      )
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between rounded-lg border p-4'>
        <div className='space-y-1'>
          <Label className='text-base'>Economic calendar alerts</Label>
          <p className='text-sm text-muted-foreground'>
            Get a browser notification before selected news events drop.
            Permission: {permission}.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={permission === 'unsupported'}
        />
      </div>

      <div className='grid gap-3 sm:grid-cols-[180px_1fr] sm:items-center'>
        <Label htmlFor='lead-minutes'>Notify before</Label>
        <div className='flex items-center gap-2'>
          <Input
            id='lead-minutes'
            type='number'
            min='1'
            max='240'
            className='w-28'
            value={leadMinutes}
            onChange={(e) => setLeadMinutes(e.target.value)}
          />
          <span className='text-sm text-muted-foreground'>minutes</span>
        </div>
      </div>

      <div className='space-y-3'>
        <div>
          <Label>Notification types</Label>
          <p className='text-sm text-muted-foreground'>
            Choose the market events that matter to your trading plan.
          </p>
        </div>
        <div className='grid gap-2 sm:grid-cols-3'>
          {impactOptions.map((option) => {
            const checked = impacts.includes(option.value)
            return (
              <label
                key={option.value}
                className='flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm'
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    const next = value
                      ? [...impacts, option.value]
                      : impacts.filter((impact) => impact !== option.value)
                    setImpacts(next.length ? next : ['high'])
                  }}
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <Label>Countries</Label>
            <p className='text-sm text-muted-foreground'>
              Leave empty to receive alerts for all countries in the calendar.
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => setCountries([])}>
            All countries
          </Button>
        </div>
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {countryOptions.map((country) => {
            const checked = countries.includes(country)
            return (
              <label
                key={country}
                className='flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm'
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    setCountries(
                      value
                        ? [...countries, country]
                        : countries.filter((item) => item !== country)
                    )
                  }}
                />
                {country}
              </label>
            )
          })}
        </div>
      </div>

      <Button type='button' onClick={save} disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Updating...' : 'Update notifications'}
      </Button>
    </div>
  )
}
