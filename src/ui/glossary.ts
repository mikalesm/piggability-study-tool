/**
 * Plain-language definitions for the domain jargon surfaced in the UI.
 * Mixed / client-facing audience — explain terms without dumbing them down.
 * Keyed by a short term id used by <InfoHint term="...">.
 */
export const GLOSSARY: Record<string, string> = {
  'mfl-saturation':
    'MFL (magnetic flux leakage) must magnetically saturate the pipe wall to read metal loss. A heavy wall can absorb the field so it never saturates — the tool goes blind. Hence MFL trends Marginal / Not suitable on thick-wall lines.',
  couplant:
    'UT (ultrasonic) tools need a liquid between the sensor and the wall to carry the sound pulse. That works on liquid lines; in gas you must batch a liquid slug, or UT is not suitable.',
  'bend-d':
    'The tightest bend a tool can negotiate, measured in pipe diameters. A 1.5D bend has a centreline radius of 1.5× the pipe diameter. A line bent tighter than the tool’s capability is a hard blocker.',
  'velocity-window':
    'Each technology has a driving-flow speed band it must stay within. Too slow and it stalls; too fast and data quality drops. Outside the band downgrades a tool from Good to Marginal.',
  trap:
    'A launcher inserts the tool into the line; a receiver retrieves it. Both must exist (or be installed) before any in-line inspection — often the gating item.',
  'reduced-bore':
    'A valve or fitting whose internal bore is smaller than the pipe. It can physically stop the tool, so it must be verified or replaced before pigging.',
  'dual-diameter':
    'A line that changes nominal bore along its length. It needs a tool able to negotiate both sizes (dual-diameter / bidirectional), not a fixed-size tool.',
  'gauge-plate':
    'A sacrificial plate run ahead of inspection to prove the line is clear and full-bore. Paired with a caliper/geometry run it de-risks the inspection tool.',
  utwm: 'UT Wall Measurement — ultrasonic tool that reads remaining wall thickness directly. Handles heavy wall but needs a liquid couplant.',
  utcd: 'UT Crack Detection — ultrasonic tool tuned for cracks / SCC. Also needs a liquid couplant.',
  emat:
    'Electro-Magnetic Acoustic Transducer — generates ultrasound in the wall without a couplant, so it can find cracks in gas lines or under coating.',
  imu: 'Inertial Measurement Unit — maps the pipeline’s route and bends in 3D, usually combined with a metal-loss run.',
  'min-wall':
    'ASME B31.4 minimum wall thickness — computed from design pressure, diameter, grade and a design factor when as-built wall is not in the data. Used as a stand-in and flagged for confirmation.',
  'd-over-t':
    'Diameter-to-wall-thickness ratio (OD ÷ WT). A quick index of how thin-walled the pipe is; high values are thin, low values are heavy-wall.',
}

export function glossaryText(term: string): string | undefined {
  return GLOSSARY[term]
}
