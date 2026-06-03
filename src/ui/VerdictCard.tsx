import { Ban, ShieldCheck, Lightbulb } from 'lucide-react'
import type { Assessment, ReasonTone } from '../engine/types'
import { VerdictBadge, SectionLabel } from './badges'
import { SuitabilityStrip } from './SuitabilityStrip'

const TONE_DOT: Record<ReasonTone, string> = {
  ok: 'bg-emerald-400 text-emerald-400',
  warn: 'bg-amber-400 text-amber-400',
  block: 'bg-rose-400 text-rose-400',
}

export function VerdictCard({
  assessment,
  pulse = false,
  onPickTech,
}: {
  assessment: Assessment
  pulse?: boolean
  onPickTech?: (key: string) => void
}) {
  const { verdict, rationale, recommended, blockers, rows } = assessment
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <SectionLabel>Assessment</SectionLabel>
        <VerdictBadge
          verdict={verdict}
          className={pulse ? 'motion-safe:animate-[pulse_0.7s_ease-in-out_2]' : ''}
        />
      </div>

      {/* At-a-glance suitability lamps */}
      <SuitabilityStrip rows={rows} onPick={onPickTech} />

      {/* Primary tool readout */}
      <div className="rounded-md border border-line bg-ink/40 p-3.5">
        <div className="label">Recommended primary tool</div>
        <div className="num mt-1.5 text-2xl font-semibold tracking-tight text-accent">
          {recommended.techKey ?? 'None viable as-is'}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{recommended.why}</p>
        {recommended.vendors.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {recommended.vendors.map((v) => (
              <span
                key={v}
                className="num rounded border border-line bg-panel-2 px-1.5 py-0.5 text-[11px] text-fg-muted"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Why this verdict */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          {blockers.length > 0 ? (
            <Ban size={13} className="text-rose-400" />
          ) : (
            <ShieldCheck size={13} className="text-emerald-400" />
          )}
          <span className="label">Why this verdict</span>
        </div>
        <p className="mb-2 text-sm leading-relaxed text-fg">{rationale.summary}</p>
        <ul className="space-y-1.5">
          {rationale.reasons.map((r) => (
            <li key={r.label} className="flex items-start gap-2 text-[13px] leading-snug">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full shadow-led ${TONE_DOT[r.tone]}`} />
              <span>
                <span className="font-medium text-fg">{r.label}.</span>{' '}
                <span className="text-fg-muted">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* What would flip it */}
      {rationale.flips.length > 0 && (
        <div className="rounded-md border border-line bg-panel-2/50 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Lightbulb size={13} className="text-accent" />
            <span className="label">To improve</span>
          </div>
          <ul className="space-y-1.5">
            {rationale.flips.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-fg-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
