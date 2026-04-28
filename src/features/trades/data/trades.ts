import { faker } from '@faker-js/faker'
import {
  DIRECTIONS,
  PAIRS,
  SESSIONS,
  STRATEGIES,
  type Trade,
} from './schema'

faker.seed(42)

const ACCOUNTS = ['Live FTMO 100k', 'Live IC Markets', 'Demo OANDA']

function pipFactor(pair: string) {
  if (pair.includes('JPY')) return 100
  if (pair.startsWith('XAU')) return 10
  if (pair.startsWith('XAG')) return 100
  return 10000
}

function basePrice(pair: string) {
  switch (pair) {
    case 'EUR/USD':
      return 1.085
    case 'GBP/USD':
      return 1.265
    case 'USD/JPY':
      return 151.4
    case 'AUD/USD':
      return 0.658
    case 'USD/CAD':
      return 1.358
    case 'NZD/USD':
      return 0.602
    case 'USD/CHF':
      return 0.901
    case 'EUR/GBP':
      return 0.857
    case 'EUR/JPY':
      return 164.2
    case 'GBP/JPY':
      return 191.5
    case 'XAU/USD':
      return 2310
    case 'XAG/USD':
      return 27.4
    default:
      return 1
  }
}

export const trades: Trade[] = Array.from({ length: 180 }, (_, i) => {
  const pair = faker.helpers.arrayElement(PAIRS)
  const direction = faker.helpers.arrayElement(DIRECTIONS)
  const strategy = faker.helpers.arrayElement(STRATEGIES)
  const session = faker.helpers.arrayElement(SESSIONS)
  const account = faker.helpers.arrayElement(ACCOUNTS)
  const lotSize = parseFloat(faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }).toFixed(2))

  const price = basePrice(pair)
  const factor = pipFactor(pair)
  const range = price * 0.01

  const entry = parseFloat((price + faker.number.float({ min: -range, max: range, fractionDigits: 5 })).toFixed(5))
  const slDistance = faker.number.float({ min: range * 0.1, max: range * 0.5, fractionDigits: 5 })
  const tpDistance = slDistance * faker.number.float({ min: 1, max: 3, fractionDigits: 2 })
  const stopLoss = parseFloat((direction === 'long' ? entry - slDistance : entry + slDistance).toFixed(5))
  const takeProfit = parseFloat((direction === 'long' ? entry + tpDistance : entry - tpDistance).toFixed(5))

  const win = faker.number.int({ min: 1, max: 100 }) <= 56
  const moveSize = win
    ? faker.number.float({ min: tpDistance * 0.5, max: tpDistance, fractionDigits: 5 })
    : -faker.number.float({ min: slDistance * 0.5, max: slDistance, fractionDigits: 5 })

  const exit = parseFloat((direction === 'long' ? entry + moveSize : entry - moveSize).toFixed(5))
  const priceMove = direction === 'long' ? exit - entry : entry - exit
  const pips = parseFloat((priceMove * factor).toFixed(1))

  const valuePerPip = pair.includes('JPY') ? 8.7 : pair.startsWith('XAU') ? 10 : 10
  const pnl = parseFloat((pips * valuePerPip * lotSize / 10).toFixed(2))
  const rMultiple = parseFloat((priceMove / slDistance).toFixed(2))

  const status = Math.abs(pnl) < 1 ? 'breakeven' : pnl > 0 ? 'win' : 'loss'

  const openedAt = faker.date.between({
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
    to: new Date(),
  })
  const closedAt = new Date(openedAt.getTime() + faker.number.int({ min: 5, max: 60 * 24 }) * 60 * 1000)

  return {
    id: `T-${(1000 + i).toString()}`,
    pair,
    direction,
    entry,
    exit,
    stopLoss,
    takeProfit,
    lotSize,
    pnl,
    pips,
    rMultiple,
    strategy,
    session,
    status: status as Trade['status'],
    openedAt,
    closedAt,
    account,
    tags: faker.helpers.arrayElements(
      ['A+', 'mistake', 'fomo', 'patient', 'late entry', 'perfect', 'overtraded', 'high impact news'],
      faker.number.int({ min: 0, max: 3 })
    ),
    notes: faker.lorem.sentence({ min: 6, max: 14 }),
  }
}).sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime())

export { ACCOUNTS }
