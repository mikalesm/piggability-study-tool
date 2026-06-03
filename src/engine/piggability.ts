import { TECHNOLOGIES } from './technologies'
import { odForNb, resolveWall, round } from './wall'
import type {
  Assessment,
  Geometry,
  Level,
  Recommendation,
  Segment,
  StudyInputs,
  Technology,
  TechResult,
  Verdict,
  VerdictRationale,
  VerdictReason,
} from './types'

const MFL_KEY = 'MFL (axial)'
const UT_WALL_KEY = 'UT Wall (UTWM)'

/** Marker fragment used to detect a bend-driven "Not suitable" note. */
const BEND_NOTE_FRAGMENT = 'tighter than'

function result(tech: Technology, level: Level, note: string): TechResult {
  return {
    key: tech.key,
    role: tech.role,
    target: tech.target,
    level,
    note,
    vendors: tech.vendors,
  }
}

/**
 * Evaluate a single technology against a segment + study.
 * Implements the exact rule ladder from the build spec.
 */
export function evalTech(
  tech: Technology,
  segment: Segment,
  study: StudyInputs,
  wtMm: number,
): TechResult {
  const nb = segment.nb

  // 1. Bore / size range.
  if (nb < tech.dminIn || nb > tech.dmaxIn) {
    return result(tech, 'Not suitable', 'Outside Dmin–Dmax tool range')
  }

  // 2. Couplant requirement in gas.
  if (tech.couplant && study.medium === 'Gas') {
    return result(tech, 'Not suitable', 'Needs liquid couplant')
  }

  // 3. Bend radius capability.
  if (study.bendD < tech.bendMinD) {
    return result(
      tech,
      'Not suitable',
      `Bends ${study.bendD}D ${BEND_NOTE_FRAGMENT} ${tech.bendMinD}D capability`,
    )
  }

  // 4. MFL magnetic saturation (MFL only).
  if (tech.key === MFL_KEY && tech.wtMargMm != null) {
    if (wtMm > tech.wtMaxMm && wtMm <= tech.wtMargMm) {
      return result(tech, 'Marginal', 'WT near saturation — high-field tool required')
    }
    if (wtMm > tech.wtMargMm) {
      return result(tech, 'Not suitable', 'WT exceeds MFL saturation')
    }
  }

  // 5. Velocity window (downgrade Good → Marginal).
  if (study.velocity < tech.vminMs || study.velocity > tech.vmaxMs) {
    return result(tech, 'Marginal', 'Velocity outside operating window')
  }

  // 6. Otherwise Good.
  return result(tech, 'Good', 'Within indicative envelope')
}

/** Derive geometry for a segment. */
export function deriveGeometry(segment: Segment): Geometry {
  const odMm = odForNb(segment.nb)
  const { wtMm, wtComputed } = resolveWall({
    wtMm: segment.wtMm,
    designPressureBarg: segment.designPressureBarg,
    odMm,
    grade: segment.grade,
    designFactor: segment.designFactor,
  })
  const idMm = odMm - 2 * wtMm
  const dOverT = odMm / wtMm
  return {
    odMm: round(odMm, 1),
    wtMm: round(wtMm, 1),
    wtComputed,
    idMm: round(idMm, 1),
    dOverT: round(dOverT, 1),
    nb: segment.nb,
    lengthKm: segment.lengthKm,
    objective: segment.objective,
  }
}

function pickRecommendation(
  rows: TechResult[],
  medium: StudyInputs['medium'],
): Recommendation {
  const utRow = rows.find((r) => r.key === UT_WALL_KEY)
  const mflRow = rows.find((r) => r.key === MFL_KEY)
  const utViable = !!utRow && utRow.level !== 'Not suitable'
  const mflViable = !!mflRow && mflRow.level !== 'Not suitable'
  const utGood = utRow?.level === 'Good'
  const mflGood = mflRow?.level === 'Good'

  // Objective = metal loss. Prefer UT on liquid lines (direct wall, heavy wall ok).
  if (medium === 'Liquid' && utViable && (utGood || !mflGood)) {
    return {
      techKey: UT_WALL_KEY,
      why:
        'Liquid line — UT measures wall thickness directly and tolerates heavy wall; ' +
        (mflGood
          ? 'preferred over MFL for direct quantitative wall data.'
          : 'MFL is not clearly suitable here (wall near/over magnetic saturation).'),
      vendors: utRow!.vendors,
    }
  }
  if (mflViable) {
    return {
      techKey: MFL_KEY,
      why: 'MFL viable for general metal loss within indicative saturation limits.',
      vendors: mflRow!.vendors,
    }
  }
  if (utViable) {
    return {
      techKey: UT_WALL_KEY,
      why: 'UT viable for direct wall-thickness measurement.',
      vendors: utRow!.vendors,
    }
  }
  return {
    techKey: null,
    why: 'No metal-loss tool is viable as-is — resolve blockers and actions first.',
    vendors: [],
  }
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item)
      out.push(item)
    }
  }
  return out
}

