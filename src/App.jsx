import { useState } from 'react'
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from '@clerk/clerk-react'
import ScenarioLoader from './components/ScenarioLoader'
import LogInputPanel from './components/LogInputPanel'
import TimelineView from './components/TimelineView'
import HypothesisCard from './components/HypothesisCard'
import FixSteps from './components/FixSteps'
import HistorySidebar from './components/HistorySidebar'
import { runAnalysis } from './components/AnalysisEngine'
import { validateLogs } from './utils/logValidator'

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="h-screen bg-nerve-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="absolute inset-0 rounded bg-nerve-critical/10 border border-nerve-critical/40" style={{ boxShadow: '0 0 16px rgba(255,42,42,0.25)' }} />
                <div className="absolute inset-[3px] rounded-sm bg-nerve-critical/70" style={{ boxShadow: '0 0 10px rgba(255,42,42,0.4)' }} />
                <div className="absolute inset-[7px] rounded-sm bg-nerve-bg" />
              </div>
              <span className="font-mono font-black text-3xl tracking-[0.25em] text-nerve-text" style={{ textShadow: '0 0 20px rgba(255,42,42,0.3)' }}>NERVE</span>
            </div>
            <p className="text-xs font-mono text-nerve-muted mb-2">SRE Incident Analyzer — sign in to continue</p>
            <SignIn routing="hash" />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <Analyzer />
      </SignedIn>
    </>
  )
}

