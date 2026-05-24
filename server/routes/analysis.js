import { Router } from 'express'
import { requireAuth } from '@clerk/express'
import { PrismaClient } from '@prisma/client'
import { analyzeLog } from '../lib/analyzeLog.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/analyze  — SSE stream: status events then a final result event
router.post('/analyze', requireAuth(), async (req, res) => {
  const { userId } = req.auth
  const { logData, scenarioId } = req.body

  if (!logData || typeof logData !== 'string') {
    return res.status(400).json({ error: 'logData is required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)

  try {
    const { result, fromCache } = await analyzeLog(logData, scenarioId, (text) => {
      send({ type: 'status', text })
    })

    // Persist to history
    try {
      await prisma.analysis.create({
        data: {
          userId,
          scenarioId: scenarioId || null,
          inputSnippet: logData.slice(0, 200),
          summary: result.summary || '',
          severityScore: result.severityScore ?? null,
          result,
          fromCache,
        },
      })
    } catch (dbErr) {
      console.error('[NERVE] Failed to save history:', dbErr.message)
    }

    send({ type: 'result', result, fromCache })
  } catch (err) {
    console.error('[NERVE] Analysis error:', err.message)
    send({ type: 'error', message: err.message })
  } finally {
    res.end()
  }
})

// GET /api/history  — list of past analyses for the current user
router.get('/history', requireAuth(), async (req, res) => {
  const { userId } = req.auth
  try {
    const entries = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        scenarioId: true,
        inputSnippet: true,
        summary: true,
        severityScore: true,
        fromCache: true,
        createdAt: true,
      },
    })
    res.json(entries)
  } catch (err) {
    console.error('[NERVE] History fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// GET /api/history/:id  — full result for a specific analysis
router.get('/history/:id', requireAuth(), async (req, res) => {
  const { userId } = req.auth
  try {
    const entry = await prisma.analysis.findFirst({
      where: { id: req.params.id, userId },
    })
    if (!entry) return res.status(404).json({ error: 'Not found' })
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry' })
  }
})

// DELETE /api/history/:id
router.delete('/history/:id', requireAuth(), async (req, res) => {
  const { userId } = req.auth
  try {
    await prisma.analysis.deleteMany({ where: { id: req.params.id, userId } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' })
  }
})

export default router
