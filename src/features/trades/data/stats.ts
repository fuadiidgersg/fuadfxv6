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
  avgPips: number
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
  const avgPips = closed.length ? totalPips / closed.length : 0
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
    avgPips,
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

export function groupByPairDetailed(trades: Trade[]) {
  const map = new Map<
    string,
    {
      pair: string
      pnl: number
      pips: number
      trades: number
      wins: number
      totalLotSize: number
      totalHoldMin: number
    }
  >()
  for (const t of trades) {
    if (t.status === 'open') continue
    const cur = map.get(t.pair) ?? {
      pair: t.pair,
      pnl: 0,
      pips: 0,
      trades: 0,
      wins: 0,
      totalLotSize: 0,
      totalHoldMin: 0,
    }
    cur.pnl += t.pnl
    cur.pips += t.pips
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    cur.totalLotSize += t.lotSize
    cur.totalHoldMin += Math.max(0, (t.closedAt.getTime() - t.openedAt.getTime()) / 60000)
    map.set(t.pair, cur)
  }
  return Array.from(map.values())
    .map((g) => ({
      pair: g.pair,
      trades: g.trades,
      wins: g.wins,
      losses: g.trades - g.wins,
      pnl: parseFloat(g.pnl.toFixed(2)),
      pips: parseFloat(g.pips.toFixed(1)),
      avgPips: parseFloat((g.pips / g.trades).toFixed(1)),
      winRate: parseFloat(((g.wins / g.trades) * 100).toFixed(1)),
      avgLotSize: parseFloat((g.totalLotSize / g.trades).toFixed(2)),
      avgHoldMin: parseFloat((g.totalHoldMin / g.trades).toFixed(0)),
    }))
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
  const map = new Map<string, { session: string; pnl: number; trades: number; wins: number; pips: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const cur = map.get(t.session) ?? { session: t.session, pnl: 0, trades: 0, wins: 0, pips: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    cur.pips += t.pips
    if (t.status === 'win') cur.wins += 1
    map.set(t.session, cur)
  }
  return Array.from(map.values()).map((g) => ({
    ...g,
    pnl: parseFloat(g.pnl.toFixed(2)),
    pips: parseFloat(g.pips.toFixed(1)),
    winRate: parseFloat(((g.wins / g.trades) * 100).toFixed(1)),
  }))
}

export function groupByDayOfWeek(trades: Trade[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const buckets = days.map((d) => ({ day: d, pnl: 0, trades: 0, wins: 0, pips: 0 }))
  for (const t of trades) {
    if (t.status === 'open') continue
    const idx = t.closedAt.getDay()
    buckets[idx].pnl += t.pnl
    buckets[idx].trades += 1
    buckets[idx].pips += t.pips
    if (t.status === 'win') buckets[idx].wins += 1
  }
  return buckets.map((b) => ({
    ...b,
    pnl: parseFloat(b.pnl.toFixed(2)),
    pips: parseFloat(b.pips.toFixed(1)),
    winRate: b.trades > 0 ? parseFloat(((b.wins / b.trades) * 100).toFixed(1)) : 0,
  }))
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
    pips: 0,
  }))
  for (const t of trades) {
    if (t.status === 'open') continue
    const h = t.openedAt.getHours()
    buckets[h].pnl += t.pnl
    buckets[h].trades += 1
    buckets[h].pips += t.pips
    if (t.status === 'win') buckets[h].wins += 1
  }
  return buckets.map((b) => ({
    ...b,
    pnl: parseFloat(b.pnl.toFixed(2)),
    pips: parseFloat(b.pips.toFixed(1)),
    winRate: b.trades > 0 ? parseFloat(((b.wins / b.trades) * 100).toFixed(1)) : 0,
  }))
}

