import type { Assessment, StudyInputs } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { AssumptionChip } from './badges'

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
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
    </label>
  )
}

const SURVEY_HINT = 'Survey assumption — confirm by field survey'

const inputCls =
  'num w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent'

function Derived({ label, value, mark }: { label: string; value: string; mark?: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="num mt-0.5 text-sm text-zinc-100">
        {value}
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
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Derived geometry
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Derived label="OD" value={`${g.odMm.toFixed(1)} mm`} />
          <Derived
            label="Wall thickness"
            value={`${g.wtMm.toFixed(1)} mm`}
            mark={g.wtComputed ? 'calc' : undefined}
          />
          <Derived label="Bore ID" value={`${g.idMm.toFixed(1)} mm`} />
          <Derived label="D/t" value={g.dOverT.toFixed(1)} />
          <Derived
            label="Length"
            value={`${g.lengthKm.toFixed(1)} km`}
            mark={segment.lengthIllustrative ? 'illustr.' : undefined}
          />
          <Derived label="Grade" value={segment.grade} />
        </div>
        <p className="mt-2 text-[11px] text-zinc-600">Objective: {g.objective}</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Study inputs <span className="text-zinc-600">(survey — not in design data)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Tightest bend (D)" hint={SURVEY_HINT}>
            <input
              type="number"
              step="0.5"
              min="0"
              className={inputCls}
              value={study.bendD}
              onChange={(e) => set('bendD', Number(e.target.value))}
            />
          </Field>
          <Field label="Velocity (m/s)" hint={SURVEY_HINT}>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              value={study.velocity}
              onChange={(e) => set('velocity', Number(e.target.value))}
            />
          </Field>
          <Field label="Medium" hint={segment.mediumAssumed ? 'Assumed in scope' : undefined}>
            <select
              className={inputCls}
              value={study.medium}
              onChange={(e) => set('medium', e.target.value as StudyInputs['medium'])}
            >
              <option>Liquid</option>
              <option>Gas</option>
            </select>
          </Field>
          <Field label="Cleanliness">
            <select
              className={inputCls}
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
          <Toggle
            label="Reduced-bore valves"
            value={study.reducedBore}
            onChange={(v) => set('reducedBore', v)}
          />
          <Toggle label="Dual diameter" value={study.dualDia} onChange={(v) => set('dualDia', v)} />
        </div>
      </section>
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
        value
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
      }`}
    >
      <span>{label}</span>
      <span className="num">{value ? 'YES' : 'NO'}</span>
    </button>
  )
}
