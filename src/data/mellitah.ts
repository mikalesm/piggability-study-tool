import { defaultStudy } from '../engine'
import type { Segment, StudyInputs } from '../engine/types'
import type { SeedProject } from './seed'

/**
 * Mellitah Oil & Gas (Libyan Branch) — ITT-014-ABU-22, Contract Area A & B.
 * "Cleaning & In-Line Intelligent Inspection Survey of the Pipelines/Trunklines."
 * Doc 3401-000-A-MOG-00217 Rev A02 (Jan 2023), Appendix D — Scope of Work.
 *
 * Pipeline register transcribed from Table 1 (Base Case) and Table 2 (Option
 * Case). Operating pressures are converted from the SoW (psi) to barg at the
 * line inlet (1 psi = 0.0689476 bar) and held as the MOP; design pressure is not
 * stated in the register, so it is left null (as-built wall thickness is given
 * for every line, so the engine does not need it). All lines carry crude oil
 * (Liquid). Trap geometry exists for every line (Appendix II) but operability is
 * "to be confirmed" for the three R-82 satellite lines — encoded as unconfirmed
 * traps so the screening surfaces the trap action.
 */
export const MELLITAH_PROJECT: SeedProject = {
  id: 'mellitah-area-ab',
  name: 'Mellitah Area A & B — ILI Survey',
  client: 'Mellitah Oil & Gas B.V. (Libyan Branch)',
  code: 'ITT-014-ABU-22 / ASME B31.4 / POF',
}

const OBJECTIVE = 'Detect & size internal/external metal loss (MFL per SoW §16)'

/**
 * Base Case (Table 1) = 5 lines to clean + intelligently inspect.
 * Option Case (Table 2) = 4 manifold lines requiring progressive cleaning.
 * `caseClass` is carried for the tender proposal; the engine ignores extra keys.
 */
const MELLITAH_BASE: Segment[] = [
  // ── Base Case (Table 1) ────────────────────────────────────────────────────
  {
    id: 'm-30oil',
    field: 'Abu-Attifel → Zueitina (103A)',
    header: '30" Crude Oil Trunkline (A100–103A, 1971)',
    nb: 30,
    grade: 'X60',
    designPressureBarg: null,
    mopBarg: 5.5, // 80 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 133,
    wtMm: 10.31, // as-built, from register
    objective: OBJECTIVE,
  },
  {
    id: 'm-8r82',
    field: 'Rimal (R-82) → Abu-Attifel',
    header: '8" Crude Oil Trunkline (R82–A100, 2021)',
    nb: 8,
    grade: 'X60',
    designPressureBarg: null,
    mopBarg: 6.9, // 100 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 75.6,
    wtMm: 9.53,
    objective: OBJECTIVE,
  },
  {
    id: 'm-10uu',
    field: 'R-82 Satellites',
    header: '10" UU Station Trunkline (UU–R82, 1993)',
    nb: 10,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 11.0, // 160 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 9.2,
    wtMm: 9.27,
    objective: OBJECTIVE,
  },
  {
    id: 'm-6kk',
    field: 'R-82 Satellites',
    header: '6" KK Station Trunkline (KK–R82, 2002)',
    nb: 6,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 11.0, // 160 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 2,
    wtMm: 7.11,
    objective: OBJECTIVE,
  },
  {
    id: 'm-6oo',
    field: 'R-82 Satellites',
    header: '6" OO Station Trunkline (OO–R82, 1994)',
    nb: 6,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 13.1, // 190 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 17.8,
    wtMm: 6.35,
    objective: OBJECTIVE,
  },
  // ── Option Case (Table 2) — progressive cleaning required ───────────────────
  {
    id: 'm-10m1',
    field: 'Abu-Attifel Manifolds',
    header: '10" M1 Manifold Trunkline (M1–A100, 2013)',
    nb: 10,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 17.2, // 250 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 9.2,
    wtMm: 12.7,
    objective: OBJECTIVE,
  },
  {
    id: 'm-10m2',
    field: 'Abu-Attifel Manifolds',
    header: '10" M2 Manifold Trunkline (M2–A100, 1979)',
    nb: 10,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 13.8, // 200 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 4.9,
    wtMm: 8.74,
    objective: OBJECTIVE,
  },
  {
    id: 'm-10m3',
    field: 'Abu-Attifel Manifolds',
    header: '10" M3 Manifold Trunkline (M3–A100, 1988)',
    nb: 10,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 49.6, // 720 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 6.15,
    wtMm: 8.74,
    objective: OBJECTIVE,
  },
  {
    id: 'm-8m3',
    field: 'Abu-Attifel Manifolds',
    header: '8" M3 Manifold Trunkline (M3–A100, 1988)',
    nb: 8,
    grade: 'X52',
    designPressureBarg: null,
    mopBarg: 48.3, // 700 psi inlet
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 6.15,
    wtMm: 7.04,
    objective: OBJECTIVE,
  },
]

