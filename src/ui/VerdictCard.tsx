import { Ban, ShieldCheck } from 'lucide-react'
import type { Assessment } from '../engine/types'
import { VerdictBadge, SectionLabel } from './badges'

export function VerdictCard({ assessment }: { assessment: Assessment }) {
  const { verdict, recommended, blockers } = assessment
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <SectionLabel>Assessment</SectionLabel>
        <VerdictBadge verdict={verdict} />
      </div>

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

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          {blockers.length > 0 ? (
            <Ban size={13} className="text-rose-400" />
          ) : (
            <ShieldCheck size={13} className="text-emerald-400" />
          )}
          <span className="label">Blockers</span>
        </div>
        {blockers.length === 0 ? (
          <p className="text-sm text-emerald-300/90">None identified.</p>
        ) : (
          <ul className="space-y-1">
            {blockers.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-rose-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
