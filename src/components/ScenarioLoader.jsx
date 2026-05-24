import { SCENARIOS } from '../constants/fixtures'

export default function ScenarioLoader({ onLoad, activeScenario }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono uppercase tracking-widest text-nerve-muted mb-1">
        Demo Scenarios
      </p>
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => onLoad(s)}
            className={`
              group relative flex flex-col items-start px-3 py-2 rounded border text-left transition-all duration-150
              ${activeScenario === s.id
                ? 'border-nerve-accent bg-nerve-accent/10 text-nerve-accent'
                : 'border-nerve-border bg-nerve-panel hover:border-nerve-accent/50 hover:bg-nerve-accent/5 text-nerve-textDim hover:text-nerve-text'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                activeScenario === s.id ? 'bg-nerve-accent animate-pulse' : 'bg-nerve-muted group-hover:bg-nerve-accent/50'
              }`} />
              <span className="text-xs font-mono font-semibold">{s.label}</span>
            </span>
            <span className="text-[10px] font-mono mt-0.5 ml-3.5 opacity-75 leading-tight">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
