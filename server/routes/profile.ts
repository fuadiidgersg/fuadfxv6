import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single()

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    res.json(data ?? { id: req.user!.id, email: req.user!.email })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ ...req.body, id: req.user!.id, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
