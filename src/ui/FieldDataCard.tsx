import { trapFeasibility } from '../engine'
import type { Segment } from '../engine/types'
import { SectionLabel } from './badges'

const STATUS_TONE: Record<string, string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  confirm: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  unknown: 'border-line bg-panel-2 text-fg-dim',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-fg-dim">{label}</span>
      <span className="num text-right text-fg-muted">{value}</span>
    </div>
  )
}

/** Descriptive field data (pig traps + flow assurance) captured from scope appendices. */
export function FieldDataCard({ segment }: { segment: Segment }) {
  const { traps, flowAssurance: fa } = segment
  if (!traps && !fa) return null
  const feas = traps ? trapFeasibility(segment) : null

  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <SectionLabel className="mb-3.5">Field data — from scope</SectionLabel>

      {traps && feas && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="label text-fg-dim">Pig traps</span>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${STATUS_TONE[feas.status]}`}>{feas.label}</span>
          </div>
          <div className="space-y-1.5">
            {traps.launcherBarrelMm != null && <Row label="Launcher barrel" value={`${traps.launcherBarrelMm} mm`} />}
            {traps.receiverBarrelMm != null && <Row label="Receiver barrel" value={`${traps.receiverBarrelMm} mm`} />}
            {traps.boreMm != null && <Row label="Trap bore" value={`${traps.boreMm} mm`} />}
            {(traps.valveType || traps.orientation) && (
              <Row label="Valve / orientation" value={[traps.valveType, traps.orientation].filter(Boolean).join(' · ')} />
            )}
          </div>
          <p className="mt-2 text-xs leading-snug text-fg-dim">{feas.note}</p>
        </div>
      )}

      {fa && (
        <div className={traps ? 'border-t border-line pt-3' : ''}>
          <div className="mb-2 flex items-center gap-2">
            <span className="label text-fg-dim">Flow assurance</span>
            {fa.waxy && <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">Waxy crude</span>}
          </div>
          <div className="space-y-1.5">
            {fa.apiGravity != null && <Row label="API gravity" value={`${fa.apiGravity}°`} />}
            {fa.pourPointC != null && <Row label="Pour point" value={`${fa.pourPointC} °C`} />}
          </div>
          {fa.note && <p className="mt-2 text-xs leading-snug text-fg-dim">{fa.note}</p>}
          {fa.waxy && (
            <p className="mt-1.5 text-xs leading-snug text-fg-dim">
              High pour point drives the progressive cleaning / gauging campaign before tool runs.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
