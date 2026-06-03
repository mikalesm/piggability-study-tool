import type { Assessment } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { VerdictBadge, AssumptionChip } from './badges'

export interface FleetRow {
  segment: StoredSegment
  assessment: Assessment
}

const th = 'px-3 py-2.5 label font-normal'

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
    <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-panel">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-panel-2/60 text-left">
            <th className={`${th} text-left`}>Field</th>
            <th className={th}>Header</th>
            <th className={`${th} text-right`}>NB&quot;</th>
            <th className={`${th} text-right`}>WT&nbsp;mm</th>
            <th className={`${th} text-right`}>ID&nbsp;mm</th>
            <th className={th}>Medium</th>
            <th className={th}>Verdict</th>
            <th className={th}>Recommended</th>
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
                className={`group cursor-pointer border-b border-line/60 transition-colors last:border-0 ${
                  selected ? 'bg-accent/[0.07]' : 'hover:bg-panel-2/50'
                }`}
              >
                <td className="relative px-3 py-2.5 text-fg-muted">
                  <span
                    className={`absolute inset-y-0 left-0 w-[2px] ${selected ? 'bg-accent' : 'bg-transparent'}`}
                  />
                  {segment.field}
                </td>
                <td className="px-3 py-2.5 font-medium text-fg">{segment.header}</td>
                <td className="num px-3 py-2.5 text-right text-fg-muted">{segment.nb}</td>
                <td className="num px-3 py-2.5 text-right text-fg-muted">
                  {g.wtMm.toFixed(1)}
                  {g.wtComputed && <AssumptionChip label="calc" />}
                </td>
                <td className="num px-3 py-2.5 text-right text-fg-muted">{g.idMm.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {segment.medium ?? 'Liquid'}
                  {segment.mediumAssumed && <AssumptionChip label="assm" />}
                </td>
                <td className="px-3 py-2.5">
                  <VerdictBadge verdict={assessment.verdict} />
                </td>
                <td className="num px-3 py-2.5 text-[13px] text-accent/90">
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
