import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.split(' ')[1]
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = { id: data.user.id, email: data.user.email }
  next()
}
