import { ArrowRight } from 'lucide-react'
import type { Assessment } from '../engine/types'
import { SectionLabel } from './badges'

export function ActionsCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
        <SectionLabel className="mb-3.5">Pre-inspection actions</SectionLabel>
        <ul className="space-y-2.5">
          {assessment.actions.map((a) => (
            <li key={a} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <ArrowRight size={14} className="mt-0.5 shrink-0 text-accent/80" />
              <span className="leading-snug">{a}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-accent/20 bg-accent/[0.04] p-4">
        <SectionLabel className="mb-2.5">Assumptions on file</SectionLabel>
        <ul className="space-y-1.5">
          {assessment.assumptions.map((a) => (
            <li key={a} className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
