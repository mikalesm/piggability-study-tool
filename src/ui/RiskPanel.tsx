import { ChevronDown } from 'lucide-react'
import type { ReasonTone, RiskBand, RiskGauge, RiskProfile } from '../engine/types'
import { Gauge, type GaugeColor } from './Gauge'
import { SectionLabel } from './badges'
import { InfoHint } from './Tooltip'

const TONE_DOT: Record<ReasonTone, string> = {
  ok: 'bg-emerald-400 text-emerald-400',
  warn: 'bg-amber-400 text-amber-400',
  block: 'bg-rose-400 text-rose-400',
}

/** Map a band to a color, respecting whether higher is good (confidence). */
function color(band: RiskBand, goodHigh: boolean): GaugeColor {
  if (band === 'Medium') return 'amber'
  const high = band === 'High'
  return high === goodHigh ? 'emerald' : 'rose'
}

function GaugeBlock({
  gauge,
  label,
  goodHigh,
}: {
  gauge: RiskGauge
  label: string
  goodHigh: boolean
}) {
  return (
    <details className="group flex-1 rounded-md border border-line bg-panel-2/40 p-3 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
        <Gauge value={gauge.score} label={label} bandLabel={gauge.band} color={color(gauge.band, goodHigh)} />
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-fg-dim">
          {gauge.factors.length} factor{gauge.factors.length === 1 ? '' : 's'}
          <ChevronDown size={11} className="transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <ul className="mt-2 space-y-1.5 border-t border-line/60 pt-2">
        {gauge.factors.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-[11px] leading-snug">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[f.tone]}`} />
            <span>
              <span className="font-medium text-fg">{f.label}</span>
              {f.points !== 0 && (
                <span className="num ml-1 text-fg-dim">
                  {f.points > 0 ? '+' : ''}
                  {f.points}
                </span>
              )}
              <span className="block text-fg-muted">{f.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function RiskPanel({ risk }: { risk: RiskProfile }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <SectionLabel>Risk &amp; confidence</SectionLabel>
          <InfoHint
            term="risk-screening"
            label="risk screening"
          />
        </div>
        <span className="text-[11px] text-fg-dim">Indicative screening — not an FFS result</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <GaugeBlock gauge={risk.execution} label="Execution risk" goodHigh={false} />
        <GaugeBlock gauge={risk.confidence} label="Data confidence" goodHigh />
        <GaugeBlock gauge={risk.priority} label="Inspection priority" goodHigh={false} />
      </div>
    </div>
  )
}
