import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('profit, symbol, type, open_time, close_time, status')
      .eq('user_id', req.user!.id)

    if (error) return res.status(500).json({ error: error.message })

    const closedTrades = trades.filter((t) => t.status !== 'open')
    const totalTrades = closedTrades.length
    const wins = closedTrades.filter((t) => t.profit > 0)
    const losses = closedTrades.filter((t) => t.profit < 0)
    const netProfit = closedTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0)
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0

    res.json({ totalTrades, netProfit, winRate, profitFactor, wins: wins.length, losses: losses.length, avgWin, avgLoss })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/equity-curve', async (req: AuthRequest, res) => {
  try {
    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('profit, close_time')
      .eq('user_id', req.user!.id)
      .neq('status', 'open')
      .order('close_time', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    let running = 0
    const curve = trades.map((t) => {
      running += t.profit ?? 0
      return { date: t.close_time, equity: parseFloat(running.toFixed(2)) }
    })

    res.json(curve)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
