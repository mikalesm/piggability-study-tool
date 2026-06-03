import { CORROSION_ALLOWANCE_MM, OD_BY_NB, SMYS_MPA } from './constants'
import type { Grade } from './types'

/** Round to n decimal places (avoids float dust). */
export function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals)
  return Math.round(value * f) / f
}

/** OD (mm) for a nominal bore. Throws if the bore is not in the table. */
export function odForNb(nb: number): number {
  const od = OD_BY_NB[nb]
  if (od === undefined) {
    throw new Error(`No OD table entry for NB ${nb}"`)
  }
  return od
}

/**
 * ASME B31.4 minimum wall thickness (mm) as a stand-in for as-built WT.
 *
 *   tMin = (DP_barg * 0.1 * OD_mm) / (2 * SMYS_MPa * F) + CA_mm
 *
 * The 0.1 factor converts barg → MPa (1 bar = 0.1 MPa).
 */
export function minWall(
  designPressureBarg: number,
  odMm: number,
  grade: Grade,
  designFactor: number,
  corrosionAllowanceMm: number = CORROSION_ALLOWANCE_MM,
): number {
  const smys = SMYS_MPA[grade]
  const pressureMpa = designPressureBarg * 0.1
  const t = (pressureMpa * odMm) / (2 * smys * designFactor) + corrosionAllowanceMm
  return t
}

/**
 * Resolve the wall thickness to use for a segment.
 * If `wtMm` is provided it is used as-is (wtComputed=false).
 * Otherwise the B31.4 minimum wall is computed, rounded to 1 dp, and flagged.
 */
export function resolveWall(args: {
  wtMm: number | null
  designPressureBarg: number | null
  odMm: number
  grade: Grade
  designFactor: number
}): { wtMm: number; wtComputed: boolean } {
  if (args.wtMm != null) {
    return { wtMm: args.wtMm, wtComputed: false }
  }
  if (args.designPressureBarg == null) {
    throw new Error('Cannot compute minimum wall without a design pressure')
  }
  const t = minWall(args.designPressureBarg, args.odMm, args.grade, args.designFactor)
  return { wtMm: round(t, 1), wtComputed: true }
}
