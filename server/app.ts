import cors from 'cors'
import express from 'express'
import accountsRouter from './routes/accounts'
import analyticsRouter from './routes/analytics'
import journalsRouter from './routes/journals'
import profileRouter from './routes/profile'
import tradesRouter from './routes/trades'

const app = express()

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5000', 'http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
