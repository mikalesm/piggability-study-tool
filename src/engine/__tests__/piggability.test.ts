import { describe, it, expect } from 'vitest'
import {
  assess,
  deriveGeometry,
  defaultStudy,
  evalTech,
  minWall,
  odForNb,
  resolveWall,
  round,
  techByKey,
  TECHNOLOGIES,
} from '../index'
import type { Segment, StudyInputs } from '../types'
import { SEED_SEGMENTS } from '../../data/seed'

// ---- helpers ---------------------------------------------------------------

function seg(overrides: Partial<Segment> = {}): Segment {
  return {
    id: 't',
    field: 'F',
    header: 'H',
    nb: 16,
    grade: 'X60',
    designPressureBarg: 300,
    mopBarg: 280,
    locationClass: 1,
    designFactor: 0.72,
    medium: 'Liquid',
    lengthKm: 1,
    wtMm: 10,
    objective: 'Detect internal & external metal loss',
    ...overrides,
  }
}

function study(overrides: Partial<StudyInputs> = {}): StudyInputs {
  return {
    bendD: 3,
    velocity: 1.5,
    launcher: true,
    receiver: true,
    reducedBore: false,
    dualDia: false,
    cleanliness: 'Clean',
    medium: 'Liquid',
    ...overrides,
  }
}

const MFL = techByKey('MFL (axial)')!
const UTWM = techByKey('UT Wall (UTWM)')!
const CALIPER = techByKey('Caliper / Geometry')!
const EMAT = techByKey('EMAT')!

// ---- wall maths ------------------------------------------------------------

describe('wall maths', () => {
  it('round() trims float dust', () => {
    expect(round(7.1499, 1)).toBe(7.1)
    expect(round(7.15, 1)).toBe(7.2)
  })

  it('odForNb returns table values and throws on unknown bore', () => {
    expect(odForNb(16)).toBe(406.4)
    expect(odForNb(40)).toBe(1016.0)
    expect(() => odForNb(99)).toThrow()
  })

  it('B31.4 minimum wall matches the closed-form formula', () => {
    // tMin = (DP*0.1*OD)/(2*SMYS*F) + CA
    const t = minWall(300, 406.4, 'X60', 0.72)
    const expected = (300 * 0.1 * 406.4) / (2 * 413.69 * 0.72) + 3
    expect(t).toBeCloseTo(expected, 6)
  })

  it('resolveWall uses as-built when present, computes + flags otherwise', () => {
    expect(resolveWall({ wtMm: 7.92, designPressureBarg: null, odMm: 406.4, grade: 'X70', designFactor: 0.72 })).toEqual({
      wtMm: 7.92,
      wtComputed: false,
    })
    const computed = resolveWall({ wtMm: null, designPressureBarg: 300, odMm: 406.4, grade: 'X60', designFactor: 0.72 })
    expect(computed.wtComputed).toBe(true)
    expect(computed.wtMm).toBe(round(minWall(300, 406.4, 'X60', 0.72), 1))
  })

  it('resolveWall throws when computing without a design pressure', () => {
    expect(() =>
      resolveWall({ wtMm: null, designPressureBarg: null, odMm: 406.4, grade: 'X60', designFactor: 0.72 }),
    ).toThrow()
  })
})

// ---- geometry --------------------------------------------------------------

describe('deriveGeometry', () => {
  it('computes ID = OD - 2*WT and D/t', () => {
    const g = deriveGeometry(seg({ nb: 16, wtMm: 10 }))
    expect(g.odMm).toBe(406.4)
    expect(g.idMm).toBe(round(406.4 - 20, 1))
    expect(g.dOverT).toBe(round(406.4 / 10, 1))
    expect(g.wtComputed).toBe(false)
  })

  it('flags computed wall when as-built is missing', () => {
    const g = deriveGeometry(seg({ wtMm: null }))
    expect(g.wtComputed).toBe(true)
  })
})

// ---- evalTech branches -----------------------------------------------------

