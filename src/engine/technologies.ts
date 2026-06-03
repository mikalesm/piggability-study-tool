import type { Technology } from './types'

/**
 * ILI technology knowledge base.
 *
 * IMPORTANT: every envelope here is INDICATIVE of the current market and must be
 * confirmed against specific vendor datasheets. Bend / velocity / trap /
 * cleanliness limits come from a field survey, not from design data.
 *
 * Data-driven and editable on purpose — adjust envelopes without touching the engine.
 */
export const TECHNOLOGIES: Technology[] = [
  {
    key: 'Caliper / Geometry',
    dminIn: 2,
    dmaxIn: 56,
    couplant: false,
    wtMaxMm: 99,
    wtMargMm: null,
    vminMs: 0.3,
    vmaxMs: 5,
    bendMinD: 1.0,
    target: 'geometry',
    role: 'Proving / dents / bore',
    vendors: ['Rosen', 'TDW', 'Baker Hughes', 'Onstream', 'PIPECARE'],
    source: 'indicative',
  },
  {
    key: 'MFL (axial)',
    dminIn: 4,
    dmaxIn: 56,
    couplant: false,
    wtMaxMm: 19,
    wtMargMm: 25,
    vminMs: 0.5,
    vmaxMs: 4,
    bendMinD: 1.5,
    target: 'metal-loss',
    role: 'General metal loss',
    vendors: ['Rosen', 'TDW', 'Baker Hughes', 'LIN SCAN', 'PIPECARE'],
    source: 'indicative',
  },
  {
    key: 'UT Wall (UTWM)',
    dminIn: 3,
    dmaxIn: 48,
    couplant: true,
    wtMaxMm: 40,
    wtMargMm: null,
    vminMs: 0.3,
    vmaxMs: 2,
    bendMinD: 1.5,
    target: 'metal-loss',
    role: 'Direct wall thickness',
    vendors: ['NDT Global', 'Rosen', 'Quest Integrity', 'Intero', 'PIPECARE'],
    source: 'indicative',
  },
  {
    key: 'UT Crack (UTCD)',
    dminIn: 6,
    dmaxIn: 48,
    couplant: true,
    wtMaxMm: 40,
    wtMargMm: null,
    vminMs: 0.3,
    vmaxMs: 1.5,
    bendMinD: 1.5,
    target: 'crack',
    role: 'SCC / cracking',
    vendors: ['NDT Global', 'Rosen', 'Baker Hughes'],
    source: 'indicative',
  },
  {
    key: 'EMAT',
    dminIn: 6,
    dmaxIn: 48,
    couplant: false,
    wtMaxMm: 25,
    wtMargMm: null,
    vminMs: 0.5,
    vmaxMs: 3,
    bendMinD: 1.5,
    target: 'crack',
    role: 'Cracks in gas / coating',
    vendors: ['Rosen', 'Baker Hughes'],
    source: 'indicative',
  },
]

/** Lookup a technology by key. */
export function techByKey(key: string): Technology | undefined {
  return TECHNOLOGIES.find((t) => t.key === key)
}
