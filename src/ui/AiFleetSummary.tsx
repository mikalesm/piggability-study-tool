import { useEffect, useState } from 'react'
import { getAiProvider, prompts } from '../ai'
import type { Assessment } from '../engine/types'
import type { Project, StoredSegment } from '../repo/types'
import { Modal } from './Modal'

export function AiFleetSummary({
  project,
  rows,
  onClose,
}: {
  project: Project
  rows: { segment: StoredSegment; assessment: Assessment }[]
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const provider = getAiProvider()
      if (!provider) {
        setError('No AI key configured.')
        setLoading(false)
        return
      }
      try {
        const out = await provider.complete(prompts.fleetSummary(project, rows))
        if (!cancelled) setText(out)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [project, rows])

  return (
    <Modal
      title={`Fleet summary — ${project.name}`}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      <div aria-live="polite">
        <div className="mb-2 inline-flex rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-dim">
          AI-generated · advisory
        </div>
        {loading && <p className="text-sm text-fg-dim">Generating fleet summary…</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {!loading && !error && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{text}</p>
        )}
      </div>
    </Modal>
  )
}
