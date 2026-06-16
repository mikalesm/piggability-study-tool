import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { Assessment } from '../engine/types'
import { trapFeasibility } from '../engine'
import type { Project, StoredSegment } from '../repo/types'
import type { SowReference } from '../data/mellitah'
import { DISCLAIMER_TEXT } from '../ui/Disclaimer'

// pdfmake vfs wiring — handle both legacy and current export shapes.
const vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs
if (vfs) {
  ;(pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs
}

const AMBER = '#B45309'
const INK = '#18181b'
const MUTED = '#52525b'

const LEVEL_COLOR: Record<string, string> = {
  Good: '#047857',
  Marginal: '#B45309',
  'Not suitable': '#BE123C',
}
const VERDICT_COLOR: Record<string, string> = {
  Piggable: '#047857',
  'Piggable w/ modifications': '#B45309',
  'Further study': '#B45309',
  'Not piggable as-is': '#BE123C',
}
const STATUS_COLOR: Record<string, string> = { ok: '#047857', confirm: '#B45309', unknown: '#52525b' }

export interface ProposalRow {
  segment: StoredSegment
  assessment: Assessment
}

function numberedList(items: string[]): Content {
  return { ol: items.map((i) => ({ text: i, fontSize: 9, color: INK, margin: [0, 1, 0, 2] })) }
}
function bulletList(items: string[]): Content {
  return { ul: items.map((i) => ({ text: i, fontSize: 9, color: INK, margin: [0, 1, 0, 2] })) }
}

function th(text: string): TableCell {
  return { text, bold: true, fontSize: 7.5, color: '#ffffff', fillColor: INK, margin: [2, 3, 2, 3] }
}
const tableLayout = {
  hLineColor: () => '#e4e4e7',
  vLineColor: () => '#e4e4e7',
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
}

function registerTable(rows: ProposalRow[]): Content {
  const head: TableCell[] = ['Line', 'NB', 'Grade', 'OD (mm)', 'WT (mm)', 'Length (km)', 'Medium', 'MOP (barg)'].map(th)
  const body: TableCell[][] = rows.map(({ segment: s, assessment: a }) => [
    { text: s.header, fontSize: 7.5, color: INK },
    { text: `${s.nb}"`, fontSize: 7.5, color: INK },
    { text: s.grade, fontSize: 7.5, color: INK },
    { text: a.geometry.odMm.toFixed(1), fontSize: 7.5, color: INK },
    { text: `${a.geometry.wtMm.toFixed(2)}${a.geometry.wtComputed ? ' (calc)' : ''}`, fontSize: 7.5, color: INK },
    { text: a.geometry.lengthKm.toFixed(1), fontSize: 7.5, color: INK },
    { text: s.medium ?? 'Liquid', fontSize: 7.5, color: INK },
    { text: s.mopBarg != null ? s.mopBarg.toFixed(1) : '—', fontSize: 7.5, color: INK },
  ])
  return { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [head, ...body] }, layout: tableLayout }
}

function screeningTable(rows: ProposalRow[]): Content {
  const head: TableCell[] = ['Line', 'Verdict', 'Primary tool', 'Blockers'].map(th)
  const body: TableCell[][] = rows.map(({ segment: s, assessment: a }) => [
    { text: s.header, fontSize: 7.5, color: INK },
    { text: a.verdict, fontSize: 7.5, bold: true, color: VERDICT_COLOR[a.verdict] ?? INK },
    {
      stack: [
        { text: a.recommended.techKey ?? 'None viable as-is', fontSize: 7.5, color: INK },
        a.recommended.vendors.length > 0 ? { text: a.recommended.vendors.join(' · '), fontSize: 6.5, color: MUTED } : ({} as Content),
      ],
    },
    { text: a.blockers.length > 0 ? a.blockers.join('; ') : 'None', fontSize: 7.5, color: a.blockers.length > 0 ? LEVEL_COLOR['Marginal'] : MUTED },
  ])
  return { table: { headerRows: 1, widths: ['*', 'auto', '34%', '26%'], body: [head, ...body] }, layout: tableLayout }
}

