import { ListChecks } from 'lucide-react'
import type { Assessment } from '../engine/types'

export function ScopeCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-zinc-200">Recommended scope</h3>
      </div>
      <ol className="space-y-2">
        {assessment.scope.map((item, i) => (
          <li key={item} className="flex gap-2.5 text-sm text-zinc-300">
            <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-800 text-[11px] text-accent">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
