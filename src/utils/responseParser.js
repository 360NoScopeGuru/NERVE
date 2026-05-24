function stripMd(s) {
  return s
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function isSectionHeader(line, keyword) {
  const t = line.trim()
  // Match: "TIMELINE", "### TIMELINE:", "**TIMELINE**:", "**TIMELINE**", etc.
  // The keyword must appear as a word in a short line (not a log line)
  return new RegExp(keyword, 'i').test(t) && t.length < 120 && !t.match(/\d{2}:\d{2}:\d{2}/)
}

export function parseNerveResponse(raw) {
  const result = { summary: '', timeline: [], hypotheses: [], fixSteps: [], raw }

  const lines = raw.split('\n')

  // Find section header line indices
  const sections = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t) continue
    if (isSectionHeader(lines[i], 'TIMELINE')) {
      sections.push({ key: 'TIMELINE', idx: i })
    } else if (isSectionHeader(lines[i], 'HYPOTHESES')) {
      sections.push({ key: 'HYPOTHESES', idx: i })
    } else if (isSectionHeader(lines[i], 'FIX[\\s_]+STEPS')) {
      sections.push({ key: 'FIX', idx: i })
    }
  }

  // Summary: first substantial line before first section header
  const firstSectionIdx = sections[0]?.idx ?? lines.length
  for (let i = 0; i < firstSectionIdx; i++) {
    const t = lines[i].trim()
    if (!t) continue
    // Strip bold label prefix like **Summary**: or **Summary Sentence**:
    const cleaned = t.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim()
    if (cleaned.length > 10) { result.summary = cleaned; break }
    if (stripMd(t).length > 10) { result.summary = stripMd(t); break }
  }

  // Get content lines for a given section key
  function getSectionLines(key) {
    const sec = sections.find(s => s.key === key)
    if (!sec) return []
    const next = sections.find(s => s.idx > sec.idx)
    return lines.slice(sec.idx + 1, next?.idx ?? lines.length)
  }

  // ── TIMELINE ──────────────────────────────────────────────
  for (const line of getSectionLines('TIMELINE')) {
    // Strip numbered list prefix and bold markdown
    let t = line.trim()
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/\*\*/g, '')
      .trim()
    if (!t || t.length < 5) continue

    // ISO timestamp at start: 2026-05-24T03:11:02Z - Description
    const m =
      t.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*)\s*[-–:]\s*(.+)$/) ||
      t.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[-–:]\s*(.+)$/)
    if (m) {
      result.timeline.push({ time: m[1], event: m[2].trim() })
      continue
    }
    // Timestamp embedded mid-line
    const em = t.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*)/)
    if (em) {
      const after = t.slice(em.index + em[1].length).replace(/^\s*[-–:]\s*/, '').trim()
      result.timeline.push({ time: em[1], event: after || t })
      continue
    }
    result.timeline.push({ time: '', event: t })
  }

  // ── HYPOTHESES ────────────────────────────────────────────
  const hypoLines = getSectionLines('HYPOTHESES')
  // Split into per-hypothesis chunks on numbered top-level items (1. / 2. / 3.)
  const chunks = []
  let current = []
  for (const line of hypoLines) {
    if (line.trim().match(/^\d+\.\s/) && current.length) {
      chunks.push(current)
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) chunks.push(current)

  for (const chunk of chunks) {
    const hyp = { title: '', strength: 'MED', explanation: '', evidence: [] }
    let inEvidence = false

    for (let i = 0; i < chunk.length; i++) {
      const raw_line = chunk[i]
      const t = raw_line.trim()
      if (!t) continue

      if (i === 0) {
        // Title — strip number prefix and bold
        hyp.title = stripMd(t.replace(/^\d+\.\s*/, ''))
        continue
      }

      const sm = t.match(/Signal\s*Strength[^:]*:?\*?\*?\s*(HIGH|MED(?:IUM)?|LOW)/i)
      if (sm) {
        const s = sm[1].toUpperCase()
        hyp.strength = s === 'MEDIUM' ? 'MED' : s
        inEvidence = false
        continue
      }

      const em = t.match(/Explanation[^:]*:?\*?\*?\s*(.+)/i)
      if (em) {
        hyp.explanation = stripMd(em[1])
        inEvidence = false
        continue
      }

      if (/Supporting\s+(Log\s+)?Lines?|Evidence/i.test(t)) {
        inEvidence = true
        continue
      }

      if (inEvidence) {
        const ev = stripMd(t.replace(/^[-*•]\s*/, '').replace(/^`|`$/g, ''))
        if (ev && ev.length > 5 && !ev.match(/^(\*None|\(Could|Indirect)/i)) {
          hyp.evidence.push(ev)
        }
      }
    }

    if (hyp.title) result.hypotheses.push(hyp)
  }

  // ── FIX STEPS ─────────────────────────────────────────────
  for (const line of getSectionLines('FIX')) {
    let t = line.trim()
    if (!t || t.length < 5) continue
    t = t
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^\*\*[^*]+\*\*:?\s*/, '') // strip bold label prefix
    t = stripMd(t).trim()
    if (t.length > 5) result.fixSteps.push(t)
  }

  return result
}
