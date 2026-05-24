import { useRef, useState } from 'react'
import { validateLogs } from '../utils/logValidator'

export default function LogInputPanel({ value, onChange, onAnalyze, isLoading, validationErrors }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

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
    } catch {
      // Clipboard permission denied or unavailable
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Textarea */}
      <div
        className={`relative flex-1 rounded border transition-colors duration-150 ${
          dragOver
            ? 'border-nerve-accent bg-nerve-accent/5'
            : validationErrors.length > 0
            ? 'border-nerve-danger/60'
            : 'border-nerve-border'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          className="w-full h-full bg-transparent text-nerve-text font-mono text-xs leading-relaxed p-3 resize-none outline-none placeholder-nerve-muted rounded"
          placeholder={`Paste log data here — or drop a .log / .txt / .json file\n\nExpected format:\n  2026-05-24T03:41:02Z [service] ERROR message\n\nMinimum: 10 lines with timestamps and error signals`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-nerve-accent/10 border-2 border-dashed border-nerve-accent pointer-events-none">
            <span className="text-nerve-accent font-mono text-sm font-semibold">Drop file to load</span>
          </div>
        )}
      </div>

      {/* Line / char counter */}
      {value && (
        <div className="text-[10px] font-mono text-nerve-muted text-right -mt-1">
          {value.split('\n').filter(l => l.trim()).length} lines · {value.length.toLocaleString()} chars
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-nerve-danger text-xs font-mono">
              <span className="mt-0.5 flex-shrink-0">✗</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-nerve-border hover:border-nerve-accent/50 text-nerve-textDim hover:text-nerve-text text-xs font-mono transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".log,.txt,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <button
          onClick={handleClipboardPaste}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-nerve-border hover:border-nerve-accent/50 text-nerve-textDim hover:text-nerve-text text-xs font-mono transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Quick Paste
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-xs font-mono text-nerve-muted hover:text-nerve-danger transition-colors"
          >
            Clear
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onAnalyze}
          disabled={isLoading || !value.trim()}
          className={`
            flex items-center gap-2 px-5 py-2 rounded font-mono text-sm font-semibold transition-all duration-150
            ${isLoading || !value.trim()
              ? 'bg-nerve-muted/20 text-nerve-muted cursor-not-allowed'
              : 'bg-nerve-accent hover:bg-nerve-accentDim text-nerve-bg cursor-pointer shadow-lg shadow-nerve-accent/20'
            }
          `}
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-nerve-muted border-t-nerve-text animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run NERVE
            </>
          )}
        </button>
      </div>
    </div>
  )
}
