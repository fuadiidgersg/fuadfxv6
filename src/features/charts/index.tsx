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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const SYMBOLS = [
  { label: 'EUR/USD', value: 'FX:EURUSD' },
  { label: 'GBP/USD', value: 'FX:GBPUSD' },
  { label: 'USD/JPY', value: 'FX:USDJPY' },
  { label: 'USD/CHF', value: 'FX:USDCHF' },
  { label: 'AUD/USD', value: 'FX:AUDUSD' },
  { label: 'USD/CAD', value: 'FX:USDCAD' },
  { label: 'XAU/USD', value: 'OANDA:XAUUSD' },
  { label: 'US30', value: 'CAPITALCOM:US30' },
  { label: 'NAS100', value: 'CAPITALCOM:US100' },
]

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
              <SelectTrigger className='h-10 w-36'>
                <SelectValue aria-label={symbolLabel}>
                  {symbolLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
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
