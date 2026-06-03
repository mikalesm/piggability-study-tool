import type { Grade } from './types'

/** Outside diameter (mm) by nominal bore (inches). */
export const OD_BY_NB: Record<number, number> = {
  8: 219.1,
  12: 323.9,
  16: 406.4,
  18: 457.2,
  24: 609.6,
  30: 762.0,
  36: 914.4,
  40: 1016.0,
}

/** Specified minimum yield strength (MPa) by grade. */
export const SMYS_MPA: Record<Grade, number> = {
  X60: 413.69,
  X65: 448.16,
  X70: 482.63,
}

/** Default design factor F for Class 1 (liquid, ASME B31.4). */
export const DESIGN_FACTOR_CLASS_1 = 0.72
/** Design factor for Class 2. */
export const DESIGN_FACTOR_CLASS_2 = 0.6

/** Corrosion allowance, mm. */
export const CORROSION_ALLOWANCE_MM = 3

/** Design code reference common to the pilot fleet. */
export const DESIGN_CODE = 'ASME B31.4 / ADNOC AGES-SP-10-003'
