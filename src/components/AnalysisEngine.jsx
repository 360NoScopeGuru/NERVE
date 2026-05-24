import { NERVE_SYSTEM_PROMPT } from '../constants/systemPrompt'
import { SCENARIO_A_FALLBACK, SCENARIO_B_FALLBACK } from '../constants/fixtures'
import { parseNerveResponse } from '../utils/responseParser'

const API_URL = '/nvidia-api/v1/chat/completions'
const PRIMARY_MODEL   = 'nvidia/llama-3.3-nemotron-super-49b-v1'
const FALLBACK_MODEL  = 'meta/llama-3.1-8b-instruct'
const FALLBACKS = { A: SCENARIO_A_FALLBACK, B: SCENARIO_B_FALLBACK }

const FORMATTER_PROMPT = `You are a JSON formatter. Convert the following SRE incident analysis into this exact JSON structure with no markdown, no extra text, only valid JSON:
{
  "summary": "string",
  "timeline": [{ "time": "string", "event": "string" }],
  "hypotheses": [{
    "title": "string",
    "signal": "HIGH",
    "explanation": "string",
    "evidence": ["string"]
  }],
  "fixSteps": ["string"]
}`

async function callModel(model, messages, timeoutMs) {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY
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
      body: JSON.stringify({ model, max_tokens: 1024, messages }),
    })
    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      console.error('[NERVE]', model, 'error', res.status, body)
      throw new Error(`API ${res.status}`)
    }

    const data = await res.json()
    console.info('[NERVE]', model, {
      finish_reason: data.choices?.[0]?.finish_reason,
      tokens: data.usage?.completion_tokens,
      length: data.choices?.[0]?.message?.content?.length,
    })

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
  // Strip markdown code fences if present
  const inner = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  const match = inner.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in formatter output')
  return JSON.parse(match[0])
}

function normalise(parsed, rawText) {
  return {
    summary: parsed.summary || '',
    timeline: (parsed.timeline || []).map(e => ({
      time: e.time || '',
      event: e.event || '',
    })),
    hypotheses: (parsed.hypotheses || []).map(h => ({
      title: h.title || '',
      strength: h.signal || h.strength || 'MED', // accept either key
      explanation: h.explanation || '',
      evidence: Array.isArray(h.evidence) ? h.evidence : [],
    })),
    fixSteps: parsed.fixSteps || [],
    raw: rawText,
  }
}

export async function runAnalysis(logData, scenarioId, onStatus) {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY
  if (!apiKey?.startsWith('nvapi-')) {
    throw new Error('NVIDIA API key not configured. Set VITE_NVIDIA_API_KEY in .env')
  }

  const analysisMessages = [
    { role: 'system', content: NERVE_SYSTEM_PROMPT },
    { role: 'user', content: logData },
  ]

  let rawText = null

  // ── STAGE 1: Primary model (Nemotron 49B, 35s) ───────────────────────────
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

  // ── STAGE 2: Fallback model (Llama 8B, 20s) ──────────────────────────────
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

  // Both stages failed → cached result
  if (!rawText) {
    console.warn('[NERVE] Both models failed — loading cached result')
    if (FALLBACKS[scenarioId]) return { result: FALLBACKS[scenarioId], fromCache: true }
    throw new Error('Analysis failed. No cached result available for this scenario.')
  }

  // ── STAGE 3: JSON formatter (Llama 8B, 20s) ──────────────────────────────
  onStatus('Formatting output…')
  try {
    const formatterMessages = [
      { role: 'system', content: FORMATTER_PROMPT },
      { role: 'user', content: rawText },
    ]
    const jsonText = await callModel(FALLBACK_MODEL, formatterMessages, 20000)
    const parsed = extractJSON(jsonText)

    if (!validateResult(parsed)) {
      console.warn('[NERVE] Stage 3 JSON failed validation — falling back to parser')
      throw new Error('JSON validation failed')
    }

    console.info('[NERVE] Stage 3 succeeded — returning structured JSON result')
    return { result: normalise(parsed, rawText), fromCache: false }

  } catch (err) {
    console.warn('[NERVE] Stage 3 failed:', err.message, '— falling back to text parser')

    // Safety net: run the text parser on the raw Stage 1/2 output
    const parsed = parseNerveResponse(rawText)
    if (parsed.hypotheses.length >= 1) {
      return { result: parsed, fromCache: false }
    }

    // Last resort: cached
    if (FALLBACKS[scenarioId]) return { result: FALLBACKS[scenarioId], fromCache: true }
    throw new Error('Stage 3 and text parser both failed. No cached fallback available.')
  }
}
