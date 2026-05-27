#!/usr/bin/env node
/**
 * Sets required environment variables on Render via their API.
 * Reads values from the local shell environment (Replit secrets).
 */

const RENDER_API_KEY          = process.env.RENDER_API_KEY
const SUPABASE_URL            = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!RENDER_API_KEY) { console.error('❌  RENDER_API_KEY not set'); process.exit(1) }
if (!SUPABASE_URL)   { console.error('❌  VITE_SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_SERVICE_ROLE) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const headers = {
  Authorization: `Bearer ${RENDER_API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

async function api(path, options = {}) {
  const res  = await fetch(`https://api.render.com/v1${path}`, { headers, ...options })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Render API ${res.status}: ${JSON.stringify(body)}`)
  return body
}

async function run() {
  // 1 — Find the service
  console.log('🔍  Finding your Render service…')
  const services = await api('/services?limit=20')
  if (!services.length) throw new Error('No services found on this Render account.')

  // Pick the backend service (prefer one with "api" or "fuadfx" in its name)
  let service = services.find(s =>
    /api|fuadfx|backend/i.test(s.service?.name ?? '')
  ) ?? services[0]

  const serviceId   = service.service?.id   ?? service.id
  const serviceName = service.service?.name ?? service.name
  console.log(`    Found service: ${serviceName} (${serviceId})`)

  // 2 — Set env vars
  console.log('⚙️   Setting environment variables on Render…')
  await api(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify([
      { key: 'SUPABASE_URL',            value: SUPABASE_URL },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', value: SUPABASE_SERVICE_ROLE },
    ]),
  })
  console.log('✅  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set on Render.')

  // 3 — Trigger redeploy
  console.log('🚀  Triggering redeploy…')
  await api(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' }),
  })
  console.log('✅  Redeploy triggered — check Render dashboard for progress.')
  console.log(`\n🔗  https://dashboard.render.com/web/${serviceId}`)
}

run().catch(err => {
  console.error('❌  Failed:', err.message)
  process.exit(1)
})
