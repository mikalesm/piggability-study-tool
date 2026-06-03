import { useEffect, useMemo, useState } from 'react'
import { Download, Database, Gauge } from 'lucide-react'
import { assess, defaultStudy } from './engine'
import type { Assessment, StudyInputs, Verdict } from './engine/types'
import { getRepo, repoLabel } from './repo'
import type { Project, StoredSegment } from './repo/types'
import { SEED_PROJECT } from './data/seed'
import { FleetTable, type FleetRow } from './ui/FleetTable'
import { SegmentForm } from './ui/SegmentForm'
import { VerdictCard } from './ui/VerdictCard'
import { SuitabilityMatrix } from './ui/SuitabilityMatrix'
import { ScopeCard } from './ui/ScopeCard'
import { ActionsCard } from './ui/ActionsCard'
import { Disclaimer } from './ui/Disclaimer'
import { VerdictBadge } from './ui/badges'

const VERDICT_ORDER: Verdict[] = [
  'Piggable',
  'Piggable w/ modifications',
  'Further study',
  'Not piggable as-is',
]

export default function App() {
  const [project, setProject] = useState<Project | null>(null)
  const [segments, setSegments] = useState<StoredSegment[]>([])
  const [studies, setStudies] = useState<Record<string, StudyInputs>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load fleet from the active repository on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const repo = await getRepo()
      const projects = await repo.listProjects()
      const proj = projects[0] ?? null
      const segs = proj ? await repo.listSegments(proj.id) : []
      const studyEntries = await Promise.all(
        segs.map(async (s) => [s.id, (await repo.getStudy(s.id)) ?? defaultStudy(s)] as const),
      )
      if (cancelled) return
      setProject(proj)
      setSegments(segs)
      setStudies(Object.fromEntries(studyEntries))
      setSelectedId(segs[0]?.id ?? null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Live assessments for the whole fleet — recompute whenever inputs change.
  const fleetRows: FleetRow[] = useMemo(
    () =>
      segments.map((segment) => ({
        segment,
        assessment: assess(segment, studies[segment.id] ?? defaultStudy(segment)),
      })),
    [segments, studies],
  )

  const selected = fleetRows.find((r) => r.segment.id === selectedId) ?? null

  const rollup = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of fleetRows) counts[r.assessment.verdict] = (counts[r.assessment.verdict] ?? 0) + 1
    return counts
  }, [fleetRows])

  function updateStudy(segmentId: string, next: StudyInputs) {
    setStudies((prev) => ({ ...prev, [segmentId]: next }))
    // persist asynchronously; UI already reflects the change
    void getRepo().then((repo) => repo.saveStudy(segmentId, next))
  }

  async function exportSelected(row: FleetRow, assessment: Assessment) {
    if (!project) return
    // pdfmake is heavy — load it only when the user actually exports.
    const { downloadReport } = await import('./report/PiggabilityReport')
    downloadReport(project, row.segment, assessment)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">Loading fleet…</div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="text-accent" size={22} />
            <h1 className="text-xl font-semibold text-zinc-100">Piggability Study Tool</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {project?.name ?? SEED_PROJECT.name} · {project?.client} · {project?.code}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Database size={14} />
          <span>Storage: {repoLabel()}</span>
        </div>
      </header>

      {/* Fleet rollup chips */}
      <section className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Fleet rollup</span>
        {VERDICT_ORDER.filter((v) => rollup[v]).map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5">
            <VerdictBadge verdict={v} />
            <span className="num text-sm text-zinc-400">×{rollup[v]}</span>
          </span>
        ))}
        <span className="num ml-auto text-xs text-zinc-500">{segments.length} segments</span>
      </section>

      {/* Fleet table */}
      <section className="mb-6">
        <FleetTable rows={fleetRows} selectedId={selectedId} onSelect={setSelectedId} />
      </section>

      {/* Selected segment detail */}
      {selected && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">
              {selected.segment.field} — {selected.segment.header}
            </h2>
            <button
              type="button"
              onClick={() => void exportSelected(selected, selected.assessment)}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-accent-soft"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <SegmentForm
                segment={selected.segment}
                assessment={selected.assessment}
                study={studies[selected.segment.id] ?? defaultStudy(selected.segment)}
                onChange={(next) => updateStudy(selected.segment.id, next)}
              />
            </div>
            <VerdictCard assessment={selected.assessment} />
          </div>

          <SuitabilityMatrix rows={selected.assessment.rows} />

          <div className="grid gap-5 lg:grid-cols-2">
            <ScopeCard assessment={selected.assessment} />
            <ActionsCard assessment={selected.assessment} />
          </div>
        </section>
      )}

      {/* Disclaimer + roadmap footer */}
      <footer className="mt-8 space-y-3 border-t border-zinc-800 pt-5">
        <Disclaimer />
        <p className="text-center text-[11px] text-zinc-600">
          Module 0 — Piggability. Roadmap: Ingestion/QC · Detection · Classification &amp; Sizing ·
          Fitness-for-Service · Insights · Report.
        </p>
      </footer>
    </div>
  )
}
