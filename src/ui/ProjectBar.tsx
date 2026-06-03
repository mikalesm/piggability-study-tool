import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import type { Project } from '../repo/types'

export function ProjectBar({
  projects,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  projects: Project[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const iconBtn =
    'inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500">Project</span>
      <select
        value={activeId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-accent"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" className={iconBtn} onClick={onNew}>
        <FolderPlus size={14} /> New
      </button>
      <button type="button" className={iconBtn} onClick={onRename} disabled={!activeId}>
        <Pencil size={14} /> Rename
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
        onClick={onDelete}
        disabled={!activeId || projects.length <= 1}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  )
}
