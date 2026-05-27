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

  // Always allow Vercel preview + production deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true

  // Always allow localhost in any port (dev)
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true

  // Allow Replit dev domains
  if (/\.replit\.dev$/.test(origin)) return true

  return false
}

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/trades', tradesRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/journals', journalsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/profile', profileRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default app
