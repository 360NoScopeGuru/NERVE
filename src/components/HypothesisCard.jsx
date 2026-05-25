import { useState } from 'react'

const STRENGTH_CONFIG = {
  HIGH: {
    filled: 3, color: '#ff2a2a', label: 'HIGH',
    border: '1px solid rgba(255,42,42,0.3)',
    badge: { bg: 'rgba(255,42,42,0.12)', color: '#ff2a2a', border: 'rgba(255,42,42,0.3)' },
    glow: true,
  },
  MED: {
    filled: 2, color: '#f59e0b', label: 'MED',
    border: '1px solid rgba(245,158,11,0.25)',
    badge: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    glow: false,
  },
  LOW: {
    filled: 1, color: 'rgb(var(--c-muted))', label: 'LOW',
    border: '1px solid rgb(var(--c-border-bright))',
    badge: { bg: 'rgb(var(--c-panel-raised))', color: 'rgb(var(--c-muted-bright))', border: 'rgb(var(--c-border-bright))' },
    glow: false,
  },
}

function SignalBars({ strength }) {
  const cfg = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.MED
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className="w-[5px] rounded-sm transition-all duration-200"
          style={{
            height: `${n * 33}%`,
            background: n <= cfg.filled ? cfg.color : 'rgb(var(--c-border-bright))',
            boxShadow: n <= cfg.filled && cfg.glow ? `0 0 6px ${cfg.color}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function HypothesisCard({ hypothesis, index }) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cfg = STRENGTH_CONFIG[hypothesis.strength] || STRENGTH_CONFIG.MED

  return (
    <div
      className="rounded-lg overflow-hidden animate-spring-in"
      style={{
        animationDelay: `${index * 120}ms`,
        border: cfg.border,
        background: 'rgb(var(--c-panel))',
        boxShadow: hovered
          ? cfg.glow
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,42,42,0.08)'
            : '0 8px 32px rgba(0,0,0,0.5)'
          : cfg.glow
          ? undefined
          : '0 2px 12px rgba(0,0,0,0.3)',
        animation: cfg.glow && !hovered ? 'pulseGlow 2s ease-in-out infinite' : undefined,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent bar */}
      <div className="flex">
        <div className="w-[3px] flex-shrink-0 rounded-l-lg" style={{ background: cfg.color, opacity: cfg.glow ? 1 : 0.5 }} />

        <div className="flex-1">
          {/* Card header */}
          <div
            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.015] transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5"
              style={{ background: 'rgb(var(--c-panel-raised))', border: '1px solid rgb(var(--c-border-bright))' }}>
              <span className="text-[11px] font-display font-bold text-nerve-textDim">{index + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-mono font-semibold text-nerve-text leading-tight">
                  {hypothesis.title}
                </h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SignalBars strength={hypothesis.strength} />
                  <span
                    className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-wider"
                    style={{
                      background: cfg.badge.bg,
                      color: cfg.badge.color,
                      border: `1px solid ${cfg.badge.border}`,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-nerve-textDim leading-relaxed">
                {hypothesis.explanation}
              </p>

              {hypothesis.evidence.length > 0 && (
                <button
                  className="mt-2 flex items-center gap-1.5 text-[10px] font-mono transition-colors duration-150"
                  style={{ color: expanded ? 'rgb(var(--c-accent))' : 'rgb(var(--c-muted))' }}
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                >
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {expanded ? 'Hide' : 'Show'} {hypothesis.evidence.length} evidence line{hypothesis.evidence.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* Evidence panel — grid expand trick */}
          <div style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.25s ease',
          }}>
            <div className="overflow-hidden">
              <div className="border-t border-nerve-border/40 mx-3 mb-3 mt-0 pt-2.5">
                <div className="rounded-md overflow-hidden"
                  style={{ background: 'rgb(var(--c-bg))', border: '1px solid rgb(var(--c-border))', borderLeft: `3px solid ${cfg.color}40` }}>
                  <div className="px-2.5 py-1.5 border-b border-nerve-border/30">
                    <span className="text-[9px] font-display font-semibold tracking-[0.2em] text-nerve-muted">
                      EVIDENCE LOG
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1.5 overflow-x-auto">
                    {hypothesis.evidence.map((line, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-nerve-mutedBright text-[10px] font-mono flex-shrink-0 mt-px select-none">{i + 1}</span>
                        <code className="text-[10px] font-mono text-nerve-success/80 leading-relaxed whitespace-pre break-all">{line}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
