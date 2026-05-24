import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import analysisRouter from './routes/analysis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '2mb' }))
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false  // same-origin in prod (Express serves the SPA)
    : 'http://localhost:5173',
  credentials: true,
}))

// Clerk only needed on API routes — keeps static serving unaffected
// Pass VITE_CLERK_PUBLISHABLE_KEY explicitly; @clerk/express looks for CLERK_PUBLISHABLE_KEY by default
app.use('/api', clerkMiddleware({ publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY }), analysisRouter)

// Serve the built SPA in production
if (process.env.NODE_ENV === 'production') {
  const dist = join(__dirname, '../dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
}

// Surface errors as JSON instead of Express's default HTML page
app.use((err, _req, res, _next) => {
  console.error('[NERVE] Unhandled error:', err.message, err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => console.log(`NERVE server on port ${PORT}`))