function blockerDetail(blocker: string): string {
  if (blocker.startsWith('No confirmed launcher')) {
    return 'A launcher and receiver trap must exist (or be installed) to launch and retrieve the tool.'
  }
  if (blocker.startsWith('Reduced-bore')) {
    return 'Reduced-bore or non-full-bore valves can stop the tool — they must be verified or replaced.'
  }
  return blocker
}

/**
 * Plain-language explanation of the verdict, derived from the SAME booleans the
 * verdict ladder uses — so it never diverges from the verdict itself. Pure.
 */
function buildRationale(ctx: {
  verdict: Verdict
  mlRows: TechResult[]
  anyML: boolean
  goodML: boolean
  noBend: boolean
  blockers: string[]
  study: StudyInputs
  recommended: Recommendation
}): VerdictRationale {
  const { verdict, mlRows, anyML, goodML, noBend, blockers, study, recommended } = ctx
  const reasons: VerdictReason[] = []
  const flips: string[] = []

  if (verdict === 'Not piggable as-is') {
    if (noBend) {
      reasons.push({
        label: 'Bend radius too tight',
        detail: `Tightest bend ${study.bendD}D is below the ~1.5D minimum every listed tool needs.`,
        tone: 'block',
      })
      flips.push('Confirm the true bend radius by survey — if ≥ 1.5D, the tools become viable.')
      return { summary: 'Every tool is blocked by the bend radius.', reasons, flips }
    }
    reasons.push({
      label: 'No viable metal-loss tool',
      detail:
        study.medium === 'Gas'
          ? 'On gas, UT needs a batched liquid couplant and MFL may be defeated by the wall — leaving no clear metal-loss option.'
          : 'Wall thickness and/or diameter leave no metal-loss tool inside its envelope.',
      tone: 'block',
    })
    if (study.medium === 'Gas') flips.push('Batch a liquid slug for UT, or run on a liquid line.')
    flips.push('Confirm as-built wall thickness — a thinner wall may bring MFL back into range.')
    return { summary: 'No metal-loss inspection tool is viable as-is.', reasons, flips }
  }

  // Metal-loss viability (drives the recommendation).
  if (goodML) {
    // Prefer citing the recommended tool when it is the Good one, for coherence
    // with the headline recommendation.
    const good =
      mlRows.find((r) => r.key === recommended.techKey && r.level === 'Good') ??
      mlRows.find((r) => r.level === 'Good')
    reasons.push({
      label: 'Metal-loss tool in range',
      detail: `${good?.key ?? 'A metal-loss tool'} sits inside its indicative envelope.`,
      tone: 'ok',
    })
  } else if (anyML) {
    const marg = mlRows.find((r) => r.level === 'Marginal')
    reasons.push({
      label: 'Metal-loss tool only marginal',
      detail: `${marg?.key ?? 'The metal-loss tool'} is usable but outside its ideal window (${marg?.note ?? 'marginal'}).`,
      tone: 'warn',
    })
    flips.push('Bring the marginal driver into range (e.g. velocity or wall) to upgrade the primary tool to Good.')
  }

  // Blockers.
  for (const b of blockers) {
    reasons.push({ label: b, detail: blockerDetail(b), tone: 'block' })
  }
  if (!study.launcher || !study.receiver) {
    flips.push('Confirm a launcher and receiver trap — removes the trap blocker.')
  }
  if (study.reducedBore) {
    flips.push('Verify / replace reduced-bore or non-full-bore valves — removes that blocker.')
  }

  // Cleanliness.
  if (study.cleanliness === 'Heavy debris') {
    reasons.push({
      label: 'Heavy debris expected',
      detail: 'Debris must be cleared by a cleaning / gauging run before a tool can pass reliably.',
      tone: 'warn',
    })
    flips.push('Run a cleaning / gauging pass first — clears the debris condition.')
  }

  let summary: string
  if (verdict === 'Piggable') {
    summary = `Meets the screening criteria as-is — ${recommended.techKey ?? 'a metal-loss tool'} is the primary.`
  } else if (blockers.length > 0) {
    summary = 'Piggable once the blocker(s) below are resolved.'
  } else if (study.cleanliness === 'Heavy debris') {
    summary = 'Piggable after the line is cleaned.'
  } else {
    summary = 'Piggable, but the primary tool is only marginal as-is.'
  }
  return { summary, reasons, flips }
}

