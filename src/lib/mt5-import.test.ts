import { describe, expect, it } from 'vitest'
import { parseMT5Html } from './mt5-import'

function positionRow({
  ticket,
  symbol,
  type,
  entry,
  exit,
  profit = 10,
}: {
  ticket: number
  symbol: string
  type: 'buy' | 'sell'
  entry: number
  exit: number
  profit?: number
}) {
  return `
    <tr>
      <td>2026.06.01 09:00:00</td>
      <td>${ticket}</td>
      <td>${symbol}</td>
      <td>${type}</td>
      <td>0.10</td>
      <td>${entry}</td>
      <td>0</td>
      <td>0</td>
      <td>2026.06.01 10:00:00</td>
      <td>${exit}</td>
      <td>0</td>
      <td>0</td>
      <td>${profit}</td>
    </tr>
  `
}

function report(rows: string) {
  return `
    <html>
      <body>
        <table>
          <tr><td>Broker: Test Broker</td></tr>
          <tr><td>Account: 12345678</td></tr>
          <tr><td>Closed Positions</td></tr>
          ${rows}
        </table>
      </body>
    </html>
  `
}

describe('parseMT5Html', () => {
  it('imports every valid closed position instead of stopping at the preview count', () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      positionRow({
        ticket: 1000 + i,
        symbol: 'EURUSD',
        type: 'buy',
        entry: 1.1,
        exit: 1.101,
        profit: 5 + i,
      })
    ).join('')

    const result = parseMT5Html(report(rows))

    expect(result.trades).toHaveLength(8)
    expect(result.totalRows).toBe(8)
    expect(result.skipped).toBe(0)
  })

  it('calculates pips and points by instrument type', () => {
    const result = parseMT5Html(
      report(
        [
          positionRow({
            ticket: 1,
            symbol: 'EURUSD',
            type: 'buy',
            entry: 1.1,
            exit: 1.1015,
          }),
          positionRow({
            ticket: 2,
            symbol: 'USDJPY',
            type: 'sell',
            entry: 150,
            exit: 149.75,
          }),
          positionRow({
            ticket: 3,
            symbol: 'XAUUSD',
            type: 'buy',
            entry: 2300,
            exit: 2301.2,
          }),
          positionRow({
            ticket: 4,
            symbol: 'NAS100',
            type: 'buy',
            entry: 18000,
            exit: 18025,
          }),
        ].join('')
      )
    )

    expect(result.trades.map((trade) => trade.pips)).toEqual([15, 25, 12, 25])
  })

  it('keeps imported trades unassigned unless a default strategy is provided', () => {
    const rows = positionRow({
      ticket: 55,
      symbol: 'EURUSD',
      type: 'buy',
      entry: 1.1,
      exit: 1.101,
    })

    expect(parseMT5Html(report(rows)).trades[0].strategy).toBe('Unassigned')
    expect(
      parseMT5Html(report(rows), { strategy: 'Breakout' }).trades[0].strategy
    ).toBe('Breakout')
  })

  it('extracts account details from the MT5 statement header', () => {
    const rows = positionRow({
      ticket: 77,
      symbol: 'EURUSD',
      type: 'buy',
      entry: 1.1,
      exit: 1.101,
      profit: 20,
    })

    const result = parseMT5Html(`
      <html>
        <body>
          <table>
            <tr><td>Name: Fuad Trader</td></tr>
            <tr><td>Company: Premium Broker Ltd</td></tr>
            <tr><td>Account: 12345678</td></tr>
            <tr><td>Currency: USD</td></tr>
            <tr><td>Leverage: 1:500</td></tr>
            <tr><td>Balance: 10020.00</td></tr>
            <tr><td>Closed Positions</td></tr>
            ${rows}
          </table>
        </body>
      </html>
    `)

    expect(result.accountName).toBe('Fuad Trader')
    expect(result.broker).toBe('Premium Broker Ltd')
    expect(result.account).toBe('12345678')
    expect(result.currency).toBe('USD')
    expect(result.leverage).toBe('1:500')
    expect(result.balance).toBe(10020)
    expect(result.startingBalance).toBe(10000)
  })
})