function Analyzer() {
  const { getToken } = useAuth()

  const [logs, setLogs] = useState('')
  const [activeScenario, setActiveScenario] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [activeTab, setActiveTab] = useState('timeline')
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyKey, setHistoryKey] = useState(0)

  const handleScenarioLoad = (scenario) => {
    setLogs(scenario.logs)
    setActiveScenario(scenario.id)
    setResult(null)
    setError(null)
    setValidationErrors([])
  }

  const handleLogsChange = (text) => {
    setLogs(text)
    setActiveScenario(null)
    if (validationErrors.length > 0) setValidationErrors([])
  }

  const handleAnalyze = async () => {
    const { valid, errors } = validateLogs(logs)
    if (!valid) { setValidationErrors(errors); return }
    setValidationErrors([])
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await getToken()
      const { result: parsed, fromCache: cached } = await runAnalysis(logs, activeScenario, setAnalysisStatus, token)
      setResult(parsed)
      setFromCache(cached)
      setActiveTab('timeline')
      setHistoryKey(k => k + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setAnalysisStatus('')
    }
  }

  const handleLoadFromHistory = (historicResult, cached) => {
    setResult(historicResult)
    setFromCache(cached)
    setActiveTab('timeline')
    setError(null)
  }

  const hasResult = result && !isLoading

  return (
    <div className="h-screen bg-nerve-bg text-nerve-text flex flex-col overflow-hidden font-['Inter',sans-serif]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-nerve-border bg-nerve-panel px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* History toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-nerve-muted hover:text-nerve-text border border-nerve-border/50 hover:border-nerve-accent/30 px-2 py-1 rounded transition-colors"
            title="Toggle history"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

          <div className="h-6 w-px bg-nerve-border" />

          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 rounded bg-nerve-critical/10 border border-nerve-critical/40" style={{ boxShadow: '0 0 12px rgba(255,42,42,0.25)' }} />
              <div className="absolute inset-[3px] rounded-sm bg-nerve-critical/70" style={{ boxShadow: '0 0 8px rgba(255,42,42,0.4)' }} />
              <div className="absolute inset-[6px] rounded-sm bg-nerve-bg" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-mono font-black text-2xl tracking-[0.2em] text-nerve-text" style={{ letterSpacing: '0.25em', textShadow: '0 0 20px rgba(255,42,42,0.3)' }}>NERVE</span>
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-nerve-critical/70 mt-0.5">Incident Analyzer</span>
            </div>
          </div>

          <div className="h-6 w-px bg-nerve-border" />
          <span className="text-[11px] font-mono text-nerve-muted">Root Cause Analysis · SRE War Room</span>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-nerve-accent animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-accent animate-ping" />
              {analysisStatus || 'Analyzing incident…'}
            </div>
          )}
          {hasResult && fromCache && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-nerve-warn bg-nerve-warn/10 border border-nerve-warn/30 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-warn" />
              Cached result
            </div>
          )}
          {hasResult && !fromCache && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-nerve-success bg-nerve-success/10 border border-nerve-success/30 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-success" />
              Live analysis
            </div>
          )}
          <div className="text-[10px] font-mono text-nerve-muted border border-nerve-border/50 px-2 py-1 rounded">
            NERVE Engine v1.0
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* History sidebar */}
        <HistorySidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          onLoadResult={handleLoadFromHistory}
          refreshKey={historyKey}
        />

        {/* Left panel — Input */}
        <div className="flex-shrink-0 border-r border-nerve-border flex flex-col" style={{ width: sidebarOpen ? '38%' : '45%', transition: 'width 0.2s' }}>
          <div className="flex-shrink-0 border-b border-nerve-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-nerve-muted">Log Input</span>
          </div>
          <div className="flex-shrink-0 border-b border-nerve-border/50 px-4 py-3">
            <ScenarioLoader onLoad={handleScenarioLoad} activeScenario={activeScenario} />
          </div>
          <div className="flex-1 overflow-hidden p-4 flex flex-col">
            <LogInputPanel
              value={logs}
              onChange={handleLogsChange}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              validationErrors={validationErrors}
            />
          </div>
        </div>

        {/* Right panel — Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-nerve-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-nerve-muted">Analysis</span>
            {hasResult && (
              <div className="flex gap-1">
                {['timeline', 'hypotheses', 'fix'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-[11px] font-mono rounded transition-colors ${
                      activeTab === tab
                        ? 'bg-nerve-accent/15 text-nerve-accent border border-nerve-accent/30'
                        : 'text-nerve-muted hover:text-nerve-text'
                    }`}
                  >
                    {tab === 'timeline' ? 'Timeline' : tab === 'hypotheses' ? 'Hypotheses' : 'Fix Steps'}
                    {tab === 'hypotheses' && result.hypotheses?.length > 0 && (
                      <span className="ml-1 opacity-60">({result.hypotheses.length})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Empty state */}
            {!isLoading && !result && !error && (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-nerve-border flex items-center justify-center">
                  <svg className="w-7 h-7 text-nerve-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-mono text-nerve-textDim">Load a scenario or paste log data</p>
                  <p className="text-xs font-mono text-nerve-muted mt-1">Press Run NERVE to start analysis</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-nerve-border" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-t-nerve-accent animate-spin" />
                  <div className="absolute inset-3 w-10 h-10 rounded-full border border-t-nerve-accent/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-mono text-nerve-accent">Running root cause analysis…</p>
                  <p className="text-xs font-mono text-nerve-muted">NERVE is correlating signals across your log data</p>
                </div>
                <div className="w-64 space-y-2">
                  {['Analyzing with Nemotron 49B…', 'Switching to fallback model…', 'Formatting output…'].map((step, i) => {
                    const stages = ['Analyzing with Nemotron 49B…', 'Switching to fallback model…', 'Formatting output…']
                    const currentIdx = stages.indexOf(analysisStatus)
                    const isDone = currentIdx > i
                    const isActive = currentIdx === i
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isDone ? 'bg-nerve-success' : isActive ? 'bg-nerve-accent animate-pulse' : 'bg-nerve-border'}`} />
                        <span className={`text-[11px] font-mono transition-colors ${isDone ? 'text-nerve-success' : isActive ? 'text-nerve-accent' : 'text-nerve-muted'}`}>{step}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="p-6">
                <div className="rounded border border-nerve-danger/40 bg-nerve-danger/10 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-nerve-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-mono font-semibold text-nerve-danger mb-1">Analysis failed</p>
                      <p className="text-xs font-mono text-nerve-danger/80">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasResult && (
              <div className="p-5 space-y-5 animate-fade-in">
                {/* Summary */}
                <div className="rounded border border-nerve-accent/20 bg-nerve-accent/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-nerve-accent" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-nerve-accent/80">Summary</span>
                  </div>
                  <p className="text-sm font-mono text-nerve-text leading-relaxed">{result.summary}</p>
                </div>

                {/* Severity score */}
                {result.severityScore && (
                  <div className="rounded border border-nerve-border bg-nerve-panel p-4 flex items-center justify-between gap-4 animate-fade-in">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-nerve-muted">Severity Score</span>
                      {result.severityReason && (
                        <p className="text-xs font-mono text-nerve-textDim mt-1 leading-relaxed">{result.severityReason}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-baseline gap-1">
                      <span className={`text-5xl font-mono font-black leading-none tabular-nums ${
                        result.severityScore >= 7 ? 'text-nerve-critical' :
                        result.severityScore >= 4 ? 'text-nerve-warn' : 'text-nerve-success'
                      }`} style={result.severityScore >= 7 ? { textShadow: '0 0 24px rgba(255,42,42,0.4)' } : undefined}>
                        {result.severityScore}
                      </span>
                      <span className="text-sm font-mono text-nerve-muted">/10</span>
                    </div>
                  </div>
                )}

                {/* Tab content */}
                {activeTab === 'timeline' && result.timeline?.length > 0 && (
                  <div>
                    <SectionHeader title="Incident Timeline" count={result.timeline.length} unit="events" />
                    <TimelineView entries={result.timeline} />
                  </div>
                )}

                {activeTab === 'hypotheses' && result.hypotheses?.length > 0 && (
                  <div>
                    <SectionHeader title="Root Cause Hypotheses" count={result.hypotheses.length} unit="ranked" />
                    <div className="space-y-3">
                      {result.hypotheses.map((h, i) => (
                        <HypothesisCard key={i} hypothesis={h} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'fix' && result.fixSteps?.length > 0 && (
                  <div>
                    <SectionHeader title="Remediation Steps" subtitle="Calibrated to Hypothesis #1" count={result.fixSteps.length} unit="steps" />
                    <FixSteps steps={result.fixSteps} />
                  </div>
                )}

                {/* Raw output toggle */}
                <details className="group">
                  <summary className="text-[10px] font-mono text-nerve-muted hover:text-nerve-textDim cursor-pointer list-none flex items-center gap-1.5 select-none">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Raw API response
                  </summary>
                  <pre className="mt-2 p-3 rounded border border-nerve-border bg-black/30 text-[10px] font-mono text-nerve-muted overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {result.raw || JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, count, unit }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-nerve-textDim">{title}</h3>
        {subtitle && <p className="text-[10px] font-mono text-nerve-muted mt-0.5">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-nerve-muted">{count} {unit}</span>
      )}
    </div>
  )
}