function trapTable(rows: ProposalRow[]): Content {
  const head: TableCell[] = ['Line', 'Launcher (mm)', 'Receiver (mm)', 'Bore (mm)', 'Valve', 'Feasibility'].map(th)
  const body: TableCell[][] = rows.map(({ segment: s }) => {
    const t = s.traps!
    const f = trapFeasibility(s)
    return [
      { text: s.header, fontSize: 7.5, color: INK },
      { text: t.launcherBarrelMm != null ? String(t.launcherBarrelMm) : '—', fontSize: 7.5, color: INK },
      { text: t.receiverBarrelMm != null ? String(t.receiverBarrelMm) : '—', fontSize: 7.5, color: INK },
      { text: t.boreMm != null ? String(t.boreMm) : '—', fontSize: 7.5, color: INK },
      { text: t.valveType ?? '—', fontSize: 7.5, color: MUTED },
      { text: f.label, fontSize: 7.5, bold: true, color: STATUS_COLOR[f.status] },
    ]
  })
  return { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [head, ...body] }, layout: tableLayout }
}

function flowTable(rows: ProposalRow[]): Content {
  const head: TableCell[] = ['Line', 'API°', 'Pour pt (°C)', 'Waxy', 'Note'].map(th)
  const body: TableCell[][] = rows.map(({ segment: s }) => {
    const fa = s.flowAssurance!
    return [
      { text: s.header, fontSize: 7.5, color: INK },
      { text: fa.apiGravity != null ? String(fa.apiGravity) : '—', fontSize: 7.5, color: INK },
      { text: fa.pourPointC != null ? String(fa.pourPointC) : '—', fontSize: 7.5, color: INK },
      { text: fa.waxy ? 'Yes' : 'No', fontSize: 7.5, bold: fa.waxy, color: fa.waxy ? AMBER : MUTED },
      { text: fa.note ?? '—', fontSize: 7, color: MUTED },
    ]
  })
  return { table: { headerRows: 1, widths: ['28%', 'auto', 'auto', 'auto', '*'], body: [head, ...body] }, layout: tableLayout }
}

function rollupLine(rows: ProposalRow[]): string {
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.assessment.verdict] = (counts[r.assessment.verdict] ?? 0) + 1
  return Object.entries(counts).map(([v, n]) => `${n} × ${v}`).join('   ·   ')
}

interface Section {
  title: string
  body: Content | Content[]
}

