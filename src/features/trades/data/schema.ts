import { z } from 'zod'

export const PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'USD/CHF',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'XAU/USD',
  'XAG/USD',
] as const

export const STRATEGIES = [
  'Breakout',
  'Trend Following',
  'Mean Reversion',
  'Scalping',
  'Swing',
  'News',
  'Range',
  'Smart Money',
] as const

export const SESSIONS = ['Asian', 'London', 'New York', 'Overlap'] as const
export const DIRECTIONS = ['long', 'short'] as const
export const STATUSES = ['win', 'loss', 'breakeven', 'open'] as const
export const TIMEFRAMES = [
  'M1',
  'M5',
  'M15',
  'M30',
  'H1',
  'H4',
  'D1',
  'W1',
] as const
export const EMOTIONS = [
  'disciplined',
  'calm',
  'confident',
  'fomo',
  'revenge',
  'fearful',
  'greedy',
  'tilted',
] as const

export const tradeSchema = z.object({
  id: z.string(),
  pair: z.string(),
  direction: z.enum(DIRECTIONS),
  entry: z.number(),
  exit: z.number(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  lotSize: z.number(),
  pnl: z.number(),
  pips: z.number(),
  rMultiple: z.number(),
  strategy: z.enum(STRATEGIES),
  session: z.enum(SESSIONS),
  status: z.enum(STATUSES),
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date(),
  account: z.string(),
  accountId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  emotion: z.enum(EMOTIONS).optional(),
  mistakes: z.string().optional(),
  lessons: z.string().optional(),
  riskAmount: z.number().optional(),
  screenshotUrl: z.string().optional(),
})

export type Trade = z.infer<typeof tradeSchema>
export type TradePair = string
export type TradeStrategy = (typeof STRATEGIES)[number]
export type TradeSession = (typeof SESSIONS)[number]
export type TradeDirection = (typeof DIRECTIONS)[number]
export type TradeStatus = (typeof STATUSES)[number]
export type TradeTimeframe = (typeof TIMEFRAMES)[number]
export type TradeEmotion = (typeof EMOTIONS)[number]
