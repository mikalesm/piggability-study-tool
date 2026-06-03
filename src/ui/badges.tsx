import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import type { Level, Verdict } from '../engine/types'

const VERDICT_STYLES: Record<Verdict, string> = {
  Piggable: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  'Piggable w/ modifications': 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  'Further study': 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  'Not piggable as-is': 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
}

export function VerdictBadge({ verdict, className = '' }: { verdict: Verdict; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${VERDICT_STYLES[verdict]} ${className}`}
    >
      {verdict}
    </span>
  )
}

const LEVEL_META: Record<Level, { cls: string; Icon: typeof CheckCircle2 }> = {
  Good: { cls: 'text-emerald-300', Icon: CheckCircle2 },
  Marginal: { cls: 'text-amber-300', Icon: AlertTriangle },
  'Not suitable': { cls: 'text-rose-300', Icon: XCircle },
}

export function LevelBadge({ level }: { level: Level }) {
  const meta = LEVEL_META[level] ?? { cls: 'text-zinc-400', Icon: HelpCircle }
  const { cls, Icon } = meta
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cls}`}>
      <Icon size={14} className="shrink-0" />
      {level}
    </span>
  )
}

/** Small amber chip used to mark assumed / computed values. */
export function AssumptionChip({ label }: { label: string }) {
  return (
    <span className="ml-1 inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent ring-1 ring-accent/30">
      {label}
    </span>
  )
}
