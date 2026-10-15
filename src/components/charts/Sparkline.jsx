/**
 * Compact trend line. Optional `band` ([{p10,p90}]) draws the baseline
 * envelope behind the line; points outside the band are marked.
 */
export default function Sparkline({ values, band, width = 96, height = 22, color = 'var(--color-fg-2)', markOutliers = true, className = '' }) {
  if (!values?.length) return null
  const all = band ? [...values, ...band.map((b) => b.p90)] : values
  const max = Math.max(1, ...all)
  const min = 0
  const x = (i) => (i / (values.length - 1)) * (width - 2) + 1
  const y = (v) => height - 1 - ((v - min) / (max - min)) * (height - 2)
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const area = band
    ? band.map((b, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(b.p90).toFixed(1)}`).join('') +
      band
        .map((b, i) => [i, b])
        .reverse()
        .map(([i, b]) => `L${x(i).toFixed(1)},${y(b.p10).toFixed(1)}`)
        .join('') +
      'Z'
    : null
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`block ${className}`} aria-hidden>
      {area && <path d={area} fill="var(--color-fg)" opacity="0.07" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {band &&
        markOutliers &&
        values.map((v, i) =>
          v > band[i].p90 * 1.15 ? <circle key={i} cx={x(i)} cy={y(v)} r="1.6" fill="var(--color-amber)" /> : null,
        )}
    </svg>
  )
}
