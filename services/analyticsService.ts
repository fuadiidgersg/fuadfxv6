import { Trade, TradeStatus, DashboardStats } from '../types';

export type EquityPoint = { name: string; balance: number };

export type SymbolPnlRow = { name: string; profit: number };

export type ChartTimeframe = '1W' | '1M' | '3M' | 'ALL';

function parseCloseMs(t: Trade): number {
  return new Date(t.closeTime).getTime();
}

/** Trades with `closeTime` within the window ending at the latest close in the set. */
export function filterTradesByTimeframe(trades: Trade[], timeframe: ChartTimeframe): Trade[] {
  if (trades.length === 0 || timeframe === 'ALL') return [...trades];
  const maxClose = Math.max(...trades.map(parseCloseMs));
  const days =
    timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90;
  const cutoff = maxClose - days * 86400000;
  return trades.filter((t) => parseCloseMs(t) >= cutoff);
}

function sortedClosedTrades(trades: Trade[]): Trade[] {
  return [...trades].filter((t) => t.status === TradeStatus.CLOSED).sort((a, b) => parseCloseMs(a) - parseCloseMs(b));
}

export function calculateStats(trades: Trade[], _initialBalance?: number): DashboardStats {
  const closed = trades.filter((t) => t.status === TradeStatus.CLOSED);
  const netProfit = closed.reduce((s, t) => s + t.profit, 0);
  const grossProfit = closed.filter((t) => t.profit > 0).reduce((s, t) => s + t.profit, 0);
  const grossLoss = Math.abs(closed.filter((t) => t.profit < 0).reduce((s, t) => s + t.profit, 0));
  const wins = closed.filter((t) => t.profit > 0).length;
  const totalTrades = closed.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  let profitFactor = 0;
  if (grossLoss > 0) profitFactor = grossProfit / grossLoss;
  else if (grossProfit > 0) profitFactor = 99.99;

  const sorted = sortedClosedTrades(trades);
  let peak = 0;
  let maxDrawdown = 0;
  let run = 0;
  for (const t of sorted) {
    run += t.profit;
    if (run > peak) peak = run;
    const dd = peak - run;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const peakForPct = peak > 0 ? peak : Math.max(Math.abs(netProfit), 1);
  const maxDrawdownPercent = peakForPct > 0 ? (maxDrawdown / peakForPct) * 100 : 0;

  const returns = sorted.map((t) => t.profit);
  const meanR = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((s, r) => s + (r - meanR) ** 2, 0) / (returns.length - 1)
      : 0;
  const std = Math.sqrt(variance);
  const sharpeRatio = std > 1e-9 ? meanR / std : 0;

  const winTrades = closed.filter((t) => t.profit > 0);
  const lossTrades = closed.filter((t) => t.profit < 0);
  const avgWin = winTrades.length ? winTrades.reduce((s, t) => s + t.profit, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length
    ? Math.abs(lossTrades.reduce((s, t) => s + t.profit, 0) / lossTrades.length)
    : 0;
  const averageR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;
  const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : netProfit > 0 ? netProfit : 0;

  return {
    netProfit,
    grossProfit,
    grossLoss,
    winRate,
    totalTrades,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    averageR,
    expectancy,
    recoveryFactor,
  };
}

export function getEquityCurve(trades: Trade[], initialBalance: number): EquityPoint[] {
  const sorted = sortedClosedTrades(trades);
  if (sorted.length === 0) {
    return [{ name: 'Start', balance: initialBalance }];
  }
  let balance = initialBalance;
  const points: EquityPoint[] = [];
  for (const t of sorted) {
    balance += t.profit;
    const d = new Date(t.closeTime);
    const name = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    points.push({ name, balance });
  }
  return points;
}

export function getStatsBySymbol(trades: Trade[]): SymbolPnlRow[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.status !== TradeStatus.CLOSED) continue;
    map.set(t.symbol, (map.get(t.symbol) ?? 0) + t.profit);
  }
  return Array.from(map.entries())
    .map(([name, profit]) => ({ name, profit }))
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));
}
