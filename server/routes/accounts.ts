import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

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

function fromRow(row: any) {
  return {
    id: row.id as string,
    name: row.name as string,
    broker: (row.broker ?? '') as string,
    number: (row.account_number ?? '—') as string,
    type: (row.category ?? 'live') as 'live' | 'demo' | 'prop',
    currency: (row.currency ?? 'USD') as 'USD' | 'EUR' | 'GBP',
    startingBalance: parseFloat(row.starting_balance ?? row.balance ?? 0),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at as string,
  }
}

function inferType(broker: string): string {
  const b = broker.toLowerCase()
  if (/ftmo|topstep|funded|prop|myforex|fundednext|the5ers|e8/.test(b)) return 'prop'
  if (/demo|practice|sandbox/.test(b)) return 'demo'
  return 'live'
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json((data ?? []).map(fromRow))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, broker, number, type, currency, startingBalance } = req.body
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: req.user!.id,
        name,
        broker,
        account_number: number ?? '—',
        category: type ?? 'live',
        currency: currency ?? 'USD',
        balance: startingBalance ?? 0,
        starting_balance: startingBalance ?? 0,
      })
      .select()
      .single()
    if (!error) return res.status(201).json(fromRow(data))
    if (!isMissingColumnError(error)) {
      return res.status(400).json({ error: error.message })
    }

    const { data: legacyData, error: legacyError } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: req.user!.id,
        name,
        broker,
        category: type ?? 'live',
        currency: currency ?? 'USD',
        balance: startingBalance ?? 0,
      })
      .select()
      .single()
    if (legacyError) return res.status(400).json({ error: legacyError.message })
    res.status(201).json(fromRow(legacyData))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/upsert', async (req: AuthRequest, res) => {
  try {
    const { broker, number, nameHint } = req.body
    const safeBroker = (broker ?? '').trim() || 'MT5 Broker'
    const safeNumber = (number ?? '').trim()

    let query = supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('is_archived', false)
      .ilike('broker', safeBroker)
    if (safeNumber) query = (query as any).eq('account_number', safeNumber)

    let { data: existing, error: existingError } = await query.limit(1)
    if (existingError && isMissingColumnError(existingError)) {
      const fallback = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('user_id', req.user!.id)
        .ilike('broker', safeBroker)
        .limit(1)
      existing = fallback.data
      existingError = fallback.error
    }
    if (existingError) {
      return res.status(400).json({ error: existingError.message })
    }

    if (existing && existing.length > 0) {
      return res.json(fromRow(existing[0]))
    }

    const name =
      (nameHint ?? '').trim() ||
      (safeNumber ? `${safeBroker} ${safeNumber}` : safeBroker)
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: req.user!.id,
        name,
        broker: safeBroker,
        account_number: safeNumber || '—',
        category: inferType(safeBroker),
        currency: 'USD',
        balance: 0,
        starting_balance: 0,
      })
      .select()
      .single()
    if (!error) return res.status(201).json(fromRow(data))
    if (!isMissingColumnError(error)) {
      return res.status(400).json({ error: error.message })
    }

    const { data: legacyData, error: legacyError } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: req.user!.id,
        name,
        broker: safeBroker,
        category: inferType(safeBroker),
        currency: 'USD',
        balance: 0,
      })
      .select()
      .single()
    if (legacyError) return res.status(400).json({ error: legacyError.message })
    res.status(201).json(fromRow(legacyData))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, broker, number, type, currency, startingBalance, isArchived } = req.body
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) patch.name = name
    if (broker !== undefined) patch.broker = broker
    if (number !== undefined) patch.account_number = number
    if (type !== undefined) patch.category = type
    if (currency !== undefined) patch.currency = currency
    if (startingBalance !== undefined) {
      patch.starting_balance = startingBalance
      patch.balance = startingBalance
    }
    if (isArchived !== undefined) patch.is_archived = isArchived

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .update(patch)
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
      .from('accounts')
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