export function groupByTimeframe(trades: Trade[]) {
  const map = new Map<string, { timeframe: string; pnl: number; trades: number; wins: number; pips: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.timeframe ?? 'Unknown'
    const cur = map.get(key) ?? { timeframe: key, pnl: 0, trades: 0, wins: 0, pips: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    cur.pips += t.pips
    if (t.status === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.values())
    .map((g) => ({
      ...g,
      pnl: parseFloat(g.pnl.toFixed(2)),
      pips: parseFloat(g.pips.toFixed(1)),
      winRate: parseFloat(((g.wins / g.trades) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.trades - a.trades)
}

export function groupByEmotion(trades: Trade[]) {
  const map = new Map<string, { emotion: string; pnl: number; trades: number; wins: number }>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.emotion ?? 'Untagged'
    const cur = map.get(key) ?? { emotion: key, pnl: 0, trades: 0, wins: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    if (t.status === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.values())
    .map((g) => ({
      ...g,
      pnl: parseFloat(g.pnl.toFixed(2)),
      winRate: parseFloat(((g.wins / g.trades) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

export function pipDistribution(trades: Trade[]) {
  const buckets = [
    { bucket: '≤ -50', min: -Infinity, max: -50, count: 0 },
    { bucket: '-50 to -20', min: -50, max: -20, count: 0 },
    { bucket: '-20 to -5', min: -20, max: -5, count: 0 },
    { bucket: '-5 to 0', min: -5, max: 0, count: 0 },
    { bucket: '0 to +5', min: 0, max: 5, count: 0 },
    { bucket: '+5 to +20', min: 5, max: 20, count: 0 },
    { bucket: '+20 to +50', min: 20, max: 50, count: 0 },
    { bucket: '> +50', min: 50, max: Infinity, count: 0 },
  ]
  for (const t of trades) {
    if (t.status === 'open') continue
    const b = buckets.find((b) => t.pips >= b.min && t.pips < b.max)
    if (b) b.count += 1
  }
  return buckets
}

export function holdTimeDistribution(trades: Trade[]) {
  const buckets = [
    { bucket: '< 5m', maxMin: 5, count: 0 },
    { bucket: '5–30m', maxMin: 30, count: 0 },
    { bucket: '30m–2h', maxMin: 120, count: 0 },
    { bucket: '2–8h', maxMin: 480, count: 0 },
    { bucket: '8h–1d', maxMin: 1440, count: 0 },
    { bucket: '> 1d', maxMin: Infinity, count: 0 },
  ]
  for (const t of trades) {
    if (t.status === 'open') continue
    const mins = Math.max(0, (t.closedAt.getTime() - t.openedAt.getTime()) / 60000)
    const b = buckets.find((b) => mins < b.maxMin)
    if (b) b.count += 1
  }
  return buckets
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
    { bucket: '0.11–0.50', max: 0.5, count: 0, pnl: 0 },
    { bucket: '0.51–1.00', max: 1.0, count: 0, pnl: 0 },
    { bucket: '1.01–2.00', max: 2.0, count: 0, pnl: 0 },
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

export type AdvancedStats = {
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  payoffRatio: number
  recoveryFactor: number
  zScore: number
  kellyPct: number
  consistencyPct: number
  profitableDays: number
  losingDays: number
  neutralDays: number
  totalTradingDays: number
  grossProfit: number
  grossLoss: number
  avgTradesPerWeek: number
  expectancyPips: number
  annualizedReturn: number
}

export function computeAdvancedStats(trades: Trade[], startingBalance = 10000): AdvancedStats {
  const closed = [...trades]
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  const wins = closed.filter((t) => t.status === 'win')
  const losses = closed.filter((t) => t.status === 'loss')

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const winRate = closed.length ? wins.length / closed.length : 0

  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 99 : 0
  const kellyPct = payoffRatio > 0 ? winRate - (1 - winRate) / payoffRatio : 0

  const dailyMap = new Map<string, number>()
  for (const t of closed) {
    const key = t.closedAt.toISOString().slice(0, 10)
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + t.pnl)
  }
  const dailyReturns = Array.from(dailyMap.values())
  const n = dailyReturns.length
  const meanReturn = n ? dailyReturns.reduce((s, x) => s + x, 0) / n : 0
  const variance =
    n > 1 ? dailyReturns.reduce((s, x) => s + (x - meanReturn) ** 2, 0) / (n - 1) : 0
  const std = Math.sqrt(variance)
  const sharpeRatio = std > 0 ? (meanReturn / std) * Math.sqrt(252) : 0

  const negReturns = dailyReturns.filter((r) => r < 0)
  const downsideVar = negReturns.length
    ? negReturns.reduce((s, x) => s + x ** 2, 0) / negReturns.length
    : 0
  const downsideStd = Math.sqrt(downsideVar)
  const sortinoRatio = downsideStd > 0 ? (meanReturn / downsideStd) * Math.sqrt(252) : 0

  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0)
  const tradingDays = dailyMap.size
  const annualizedReturn =
    tradingDays > 0 ? (totalPnl / startingBalance) * (252 / tradingDays) * 100 : 0

  const dd = drawdownSeries(trades, startingBalance)
  const maxDdPct = Math.abs(dd.maxDrawdownPct)
  const maxDdAbs = Math.abs(dd.maxDrawdown)
  const calmarRatio = maxDdPct > 0 ? annualizedReturn / maxDdPct : 0
  const recoveryFactor = maxDdAbs > 0 ? totalPnl / maxDdAbs : 0

  let runs = 0
  let prevStatus: string | null = null
  for (const t of closed) {
    if (t.status !== prevStatus) {
      runs++
      prevStatus = t.status
    }
  }
  const W = wins.length
  const L = losses.length
  const N = W + L
  const expectedRuns = N > 1 ? (2 * W * L) / N + 1 : 1
  const runsVariance =
    N > 2 ? (2 * W * L * (2 * W * L - N)) / (N * N * (N - 1)) : 0
  const zScore = runsVariance > 0 ? (runs - expectedRuns) / Math.sqrt(runsVariance) : 0

  const profitableDays = dailyReturns.filter((p) => p > 0).length
  const losingDays = dailyReturns.filter((p) => p < 0).length
  const neutralDays = tradingDays - profitableDays - losingDays
  const consistencyPct = tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0

  let avgTradesPerWeek = 0
  if (closed.length >= 2) {
    const firstDate = closed[0].openedAt.getTime()
    const lastDate = closed[closed.length - 1].closedAt.getTime()
    const weeks = Math.max(1, (lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000))
    avgTradesPerWeek = closed.length / weeks
  }

  const avgPipWin = wins.length ? wins.reduce((s, t) => s + t.pips, 0) / wins.length : 0
  const avgPipLoss = losses.length
    ? Math.abs(losses.reduce((s, t) => s + t.pips, 0) / losses.length)
    : 0
  const expectancyPips = winRate * avgPipWin - (1 - winRate) * avgPipLoss

  return {
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    calmarRatio: parseFloat(calmarRatio.toFixed(2)),
    payoffRatio: parseFloat(payoffRatio.toFixed(2)),
    recoveryFactor: parseFloat(recoveryFactor.toFixed(2)),
    zScore: parseFloat(zScore.toFixed(2)),
    kellyPct: parseFloat((kellyPct * 100).toFixed(1)),
    consistencyPct: parseFloat(consistencyPct.toFixed(1)),
    profitableDays,
    losingDays,
    neutralDays,
    totalTradingDays: tradingDays,
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    avgTradesPerWeek: parseFloat(avgTradesPerWeek.toFixed(1)),
    expectancyPips: parseFloat(expectancyPips.toFixed(1)),
    annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
  }
}

export function rollingStats(trades: Trade[], n: number) {
  const closed = [...trades]
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  const last = closed.slice(-n)
  const wins = last.filter((t) => t.status === 'win').length
  const pnl = last.reduce((s, t) => s + t.pnl, 0)
  const winRate = last.length ? (wins / last.length) * 100 : 0
  const avgR = last.length ? last.reduce((s, t) => s + t.rMultiple, 0) / last.length : 0
  return { trades: last.length, wins, winRate: parseFloat(winRate.toFixed(1)), pnl: parseFloat(pnl.toFixed(2)), avgR: parseFloat(avgR.toFixed(2)) }
}

export function bestWorstPeriods(trades: Trade[]) {
  const dayMap = new Map<string, number>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = t.closedAt.toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl)
  }
  const days = Array.from(dayMap.entries()).map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
  const bestDay = days.length ? days.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : { date: '—', pnl: 0 }
  const worstDay = days.length ? days.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : { date: '—', pnl: 0 }

  const monthMap = new Map<string, number>()
  for (const t of trades) {
    if (t.status === 'open') continue
    const key = `${t.closedAt.getFullYear()}-${String(t.closedAt.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + t.pnl)
  }
  const months = Array.from(monthMap.entries()).map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) }))
  const bestMonth = months.length ? months.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : { month: '—', pnl: 0 }
  const worstMonth = months.length ? months.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : { month: '—', pnl: 0 }

  return { bestDay, worstDay, bestMonth, worstMonth }
}

export function calendarHeatmap(trades: Trade[], months = 3) {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1)
  const dayMap = new Map<string, number>()
  for (const t of trades) {
    if (t.status === 'open') continue
    if (t.closedAt < startDate) continue
    const key = t.closedAt.toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl)
  }
  return Array.from(dayMap.entries())
    .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function plannedVsActualRR(trades: Trade[]) {
  return trades
    .filter((t) => t.status !== 'open' && t.stopLoss != null && t.takeProfit != null)
    .map((t) => {
      const slDist = Math.abs(t.entry - (t.stopLoss ?? t.entry))
      const tpDist = Math.abs((t.takeProfit ?? t.entry) - t.entry)
      const planned = slDist > 0 ? parseFloat((tpDist / slDist).toFixed(2)) : 0
      return { pair: t.pair, planned, actual: t.rMultiple, pnl: t.pnl, status: t.status }
    })
}
