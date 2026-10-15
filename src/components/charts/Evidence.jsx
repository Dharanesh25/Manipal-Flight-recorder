// Evidence visuals used on the Detection Details page. Each one answers a
// single question an analyst would ask about a reasoning step.
import { useMemo } from 'react'
import { rng } from '../../lib/rng'
import { useSize } from '../../lib/hooks'

/** Q: How regular is the timing? Dot strip on a log axis, baseline vs current. */
export function IntervalDotStrip({ baseline, current }) {
  const [ref, { width }] = useSize()
  const pad = { l: 64, r: 10 }
  const w = Math.max(10, width - pad.l - pad.r)
  const lo = Math.log2(0.5)
  const hi = Math.log2(128)
  const x = (v) => pad.l + ((Math.log2(Math.min(128, Math.max(0.5, v))) - lo) / (hi - lo)) * w
  const jitter = useMemo(() => {
    const r = rng(5)
    return Array.from({ length: 80 }, () => r())
  }, [])
  const rows = [
    { label: 'BASELINE', data: baseline, y: 18, color: 'var(--color-fg-3)' },
    { label: 'CURRENT', data: current, y: 54, color: 'var(--color-amber)' },
  ]
  const ticks = [0.5, 1, 2, 4, 8, 16, 32, 64, 128]
  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={92} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={4} y2={72} stroke="var(--color-line)" strokeDasharray={t === 4 ? '' : '2 3'} />
              <text x={x(t)} y={86} textAnchor="middle" className="mono" fontSize="9" fill={t === 4 ? 'var(--color-amber)' : 'var(--color-fg-4)'}>
                {t}s
              </text>
            </g>
          ))}
          {rows.map((row) => (
            <g key={row.label}>
              <text x={0} y={row.y + 3} className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
                {row.label}
              </text>
              {row.data.map((v, i) => (
                <circle key={i} cx={x(v)} cy={row.y - 8 + jitter[i % jitter.length] * 16} r="2" fill={row.color} fillOpacity="0.75" />
              ))}
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}

/** Q: Has anyone talked to this destination before? 30-day contact calendar. */
export function FirstSeenStrip({ contacts, registeredDaysAgo = 4 }) {
  const n = contacts.length
  return (
    <div>
      <div className="flex gap-[3px]">
        {contacts.map((c, i) => {
          const daysAgo = n - 1 - i
          return (
            <div key={i} className="relative flex-1">
              <div className={`h-7 ${c ? 'bg-crit' : 'border border-line-strong'}`} title={`day −${daysAgo}: ${c} contacts`} />
              {daysAgo === registeredDaysAgo && <div className="absolute -top-1.5 left-1/2 h-[calc(100%+12px)] w-px -translate-x-1/2 bg-amber" />}
            </div>
          )
        })}
      </div>
      <div className="mono mt-2 flex justify-between text-[9.5px] text-fg-4">
        <span>−29 d</span>
        <span className="text-amber">domain registered −{registeredDaysAgo} d</span>
        <span className="text-crit">2026-09-30 · {contacts[n - 1]} contacts</span>
      </div>
    </div>
  )
}

/** Q: Did the pattern hold, or was it a blip? One cell per interval. */
export function PersistenceGrid({ checks, start = '10:43:02', end = '10:46:38' }) {
  const pass = checks.filter(Boolean).length
  return (
    <div>
      <div className="flex flex-wrap gap-[3px]">
        {checks.map((ok, i) => (
          <span key={i} className={`h-4 w-[10px] ${ok ? 'bg-fg-2' : 'border border-amber'}`} title={`interval ${i + 1}: ${ok ? 'within tolerance' : 'outside ±0.4 s'}`} />
        ))}
      </div>
      <div className="mono mt-2 flex justify-between text-[9.5px] text-fg-4">
        <span>{start}</span>
        <span className="text-fg-2">
          {pass} / {checks.length} intervals within ±0.4 s
        </span>
        <span>{end}</span>
      </div>
    </div>
  )
}

/** Confidence built up step by step (horizontal waterfall). */
export function ConfidenceWaterfall({ parts }) {
  let acc = 0
  const rows = parts.map((p) => {
    const from = acc
    acc += p.value
    return { ...p, from, to: acc }
  })
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const left = Math.min(r.from, r.to)
        const width = Math.abs(r.value)
        return (
          <div key={r.label} className="grid grid-cols-[minmax(0,13rem)_1fr_3.2rem] items-center gap-3">
            <span className="truncate text-[12px] text-fg-2">{r.label}</span>
            <div className="relative h-[12px] bg-line/40">
              <div className="absolute inset-y-0" style={{ left: `${left * 100}%`, width: `${width * 100}%`, background: r.value < 0 ? 'transparent' : 'var(--color-fg-2)', border: r.value < 0 ? '1px dashed var(--color-amber)' : 'none' }} />
            </div>
            <span className={`mono tabular text-right text-[11px] ${r.value < 0 ? 'text-amber' : 'text-fg-2'}`}>
              {r.value > 0 ? '+' : '−'}
              {Math.abs(r.value).toFixed(2)}
            </span>
          </div>
        )
      })}
      <div className="grid grid-cols-[minmax(0,13rem)_1fr_3.2rem] items-center gap-3 border-t border-line pt-2">
        <span className="text-[12px] text-fg">Detection confidence</span>
        <div className="relative h-[12px] bg-line/40">
          <div className="absolute inset-y-0 left-0 bg-ivory" style={{ width: `${acc * 100}%` }} />
        </div>
        <span className="mono tabular text-right text-[12px] text-fg">{acc.toFixed(2)}</span>
      </div>
    </div>
  )
}
