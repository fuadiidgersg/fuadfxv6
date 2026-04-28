export type NewsImpact = 'high' | 'medium' | 'low'
export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'NZD'
  | 'CNY'

export type NewsEvent = {
  id: string
  time: string // ISO
  currency: Currency
  country: string
  title: string
  impact: NewsImpact
  forecast: string
  previous: string
  actual?: string
}

const today = new Date()
const iso = (offsetMin: number) =>
  new Date(today.getTime() + offsetMin * 60_000).toISOString()

export const news: NewsEvent[] = [
  {
    id: 'n1',
    time: iso(-180),
    currency: 'JPY',
    country: 'Japan',
    title: 'BoJ Interest Rate Decision',
    impact: 'high',
    forecast: '0.50%',
    previous: '0.50%',
    actual: '0.50%',
  },
  {
    id: 'n2',
    time: iso(-90),
    currency: 'EUR',
    country: 'Germany',
    title: 'ZEW Economic Sentiment',
    impact: 'medium',
    forecast: '12.4',
    previous: '10.7',
    actual: '14.1',
  },
  {
    id: 'n3',
    time: iso(30),
    currency: 'USD',
    country: 'United States',
    title: 'Core CPI m/m',
    impact: 'high',
    forecast: '0.3%',
    previous: '0.2%',
  },
  {
    id: 'n4',
    time: iso(60),
    currency: 'USD',
    country: 'United States',
    title: 'CPI y/y',
    impact: 'high',
    forecast: '3.2%',
    previous: '3.1%',
  },
  {
    id: 'n5',
    time: iso(180),
    currency: 'CAD',
    country: 'Canada',
    title: 'BoC Rate Statement',
    impact: 'high',
    forecast: '-',
    previous: '-',
  },
  {
    id: 'n6',
    time: iso(240),
    currency: 'GBP',
    country: 'United Kingdom',
    title: 'BoE Gov Bailey Speaks',
    impact: 'medium',
    forecast: '-',
    previous: '-',
  },
  {
    id: 'n7',
    time: iso(60 * 24),
    currency: 'AUD',
    country: 'Australia',
    title: 'Employment Change',
    impact: 'high',
    forecast: '22.5K',
    previous: '34.5K',
  },
  {
    id: 'n8',
    time: iso(60 * 24 + 30),
    currency: 'AUD',
    country: 'Australia',
    title: 'Unemployment Rate',
    impact: 'high',
    forecast: '4.1%',
    previous: '4.0%',
  },
  {
    id: 'n9',
    time: iso(60 * 26),
    currency: 'EUR',
    country: 'Eurozone',
    title: 'ECB Main Refinancing Rate',
    impact: 'high',
    forecast: '4.25%',
    previous: '4.25%',
  },
  {
    id: 'n10',
    time: iso(60 * 27),
    currency: 'EUR',
    country: 'Eurozone',
    title: 'ECB Press Conference',
    impact: 'high',
    forecast: '-',
    previous: '-',
  },
  {
    id: 'n11',
    time: iso(60 * 48),
    currency: 'USD',
    country: 'United States',
    title: 'Unemployment Claims',
    impact: 'medium',
    forecast: '215K',
    previous: '212K',
  },
  {
    id: 'n12',
    time: iso(60 * 50),
    currency: 'USD',
    country: 'United States',
    title: 'Retail Sales m/m',
    impact: 'high',
    forecast: '0.4%',
    previous: '0.7%',
  },
  {
    id: 'n13',
    time: iso(60 * 72),
    currency: 'CHF',
    country: 'Switzerland',
    title: 'SNB Policy Rate',
    impact: 'high',
    forecast: '1.50%',
    previous: '1.50%',
  },
  {
    id: 'n14',
    time: iso(60 * 73),
    currency: 'GBP',
    country: 'United Kingdom',
    title: 'Official Bank Rate',
    impact: 'high',
    forecast: '4.75%',
    previous: '5.00%',
  },
  {
    id: 'n15',
    time: iso(60 * 96),
    currency: 'USD',
    country: 'United States',
    title: 'Non-Farm Employment Change',
    impact: 'high',
    forecast: '180K',
    previous: '254K',
  },
  {
    id: 'n16',
    time: iso(60 * 96 + 1),
    currency: 'USD',
    country: 'United States',
    title: 'Average Hourly Earnings m/m',
    impact: 'high',
    forecast: '0.3%',
    previous: '0.4%',
  },
  {
    id: 'n17',
    time: iso(60 * 120),
    currency: 'NZD',
    country: 'New Zealand',
    title: 'GDP q/q',
    impact: 'high',
    forecast: '0.4%',
    previous: '0.2%',
  },
]