describe('evalTech', () => {
  it('size out of range → Not suitable', () => {
    const r = evalTech(MFL, seg({ nb: 60 }), study(), 10)
    expect(r.level).toBe('Not suitable')
    expect(r.note).toMatch(/Dmin–Dmax/)
  })

  it('couplant tech in gas → Not suitable', () => {
    const r = evalTech(UTWM, seg(), study({ medium: 'Gas' }), 10)
    expect(r.level).toBe('Not suitable')
    expect(r.note).toMatch(/couplant/)
  })

  it('bend tighter than capability → Not suitable', () => {
    const r = evalTech(MFL, seg(), study({ bendD: 1.0 }), 10)
    expect(r.level).toBe('Not suitable')
    expect(r.note).toMatch(/tighter than/)
  })

  it('MFL marginal saturation band (wtMax < wt <= wtMarg)', () => {
    const r = evalTech(MFL, seg(), study(), 22) // 19 < 22 <= 25
    expect(r.level).toBe('Marginal')
    expect(r.note).toMatch(/saturation/)
  })

  it('MFL not suitable above saturation ceiling', () => {
    const r = evalTech(MFL, seg(), study(), 30) // > 25
    expect(r.level).toBe('Not suitable')
    expect(r.note).toMatch(/exceeds MFL saturation/)
  })

  it('MFL good below wtMax', () => {
    const r = evalTech(MFL, seg(), study(), 12)
    expect(r.level).toBe('Good')
  })

  it('velocity outside window downgrades Good → Marginal', () => {
    const slow = evalTech(UTWM, seg(), study({ velocity: 0.1 }), 12)
    expect(slow.level).toBe('Marginal')
    const fast = evalTech(UTWM, seg(), study({ velocity: 9 }), 12)
    expect(fast.level).toBe('Marginal')
    expect(fast.note).toMatch(/Velocity/)
  })

  it('clean pass → Good', () => {
    const r = evalTech(CALIPER, seg(), study(), 12)
    expect(r.level).toBe('Good')
  })

  it('EMAT (non-couplant crack tool) is allowed in gas on size', () => {
    const r = evalTech(EMAT, seg({ nb: 16 }), study({ medium: 'Gas' }), 12)
    expect(r.level).toBe('Good')
  })
})

// ---- assess / verdict transitions -----------------------------------------

describe('assess verdicts', () => {
  it('clean liquid line with traps → Piggable, UT primary', () => {
    const a = assess(seg({ wtMm: 10, medium: 'Liquid' }), study())
    expect(a.verdict).toBe('Piggable')
    expect(a.recommended.techKey).toBe('UT Wall (UTWM)')
    expect(a.blockers).toHaveLength(0)
  })

  it('missing trap → blocker → Piggable w/ modifications', () => {
    const a = assess(seg({ wtMm: 10 }), study({ receiver: false }))
    expect(a.blockers).toContain('No confirmed launcher/receiver')
    expect(a.verdict).toBe('Piggable w/ modifications')
    expect(a.actions).toContain('Install / confirm receiver trap')
  })

  it('reduced-bore → blocker → Piggable w/ modifications', () => {
    const a = assess(seg({ wtMm: 10 }), study({ reducedBore: true }))
    expect(a.blockers).toContain('Reduced-bore / non-full-bore valves')
    expect(a.verdict).toBe('Piggable w/ modifications')
  })

  it('heavy debris (no blockers) → Piggable w/ modifications', () => {
    const a = assess(seg({ wtMm: 10 }), study({ cleanliness: 'Heavy debris' }))
    expect(a.verdict).toBe('Piggable w/ modifications')
    expect(a.actions).toContain('Cleaning / gauging run before inspection')
  })

  it('heavy-wall line: MFL not suitable but UT good → Piggable with UT primary', () => {
    // 36" header, heavy computed wall. UT (wtMax 40) stays viable, MFL saturates.
    const a = assess(seg({ nb: 36, grade: 'X65', wtMm: 30, medium: 'Liquid' }), study())
    const mfl = a.rows.find((r) => r.key === 'MFL (axial)')!
    const ut = a.rows.find((r) => r.key === 'UT Wall (UTWM)')!
    expect(mfl.level).toBe('Not suitable')
    expect(ut.level).toBe('Good')
    expect(a.recommended.techKey).toBe('UT Wall (UTWM)')
    expect(a.verdict).toBe('Piggable')
  })

  it('bend tighter than every tool → Not piggable as-is', () => {
    const a = assess(seg({ wtMm: 10 }), study({ bendD: 0.5 }))
    expect(a.verdict).toBe('Not piggable as-is')
    expect(a.recommended.techKey).toBeNull()
  })

  it('gas line removes UT metal-loss option (couplant) → MFL primary when viable', () => {
    const a = assess(seg({ nb: 16, wtMm: 12, medium: 'Gas' }), study({ medium: 'Gas' }))
    expect(a.recommended.techKey).toBe('MFL (axial)')
  })

  it('no metal-loss tool viable → Not piggable as-is', () => {
    // gas (kills UT) + heavy wall (kills MFL) ⇒ no metal-loss option
    const a = assess(seg({ nb: 16, wtMm: 30, medium: 'Gas' }), study({ medium: 'Gas' }))
    expect(a.verdict).toBe('Not piggable as-is')
    expect(a.recommended.techKey).toBeNull()
  })

  it('dual-diameter adds a tool action', () => {
    const a = assess(seg({ wtMm: 10 }), study({ dualDia: true }))
    expect(a.actions).toContain('Specify dual-diameter / bidirectional tool')
  })

  it('computed wall surfaces a confirm-as-built action and assumption', () => {
    const a = assess(seg({ wtMm: null, designPressureBarg: 300 }), study())
    expect(a.actions.some((x) => x.includes('Confirm as-built wall thickness'))).toBe(true)
    expect(a.assumptions.some((x) => x.includes('Wall thickness computed'))).toBe(true)
  })

  it('marginal-only metal loss (velocity) → Piggable w/ modifications', () => {
    // velocity off-window downgrades UT & MFL to Marginal: anyML true, goodML false
    const a = assess(seg({ nb: 16, wtMm: 12, medium: 'Liquid' }), study({ velocity: 0.05 }))
    const ut = a.rows.find((r) => r.key === 'UT Wall (UTWM)')!
    expect(ut.level).toBe('Marginal')
    expect(a.verdict).toBe('Piggable w/ modifications')
  })

  it('scope always starts with a proving run and lists the primary tool', () => {
    const a = assess(seg({ wtMm: 10 }), study())
    expect(a.scope[0]).toMatch(/proving run/i)
    expect(a.scope.some((s) => s.includes('UT Wall'))).toBe(true)
    expect(a.scope.some((s) => /optional/i.test(s))).toBe(true)
  })
})