/**
 * Field data from SoW appendices, merged onto the segments below.
 * - traps: launcher/receiver barrel (closure-to-trap-valve A), trap bore (F),
 *   valve type and operability, from Appendix II (all Horizontal / Ball valve).
 * - flowAssurance: crude analyses from Appendix II (API gravity, pour point);
 *   where no line-specific sample exists, the waxy field crude is noted generally.
 */
const FIELD_DATA: Record<string, Pick<Segment, 'traps' | 'flowAssurance'>> = {
  'm-30oil': {
    traps: { launcherBarrelMm: 6370, receiverBarrelMm: 6197, boreMm: 762, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { waxy: true, note: 'Waxy field crude (pour point ~34–35 °C); no line-specific sample in scope.' },
  },
  'm-8r82': {
    traps: { launcherBarrelMm: 3823, receiverBarrelMm: 3823, boreMm: 219, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { apiGravity: 40.26, pourPointC: 37, waxy: true, note: 'R-82 → A-100 sample (2021): pour point 98.6 °F.' },
  },
  'm-10uu': {
    traps: { launcherBarrelMm: 4680, receiverBarrelMm: 8150, boreMm: 254, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: false },
    flowAssurance: { apiGravity: 42.46, pourPointC: 35, waxy: true, note: 'UU export-line sample (2010).' },
  },
  'm-6kk': {
    traps: { launcherBarrelMm: 2474, receiverBarrelMm: 2453, boreMm: 152.4, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: false },
    flowAssurance: { waxy: true, note: 'Waxy field crude (pour point ~34–35 °C); no line-specific sample in scope.' },
  },
  'm-6oo': {
    traps: { launcherBarrelMm: 5880, receiverBarrelMm: 5880, boreMm: 152.4, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: false },
    flowAssurance: { waxy: true, note: 'Waxy field crude (pour point ~34–35 °C); no line-specific sample in scope.' },
  },
  'm-10m1': {
    traps: { launcherBarrelMm: 4700, receiverBarrelMm: 5456, boreMm: 254, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { apiGravity: 42.42, pourPointC: 35, waxy: true, note: 'M1 crude sample (2010): freezing 32 °C, flash 40 °C.' },
  },
  'm-10m2': {
    traps: { launcherBarrelMm: 4700, receiverBarrelMm: 5456, boreMm: 254, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { apiGravity: 42.01, pourPointC: 34, waxy: true, note: 'M2 crude sample (2010): freezing 31 °C, flash 34 °C, BS&W 11%.' },
  },
  'm-10m3': {
    traps: { launcherBarrelMm: 4700, receiverBarrelMm: 5456, boreMm: 254, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { waxy: true, note: 'Waxy field crude (pour point ~34–35 °C); high-pressure M3 line (~720 psi).' },
  },
  'm-8m3': {
    traps: { launcherBarrelMm: 4555, receiverBarrelMm: 6530, boreMm: 203.2, valveType: 'Ball valve', orientation: 'Horizontal', operabilityConfirmed: true },
    flowAssurance: { waxy: true, note: 'Waxy field crude (pour point ~34–35 °C); high-pressure M3 line (~700 psi).' },
  },
}

export const MELLITAH_SEGMENTS: Segment[] = MELLITAH_BASE.map((s) => ({ ...s, ...FIELD_DATA[s.id] }))

/**
 * Survey-input overrides reflecting the SoW. Everything else defaults.
 * - R-82 satellite lines (UU/KK/OO): trap operability "to be confirmed" → traps
 *   marked unconfirmed so the trap action surfaces.
 * - Option-case manifold lines: waxy crude (pour point ~34–35 °C) requiring
 *   progressive cleaning → cleanliness "Heavy debris".
 */
const STUDY_OVERRIDES: Record<string, Partial<StudyInputs>> = {
  'm-10uu': { launcher: false, receiver: false },
  'm-6kk': { launcher: false, receiver: false },
  'm-6oo': { launcher: false, receiver: false },
  'm-10m1': { cleanliness: 'Heavy debris' },
  'm-10m2': { cleanliness: 'Heavy debris' },
  'm-10m3': { cleanliness: 'Heavy debris' },
  'm-8m3': { cleanliness: 'Heavy debris' },
}

export const MELLITAH_STUDIES: Record<string, StudyInputs> = Object.fromEntries(
  MELLITAH_SEGMENTS.map((s) => [s.id, { ...defaultStudy(s), ...STUDY_OVERRIDES[s.id] }]),
)

/**
 * SoW-derived reference content for the tender proposal export. Sourced from
 * Appendix D sections: 8 (scope), 16.4/16.5 (deliverables), 7 (standards),
 * 6.1.1 (personnel), 15.2.4/15.2.5 (acceptance).
 */
export interface SowReference {
  tender: string
  docRef: string
  scopeOfServices: string[]
  deliverables: string[]
  standards: string[]
  personnel: string[]
  acceptance: string[]
}

export const MELLITAH_SOW: SowReference = {
  tender: 'ITT-014-ABU-22 — Cleaning & In-Line Intelligent Inspection Survey, Contract Area A & B',
  docRef: '3401-000-A-MOG-00217 Rev A02 (Jan 2023), Appendix D — Scope of Work',
  scopeOfServices: [
    'Progressive cleaning & gauging campaign — bi-di / brush / magnetic / gauging pigs to remove wax, scale, sand, black powder and debris; gauge plate to confirm minimum bore.',
    'Geometry / caliper run — detect dents, ovality, buckles, wrinkles and bore restrictions; confirm the line is fit for the metal-loss tool.',
    'High-resolution MFL metal-loss ILI — detect, identify, size, classify and locate internal/external metal loss, pitting, grooving, gouging, weld and dent-with-metal-loss anomalies.',
    'IMU / inertial mapping — pipeline centre-line XYZ mapping integrated with DGPS and above-ground markers (AGM).',
    'Data integration & corrosion-growth assessment — box-to-box matching against any previous inspection where available.',
    'All mobilisation/demobilisation, transport, qualified personnel, cleaning pigs, ILI tools, AGMs, tracking and analysis software.',
  ],
  deliverables: [
    'Field Report — on site, immediately after each run (tool condition, run data, sensor status).',
    'Function Test Report — within ~24 h of each run; confirms data quality and whether a re-run is needed.',
    'Immediate Response / Express Report — any feature with predicted burst pressure < 1.1 × MAOP reported by direct contact + in writing.',
    'Preliminary Report — within ~4 weeks of completion; provisional anomaly list, locations, sizing, GPS, immediate-attention defects.',
    'Final Report — full findings: tool data, calibration, pipe tally, anomaly list, feature sheets, statistics, DGPS/IMU integration, ERF & depth-class histograms.',
    'Corrosion Growth & Discrepancies Report + Daily Progress Reports.',
    'ILI data visualization & analysis software (with training) for independent sort/filter/search, signal review and verification.',
  ],
  standards: [
    'POF — Specifications and Requirements for In-Line Inspection of Pipelines (nomenclature, POD/POI & sizing tables).',
    'ASME B31.4 (liquid) / ASME B31.8 (gas) — pressure design & integrity.',
    'ASME B31G & Modified B31G / RSTRENG; PRCI PR-218-9304 — remaining-strength assessment.',
    'API 1163 (ILI systems qualification), API 579 / Fitness-for-Service.',
    'DNV-RP-F101 — corroded pipelines (burst / remaining strength).',
    'NACE corrosion-control standards; ASNT SNT-TC-1A / PCN / ISO 9712 — NDE personnel.',
    'ATEX 2014/34/EU & 1999/92/EC; IEC 60079 — equipment for explosive atmospheres.',
  ],
  personnel: [
    'Dedicated Project Manager as single point of contact.',
    'Data analysts certified to ASNT SNT-TC-1A / PCN Level II–III for the relevant NDE method; lead analyst ≥ Level II with documented MFL ILI experience.',
    'Field crew experienced in cleaning, gauging and MFL in-line inspection.',
  ],
  acceptance: [
    'Metal-loss anomaly classification per geometry (general / pitting / axial & circumferential grooving / pinhole / slotting), A = 10 mm if t < 10 mm else A = t.',
    'Estimated Repair Factor ERF = MOP / Psafe (RSTRENG / B31G); anomalies with ERF > 1.0 flagged for immediate action.',
    'Reporting resolution: depth 0.1 mm or 1%, length/width 0.1 mm, ERF 0.01, position 0.001°.',
    'Company dig verification supported; re-analysis at no cost if results fall outside guaranteed accuracy.',
  ],
}
