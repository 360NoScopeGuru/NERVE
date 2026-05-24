import { useState, useCallback, useRef } from 'react'
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
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <Analyzer />
      </SignedIn>
    </>
  )
}

function SignInScreen() {
  return (
    <div className="h-screen bg-nerve-bg flex items-center justify-center relative overflow-hidden">
      {/* Radial grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #0d0d22 0%, #04040e 70%)',
      }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(#1e1e40 1px, transparent 1px), linear-gradient(90deg, #1e1e40 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,42,42,0.08) 0%, transparent 70%)' }} />

      <div className="relative flex flex-col items-center gap-8 animate-spring-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <NerveLogo size="lg" />
          <div className="text-center">
            <p className="text-xs font-mono text-nerve-textDim tracking-[0.3em] uppercase mt-2">
              SRE Incident Analyzer
            </p>
            <p className="text-[10px] font-mono text-nerve-muted mt-1">
              Root cause analysis · War room intelligence
            </p>
          </div>
        </div>

        <div className="border-gradient rounded-lg p-px">
          <div className="rounded-lg overflow-hidden">
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Analyzer() {
  const { getToken } = useAuth()
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const rootRef = useRef(null)

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

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight
    mouseRef.current = { x, y }
    if (rootRef.current) {
      rootRef.current.style.setProperty('--mx', x)
      rootRef.current.style.setProperty('--my', y)
    }
  }, [])

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

  const handleLoadFromHistory = (historicResult, cached, logData) => {
    setResult(historicResult)
    setFromCache(cached)
    setActiveTab('timeline')
    setError(null)
    if (logData) setLogs(logData)
  }

  const hasResult = result && !isLoading

  return (
    <div
      ref={rootRef}
      className="h-screen bg-nerve-bg text-nerve-text flex flex-col overflow-hidden"
      style={{ '--mx': 0.5, '--my': 0.5 }}
      onMouseMove={handleMouseMove}
    >
      {/* Cursor spotlight */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(600px circle at calc(var(--mx, 0.5) * 100vw) calc(var(--my, 0.5) * 100vh), rgba(0,212,255,0.04) 0%, transparent 60%)',
          transition: 'background 0.05s',
        }}
      />

      {/* Loading sweep bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 overflow-hidden">
          <div className="h-full w-1/3 animate-sweep" style={{
            background: 'linear-gradient(90deg, transparent, #00d4ff, #00ffcc, transparent)',
          }} />
        </div>
      )}

      {/* Header */}
      <header
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between relative z-20"
        style={{
          background: 'linear-gradient(180deg, #08081a 0%, #04040e 100%)',
          boxShadow: isLoading
            ? '0 1px 0 #1e1e40, 0 2px 20px rgba(0,212,255,0.12)'
            : '0 1px 0 #141428',
          transition: 'box-shadow 0.4s',
        }}
      >
        <div className="flex items-center gap-4">
          {/* History toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded font-mono text-[10px] text-nerve-textDim hover:text-nerve-accent border border-nerve-border hover:border-nerve-accent/30 transition-all duration-200 hover:bg-nerve-accent/5"
            title="Toggle history"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            HISTORY
          </button>

          <div className="w-px h-5 bg-nerve-border" />
          <NerveLogo size="sm" />
          <div className="w-px h-5 bg-nerve-border" />

          <span className="text-[10px] font-mono text-nerve-muted tracking-widest hidden sm:block">
            ROOT CAUSE ANALYSIS · WAR ROOM
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-nerve-accent">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nerve-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-nerve-accent" />
              </span>
              {analysisStatus || 'ANALYZING…'}
            </div>
          )}
          {hasResult && fromCache && (
            <StatusPill color="warn" label="CACHED" />
          )}
          {hasResult && !fromCache && (
            <StatusPill color="success" label="LIVE" />
          )}
          <div className="px-2.5 py-1 rounded border border-nerve-border bg-nerve-panel text-[10px] font-display text-nerve-mutedBright tracking-wider">
            NERVE v1.0
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* History sidebar */}
        <HistorySidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          onLoadResult={handleLoadFromHistory}
          refreshKey={historyKey}
        />

        {/* Left panel — Input */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: sidebarOpen ? '40%' : '46%',
            transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            borderRight: '1px solid #141428',
          }}
        >
          {/* Scenarios */}
          <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid #141428' }}>
            <ScenarioLoader onLoad={handleScenarioLoad} activeScenario={activeScenario} />
          </div>

          {/* Log input */}
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
          {/* Tab bar */}
          <div
            className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid #141428' }}
          >
            <span className="text-[10px] font-display font-semibold tracking-[0.25em] text-nerve-mutedBright">
              ANALYSIS OUTPUT
            </span>
            {hasResult && (
              <div className="flex gap-1">
                {[
                  { id: 'timeline', label: 'TIMELINE', count: result.timeline?.length },
                  { id: 'hypotheses', label: 'HYPOTHESES', count: result.hypotheses?.length },
                  { id: 'fix', label: 'FIX STEPS', count: result.fixSteps?.length },
                ].map(({ id, label, count }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-1 text-[10px] font-display font-semibold tracking-wider rounded transition-all duration-200 ${
                      activeTab === id
                        ? 'bg-nerve-accent/15 text-nerve-accent border border-nerve-accent/30'
                        : 'text-nerve-muted hover:text-nerve-textDim border border-transparent hover:border-nerve-border'
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className="ml-1.5 opacity-60 font-mono text-[9px]">{count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Empty state */}
            {!isLoading && !result && !error && <EmptyState />}

            {/* Loading state */}
            {isLoading && <LoadingState status={analysisStatus} />}

            {/* Error */}
            {error && !isLoading && (
              <div className="p-6 animate-spring-in">
                <div className="rounded-lg border border-nerve-danger/30 bg-nerve-danger/5 p-4"
                  style={{ boxShadow: '0 0 30px rgba(239,68,68,0.08)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-nerve-danger/10 border border-nerve-danger/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-nerve-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-display font-semibold text-nerve-danger mb-1 tracking-wide">ANALYSIS FAILED</p>
                      <p className="text-xs font-mono text-nerve-danger/70 leading-relaxed">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasResult && (
              <div className="p-5 space-y-4 animate-fade-in">
                {/* Summary + Severity row */}
                <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                  {/* Summary */}
                  <div className="rounded-lg p-4 border-gradient-raised"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded-full bg-nerve-accent" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.6)' }} />
                      <span className="text-[10px] font-display font-semibold tracking-[0.25em] text-nerve-accent/80">SUMMARY</span>
                    </div>
                    <p className="text-sm font-mono text-nerve-text leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Severity gauge */}
                  {result.severityScore && (
                    <SeverityGauge score={result.severityScore} reason={result.severityReason} />
                  )}
                </div>

                {/* Tab content */}
                {activeTab === 'timeline' && result.timeline?.length > 0 && (
                  <div className="animate-spring-in">
                    <SectionHeader title="INCIDENT TIMELINE" count={result.timeline.length} unit="events" />
                    <TimelineView entries={result.timeline} />
                  </div>
                )}

                {activeTab === 'hypotheses' && result.hypotheses?.length > 0 && (
                  <div className="space-y-3 animate-spring-in">
                    <SectionHeader title="ROOT CAUSE HYPOTHESES" count={result.hypotheses.length} unit="ranked" />
                    {result.hypotheses.map((h, i) => (
                      <HypothesisCard key={i} hypothesis={h} index={i} />
                    ))}
                  </div>
                )}

                {activeTab === 'fix' && result.fixSteps?.length > 0 && (
                  <div className="animate-spring-in">
                    <SectionHeader title="REMEDIATION STEPS" subtitle="Calibrated to Hypothesis #1" count={result.fixSteps.length} unit="steps" />
                    <FixSteps steps={result.fixSteps} />
                  </div>
                )}

                {/* Raw output */}
                <details className="group">
                  <summary className="text-[10px] font-mono text-nerve-muted hover:text-nerve-textDim cursor-pointer list-none flex items-center gap-1.5 select-none py-1">
                    <svg className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Raw API response
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg border border-nerve-border bg-black/40 text-[10px] font-mono text-nerve-muted overflow-x-auto whitespace-pre-wrap leading-relaxed">
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

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function NerveLogo({ size = 'sm' }) {
  const isLg = size === 'lg'
  return (
    <div className={`flex items-center gap-${isLg ? '4' : '3'}`}>
      {/* Icon mark */}
      <div className={`relative flex-shrink-0 ${isLg ? 'w-12 h-12' : 'w-8 h-8'}`}>
        <div className="absolute inset-0 rounded bg-nerve-critical/10 border border-nerve-critical/30"
          style={{ boxShadow: '0 0 16px rgba(255,42,42,0.2)' }} />
        <div className="absolute inset-[3px] rounded-sm bg-nerve-critical/60"
          style={{ boxShadow: '0 0 10px rgba(255,42,42,0.35)' }} />
        <div className="absolute inset-[7px] rounded-sm bg-nerve-bg" />
      </div>
      {/* Wordmark */}
      <span
        className={`font-display font-bold tracking-[0.25em] text-nerve-text ${isLg ? 'text-4xl' : 'text-xl'}`}
        style={{ textShadow: '0 0 24px rgba(255,42,42,0.3)' }}
      >
        NERVE
      </span>
    </div>
  )
}

function StatusPill({ color, label }) {
  const colours = {
    warn:    { dot: 'bg-nerve-warn',    text: 'text-nerve-warn',    bg: 'bg-nerve-warn/10',    border: 'border-nerve-warn/30' },
    success: { dot: 'bg-nerve-success', text: 'text-nerve-success', bg: 'bg-nerve-success/10', border: 'border-nerve-success/30' },
  }
  const c = colours[color]
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-display font-semibold tracking-wider ${c.text} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </div>
  )
}

function SeverityGauge({ score, reason }) {
  const max = 10
  const pct = score / max
  const color = score >= 7 ? '#ff2a2a' : score >= 4 ? '#f59e0b' : '#00e5a0'
  const glow = score >= 7 ? 'rgba(255,42,42,0.4)' : score >= 4 ? 'rgba(245,158,11,0.3)' : 'rgba(0,229,160,0.3)'

  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * 0.75
  const gap = circ * 0.25
  const filled = dash * pct

  return (
    <div className="flex-shrink-0 rounded-lg p-3 border-gradient-raised flex flex-col items-center gap-1"
      style={{ minWidth: 88, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <span className="text-[9px] font-display font-semibold tracking-[0.2em] text-nerve-mutedBright">SEV</span>
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1e1e40" strokeWidth="5"
            strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" />
          {/* Fill */}
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-2xl leading-none tabular-nums" style={{ color, textShadow: `0 0 16px ${glow}` }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-mono text-nerve-muted">/10</span>
      {reason && (
        <p className="text-[9px] font-mono text-nerve-textDim text-center leading-tight mt-1 max-w-[80px]">{reason}</p>
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle, count, unit }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div>
        <h3 className="text-[10px] font-display font-semibold tracking-[0.25em] text-nerve-textDim">{title}</h3>
        {subtitle && <p className="text-[10px] font-mono text-nerve-muted mt-0.5">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-nerve-muted">{count} {unit}</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-8 text-center select-none">
      {/* Animated radar rings */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute rounded-full border border-nerve-border animate-pulse-slow"
            style={{
              width: `${(i + 1) * 28}px`,
              height: `${(i + 1) * 28}px`,
              animationDelay: `${i * 0.4}s`,
              opacity: 0.4 - i * 0.1,
            }} />
        ))}
        <div className="w-3 h-3 rounded-full bg-nerve-mutedBright/40 border border-nerve-border" />
      </div>
      <div>
        <p className="text-sm font-display font-semibold tracking-widest text-nerve-textDim">AWAITING INPUT</p>
        <p className="text-[11px] font-mono text-nerve-muted mt-1.5">Load a scenario or paste log data to begin</p>
      </div>
    </div>
  )
}

function LoadingState({ status }) {
  const stages = ['Analyzing with Nemotron 49B…', 'Switching to fallback model…', 'Formatting output…']
  const currentIdx = stages.indexOf(status)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8 select-none">
      {/* Spinning rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-nerve-border" />
        <div className="absolute inset-0 rounded-full border-2 border-t-nerve-accent animate-spin" />
        <div className="absolute inset-3 rounded-full border border-t-nerve-accent/40 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-6 rounded-full bg-nerve-accent/10 border border-nerve-accent/20 animate-pulse" />
      </div>

      <div className="text-center">
        <p className="text-sm font-display font-semibold tracking-[0.2em] text-nerve-accent">ANALYZING INCIDENT</p>
        <p className="text-[11px] font-mono text-nerve-muted mt-1">Correlating signals across log stream</p>
      </div>

      {/* Stage indicators */}
      <div className="space-y-2.5 w-64">
        {stages.map((step, i) => {
          const isDone = currentIdx > i
          const isActive = currentIdx === i
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone    ? 'bg-nerve-success/20 border-nerve-success/50' :
                isActive  ? 'bg-nerve-accent/20 border-nerve-accent/50 animate-pulse' :
                            'bg-transparent border-nerve-border'
              }`}>
                {isDone && (
                  <svg className="w-3 h-3 text-nerve-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-nerve-accent animate-ping" />}
              </div>
              <span className={`text-[11px] font-mono transition-colors duration-300 ${
                isDone ? 'text-nerve-success' : isActive ? 'text-nerve-accent' : 'text-nerve-muted'
              }`}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
