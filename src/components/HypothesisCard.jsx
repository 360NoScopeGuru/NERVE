import { useState } from 'react'

const STRENGTH_CONFIG = {
  HIGH: { filled: 3, color: 'text-nerve-critical', bg: 'bg-nerve-critical', label: 'HIGH', border: 'border-nerve-critical/25', badge: 'bg-nerve-critical/15 text-nerve-critical', glow: true },
  MED:  { filled: 2, color: 'text-nerve-warn',     bg: 'bg-nerve-warn',     label: 'MED',  border: 'border-nerve-warn/30',     badge: 'bg-nerve-warn/15 text-nerve-warn',     glow: false },
  LOW:  { filled: 1, color: 'text-nerve-muted',    bg: 'bg-nerve-muted',    label: 'LOW',  border: 'border-nerve-border',       badge: 'bg-nerve-muted/15 text-nerve-muted',  glow: false },
}

function SignalDots({ strength }) {
  const cfg = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.MED
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className={`w-2 h-2 rounded-full border ${
            n <= cfg.filled
              ? `${cfg.bg} border-transparent`
              : 'bg-transparent border-nerve-muted/40'
          }`}
          style={n <= cfg.filled && cfg.glow ? { boxShadow: '0 0 5px rgba(255,42,42,0.7)' } : undefined}
        />
      ))}
    </div>
  )
}

export default function HypothesisCard({ hypothesis, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STRENGTH_CONFIG[hypothesis.strength] || STRENGTH_CONFIG.MED

  return (
    <div
      className={`rounded border ${cfg.border} bg-nerve-panel transition-all duration-200 overflow-hidden ${cfg.glow ? 'animate-glow-in' : 'animate-slide-up'}`}
      style={{
        animationDelay: `${index * 150}ms`,
        borderLeft: cfg.glow ? '2px solid rgba(255,42,42,0.6)' : undefined,
      }}
    >
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank badge */}
        <div className="flex-shrink-0 w-5 h-5 rounded bg-nerve-border/60 flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-mono font-bold text-nerve-textDim">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-mono font-semibold text-nerve-text leading-tight">
              {hypothesis.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <SignalDots strength={hypothesis.strength} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
          </div>
          <p className="text-xs font-mono text-nerve-textDim leading-relaxed">
            {hypothesis.explanation}
          </p>
          {hypothesis.evidence.length > 0 && (
            <button className="mt-1.5 text-[10px] font-mono text-nerve-accent/70 hover:text-nerve-accent transition-colors flex items-center gap-1">
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {expanded ? 'Hide' : 'Show'} {hypothesis.evidence.length} evidence line{hypothesis.evidence.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Evidence panel */}
      {expanded && hypothesis.evidence.length > 0 && (
        <div className="border-t border-nerve-border/50 bg-black/20 px-3 py-2 space-y-1">
          {hypothesis.evidence.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-nerve-accent/50 text-[10px] font-mono mt-0.5 flex-shrink-0">›</span>
              <code className="text-[11px] font-mono text-nerve-textDim leading-relaxed break-all">{line}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
