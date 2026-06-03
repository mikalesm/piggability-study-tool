import type { Assessment } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { VerdictBadge, AssumptionChip } from './badges'

export interface FleetRow {
  segment: StoredSegment
  assessment: Assessment
}

export function FleetTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: FleetRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Header</th>
            <th className="px-3 py-2 text-right font-medium">NB"</th>
            <th className="px-3 py-2 text-right font-medium">WT mm</th>
            <th className="px-3 py-2 text-right font-medium">Bore ID mm</th>
            <th className="px-3 py-2 font-medium">Medium</th>
            <th className="px-3 py-2 font-medium">Verdict</th>
            <th className="px-3 py-2 font-medium">Recommended tool</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ segment, assessment }) => {
            const g = assessment.geometry
            const selected = segment.id === selectedId
            return (
              <tr
                key={segment.id}
                onClick={() => onSelect(segment.id)}
                className={`cursor-pointer border-b border-zinc-800/60 transition-colors ${
                  selected ? 'bg-accent/10' : 'hover:bg-zinc-900/50'
                }`}
              >
                <td className="px-3 py-2 text-zinc-300">{segment.field}</td>
                <td className="px-3 py-2 text-zinc-100">{segment.header}</td>
                <td className="num px-3 py-2 text-right text-zinc-300">{segment.nb}</td>
                <td className="num px-3 py-2 text-right text-zinc-300">
                  {g.wtMm.toFixed(1)}
                  {g.wtComputed && <AssumptionChip label="calc" />}
                </td>
                <td className="num px-3 py-2 text-right text-zinc-300">{g.idMm.toFixed(1)}</td>
                <td className="px-3 py-2 text-zinc-300">
                  {segment.medium ?? 'Liquid'}
                  {segment.mediumAssumed && <AssumptionChip label="assumed" />}
                </td>
                <td className="px-3 py-2">
                  <VerdictBadge verdict={assessment.verdict} />
                </td>
                <td className="px-3 py-2 text-zinc-300">
                  {assessment.recommended.techKey ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
