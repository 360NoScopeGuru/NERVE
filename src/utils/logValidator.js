const TIMESTAMP_PATTERNS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/,
  /\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/,
  /\d{2}:\d{2}:\d{2}\.\d{3}/,
  /\[\d{4}-\d{2}-\d{2}/,
]

const ERROR_KEYWORDS = [
  /\bERROR\b/i, /\bWARN(ING)?\b/i, /\btimeout\b/i, /\bfailed\b/i,
  /\bexception\b/i, /\bfatal\b/i, /\bcrit(ical)?\b/i, /\bpanic\b/i,
  /\bkilled\b/i, /\b503\b/, /\b500\b/, /\brefused\b/i,
]

export function validateLogs(text) {
  const errors = []
  const lines = text.split('\n').filter(l => l.trim().length > 0)

  if (lines.length < 10) {
    errors.push(`Too few log lines: ${lines.length} found, minimum 10 required`)
  }

  const hasTimestamp = TIMESTAMP_PATTERNS.some(p => p.test(text))
  if (!hasTimestamp) {
    errors.push('No timestamp pattern detected — logs must include timestamps')
  }

  const hasError = ERROR_KEYWORDS.some(p => p.test(text))
  if (!hasError) {
    errors.push('No error signals detected — logs must contain ERROR, WARN, timeout, failed, or similar keywords')
  }

  return { valid: errors.length === 0, errors }
}
