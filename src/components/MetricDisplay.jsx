/**
 * A single quantitative reading. Deliberately understated: the label explains
 * what the number means; the number never shouts.
 */
export default function MetricDisplay({ label, value, unit, sub, tone = 'fg', align = 'left', className = '' }) {
  const color = { fg: 'text-fg', amber: 'text-amber', crit: 'text-crit', ok: 'text-ok', muted: 'text-fg-2' }[tone]
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''} ${className}`}>
      <div className="label truncate">{label}</div>
      <div className={`mono tabular mt-1 text-[19px] leading-none tracking-tight ${color}`}>
        {value}
        {unit && <span className="ml-1 text-[11px] text-fg-3">{unit}</span>}
      </div>
      {sub && <div className="mt-1.5 truncate text-[11.5px] text-fg-3">{sub}</div>}
    </div>
  )
}
