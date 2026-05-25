import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

export default function ShareModal({ analysisId, onClose }) {
  const { getToken } = useAuth()
  const [shareToken, setShareToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    const enable = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`/api/history/${analysisId}/share`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setShareToken(data.shareToken)
        }
      } finally {
        setLoading(false)
      }
    }
    enable()
  }, [analysisId])

  const shareUrl = shareToken ? `${window.location.origin}/?share=${shareToken}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      const token = await getToken()
      await fetch(`/api/history/${analysisId}/share`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setShareToken(null)
      onClose()
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,4,14,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <div
        className="max-w-sm w-full rounded-xl p-5 animate-spring-in"
        style={{
          background: 'rgb(var(--c-panel))',
          border: '1px solid rgb(var(--c-border-bright))',
          boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 32px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgb(var(--c-accent) / 0.12)', border: '1px solid rgb(var(--c-accent) / 0.3)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="rgb(var(--c-accent))" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span className="text-[10px] font-display font-bold tracking-[0.2em]" style={{ color: 'rgb(var(--c-accent))' }}>SHARE ANALYSIS</span>
          </div>
          <button onClick={onClose} className="text-nerve-muted hover:text-nerve-text transition-colors text-lg leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 rounded-full border border-t-nerve-accent animate-spin" />
          </div>
        ) : shareToken ? (
          <>
            <p className="text-[11px] font-mono text-nerve-textDim mb-3">
              Anyone with this link can view the analysis without signing in.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-[10px] font-mono px-2 py-1.5 rounded outline-none"
                style={{
                  background: 'rgb(var(--c-bg))',
                  border: '1px solid rgb(var(--c-border))',
                  color: 'rgb(var(--c-text-dim))',
                }}
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded text-[10px] font-display font-bold tracking-wider transition-all duration-150"
                style={{
                  background: copied ? 'rgb(var(--c-success) / 0.15)' : 'rgb(var(--c-accent) / 0.12)',
                  border: `1px solid ${copied ? 'rgb(var(--c-success) / 0.4)' : 'rgb(var(--c-accent) / 0.35)'}`,
                  color: copied ? 'rgb(var(--c-success))' : 'rgb(var(--c-accent))',
                }}
              >
                {copied ? '✓ COPIED' : 'COPY'}
              </button>
            </div>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="w-full py-1.5 rounded text-[10px] font-display font-semibold tracking-wider transition-all duration-150"
              style={{
                background: 'rgb(var(--c-critical) / 0.06)',
                border: '1px solid rgb(var(--c-critical) / 0.2)',
                color: 'rgb(var(--c-critical) / 0.7)',
              }}
            >
              {revoking ? 'Revoking…' : 'Revoke Link'}
            </button>
          </>
        ) : (
          <p className="text-[11px] font-mono text-nerve-muted text-center py-4">Failed to generate link.</p>
        )}
      </div>
    </div>
  )
}
