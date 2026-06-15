import { Router } from 'express'

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

const router = Router()

const FEEDS = [
  {
    source: 'investingLive',
    url: 'https://investinglive.com/feed/',
  },
]

const FALLBACK_ARTICLES: ForexNewsArticle[] = [
  {
    id: 'fallback-usd-fed',
    title: 'USD traders watch Fed guidance and inflation expectations',
    url: 'https://www.investinglive.com/',
    source: 'FUADFX fallback',
    publishedAt: new Date().toISOString(),
    summary:
      'Live forex headlines could not be reached, so this fallback keeps the news page usable. Recheck the feed before trading around high-impact events.',
    category: 'Central Banks',
    currencies: ['USD'],
  },
  {
    id: 'fallback-risk',
    title: 'Risk sentiment remains key for indices, yen crosses and gold',
    url: 'https://www.investinglive.com/',
    source: 'FUADFX fallback',
    publishedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    summary:
      'Monitor equities, bond yields, energy prices and safe-haven flows when planning trades during active market sessions.',
    category: 'Market Sentiment',
    currencies: ['JPY', 'XAU'],
  },
]

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripHtml(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagCurrencies(text: string) {
  const upper = text.toUpperCase()
  const currencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'CAD',
    'AUD',
    'NZD',
    'CNY',
    'XAU',
    'OIL',
  ]
  return currencies.filter((currency) => upper.includes(currency))
}

function classify(text: string) {
  const value = text.toLowerCase()
  if (/fed|ecb|boe|boj|boc|snb|central bank|rate decision/.test(value)) {
    return 'Central Banks'
  }
  if (/cpi|inflation|ppi|nfp|payroll|jobs|unemployment|gdp|retail sales/.test(value)) {
    return 'Economic Data'
  }
  if (/eur\/usd|gbp\/usd|usd\/jpy|forex|currency|dollar|euro|yen|sterling/.test(value)) {
    return 'Forex'
  }
  if (/gold|oil|wti|brent|xau|commodity/.test(value)) return 'Commodities'
  if (/stocks|equities|s&p|nasdaq|dow|indices|risk/.test(value)) {
    return 'Market Sentiment'
  }
  return 'Market News'
}

function firstMatch(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeEntities(match[1]).trim() : ''
}

function parseRss(xml: string, source: string): ForexNewsArticle[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []
  return items
    .map((item, index) => {
      const title = stripHtml(firstMatch(item, 'title'))
      const url = stripHtml(firstMatch(item, 'link'))
      const published = firstMatch(item, 'pubDate')
      const description = stripHtml(
        firstMatch(item, 'description') || firstMatch(item, 'content:encoded')
      )
      const text = `${title} ${description}`

      return {
        id: `${source}-${index}-${Buffer.from(url || title).toString('base64url').slice(0, 12)}`,
        title,
        url,
        source,
        publishedAt: published
          ? new Date(published).toISOString()
          : new Date().toISOString(),
        summary: description.slice(0, 260),
        category: classify(text),
        currencies: tagCurrencies(text),
      }
    })
    .filter((article) => article.title && article.url)
}

async function fetchFeed(feed: (typeof FEEDS)[number]) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'FUADFX/1.0 forex-news-reader',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${feed.source} returned ${response.status}`)
    return parseRss(await response.text(), feed.source)
  } finally {
    clearTimeout(timeout)
  }
}

router.get('/forex', async (_req, res) => {
  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed))
    const articles = results
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 40)

    res.setHeader('Cache-Control', 'public, max-age=180')
    res.json({
      source: articles.length ? 'live' : 'fallback',
      articles: articles.length ? articles : FALLBACK_ARTICLES,
    })
  } catch {
    res.json({ source: 'fallback', articles: FALLBACK_ARTICLES })
  }
})

export default router
