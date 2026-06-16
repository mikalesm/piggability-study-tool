import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Gauge, Plus, Pencil, Trash2, AlertTriangle, Search, X, ArrowRight, Settings2, Sparkles, FileText } from 'lucide-react'
import { assess, defaultStudy } from './engine'
import { aiConfigured } from './ai'
import type { Assessment, StudyInputs, Verdict } from './engine/types'
import { getRepo, repoLabel } from './repo'
import type { Project, StoredSegment } from './repo/types'
import { SEED_PROJECT } from './data/seed'
import { FleetTable, sortRows, type FleetRow, type SortKey, type SortState } from './ui/FleetTable'
import { SegmentForm } from './ui/SegmentForm'
import { SegmentEditor } from './ui/SegmentEditor'
import { ProjectBar } from './ui/ProjectBar'
import { ProjectEditor, type ProjectDraft } from './ui/ProjectEditor'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { SettingsModal } from './ui/SettingsModal'
import { AiInsights } from './ui/AiInsights'
import { AiFleetSummary } from './ui/AiFleetSummary'
import { VerdictCard } from './ui/VerdictCard'
import { RiskPanel } from './ui/RiskPanel'
import { SuitabilityMatrix } from './ui/SuitabilityMatrix'
import { ScopeCard } from './ui/ScopeCard'
import { ActionsCard } from './ui/ActionsCard'
import { FieldDataCard } from './ui/FieldDataCard'
import { Disclaimer } from './ui/Disclaimer'
import { VerdictBadge, SectionLabel } from './ui/badges'

