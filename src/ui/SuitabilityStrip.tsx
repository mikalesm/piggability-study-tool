import type { TechResult } from '../engine/types'
import { levelTone } from './badges'

const SHORT: Record<string, string> = {
  'Caliper / Geometry': 'CAL',
  'MFL (axial)': 'MFL',
  'UT Wall (UTWM)': 'UTWM',
  'UT Crack (UTCD)': 'UTCD',
  EMAT: 'EMAT',
}

/** Compact one-line lamp strip of every technology — at-a-glance readout. */
export function SuitabilityStrip({
  rows,
  onPick,
}: {
  rows: TechResult[]
  onPick?: (key: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map((r) => {
        const tone = levelTone(r.level)
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onPick?.(r.key)}
            aria-label={`${r.key}: ${r.level}`}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-panel-2 px-1.5 py-1 transition-colors hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <span className={`h-1.5 w-1.5 rounded-full shadow-led ${tone.dot} ${tone.text}`} />
            <span className="num text-[10px] text-fg-muted">{SHORT[r.key] ?? r.key}</span>
          </button>
        )
      })}
    </div>
  )
}
