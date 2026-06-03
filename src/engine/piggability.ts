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
    recommended,
    blockers,
    actions: dedupe(actions),
    scope,
    assumptions,
  }
}
