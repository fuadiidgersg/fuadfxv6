import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const EXTENDED_TRADE_COLUMNS = [
  'direction',
  'pips',
  'r_multiple',
  'risk_amount',
  'session',
  'timeframe',
  'trade_outcome',
  'account_name',
  'mistakes',
  'lessons',
]

function isMissingColumnError(error: any) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  return (
    text.includes('42703') ||
    text.includes('pgrst204') ||
    text.includes('could not find') ||
    text.includes('does not exist') ||
    text.includes('schema cache')
  )
}

function finiteNumber(value: unknown, fallback: number | null) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function isoDate(value: unknown, fallback = new Date()) {
  const date = value ? new Date(value as any) : fallback
  return Number.isFinite(date.getTime())
    ? date.toISOString()
    : fallback.toISOString()
}

function stripExtendedTradeColumns(row: Record<string, any>) {
  const next = { ...row }
  for (const column of EXTENDED_TRADE_COLUMNS) delete next[column]
  return next
}

async function insertTradeRows(rows: Record<string, any>[]) {
  const { error } = await supabaseAdmin.from('trades').insert(rows)
  if (!error) return { error: null }
  if (!isMissingColumnError(error)) return { error }

  return supabaseAdmin
    .from('trades')
    .insert(rows.map(stripExtendedTradeColumns))
}

function fromRow(row: any) {
  const pnl = parseFloat(row.profit) || 0
  const outcome =
    row.trade_outcome ||
    (row.status === 'open'
      ? 'open'
      : pnl > 0
        ? 'win'
        : pnl < 0
          ? 'loss'
          : 'breakeven')

  return {
    id: row.id as string,
    pair: (row.symbol ?? '') as string,
    direction: (row.direction ?? (row.type === 'buy' ? 'long' : 'short')) as 'long' | 'short',
    entry: parseFloat(row.open_price) || 0,
    exit: parseFloat(row.close_price) || 0,
    stopLoss: row.stop_loss != null ? parseFloat(row.stop_loss) : undefined,
    takeProfit: row.take_profit != null ? parseFloat(row.take_profit) : undefined,
    lotSize: parseFloat(row.lots) || 0,
    pnl,
    pips: row.pips != null ? parseFloat(row.pips) : 0,
    rMultiple: row.r_multiple != null ? parseFloat(row.r_multiple) : 0,
    riskAmount: row.risk_amount != null ? parseFloat(row.risk_amount) : undefined,
    strategy: (row.strategy || 'Unassigned') as string,
    session: (row.session || 'London') as string,
    status: outcome as string,
    openedAt: row.open_time ? new Date(row.open_time).toISOString() : new Date().toISOString(),
    closedAt: (row.close_time || row.open_time)
      ? new Date(row.close_time || row.open_time).toISOString()
      : new Date().toISOString(),
    account: (row.account_name || '') as string,
    accountId: (row.account_id || undefined) as string | undefined,
    tags: (row.tags ?? []) as string[],
    notes: (row.notes || undefined) as string | undefined,
    emotion: (row.emotion || undefined) as string | undefined,
    timeframe: (row.timeframe || undefined) as string | undefined,
    mistakes: (row.mistakes || undefined) as string | undefined,
    lessons: (row.lessons || undefined) as string | undefined,
    screenshotUrl: (row.screenshot_url || undefined) as string | undefined,
  }
}

