import { type Trade } from './schema'

export type TradeStats = {
  total: number
  wins: number
  losses: number
  breakeven: number
  open: number
  winRate: number
  totalPnl: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  expectancy: number
  bestTrade: number
  worstTrade: number
  avgR: number
  totalPips: number
  largestWinStreak: number
  largestLossStreak: number
}

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.status !== 'open')
  const wins = closed.filter((t) => t.status === 'win')
  const losses = closed.filter((t) => t.status === 'loss')
  const breakeven = closed.filter((t) => t.status === 'breakeven')
  const open = trades.filter((t) => t.status === 'open')

  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss
  const expectancy =
    closed.length === 0 ? 0 : (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
  const totalPips = closed.reduce((s, t) => s + t.pips, 0)
  const avgR = closed.length ? closed.reduce((s, t) => s + t.rMultiple, 0) / closed.length : 0

  let curWinStreak = 0,
    curLossStreak = 0,
    largestWinStreak = 0,
    largestLossStreak = 0
  const ordered = [...closed].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  for (const t of ordered) {
    if (t.status === 'win') {
      curWinStreak += 1
      curLossStreak = 0
      largestWinStreak = Math.max(largestWinStreak, curWinStreak)
    } else if (t.status === 'loss') {
      curLossStreak += 1
      curWinStreak = 0
      largestLossStreak = Math.max(largestLossStreak, curLossStreak)
    } else {
      curWinStreak = 0
      curLossStreak = 0
    }
  }

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    open: open.length,
    winRate,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    bestTrade: closed.reduce((m, t) => Math.max(m, t.pnl), -Infinity) || 0,
    worstTrade: closed.reduce((m, t) => Math.min(m, t.pnl), Infinity) || 0,
    avgR,
    totalPips,
    largestWinStreak,
    largestLossStreak,
  }
}

export function equityCurve(trades: Trade[], startingBalance = 10000) {
  const closed = [...trades]
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  let balance = startingBalance
  return closed.map((t, idx) => {
    balance += t.pnl
    return {
      idx: idx + 1,
      date: t.closedAt,
      balance: parseFloat(balance.toFixed(2)),
      pnl: t.pnl,
    }
  })
}

