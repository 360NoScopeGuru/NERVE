import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function SeverityChip({ score }) {
  if (!score) return null
  const color = score >= 7 ? { text: '#ff2a2a', bg: 'rgba(255,42,42,0.1)', border: 'rgba(255,42,42,0.3)' }
              : score >= 4 ? { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
              : { text: '#00e5a0', bg: 'rgba(0,229,160,0.1)', border: 'rgba(0,229,160,0.3)' }
  return (
    <span
      className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-wider flex-shrink-0"
      style={{ color: color.text, background: color.bg, border: `1px solid ${color.border}` }}
    >
      {score}
    </span>
  )
}

export default function HistorySidebar({ isOpen, onToggle, onLoadResult, refreshKey }) {
  const { getToken } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const res = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setEntries(await res.json())
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [isOpen, refreshKey])

  const handleLoad = async (id) => {
    setLoadingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        onLoadResult(data.result, data.fromCache, data.logData, data.scenarioId)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      const token = await getToken()
      await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: isOpen ? 220 : 0,
        transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        borderRight: isOpen ? '1px solid #141428' : 'none',
        background: '#06060f',
      }}
    >
      {isOpen && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 px-3 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid #141428' }}>
            <span className="text-[9px] font-display font-semibold tracking-[0.3em] text-nerve-mutedBright uppercase">
              History
            </span>
            <div className="flex items-center gap-2">
              {entries.length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(30,30,64,0.8)', color: '#4a4a70', border: '1px solid #1e1e40' }}>
                  {entries.length}
                </span>
              )}
              {loading && (
                <div className="w-3 h-3 rounded-full border border-t-nerve-accent animate-spin" />
              )}
            </div>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 && !loading && (
              <div className="p-4 text-center mt-6">
                <div className="text-[9px] font-mono text-nerve-muted">No analyses yet</div>
              </div>
            )}

            {entries.map((entry, i) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                index={i}
                isLoading={loadingId === entry.id}
                onLoad={() => handleLoad(entry.id)}
                onDelete={(e) => handleDelete(e, entry.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function HistoryEntry({ entry, index, isLoading, onLoad, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onLoad}
      disabled={isLoading}
      className="w-full text-left relative overflow-hidden transition-all duration-150 animate-spring-in"
      style={{
        animationDelay: `${index * 40}ms`,
        borderBottom: '1px solid rgba(20,20,40,0.8)',
        background: hovered ? 'rgba(13,13,34,0.9)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shimmer on hover */}
      {hovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* Left accent on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-200"
        style={{ background: hovered ? '#00d4ff' : 'transparent', opacity: 0.6 }}
      />

      <div className="px-3 py-2.5 pl-4">
        <div className="flex items-center justify-between gap-1 mb-1">
          <SeverityChip score={entry.severityScore} />
          <span className="text-[9px] font-mono text-nerve-muted flex-1 text-right">{timeAgo(entry.createdAt)}</span>
          <button
            onClick={onDelete}
            className="ml-1 transition-all duration-150 text-[11px] font-mono leading-none rounded px-1"
            style={{
              color: hovered ? '#ef4444' : 'transparent',
              opacity: hovered ? 1 : 0,
            }}
            title="Delete"
          >
            ×
          </button>
        </div>
        <p className="text-[10px] font-mono text-nerve-textDim leading-tight line-clamp-2">
          {entry.summary || entry.inputSnippet}
        </p>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(6,6,15,0.85)' }}>
          <div className="w-4 h-4 rounded-full border border-t-nerve-accent animate-spin" />
        </div>
      )}
    </button>
  )
}
