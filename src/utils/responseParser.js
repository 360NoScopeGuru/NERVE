export function parseNerveResponse(raw) {
  const result = {
    summary: '',
    timeline: [],
    hypotheses: [],
    fixSteps: [],
    raw,
  }

  // Extract summary: first non-empty line before any section header
  const lines = raw.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.match(/^(TIMELINE|HYPOTHESES|FIX STEPS):/i)) {
      result.summary = trimmed
      break
    }
  }

  // Split into sections
  const timelineMatch = raw.match(/TIMELINE:([\s\S]*?)(?=HYPOTHESES:|$)/i)
  const hypothesesMatch = raw.match(/HYPOTHESES:([\s\S]*?)(?=FIX STEPS:|$)/i)
  const fixStepsMatch = raw.match(/FIX STEPS:([\s\S]*?)$/i)

  // Parse timeline entries
  if (timelineMatch) {
    const block = timelineMatch[1].trim()
    const entries = block.split('\n').filter(l => l.trim())
    for (const entry of entries) {
      const cleaned = entry.replace(/^[-*•]\s*/, '').trim()
      if (!cleaned) continue
      // Try to extract timestamp from beginning
      const tsMatch = cleaned.match(/^(\d{2,4}[-:/T]\d{2}[:\d.TZ-]*)\s*[-–:]\s*(.+)$/) ||
                      cleaned.match(/^(\[\d{4}-\d{2}-\d{2}T[\d:.Z]+\])\s+(.+)$/) ||
                      cleaned.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[-–:]\s*(.+)$/)
      if (tsMatch) {
        result.timeline.push({ time: tsMatch[1].replace(/[\[\]]/g, ''), event: tsMatch[2].trim() })
      } else if (cleaned.length > 5) {
        result.timeline.push({ time: '', event: cleaned })
      }
    }
  }

  // Parse hypotheses
  if (hypothesesMatch) {
    const block = hypothesesMatch[1].trim()
    // Split on "Hypothesis" or numbered items or ### headers
    const chunks = block.split(/(?=(?:Hypothesis\s*#?\d+|^\d+\.|^#{1,3}\s))/m)
      .filter(c => c.trim())

    for (const chunk of chunks) {
      const hyp = { title: '', strength: 'MED', explanation: '', evidence: [] }

      // Title: first non-empty line or after "Hypothesis #N:"
      const titleMatch = chunk.match(/(?:Hypothesis\s*#?\d+:?\s*)([^\n]+)/) ||
                         chunk.match(/^#+\s*(.+)/) ||
                         chunk.match(/^\d+\.\s*(.+)/)
      if (titleMatch) hyp.title = titleMatch[1].trim()

      // Strength
      const strengthMatch = chunk.match(/\b(HIGH|MED(?:IUM)?|LOW)\b/i)
      if (strengthMatch) {
        const s = strengthMatch[1].toUpperCase()
        hyp.strength = s === 'MEDIUM' ? 'MED' : s
      }

      // Explanation: sentence after strength or "explanation:" label
      const explMatch = chunk.match(/(?:explanation|summary|description):?\s*([^\n]+)/i) ||
                        chunk.match(/Signal strength[^.]*\.\s*([^.]+\.)/i)
      if (explMatch) {
        hyp.explanation = explMatch[1].trim()
      } else {
        // Fall back: longest sentence in chunk that isn't a log line
        const sentences = chunk.split(/[.!?]/).filter(s => s.trim().length > 20 && !s.match(/\d{2}:\d{2}:\d{2}/))
        if (sentences.length > 0) hyp.explanation = sentences[0].trim() + '.'
      }

      // Evidence: lines that look like log lines (contain timestamps + messages)
      const evidenceLines = chunk.split('\n').filter(l => {
        const t = l.trim()
        return t && (t.match(/\d{2}:\d{2}/) || t.match(/^[-*•"]\s*.*(ERROR|WARN|timeout|failed|exception)/i))
      })
      hyp.evidence = evidenceLines.map(l => l.replace(/^[-*•"]\s*/, '').replace(/"$/, '').trim())

      if (hyp.title || hyp.explanation) result.hypotheses.push(hyp)
    }
  }

  // Parse fix steps
  if (fixStepsMatch) {
    const block = fixStepsMatch[1].trim()
    const steps = block.split('\n')
      .map(l => l.replace(/^\d+\.\s*|^[-*•]\s*/, '').trim())
      .filter(l => l.length > 5)
    result.fixSteps = steps
  }

  return result
}
