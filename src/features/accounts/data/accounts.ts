export type BrokerAccount = {
  id: string
  name: string
  broker: string
  type: 'live' | 'demo' | 'prop'
  currency: 'USD' | 'EUR' | 'GBP'
  leverage: string
  balance: number
  equity: number
  pnl30d: number
  status: 'active' | 'paused' | 'archived'
  number: string
}

export const accounts: BrokerAccount[] = [
  {
    id: 'ACC-001',
    name: 'Main Live',
    broker: 'IC Markets',
    type: 'live',
    currency: 'USD',
    leverage: '1:500',
    balance: 24820.55,
    equity: 25140.12,
    pnl30d: 1840.32,
    status: 'active',
    number: '4012-77831',
  },
  {
    id: 'ACC-002',
    name: 'FTMO Challenge',
    broker: 'FTMO',
    type: 'prop',
    currency: 'USD',
    leverage: '1:100',
    balance: 100000,
    equity: 104320,
    pnl30d: 4320,
    status: 'active',
    number: 'FTMO-22191',
  },
  {
    id: 'ACC-003',
    name: 'Swing EUR',
    broker: 'Pepperstone',
    type: 'live',
    currency: 'EUR',
    leverage: '1:30',
    balance: 8420.0,
    equity: 8390.4,
    pnl30d: -29.6,
    status: 'paused',
    number: 'PP-118-9923',
  },
  {
    id: 'ACC-004',
    name: 'Demo Sandbox',
    broker: 'OANDA',
    type: 'demo',
    currency: 'USD',
    leverage: '1:50',
    balance: 50000,
    equity: 51230,
    pnl30d: 1230,
    status: 'active',
    number: 'DEMO-7741',
  },
  {
    id: 'ACC-005',
    name: 'Scalper GBP',
    broker: 'IG',
    type: 'live',
    currency: 'GBP',
    leverage: '1:30',
    balance: 6200,
    equity: 6112.5,
    pnl30d: -87.5,
    status: 'active',
    number: 'IG-220-A12',
  },
  {
    id: 'ACC-006',
    name: 'Topstep Funded',
    broker: 'Topstep',
    type: 'prop',
    currency: 'USD',
    leverage: '1:50',
    balance: 50000,
    equity: 53210,
    pnl30d: 3210,
    status: 'active',
    number: 'TSF-99812',
  },
  {
    id: 'ACC-007',
    name: 'Old Brokerage',
    broker: 'Exness',
    type: 'live',
    currency: 'USD',
    leverage: '1:200',
    balance: 1850.22,
    equity: 1850.22,
    pnl30d: 0,
    status: 'archived',
    number: 'EX-3320-188',
  },
]
