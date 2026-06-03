import { ShieldAlert } from 'lucide-react'

export const DISCLAIMER_TEXT =
  'Screening study only. Tool envelopes are indicative of the current market and must be verified against specific vendor datasheets. Vendor lists are representative, not endorsements or exhaustive. Final piggability requires trap verification, a proving run, and operator-confirmed bend radii, flow velocity and as-built wall thickness. Not for operational decisions without qualified engineering sign-off.'

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-400">
      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-accent" />
      <p>{DISCLAIMER_TEXT}</p>
    </div>
  )
}
