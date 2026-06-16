import { useState } from 'react'
import { OD_BY_NB } from '../engine/constants'
import type { Grade, LocationClass, Medium } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { Modal } from './Modal'

const NB_OPTIONS = Object.keys(OD_BY_NB)
  .map(Number)
  .sort((a, b) => a - b)
const GRADES: Grade[] = ['X52', 'X60', 'X65', 'X70']

const DEFAULT_OBJECTIVE = 'Detect internal & external metal loss'

/** "Unknown" medium maps to null + mediumAssumed. */
type MediumChoice = Medium | 'Unknown'

export interface SegmentEditorProps {
  projectId: string
  initial?: StoredSegment
  existingIds: string[]
  onCancel: () => void
  onSave: (segment: StoredSegment) => void
}

const label = 'text-xs font-medium text-fg-muted'
const input = 'field'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function SegmentEditor({
  projectId,
  initial,
  existingIds,
  onCancel,
  onSave,
}: SegmentEditorProps) {
  const editing = !!initial
  const [field, setField] = useState(initial?.field ?? '')
  const [header, setHeader] = useState(initial?.header ?? '')
  const [nb, setNb] = useState<number>(initial?.nb ?? 16)
  const [grade, setGrade] = useState<Grade>(initial?.grade ?? 'X60')
  const [process, setProcess] = useState(initial?.process ?? '')
  const [dp, setDp] = useState(initial?.designPressureBarg?.toString() ?? '')
  const [mop, setMop] = useState(initial?.mopBarg?.toString() ?? '')
  const [pressureClass, setPressureClass] = useState(initial?.pressureClass ?? '')
  const [locationClass, setLocationClass] = useState<LocationClass>(initial?.locationClass ?? 1)
  const [designFactor, setDesignFactor] = useState<number>(initial?.designFactor ?? 0.72)
  const [medium, setMedium] = useState<MediumChoice>(
    initial ? (initial.medium ?? 'Unknown') : 'Liquid',
  )
  const [lengthKm, setLengthKm] = useState(initial?.lengthKm?.toString() ?? '')
  const [wt, setWt] = useState(initial?.wtMm?.toString() ?? '')
  const [coating, setCoating] = useState(initial?.coating ?? '')
  const [objective, setObjective] = useState(initial?.objective ?? DEFAULT_OBJECTIVE)
  const [lengthIllustrative, setLengthIllustrative] = useState(
    initial?.lengthIllustrative ?? false,
  )

  const dpNum = dp.trim() === '' ? null : Number(dp)
  const wtNum = wt.trim() === '' ? null : Number(wt)

  const errors: string[] = []
  if (!header.trim()) errors.push('Header is required.')
  if (wtNum == null && dpNum == null)
    errors.push('Provide a wall thickness or a design pressure (needed to derive geometry).')
  if (wt.trim() !== '' && (Number.isNaN(wtNum) || (wtNum ?? 0) <= 0))
    errors.push('Wall thickness must be a positive number.')
  if (dp.trim() !== '' && (Number.isNaN(dpNum) || (dpNum ?? 0) <= 0))
    errors.push('Design pressure must be a positive number.')

  function build(): StoredSegment {
    const id = initial?.id ?? `${slug(field || header) || 'seg'}-${uniqueSuffix(existingIds)}`
    return {
      id,
      projectId,
      field: field.trim(),
      header: header.trim(),
      nb,
      grade,
      process: process.trim() || undefined,
      designPressureBarg: dpNum,
      mopBarg: mop.trim() === '' ? null : Number(mop),
      pressureClass: pressureClass.trim() || undefined,
      locationClass,
      designFactor,
      medium: medium === 'Unknown' ? null : medium,
      lengthKm: lengthKm.trim() === '' ? 0 : Number(lengthKm),
      wtMm: wtNum,
      coating: coating.trim() || undefined,
      objective: objective.trim() || DEFAULT_OBJECTIVE,
      mediumAssumed: medium === 'Unknown' ? true : undefined,
      mopAssumed: mop.trim() === '' ? true : undefined,
      lengthIllustrative,
    }
  }

  return (
    <Modal
      title={editing ? `Edit segment — ${initial!.header}` : 'Add pipeline segment'}
      onClose={onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            disabled={errors.length > 0}
            onClick={() => onSave(build())}
            className="btn btn-primary"
          >
            {editing ? 'Save changes' : 'Add segment'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cell label="Field">
          <input className={input} value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. Bab" />
        </Cell>
        <Cell label="Header *" span2>
          <input className={input} value={header} onChange={(e) => setHeader(e.target.value)} placeholder="e.g. North HP Header" />
        </Cell>

        <Cell label="Nominal bore (in)">
          <select className={input} value={nb} onChange={(e) => setNb(Number(e.target.value))}>
            {NB_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}"</option>
            ))}
          </select>
        </Cell>
        <Cell label="Grade">
          <select className={input} value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Cell>
        <Cell label="Process">
          <input className={input} value={process} onChange={(e) => setProcess(e.target.value)} placeholder="SMLS / LSAW" />
        </Cell>

        <Cell label="Design pressure (barg)">
          <input className={input} value={dp} onChange={(e) => setDp(e.target.value)} placeholder="blank → use WT" inputMode="decimal" />
        </Cell>
        <Cell label="MOP (barg)">
          <input className={input} value={mop} onChange={(e) => setMop(e.target.value)} placeholder="blank → assumed" inputMode="decimal" />
        </Cell>
        <Cell label="Pressure class">
          <input className={input} value={pressureClass} onChange={(e) => setPressureClass(e.target.value)} placeholder="2500#" />
        </Cell>

        <Cell label="Wall thickness (mm)">
          <input className={input} value={wt} onChange={(e) => setWt(e.target.value)} placeholder="blank → B31.4 calc" inputMode="decimal" />
        </Cell>
        <Cell label="Location class">
          <select
            className={input}
            value={locationClass}
            onChange={(e) => setLocationClass(Number(e.target.value) as LocationClass)}
          >
            <option value={1}>Class 1</option>
            <option value={2}>Class 2</option>
          </select>
        </Cell>
        <Cell label="Design factor F">
          <select className={input} value={designFactor} onChange={(e) => setDesignFactor(Number(e.target.value))}>
            <option value={0.72}>0.72</option>
            <option value={0.6}>0.60</option>
          </select>
        </Cell>

        <Cell label="Medium">
          <select className={input} value={medium} onChange={(e) => setMedium(e.target.value as MediumChoice)}>
            <option>Liquid</option>
            <option>Gas</option>
            <option value="Unknown">Unknown (assume Liquid)</option>
          </select>
        </Cell>
        <Cell label="Length (km)">
          <input className={input} value={lengthKm} onChange={(e) => setLengthKm(e.target.value)} inputMode="decimal" />
        </Cell>
        <Cell label="Coating">
          <input className={input} value={coating} onChange={(e) => setCoating(e.target.value)} placeholder="3LPE" />
        </Cell>

        <Cell label="Objective" span3>
          <input className={input} value={objective} onChange={(e) => setObjective(e.target.value)} />
        </Cell>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={lengthIllustrative}
          onChange={(e) => setLengthIllustrative(e.target.checked)}
          className="accent-accent"
        />
        Length is illustrative (flag in UI &amp; report)
      </label>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function Cell({
  label: text,
  children,
  span2,
  span3,
}: {
  label: string
  children: React.ReactNode
  span2?: boolean
  span3?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1 ${span3 ? 'col-span-2 sm:col-span-3' : span2 ? 'col-span-2' : ''}`}>
      <span className={label}>{text}</span>
      {children}
    </label>
  )
}

function uniqueSuffix(existing: string[]): string {
  // deterministic short suffix that avoids collisions with current ids
  let n = existing.length + 1
  let candidate = String(n)
  const set = new Set(existing)
  while (set.has(candidate) || existing.some((id) => id.endsWith(`-${candidate}`))) {
    n += 1
    candidate = String(n)
  }
  return candidate
}
