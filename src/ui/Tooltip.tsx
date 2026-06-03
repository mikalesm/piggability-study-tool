import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { glossaryText } from './glossary'

/**
 * Accessible glossary hint: a focusable info dot that reveals a plain-language
 * definition on hover AND keyboard focus, dismissible with Escape. Renders
 * nothing if the term is unknown, so it's safe to sprinkle liberally.
 */
export function InfoHint({ term, label }: { term: string; label?: string }) {
  const text = glossaryText(term)
  const [open, setOpen] = useState(false)
  const id = useId()
  if (!text) return null
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label ? `What is ${label}?` : 'More information'}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className="ml-1 inline-grid h-4 w-4 place-items-center rounded-full border border-line-strong text-fg-dim transition-colors hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <Info size={10} strokeWidth={2.5} />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[78vw] -translate-x-1/2 rounded-md border border-line-strong bg-panel-3 px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-fg-muted shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  )
}
