import type { TechResult } from '../engine/types'
import { LevelBadge } from './badges'

export function SuitabilityMatrix({ rows }: { rows: TechResult[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-200">Technology suitability matrix</h3>
        <p className="text-[11px] text-zinc-600">Envelopes are indicative of the market — confirm against vendor datasheets.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2 font-medium">Technology</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Suitability</th>
              <th className="px-4 py-2 font-medium">Note</th>
              <th className="px-4 py-2 font-medium">Market vendors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-zinc-800/60">
                <td className="px-4 py-2.5 font-medium text-zinc-100">{r.key}</td>
                <td className="px-4 py-2.5 text-zinc-400">{r.role}</td>
                <td className="px-4 py-2.5">
                  <LevelBadge level={r.level} />
                </td>
                <td className="px-4 py-2.5 text-zinc-400">{r.note}</td>
                <td className="px-4 py-2.5 text-[11px] text-zinc-500">{r.vendors.join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
