function clean(s) {
  return s
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()
}

function isHeader(line, keyword) {
  const t = line.trim().replace(/[*#`_|]/g, ' ').replace(/\s+/g, ' ').trim()
  return new RegExp(`^${keyword}`, 'i').test(t) && t.length < 120 && !t.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
}

function findHeader(lines, keyword) {
  for (let i = 0; i < lines.length; i++) {
    if (isHeader(lines[i], keyword)) return i
  }
  return -1
}

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

  const timelineIdx   = findHeader(lines, 'TIMELINE')
  const hypothesesIdx = findHeader(lines, 'HYPOTHESES')
  const fixIdx        = findHeader(lines, 'FIX\\s*STEPS')
  const allHeaders    = [timelineIdx, hypothesesIdx, fixIdx].filter(i => i >= 0)

  const firstHeader = allHeaders.length ? Math.min(...allHeaders) : lines.length
  for (let i = 0; i < firstHeader; i++) {
    const t = lines[i].trim()
    if (!t) continue
    const stripped = t
      .replace(/^\*?\*?Summary[^:*]*\*?\*?:\s*/i, '')
      .replace(/^\*\*/g, '').replace(/\*\*$/g, '')
      .trim()
    if (stripped.length > 10) { result.summary = stripped; break }
  }

  const timelineBody = sectionLines(lines, timelineIdx, [hypothesesIdx, fixIdx].filter(i => i >= 0))
  for (const line of timelineBody) {
    let t = line.trim()
    if (!t || t.length < 5) continue
    t = t.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').replace(/`/g, '').trim()
    if (!t || t.length < 5) continue
    let m = t.match(/^([^|]{5,40}?)\s*\|\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1].trim(), event: m[2].trim() }); continue }
    m = t.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s,]*)\s*[-–—:]\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1], event: m[2].trim() }); continue }
    m = t.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[-–—:]\s*(.+)$/)
    if (m) { result.timeline.push({ time: m[1], event: m[2].trim() }); continue }
    m = t.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s,]*)/)
    if (m) {
      const after = t.slice(m.index + m[1].length).replace(/^\s*[-–—:]\s*/, '').trim()
      result.timeline.push({ time: m[1], event: after || t }); continue
    }
    result.timeline.push({ time: '', event: t })
  }

  const hypoBody = sectionLines(lines, hypothesesIdx, [fixIdx].filter(i => i >= 0))
  const isTable = hypoBody.some(l => l.trim().startsWith('|') && l.includes('|') && l.split('|').length >= 4)

  if (isTable) {
    for (const line of hypoBody) {
      const t = line.trim()
      if (!t.startsWith('|')) continue
      if (t.replace(/[-|:\s]/g, '').length === 0) continue
      const cells = t.split('|').map(c => clean(c)).filter(Boolean)
      if (cells.length < 2) continue
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
        if (/^HYPOTHESIS\s+\d+\s*$/i.test(t)) continue

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

        const sm = t.match(/(?:^STRENGTH:|Signal\s+Strength[^:]*:)\s*\*?\*?\s*(HIGH|MED(?:IUM)?|LOW)/i)
        if (sm) {
          const s = sm[1].toUpperCase()
          hyp.strength = s === 'MEDIUM' ? 'MED' : s
          inEvidence = false; continue
        }

        const em = t.match(/(?:^EXPLANATION:|Explanation[^:]*:)\s*\*?\*?\s*(.+)/i)
        if (em) { hyp.explanation = clean(em[1]); inEvidence = false; continue }

        if (/^EVIDENCE:\s*/i.test(t)) {
          const ev = clean(t.replace(/^EVIDENCE:\s*/i, '').replace(/`/g, ''))
          if (ev.length > 5) hyp.evidence.push(ev)
          continue
        }

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

  const fixBody = sectionLines(lines, fixIdx, [])
  for (const line of fixBody) {
    let t = line.trim()
    if (!t || t.length < 5) continue
    if (t.startsWith('```')) continue
    const isIndented = /^[\t ][\t ]+[-*•]/.test(line) || /^[\t ]{4,}/.test(line)
    if (isIndented) continue
    t = t
      .replace(/^\d+\.\s*/, '')
      .replace(/^[a-zA-Z]\.\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^\*\*[^*]+\*\*:?\s*/, '')
      .replace(/\*\*/g, '')
      .trim()
    if (t.length > 5) result.fixSteps.push(t)
  }

  return result
}
