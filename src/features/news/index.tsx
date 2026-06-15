import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar as CalendarIcon,
  ExternalLink,
  Filter,
  Newspaper,
  RefreshCw,
} from 'lucide-react'
import { useTradingSettings } from '@/stores/trading-settings-store'
import apiClient from '@/lib/api'
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

type ForexNewsArticle = {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  summary: string
  category: string
  currencies: string[]
}

type ForexNewsResponse = {
  source: 'live' | 'fallback'
  articles: ForexNewsArticle[]
}

const impactColor: Record<NewsImpact, string> = {
  high: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  medium:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
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

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.round(diff / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function articleMatchesSearch(article: ForexNewsArticle, search: string) {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [
    article.title,
    article.summary,
    article.category,
    article.source,
    ...article.currencies,
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

export function News() {
  const newsFilterCountries = useTradingSettings((s) => s.newsFilterCountries)
  const newsFilterImpacts = useTradingSettings((s) => s.newsFilterImpacts)
  const newsNotificationsEnabled = useTradingSettings(
    (s) => s.newsNotificationsEnabled
  )
  const newsNotificationLeadMinutes = useTradingSettings(
    (s) => s.newsNotificationLeadMinutes
  )
  const setNewsFilterCountries = useTradingSettings(
    (s) => s.setNewsFilterCountries
  )
  const setNewsFilterImpacts = useTradingSettings((s) => s.setNewsFilterImpacts)
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState<'all' | string>('all')
  const [newsCategory, setNewsCategory] = useState<'all' | string>('all')

  const forexNewsQuery = useQuery({
    queryKey: ['forex-news'],
    queryFn: async () => {
      const { data } = await apiClient.get('/news/forex')
      return data as ForexNewsResponse
    },
    staleTime: 3 * 60 * 1000,
  })

  const articles = forexNewsQuery.data?.articles ?? []
  const articleCategories = Array.from(
    new Set(articles.map((article) => article.category))
  ).sort()

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        if (!articleMatchesSearch(article, search)) return false
        if (newsCategory !== 'all' && article.category !== newsCategory) {
          return false
        }
        if (currency !== 'all' && !article.currencies.includes(currency)) {
          return false
        }
        return true
      }),
    [articles, currency, newsCategory, search]
  )

  const filtered = useMemo(
    () =>
      news.filter((n) => {
        if (
          newsFilterImpacts.length > 0 &&
          !newsFilterImpacts.includes(n.impact)
        )
          return false
        if (
          newsFilterCountries.length > 0 &&
          !newsFilterCountries.includes(n.country)
        )
          return false
        if (currency !== 'all' && n.currency !== currency) return false
        if (search && !n.title.toLowerCase().includes(search.toLowerCase()))
          return false
        return true
      }),
    [search, newsFilterImpacts, newsFilterCountries, currency]
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
  const countries = Array.from(new Set(news.map((n) => n.country))).sort()
  const impactValue =
    newsFilterImpacts.length === 3 ? 'all' : newsFilterImpacts[0] || 'all'
  const countryValue =
    newsFilterCountries.length === 1 ? newsFilterCountries[0] : 'all'

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
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Forex News</h2>
            <p className='text-muted-foreground'>
              Live market headlines and upcoming FX volatility events in one
              workspace.
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              {newsNotificationsEnabled
                ? `Calendar alerts are on ${newsNotificationLeadMinutes} minutes before matching events.`
                : 'Calendar alerts are off. Enable them in Trading Settings.'}
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => forexNewsQuery.refetch()}
            disabled={forexNewsQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                'size-4',
                forexNewsQuery.isFetching && 'animate-spin'
              )}
            />
            Refresh news
          </Button>
        </div>

        <Card>
          <CardHeader className='pb-3'>
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Newspaper className='size-4' />
                  Market Headlines
                </CardTitle>
                <CardDescription>
                  {forexNewsQuery.data?.source === 'fallback'
                    ? 'Showing fallback headlines because the live feed is temporarily unavailable.'
                    : 'Live forex and macro headlines from public market feeds.'}
                </CardDescription>
              </div>
              <Badge variant='secondary'>
                {forexNewsQuery.isFetching
                  ? 'Updating'
                  : `${filteredArticles.length} headline${filteredArticles.length === 1 ? '' : 's'}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative'>
                <Filter className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search news and events...'
                  className='h-9 w-64 ps-9'
                />
              </div>
              <Select value={newsCategory} onValueChange={setNewsCategory}>
                <SelectTrigger className='w-44'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All news</SelectItem>
                  {articleCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className='w-36'>
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
            </div>

            {forexNewsQuery.isLoading && (
              <div className='flex items-center gap-2 rounded-md border px-3 py-6 text-sm text-muted-foreground'>
                <RefreshCw className='size-4 animate-spin' />
                Loading forex headlines...
              </div>
            )}

            {!forexNewsQuery.isLoading && filteredArticles.length === 0 && (
              <div className='rounded-md border px-3 py-6 text-center text-sm text-muted-foreground'>
                No headlines match your filters.
              </div>
            )}

            <div className='grid gap-3 lg:grid-cols-2'>
              {filteredArticles.slice(0, 12).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target='_blank'
                  rel='noreferrer'
                  className='group rounded-lg border p-4 transition-colors hover:bg-muted/40'
                >
                  <div className='mb-2 flex flex-wrap items-center gap-2'>
                    <Badge variant='outline'>{article.category}</Badge>
                    {article.currencies.slice(0, 3).map((item) => (
                      <Badge key={item} variant='secondary'>
                        {item}
                      </Badge>
                    ))}
                    <span className='ms-auto text-xs text-muted-foreground'>
                      {formatRelativeTime(article.publishedAt)}
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <h3 className='line-clamp-2 flex-1 text-sm font-semibold'>
                      {article.title}
                    </h3>
                    <ExternalLink className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
                  </div>
                  {article.summary && (
                    <p className='mt-2 line-clamp-2 text-xs text-muted-foreground'>
                      {article.summary}
                    </p>
                  )}
                  <p className='mt-3 text-xs text-muted-foreground'>
                    {article.source}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className='text-xl font-semibold tracking-tight'>
            Economic Calendar
          </h2>
          <p className='text-muted-foreground'>
            Upcoming FX volatility events. Verify timing with your broker
            calendar before placing trades.
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
          <Select
            value={impactValue}
            onValueChange={(v) =>
              setNewsFilterImpacts(
                v === 'all' ? ['high', 'medium', 'low'] : [v as NewsImpact]
              )
            }
          >
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
          <Select
            value={countryValue}
            onValueChange={(v) =>
              setNewsFilterCountries(v === 'all' ? [] : [v])
            }
          >
            <SelectTrigger className='w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='max-h-64'>
              <SelectItem value='all'>All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
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
                      const t = new Date(ev.time).toLocaleTimeString(
                        undefined,
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )
                      const beat =
                        ev.actual && ev.forecast
                          ? parseFloat(ev.actual) > parseFloat(ev.forecast)
                          : undefined
                      return (
                        <TableRow key={ev.id}>
                          <TableCell className='font-mono text-xs'>
                            {t}
                          </TableCell>
                          <TableCell>
                            <Badge variant='secondary'>{ev.currency}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={cn(
                                'capitalize',
                                impactColor[ev.impact]
                              )}
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
                          <TableCell className='text-end text-muted-foreground tabular-nums'>
                            {ev.previous}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-end font-semibold tabular-nums',
                              beat === true && 'text-emerald-600',
                              beat === false && 'text-red-600'
                            )}
                          >
                            {ev.actual ?? '-'}
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
