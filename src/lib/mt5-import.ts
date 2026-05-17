import {
  PAIRS,
  type SESSIONS,
  type Trade,
} from '@/features/trades/data/schema'

export type MT5ParseResult = {
  trades: Trade[]
  totalRows: number
  skipped: number
  account?: string
  broker?: string
}

const KNOWN_PAIRS = new Set<string>(PAIRS)

function normalizeSymbol(raw: string): string {
  const s = raw
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[a-z]+$/, '')
    .toUpperCase()
    .trim()

  if (s.includes('/')) {
    if (KNOWN_PAIRS.has(s)) return s
    return s
  }

  const metals: Record<string, string> = {
    XAUUSD: 'XAU/USD',
    XAGUSD: 'XAG/USD',
    GOLD: 'XAU/USD',
    SILVER: 'XAG/USD',
  }
  if (metals[s]) return metals[s]

  if (/^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`
  }

  return s
}

function parseMT5Date(value: string): Date | null {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  const m = cleaned.match(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
  )
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    s ? Number(s) : 0
  )
  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseNumber(value: string): number | null {
  if (value === undefined || value === null) return null
  const cleaned = String(value)
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .trim()
  if (!cleaned || cleaned === '-' || cleaned === '–') return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function isPositiveNumeric(value: string): boolean {
  const n = parseNumber(value)
  return n !== null && n > 0
}

function sessionFromDate(d: Date): (typeof SESSIONS)[number] {
  const hour = d.getUTCHours()
  if (hour >= 0 && hour < 7) return 'Asian'
  if (hour >= 7 && hour < 12) return 'London'
  if (hour >= 12 && hour < 17) return 'Overlap'
  return 'New York'
}

function pipsBetween(pair: string, entry: number, exit: number, dir: 'long' | 'short'): number {
  const diff = dir === 'long' ? exit - entry : entry - exit
  const isJpy = /JPY/i.test(pair)
  const isMetal = /^XA[GU]/.test(pair)
  const factor = isJpy ? 100 : isMetal ? 10 : 10000
  return Math.round(diff * factor * 10) / 10
}

type Section =
  | 'unknown'
  | 'positions'
  | 'open'
  | 'orders'
  | 'deals'
  | 'summary'

function detectSection(joined: string): Section | null {
  const t = joined.toLowerCase().trim()
  // Section headers in MT5 typically appear in a single-cell colspan row.
  // ONLY closed-history sections become 'positions'. "Open Positions" is a
  // separate section that lists currently-open trades and has a different
  // column layout — we tag it 'open' so the row loop ignores it.
  if (/^closed\s+transactions?$/.test(t)) return 'positions'
  if (/^closed\s+positions?$/.test(t)) return 'positions'
  if (/^positions?$/.test(t)) return 'positions'
  if (/^open\s+positions?$/.test(t)) return 'open'
  if (/^working\s+orders?$/.test(t)) return 'orders'
  if (/^orders?$/.test(t)) return 'orders'
  if (/^deals?$/.test(t)) return 'deals'
  if (/^results?$/.test(t)) return 'summary'
  if (/^summary$/.test(t)) return 'summary'
  return null
}

export function parseMT5Html(html: string): MT5ParseResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = Array.from(doc.querySelectorAll('tr'))

  const trades: Trade[] = []
  let totalRows = 0
  let account: string | undefined
  let broker: string | undefined

  // Pre-extract every row's *visible* text cells.
  // MT5 reports use <td class="hidden" colspan="N"> spacers between columns
  // (e.g. between Type and Volume). They are not real data and must be
  // filtered out before we try to map cells to column meanings.
  const isHiddenCell = (el: Element): boolean => {
    const cls = (el.getAttribute('class') ?? '').toLowerCase()
    if (cls.split(/\s+/).includes('hidden')) return true
    const style = (el.getAttribute('style') ?? '').toLowerCase()
    if (/display\s*:\s*none/.test(style)) return true
    if (/visibility\s*:\s*hidden/.test(style)) return true
    return false
  }
  const allRows = rows.map((r) =>
    Array.from(r.querySelectorAll('td, th'))
      .filter((td) => !isHiddenCell(td))
      .map((td) => (td.textContent ?? '').replace(/\s+/g, ' ').trim())
  )

  // Detect account / broker in the header
  for (const cells of allRows) {
    const joined = cells.join(' ')
    if (!account) {
      const m = joined.match(/Account\s*[:#]?\s*([0-9]{4,})/i)
      if (m) account = m[1]
    }
    if (!broker) {
      const m = joined.match(/(?:Broker|Company)\s*[:]?\s*([^\s,|][^|,]{2,60})/i)
      if (m) broker = m[1].trim()
    }
  }

  // Walk rows top-to-bottom and track which section we're in.
  let section: Section = 'unknown'
  // The Positions table typically has 13-14 columns but we handle flexible layouts:
  // [0]=Time(open), [1]=Position#, [2]=Symbol, [3]=Type, [4]=Volume,
  // [5]=Price(open), [6]=S/L, [7]=T/P, [8]=Time(close), [9]=Price(close),
  // [10]=Commission, [11]=Swap, [12]=Profit, ([13]=Comment)
  // We allow flexible cell counts to handle different MT5 report formats
  for (const cells of allRows) {
    // Section header row (single non-empty cell with a section keyword, often a colspan)
    const nonEmpty = cells.filter((c) => c.length > 0)
    if (nonEmpty.length === 1) {
      const next = detectSection(nonEmpty[0])
      if (next) {
        section = next
        continue
      }
    }
    // Some reports put the header in the first cell with the rest blank
    if (cells.length >= 1) {
      const next = detectSection(cells[0] ?? '')
      if (next) {
        section = next
        continue
      }
    }

    if (section !== 'positions') continue
    // Allow flexible cell counts but require minimum essential columns
    if (cells.length < 10) continue

    // Strict shape validation for a position row
    const openTimeStr = cells[0] ?? ''
    const symbol = cells[2] ?? ''
    const type = (cells[3] ?? '').toLowerCase()
    const volumeStr = cells[4] ?? ''
    const openPriceStr = cells[5] ?? ''
    const closeTimeStr = cells[8] ?? cells[cells.length - 3] ?? ''
    const closePriceStr = cells[9] ?? cells[cells.length - 2] ?? ''
    const profitStr = cells[cells.length >= 13 ? 12 : cells.length - 1] ?? ''

    if (type !== 'buy' && type !== 'sell') continue

    const openTime = parseMT5Date(openTimeStr)
    const closeTime = parseMT5Date(closeTimeStr)
    if (!openTime || !closeTime) continue

    if (!symbol || /^[a-z]+$/i.test(symbol) === false && !/[A-Z]{3}/i.test(symbol)) {
      // Symbol must contain letters
      if (!/[A-Z]/i.test(symbol)) continue
    }

    if (!isPositiveNumeric(volumeStr)) continue
    if (!isPositiveNumeric(openPriceStr)) continue
    if (!isPositiveNumeric(closePriceStr)) continue
    // Profit must be a parseable number (can be 0 or negative)
    if (parseNumber(profitStr) === null) continue

    totalRows++

    const direction = type === 'buy' ? 'long' : 'short'
    const pair = normalizeSymbol(symbol)
    const volume = parseNumber(volumeStr) ?? 0
    const entry = parseNumber(openPriceStr) ?? 0
    const sl = parseNumber(cells[6] ?? '') ?? undefined
    const tp = parseNumber(cells[7] ?? '') ?? undefined
    const exit = parseNumber(closePriceStr) ?? entry
    const commission = parseNumber(cells[10] ?? '') ?? 0
    const swap = parseNumber(cells[11] ?? '') ?? 0
    const profit = parseNumber(profitStr) ?? 0
    const pnl = +(profit + commission + swap).toFixed(2)
    const status = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven'
    const pips = pipsBetween(pair, entry, exit, direction)

    trades.push({
      id: `MT5-${cells[1] ?? Math.random().toString(36).slice(2, 8)}`,
      pair,
      direction,
      entry,
      exit,
      stopLoss: sl && sl > 0 ? sl : undefined,
      takeProfit: tp && tp > 0 ? tp : undefined,
      lotSize: volume,
      pnl,
      pips,
      rMultiple:
        sl && sl > 0 && entry !== sl
          ? +(
              (direction === 'long' ? exit - entry : entry - exit) /
              Math.abs(entry - sl)
            ).toFixed(2)
          : 0,
      strategy: 'Smart Money',
      session: sessionFromDate(openTime),
      status,
      openedAt: openTime,
      closedAt: closeTime,
      account: account ?? 'MT5 Import',
      tags: ['mt5'],
      notes:
        cells.length === 14 && cells[13] && cells[13].length < 80
          ? cells[13]
          : undefined,
    })
  }

  const skipped = Math.max(0, totalRows - trades.length)

  return { trades, totalRows: trades.length, skipped, account, broker }
}