export function groupByPair(trades: Trade[]) {
  const map = new Map<string, { pair: string; pnl: number; trades: number; wins: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const cur = map.get(t.pair) ?? { pair: t.pair, pnl: 0, trades: 0, wins: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    map.set(t.pair, cur)
  }
  return Array.from(map.values())
    .map((g) => ({ ...g, pnl: parseFloat(g.pnl.toFixed(2)), winRate: (g.wins / g.trades) * 100 }))
    .sort((a, b) => b.pnl - a.pnl)
}

export function groupByStrategy(trades: Trade[]) {
  const map = new Map<string, { strategy: string; pnl: number; trades: number; wins: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const cur = map.get(t.strategy) ?? { strategy: t.strategy, pnl: 0, trades: 0, wins: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    map.set(t.strategy, cur)
  }
  return Array.from(map.values())
    .map((g) => ({ ...g, pnl: parseFloat(g.pnl.toFixed(2)), winRate: (g.wins / g.trades) * 100 }))
    .sort((a, b) => b.pnl - a.pnl)
}

export function groupBySession(trades: Trade[]) {
  const map = new Map<string, { session: string; pnl: number; trades: number; wins: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const cur = map.get(t.session) ?? { session: t.session, pnl: 0, trades: 0, wins: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    map.set(t.session, cur)
  }
  return Array.from(map.values())
    .map((g) => ({ ...g, pnl: parseFloat(g.pnl.toFixed(2)), winRate: (g.wins / g.trades) * 100 }))
}

export function groupByDayOfWeek(trades: Trade[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const buckets = days.map((d) => ({ day: d, pnl: 0, trades: 0, wins: 0 }))
  for (const t of trades) {
    if (t.status === 'open') continue
    const idx = t.closedAt.getDay()
    buckets[idx].pnl += t.pnl
    buckets[idx].trades += 1
    if (t.status === 'win') buckets[idx].wins += 1
  }
  return buckets.map((b) => ({ ...b, pnl: parseFloat(b.pnl.toFixed(2)) }))
}

export function groupByDirection(trades: Trade[]) {
  const map = new Map<
    string,
    { direction: string; pnl: number; trades: number; wins: number }
  >()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.direction === 'long' ? 'Long' : 'Short'
    const cur = map.get(key) ?? { direction: key, pnl: 0, trades: 0, wins: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.values()).map((g) => ({
    ...g,
    pnl: parseFloat(g.pnl.toFixed(2)),
    winRate: g.trades ? (g.wins / g.trades) * 100 : 0,
  }))
}

export function groupByHour(trades: Trade[]) {
  const buckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h.toString().padStart(2, '0')}:00`,
    pnl: 0,
    trades: 0,
    wins: 0,
  }))
  for (const t of trades) {
    if (t.status === 'open') continue
    const h = t.openedAt.getHours()
    buckets[h].pnl += t.pnl
    buckets[h].trades += 1
    if (t.status === 'win') buckets[h].wins += 1
  }
  return buckets.map((b) => ({ ...b, pnl: parseFloat(b.pnl.toFixed(2)) }))
}

export function rMultipleDistribution(trades: Trade[]) {
  const buckets = [
    { bucket: '≤ -3R', min: -Infinity, max: -2.5, count: 0, pnl: 0 },
    { bucket: '-2R', min: -2.5, max: -1.5, count: 0, pnl: 0 },
    { bucket: '-1R', min: -1.5, max: -0.5, count: 0, pnl: 0 },
    { bucket: '0R', min: -0.5, max: 0.5, count: 0, pnl: 0 },
    { bucket: '+1R', min: 0.5, max: 1.5, count: 0, pnl: 0 },
    { bucket: '+2R', min: 1.5, max: 2.5, count: 0, pnl: 0 },
    { bucket: '≥ +3R', min: 2.5, max: Infinity, count: 0, pnl: 0 },
  ]
  for (const t of trades) {
    if (t.status === 'open') continue
    const r = t.rMultiple
    const b = buckets.find((b) => r >= b.min && r < b.max)
    if (b) {
      b.count += 1
      b.pnl += t.pnl
    }
  }
  return buckets.map(({ bucket, count, pnl }) => ({
    bucket,
    count,
    pnl: parseFloat(pnl.toFixed(2)),
  }))
}

export function holdTimeStats(trades: Trade[]) {
  const closed = trades.filter((t) => t.status !== 'open')
  const minutes = (t: Trade) =>
    Math.max(0, (t.closedAt.getTime() - t.openedAt.getTime()) / 60000)
  const wins = closed.filter((t) => t.status === 'win').map(minutes)
  const losses = closed.filter((t) => t.status === 'loss').map(minutes)
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
  return {
    avgWinMin: avg(wins),
    avgLossMin: avg(losses),
    avgAllMin: avg(closed.map(minutes)),
  }
}

export function lotSizeDistribution(trades: Trade[]) {
  const buckets = [
    { bucket: '≤ 0.10', max: 0.1, count: 0, pnl: 0 },
    { bucket: '0.11 – 0.50', max: 0.5, count: 0, pnl: 0 },
    { bucket: '0.51 – 1.00', max: 1.0, count: 0, pnl: 0 },
    { bucket: '1.01 – 2.00', max: 2.0, count: 0, pnl: 0 },
    { bucket: '> 2.00', max: Infinity, count: 0, pnl: 0 },
  ]
  for (const t of trades) {
    if (t.status === 'open') continue
    const b = buckets.find((b) => t.lotSize <= b.max)
    if (b) {
      b.count += 1
      b.pnl += t.pnl
    }
  }
  return buckets.map(({ bucket, count, pnl }) => ({
    bucket,
    count,
    pnl: parseFloat(pnl.toFixed(2)),
  }))
}

export function drawdownSeries(trades: Trade[], startingBalance = 10000) {
  const closed = [...trades]
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  let balance = startingBalance
  let peak = startingBalance
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  const series = closed.map((t, idx) => {
    balance += t.pnl
    peak = Math.max(peak, balance)
    const dd = balance - peak
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0
    if (dd < maxDrawdown) maxDrawdown = dd
    if (ddPct < maxDrawdownPct) maxDrawdownPct = ddPct
    return {
      idx: idx + 1,
      date: t.closedAt,
      drawdown: parseFloat(dd.toFixed(2)),
      drawdownPct: parseFloat(ddPct.toFixed(2)),
    }
  })
  return { series, maxDrawdown, maxDrawdownPct }
}

export function tradesByMonth(trades: Trade[]) {
  const map = new Map<string, { month: string; trades: number; pnl: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = `${t.closedAt.getFullYear()}-${(t.closedAt.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`
    const cur = map.get(key) ?? { month: key, trades: 0, pnl: 0 }
    cur.trades += 1
    cur.pnl += t.pnl
    map.set(key, cur)
  }
  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, pnl: parseFloat(m.pnl.toFixed(2)) }))
}

export function dailyPnl(trades: Trade[]) {
  const map = new Map<string, { date: string; pnl: number; trades: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.closedAt.toISOString().slice(0, 10)
    const cur = map.get(key) ?? { date: key, pnl: 0, trades: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    map.set(key, cur)
  }
  return Array.from(map.values())
    .map((d) => ({ ...d, pnl: parseFloat(d.pnl.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
