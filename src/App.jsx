import { useState, useCallback, useRef, useEffect } from 'react'
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
      <SignedOut><SignInScreen /></SignedOut>
      <SignedIn><Analyzer /></SignedIn>
    </>
  )
}

/* ── Elaborate Sign-In Screen ─────────────────────────────────────────────── */
function SignInScreen() {
  return (
    <div className="h-screen bg-nerve-bg flex items-center justify-center relative overflow-hidden">
      {/* Base grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgb(var(--c-border-bright)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border-bright)) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Scanning line */}
      <div className="absolute left-0 right-0 h-[1px] animate-scan pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
        animationDuration: '6s',
      }} />

      {/* Corner brackets */}
      {[
        'top-8 left-8 border-t border-l',
        'top-8 right-8 border-t border-r',
        'bottom-8 left-8 border-b border-l',
        'bottom-8 right-8 border-b border-r',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-10 h-10 ${cls} border-nerve-accent/20 pointer-events-none`} />
      ))}

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)',
      }} />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(255,42,42,0.07) 0%, transparent 65%)',
      }} />
      <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(0,229,160,0.03) 0%, transparent 65%)',
      }} />

      {/* Main content column */}
      <div className="relative flex flex-col items-center gap-6 max-w-sm w-full px-4">

        {/* RESTRICTED badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-nerve-critical/30 bg-nerve-critical/8 animate-intro-in" style={{ animationDelay: '0ms' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-nerve-critical animate-pulse" style={{ boxShadow: '0 0 6px rgba(255,42,42,0.8)' }} />
          <span className="text-[9px] font-display font-bold tracking-[0.35em] text-nerve-critical/80">AUTHORIZED ACCESS ONLY</span>
        </div>

        {/* Logo with orbiting rings */}
        <div className="relative flex items-center justify-center animate-intro-in" style={{ animationDelay: '80ms' }}>
          {/* Outermost ring */}
          <div className="absolute w-44 h-44 rounded-full border border-nerve-accent/6 animate-spin" style={{ animationDuration: '25s' }} />
          {/* Dashed ring */}
          <div className="absolute w-32 h-32 rounded-full border border-dashed border-nerve-critical/8 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
          {/* Inner pulse rings */}
          <div className="absolute w-24 h-24 rounded-full border border-nerve-accent/10 animate-pulse-slow" />
          <div className="absolute w-20 h-20 rounded-full border border-nerve-critical/8 animate-pulse-slow" style={{ animationDelay: '1s' }} />

          <div className="relative flex flex-col items-center gap-3">
            {/* Icon */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-lg bg-nerve-critical/10 border border-nerve-critical/25"
                style={{ boxShadow: '0 0 40px rgba(255,42,42,0.25), 0 0 80px rgba(255,42,42,0.08)' }} />
              <div className="absolute inset-[5px] rounded bg-nerve-critical/55"
                style={{ boxShadow: '0 0 20px rgba(255,42,42,0.5)' }} />
              <div className="absolute inset-[12px] rounded-sm bg-nerve-bg" />
            </div>
            {/* Wordmark */}
            <span className="font-display font-bold text-5xl tracking-[0.3em] text-nerve-text"
              style={{ textShadow: '0 0 40px rgba(255,42,42,0.4), 0 0 80px rgba(255,42,42,0.15)' }}>
              NERVE
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center animate-intro-in" style={{ animationDelay: '160ms' }}>
          <p className="text-xs font-display font-semibold tracking-[0.3em] text-nerve-textDim uppercase">
            Incident Root Cause Analyzer
          </p>
          <p className="text-[10px] font-mono text-nerve-muted mt-1">
            War room intelligence · SRE-grade analysis
          </p>
        </div>

        {/* System status row */}
        <div className="w-full grid grid-cols-3 gap-2 animate-intro-in" style={{ animationDelay: '220ms' }}>
          {[
            { dot: 'bg-nerve-success', label: 'SRE ENGINE', status: 'ONLINE' },
            { dot: 'bg-nerve-accent', label: 'AI MODEL', status: 'READY' },
            { dot: 'bg-nerve-warn', label: 'ENCRYPTION', status: 'ACTIVE' },
          ].map(({ dot, label, status }) => (
            <div key={label} className="flex items-center justify-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse flex-shrink-0`} />
              <span className="text-[9px] font-mono text-nerve-muted whitespace-nowrap">
                <span className="text-nerve-textDim">{label}</span> · {status}
              </span>
            </div>
          ))}
        </div>

        {/* Sign-in form card */}
        <div className="w-full flex justify-center animate-intro-in" style={{ animationDelay: '300ms' }}>
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorBackground:              'rgb(8, 8, 24)',
                colorInputBackground:         'rgb(2, 2, 9)',
                colorInputText:               'rgb(221, 228, 240)',
                colorText:                    'rgb(221, 228, 240)',
                colorTextSecondary:           'rgb(172, 172, 204)',
                colorPrimary:                 'rgb(0, 212, 255)',
                colorTextOnPrimaryBackground: 'rgb(4, 4, 14)',
                colorDanger:                  'rgb(255, 42, 42)',
                colorSuccess:                 'rgb(0, 229, 160)',
                colorWarning:                 'rgb(245, 158, 11)',
                colorNeutral:                 'rgb(30, 30, 64)',
                borderRadius:                 '0.5rem',
              },
              elements: {
                rootBox: {
                  display:        'flex',
                  justifyContent: 'center',
                  width:          '100%',
                },
                card: {
                  margin:    '0 auto',
                  border:    '1px solid rgba(30,30,64,0.9)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                },
                headerTitle:       { color: 'rgb(221, 228, 240)' },
                headerSubtitle:    { color: 'rgb(172, 172, 204)' },
                socialButtonsBlockButton: {
                  background: 'rgb(13, 13, 34)',
                  border:     '1px solid rgb(30, 30, 64)',
                  color:      'rgb(221, 228, 240)',
                },
                dividerLine:       { background: 'rgb(30, 30, 64)' },
                dividerText:       { color: 'rgb(106, 106, 148)' },
                formFieldLabel:    { color: 'rgb(172, 172, 204)' },
                formFieldInput:    { border: '1px solid rgb(30, 30, 64)' },
                footerActionLink:  { color: 'rgb(0, 212, 255)' },
                identityPreviewText:       { color: 'rgb(221, 228, 240)' },
                identityPreviewEditButton: { color: 'rgb(0, 212, 255)' },
              },
            }}
          />
        </div>

        <p className="text-[9px] font-mono text-nerve-muted animate-intro-in" style={{ animationDelay: '380ms' }}>
          Secure access · End-to-end encrypted · Powered by Clerk
        </p>
      </div>
    </div>
  )
}

