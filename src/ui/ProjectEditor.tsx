import { useState } from 'react'
import type { Project } from '../repo/types'
import { Modal } from './Modal'

export interface ProjectDraft {
  name: string
  client: string
  code: string
}

/** Modal form to create or rename a project — replaces window.prompt. */
export function ProjectEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Project
  onCancel: () => void
  onSave: (draft: ProjectDraft) => void
}) {
  const editing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [client, setClient] = useState(initial?.client ?? '')
  const [code, setCode] = useState(initial?.code ?? 'ASME B31.4 / ADNOC AGES-SP-10-003')

  const valid = name.trim().length > 0

  return (
    <Modal
      title={editing ? 'Rename project' : 'New project'}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave({ name: name.trim(), client: client.trim(), code: code.trim() })}
          >
            {editing ? 'Save' : 'Create project'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">Name *</span>
          <input
            className="field"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ADNOC Pilot Fleet"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">Client</span>
          <input
            className="field"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. ADNOC Onshore"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">Design code</span>
          <input className="field" value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
      </div>
    </Modal>
  )
}
