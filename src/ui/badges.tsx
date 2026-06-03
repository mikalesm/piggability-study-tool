import type { Level, Verdict } from '../engine/types'

/** Per-verdict color (text color drives the LED dot glow via currentColor). */
const VERDICT_STYLES: Record<Verdict, { ring: string; text: string; dot: string }> = {
  Piggable: {
    ring: 'ring-emerald-500/30 bg-emerald-500/10',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  'Piggable w/ modifications': {
    ring: 'ring-amber-500/30 bg-amber-500/10',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  'Further study': {
    ring: 'ring-sky-500/30 bg-sky-500/10',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
  'Not piggable as-is': {
    ring: 'ring-rose-500/30 bg-rose-500/10',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
}

export function VerdictBadge({ verdict, className = '' }: { verdict: Verdict; className?: string }) {
  const s = VERDICT_STYLES[verdict]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ring-1 ${s.ring} ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shadow-led ${s.dot} ${s.text}`} />
      {verdict}
    </span>
  )
}

const LEVEL_META: Record<Level, { text: string; dot: string }> = {
  Good: { text: 'text-emerald-300', dot: 'bg-emerald-400' },
  Marginal: { text: 'text-amber-300', dot: 'bg-amber-400' },
  'Not suitable': { text: 'text-rose-300', dot: 'bg-rose-400' },
}

/** Suitability lamp: colored LED + label (color is never the only signal). */
export function LevelBadge({ level }: { level: Level }) {
  const m = LEVEL_META[level] ?? { text: 'text-fg-muted', dot: 'bg-fg-dim' }
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${m.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full shadow-led ${m.dot}`} />
      {level}
    </span>
  )
}

/** Small outlined chip marking an assumed / computed value. */
export function AssumptionChip({ label }: { label: string }) {
  return (
    <span className="num ml-1.5 inline-flex items-center rounded border border-accent/30 px-1 py-px text-[9px] font-medium uppercase tracking-wider text-accent/90">
      {label}
    </span>
  )
}

/** Reusable instrument-panel section label with an accent tick. */
export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="tick" />
      <span className="label">{children}</span>
    </div>
  )
}
