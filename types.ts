
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum Emotion {
  NEUTRAL = 'Neutral',
  CONFIDENT = 'Confident',
  ANXIOUS = 'Anxious',
  FOMO = 'FOMO',
  FRUSTRATED = 'Frustrated',
  GREEDY = 'Greedy'
}

export enum AccountCategory {
  BROKER = 'Personal Broker',
  PROP_FIRM = 'Prop Firm'
}

export interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  accountNumber: string;
  server: string;
  type: string; // e.g. 'Evaluation', 'Funded', 'Standard'
  category: AccountCategory;
  currency: string;
  initialBalance: number;
  createdAt: string;
  // Prop Firm Rules (Optional)
  profitTarget?: number;
  maxDrawdownLimit?: number;
  dailyLossLimit?: number;
}

export interface Trade {
  id: string;
  ticket: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  type: TradeType;
  lots: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  profit: number;
  balanceAfter: number;
  accountId: string;
  tags: string[];
  notes: string;
  emotion?: Emotion;
  status: TradeStatus;
}

export interface DashboardStats {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageR: number;
  expectancy: number;
  recoveryFactor: number;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  category: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'low' | 'medium' | 'high';
  actual?: string;
  forecast?: string;
  previous?: string;
}
