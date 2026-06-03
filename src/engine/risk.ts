import { techByKey } from './technologies'
import type {
  Geometry,
  Recommendation,
  RiskBand,
  RiskFactor,
  RiskGauge,
  RiskProfile,
  Segment,
  StudyInputs,
  TechResult,
  Verdict,
} from './types'

/**
 * Deterministic, INDICATIVE screening risk — three gauges derived from the same
 * facts the assessment already produced. This is a screening aid, NOT an
 * integrity / fitness-for-service result. Pure: no UI / IO.
 *
 * Each gauge records the factors that produced its score so the UI can explain
 * the number (same pattern as the verdict rationale).
 */

const VERDICT_EXEC: Record<Verdict, number> = {
  Piggable: 0,
  'Piggable w/ modifications': 30,
  'Further study': 40,
  'Not piggable as-is': 70,
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function execBand(score: number): RiskBand {
  if (score < 25) return 'Low'
  if (score <= 55) return 'Medium'
  return 'High'
}
function confidenceBand(score: number): RiskBand {
  if (score >= 75) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}
function priorityBand(score: number): RiskBand {
  if (score < 30) return 'Low'
  if (score <= 60) return 'Medium'
  return 'High'
}

/** Whether the survey inputs are still untouched defaults (nothing confirmed). */
function atSurveyDefaults(study: StudyInputs, segment: Segment): boolean {
  return (
    study.bendD === 3 &&
    study.velocity === 1.5 &&
    study.launcher &&
    study.receiver &&
    !study.reducedBore &&
    !study.dualDia &&
    study.cleanliness === 'Clean' &&
    study.medium === (segment.medium ?? 'Liquid')
  )
}

interface RiskContext {
  geometry: Geometry
  rows: TechResult[]
  verdict: Verdict
  blockers: string[]
  recommended: Recommendation
}

function scoreExecution(study: StudyInputs, ctx: RiskContext): RiskGauge {
  const factors: RiskFactor[] = []
  let score = 0

  const v = VERDICT_EXEC[ctx.verdict]
  score += v
  factors.push({
    label: 'Screening verdict',
    detail: ctx.verdict,
    points: v,
    tone: v === 0 ? 'ok' : v < 40 ? 'warn' : 'block',
  })

  if (ctx.blockers.length > 0) {
    const p = ctx.blockers.length * 12
    score += p
    factors.push({
      label: `Blocker${ctx.blockers.length > 1 ? 's' : ''} (${ctx.blockers.length})`,
      detail: ctx.blockers.join('; '),
      points: p,
      tone: 'block',
    })
  }

  const ml = ctx.rows.filter((r) => r.target === 'metal-loss')
  const marginal = ml.filter((r) => r.level === 'Marginal').length
  if (marginal > 0) {
    const p = marginal * 8
    score += p
    factors.push({
      label: 'Marginal metal-loss tool',
      detail: `${marginal} metal-loss tool(s) usable only outside their ideal window.`,
      points: p,
      tone: 'warn',
    })
  }
  if (!ml.some((r) => r.level === 'Good')) {
    score += 10
    factors.push({
      label: 'No clearly-suitable metal-loss tool',
      detail: 'No metal-loss technology sits comfortably inside its envelope.',
      points: 10,
      tone: 'warn',
    })
  }

  if (study.cleanliness === 'Heavy debris') {
    score += 12
    factors.push({
      label: 'Heavy debris',
      detail: 'A cleaning / gauging run is needed before a tool can pass reliably.',
      points: 12,
      tone: 'warn',
    })
  }

  // Recommended tool sitting near its operating envelope edge.
  const tech = ctx.recommended.techKey ? techByKey(ctx.recommended.techKey) : undefined
  if (tech) {
    const span = tech.vmaxMs - tech.vminMs
    const nearV = study.velocity <= tech.vminMs + 0.15 * span || study.velocity >= tech.vmaxMs - 0.15 * span
    if (study.velocity >= tech.vminMs && study.velocity <= tech.vmaxMs && nearV) {
      score += 8
      factors.push({
        label: 'Velocity near tool limit',
        detail: `${study.velocity} m/s is close to the ${tech.key} window (${tech.vminMs}–${tech.vmaxMs} m/s).`,
        points: 8,
        tone: 'warn',
      })
    }
    if (study.bendD >= tech.bendMinD && study.bendD <= tech.bendMinD + 0.5) {
      score += 6
      factors.push({
        label: 'Bend near tool limit',
        detail: `${study.bendD}D is close to the ${tech.key} minimum of ${tech.bendMinD}D.`,
        points: 6,
        tone: 'warn',
      })
    }
  }

  if (study.dualDia) {
    score += 5
    factors.push({
      label: 'Dual diameter',
      detail: 'Needs a dual-diameter / bidirectional tool.',
      points: 5,
      tone: 'warn',
    })
  }

  if (factors.length === 1 && v === 0) {
    factors.push({
      label: 'No execution flags',
      detail: 'Piggable as-is with a suitable tool — no blockers or envelope concerns.',
      points: 0,
      tone: 'ok',
    })
  }

  score = clamp(score)
  return { score, band: execBand(score), factors }
}

function scoreConfidence(segment: Segment, study: StudyInputs, geometry: Geometry): RiskGauge {
  const factors: RiskFactor[] = []
  let score = 100
  const sub = (points: number, label: string, detail: string, tone: RiskFactor['tone']) => {
    score -= points
    factors.push({ label, detail, points: -points, tone })
  }

  if (geometry.wtComputed) {
    sub(25, 'Wall thickness computed', 'As-built WT not in the data — using the B31.4 minimum.', 'block')
  }
  if (segment.mediumAssumed) {
    sub(15, 'Medium assumed', 'Medium not in scope — assumed for the run.', 'warn')
  }
  if (segment.mopAssumed) {
    sub(5, 'MOP assumed', 'Operating pressure not in scope.', 'warn')
  }
  if (segment.lengthIllustrative) {
    sub(5, 'Length illustrative', 'Length is illustrative, not surveyed.', 'warn')
  }
  if (atSurveyDefaults(study, segment)) {
    sub(20, 'Survey inputs unconfirmed', 'Bend, velocity, traps and cleanliness are still at default assumptions.', 'warn')
  }

  if (factors.length === 0) {
    factors.push({
      label: 'Inputs measured',
      detail: 'Key inputs are provided / surveyed — high confidence in the screening.',
      points: 0,
      tone: 'ok',
    })
  }

  score = clamp(score)
  return { score, band: confidenceBand(score), factors }
}

function scorePriority(segment: Segment, geometry: Geometry, execution: RiskGauge): RiskGauge {
  const factors: RiskFactor[] = []
  let score = 0

  const dp = segment.designPressureBarg ?? segment.mopBarg ?? 0
  const pPress = Math.min(30, (dp / 350) * 30)
  if (pPress > 0) {
    score += pPress
    factors.push({
      label: 'Service pressure',
      detail: `${dp} barg design/operating pressure.`,
      points: Math.round(pPress),
      tone: pPress > 20 ? 'warn' : 'ok',
    })
  }

  const pDt = Math.min(20, (geometry.dOverT / 120) * 20)
  score += pDt
  factors.push({
    label: 'D/t ratio',
    detail: `D/t ${geometry.dOverT.toFixed(1)} — thinner walls carry more metal-loss exposure.`,
    points: Math.round(pDt),
    tone: pDt > 13 ? 'warn' : 'ok',
  })

  const pLen = Math.min(15, (geometry.lengthKm / 15) * 15)
  if (pLen > 0) {
    score += pLen
    factors.push({
      label: 'Length',
      detail: `${geometry.lengthKm.toFixed(1)} km of exposure.`,
      points: Math.round(pLen),
      tone: 'ok',
    })
  }

  const liquid = (segment.medium ?? 'Liquid') === 'Liquid'
  const pMed = liquid ? 10 : 5
  score += pMed
  factors.push({
    label: 'Corrosive service',
    detail: liquid ? 'Liquid (treated sea water) — internal metal-loss driver.' : 'Gas service.',
    points: pMed,
    tone: 'ok',
  })

  if (execution.band === 'High') {
    score += 10
    factors.push({
      label: 'Hard to inspect',
      detail: 'High execution risk raises the priority to resolve it.',
      points: 10,
      tone: 'warn',
    })
  }

  score = clamp(score)
  return { score, band: priorityBand(score), factors }
}

export function scoreRisk(segment: Segment, study: StudyInputs, ctx: RiskContext): RiskProfile {
  const execution = scoreExecution(study, ctx)
  const confidence = scoreConfidence(segment, study, ctx.geometry)
  const priority = scorePriority(segment, ctx.geometry, execution)
  return { execution, confidence, priority }
}
