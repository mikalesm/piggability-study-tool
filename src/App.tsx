import { useEffect, useMemo, useState } from 'react'
import { Download, Database, Gauge, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { assess, defaultStudy } from './engine'
import type { Assessment, StudyInputs, Verdict } from './engine/types'
import { getRepo, repoLabel } from './repo'
import type { Project, StoredSegment } from './repo/types'
import { SEED_PROJECT } from './data/seed'
import { FleetTable, type FleetRow } from './ui/FleetTable'
import { SegmentForm } from './ui/SegmentForm'
import { SegmentEditor } from './ui/SegmentEditor'
import { ProjectBar } from './ui/ProjectBar'
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

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [segments, setSegments] = useState<StoredSegment[]>([])
  const [studies, setStudies] = useState<Record<string, StudyInputs>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ segment?: StoredSegment } | null>(null)

  // Load the segments + studies for a project into state.
  async function loadProject(projectId: string) {
    const repo = await getRepo()
    const segs = await repo.listSegments(projectId)
    const studyEntries = await Promise.all(
      segs.map(async (s) => [s.id, (await repo.getStudy(s.id)) ?? defaultStudy(s)] as const),
    )
    setSegments(segs)
    setStudies(Object.fromEntries(studyEntries))
    setSelectedId(segs[0]?.id ?? null)
  }

  // Initial load.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const repo = await getRepo()
      const projs = await repo.listProjects()
      if (cancelled) return
      setProjects(projs)
      const active = projs[0]?.id ?? null
      setActiveProjectId(active)
      if (active) await loadProject(active)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Live assessments — skip (don't crash on) any segment that can't derive geometry.
  const fleetRows: FleetRow[] = useMemo(
    () =>
      segments.flatMap((segment) => {
        try {
          return [{ segment, assessment: assess(segment, studies[segment.id] ?? defaultStudy(segment)) }]
        } catch {
          return []
        }
      }),
    [segments, studies],
  )
  const invalidCount = segments.length - fleetRows.length

  const selected = fleetRows.find((r) => r.segment.id === selectedId) ?? null
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const rollup = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of fleetRows) counts[r.assessment.verdict] = (counts[r.assessment.verdict] ?? 0) + 1
    return counts
  }, [fleetRows])

  // ── study edits ───────────────────────────────────────────────────────────
  function updateStudy(segmentId: string, next: StudyInputs) {
    setStudies((prev) => ({ ...prev, [segmentId]: next }))
    void getRepo().then((repo) => repo.saveStudy(segmentId, next))
  }

  // ── project CRUD ──────────────────────────────────────────────────────────
  async function selectProject(id: string) {
    setActiveProjectId(id)
    await loadProject(id)
  }

  async function newProject() {
    const name = window.prompt('New project name:')?.trim()
    if (!name) return
    const repo = await getRepo()
    const id = `${slug(name) || 'project'}-${crypto.randomUUID().slice(0, 6)}`
    const project: Project = {
      id,
      name,
      client: '',
      code: SEED_PROJECT.code,
      createdAt: new Date().toISOString(),
    }
    await repo.saveProject(project)
    setProjects((prev) => [...prev, project])
    setActiveProjectId(id)
    setSegments([])
    setStudies({})
    setSelectedId(null)
  }

  async function renameProject() {
    if (!activeProject) return
    const name = window.prompt('Rename project:', activeProject.name)?.trim()
    if (!name) return
    const repo = await getRepo()
    const updated = { ...activeProject, name }
    await repo.saveProject(updated)
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  async function deleteProject() {
    if (!activeProject || projects.length <= 1) return
    if (!window.confirm(`Delete project "${activeProject.name}" and all its segments?`)) return
    const repo = await getRepo()
    await repo.deleteProject(activeProject.id)
    const remaining = projects.filter((p) => p.id !== activeProject.id)
    setProjects(remaining)
    const next = remaining[0]?.id ?? null
    setActiveProjectId(next)
    if (next) await loadProject(next)
    else {
      setSegments([])
      setStudies({})
      setSelectedId(null)
    }
  }

  // ── segment CRUD ──────────────────────────────────────────────────────────
  async function saveSegment(segment: StoredSegment) {
    const repo = await getRepo()
    await repo.saveSegment(segment)
    const isNew = !segments.some((s) => s.id === segment.id)
    setSegments((prev) =>
      isNew ? [...prev, segment] : prev.map((s) => (s.id === segment.id ? segment : s)),
    )
    if (!studies[segment.id]) {
      const study = defaultStudy(segment)
      setStudies((prev) => ({ ...prev, [segment.id]: study }))
      await repo.saveStudy(segment.id, study)
    }
    setSelectedId(segment.id)
    setEditing(null)
  }

  async function deleteSegment(id: string) {
    const seg = segments.find((s) => s.id === id)
    if (!seg) return
    if (!window.confirm(`Delete segment "${seg.header}"?`)) return
    const repo = await getRepo()
    await repo.deleteSegment(id)
    setSegments((prev) => prev.filter((s) => s.id !== id))
    setStudies((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (selectedId === id) setSelectedId(null)
  }

  async function exportSelected(row: FleetRow, assessment: Assessment) {
    if (!activeProject) return
    const { downloadReport } = await import('./report/PiggabilityReport')
    downloadReport(activeProject, row.segment, assessment)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading fleet…</div>
  }

  const btn =
    'inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="text-accent" size={22} />
            <h1 className="text-xl font-semibold text-zinc-100">Piggability Study Tool</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {activeProject?.name ?? SEED_PROJECT.name}
            {activeProject?.client ? ` · ${activeProject.client}` : ''} · {activeProject?.code}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Database size={14} />
          <span>Storage: {repoLabel()}</span>
        </div>
      </header>

      {/* Project bar */}
      <div className="mb-5">
        <ProjectBar
          projects={projects}
          activeId={activeProjectId}
          onSelect={(id) => void selectProject(id)}
          onNew={() => void newProject()}
          onRename={() => void renameProject()}
          onDelete={() => void deleteProject()}
        />
      </div>

      {/* Fleet rollup chips */}
      <section className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Fleet rollup</span>
        {VERDICT_ORDER.filter((v) => rollup[v]).map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5">
            <VerdictBadge verdict={v} />
            <span className="num text-sm text-zinc-400">×{rollup[v]}</span>
          </span>
        ))}
        {fleetRows.length === 0 && <span className="text-sm text-zinc-600">No segments yet.</span>}
        <span className="num ml-auto text-xs text-zinc-500">{fleetRows.length} segments</span>
      </section>

      {invalidCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} />
          {invalidCount} segment(s) hidden — each needs a wall thickness or design pressure to derive geometry.
        </div>
      )}

      {/* Fleet table + add */}
      <section className="mb-6 space-y-3">
        <div className="flex justify-end">
          <button type="button" className={btn} onClick={() => setEditing({})} disabled={!activeProjectId}>
            <Plus size={14} /> Add segment
          </button>
        </div>
        {fleetRows.length > 0 && (
          <FleetTable rows={fleetRows} selectedId={selectedId} onSelect={setSelectedId} />
        )}
      </section>

      {/* Selected segment detail */}
      {selected && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              {selected.segment.field} — {selected.segment.header}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className={btn} onClick={() => setEditing({ segment: selected.segment })}>
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                onClick={() => void deleteSegment(selected.segment.id)}
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                type="button"
                onClick={() => void exportSelected(selected, selected.assessment)}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-accent-soft"
              >
                <Download size={16} /> Export PDF
              </button>
            </div>
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

      {/* Editor modal */}
      {editing && activeProjectId && (
        <SegmentEditor
          projectId={activeProjectId}
          initial={editing.segment}
          existingIds={segments.map((s) => s.id)}
          onCancel={() => setEditing(null)}
          onSave={(seg) => void saveSegment(seg)}
        />
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
