import type { Assessment } from '../engine/types'
import type { Project, StoredSegment } from '../repo/types'
import type { AiMessage } from './types'

const SYSTEM =
  'You are an assistant to a pipeline-integrity engineer preparing a piggability (in-line inspection) screening study. ' +
  'Explain and advise using ONLY the screening data provided. Never invent measurements, numbers, vendors, or standards. ' +
  'This is a screening study, not a fitness-for-service or integrity assessment, and always requires qualified engineering sign-off. ' +
  'Write concise, plain British English suitable for a client-facing report. Do not use markdown headings or bullet symbols unless asked.'

function sys(): AiMessage {
  return { role: 'system', content: SYSTEM }
}

/** Compact factual context block for one line — the only facts the model may use. */
function lineContext(segment: StoredSegment, a: Assessment): string {
  const g = a.geometry
  const lvl = a.rows.map((r) => `${r.key}=${r.level}`).join(', ')
  const factors = (label: string, fs: { label: string }[]) =>
    `${label}: ${fs.map((f) => f.label).join('; ')}`
  return [
    `Line: ${segment.field} — ${segment.header}`,
    `Geometry: ${segment.nb}" NB, ${segment.grade}, OD ${g.odMm}mm, wall ${g.wtMm}mm${g.wtComputed ? ' (computed B31.4 minimum, not as-built)' : ' (as-built)'}, bore ID ${g.idMm}mm, D/t ${g.dOverT}.`,
    `Medium: ${segment.medium ?? 'Liquid'}${segment.mediumAssumed ? ' (assumed)' : ''}. Objective: ${g.objective}.`,
    `Verdict: ${a.verdict}. Why: ${a.rationale.summary}`,
    `Recommended primary tool: ${a.recommended.techKey ?? 'none viable as-is'} — ${a.recommended.why}`,
    `Suitability: ${lvl}.`,
    `Blockers: ${a.blockers.length ? a.blockers.join('; ') : 'none'}.`,
    `Risk (indicative screening, 0-100): execution ${a.risk.execution.score} (${a.risk.execution.band}), data confidence ${a.risk.confidence.score} (${a.risk.confidence.band}), inspection priority ${a.risk.priority.score} (${a.risk.priority.band}).`,
    factors('Execution drivers', a.risk.execution.factors),
    factors('Confidence deductions', a.risk.confidence.factors),
    `Assumptions on file: ${a.assumptions.join(' ')}`,
  ].join('\n')
}

export function perLineNarrative(segment: StoredSegment, a: Assessment): AiMessage[] {
  return [
    sys(),
    {
      role: 'user',
      content:
        `Write a short executive risk summary (3–5 sentences) for this line, for a client piggability report. ` +
        `Cover whether it can be inspected as-is, the recommended tool and why, the main risk drivers, and the single most important thing to confirm. ` +
        `Do not restate every number.\n\n${lineContext(segment, a)}`,
    },
  ]
}

export function surveyPriorities(segment: StoredSegment, a: Assessment): AiMessage[] {
  return [
    sys(),
    {
      role: 'user',
      content:
        `Based on the assumptions and the data-confidence deductions, list the 3–5 highest-value items to confirm on the field survey ` +
        `to reduce uncertainty in this screening, most important first. Keep each to one line, plain language.\n\n${lineContext(segment, a)}`,
    },
  ]
}

export function clientFriendlyVerdict(segment: StoredSegment, a: Assessment): AiMessage[] {
  return [
    sys(),
    {
      role: 'user',
      content:
        `Re-explain the verdict and the recommended tool for a non-technical client stakeholder in 2–3 sentences. ` +
        `Avoid jargon; if you must use a term (e.g. UT, MFL), gloss it briefly.\n\n${lineContext(segment, a)}`,
    },
  ]
}

export function fleetSummary(
  project: Project,
  rows: { segment: StoredSegment; assessment: Assessment }[],
): AiMessage[] {
  const lines = rows
    .map(
      ({ segment, assessment: a }) =>
        `- ${segment.field}/${segment.header} (${segment.nb}"): verdict ${a.verdict}, primary ${a.recommended.techKey ?? 'none'}, priority ${a.risk.priority.band}, confidence ${a.risk.confidence.band}.`,
    )
    .join('\n')
  return [
    sys(),
    {
      role: 'user',
      content:
        `Write a one-paragraph executive summary across this ${rows.length}-line fleet for "${project.name}". ` +
        `Note the dominant recommended technology, any lines needing modifications or further study, and where data confidence is weakest. ` +
        `End with a one-line recommended next step.\n\n${lines}`,
    },
  ]
}
