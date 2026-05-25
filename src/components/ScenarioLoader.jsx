import { useState, useRef, useCallback } from 'react'
import { SCENARIOS } from '../constants/fixtures'

export default function ScenarioLoader({ onLoad, activeScenario }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-display font-semibold tracking-[0.35em] text-nerve-muted uppercase">
        Demo Scenarios
      </p>
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            active={activeScenario === s.id}
            onLoad={onLoad}
          />
        ))}
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, active, onLoad }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({
      rx: (y - 0.5) * -10,
      ry: (x - 0.5) * 12,
    })
  }, [])

  const handleMouseEnter = () => setHovering(true)
  const handleMouseLeave = () => {
    setHovering(false)
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <button
      ref={cardRef}
      onClick={() => onLoad(scenario)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-start px-3 py-2 rounded-lg text-left transition-all duration-150 select-none"
      style={{
        background: active
          ? 'rgb(var(--c-accent) / 0.08)'
          : hovering ? 'rgb(var(--c-panel-raised))' : 'rgb(var(--c-panel))',
        border: active
          ? '1px solid rgb(var(--c-accent) / 0.4)'
          : '1px solid rgb(var(--c-border-bright))',
        boxShadow: active
          ? '0 0 20px rgba(0,212,255,0.15), inset 0 1px 0 rgba(0,212,255,0.1)'
          : hovering ? '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' : 'none',
        transform: active
          ? 'scale(1.02)'
          : `perspective(400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${hovering ? 'translateY(-1px)' : ''}`,
        transition: hovering || active
          ? 'transform 0.1s ease, box-shadow 0.2s, border-color 0.2s'
          : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.2s',
      }}
    >
      {/* Active top glow bar */}
      {active && (
        <div className="absolute top-0 left-3 right-3 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)', boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
      )}

      <span className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
          active ? 'bg-nerve-accent animate-pulse' : hovering ? 'bg-nerve-borderBright' : 'bg-nerve-muted'
        }`}
          style={active ? { boxShadow: '0 0 6px rgba(0,212,255,0.8)' } : undefined}
        />
        <span className={`text-[11px] font-display font-semibold tracking-wider transition-colors duration-200 ${
          active ? 'text-nerve-accent' : hovering ? 'text-nerve-text' : 'text-nerve-textDim'
        }`}>
          {scenario.label}
        </span>
      </span>
      <span className={`text-[9px] font-mono mt-0.5 ml-3.5 leading-tight transition-colors duration-200 ${
        active ? 'text-nerve-accent/70' : 'text-nerve-muted'
      }`}>
        {scenario.title}
      </span>
    </button>
  )
}
