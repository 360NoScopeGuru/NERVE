import { useRef, useState, useCallback } from 'react'

export default function LogInputPanel({ value, onChange, onAnalyze, isLoading, validationErrors }) {
  const fileRef = useRef(null)
  const btnRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [ripples, setRipples] = useState([])
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 })

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target.result)
    reader.readAsText(file)
  }

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) onChange(text)
    } catch { /* permission denied */ }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRunClick = (e) => {
    if (isLoading || !value.trim()) return
    // Ripple
    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { id, x, y }])
    setTimeout(() => setRipples(r => r.filter(ri => ri.id !== id)), 700)
    onAnalyze()
  }

  const handleBtnMouseMove = useCallback((e) => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) * 0.25
    const dy = (e.clientY - rect.top - rect.height / 2) * 0.25
    setBtnOffset({ x: dx, y: dy })
  }, [])

  const handleBtnMouseLeave = useCallback(() => {
    setBtnOffset({ x: 0, y: 0 })
  }, [])

  const lineCount = value ? value.split('\n').filter(l => l.trim()).length : 0

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {/* Terminal chrome */}
      <div
        className={`relative flex-1 rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${
          dragOver ? 'ring-2 ring-nerve-accent/50' : ''
        }`}
        style={{
          background: '#020209',
          border: dragOver
            ? '1px solid rgba(0,212,255,0.5)'
            : validationErrors.length > 0
            ? '1px solid rgba(239,68,68,0.4)'
            : '1px solid #141428',
          boxShadow: dragOver
            ? '0 0 30px rgba(0,212,255,0.12), inset 0 0 30px rgba(0,212,255,0.04)'
            : 'inset 0 2px 8px rgba(0,0,0,0.4)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Window chrome bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-nerve-border/60"
          style={{ background: 'rgba(13,13,34,0.8)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-nerve-critical/70" style={{ boxShadow: '0 0 4px rgba(255,42,42,0.4)' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-nerve-warn/70" style={{ boxShadow: '0 0 4px rgba(245,158,11,0.3)' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-nerve-success/70" style={{ boxShadow: '0 0 4px rgba(0,229,160,0.3)' }} />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[9px] font-display font-semibold tracking-[0.3em] text-nerve-muted">LOG INGEST TERMINAL</span>
          </div>
          {value && (
            <span className="text-[9px] font-mono text-nerve-mutedBright">
              {lineCount}L · {value.length.toLocaleString()}B
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          className="flex-1 bg-transparent text-nerve-text font-mono text-xs leading-relaxed p-3 resize-none outline-none w-full"
          placeholder={`// paste log data — or drop a file\n\n2026-05-24T03:41:02Z [service] ERROR connection refused\n2026-05-24T03:41:03Z [service] WARN  retrying...\n...\n\nMinimum: 10 lines with timestamps + error signals`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{ caretColor: '#00e5a0' }}
        />

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: 'rgba(0,212,255,0.06)' }}>
            <svg className="w-8 h-8 text-nerve-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-nerve-accent font-display font-semibold text-sm tracking-widest">DROP TO LOAD</span>
          </div>
        )}
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1 animate-spring-in">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-nerve-danger text-[11px] font-mono">
              <span className="mt-0.5 flex-shrink-0 text-nerve-danger/60">✗</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ToolButton onClick={() => fileRef.current?.click()} icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        } label="UPLOAD" />
        <input
          ref={fileRef}
          type="file"
          accept=".log,.txt,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <ToolButton onClick={handleClipboardPaste} icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        } label="PASTE" />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-[10px] font-mono text-nerve-muted hover:text-nerve-danger transition-colors px-2 py-1"
          >
            CLEAR
          </button>
        )}

        <div className="flex-1" />

        {/* Run button — magnetic + ripple */}
        <button
          ref={btnRef}
          onClick={handleRunClick}
          onMouseMove={handleBtnMouseMove}
          onMouseLeave={handleBtnMouseLeave}
          disabled={isLoading || !value.trim()}
          className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-lg font-display font-semibold text-[13px] tracking-[0.15em] transition-all duration-200 select-none"
          style={{
            transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
            background: isLoading || !value.trim()
              ? 'rgba(46,46,80,0.4)'
              : 'linear-gradient(135deg, #00d4ff 0%, #0099bb 100%)',
            color: isLoading || !value.trim() ? '#4a4a70' : '#04040e',
            boxShadow: isLoading || !value.trim()
              ? 'none'
              : '0 0 20px rgba(0,212,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.2s, background 0.2s',
          }}
        >
          {/* Ripples */}
          {ripples.map(r => (
            <span
              key={r.id}
              className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
              style={{ width: 20, height: 20, left: r.x - 10, top: r.y - 10 }}
            />
          ))}

          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-nerve-bg/30 border-t-nerve-bg animate-spin" />
              RUNNING
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RUN NERVE
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ToolButton({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-nerve-border hover:border-nerve-borderBright text-nerve-textDim hover:text-nerve-text text-[10px] font-display font-semibold tracking-wider transition-all duration-150 hover:bg-nerve-panelRaised active:scale-95"
    >
      {icon}
      {label}
    </button>
  )
}
