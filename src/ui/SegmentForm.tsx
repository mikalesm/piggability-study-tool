import type { Assessment, StudyInputs } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { AssumptionChip, SectionLabel } from './badges'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      {children}
      {hint && <span className="text-[10px] leading-tight text-fg-dim">{hint}</span>}
    </label>
  )
}

const SURVEY_HINT = 'Survey assumption — confirm on site'

/** A boxed instrument readout for a single derived value. */
function Readout({ label, value, unit, mark }: { label: string; value: string; unit?: string; mark?: string }) {
  return (
    <div className="rounded-md border border-line bg-panel-2/60 px-3 py-2">
      <div className="label">{label}</div>
      <div className="num mt-1 text-[15px] text-fg">
        {value}
        {unit && <span className="ml-1 text-xs text-fg-dim">{unit}</span>}
        {mark && <AssumptionChip label={mark} />}
      </div>
    </div>
  )
}

export function SegmentForm({
  segment,
  assessment,
  study,
  onChange,
}: {
  segment: StoredSegment
  assessment: Assessment
  study: StudyInputs
  onChange: (next: StudyInputs) => void
}) {
  const g = assessment.geometry
  const set = <K extends keyof StudyInputs>(key: K, value: StudyInputs[K]) =>
    onChange({ ...study, [key]: value })

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel className="mb-3">Derived geometry</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Readout label="Outside dia" value={g.odMm.toFixed(1)} unit="mm" />
          <Readout label="Wall thk" value={g.wtMm.toFixed(1)} unit="mm" mark={g.wtComputed ? 'calc' : undefined} />
          <Readout label="Bore ID" value={g.idMm.toFixed(1)} unit="mm" />
          <Readout label="D / t" value={g.dOverT.toFixed(1)} />
          <Readout label="Length" value={g.lengthKm.toFixed(1)} unit="km" mark={segment.lengthIllustrative ? 'illus' : undefined} />
          <Readout label="Grade" value={segment.grade} />
        </div>
        <p className="mt-2.5 flex items-center gap-2 text-[11px] text-fg-dim">
          <span className="label">Objective</span>
          <span className="text-fg-muted">{g.objective}</span>
        </p>
      </section>

      <section>
        <SectionLabel className="mb-3">
          Study inputs · survey
        </SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Tightest bend (D)" hint={SURVEY_HINT}>
            <input
              type="number"
              step="0.5"
              min="0"
              className="field num"
              value={study.bendD}
              onChange={(e) => set('bendD', Number(e.target.value))}
            />
          </Field>
          <Field label="Velocity (m/s)" hint={SURVEY_HINT}>
            <input
              type="number"
              step="0.1"
              min="0"
              className="field num"
              value={study.velocity}
              onChange={(e) => set('velocity', Number(e.target.value))}
            />
          </Field>
          <Field label="Medium" hint={segment.mediumAssumed ? 'Assumed in scope' : undefined}>
            <select
              className="field"
              value={study.medium}
              onChange={(e) => set('medium', e.target.value as StudyInputs['medium'])}
            >
              <option>Liquid</option>
              <option>Gas</option>
            </select>
          </Field>
          <Field label="Cleanliness">
            <select
              className="field"
              value={study.cleanliness}
              onChange={(e) => set('cleanliness', e.target.value as StudyInputs['cleanliness'])}
            >
              <option>Clean</option>
              <option>Heavy debris</option>
            </select>
          </Field>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Toggle label="Launcher trap" value={study.launcher} onChange={(v) => set('launcher', v)} />
          <Toggle label="Receiver trap" value={study.receiver} onChange={(v) => set('receiver', v)} />
          <Toggle label="Reduced bore" value={study.reducedBore} onChange={(v) => set('reducedBore', v)} invert />
          <Toggle label="Dual diameter" value={study.dualDia} onChange={(v) => set('dualDia', v)} invert />
        </div>
      </section>
    </div>
  )
}

/**
 * A labelled toggle styled like a panel switch. `invert` flips the accent so a
 * "YES" on a problem condition (reduced bore, dual diameter) reads as a caution,
 * not a confirmation.
 */
function Toggle({
  label,
  value,
  onChange,
  invert = false,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  invert?: boolean
}) {
  const active = invert
    ? value
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      : 'border-line bg-panel-2 text-fg-dim'
    : value
      ? 'border-accent/40 bg-accent/10 text-accent'
      : 'border-line bg-panel-2 text-fg-dim'
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors hover:border-line-strong ${active}`}
    >
      <span>{label}</span>
      <span className="num text-[11px] font-semibold">{value ? 'YES' : 'NO'}</span>
    </button>
  )
}
