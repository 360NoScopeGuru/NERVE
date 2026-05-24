import { useState } from 'react'
import ScenarioLoader from './components/ScenarioLoader'
import LogInputPanel from './components/LogInputPanel'
import TimelineView from './components/TimelineView'
import HypothesisCard from './components/HypothesisCard'
import FixSteps from './components/FixSteps'
import { runAnalysis } from './components/AnalysisEngine'
import { validateLogs } from './utils/logValidator'

export default function App() {
  const [logs, setLogs] = useState('')
  const [activeScenario, setActiveScenario] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [activeTab, setActiveTab] = useState('timeline')

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
    if (!valid) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const { result: parsed, fromCache: cached } = await runAnalysis(logs, activeScenario)
      setResult(parsed)
      setFromCache(cached)
      setActiveTab('timeline')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const hasResult = result && !isLoading

  return (
    <div className="h-screen bg-nerve-bg text-nerve-text flex flex-col overflow-hidden font-['Inter',sans-serif]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-nerve-border bg-nerve-panel px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 rounded bg-nerve-accent/20 border border-nerve-accent/40" />
              <div className="absolute inset-1 rounded-sm bg-nerve-accent/80" />
            </div>
            <span className="font-mono font-bold text-lg tracking-widest text-nerve-text">NERVE</span>
          </div>
          <div className="h-4 w-px bg-nerve-border" />
          <span className="text-xs font-mono text-nerve-muted">Incident Root Cause Analyzer</span>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-nerve-accent animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-accent animate-ping" />
              Analyzing incident…
            </div>
          )}
          {hasResult && fromCache && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-nerve-warn bg-nerve-warn/10 border border-nerve-warn/30 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-warn" />
              Live Analysis Complete
            </div>
          )}
          {hasResult && !fromCache && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-nerve-success bg-nerve-success/10 border border-nerve-success/30 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-nerve-success" />
              Live analysis
            </div>
          )}
          <div className="text-[10px] font-mono text-nerve-muted border border-nerve-border/50 px-2 py-1 rounded">
            nvidia/llama-3.3-nemotron-super-49b
          </div>
        </div>
      </header>

      {/* Main split panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — Input */}
        <div className="w-[45%] flex-shrink-0 border-r border-nerve-border flex flex-col">
          <div className="flex-shrink-0 border-b border-nerve-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-nerve-muted">
              Log Input
            </span>
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
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-nerve-muted">
              Analysis
            </span>
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
                  {['Parsing log structure', 'Building event timeline', 'Scoring hypotheses'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-nerve-accent animate-pulse" style={{ animationDelay: `${i * 400}ms` }} />
                      <span className="text-[11px] font-mono text-nerve-muted">{step}</span>
                    </div>
                  ))}
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
