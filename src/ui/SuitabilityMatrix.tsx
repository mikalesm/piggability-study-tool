import type { TechResult } from '../engine/types'
import { LevelBadge, SectionLabel } from './badges'
import { InfoHint } from './Tooltip'

/** Map a tech key to the glossary term that best explains it. */
const TECH_TERM: Record<string, string> = {
  'MFL (axial)': 'mfl-saturation',
  'UT Wall (UTWM)': 'utwm',
  'UT Crack (UTCD)': 'utcd',
  EMAT: 'emat',
  'Caliper / Geometry': 'gauge-plate',
}

export function SuitabilityMatrix({
  rows,
  highlightKey,
}: {
  rows: TechResult[]
  highlightKey?: string | null
}) {
  return (
    <div className="rounded-lg border border-line bg-panel shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <SectionLabel>Technology suitability matrix</SectionLabel>
        <div className="flex items-center gap-3 text-[11px] text-fg-dim">
          <span className="hidden items-center sm:inline-flex">
            Couplant
            <InfoHint term="couplant" label="couplant" />
          </span>
          <span className="hidden items-center sm:inline-flex">
            MFL saturation
            <InfoHint term="mfl-saturation" label="MFL saturation" />
          </span>
          <span>Indicative envelopes — confirm vs datasheets</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="label px-4 py-2 font-normal">Technology</th>
              <th className="label px-4 py-2 font-normal">Role</th>
              <th className="label px-4 py-2 font-normal">Suitability</th>
              <th className="label px-4 py-2 font-normal">Note</th>
              <th className="label px-4 py-2 font-normal">Market vendors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const lit = highlightKey === r.key
              return (
                <tr
                  key={r.key}
                  className={`border-t border-line/60 transition-colors ${
                    lit ? 'bg-accent/[0.08]' : ''
                  }`}
                >
                  <td className="num px-4 py-2.5 font-medium text-fg">
                    <span className="inline-flex items-center">
                      {r.key}
                      {TECH_TERM[r.key] && <InfoHint term={TECH_TERM[r.key]} label={r.key} />}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{r.role}</td>
                  <td className="px-4 py-2.5">
                    <LevelBadge level={r.level} />
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{r.note}</td>
                  <td className="num px-4 py-2.5 text-[11px] text-fg-dim">{r.vendors.join('  ·  ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
