import { NERVE_SYSTEM_PROMPT } from './systemPrompt.js'
import { parseNerveResponse } from './responseParser.js'
import { FALLBACKS } from './fixtures.js'

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const PRIMARY_MODEL  = 'nvidia/llama-3.3-nemotron-super-49b-v1'
const FALLBACK_MODEL = 'meta/llama-3.1-8b-instruct'

const FORMATTER_PROMPT = `You are a JSON formatter. Convert the following SRE incident analysis into this exact JSON structure with no markdown, no extra text, only valid JSON.

CRITICAL: Include ALL timeline events from the input — do not truncate, skip, or summarize any events.

{
  "summary": "string",
  "timeline": [{ "time": "string", "event": "string" }],
  "hypotheses": [{
    "title": "string",
    "signal": "HIGH",
    "explanation": "string",
    "evidence": ["string"]
  }],
  "fixSteps": ["string"],
  "severityScore": 7,
  "severityReason": "string — one sentence: blast radius, cascade speed, recoverability"
}

Rules:
- timeline: copy EVERY event from the input without omitting any
- severityScore: integer 1–10 (1–3 minor, 4–6 moderate, 7–10 critical) based on blast radius, time to impact, and recoverability
- severityReason: one sentence, e.g. "High blast radius across 4 services with 90s cascade to full outage requiring manual rollback."`

async function callModel(model, messages, timeoutMs, maxTokens = 2048) {
  const apiKey = process.env.NVIDIA_API_KEY
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(API_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
    })
    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      console.error('[NERVE]', model, 'error', res.status, body)
      throw new Error(`API ${res.status}`)
    }

    const data = await res.json()
    const finishReason = data.choices?.[0]?.finish_reason
    console.info('[NERVE]', model, {
      finish_reason: finishReason,
      tokens: data.usage?.completion_tokens,
      length: data.choices?.[0]?.message?.content?.length,
    })
    if (finishReason === 'length') console.warn('[NERVE]', model, 'hit max_tokens — output truncated')

    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response')
    return content
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

function hasAnalysisSignal(text) {
  return (
    text.length > 80 &&
    /(TIMELINE|timeline)/i.test(text) &&
    /(HYPOTHES|hypothes)/i.test(text)
  )
}

function validateResult(obj) {
  return (
    obj &&
    typeof obj.summary === 'string' && obj.summary.length > 5 &&
    Array.isArray(obj.timeline) &&
    Array.isArray(obj.hypotheses) && obj.hypotheses.length >= 1 &&
    Array.isArray(obj.fixSteps)
  )
}

function extractJSON(text) {
  const inner = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  const match = inner.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in formatter output')
  return JSON.parse(match[0])
}

function normalise(parsed, rawText) {
  return {
    summary: parsed.summary || '',
    timeline: (parsed.timeline || []).map(e => ({ time: e.time || '', event: e.event || '' })),
    hypotheses: (parsed.hypotheses || []).map(h => ({
      title: h.title || '',
      strength: h.signal || h.strength || 'MED',
      explanation: h.explanation || '',
      evidence: Array.isArray(h.evidence) ? h.evidence : [],
    })),
    fixSteps: parsed.fixSteps || [],
    severityScore: typeof parsed.severityScore === 'number' ? Math.min(10, Math.max(1, Math.round(parsed.severityScore))) : null,
    severityReason: parsed.severityReason || '',
    raw: rawText,
  }
}

export async function analyzeLog(logData, scenarioId, onStatus) {
  if (!process.env.NVIDIA_API_KEY?.startsWith('nvapi-')) {
    throw new Error('NVIDIA_API_KEY not configured')
  }

  const analysisMessages = [
    { role: 'system', content: NERVE_SYSTEM_PROMPT },
    { role: 'user', content: logData },
  ]

  let rawText = null

  onStatus('Analyzing with Nemotron 49B…')
  try {
    const text = await callModel(PRIMARY_MODEL, analysisMessages, 35000)
    if (hasAnalysisSignal(text)) {
      rawText = text
      console.info('[NERVE] Stage 1 succeeded')
    } else {
      console.warn('[NERVE] Stage 1 response failed signal check — falling back')
    }
  } catch (err) {
    console.warn('[NERVE] Stage 1 failed:', err.message)
  }

  if (!rawText) {
    onStatus('Switching to fallback model…')
    try {
      const text = await callModel(FALLBACK_MODEL, analysisMessages, 20000)
      if (hasAnalysisSignal(text)) {
        rawText = text
        console.info('[NERVE] Stage 2 succeeded')
      } else {
        console.warn('[NERVE] Stage 2 response failed signal check')
      }
    } catch (err) {
      console.warn('[NERVE] Stage 2 failed:', err.message)
    }
  }

  if (!rawText) {
    console.warn('[NERVE] Both models failed — loading cached result')
    if (FALLBACKS[scenarioId]) return { result: FALLBACKS[scenarioId], fromCache: true }
    throw new Error('Analysis failed. No cached result available for this scenario.')
  }

  onStatus('Formatting output…')
  let formatterOutput = null
  try {
    const formatterMessages = [
      { role: 'system', content: FORMATTER_PROMPT },
      { role: 'user', content: rawText },
    ]
    formatterOutput = await callModel(FALLBACK_MODEL, formatterMessages, 20000, 4096)
    const parsed = extractJSON(formatterOutput)

    if (!validateResult(parsed)) {
      console.warn('[NERVE] Stage 3 JSON failed validation — falling back to parser')
      throw new Error('JSON validation failed')
    }

    console.info('[NERVE] Stage 3 succeeded — returning structured JSON result')
    return { result: normalise(parsed, rawText), fromCache: false }

  } catch (err) {
    console.warn('[NERVE] Stage 3 failed:', err.message, '— falling back to text parser')

    const parsed = parseNerveResponse(rawText)

    if (formatterOutput) {
      const scoreMatch = formatterOutput.match(/"severityScore"\s*:\s*(\d+)/)
      const reasonMatch = formatterOutput.match(/"severityReason"\s*:\s*"((?:[^"\\]|\\.)*)"/)
      if (scoreMatch) {
        parsed.severityScore = Math.min(10, Math.max(1, parseInt(scoreMatch[1], 10)))
        parsed.severityReason = reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : ''
        console.info('[NERVE] Salvaged severityScore:', parsed.severityScore)
      }
    }

    if (parsed.hypotheses.length >= 1) return { result: parsed, fromCache: false }
    if (FALLBACKS[scenarioId]) return { result: FALLBACKS[scenarioId], fromCache: true }
    throw new Error('Stage 3 and text parser both failed. No cached fallback available.')
  }
}