/* ── Main Analyzer ────────────────────────────────────────────────────────── */
function Analyzer() {
  const { getToken } = useAuth()
  const rootRef = useRef(null)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState('dark')
  const [showLightWarning, setShowLightWarning] = useState(false)
  const [introPhase, setIntroPhase] = useState(() =>
    sessionStorage.getItem('nerve-intro-shown') ? 'done' : 'enter'
  )

  // ── App state ─────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState('')
  const [activeScenario, setActiveScenario] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [activeTab, setActiveTab] = useState('timeline')
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640)
  const [historyKey, setHistoryKey] = useState(0)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [mobileTab, setMobileTab] = useState('input')

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (introPhase === 'done') return
    const t1 = setTimeout(() => setIntroPhase('exit'), 1100)
    const t2 = setTimeout(() => {
      setIntroPhase('done')
      sessionStorage.setItem('nerve-intro-shown', '1')
    }, 1850)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (rootRef.current) {
      rootRef.current.style.setProperty('--mx', e.clientX / window.innerWidth)
      rootRef.current.style.setProperty('--my', e.clientY / window.innerHeight)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNewAnalysis = () => {
    setLogs('')
    setResult(null)
    setError(null)
    setActiveScenario(null)
    setValidationErrors([])
    setFromCache(false)
    setAnalysisStatus('')
  }

  const handleLightModeToggle = () => {
    if (theme === 'light') { setTheme('dark'); return }
    setShowLightWarning(true)
  }

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
      if (window.innerWidth < 640) setMobileTab('output')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setAnalysisStatus('')
    }
  }

  const handleLoadFromHistory = (historicResult, cached, logData, scenarioId) => {
    setResult(historicResult)
    setFromCache(cached)
    setActiveTab('timeline')
    setError(null)
    if (logData) setLogs(logData)
    setActiveScenario(scenarioId || null)
    if (window.innerWidth < 640) {
      setMobileTab('output')
      setSidebarOpen(false)
    }
  }

  const hasResult = result && !isLoading

  return (
    <div
      ref={rootRef}
      className="h-[100dvh] bg-nerve-bg text-nerve-text flex flex-col overflow-hidden"
      style={{ '--mx': 0.5, '--my': 0.5 }}
      onMouseMove={handleMouseMove}
    >
      {/* Intro overlay */}
      {introPhase !== 'done' && <IntroOverlay phase={introPhase} />}

      {/* Light mode warning */}
      {showLightWarning && (
        <LightModeWarning
          onConfirm={() => { setShowLightWarning(false); setTheme('light') }}
          onCancel={() => setShowLightWarning(false)}
        />
      )}

      {/* Cursor spotlight */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{
        background: 'radial-gradient(600px circle at calc(var(--mx, 0.5) * 100vw) calc(var(--my, 0.5) * 100vh), rgba(0,212,255,0.04) 0%, transparent 60%)',
      }} />

      {/* Loading sweep bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 overflow-hidden">
          <div className="h-full w-1/3 animate-sweep" style={{
            background: 'linear-gradient(90deg, transparent, rgb(var(--c-accent)), rgb(var(--c-phosphor)), transparent)',
          }} />
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between relative z-20"
        style={{
          background: 'linear-gradient(180deg, rgb(var(--c-panel-raised)) 0%, rgb(var(--c-panel)) 100%)',
          boxShadow: isLoading
            ? '0 1px 0 rgb(var(--c-border-bright)), 0 2px 20px rgba(0,212,255,0.1)'
            : '0 1px 0 rgb(var(--c-border))',
          transition: 'box-shadow 0.4s',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-nerve-border hover:border-nerve-accent/30 text-nerve-textDim hover:text-nerve-accent text-[10px] font-display font-semibold tracking-wider transition-all duration-200 hover:bg-nerve-accent/5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            HISTORY
          </button>

          <button
            onClick={handleNewAnalysis}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-nerve-border hover:border-nerve-success/40 text-nerve-textDim hover:text-nerve-success text-[10px] font-display font-semibold tracking-wider transition-all duration-200 hover:bg-nerve-success/5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            NEW
          </button>

          <div className="w-px h-5 bg-nerve-border" />
          <NerveLogo size="sm" />
          <div className="w-px h-5 bg-nerve-border hidden sm:block" />
          <span className="text-[10px] font-mono text-nerve-muted tracking-widest hidden sm:block">
            ROOT CAUSE ANALYSIS
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {isLoading && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-nerve-accent">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nerve-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-nerve-accent" />
              </span>
              {analysisStatus || 'ANALYZING…'}
            </div>
          )}
          {hasResult && fromCache && <StatusPill color="warn" label="CACHED" />}
          {hasResult && !fromCache && <StatusPill color="success" label="LIVE" />}

          <div className="hidden sm:block px-2 py-1 rounded border border-nerve-border text-[10px] font-display text-nerve-mutedBright tracking-wider">
            NERVE v1.0
          </div>

          {/* Theme toggle */}
          <button
            onClick={handleLightModeToggle}
            className="w-7 h-7 rounded flex items-center justify-center border border-nerve-border hover:border-nerve-borderBright text-nerve-textDim hover:text-nerve-text transition-all duration-150"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <HistorySidebar
          isOpen={sidebarOpen}
          onLoadResult={handleLoadFromHistory}
          refreshKey={historyKey}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Left — Input */}
        <div
          className={`flex-col overflow-hidden ${isMobile ? (mobileTab === 'input' ? 'flex flex-1' : 'hidden') : 'flex flex-shrink-0'}`}
          style={isMobile ? undefined : {
            width: sidebarOpen ? '40%' : '46%',
            transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            borderRight: '1px solid rgb(var(--c-border))',
          }}
        >
          <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgb(var(--c-border))' }}>
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

        {/* Right — Output */}
        <div className={`flex-col overflow-hidden ${isMobile ? (mobileTab === 'output' ? 'flex flex-1' : 'hidden') : 'flex flex-1'}`}>
          <div className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgb(var(--c-border))' }}>
            <span className="text-[10px] font-display font-semibold tracking-[0.25em] text-nerve-mutedBright">
              ANALYSIS OUTPUT
            </span>
            {hasResult && (
              <div className="flex gap-1">
                {[
                  { id: 'timeline',   label: 'TIMELINE',   count: result.timeline?.length },
                  { id: 'hypotheses', label: 'HYPOTHESES', count: result.hypotheses?.length },
                  { id: 'fix',        label: 'FIX STEPS',  count: result.fixSteps?.length },
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
                    {count > 0 && <span className="ml-1.5 opacity-60 font-mono text-[9px]">{count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!isLoading && !result && !error && <EmptyState />}
            {isLoading && <LoadingState status={analysisStatus} />}

            {error && !isLoading && (
              <div className="p-6 animate-spring-in">
                <div className="rounded-lg border border-nerve-danger/30 bg-nerve-danger/5 p-4"
                  style={{ boxShadow: '0 0 30px rgba(239,68,68,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-nerve-danger/10 border border-nerve-danger/30 flex items-center justify-center flex-shrink-0">
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

            {hasResult && (
              <div className="p-5 space-y-4 animate-fade-in">
                <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                  <div className="rounded-lg p-4 border-gradient-raised"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded-full bg-nerve-accent" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.5)' }} />
                      <span className="text-[10px] font-display font-semibold tracking-[0.25em] text-nerve-accent/80">SUMMARY</span>
                    </div>
                    <p className="text-sm font-mono text-nerve-text leading-relaxed">{result.summary}</p>
                  </div>
                  {result.severityScore && (
                    <SeverityGauge score={result.severityScore} reason={result.severityReason} />
                  )}
                </div>

                {activeTab === 'timeline' && result.timeline?.length > 0 && (
                  <div className="animate-spring-in">
                    <SectionHeader title="INCIDENT TIMELINE" count={result.timeline.length} unit="events" />
                    <TimelineView entries={result.timeline} />
                  </div>
                )}
                {activeTab === 'hypotheses' && result.hypotheses?.length > 0 && (
                  <div className="space-y-3 animate-spring-in">
                    <SectionHeader title="ROOT CAUSE HYPOTHESES" count={result.hypotheses.length} unit="ranked" />
                    {result.hypotheses.map((h, i) => <HypothesisCard key={i} hypothesis={h} index={i} />)}
                  </div>
                )}
                {activeTab === 'fix' && result.fixSteps?.length > 0 && (
                  <div className="animate-spring-in">
                    <SectionHeader title="REMEDIATION STEPS" subtitle="Calibrated to Hypothesis #1" count={result.fixSteps.length} unit="steps" />
                    <FixSteps steps={result.fixSteps} />
                  </div>
                )}

                <details className="group">
                  <summary className="text-[10px] font-mono text-nerve-muted hover:text-nerve-textDim cursor-pointer list-none flex items-center gap-1.5 select-none py-1">
                    <svg className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Raw API response
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg border border-nerve-border bg-nerve-bg text-[10px] font-mono text-nerve-textDim overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {result.raw || JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex-shrink-0 flex" style={{ borderTop: '1px solid rgb(var(--c-border))', background: 'rgb(var(--c-panel))' }}>
        <button
          onClick={() => setMobileTab('input')}
          className={`flex-1 py-3 text-[11px] font-display font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors ${
            mobileTab === 'input' ? 'text-nerve-accent' : 'text-nerve-muted'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          INPUT
        </button>
        <div className="w-px my-2.5" style={{ background: 'rgb(var(--c-border))' }} />
        <button
          onClick={() => setMobileTab('output')}
          className={`flex-1 py-3 text-[11px] font-display font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors ${
            mobileTab === 'output' ? 'text-nerve-accent' : 'text-nerve-muted'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          OUTPUT
          {hasResult && <span className="w-1.5 h-1.5 rounded-full bg-nerve-success" />}
        </button>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function NerveLogo({ size = 'sm' }) {
  const lg = size === 'lg'
  return (
    <div className={`flex items-center gap-${lg ? '4' : '2.5'}`}>
      <div className={`relative flex-shrink-0 ${lg ? 'w-12 h-12' : 'w-7 h-7'}`}>
        <div className="absolute inset-0 rounded bg-nerve-critical/10 border border-nerve-critical/30"
          style={{ boxShadow: '0 0 12px rgba(255,42,42,0.18)' }} />
        <div className="absolute inset-[3px] rounded-sm bg-nerve-critical/60"
          style={{ boxShadow: '0 0 8px rgba(255,42,42,0.35)' }} />
        <div className="absolute inset-[7px] rounded-sm bg-nerve-bg" />
      </div>
      <span
        className={`font-display font-bold tracking-[0.25em] text-nerve-text ${lg ? 'text-4xl' : 'text-lg'}`}
        style={{ textShadow: '0 0 20px rgba(255,42,42,0.25)' }}
      >
        NERVE
      </span>
    </div>
  )
}

function StatusPill({ color, label }) {
  const c = {
    warn:    'text-nerve-warn    bg-nerve-warn/10    border-nerve-warn/30',
    success: 'text-nerve-success bg-nerve-success/10 border-nerve-success/30',
  }[color]
  const dot = { warn: 'bg-nerve-warn', success: 'bg-nerve-success' }[color]
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-display font-semibold tracking-wider ${c}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  )
}

function SeverityGauge({ score, reason }) {
  const pct = score / 10
  const color = score >= 7 ? '#ff2a2a' : score >= 4 ? '#f59e0b' : '#00e5a0'
  const glow  = score >= 7 ? 'rgba(255,42,42,0.4)' : score >= 4 ? 'rgba(245,158,11,0.3)' : 'rgba(0,229,160,0.3)'
  const r = 28, circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const filled = arc * pct

  return (
    <div className="flex-shrink-0 rounded-lg p-3 border-gradient-raised flex flex-col items-center gap-1"
      style={{ minWidth: 90, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <span className="text-[9px] font-display font-semibold tracking-[0.2em] text-nerve-mutedBright">SEV</span>
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-[135deg]">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(var(--c-border-bright))" strokeWidth="5"
            strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-2xl tabular-nums" style={{ color, textShadow: `0 0 16px ${glow}` }}>{score}</span>
        </div>
      </div>
      <span className="text-[9px] font-mono text-nerve-muted">/10</span>
      {reason && <p className="text-[9px] font-mono text-nerve-textDim text-center leading-tight mt-1 max-w-[82px]">{reason}</p>}
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
      {count !== undefined && <span className="text-[10px] font-mono text-nerve-muted">{count} {unit}</span>}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-8 text-center select-none">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute rounded-full border border-nerve-border animate-pulse-slow"
            style={{ width: `${(i + 1) * 28}px`, height: `${(i + 1) * 28}px`, animationDelay: `${i * 0.4}s`, opacity: 0.4 - i * 0.1 }} />
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
      <div className="space-y-2.5 w-64">
        {stages.map((step, i) => {
          const isDone = currentIdx > i, isActive = currentIdx === i
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone   ? 'bg-nerve-success/20 border-nerve-success/50' :
                isActive ? 'bg-nerve-accent/20 border-nerve-accent/50 animate-pulse' :
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

/* ── Intro overlay — pans from center to top ──────────────────────────────── */
function IntroOverlay({ phase }) {
  const exiting = phase === 'exit'
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: exiting ? 'rgba(4,4,14,0)' : 'rgb(var(--c-bg))',
        transition: 'background 0.9s ease',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Grid */}
      {!exiting && (
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgb(var(--c-border-bright)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border-bright)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      )}

      {/* Scan line */}
      {!exiting && (
        <div className="absolute left-0 right-0 h-[1px] animate-scan pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.25), transparent)',
          animationDuration: '3s',
        }} />
      )}

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: exiting ? 0 : 1 }}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,42,42,0.06) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 65%)' }} />
      </div>

      {/* NERVE logo — flies to header on exit */}
      <div style={{
        transform: exiting ? 'translate(-44vw, -47vh) scale(0.16)' : 'scale(1)',
        opacity: exiting ? 0 : 1,
        transition: exiting
          ? 'transform 0.75s cubic-bezier(0.55, 0, 0.75, 0.15), opacity 0.55s ease'
          : 'none',
        transformOrigin: 'center center',
      }}>
        <div className="flex flex-col items-center gap-5">
          {/* Icon with concentric rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full border border-nerve-accent/5 animate-spin" style={{ animationDuration: '30s' }} />
            <div className="absolute w-28 h-28 rounded-full border border-dashed border-nerve-critical/8 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
            <div className="absolute w-20 h-20 rounded-full border border-nerve-accent/8 animate-pulse-slow" />

            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-lg bg-nerve-critical/10 border border-nerve-critical/25"
                style={{ boxShadow: '0 0 50px rgba(255,42,42,0.3), 0 0 100px rgba(255,42,42,0.1)' }} />
              <div className="absolute inset-[5px] rounded bg-nerve-critical/60"
                style={{ boxShadow: '0 0 24px rgba(255,42,42,0.6)' }} />
              <div className="absolute inset-[12px] rounded-sm bg-nerve-bg" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-display font-bold text-6xl tracking-[0.35em] text-nerve-text"
              style={{ textShadow: '0 0 50px rgba(255,42,42,0.45), 0 0 100px rgba(255,42,42,0.18)' }}>
              NERVE
            </h1>
            <p className="font-mono text-sm text-nerve-textDim tracking-[0.4em] mt-2 uppercase">
              Incident Root Cause Analyzer
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Light mode warning modal ─────────────────────────────────────────────── */
function LightModeWarning({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,4,14,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-md w-full rounded-xl border border-nerve-critical/40 bg-nerve-panel p-6 animate-spring-in"
        style={{ boxShadow: '0 0 80px rgba(255,42,42,0.18), 0 32px 64px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-nerve-critical/15 border border-nerve-critical/50 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 24px rgba(255,42,42,0.3)' }}>
            <svg className="w-5 h-5 text-nerve-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-nerve-critical font-display font-bold tracking-[0.2em] text-sm">CRITICAL WARNING</p>
            <p className="text-nerve-textDim font-mono text-[10px] mt-0.5">Irreversible reputation damage ahead</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 text-xs font-mono text-nerve-textDim leading-relaxed mb-5">
          <p>You are attempting to enable <span className="text-nerve-warn font-semibold">LIGHT MODE</span>.</p>
          <p>Our systems have already notified:</p>
          <ul className="space-y-1 ml-3 text-nerve-textDim">
            <li>• Your entire engineering org (they can see your screen)</li>
            <li>• The ghost of Dennis Ritchie (he is deeply disappointed)</li>
            <li>• Three NASA satellites (your laptop is now a beacon)</li>
            <li>• HR (the paperwork has been drafted, signed, and laminated)</li>
            <li>• Your dark mode wallpaper (it has filed for emotional damages)</li>
          </ul>
          <p>Known side effects: uncontrollable urge to use Comic Sans, spontaneous LinkedIn posts about "productivity hacks", and being the person who microwaves fish in the office kitchen.</p>
          <p>Your SSH sessions will refuse connection out of protest. Your git blame will never be the same. Stack Overflow is already drafting a passive-aggressive comment about your question formatting.</p>
          <p className="text-nerve-mutedBright text-[10px]">This incident has been logged. Reference: JIRA-YOUMESSED-UP-420.</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-nerve-success/40 bg-nerve-success/10 text-nerve-success text-xs font-display font-bold tracking-wider hover:bg-nerve-success/20 transition-colors"
          >
            ABORT — My Eyes Are Fine
          </button>
          <button
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-lg border border-nerve-critical/25 bg-nerve-critical/8 text-nerve-critical text-xs font-display font-semibold tracking-wider hover:bg-nerve-critical/15 transition-colors"
          >
            Blind Me
          </button>
        </div>
      </div>
    </div>
  )
}
