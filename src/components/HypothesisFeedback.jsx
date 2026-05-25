import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

export default function HypothesisFeedback({ hypotheses, analysisId, confirmedIndex, onConfirm }) {
  const { getToken } = useAuth()
  const [selected, setSelected] = useState(confirmedIndex ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(confirmedIndex != null)

  const handleConfirm = async () => {
    if (selected === null || saving) return
    setSaving(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/history/${analysisId}/confirm`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: selected }),
      })
      if (res.ok) {
        setSaved(true)
        onConfirm?.(selected)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!hypotheses?.length || !analysisId) return null

  return (
    <div className="mt-4 rounded-lg p-3 animate-spring-in"
      style={{ background: 'rgb(var(--c-panel))', border: '1px solid rgb(var(--c-border))' }}>
      <p className="text-[9px] font-display font-semibold tracking-[0.2em] text-nerve-mutedBright mb-2">
        POST-INCIDENT · CONFIRM ROOT CAUSE
      </p>

      {saved ? (
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="rgb(var(--c-success))" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[11px] font-mono" style={{ color: 'rgb(var(--c-success))' }}>
            Confirmed: {hypotheses[selected]?.title?.slice(0, 50) || `Hypothesis ${selected + 1}`}
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {hypotheses.map((h, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150"
              style={{
                background: selected === i ? 'rgb(var(--c-accent) / 0.1)' : 'transparent',
                border: `1px solid ${selected === i ? 'rgb(var(--c-accent) / 0.35)' : 'rgb(var(--c-border))'}`,
              }}
            >
              <div
                className="flex-shrink-0 w-3.5 h-3.5 rounded-full border transition-all duration-150"
                style={{
                  borderColor: selected === i ? 'rgb(var(--c-accent))' : 'rgb(var(--c-border-bright))',
                  background: selected === i ? 'rgb(var(--c-accent))' : 'transparent',
                  boxShadow: selected === i ? '0 0 6px rgb(var(--c-accent) / 0.4)' : 'none',
                }}
              />
              <span className="text-[10px] font-mono text-nerve-textDim line-clamp-1">
                {h.title?.slice(0, 50) || `Hypothesis ${i + 1}`}
              </span>
            </button>
          ))}
          <button
            onClick={handleConfirm}
            disabled={selected === null || saving}
            className="mt-1 w-full py-1.5 rounded text-[10px] font-display font-bold tracking-wider transition-all duration-150"
            style={{
              background: selected !== null ? 'rgb(var(--c-success) / 0.15)' : 'rgb(var(--c-panel-raised))',
              border: `1px solid ${selected !== null ? 'rgb(var(--c-success) / 0.4)' : 'rgb(var(--c-border))'}`,
              color: selected !== null ? 'rgb(var(--c-success))' : 'rgb(var(--c-muted))',
              opacity: selected === null ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Confirm Root Cause'}
          </button>
        </div>
      )}
    </div>
  )
}
