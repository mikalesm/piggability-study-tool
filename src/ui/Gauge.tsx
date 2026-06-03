export type GaugeColor = 'emerald' | 'amber' | 'rose'

const HEX: Record<GaugeColor, string> = {
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
}
const TEXT: Record<GaugeColor, string> = {
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
}

const CX = 60
const CY = 62
const R = 46
const ARC = Math.PI * R // length of the semicircle

/**
 * A small semicircular instrument dial. Arc fill is colored by band; the numeric
 * value sits in the centre and the band label below. Accessible: role="img"
 * with a descriptive aria-label (color is never the only signal).
 */
export function Gauge({
  value,
  label,
  bandLabel,
  color,
}: {
  value: number
  label: string
  bandLabel: string
  color: GaugeColor
}) {
  const frac = Math.max(0, Math.min(1, value / 100))
  const path = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`${label}: ${bandLabel}, ${value} of 100`}
    >
      <div className="label mb-1.5 text-center">{label}</div>
      <svg viewBox="0 0 120 76" className="w-full max-w-[140px]">
        <path d={path} fill="none" stroke="rgb(var(--line-2))" strokeWidth={9} strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          stroke={HEX[color]}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${ARC * frac} ${ARC}`}
        />
        <text x={CX} y={CY - 6} textAnchor="middle" className="num" fill="rgb(var(--text))" fontSize={22} fontWeight={600}>
          {value}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fill="rgb(var(--dim))" fontSize={8}>
          / 100
        </text>
      </svg>
      <div className={`text-xs font-semibold ${TEXT[color]}`}>{bandLabel}</div>
    </div>
  )
}
