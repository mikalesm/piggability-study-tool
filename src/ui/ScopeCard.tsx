import type { Assessment } from '../engine/types'
import { SectionLabel } from './badges'

export function ScopeCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <SectionLabel className="mb-3.5">Recommended scope</SectionLabel>
      <ol className="space-y-2.5">
        {assessment.scope.map((item, i) => (
          <li key={item} className="flex gap-3 text-sm text-fg-muted">
            <span className="num mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line bg-panel-2 text-[11px] text-accent">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
