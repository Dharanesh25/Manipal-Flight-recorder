// Severity and risk-state markers. Colour is reserved for meaning:
// amber = warning, red = critical, green = verified/normal, stone = everything else.

const SEV = {
  info: { label: 'INFO', text: 'text-fg-4', mark: 'border border-fg-4' },
  low: { label: 'LOW', text: 'text-fg-3', mark: 'bg-fg-3' },
  medium: { label: 'MED', text: 'text-amber/80', mark: 'border border-amber' },
  high: { label: 'HIGH', text: 'text-amber', mark: 'bg-amber' },
  critical: { label: 'CRIT', text: 'text-crit', mark: 'bg-crit' },
}

export function SeverityTag({ level, long = false, className = '' }) {
  const s = SEV[level] ?? SEV.info
  return (
    <span className={`mono inline-flex items-center gap-1.5 text-[10.5px] tracking-wider ${s.text} ${className}`}>
      <span className={`inline-block h-[7px] w-[7px] shrink-0 ${s.mark}`} />
      {long ? level.toUpperCase() : s.label}
    </span>
  )
}

const RISK = {
  normal: { label: 'NORMAL', text: 'text-fg-3', dot: 'bg-ok/70' },
  elevated: { label: 'ELEVATED', text: 'text-fg-2', dot: 'bg-fg-2' },
  suspicious: { label: 'SUSPICIOUS', text: 'text-amber', dot: 'bg-amber' },
  critical: { label: 'CRITICAL', text: 'text-crit', dot: 'bg-crit' },
}

export function RiskState({ risk, className = '' }) {
  const r = RISK[risk] ?? RISK.normal
  return (
    <span className={`mono inline-flex items-center gap-1.5 text-[10.5px] tracking-wider ${r.text} ${className}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

export const RISK_COLOR = {
  normal: 'var(--color-fg-4)',
  elevated: 'var(--color-fg-2)',
  suspicious: 'var(--color-amber)',
  critical: 'var(--color-crit)',
}

export const SEV_COLOR = {
  info: 'var(--color-fg-4)',
  low: 'var(--color-fg-3)',
  medium: 'var(--color-amber)',
  high: 'var(--color-amber)',
  critical: 'var(--color-crit)',
}

export const FLOW_COLOR = {
  normal: 'var(--color-fg-4)',
  deviating: 'var(--color-amber)',
  anomalous: 'var(--color-crit)',
}
