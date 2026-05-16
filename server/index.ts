import express from 'express'
import cors from 'cors'
import tradesRouter from './routes/trades'
import analyticsRouter from './routes/analytics'
import profileRouter from './routes/profile'

const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
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

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`)
})

export default app
