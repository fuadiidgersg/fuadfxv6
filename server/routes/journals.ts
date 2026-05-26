import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function fromRow(row: any) {
  return {
    id: row.id as string,
    accountId: (row.account_id ?? '') as string,
    title: (row.title ?? 'New journal entry') as string,
    body: (row.content ?? '') as string,
    mood: (row.mood ?? 'neutral') as string,
    tags: (row.tags ?? []) as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('journals')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json((data ?? []).map(fromRow))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { accountId, title, body, mood, tags } = req.body
    const { data, error } = await supabaseAdmin
      .from('journals')
      .insert({
        user_id: req.user!.id,
        account_id: accountId || null,
        title: title ?? 'New journal entry',
        content: body ?? '',
        mood: mood ?? 'neutral',
        tags: tags ?? [],
      })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(fromRow(data))
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { title, body, mood, tags } = req.body
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) patch.title = title
    if (body !== undefined) patch.content = body
    if (mood !== undefined) patch.mood = mood
    if (tags !== undefined) patch.tags = tags

    const { data, error } = await supabaseAdmin
      .from('journals')
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
      .from('journals')
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
