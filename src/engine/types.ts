// Pure domain types for the piggability engine. No UI / IO dependencies.

export type Grade = 'X60' | 'X65' | 'X70'
export type Medium = 'Liquid' | 'Gas'
export type Cleanliness = 'Clean' | 'Heavy debris'
export type LocationClass = 1 | 2

/** Suitability level for a single ILI technology against a segment. */
export type Level = 'Good' | 'Marginal' | 'Not suitable'

/** Verdict for the whole segment. */
export type Verdict =
  | 'Piggable'
  | 'Piggable w/ modifications'
  | 'Further study'
  | 'Not piggable as-is'

/** What an ILI technology is primarily looking for. */
export type Target = 'geometry' | 'metal-loss' | 'crack'

/**
 * A pipeline segment as captured from design data.
 * `wtMm` may be null when as-built wall thickness is not in the source table —
 * the engine then computes a B31.4 minimum wall and sets `wtComputed`.
 */
export interface Segment {
  id: string
  field: string
  header: string
  nb: number // nominal bore, inches
  grade: Grade
  process?: string // SMLS / LSAW / etc
  designPressureBarg: number | null // DP
  mopBarg: number | null // max operating pressure
  pressureClass?: string // e.g. "2500#"
  locationClass: LocationClass
  designFactor: number // F (0.72 / 0.6)
  medium: Medium | null // null when not given in scope (assume + flag)
  lengthKm: number
  wtMm: number | null // as-built wall thickness, null => compute
  coating?: string
  objective: string
  /** Flags for caveats that must surface in UI + report. */
  mediumAssumed?: boolean // medium not in scope, assumed
  mopAssumed?: boolean // MOP not in scope, assumed
  lengthIllustrative?: boolean
}

/**
 * Survey-derived study inputs. These do NOT come from the design data table —
 * each defaults and must be confirmed by a field survey.
 */
export interface StudyInputs {
  bendD: number // tightest bend radius in pipe diameters (default 3)
  velocity: number // driving flow velocity, m/s (default 1.5)
  launcher: boolean // confirmed launcher trap (default true)
  receiver: boolean // confirmed receiver trap (default true)
  reducedBore: boolean // reduced-bore / non-full-bore valves (default false)
  dualDia: boolean // dual-diameter line (default false)
  cleanliness: Cleanliness // default "Clean"
  medium: Medium // resolved medium used for the run
}

/** One technology row in the ILI knowledge base. */
export interface Technology {
  key: string
  dminIn: number
  dmaxIn: number
  couplant: boolean // requires liquid couplant
  wtMaxMm: number // max wall the tech handles cleanly
  wtMargMm: number | null // marginal ceiling (MFL saturation band); null if N/A
  vminMs: number
  vmaxMs: number
  bendMinD: number // tightest bend negotiable, in pipe diameters
  target: Target
  role: string // human description of role
  vendors: string[] // representative market vendors
  source: 'indicative' // envelopes are indicative of the market
}

/** Result of evaluating one technology against a segment + study. */
export interface TechResult {
  key: string
  role: string
  target: Target
  level: Level
  note: string
  vendors: string[]
}

/** Risk gauge band. Confidence reuses the same enum (High = good). */
export type RiskBand = 'Low' | 'Medium' | 'High'

/** One scored contributor to a gauge, recorded so the UI can explain the number. */
export interface RiskFactor {
  label: string
  detail: string
  points: number
  tone: ReasonTone
}

/** A single 0–100 gauge with its band and the factors that produced it. */
export interface RiskGauge {
  score: number
  band: RiskBand
  factors: RiskFactor[]
}

/**
 * Indicative screening risk profile — three deterministic gauges.
 * NOT an integrity / fitness-for-service result.
 */
export interface RiskProfile {
  /** 0–100, higher = harder / riskier to pig as-is. */
  execution: RiskGauge
  /** 0–100, higher = MORE confident (fewer assumptions). Band High/Medium/Low. */
  confidence: RiskGauge
  /** 0–100, higher = inspect sooner (indicative service severity). */
  priority: RiskGauge
}

/** Derived geometry for a segment. */
export interface Geometry {
  odMm: number
  wtMm: number
  wtComputed: boolean
  idMm: number
  dOverT: number
  nb: number
  lengthKm: number
  objective: string
}

/** A recommended primary tool with rationale. */
export interface Recommendation {
  techKey: string | null
  why: string
  vendors: string[]
}

/** Tone for a verdict reason, mirrors the suitability palette. */
export type ReasonTone = 'block' | 'warn' | 'ok'

/** One structured factor contributing to the verdict. */
export interface VerdictReason {
  label: string
  detail: string
  tone: ReasonTone
}

/** Plain-language explanation of why a verdict was reached + how to improve it. */
export interface VerdictRationale {
  /** One-line plain-language reason for the verdict. */
  summary: string
  /** Structured contributing factors. */
  reasons: VerdictReason[]
  /** "What would change the verdict" hints; empty when nothing cheap improves it. */
  flips: string[]
}

/** Full assessment output for one segment. */
export interface Assessment {
  segmentId: string
  geometry: Geometry
  rows: TechResult[]
  verdict: Verdict
  rationale: VerdictRationale
  risk: RiskProfile
  recommended: Recommendation
  blockers: string[]
  actions: string[] // pre-inspection actions, ordered + deduped
  scope: string[] // recommended scope, ordered
  assumptions: string[] // flagged assumptions surfaced for this run
}