/** Pure assessment of one segment under a given study. */
export function assess(segment: Segment, study: StudyInputs): Assessment {
  const geometry = deriveGeometry(segment)

  const rows = TECHNOLOGIES.map((tech) => evalTech(tech, segment, study, geometry.wtMm))

  const mlRows = rows.filter((r) => r.target === 'metal-loss')
  const anyML = mlRows.some((r) => r.level !== 'Not suitable')
  const goodML = mlRows.some((r) => r.level === 'Good')
  const noBend =
    rows.length > 0 &&
    rows.every((r) => r.level === 'Not suitable' && r.note.includes(BEND_NOTE_FRAGMENT))

  // Blockers.
  const blockers: string[] = []
  if (!study.launcher || !study.receiver) {
    blockers.push('No confirmed launcher/receiver')
  }
  if (study.reducedBore) {
    blockers.push('Reduced-bore / non-full-bore valves')
  }

  // Verdict ladder.
  let verdict: Verdict
  if (noBend || !anyML) {
    verdict = 'Not piggable as-is'
  } else if (blockers.length > 0) {
    verdict = 'Piggable w/ modifications'
  } else if (!goodML || study.cleanliness === 'Heavy debris') {
    verdict = 'Piggable w/ modifications'
  } else {
    verdict = 'Piggable'
  }

  const recommended = pickRecommendation(rows, study.medium)

  const rationale = buildRationale({
    verdict,
    mlRows,
    anyML,
    goodML,
    noBend,
    blockers,
    study,
    recommended,
  })

  // Pre-inspection actions (ordered, then deduped).
  const actions: string[] = []
  if (!study.launcher) actions.push('Install / confirm launcher trap')
  if (!study.receiver) actions.push('Install / confirm receiver trap')
  if (study.reducedBore) actions.push('Verify / replace reduced-bore or non-full-bore valves')
  if (study.cleanliness !== 'Clean') actions.push('Cleaning / gauging run before inspection')
  actions.push('Gauge-plate + caliper proving run')
  if (geometry.wtComputed) {
    actions.push('Confirm as-built wall thickness (currently computed B31.4 minimum)')
  }
  actions.push('Confirm bend radius and flow velocity by field survey')
  if (study.dualDia) actions.push('Specify dual-diameter / bidirectional tool')

  // Recommended scope (ordered).
  const scope: string[] = ['Gauge-plate + caliper / geometry proving run']
  if (recommended.techKey) {
    const recRow = rows.find((r) => r.key === recommended.techKey)
    scope.push(
      `${recommended.techKey}${recRow ? ` — ${recRow.role}` : ''} (primary, for ${geometry.objective.toLowerCase()})`,
    )
  }
  scope.push('IMU / inertial mapping (combination run)')
  scope.push('UT Crack (UTCD) / EMAT — only if cracking / SCC is a concern (optional)')

  // Assumptions surfaced for this run.
  const assumptions: string[] = []
  if (segment.mediumAssumed) assumptions.push('Medium assumed (not in scope) — confirm.')
  if (segment.mopAssumed) assumptions.push('MOP assumed (not in scope) — confirm.')
  if (geometry.wtComputed) {
    assumptions.push('Wall thickness computed (ASME B31.4 minimum) — confirm as-built.')
  }
  if (segment.lengthIllustrative) assumptions.push('Length is illustrative.')
  assumptions.push(
    'Bend radius, velocity, trap availability and cleanliness are survey inputs — confirm by field survey.',
  )

  return {
    segmentId: segment.id,
    geometry,
    rows,
    verdict,
    rationale,
    recommended,
    blockers,
    actions: dedupe(actions),
    scope,
    assumptions,
  }
}
