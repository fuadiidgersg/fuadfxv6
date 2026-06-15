import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CandlestickChart,
  ExternalLink,
  Maximize2,
  RefreshCw,
} from 'lucide-react'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type Instrument = {
  label: string
  value: string
}

const INSTRUMENT_GROUPS: { label: string; instruments: Instrument[] }[] = [
  {
    label: 'Forex Majors',
    instruments: [
      { label: 'EUR/USD', value: 'FX:EURUSD' },
      { label: 'GBP/USD', value: 'FX:GBPUSD' },
      { label: 'USD/JPY', value: 'FX:USDJPY' },
      { label: 'USD/CHF', value: 'FX:USDCHF' },
      { label: 'AUD/USD', value: 'FX:AUDUSD' },
      { label: 'USD/CAD', value: 'FX:USDCAD' },
      { label: 'NZD/USD', value: 'FX:NZDUSD' },
    ],
  },
  {
    label: 'Forex Crosses',
    instruments: [
      { label: 'EUR/GBP', value: 'FX:EURGBP' },
      { label: 'EUR/JPY', value: 'FX:EURJPY' },
      { label: 'EUR/CHF', value: 'FX:EURCHF' },
      { label: 'EUR/AUD', value: 'FX:EURAUD' },
      { label: 'EUR/CAD', value: 'FX:EURCAD' },
      { label: 'EUR/NZD', value: 'FX:EURNZD' },
      { label: 'GBP/JPY', value: 'FX:GBPJPY' },
      { label: 'GBP/CHF', value: 'FX:GBPCHF' },
      { label: 'GBP/AUD', value: 'FX:GBPAUD' },
      { label: 'GBP/CAD', value: 'FX:GBPCAD' },
      { label: 'GBP/NZD', value: 'FX:GBPNZD' },
      { label: 'AUD/JPY', value: 'FX:AUDJPY' },
      { label: 'AUD/CHF', value: 'FX:AUDCHF' },
      { label: 'AUD/CAD', value: 'FX:AUDCAD' },
      { label: 'AUD/NZD', value: 'FX:AUDNZD' },
      { label: 'CAD/JPY', value: 'FX:CADJPY' },
      { label: 'CAD/CHF', value: 'FX:CADCHF' },
      { label: 'CHF/JPY', value: 'FX:CHFJPY' },
      { label: 'NZD/JPY', value: 'FX:NZDJPY' },
      { label: 'NZD/CHF', value: 'FX:NZDCHF' },
      { label: 'NZD/CAD', value: 'FX:NZDCAD' },
    ],
  },
  {
    label: 'Forex Exotics',
    instruments: [
      { label: 'USD/MXN', value: 'FX:USDMXN' },
      { label: 'USD/ZAR', value: 'FX:USDZAR' },
      { label: 'USD/TRY', value: 'FX:USDTRY' },
      { label: 'USD/SEK', value: 'FX:USDSEK' },
      { label: 'USD/NOK', value: 'FX:USDNOK' },
      { label: 'USD/DKK', value: 'FX:USDDKK' },
      { label: 'USD/SGD', value: 'FX:USDSGD' },
      { label: 'USD/HKD', value: 'FX:USDHKD' },
      { label: 'EUR/TRY', value: 'FX:EURTRY' },
      { label: 'EUR/ZAR', value: 'FX:EURZAR' },
      { label: 'GBP/ZAR', value: 'FX:GBPZAR' },
    ],
  },
  {
    label: 'Metals',
    instruments: [
      { label: 'Gold / USD', value: 'OANDA:XAUUSD' },
      { label: 'Silver / USD', value: 'OANDA:XAGUSD' },
      { label: 'Platinum / USD', value: 'OANDA:XPTUSD' },
      { label: 'Palladium / USD', value: 'OANDA:XPDUSD' },
      { label: 'Copper', value: 'COMEX:HG1!' },
    ],
  },
  {
    label: 'Commodities',
    instruments: [
      { label: 'US Oil / WTI', value: 'TVC:USOIL' },
      { label: 'Brent Oil', value: 'TVC:UKOIL' },
      { label: 'Natural Gas', value: 'NYMEX:NG1!' },
      { label: 'Wheat', value: 'CBOT:ZW1!' },
      { label: 'Corn', value: 'CBOT:ZC1!' },
      { label: 'Soybeans', value: 'CBOT:ZS1!' },
    ],
  },
  {
    label: 'Indices',
    instruments: [
      { label: 'US30 / Dow', value: 'CAPITALCOM:US30' },
      { label: 'NAS100', value: 'CAPITALCOM:US100' },
      { label: 'S&P 500', value: 'CAPITALCOM:US500' },
      { label: 'Russell 2000', value: 'CAPITALCOM:RTY' },
      { label: 'DAX 40', value: 'CAPITALCOM:DE40' },
      { label: 'FTSE 100', value: 'CAPITALCOM:UK100' },
      { label: 'CAC 40', value: 'CAPITALCOM:FR40' },
      { label: 'Nikkei 225', value: 'CAPITALCOM:J225' },
      { label: 'Hang Seng', value: 'CAPITALCOM:HK50' },
      { label: 'ASX 200', value: 'CAPITALCOM:AU200' },
    ],
  },
  {
    label: 'Crypto',
    instruments: [
      { label: 'BTC/USD', value: 'BINANCE:BTCUSDT' },
      { label: 'ETH/USD', value: 'BINANCE:ETHUSDT' },
      { label: 'SOL/USD', value: 'BINANCE:SOLUSDT' },
      { label: 'XRP/USD', value: 'BINANCE:XRPUSDT' },
      { label: 'BNB/USD', value: 'BINANCE:BNBUSDT' },
      { label: 'DOGE/USD', value: 'BINANCE:DOGEUSDT' },
      { label: 'ADA/USD', value: 'BINANCE:ADAUSDT' },
      { label: 'AVAX/USD', value: 'BINANCE:AVAXUSDT' },
      { label: 'LINK/USD', value: 'BINANCE:LINKUSDT' },
    ],
  },
  {
    label: 'Stocks & ETFs',
    instruments: [
      { label: 'Apple', value: 'NASDAQ:AAPL' },
      { label: 'Microsoft', value: 'NASDAQ:MSFT' },
      { label: 'NVIDIA', value: 'NASDAQ:NVDA' },
      { label: 'Tesla', value: 'NASDAQ:TSLA' },
      { label: 'Amazon', value: 'NASDAQ:AMZN' },
      { label: 'Meta', value: 'NASDAQ:META' },
      { label: 'Alphabet', value: 'NASDAQ:GOOGL' },
      { label: 'SPY ETF', value: 'AMEX:SPY' },
      { label: 'QQQ ETF', value: 'NASDAQ:QQQ' },
    ],
  },
]

