export default function TimelineView({ entries }) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3 group animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
          {/* Timeline spine */}
          <div className="flex flex-col items-center flex-shrink-0 w-5">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 transition-colors ${
              i === 0 ? 'bg-nerve-danger' :
              i === entries.length - 1 ? 'bg-nerve-warn' :
              'bg-nerve-accent/60 group-hover:bg-nerve-accent'
            }`} />
            {i < entries.length - 1 && (
              <div className="w-px flex-1 bg-nerve-border min-h-[16px]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-3 min-w-0 flex-1">
            {entry.time && (
              <span className="text-[10px] font-mono text-nerve-accent/80 block leading-none mb-0.5">
                {entry.time}
              </span>
            )}
            <p className="text-xs font-mono text-nerve-textDim group-hover:text-nerve-text transition-colors leading-relaxed">
              {entry.event}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
