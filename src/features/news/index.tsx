import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { news, type NewsImpact } from './data/news'

const impactColor: Record<NewsImpact, string> = {
  high: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
}

function formatGroupKey(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function News() {
  const [search, setSearch] = useState('')
  const [impact, setImpact] = useState<'all' | NewsImpact>('all')
  const [currency, setCurrency] = useState<'all' | string>('all')

  const filtered = useMemo(
    () =>
      news.filter((n) => {
        if (impact !== 'all' && n.impact !== impact) return false
        if (currency !== 'all' && n.currency !== currency) return false
        if (search && !n.title.toLowerCase().includes(search.toLowerCase()))
          return false
        return true
      }),
    [search, impact, currency]
  )

  const grouped = useMemo(() => {
    const m = new Map<string, typeof news>()
    for (const ev of filtered) {
      const key = formatGroupKey(new Date(ev.time))
      const arr = m.get(key) ?? []
      arr.push(ev)
      m.set(key, arr)
    }
    return Array.from(m.entries()).map(([day, items]) => ({
      day,
      items: items.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      ),
    }))
  }, [filtered])

  const currencies = Array.from(new Set(news.map((n) => n.currency))).sort()

  const todayKey = formatGroupKey(new Date())

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Economic News</h2>
          <p className='text-muted-foreground'>
            Upcoming high-impact data releases that move FX volatility.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <Filter className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search events...'
              className='h-9 w-60 ps-9'
            />
          </div>
          <Select value={impact} onValueChange={(v) => setImpact(v as typeof impact)}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All impact</SelectItem>
              <SelectItem value='high'>High</SelectItem>
              <SelectItem value='medium'>Medium</SelectItem>
              <SelectItem value='low'>Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All currencies</SelectItem>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' className='ms-auto gap-1'>
            <CalendarIcon className='size-4' /> This Week
          </Button>
        </div>

        {grouped.length === 0 && (
          <Card>
            <CardContent className='py-10 text-center text-muted-foreground'>
              No events match your filters.
            </CardContent>
          </Card>
        )}

        {grouped.map((group) => (
          <Card key={group.day}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>
                {group.day}{' '}
                {group.day === todayKey && (
                  <Badge className='ms-2'>Today</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {group.items.length} event{group.items.length > 1 && 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-20'>Time</TableHead>
                      <TableHead className='w-20'>Currency</TableHead>
                      <TableHead className='w-24'>Impact</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className='text-end'>Forecast</TableHead>
                      <TableHead className='text-end'>Previous</TableHead>
                      <TableHead className='text-end'>Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((ev) => {
                      const t = new Date(ev.time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      const beat =
                        ev.actual && ev.forecast
                          ? parseFloat(ev.actual) > parseFloat(ev.forecast)
                          : undefined
                      return (
                        <TableRow key={ev.id}>
                          <TableCell className='font-mono text-xs'>{t}</TableCell>
                          <TableCell>
                            <Badge variant='secondary'>{ev.currency}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={cn('capitalize', impactColor[ev.impact])}
                            >
                              {ev.impact}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='font-medium'>{ev.title}</div>
                            <div className='text-xs text-muted-foreground'>
                              {ev.country}
                            </div>
                          </TableCell>
                          <TableCell className='text-end tabular-nums'>
                            {ev.forecast}
                          </TableCell>
                          <TableCell className='text-end tabular-nums text-muted-foreground'>
                            {ev.previous}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-end font-semibold tabular-nums',
                              beat === true && 'text-emerald-600',
                              beat === false && 'text-red-600'
                            )}
                          >
                            {ev.actual ?? '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </Main>
    </>
  )
}
