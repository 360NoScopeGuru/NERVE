// Strip markdown formatting characters from a string
function clean(s) {
  return s
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()
}

// Detect if a line is a section header containing a keyword
function isHeader(line, keyword) {
  const t = line.trim().replace(/[*#`_|]/g, ' ').replace(/\s+/g, ' ').trim()
  return new RegExp(`^${keyword}`, 'i').test(t) && t.length < 120 && !t.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
}

// Find line index of first header matching keyword
function findHeader(lines, keyword) {
  for (let i = 0; i < lines.length; i++) {
    if (isHeader(lines[i], keyword)) return i
  }
  return -1
}

// Extract lines belonging to a section (between its header and the next known header)
function sectionLines(lines, startIdx, nextHeaders) {
  if (startIdx < 0) return []
  const end = nextHeaders
    .filter(i => i > startIdx)
    .reduce((min, i) => Math.min(min, i), lines.length)
  return lines.slice(startIdx + 1, end)
}

export function parseNerveResponse(raw) {
  const result = { summary: '', timeline: [], hypotheses: [], fixSteps: [], raw }
  const lines = raw.split('\n')

  // ── Locate section headers ──────────────────────────────────────────────────
  const timelineIdx   = findHeader(lines, 'TIMELINE')
  const hypothesesIdx = findHeader(lines, 'HYPOTHESES')
  const fixIdx        = findHeader(lines, 'FIX\\s*STEPS')
  const allHeaders    = [timelineIdx, hypothesesIdx, fixIdx].filter(i => i >= 0)

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  const firstHeader = allHeaders.length ? Math.min(...allHeaders) : lines.length
  for (let i = 0; i < firstHeader; i++) {
    const t = lines[i].trim()
    if (!t) continue
    // Strip label prefixes like "SUMMARY:", "**Summary**:", "Summary Sentence:"
    const stripped = t
      .replace(/^\*?\*?Summary[^:*]*\*?\*?:\s*/i, '')
      .replace(/^\*\*/g, '').replace(/\*\*$/g, '')
      .trim()
    if (stripped.length > 10) { result.summary = stripped; break }
  }

  // ── TIMELINE ────────────────────────────────────────────────────────────────
  const timelineBody = sectionLines(lines, timelineIdx, [hypothesesIdx, fixIdx].filter(i => i >= 0))

  for (const line of timelineBody) {
    let t = line.trim()
    if (!t || t.length < 5) continue

    // Strip list/number prefix and bold
    t = t.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').replace(/`/g, '').trim()
    if (!t || t.length < 5) continue

    // New format: "timestamp | event"
    let m = t.match(/^([^|]{5,40}?)\s*\|\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1].trim(), event: m[2].trim() }); continue }

    // ISO timestamp at start, any separator: "2026-...Z - event" or "2026-...Z: event"
    m = t.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s,]*)\s*[-–—:]\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1], event: m[2].trim() }); continue }

    // Short time "HH:MM:SS - event"
    m = t.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[-–—:]\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1], event: m[2].trim() }); continue }

    // Timestamp embedded anywhere in the line
    m = t.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s,]*)/)
    if (m) {
      const after = t.slice(m.index + m[1].length).replace(/^\s*[-–—:]\s*/, '').trim()
      result.timeline.push({ time: m[1], event: after || t }); continue
    }

    result.timeline.push({ time: '', event: t })
  }

  // ── HYPOTHESES ──────────────────────────────────────────────────────────────
  const hypoBody = sectionLines(lines, hypothesesIdx, [fixIdx].filter(i => i >= 0))

  // Detect table format (Scenario A sometimes returns a markdown table)
  const isTable = hypoBody.some(l => l.trim().startsWith('|') && l.includes('|') && l.split('|').length >= 4)

  if (isTable) {
    // Parse markdown table rows
    for (const line of hypoBody) {
      const t = line.trim()
      if (!t.startsWith('|')) continue
      if (t.replace(/[-|:\s]/g, '').length === 0) continue // separator row
      const cells = t.split('|').map(c => clean(c)).filter(Boolean)
      if (cells.length < 2) continue
      // Skip header row
      if (/title|hypothesis|strength/i.test(cells[0])) continue
      const strengthMatch = (cells[1] || '').match(/\b(HIGH|MED(?:IUM)?|LOW)\b/i)
      const s = strengthMatch?.[1]?.toUpperCase()
      result.hypotheses.push({
        title: cells[0] || '',
        strength: s === 'MEDIUM' ? 'MED' : (s || 'MED'),
        explanation: cells[2] || '',
        evidence: cells[3] ? [cells[3].replace(/`/g, '').trim()] : [],
      })
    }
  } else {
    // Split into per-hypothesis chunks
    // Chunk starts: "HYPOTHESIS N" (new format) OR "N. " (old numbered format)
    const chunks = []
    let cur = []
    for (const line of hypoBody) {
      const t = line.trim()
      const isNewChunk =
        /^HYPOTHESIS\s+\d+/i.test(t) ||
        (/^\d+\.\s/.test(t) && !cur.some(l =>
          /^TITLE:|^STRENGTH:|^EXPLANATION:|^EVIDENCE:/i.test(l.trim())
        ))
      if (isNewChunk && cur.length) { chunks.push(cur); cur = [line] }
      else cur.push(line)
    }
    if (cur.length) chunks.push(cur)

    for (const chunk of chunks) {
      const hyp = { title: '', strength: 'MED', explanation: '', evidence: [] }
      let inEvidence = false
      let titleSet = false

      for (const rawLine of chunk) {
        const t = rawLine.trim()
        if (!t) continue

        // Chunk header — skip
        if (/^HYPOTHESIS\s+\d+\s*$/i.test(t)) continue

        // TITLE: field — handles:
        //   "HYPOTHESIS 1 TITLE: text"  (model puts it all on one line)
        //   "TITLE: text"               (separate line)
        //   "1. **Title:** text"        (old numbered+bold format)
        if (!titleSet) {
          const titleM =
            t.match(/^HYPOTHESIS\s+\d+\s+TITLE:\s*(.+)/i) ||
            t.match(/^TITLE:\s*(.+)/i) ||
            t.match(/^\d+\.\s*\*?\*?(?:Title[:\s*]*\*?\*?)?\s*(.+)/i)
          if (titleM) {
            hyp.title = clean(titleM[1]).replace(/^Title:\s*/i, '').trim()
            titleSet = true; inEvidence = false; continue
          }
        }

        // STRENGTH:
        const sm = t.match(/(?:^STRENGTH:|Signal\s+Strength[^:]*:)\s*\*?\*?\s*(HIGH|MED(?:IUM)?|LOW)/i)
        if (sm) {
          const s = sm[1].toUpperCase()
          hyp.strength = s === 'MEDIUM' ? 'MED' : s
          inEvidence = false; continue
        }

        // EXPLANATION:
        const em = t.match(/(?:^EXPLANATION:|Explanation[^:]*:)\s*\*?\*?\s*(.+)/i)
        if (em) {
          hyp.explanation = clean(em[1])
          inEvidence = false; continue
        }

        // EVIDENCE: (new format — each evidence on its own prefixed line)
        if (/^EVIDENCE:\s*/i.test(t)) {
          const ev = clean(t.replace(/^EVIDENCE:\s*/i, '').replace(/`/g, ''))
          if (ev.length > 5) hyp.evidence.push(ev)
          continue
        }

        // Supporting log lines header (old format)
        if (/Supporting\s+(Log\s+)?Lines?|Supporting\s+Logs?/i.test(t) && !t.match(/\d{4}-\d{2}/)) {
          inEvidence = true; continue
        }

        if (inEvidence) {
          const ev = clean(t.replace(/^[-*•]\s*/, '').replace(/`/g, ''))
          const skip = /^\*(None|Indirect|Inferred|Implied|not directly)/i.test(ev) ||
                       ev.length < 6 ||
                       /^\(Could|Implication:/i.test(ev)
          if (!skip) hyp.evidence.push(ev)
        }
      }

      if (hyp.title || hyp.explanation) result.hypotheses.push(hyp)
    }
  }

  // ── FIX STEPS ───────────────────────────────────────────────────────────────
  const fixBody = sectionLines(lines, fixIdx, [])

  for (const line of fixBody) {
    let t = line.trim()
    if (!t || t.length < 5) continue
    if (t.startsWith('```')) continue // skip code fence markers

    // Only take top-level lines (numbered or lettered), skip deeply-nested sub-bullets
    // A line is top-level if it starts with a digit+dot, or a letter+dot, or a dash at col 0
    const isTopLevel =
      /^\d+\./.test(t) ||
      /^[a-zA-Z]\./.test(t) ||
      /^[-*•]/.test(t)
    // Skip if it's an indented sub-bullet (original line starts with spaces/tab before bullet)
    const isIndented = /^[\t ][\t ]+[-*•]/.test(line) || /^[\t ]{4,}/.test(line)
    if (isIndented) continue

    t = t
      .replace(/^\d+\.\s*/, '')
      .replace(/^[a-zA-Z]\.\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^\*\*[^*]+\*\*:?\s*/, '') // strip bold label prefix
      .replace(/\*\*/g, '')
      .trim()
    // Keep backticks — FixSteps component renders them as inline code

    if (t.length > 5) result.fixSteps.push(t)
  }

  return result
}
