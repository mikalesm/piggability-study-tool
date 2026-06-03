import { useEffect, useMemo, useState } from 'react'
import { Download, Gauge, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
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
import { VerdictBadge, SectionLabel } from './ui/badges'

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

  function updateStudy(segmentId: string, next: StudyInputs) {
    setStudies((prev) => ({ ...prev, [segmentId]: next }))
    void getRepo().then((repo) => repo.saveStudy(segmentId, next))
  }

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
    return (
      <div className="flex h-full items-center justify-center gap-2 text-fg-dim">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-led text-accent" />
        <span className="label">Loading fleet</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
      {/* Console header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 ring-1 ring-accent/30">
              <Gauge size={18} className="text-accent" />
            </div>
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[15px] font-semibold tracking-[0.2em] text-fg">PIGGABILITY</span>
                <span className="label hidden sm:inline">ILI Screening</span>
              </div>
              <div className="num mt-1 text-[10px] tracking-wider text-fg-dim">
                MODULE 0 · PIPELINE INTEGRITY
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400 shadow-led" />
            <span className="label hidden sm:inline">Storage</span>
            <span className="num text-[11px] text-fg-muted">{repoLabel()}</span>
          </div>
        </div>
        <div className="num mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-dim">
          <span className="text-fg-muted">{activeProject?.name ?? SEED_PROJECT.name}</span>
          <span className="text-line-strong">/</span>
          <span>{activeProject?.client || '—'}</span>
          <span className="text-line-strong">/</span>
          <span>{activeProject?.code}</span>
        </div>
      </header>

      {/* Project bar */}
      <div className="mb-6">
        <ProjectBar
          projects={projects}
          activeId={activeProjectId}
          onSelect={(id) => void selectProject(id)}
          onNew={() => void newProject()}
          onRename={() => void renameProject()}
          onDelete={() => void deleteProject()}
        />
      </div>

      {/* Fleet rollup */}
      <section className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <SectionLabel>Fleet rollup</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          {VERDICT_ORDER.filter((v) => rollup[v]).map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5">
              <VerdictBadge verdict={v} />
              <span className="num text-sm text-fg-dim">×{rollup[v]}</span>
            </span>
          ))}
          {fleetRows.length === 0 && <span className="text-sm text-fg-dim">No segments yet.</span>}
        </div>
        <span className="num ml-auto text-[11px] text-fg-dim">
          {fleetRows.length} segment{fleetRows.length === 1 ? '' : 's'}
        </span>
      </section>

      {invalidCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} />
          {invalidCount} segment(s) hidden — each needs a wall thickness or design pressure to derive geometry.
        </div>
      )}

      {/* Fleet table + add */}
      <section className="mb-7 space-y-3">
        <div className="flex justify-end">
          <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing({})} disabled={!activeProjectId}>
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-fg">{selected.segment.header}</h2>
              <span className="num text-xs text-fg-dim">
                {selected.segment.field} · {selected.segment.nb}&quot; · {selected.segment.grade}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing({ segment: selected.segment })}>
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                className="btn btn-danger text-xs"
                onClick={() => void deleteSegment(selected.segment.id)}
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                type="button"
                onClick={() => void exportSelected(selected, selected.assessment)}
                className="btn btn-primary"
              >
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
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
      <footer className="mt-9 space-y-3 border-t border-line pt-5">
        <Disclaimer />
        <p className="num text-center text-[10px] tracking-wider text-fg-dim">
          MODULE 0 · PIGGABILITY &nbsp;—&nbsp; ROADMAP: INGESTION/QC · DETECTION · CLASSIFICATION &amp;
          SIZING · FITNESS-FOR-SERVICE · INSIGHTS · REPORT
        </p>
      </footer>
    </div>
  )
}
