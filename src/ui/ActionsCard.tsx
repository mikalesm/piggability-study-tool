import { ClipboardCheck, Info } from 'lucide-react'
import type { Assessment } from '../engine/types'

export function ActionsCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-zinc-200">Pre-inspection actions</h3>
        </div>
        <ul className="space-y-2">
          {assessment.actions.map((a) => (
            <li key={a} className="flex items-start gap-2 text-sm text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-zinc-200">Assumptions on file</h3>
        </div>
        <ul className="space-y-1.5">
          {assessment.assumptions.map((a) => (
            <li key={a} className="text-xs leading-relaxed text-zinc-400">
              • {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
