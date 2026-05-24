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
  const color = score >= 7 ? 'text-nerve-critical bg-nerve-critical/10 border-nerve-critical/30'
              : score >= 4 ? 'text-nerve-warn bg-nerve-warn/10 border-nerve-warn/30'
              : 'text-nerve-success bg-nerve-success/10 border-nerve-success/30'
  return (
    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${color}`}>
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
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
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
        onLoadResult(data.result, data.fromCache)
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
    } catch {
      // silently fail
    }
  }

  return (
    <div className={`flex-shrink-0 flex flex-col border-r border-nerve-border bg-nerve-panel transition-all duration-200 overflow-hidden ${isOpen ? 'w-56' : 'w-0'}`}>
      {isOpen && (
        <>
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-nerve-border flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-nerve-muted">
              History
            </span>
            {loading && <div className="w-3 h-3 rounded-full border border-t-nerve-accent animate-spin" />}
          </div>

          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 && !loading && (
              <div className="p-3 text-[10px] font-mono text-nerve-muted text-center mt-4">
                No analyses yet
              </div>
            )}
            {entries.map(entry => (
              <button
                key={entry.id}
                onClick={() => handleLoad(entry.id)}
                disabled={loadingId === entry.id}
                className="w-full text-left px-3 py-2.5 border-b border-nerve-border/50 hover:bg-white/[0.02] transition-colors group relative"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <SeverityChip score={entry.severityScore} />
                  <span className="text-[9px] font-mono text-nerve-muted">{timeAgo(entry.createdAt)}</span>
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-nerve-muted hover:text-nerve-danger transition-all text-[10px] font-mono leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <p className="text-[10px] font-mono text-nerve-textDim leading-tight line-clamp-2">
                  {entry.summary || entry.inputSnippet}
                </p>
                {loadingId === entry.id && (
                  <div className="absolute inset-0 bg-nerve-panel/80 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border border-t-nerve-accent animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
