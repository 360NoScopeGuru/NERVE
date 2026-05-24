import { NERVE_SYSTEM_PROMPT } from '../constants/systemPrompt'
import { SCENARIO_A_FALLBACK } from '../constants/fixtures'
import { parseNerveResponse } from '../utils/responseParser'

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const TIMEOUT_MS = 15000

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
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`NVIDIA API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw new Error('Empty response from API')

    return { result: parseNerveResponse(raw), fromCache: false }
  } catch (err) {
    clearTimeout(timer)

    // On timeout, fall back to pre-computed result for Scenario A only
    if ((err.name === 'AbortError' || err.message?.includes('abort')) && scenarioId === 'A') {
      return { result: SCENARIO_A_FALLBACK, fromCache: true }
    }

    throw err
  }
}
