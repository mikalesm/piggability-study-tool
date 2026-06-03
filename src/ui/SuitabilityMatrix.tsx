import type { TechResult } from '../engine/types'
import { LevelBadge, SectionLabel } from './badges'

export function SuitabilityMatrix({ rows }: { rows: TechResult[] }) {
  return (
    <div className="rounded-lg border border-line bg-panel shadow-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <SectionLabel>Technology suitability matrix</SectionLabel>
        <span className="text-[11px] text-fg-dim">Indicative envelopes — confirm vs datasheets</span>
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
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line/60">
                <td className="num px-4 py-2.5 font-medium text-fg">{r.key}</td>
                <td className="px-4 py-2.5 text-fg-muted">{r.role}</td>
                <td className="px-4 py-2.5">
                  <LevelBadge level={r.level} />
                </td>
                <td className="px-4 py-2.5 text-fg-muted">{r.note}</td>
                <td className="num px-4 py-2.5 text-[11px] text-fg-dim">{r.vendors.join('  ·  ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
