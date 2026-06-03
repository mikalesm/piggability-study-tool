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
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label mr-1">Project</span>
      <select
        value={activeId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="field max-w-[16rem]"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-ghost text-xs" onClick={onNew}>
        <FolderPlus size={14} /> New
      </button>
      <button type="button" className="btn btn-ghost text-xs" onClick={onRename} disabled={!activeId}>
        <Pencil size={14} /> Rename
      </button>
      <button
        type="button"
        className="btn btn-danger text-xs"
        onClick={onDelete}
        disabled={!activeId || projects.length <= 1}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  )
}
