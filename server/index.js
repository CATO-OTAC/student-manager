import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import studentsRouter from './routes/students.js'
import sessionsRouter from './routes/sessions.js'
import schedulesRouter from './routes/schedules.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true
    : ['http://localhost:5173', `http://localhost:${PORT}`]
}))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/students', studentsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/schedules', schedulesRouter)

// Serve built React app — priority: env var → project root client/dist → skip
const clientDist =
  process.env.CLIENT_DIST ||
  (existsSync(join(__dirname, '../client/dist')) ? join(__dirname, '../client/dist') : null)

if (clientDist) {
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  process.exit(1)
})
