import type { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'
import {
  getSupabaseConfigError,
  isSupabaseConfigured,
  supabaseAdmin,
} from '../lib/supabase-admin'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
  apiKey?: {
    id: string
    accountId: string
  }
}

function bearerToken(req: Request) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]?.trim() || null
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function authenticateSupabaseToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email }
}

async function authenticateApiKey(token: string) {
  if (!token.startsWith('ffx_')) return null

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id,user_id,account_id,revoked_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (error || !data || data.revoked_at) return null

  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return {
    user: { id: data.user_id as string },
    apiKey: {
      id: data.id as string,
      accountId: data.account_id as string,
    },
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: getSupabaseConfigError() })
  }

  const token = bearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    const user = await authenticateSupabaseToken(token)
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    next()
  } catch (err) {
    res
      .status(503)
      .json({ error: err instanceof Error ? err.message : getSupabaseConfigError() })
  }
}

export async function requireAuthOrApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: getSupabaseConfigError() })
  }

  const token = bearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    const user = await authenticateSupabaseToken(token)
    if (user) {
      req.user = user
      next()
      return
    }

    const apiKeyAuth = await authenticateApiKey(token)
    if (!apiKeyAuth) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = apiKeyAuth.user
    req.apiKey = apiKeyAuth.apiKey
    next()
  } catch (err) {
    res
      .status(503)
      .json({ error: err instanceof Error ? err.message : getSupabaseConfigError() })
  }
}
