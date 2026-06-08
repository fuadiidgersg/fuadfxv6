import cors from 'cors'
import express from 'express'
import accountsRouter from './routes/accounts'
import analyticsRouter from './routes/analytics'
import journalsRouter from './routes/journals'
import profileRouter from './routes/profile'
import tradesRouter from './routes/trades'

const app = express()

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true // same-origin / server-to-server

  // Explicit whitelist from env (comma-separated)
  const envOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (envOrigins.includes(origin)) return true

  const isProduction = process.env.NODE_ENV === 'production'

  // Local and Replit origins are for development only. Production origins must
  // be explicitly listed in FRONTEND_URL, comma-separated when needed.
  if (!isProduction && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return true

  if (!isProduction && /^https:\/\/[a-z0-9-]+\.replit\.dev$/.test(origin)) {
    return true
  }

  return false
}

app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  next()
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

// Health check — respond on both paths (Render uses /api/health, plain clients use /health)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes mounted at root so VITE_API_URL = 'https://fuadfx-api.onrender.com' works in prod
// (Vite dev proxy strips the leading /api prefix before forwarding to this server)
app.use('/trades', tradesRouter)
app.use('/accounts', accountsRouter)
app.use('/journals', journalsRouter)
app.use('/analytics', analyticsRouter)
app.use('/profile', profileRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default app