const SYMBOLS = INSTRUMENT_GROUPS.flatMap((group) => group.instruments)

const INTERVALS = [
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
]

function TradingViewWidget({
  interval,
  symbol,
}: {
  interval: string
  symbol: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isSlow, setIsSlow] = useState(false)
  const { resolvedTheme } = useTheme()
  const timezone = useTradingSettings((s) => s.timezone)

  const chartUrl = useMemo(
    () =>
      `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`,
    [symbol]
  )

  useEffect(() => {
    if (!containerRef.current) return

    setIsSlow(false)
    containerRef.current.innerHTML = ''

    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.height = 'calc(100% - 32px)'
    widget.style.width = '100%'

    const copyright = document.createElement('div')
    copyright.className = 'tradingview-widget-copyright sr-only'
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span>Track all markets on TradingView</span></a>'

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone,
      theme: resolvedTheme,
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    containerRef.current.appendChild(widget)
    containerRef.current.appendChild(copyright)
    containerRef.current.appendChild(script)

    const slowTimeout = window.setTimeout(() => setIsSlow(true), 10_000)
    return () => {
      window.clearTimeout(slowTimeout)
    }
  }, [interval, resolvedTheme, symbol, timezone])

  return (
    <div className='relative h-full w-full'>
      <div
        ref={containerRef}
        className='tradingview-widget-container h-full w-full'
      />
      {isSlow && (
        <div className='absolute right-3 bottom-3 z-10 rounded-md border bg-background/95 p-2 text-xs shadow-sm backdrop-blur'>
          <Button type='button' variant='outline' size='sm' asChild>
            <a href={chartUrl} target='_blank' rel='noreferrer'>
              <ExternalLink className='size-4' />
              Open directly
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

export function Charts() {
  const [symbol, setSymbol] = useState('FX:EURUSD')
  const [interval, setInterval] = useState('60')
  const [reloadKey, setReloadKey] = useState(0)

  const symbolLabel = useMemo(
    () => SYMBOLS.find((item) => item.value === symbol)?.label ?? symbol,
    [symbol]
  )

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex min-h-[calc(100svh-4rem)] flex-col gap-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <CandlestickChart className='size-4' />
              Live market workspace
            </div>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>
                TradingView Charts
              </h1>
              <p className='max-w-2xl text-sm text-muted-foreground'>
                Review price action beside your journal with free TradingView
                forex, metals and index charts.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className='h-10 w-44'>
                <SelectValue aria-label={symbolLabel}>
                  {symbolLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className='max-h-96 w-64'>
                {INSTRUMENT_GROUPS.map((group, index) => (
                  <SelectGroup key={group.label}>
                    {index > 0 && <SelectSeparator />}
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.instruments.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <span className='flex w-full items-center justify-between gap-4'>
                          <span>{item.label}</span>
                          <span className='text-xs text-muted-foreground'>
                            {item.value}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className='h-10 w-24'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={() => setReloadKey((key) => key + 1)}
              aria-label='Reload chart'
            >
              <RefreshCw className='size-4' />
            </Button>

            <Button type='button' variant='outline' size='icon' asChild>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
                target='_blank'
                rel='noreferrer'
                aria-label='Open chart on TradingView'
              >
                <ExternalLink className='size-4' />
              </a>
            </Button>
          </div>
        </div>

        <div className='min-h-[560px] flex-1 overflow-hidden rounded-lg border bg-card'>
          <TradingViewWidget
            key={`${symbol}-${interval}-${reloadKey}`}
            symbol={symbol}
            interval={interval}
          />
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground'>
          <span>
            Use this page for discretionary review. Your journal calculations
            still come from uploaded or synced account data.
          </span>
          <span className='inline-flex items-center gap-2 font-medium text-foreground'>
            <Maximize2 className='size-3.5' />
            Symbol changes are enabled inside the chart.
          </span>
        </div>
      </Main>
    </>
  )
}
