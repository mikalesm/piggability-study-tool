import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Assessment, Verdict } from '../engine/types'
import type { StoredSegment } from '../repo/types'
import { VerdictBadge, AssumptionChip } from './badges'

export interface FleetRow {
  segment: StoredSegment
  assessment: Assessment
}

export type SortKey = 'field' | 'header' | 'nb' | 'wt' | 'id' | 'medium' | 'verdict' | 'recommended'
export interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}

const VERDICT_RANK: Record<Verdict, number> = {
  Piggable: 0,
  'Piggable w/ modifications': 1,
  'Further study': 2,
  'Not piggable as-is': 3,
}

function value(row: FleetRow, key: SortKey): string | number {
  const { segment, assessment } = row
  switch (key) {
    case 'field':
      return segment.field
    case 'header':
      return segment.header
    case 'nb':
      return segment.nb
    case 'wt':
      return assessment.geometry.wtMm
    case 'id':
      return assessment.geometry.idMm
    case 'medium':
      return segment.medium ?? 'Liquid'
    case 'verdict':
      return VERDICT_RANK[assessment.verdict]
    case 'recommended':
      return assessment.recommended.techKey ?? ''
  }
}

/** Pure sort helper — keeps the comparator next to the column definitions. */
export function sortRows(rows: FleetRow[], sort: SortState): FleetRow[] {
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = value(a, sort.key)
    const vb = value(b, sort.key)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
}

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'field', label: 'Field' },
  { key: 'header', label: 'Header' },
  { key: 'nb', label: 'NB"', align: 'right' },
  { key: 'wt', label: 'WT mm', align: 'right' },
  { key: 'id', label: 'ID mm', align: 'right' },
  { key: 'medium', label: 'Medium' },
  { key: 'verdict', label: 'Verdict' },
  { key: 'recommended', label: 'Recommended' },
]

export function FleetTable({
  rows,
  selectedId,
  onSelect,
  sort,
  onSort,
}: {
  rows: FleetRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = rows.findIndex((r) => r.segment.id === selectedId)
    const next =
      e.key === 'ArrowDown'
        ? Math.min(rows.length - 1, i < 0 ? 0 : i + 1)
        : Math.max(0, i < 0 ? 0 : i - 1)
    if (rows[next]) onSelect(rows[next].segment.id)
  }

  return (
    <>
      {/* Desktop table */}
      <div
        className="hidden overflow-x-auto rounded-lg border border-line bg-panel shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 md:block"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="grid"
        aria-label="Pipeline fleet"
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2/60 text-left">
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                return (
                  <th
                    key={c.key}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={`label px-3 py-2.5 font-normal ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={`inline-flex items-center gap-1 hover:text-fg-muted focus:outline-none focus-visible:text-accent ${
                        c.align === 'right' ? 'flex-row-reverse' : ''
                      } ${active ? 'text-accent' : ''}`}
                    >
                      {c.label}
                      {active &&
                        (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  </th>
                )
              })}
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
                  aria-selected={selected}
                  className={`cursor-pointer border-b border-line/60 transition-colors last:border-0 ${
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

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map(({ segment, assessment }) => {
          const g = assessment.geometry
          const selected = segment.id === selectedId
          return (
            <li key={segment.id}>
              <button
                type="button"
                onClick={() => onSelect(segment.id)}
                className={`w-full rounded-lg border bg-panel p-3 text-left shadow-panel transition-colors ${
                  selected ? 'border-accent/50 bg-accent/[0.06]' : 'border-line hover:border-line-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-fg">{segment.header}</div>
                    <div className="num text-[11px] text-fg-dim">
                      {segment.field} · {segment.nb}" · {segment.medium ?? 'Liquid'}
                    </div>
                  </div>
                  <VerdictBadge verdict={assessment.verdict} />
                </div>
                <div className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-muted">
                  <span>WT {g.wtMm.toFixed(1)}{g.wtComputed ? ' (calc)' : ''}</span>
                  <span>ID {g.idMm.toFixed(1)}</span>
                  <span className="text-accent/90">{assessment.recommended.techKey ?? '—'}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
