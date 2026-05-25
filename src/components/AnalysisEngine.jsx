export async function runAnalysis(logData, scenarioId, onStatus, token) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ logData, scenarioId }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(err.error || err.message || `Server error ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop()

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      const event = JSON.parse(line.slice(6))
      if (event.type === 'status') onStatus(event.text)
      if (event.type === 'result') return { result: event.result, fromCache: event.fromCache, id: event.id }
      if (event.type === 'error') throw new Error(event.message)
    }
  }

  throw new Error('Stream ended without result')
}
