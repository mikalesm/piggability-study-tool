export * from './types'
export * from './constants'
export * from './wall'
export * from './technologies'
export * from './risk'
export * from './piggability'

import type { StudyInputs, Segment, Medium } from './types'

/**
 * Default study inputs for a segment. All survey-derived values default and
 * must be confirmed by a field survey. Medium resolves from the segment;
 * when the segment medium is unknown it is assumed Liquid (pilot fleet default).
 */
export function defaultStudy(segment: Segment): StudyInputs {
  const medium: Medium = segment.medium ?? 'Liquid'
  return {
    bendD: 3,
    velocity: 1.5,
    launcher: true,
    receiver: true,
    reducedBore: false,
    dualDia: false,
    cleanliness: 'Clean',
    medium,
  }
}
