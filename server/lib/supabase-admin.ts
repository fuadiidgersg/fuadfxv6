import { createClient } from '@supabase/supabase-js'

// Accept both SUPABASE_URL (Render/production) and VITE_SUPABASE_URL (legacy)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const configuredClient =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export function isSupabaseConfigured() {
  return Boolean(configuredClient)
}

export function getSupabaseConfigError() {
  const missing = [
    !supabaseUrl && 'SUPABASE_URL',
    !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean)

  return `Missing Supabase env vars on Render: ${missing.join(', ')}. Data cannot persist until these are set.`
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!configuredClient) {
        throw new Error(getSupabaseConfigError())
      }

      return configuredClient[prop as keyof typeof configuredClient]
    },
  }
) as typeof configuredClient extends null ? never : NonNullable<typeof configuredClient>
