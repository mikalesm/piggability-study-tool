import { odForNb } from './wall'
import type { Segment, TrapFeasibility } from './types'

/**
 * Verify-on-site trap feasibility for one segment. Pure, descriptive.
 *
 * This is NOT a tool-train sizing calc — the scope itself requires the bidder to
 * verify trap data during the site survey. The heuristic only distinguishes:
 *   - no trap data captured           → 'unknown'
 *   - operability flagged unconfirmed → 'confirm'
 *   - both barrels + bore dimensioned → 'ok' (still "verify on site")
 *   - partial dimensions              → 'confirm'
 */
export function trapFeasibility(segment: Segment): TrapFeasibility {
  const t = segment.traps
  if (!t) {
    return { status: 'unknown', label: 'No trap data', note: 'Pig-trap data not captured for this line.' }
  }

  if (t.operabilityConfirmed === false) {
    return {
      status: 'confirm',
      label: 'Operability to confirm',
      note: 'Trap exists but operability is unconfirmed in the scope — confirm during the site survey before mobilising.',
    }
  }

  const dimensioned = t.launcherBarrelMm != null && t.receiverBarrelMm != null && t.boreMm != null
  if (!dimensioned) {
    return {
      status: 'confirm',
      label: 'Trap data incomplete',
      note: 'Some launcher/receiver dimensions are missing — verify the full trap geometry on site.',
    }
  }

  // Sanity flag if the dimensioned trap bore is well under the line OD (possible
  // reduced-bore trap that could stop the tool). Indicative only.
  const od = odForNb(segment.nb)
  const tight = t.boreMm! < od * 0.9
  const note = tight
    ? `Trap bore ${t.boreMm} mm is below the ${od} mm line OD — check for a reduced-bore trap, then verify tool-train fit on site.`
    : `Launcher ${t.launcherBarrelMm} mm / receiver ${t.receiverBarrelMm} mm barrels dimensioned${t.valveType ? `, ${t.valveType.toLowerCase()}` : ''} — verify tool-train fit on site.`
  return { status: tight ? 'confirm' : 'ok', label: tight ? 'Check reduced bore' : 'Dimensioned — verify on site', note }
}