const VERDICT_ORDER: Verdict[] = [
  'Piggable',
  'Piggable w/ modifications',
  'Further study',
  'Not piggable as-is',
]
const HINT_KEY = 'piggability.hint.dismissed'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface ConfirmState {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [segments, setSegments] = useState<StoredSegment[]>([])
  const [studies, setStudies] = useState<Record<string, StudyInputs>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ segment?: StoredSegment } | null>(null)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'verdict', dir: 'asc' })
  const [verdictFilter, setVerdictFilter] = useState<Verdict | null>(null)

  const [projectModal, setProjectModal] = useState<'new' | 'edit' | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const [highlightTech, setHighlightTech] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)
  const [verdictChange, setVerdictChange] = useState<{ from: Verdict; to: Verdict } | null>(null)
  const [hintDismissed, setHintDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(HINT_KEY) === '1',
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiOn, setAiOn] = useState(() => aiConfigured())
  const [fleetSummaryOpen, setFleetSummaryOpen] = useState(false)

  const detailRef = useRef<HTMLDivElement>(null)
  const matrixRef = useRef<HTMLDivElement>(null)
  const lastVerdict = useRef<{ id: string; verdict: Verdict } | null>(null)
  const timers = useRef<number[]>([])

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
      timers.current.forEach(clearTimeout)
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

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    let r = fleetRows
    if (verdictFilter) r = r.filter((x) => x.assessment.verdict === verdictFilter)
    if (q) {
      r = r.filter((x) => {
        const s = x.segment
        const a = x.assessment
        return [s.field, s.header, s.grade, s.medium ?? 'Liquid', a.verdict, a.recommended.techKey ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    }
    return sortRows(r, sort)
  }, [fleetRows, search, verdictFilter, sort])

  const selected = fleetRows.find((r) => r.segment.id === selectedId) ?? null
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const rollup = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of fleetRows) counts[r.assessment.verdict] = (counts[r.assessment.verdict] ?? 0) + 1
    return counts
  }, [fleetRows])

  // Detect a verdict change on the SAME selected segment (cause→effect feedback).
  useEffect(() => {
    if (!selected) {
      lastVerdict.current = null
      return
    }
    const id = selected.segment.id
    const v = selected.assessment.verdict
    const prev = lastVerdict.current
    if (prev && prev.id === id && prev.verdict !== v) {
      setVerdictChange({ from: prev.verdict, to: v })
      if (!prefersReduced()) {
        setPulse(true)
        timers.current.push(window.setTimeout(() => setPulse(false), 1500))
      }
      timers.current.push(window.setTimeout(() => setVerdictChange(null), 3500))
    }
    lastVerdict.current = { id, verdict: v }
  }, [selected])

  function handleSelect(id: string) {
    setSelectedId(id)
    const el = detailRef.current
    if (el) {
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'nearest' }),
      )
    }
  }

  function pickTech(key: string) {
    setHighlightTech(key)
    matrixRef.current?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'nearest' })
    timers.current.push(window.setTimeout(() => setHighlightTech(null), 1600))
  }

  function onSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  function updateStudy(segmentId: string, next: StudyInputs) {
    setStudies((prev) => ({ ...prev, [segmentId]: next }))
    void getRepo().then((repo) => repo.saveStudy(segmentId, next))
  }

  // ── project CRUD ──────────────────────────────────────────────────────────
  async function selectProject(id: string) {
    setActiveProjectId(id)
    setVerdictFilter(null)
    setSearch('')
    await loadProject(id)
  }

  async function saveProject(draft: ProjectDraft) {
    const repo = await getRepo()
    if (projectModal === 'edit' && activeProject) {
      const updated = { ...activeProject, ...draft }
      await repo.saveProject(updated)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const id = `${slug(draft.name) || 'project'}-${crypto.randomUUID().slice(0, 6)}`
      const project: Project = { id, ...draft, createdAt: new Date().toISOString() }
      await repo.saveProject(project)
      setProjects((prev) => [...prev, project])
      setActiveProjectId(id)
      setSegments([])
      setStudies({})
      setSelectedId(null)
    }
    setProjectModal(null)
  }

  function askDeleteProject() {
    if (!activeProject || projects.length <= 1) return
    setConfirm({
      title: 'Delete project',
      body: `Delete "${activeProject.name}" and all of its segments? This cannot be undone.`,
      confirmLabel: 'Delete project',
      onConfirm: () => void deleteProject(),
    })
  }
  async function deleteProject() {
    if (!activeProject) return
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
    setConfirm(null)
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

  function askDeleteSegment(id: string) {
    const seg = segments.find((s) => s.id === id)
    if (!seg) return
    setConfirm({
      title: 'Delete segment',
      body: `Delete "${seg.header}"? This cannot be undone.`,
      confirmLabel: 'Delete segment',
      onConfirm: () => void deleteSegment(id),
    })
  }
  async function deleteSegment(id: string) {
    const repo = await getRepo()
    await repo.deleteSegment(id)
    setSegments((prev) => prev.filter((s) => s.id !== id))
    setStudies((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (selectedId === id) setSelectedId(null)
    setConfirm(null)
  }

  async function exportSelected(row: FleetRow, assessment: Assessment) {
    if (!activeProject) return
    const { downloadReport } = await import('./report/PiggabilityReport')
    downloadReport(activeProject, row.segment, assessment)
  }

  async function exportProposal() {
    if (!activeProject || fleetRows.length === 0) return
    const BIDDER_KEY = 'piggability.bidder'
    let bidder = typeof localStorage !== 'undefined' ? localStorage.getItem(BIDDER_KEY) ?? '' : ''
    if (typeof window !== 'undefined') {
      const entered = window.prompt('Bidder / contractor name for the proposal cover (optional):', bidder)
      if (entered !== null) {
        bidder = entered.trim()
        if (typeof localStorage !== 'undefined') localStorage.setItem(BIDDER_KEY, bidder)
      }
    }
    const [{ downloadTenderProposal }, { MELLITAH_PROJECT, MELLITAH_SOW }] = await Promise.all([
      import('./report/TenderProposal'),
      import('./data/mellitah'),
    ])
    const sow = activeProject.id === MELLITAH_PROJECT.id ? MELLITAH_SOW : undefined
    const rows = fleetRows.map((r) => ({ segment: r.segment, assessment: r.assessment }))
    downloadTenderProposal(activeProject, rows, sow, bidder)
  }

  function dismissHint() {
    setHintDismissed(true)
    if (typeof localStorage !== 'undefined') localStorage.setItem(HINT_KEY, '1')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-fg-dim">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent text-accent shadow-led" />
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400 shadow-led" />
              <span className="label hidden sm:inline">Storage</span>
              <span className="num text-[11px] text-fg-muted">{repoLabel()}</span>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-fg-dim transition-colors hover:border-line-strong hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="AI settings"
            >
              <Settings2 size={15} />
              <span className={`label hidden sm:inline ${aiOn ? 'text-emerald-300' : ''}`}>{aiOn ? 'AI on' : 'AI'}</span>
            </button>
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

      {/* First-run hint */}
      {!hintDismissed && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/[0.05] px-4 py-3 text-xs text-fg-muted">
          <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="label text-accent/90">How it works</span>
            <span className="inline-flex items-center gap-1.5">
              Select a line <ArrowRight size={12} className="text-fg-dim" /> read the verdict &amp; why{' '}
              <ArrowRight size={12} className="text-fg-dim" /> adjust the survey inputs{' '}
              <ArrowRight size={12} className="text-fg-dim" /> export the study.
            </span>
            <span className="text-fg-dim">Hover any ⓘ for a plain-language definition.</span>
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="shrink-0 rounded p-0.5 text-fg-dim hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Project bar */}
      <div className="mb-6">
        <ProjectBar
          projects={projects}
          activeId={activeProjectId}
          onSelect={(id) => void selectProject(id)}
          onNew={() => setProjectModal('new')}
          onRename={() => setProjectModal('edit')}
          onDelete={askDeleteProject}
        />
      </div>

      {/* Fleet rollup — chips filter the table */}
      <section className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <SectionLabel>Fleet rollup</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          {VERDICT_ORDER.filter((v) => rollup[v]).map((v) => {
            const active = verdictFilter === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVerdictFilter(active ? null : v)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  verdictFilter && !active ? 'opacity-45' : ''
                }`}
              >
                <VerdictBadge verdict={v} className={active ? 'ring-2' : ''} />
                <span className="num text-sm text-fg-dim">×{rollup[v]}</span>
              </button>
            )
          })}
          {fleetRows.length === 0 && <span className="text-sm text-fg-dim">No segments yet.</span>}
        </div>
        <span className="num ml-auto text-[11px] text-fg-dim">
          {visibleRows.length}/{fleetRows.length} shown
        </span>
      </section>

      {invalidCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} />
          {invalidCount} segment(s) hidden — each needs a wall thickness or design pressure to derive geometry.
        </div>
      )}

      {/* Toolbar */}
      <section className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-dim" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fleet…"
            aria-label="Search fleet"
            className="field pl-8"
          />
        </div>
        {(verdictFilter || search) && (
          <button type="button" className="btn btn-ghost text-xs" onClick={() => { setVerdictFilter(null); setSearch('') }}>
            <X size={13} /> Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {aiOn && fleetRows.length > 0 && (
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setFleetSummaryOpen(true)}>
              <Sparkles size={14} /> Fleet summary
            </button>
          )}
          {fleetRows.length > 0 && (
            <button type="button" className="btn btn-ghost text-xs" onClick={() => void exportProposal()}>
              <FileText size={14} /> Tender proposal
            </button>
          )}
          <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing({})} disabled={!activeProjectId}>
            <Plus size={14} /> Add segment
          </button>
        </div>
      </section>

      {/* Fleet */}
      <section className="mb-7">
        {fleetRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-panel/40 p-8 text-center">
            <p className="text-sm text-fg-muted">This project has no pipeline segments yet.</p>
            <button type="button" className="btn btn-primary mx-auto mt-3" onClick={() => setEditing({})}>
              <Plus size={15} /> Add the first segment
            </button>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="rounded-lg border border-line bg-panel/40 p-6 text-center text-sm text-fg-dim">
            No segments match the current filter.
          </div>
        ) : (
          <FleetTable rows={visibleRows} selectedId={selectedId} onSelect={handleSelect} sort={sort} onSort={onSort} />
        )}
      </section>

      {/* Selected segment detail */}
      {selected && (
        <section ref={detailRef} className="scroll-mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold text-fg">{selected.segment.header}</h2>
              <span className="num text-xs text-fg-dim">
                {selected.segment.field} · {selected.segment.nb}&quot; · {selected.segment.grade}
              </span>
              {verdictChange && (
                <span className="num inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                  {verdictChange.from} <ArrowRight size={10} /> {verdictChange.to}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing({ segment: selected.segment })}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" className="btn btn-danger text-xs" onClick={() => askDeleteSegment(selected.segment.id)}>
                <Trash2 size={14} /> Delete
              </button>
              <button type="button" onClick={() => void exportSelected(selected, selected.assessment)} className="btn btn-primary">
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>

          <RiskPanel risk={selected.assessment.risk} />

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
              <SegmentForm
                segment={selected.segment}
                assessment={selected.assessment}
                study={studies[selected.segment.id] ?? defaultStudy(selected.segment)}
                onChange={(next) => updateStudy(selected.segment.id, next)}
              />
            </div>
            <VerdictCard assessment={selected.assessment} pulse={pulse} onPickTech={pickTech} />
          </div>

          <div ref={matrixRef} className="scroll-mt-4">
            <SuitabilityMatrix rows={selected.assessment.rows} highlightKey={highlightTech} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ScopeCard assessment={selected.assessment} />
            <ActionsCard assessment={selected.assessment} />
          </div>

          <FieldDataCard segment={selected.segment} />

          <AiInsights
            segment={selected.segment}
            assessment={selected.assessment}
            configured={aiOn}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </section>
      )}

      {/* Modals */}
      {editing && activeProjectId && (
        <SegmentEditor
          projectId={activeProjectId}
          initial={editing.segment}
          existingIds={segments.map((s) => s.id)}
          onCancel={() => setEditing(null)}
          onSave={(seg) => void saveSegment(seg)}
        />
      )}
      {projectModal && (
        <ProjectEditor
          initial={projectModal === 'edit' ? (activeProject ?? undefined) : undefined}
          onCancel={() => setProjectModal(null)}
          onSave={(draft) => void saveProject(draft)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      )}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onSaved={() => setAiOn(aiConfigured())} />
      )}
      {fleetSummaryOpen && activeProject && (
        <AiFleetSummary project={activeProject} rows={visibleRows} onClose={() => setFleetSummaryOpen(false)} />
      )}

      {/* Footer */}
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
