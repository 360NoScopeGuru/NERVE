export default function FixSteps({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li
          key={i}
          className="flex gap-3 animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="flex-shrink-0 w-5 h-5 rounded bg-nerve-success/20 border border-nerve-success/30 flex items-center justify-center mt-0.5">
            <span className="text-[9px] font-mono font-bold text-nerve-success">{i + 1}</span>
          </span>
          <div className="flex-1 min-w-0">
            {/* Detect inline code blocks (backtick or common command patterns) */}
            <StepContent text={step} />
          </div>
        </li>
      ))}
    </ol>
  )
}

function StepContent({ text }) {
  // Split on backtick code spans
  const parts = text.split(/(`[^`]+`)/)
  return (
    <p className="text-xs font-mono text-nerve-textDim leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="text-nerve-success bg-nerve-success/10 px-1 py-0.5 rounded text-[11px]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}
