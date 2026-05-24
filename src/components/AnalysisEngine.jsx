import { NERVE_SYSTEM_PROMPT } from '../constants/systemPrompt'
import { SCENARIO_A_FALLBACK, SCENARIO_B_FALLBACK } from '../constants/fixtures'
import { parseNerveResponse } from '../utils/responseParser'

const API_URL = '/nvidia-api/v1/chat/completions'
const TIMEOUT_MS = 1800000 // 30 minutes

const FALLBACKS = { A: SCENARIO_A_FALLBACK, B: SCENARIO_B_FALLBACK }

export async function runAnalysis(logData, scenarioId) {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY

  if (!apiKey || !apiKey.startsWith('nvapi-')) {
    throw new Error('NVIDIA API key not configured. Set VITE_NVIDIA_API_KEY in .env')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(API_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: NERVE_SYSTEM_PROMPT },
          { role: 'user', content: logData },
        ],
      }),
    })

    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      console.error('[NERVE] API error', { status: res.status, body })
      throw new Error(`NVIDIA API error ${res.status}: ${body}`)
    }

    const data = await res.json()
    console.info('[NERVE] API response', {
      id: data.id,
      model: data.model,
      finish_reason: data.choices?.[0]?.finish_reason,
      stop_reason: data.choices?.[0]?.stop_reason,
      usage: data.usage,
      content_length: data.choices?.[0]?.message?.content?.length,
      content_preview: data.choices?.[0]?.message?.content?.slice(0, 200),
    })

    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw new Error('Empty response from API')

    return { result: parseNerveResponse(raw), fromCache: false }
  } catch (err) {
    clearTimeout(timer)

    const isAbort = err.name === 'AbortError' || err.message?.toLowerCase().includes('abort')
    console.error('[NERVE] Fetch error', {
      name: err.name,
      message: err.message,
      isAbort,
      scenarioId,
      hasFallback: scenarioId in FALLBACKS,
    })

    if (isAbort && scenarioId in FALLBACKS) {
      console.info(`[NERVE] Using pre-computed fallback for Scenario ${scenarioId}`)
      return { result: FALLBACKS[scenarioId], fromCache: true }
    }

    throw err
  }
}