function toRow(trade: any, userId: string) {
  const direction = trade.direction === 'short' ? 'short' : 'long'
  const openedAt = isoDate(trade.openedAt)
  const closedAt = isoDate(trade.closedAt, new Date(openedAt))
  const pnl = finiteNumber(trade.pnl, 0) ?? 0
  const status =
    trade.status === 'open'
      ? 'open'
      : pnl > 0
        ? 'win'
        : pnl < 0
          ? 'loss'
          : 'breakeven'

  return {
    user_id: userId,
    symbol: String(trade.pair ?? '').trim(),
    direction,
    type: direction === 'long' ? 'buy' : 'sell',
    lots: finiteNumber(trade.lotSize, 0),
    open_price: finiteNumber(trade.entry, null),
    close_price: finiteNumber(trade.exit, null),
    open_time: openedAt,
    close_time: closedAt,
    profit: pnl,
    stop_loss: finiteNumber(trade.stopLoss, null),
    take_profit: finiteNumber(trade.takeProfit, null),
    status: status === 'open' ? 'open' : 'closed',
    trade_outcome: status,
    notes: trade.notes ?? null,
    emotion: trade.emotion ?? null,
    strategy: trade.strategy ?? null,
    tags: Array.isArray(trade.tags) ? trade.tags : [],
    screenshot_url: trade.screenshotUrl ?? null,
    pips: finiteNumber(trade.pips, null),
    r_multiple: finiteNumber(trade.rMultiple, null),
    risk_amount: finiteNumber(trade.riskAmount, null),
    session: trade.session ?? null,
    timeframe: trade.timeframe ?? null,
    mistakes: trade.mistakes ?? null,
    lessons: trade.lessons ?? null,
    account_name: trade.account ?? null,
    account_id: trade.accountId ?? null,
  }
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    let query = supabaseAdmin
      .from('trades')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('close_time', { ascending: false })

    if (req.query.accountId) {
      query = query.eq('account_id', req.query.accountId as string)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json((data ?? []).map(fromRow))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const { trades, accountId } = req.body as { trades: any[]; accountId: string }
    if (!Array.isArray(trades) || !accountId) {
      return res.status(400).json({ error: 'trades array and accountId required' })
    }

    const { data: existing } = await supabaseAdmin
      .from('trades')
      .select('symbol, type, open_time, close_time, profit')
      .eq('user_id', req.user!.id)
      .eq('account_id', accountId)

    const existingKeys = new Set(
      (existing ?? []).map(
        (t: any) =>
          `${t.symbol}|${t.type}|${new Date(t.open_time).getTime()}|${new Date(t.close_time).getTime()}|${t.profit}`
      )
    )

    const toInsert = trades
      .map((t) => ({ ...toRow(t, req.user!.id), account_id: accountId }))
      .filter((t) => t.symbol && (t.type === 'buy' || t.type === 'sell'))
      .filter((t) => {
        const key = `${t.symbol}|${t.type}|${new Date(t.open_time).getTime()}|${new Date(t.close_time).getTime()}|${t.profit}`
        return !existingKeys.has(key)
      })

    const duplicates = trades.length - toInsert.length

    if (toInsert.length === 0) {
      return res.json({ added: 0, duplicates })
    }

    // Insert in chunks of 500 to avoid PostgREST row limits and request timeouts
    const CHUNK_SIZE = 500
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE)
      const { error } = await insertTradeRows(chunk)
      if (error) return res.status(400).json({ error: error.message })
    }

    res.status(201).json({ added: toInsert.length, duplicates })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const row = toRow(req.body, req.user!.id)
    const { data, error } = await supabaseAdmin
      .from('trades')
      .insert(row)
      .select()
      .single()
    if (error && isMissingColumnError(error)) {
      const fallback = await supabaseAdmin
        .from('trades')
        .insert(stripExtendedTradeColumns(row))
        .select()
        .single()
      if (fallback.error) {
        return res.status(400).json({ error: fallback.error.message })
      }
      return res.status(201).json(fromRow(fallback.data))
    }
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(fromRow(data))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/bulk', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' })
    }
    const { error } = await supabaseAdmin
      .from('trades')
      .delete()
      .in('id', ids)
      .eq('user_id', req.user!.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ deleted: ids.length })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const row = toRow(req.body, req.user!.id)
    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.json(fromRow(data))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('trades')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
    if (error) return res.status(400).json({ error: error.message })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
