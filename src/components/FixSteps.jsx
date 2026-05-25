import { useState } from 'react'

export default function FixSteps({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-[10px] top-3 bottom-3 w-px"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--c-border-bright)), transparent)' }} />

      <ol className="space-y-2 relative">
        {steps.map((step, i) => (
          <FixStep key={i} step={step} index={i} total={steps.length} />
        ))}
      </ol>
    </div>
  )
}

function extractCommand(text) {
  const match = text.match(/`([^`]+)`/)
  return match ? match[1] : text
}

function FixStep({ step, index, total }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(extractCommand(step)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <li
      className="flex gap-3 animate-spring-in"
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Step number indicator */}
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300 z-10"
        style={{
          background: hovered ? 'rgba(0,229,160,0.2)' : 'rgb(var(--c-panel-raised))',
          border: hovered ? '1px solid rgba(0,229,160,0.6)' : '1px solid rgb(var(--c-border-bright))',
          boxShadow: hovered ? '0 0 10px rgba(0,229,160,0.3)' : 'none',
        }}
      >
        <span
          className="text-[9px] font-display font-bold transition-colors duration-200"
          style={{ color: hovered ? '#00e5a0' : 'rgb(var(--c-muted-bright))' }}
        >
          {index + 1}
        </span>
      </div>

      {/* Step content */}
      <div
        className="flex-1 min-w-0 px-3 py-2 rounded-lg transition-all duration-200 flex items-start justify-between gap-2"
        style={{
          background: hovered ? 'rgb(var(--c-panel-raised))' : 'transparent',
          border: hovered ? '1px solid rgb(var(--c-border-bright))' : '1px solid transparent',
        }}
      >
        <StepContent text={step} />
        <button
          onClick={handleCopy}
          title="Copy command"
          className="flex-shrink-0 mt-0.5 transition-all duration-150"
          style={{ opacity: hovered || copied ? 1 : 0 }}
        >
          {copied ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="rgb(var(--c-success))" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="rgb(var(--c-muted-bright))" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </li>
  )
}

function StepContent({ text }) {
  const parts = text.split(/(`[^`]+`)/)
  return (
    <p className="text-xs font-mono text-nerve-textDim leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={i}
            className="font-mono text-[11px] px-1.5 py-0.5 rounded mx-0.5"
            style={{
              background: 'rgb(var(--c-bg))',
              color: 'rgb(var(--c-success))',
              border: '1px solid rgb(var(--c-success) / 0.2)',
            }}
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}
