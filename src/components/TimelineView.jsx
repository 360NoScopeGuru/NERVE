import { useState } from 'react'

export default function TimelineView({ entries }) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <TimelineEntry key={i} entry={entry} index={i} total={entries.length} />
      ))}
    </div>
  )
}

function TimelineEntry({ entry, index, total }) {
  const [hovered, setHovered] = useState(false)
  const isFirst = index === 0
  const isLast = index === total - 1
  const isLast2 = index === total - 1

  const dotColor = isFirst ? '#ff2a2a' : isLast2 ? '#f59e0b' : '#00d4ff'
  const dotGlow = isFirst ? 'rgba(255,42,42,0.7)' : isLast2 ? 'rgba(245,158,11,0.5)' : 'rgba(0,212,255,0.5)'
  const delay = `${index * 55}ms`

  return (
    <div
      className="flex gap-0 group animate-spring-in"
      style={{ animationDelay: delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Spine column */}
      <div className="flex flex-col items-center flex-shrink-0 w-8 mr-1">
        {/* Dot */}
        <div
          className="flex-shrink-0 mt-1.5 transition-all duration-200 relative"
          style={{
            width: hovered || isFirst ? 10 : 7,
            height: hovered || isFirst ? 10 : 7,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: hovered || isFirst
              ? `0 0 10px ${dotGlow}, 0 0 20px ${dotGlow}`
              : `0 0 5px ${dotGlow}`,
            transition: 'all 0.2s ease',
          }}
        >
          {/* Pulsing ring on first dot */}
          {isFirst && (
            <div className="absolute inset-[-4px] rounded-full animate-pulse"
              style={{ border: '1px solid rgba(255,42,42,0.3)' }} />
          )}
        </div>

        {/* Spine line */}
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[20px] animate-spine-draw"
            style={{
              background: hovered
                ? 'linear-gradient(to bottom, rgba(0,212,255,0.4), rgb(var(--c-border) / 0.4))'
                : 'linear-gradient(to bottom, rgb(var(--c-border-bright)), rgb(var(--c-border)))',
              transition: 'background 0.2s',
              animationDelay: delay,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className="pb-4 min-w-0 flex-1 pl-1 border-l-2 ml-[-1px] transition-all duration-200 rounded-r"
        style={{
          borderLeftColor: hovered ? 'rgba(0,212,255,0.3)' : 'transparent',
          paddingLeft: hovered ? '10px' : '4px',
          transition: 'border-color 0.2s, padding 0.2s',
        }}
      >
        {entry.time && (
          <span
            className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded mb-1 leading-none"
            style={{
              background: 'rgb(var(--c-accent) / 0.08)',
              color: 'rgb(var(--c-accent))',
              border: '1px solid rgb(var(--c-accent) / 0.2)',
            }}
          >
            {entry.time}
          </span>
        )}
        <p className={`text-xs font-mono leading-relaxed transition-colors duration-200 ${
          hovered ? 'text-nerve-text' : 'text-nerve-textDim'
        }`}>
          {entry.event}
        </p>
      </div>
    </div>
  )
}
