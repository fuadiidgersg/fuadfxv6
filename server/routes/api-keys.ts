import { randomBytes, createHash } from 'crypto'
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function createToken() {
  return `ffx_live_${randomBytes(32).toString('base64url')}`
}

function fromRow(row: any) {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    name: (row.name ?? 'MT5 Expert Advisor') as string,
    last4: (row.last4 ?? '') as string,
    createdAt: row.created_at as string,
    lastUsedAt: (row.last_used_at ?? null) as string | null,
    revokedAt: (row.revoked_at ?? null) as string | null,
  }
}

async function userOwnsAccount(userId: string, accountId: string) {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const accountId = String(req.query.accountId ?? '').trim()
    if (!accountId) return res.status(400).json({ error: 'accountId required' })

    if (!(await userOwnsAccount(req.user!.id, accountId))) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id,account_id,name,last4,created_at,last_used_at,revoked_at')
      .eq('user_id', req.user!.id)
      .eq('account_id', accountId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    res.json((data ?? []).map(fromRow))
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { accountId, name } = req.body as {
      accountId?: string
      name?: string
    }

    if (!accountId) return res.status(400).json({ error: 'accountId required' })
    if (!(await userOwnsAccount(req.user!.id, accountId))) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const token = createToken()
    const row = {
      user_id: req.user!.id,
      account_id: accountId,
      name: name?.trim() || 'MT5 Expert Advisor',
      token_hash: hashToken(token),
      last4: token.slice(-4),
    }

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert(row)
      .select('id,account_id,name,last4,created_at,last_used_at,revoked_at')
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json({ ...fromRow(data), token })
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .is('revoked_at', null)
      .select('id,account_id,name,last4,created_at,last_used_at,revoked_at')
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json(fromRow(data))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