// ---- verdict rationale -----------------------------------------------------

describe('verdict rationale', () => {
  it('clean liquid line: ok reason, no flips needed', () => {
    const a = assess(seg({ wtMm: 10, medium: 'Liquid' }), study())
    expect(a.rationale.summary).toMatch(/as-is/i)
    expect(a.rationale.reasons.some((r) => r.tone === 'ok')).toBe(true)
    expect(a.rationale.flips).toHaveLength(0)
  })

  it('missing trap: block reason + trap flip', () => {
    const a = assess(seg({ wtMm: 10 }), study({ receiver: false }))
    expect(a.rationale.reasons.some((r) => r.tone === 'block')).toBe(true)
    expect(a.rationale.flips.some((f) => /trap/i.test(f))).toBe(true)
  })

  it('reduced bore: flip mentions valves', () => {
    const a = assess(seg({ wtMm: 10 }), study({ reducedBore: true }))
    expect(a.rationale.flips.some((f) => /valve/i.test(f))).toBe(true)
  })

  it('heavy debris: warn reason + cleaning flip', () => {
    const a = assess(seg({ wtMm: 10 }), study({ cleanliness: 'Heavy debris' }))
    expect(a.rationale.reasons.some((r) => /debris/i.test(r.label))).toBe(true)
    expect(a.rationale.flips.some((f) => /clean/i.test(f))).toBe(true)
  })

  it('marginal-only metal loss (velocity): warn reason + upgrade flip', () => {
    const a = assess(seg({ nb: 16, wtMm: 12, medium: 'Liquid' }), study({ velocity: 0.05 }))
    expect(a.rationale.reasons.some((r) => r.tone === 'warn')).toBe(true)
    expect(a.rationale.flips.some((f) => /upgrade|range/i.test(f))).toBe(true)
  })

  it('bend tighter than all: noBend summary', () => {
    const a = assess(seg({ wtMm: 10 }), study({ bendD: 0.5 }))
    expect(a.rationale.summary).toMatch(/bend/i)
    expect(a.rationale.reasons[0].tone).toBe('block')
  })

  it('gas + heavy wall: no-viable-tool summary', () => {
    const a = assess(seg({ nb: 16, wtMm: 30, medium: 'Gas' }), study({ medium: 'Gas' }))
    expect(a.rationale.summary).toMatch(/no metal-loss/i)
    expect(a.rationale.flips.length).toBeGreaterThan(0)
  })
})

// ---- assertions on the seed fleet -----------------------------------------

describe('seed fleet expectations', () => {
  it('every liquid line recommends UT Wall as primary', () => {
    for (const s of SEED_SEGMENTS) {
      const a = assess(s, defaultStudy(s))
      expect(a.recommended.techKey, `${s.field} ${s.header}`).toBe('UT Wall (UTWM)')
    }
  })

  it('36" and 40" heavy-wall headers show MFL Marginal or Not suitable', () => {
    for (const id of ['b3', 'b4']) {
      const s = SEED_SEGMENTS.find((x) => x.id === id)!
      const a = assess(s, defaultStudy(s))
      const mfl = a.rows.find((r) => r.key === 'MFL (axial)')!
      expect(['Marginal', 'Not suitable'], `${s.header}`).toContain(mfl.level)
    }
  })

  it('PF-1 export line flags assumed medium and MOP', () => {
    const s = SEED_SEGMENTS.find((x) => x.id === 'pf1')!
    const a = assess(s, defaultStudy(s))
    expect(a.assumptions.some((x) => /Medium assumed/.test(x))).toBe(true)
    expect(a.assumptions.some((x) => /MOP assumed/.test(x))).toBe(true)
  })

  it('every seed line produces a verdict and a non-empty suitability matrix', () => {
    for (const s of SEED_SEGMENTS) {
      const a = assess(s, defaultStudy(s))
      expect(a.rows.length).toBe(TECHNOLOGIES.length)
      expect(a.verdict).toBeTruthy()
    }
  })
})
