import cors from 'cors'
import express from 'express'
import analyticsRouter from './routes/analytics'
import profileRouter from './routes/profile'
import tradesRouter from './routes/trades'

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/trades', tradesRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/profile', profileRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default app
