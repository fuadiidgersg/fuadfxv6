import { describe, expect, it } from 'vitest'
import type { Trade } from './schema'
import {
  computeStats,
  groupByPairDetailed,
  dailyPnl,
  formatProfitFactor,
} from './stats'

function trade(overrides: Partial<Trade>): Trade {
  return {
    id: 't',
    pair: 'EUR/USD',
    direction: 'long',
    entry: 1,
    exit: 1,
    lotSize: 1,
    pnl: 0,
    pips: 0,
    rMultiple: 0,
    strategy: 'Smart Money',
    session: 'London',
    status: 'breakeven',
    openedAt: new Date(2026, 0, 1, 9),
    closedAt: new Date(2026, 0, 1, 10),
    account: 'Test',
    tags: [],
    ...overrides,
  }
}

describe('trade stats calculations', () => {
  it('uses closed trades for performance metrics and gross P&L for profit factor', () => {
    const trades = [
      trade({ id: 'w1', pnl: 100, pips: 10, rMultiple: 1, status: 'win' }),
      trade({ id: 'w2', pnl: 50, pips: 5, rMultiple: 0.5, status: 'win' }),
      trade({ id: 'l1', pnl: -75, pips: -7.5, rMultiple: -1, status: 'loss' }),
      trade({ id: 'b1', pnl: 0, status: 'breakeven' }),
      trade({ id: 'o1', pnl: 999, status: 'open' }),
    ]

    const stats = computeStats(trades)

    expect(stats.total).toBe(5)
    expect(stats.closed).toBe(4)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
    expect(stats.breakeven).toBe(1)
    expect(stats.winRate).toBe(50)
    expect(stats.totalPnl).toBe(75)
    expect(stats.profitFactor).toBe(2)
    expect(stats.bestTrade).toBe(100)
    expect(stats.worstTrade).toBe(-75)
    expect(stats.totalPips).toBe(7.5)
    expect(stats.totalPipsWon).toBe(15)
    expect(stats.totalPipsLost).toBe(7.5)
    expect(stats.avgWinPips).toBe(7.5)
    expect(stats.avgLossPips).toBe(-7.5)
    expect(stats.bestTradePips).toBe(10)
    expect(stats.worstTradePips).toBe(-7.5)
    expect(stats.longs).toBe(4)
    expect(stats.longsWon).toBe(2)
    expect(stats.totalLots).toBe(4)
  })

  it('does not count breakeven trades as losses in pair breakdowns', () => {
    const rows = groupByPairDetailed([
      trade({ id: 'w1', pnl: 100, status: 'win' }),
      trade({ id: 'b1', pnl: 0, status: 'breakeven' }),
      trade({ id: 'l1', pnl: -50, status: 'loss' }),
    ])

    expect(rows[0]).toMatchObject({ trades: 3, wins: 1, losses: 1 })
  })

  it('returns safe empty values and formats no-loss profit factor', () => {
    expect(computeStats([])).toMatchObject({
      bestTrade: 0,
      worstTrade: 0,
      profitFactor: 0,
    })

    const noLosses = computeStats([
      trade({ id: 'w1', pnl: 100, status: 'win' }),
      trade({ id: 'b1', pnl: 0, status: 'breakeven' }),
    ])

    expect(noLosses.profitFactor).toBe(Infinity)
    expect(formatProfitFactor(noLosses.profitFactor)).toBe('∞')
  })

  it('groups daily P&L by the local close date', () => {
    const rows = dailyPnl([
      trade({ id: 'd1', pnl: 25, closedAt: new Date(2026, 0, 3, 23, 30) }),
      trade({ id: 'd2', pnl: -10, closedAt: new Date(2026, 0, 3, 8) }),
    ])

    expect(rows).toEqual([{ date: '2026-01-03', pnl: 15, trades: 2 }])
  })
})
