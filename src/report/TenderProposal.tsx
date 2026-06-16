import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { Assessment } from '../engine/types'
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

export interface ProposalRow {
  segment: StoredSegment
  assessment: Assessment
}

function sectionHeader(text: string): Content {
  return {
    text: text.toUpperCase(),
    color: AMBER,
    fontSize: 10,
    bold: true,
    characterSpacing: 0.5,
    margin: [0, 14, 0, 5],
  }
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

/** Pipeline register table from the design data. */
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
  return {
    table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [head, ...body] },
    layout: {
      hLineColor: () => '#e4e4e7',
      vLineColor: () => '#e4e4e7',
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
    },
  }
}

/** Per-line screening outcome table. */
function screeningTable(rows: ProposalRow[]): Content {
  const head: TableCell[] = ['Line', 'Verdict', 'Primary tool', 'Blockers'].map(th)
  const body: TableCell[][] = rows.map(({ segment: s, assessment: a }) => [
    { text: s.header, fontSize: 7.5, color: INK },
    { text: a.verdict, fontSize: 7.5, bold: true, color: VERDICT_COLOR[a.verdict] ?? INK },
    {
      stack: [
        { text: a.recommended.techKey ?? 'None viable as-is', fontSize: 7.5, color: INK },
        a.recommended.vendors.length > 0
          ? { text: a.recommended.vendors.join(' · '), fontSize: 6.5, color: MUTED }
          : ({} as Content),
      ],
    },
    { text: a.blockers.length > 0 ? a.blockers.join('; ') : 'None', fontSize: 7.5, color: a.blockers.length > 0 ? LEVEL_COLOR['Marginal'] : MUTED },
  ])
  return {
    table: { headerRows: 1, widths: ['*', 'auto', '34%', '26%'], body: [head, ...body] },
    layout: {
      hLineColor: () => '#e4e4e7',
      vLineColor: () => '#e4e4e7',
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
    },
  }
}

function rollupLine(rows: ProposalRow[]): string {
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.assessment.verdict] = (counts[r.assessment.verdict] ?? 0) + 1
  return Object.entries(counts).map(([v, n]) => `${n} × ${v}`).join('   ·   ')
}

function buildDoc(project: Project, rows: ProposalRow[], sow?: SowReference): TDocumentDefinitions {
  const today = new Date().toISOString().slice(0, 10)
  const totalKm = rows.reduce((sum, r) => sum + r.assessment.geometry.lengthKm, 0)

  const content: Content[] = [
    { text: 'ILI TECHNICAL PROPOSAL', color: AMBER, bold: true, fontSize: 11, characterSpacing: 1 },
    { text: project.name, fontSize: 18, bold: true, color: INK, margin: [0, 2, 0, 0] },
    { text: `${project.client}  ·  ${project.code}  ·  ${today}`, fontSize: 9, color: MUTED, margin: [0, 3, 0, 0] },
  ]

  if (sow) {
    content.push(
      { text: `Tender: ${sow.tender}`, fontSize: 9, color: MUTED, margin: [0, 6, 0, 0] },
      { text: `Reference: ${sow.docRef}`, fontSize: 8, color: MUTED, margin: [0, 1, 0, 0] },
    )
  }

  content.push(
    sectionHeader('1. Fleet summary'),
    {
      text: `${rows.length} pipelines / trunklines, ${totalKm.toFixed(1)} km total. Screening outcome:  ${rollupLine(rows)}.`,
      fontSize: 9,
      color: INK,
    },
    sectionHeader('2. Pipeline register'),
    registerTable(rows),
    { text: '(calc) = wall thickness computed as the ASME B31.4 minimum where as-built is not in the register.', fontSize: 7, italics: true, color: MUTED, margin: [0, 3, 0, 0] },
  )

  if (sow) {
    content.push(sectionHeader('3. Scope of services'), numberedList(sow.scopeOfServices))
  }

  content.push(sectionHeader(`${sow ? '4' : '3'}. Per-line screening`), screeningTable(rows))

  if (sow) {
    content.push(
      sectionHeader('5. Deliverables & reporting'),
      bulletList(sow.deliverables),
      sectionHeader('6. Acceptance & assessment criteria'),
      bulletList(sow.acceptance),
      sectionHeader('7. Standards & references'),
      bulletList(sow.standards),
      sectionHeader('8. Personnel & qualifications'),
      bulletList(sow.personnel),
    )
  }

  content.push(
    sectionHeader('Disclaimer'),
    { text: DISCLAIMER_TEXT, fontSize: 7.5, color: MUTED, italics: true },
  )

  return {
    pageSize: 'A4',
    pageMargins: [40, 54, 40, 56],
    defaultStyle: { font: 'Roboto' },
    header: {
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
    content,
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
}

/** Generate and download a fleet-level ILI technical proposal. */
export function downloadTenderProposal(project: Project, rows: ProposalRow[], sow?: SowReference): void {
  const doc = buildDoc(project, rows, sow)
  pdfMake.createPdf(doc).download(`ILI_Proposal_${sanitize(project.name)}.pdf`)
}
