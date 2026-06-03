import { Wrench, Ban, Target } from 'lucide-react'
import type { Assessment } from '../engine/types'
import { VerdictBadge } from './badges'

export function VerdictCard({ assessment }: { assessment: Assessment }) {
  const { verdict, recommended, blockers } = assessment
  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Verdict</h3>
        <VerdictBadge verdict={verdict} />
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <Target size={14} className="text-accent" />
          Recommended primary tool
        </div>
        <div className="mt-1 text-lg font-semibold text-accent">
          {recommended.techKey ?? 'None viable as-is'}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{recommended.why}</p>
        {recommended.vendors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recommended.vendors.map((v) => (
              <span
                key={v}
                className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {blockers.length > 0 ? (
            <Ban size={14} className="text-rose-400" />
          ) : (
            <Wrench size={14} className="text-emerald-400" />
          )}
          Blockers
        </div>
        {blockers.length === 0 ? (
          <p className="mt-1 text-sm text-emerald-300">None identified.</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm text-rose-300">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
