import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { Assessment } from '../engine/types'
import type { Project, StoredSegment } from '../repo/types'
import { DISCLAIMER_TEXT } from '../ui/Disclaimer'

// pdfmake vfs wiring — handle both legacy and current export shapes.
const vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs
if (vfs) {
  ;(pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs
}

const AMBER = '#B45309' // darker amber for print legibility on white
const INK = '#18181b'
const MUTED = '#52525b'

const LEVEL_COLOR: Record<string, string> = {
  Good: '#047857',
  Marginal: '#B45309',
  'Not suitable': '#BE123C',
}

function sectionHeader(text: string): Content {
  return {
    text: text.toUpperCase(),
    color: AMBER,
    fontSize: 9,
    bold: true,
    characterSpacing: 0.5,
    margin: [0, 12, 0, 4],
  }
}

function kvTable(pairs: [string, string][]): Content {
  return {
    table: {
      widths: ['35%', '65%'],
      body: pairs.map(([k, v]) => [
        { text: k, color: MUTED, fontSize: 9 },
        { text: v, color: INK, fontSize: 9 },
      ]),
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 2],
  }
}

function bulletList(items: string[]): Content {
  if (items.length === 0) return { text: 'None.', italics: true, color: MUTED, fontSize: 9 }
  return { ul: items.map((i) => ({ text: i, fontSize: 9, color: INK, margin: [0, 1, 0, 1] })) }
}

/** Build the pdfmake document definition for one line. */
function buildDoc(project: Project, segment: StoredSegment, a: Assessment): TDocumentDefinitions {
  const g = a.geometry
  const today = new Date().toISOString().slice(0, 10)

  const matrixHeader: TableCell[] = ['Technology', 'Role', 'Suitability', 'Note'].map((h) => ({
    text: h,
    bold: true,
    fontSize: 8,
    color: '#ffffff',
    fillColor: INK,
    margin: [2, 3, 2, 3],
  }))
  const matrixBody: TableCell[][] = a.rows.map((r) => [
    { text: r.key, fontSize: 8, color: INK },
    { text: r.role, fontSize: 8, color: MUTED },
    { text: r.level, fontSize: 8, bold: true, color: LEVEL_COLOR[r.level] ?? INK },
    { text: r.note, fontSize: 8, color: MUTED },
  ])

  return {
    pageSize: 'A4',
    pageMargins: [40, 54, 40, 56],
    defaultStyle: { font: 'Roboto' },
    header: {
      columns: [
        { text: 'PIGGABILITY STUDY', color: AMBER, bold: true, fontSize: 10, margin: [40, 24, 0, 0] },
        { text: project.name, alignment: 'right', color: MUTED, fontSize: 9, margin: [0, 24, 40, 0] },
      ],
    },
    footer: (current, total) => ({
      columns: [
        { text: 'Screening study — indicative envelopes, confirm against vendor datasheets.', fontSize: 7, color: MUTED, margin: [40, 0, 0, 0] },
        { text: `${current} / ${total}`, alignment: 'right', fontSize: 7, color: MUTED, margin: [0, 0, 40, 0] },
      ],
      margin: [0, 16, 0, 0],
    }),
    content: [
      { text: `${segment.field} — ${segment.header}`, fontSize: 16, bold: true, color: INK },
      {
        text: `${project.client}  ·  ${project.code}  ·  ${today}`,
        fontSize: 9,
        color: MUTED,
        margin: [0, 2, 0, 0],
      },

      sectionHeader('Design data'),
      kvTable([
        ['Nominal bore', `${segment.nb}"`],
        ['Grade', segment.grade],
        ['Process', segment.process ?? '—'],
        ['Design pressure', segment.designPressureBarg != null ? `${segment.designPressureBarg} barg` : '— (not in scope)'],
        ['MOP', segment.mopBarg != null ? `${segment.mopBarg} barg${segment.mopAssumed ? ' (assumed)' : ''}` : '— (assumed)'],
        ['Pressure class', segment.pressureClass ?? '—'],
        ['Medium', `${segment.medium ?? 'Liquid'}${segment.mediumAssumed ? ' (assumed)' : ''}`],
        ['Coating', segment.coating ?? '—'],
        ['Design code', project.code],
      ]),

      sectionHeader('Derived geometry'),
      kvTable([
        ['Outside diameter', `${g.odMm.toFixed(1)} mm`],
        ['Wall thickness', `${g.wtMm.toFixed(1)} mm${g.wtComputed ? ' (computed — B31.4 minimum)' : ' (as-built)'}`],
        ['Bore ID', `${g.idMm.toFixed(1)} mm`],
        ['D/t ratio', g.dOverT.toFixed(1)],
        ['Length', `${g.lengthKm.toFixed(1)} km${segment.lengthIllustrative ? ' (illustrative)' : ''}`],
        ['Objective', g.objective],
      ]),

      sectionHeader('Study assumptions'),
      bulletList(a.assumptions),

      sectionHeader('Verdict'),
      {
        table: {
          widths: ['auto', '*'],
          body: [
            [
              { text: a.verdict, bold: true, fontSize: 11, color: '#ffffff', fillColor: AMBER, margin: [6, 4, 6, 4] },
              {
                stack: [
                  { text: `Recommended primary: ${a.recommended.techKey ?? 'None viable as-is'}`, bold: true, fontSize: 9, color: INK },
                  { text: a.recommended.why, fontSize: 8, color: MUTED, margin: [0, 1, 0, 0] },
                  a.recommended.vendors.length > 0
                    ? { text: `Market vendors: ${a.recommended.vendors.join(' · ')}`, fontSize: 8, color: MUTED, margin: [0, 1, 0, 0] }
                    : ({} as Content),
                ],
                margin: [8, 2, 0, 0],
              },
            ],
          ],
        },
        layout: 'noBorders',
      },

      sectionHeader('Recommended scope'),
      { ol: a.scope.map((s) => ({ text: s, fontSize: 9, color: INK, margin: [0, 1, 0, 1] })) },

      sectionHeader('Suitability matrix'),
      {
        table: { headerRows: 1, widths: ['22%', '20%', '16%', '42%'], body: [matrixHeader, ...matrixBody] },
        layout: {
          hLineColor: () => '#e4e4e7',
          vLineColor: () => '#e4e4e7',
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
        },
      },

      sectionHeader('Blockers'),
      bulletList(a.blockers),

      sectionHeader('Action checklist'),
      bulletList(a.actions),

      sectionHeader('Disclaimer'),
      { text: DISCLAIMER_TEXT, fontSize: 7.5, color: MUTED, italics: true },
    ],
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
}

/** Generate and download a per-line piggability study report. */
export function downloadReport(project: Project, segment: StoredSegment, assessment: Assessment): void {
  const doc = buildDoc(project, segment, assessment)
  const filename = `Piggability_${sanitize(segment.field)}_${sanitize(segment.header)}.pdf`
  pdfMake.createPdf(doc).download(filename)
}