function buildDoc(project: Project, rows: ProposalRow[], sow: SowReference | undefined, bidder: string): TDocumentDefinitions {
  const today = new Date().toISOString().slice(0, 10)
  const totalKm = rows.reduce((sum, r) => sum + r.assessment.geometry.lengthKm, 0)
  const hasTraps = rows.some((r) => r.segment.traps)
  const hasFlow = rows.some((r) => r.segment.flowAssurance)

  // Build the section list dynamically so numbering + TOC stay in sync.
  const sections: Section[] = [
    {
      title: 'Fleet summary',
      body: { text: `${rows.length} pipelines / trunklines, ${totalKm.toFixed(1)} km total. Screening outcome:  ${rollupLine(rows)}.`, fontSize: 9, color: INK },
    },
    {
      title: 'Pipeline register',
      body: [registerTable(rows), { text: '(calc) = wall thickness computed as the ASME B31.4 minimum where as-built is not in the register.', fontSize: 7, italics: true, color: MUTED, margin: [0, 3, 0, 0] }],
    },
  ]
  if (sow) sections.push({ title: 'Scope of services', body: numberedList(sow.scopeOfServices) })
  sections.push({ title: 'Per-line screening', body: screeningTable(rows) })
  if (hasTraps) sections.push({ title: 'Pig-trap feasibility (scope appendix)', body: [trapTable(rows), { text: 'Verify-on-site only — the scope requires the bidder to confirm trap data during the site survey.', fontSize: 7, italics: true, color: MUTED, margin: [0, 3, 0, 0] }] })
  if (hasFlow) sections.push({ title: 'Flow assurance', body: [flowTable(rows), { text: 'Waxy crude (high pour point) drives the progressive cleaning / gauging campaign before tool runs.', fontSize: 7, italics: true, color: MUTED, margin: [0, 3, 0, 0] }] })
  if (sow) {
    sections.push({ title: 'Deliverables & reporting', body: bulletList(sow.deliverables) })
    sections.push({ title: 'Acceptance & assessment criteria', body: bulletList(sow.acceptance) })
    sections.push({ title: 'Standards & references', body: bulletList(sow.standards) })
    sections.push({ title: 'Personnel & qualifications', body: bulletList(sow.personnel) })
  }

  // Cover page.
  const cover: Content[] = [
    { text: '\n\n\n\n', fontSize: 10 },
    { text: 'ILI TECHNICAL PROPOSAL', color: AMBER, bold: true, fontSize: 13, characterSpacing: 1.5 },
    { text: project.name, fontSize: 26, bold: true, color: INK, margin: [0, 6, 0, 0] },
    { canvas: [{ type: 'line', x1: 0, y1: 6, x2: 250, y2: 6, lineWidth: 2, lineColor: AMBER }], margin: [0, 8, 0, 16] },
    sow ? { text: `Tender: ${sow.tender}`, fontSize: 10, color: INK } : ({} as Content),
    sow ? { text: `Reference: ${sow.docRef}`, fontSize: 9, color: MUTED, margin: [0, 2, 0, 0] } : ({} as Content),
    { text: '\n\n', fontSize: 10 },
    {
      table: {
        widths: ['28%', '*'],
        body: [
          [{ text: 'Prepared for', color: MUTED, fontSize: 9 }, { text: project.client, color: INK, fontSize: 9, bold: true }],
          [{ text: 'Prepared by', color: MUTED, fontSize: 9 }, { text: bidder || '[ Bidder / Contractor ]', color: INK, fontSize: 9, bold: true }],
          [{ text: 'Design code', color: MUTED, fontSize: 9 }, { text: project.code, color: INK, fontSize: 9 }],
          [{ text: 'Date', color: MUTED, fontSize: 9 }, { text: today, color: INK, fontSize: 9 }],
        ],
      },
      layout: 'noBorders',
    },
    { text: '\n\n', fontSize: 10 },
    { text: 'Contents', color: AMBER, bold: true, fontSize: 10, characterSpacing: 0.5, margin: [0, 0, 0, 4] },
    { ol: sections.map((s) => ({ text: s.title, fontSize: 9, color: INK, margin: [0, 1, 0, 1] })) },
    { text: DISCLAIMER_TEXT, fontSize: 7.5, color: MUTED, italics: true, margin: [0, 24, 0, 0] },
  ]

  // Body with numbered section headers.
  const body: Content[] = [{ text: '', pageBreak: 'before' }]
  sections.forEach((s, i) => {
    body.push({ text: `${i + 1}. ${s.title}`.toUpperCase(), color: AMBER, fontSize: 10, bold: true, characterSpacing: 0.5, margin: [0, i === 0 ? 0 : 14, 0, 5] })
    if (Array.isArray(s.body)) body.push(...s.body)
    else body.push(s.body)
  })

  return {
    pageSize: 'A4',
    pageMargins: [40, 54, 40, 56],
    defaultStyle: { font: 'Roboto' },
    header: (current) =>
      current === 1
        ? ({} as Content)
        : {
            columns: [
              { text: 'ILI TECHNICAL PROPOSAL', color: AMBER, bold: true, fontSize: 9, margin: [40, 24, 0, 0] },
              { text: project.name, alignment: 'right', color: MUTED, fontSize: 8, margin: [0, 24, 40, 0] },
            ],
          },
    footer: (current, total) => ({
      columns: [
        { text: 'Screening study — indicative envelopes, confirm against vendor datasheets & field survey.', fontSize: 7, color: MUTED, margin: [40, 0, 0, 0] },
        { text: `${current} / ${total}`, alignment: 'right', fontSize: 7, color: MUTED, margin: [0, 0, 40, 0] },
      ],
      margin: [0, 16, 0, 0],
    }),
    content: [...cover, ...body],
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
}

/** Generate and download a fleet-level ILI technical proposal. */
export function downloadTenderProposal(project: Project, rows: ProposalRow[], sow?: SowReference, bidder = ''): void {
  const doc = buildDoc(project, rows, sow, bidder)
  pdfMake.createPdf(doc).download(`ILI_Proposal_${sanitize(project.name)}.pdf`)
}
