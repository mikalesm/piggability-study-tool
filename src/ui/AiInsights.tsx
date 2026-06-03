import { useState } from 'react'
import { Sparkles, Loader2, Settings2, AlertTriangle } from 'lucide-react'
import { getAiProvider, prompts } from '../ai'
import type { AiMessage } from '../ai'
import type { Assessment } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { SectionLabel } from './badges'

type Mode = 'narrative' | 'survey' | 'client'

const TABS: { id: Mode; label: string }[] = [
  { id: 'narrative', label: 'Risk narrative' },
  { id: 'survey', label: 'Survey priorities' },
  { id: 'client', label: 'Client-friendly' },
]

export function AiInsights({
  segment,
  assessment,
  configured,
  onOpenSettings,
}: {
  segment: StoredSegment
  assessment: Assessment
  configured: boolean
  onOpenSettings: () => void
}) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function run(m: Mode) {
    const provider = getAiProvider()
    if (!provider) return
    setMode(m)
    setLoading(true)
    setError(null)
    setText('')
    const msgs: AiMessage[] =
      m === 'narrative'
        ? prompts.perLineNarrative(segment, assessment)
        : m === 'survey'
          ? prompts.surveyPriorities(segment, assessment)
          : prompts.clientFriendlyVerdict(segment, assessment)
    try {
      setText(await provider.complete(msgs))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <SectionLabel>AI insights</SectionLabel>
        </div>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-dim">
          AI-generated · advisory
        </span>
      </div>

      {!configured ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-line bg-panel-2/30 p-4 text-sm text-fg-muted">
          <p>Connect an OpenAI key to generate a plain-English risk narrative, survey priorities, and a client-friendly explanation for this line.</p>
          <button type="button" className="btn btn-ghost text-xs" onClick={onOpenSettings}>
            <Settings2 size={14} /> Add a key in Settings
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => void run(t.id)}
                disabled={loading}
                className={`btn text-xs ${mode === t.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {loading && mode === t.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {t.label}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="mt-3">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p>{error}</p>
                  <button type="button" className="mt-1 underline hover:text-rose-200" onClick={() => mode && void run(mode)}>
                    Retry
                  </button>
                </div>
              </div>
            )}
            {!error && loading && <p className="text-sm text-fg-dim">Generating…</p>}
            {!error && !loading && text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{text}</p>
            )}
            {!error && !loading && !text && (
              <p className="text-xs text-fg-dim">Pick an output above to generate it for this line.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
