import { ShieldAlert } from 'lucide-react'

export const DISCLAIMER_TEXT =
  'Screening study only. Tool envelopes are indicative of the current market and must be verified against specific vendor datasheets. Vendor lists are representative, not endorsements or exhaustive. Final piggability requires trap verification, a proving run, and operator-confirmed bend radii, flow velocity and as-built wall thickness. Not for operational decisions without qualified engineering sign-off.'

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-panel/60 p-4 text-xs leading-relaxed text-fg-dim">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-accent/80" />
      <p>{DISCLAIMER_TEXT}</p>
    </div>
  )
}
