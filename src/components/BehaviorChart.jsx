import { useState } from 'react'
import { useSize } from '../lib/hooks'
import { bucketLabel, INTERVAL_BINS } from '../data/behavior'

/* ------------------------------------------------------------------ */
/* Baseline envelope vs current series                                 */
/* ------------------------------------------------------------------ */
export function BandChart({ data, start = '09:00', minutes = 5, height = 120, flagged = false, novel = [], unit = '' }) {
  const [ref, { width }] = useSize()
  const [hover, setHover] = useState(null)
  const { baseline, current } = data
  const n = current.length
  const pad = { l: 30, r: 8, t: 8, b: 18 }
  const w = Math.max(10, width - pad.l - pad.r)
  const h = height - pad.t - pad.b
  const max = Math.max(...current, ...baseline.map((b) => b.p90)) * 1.08 || 1
  const x = (i) => pad.l + (i / (n - 1)) * w
  const y = (v) => pad.t + h - (v / max) * h

  const bandPath =
    baseline.map((b, i) => `${i ? 'L' : 'M'}${x(i)},${y(b.p90)}`).join('') +
    [...baseline].reverse().map((b, j) => `L${x(n - 1 - j)},${y(b.p10)}`).join('') +
    'Z'
  const medPath = baseline.map((b, i) => `${i ? 'L' : 'M'}${x(i)},${y(b.p50)}`).join('')
  const curPath = current.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')

  // Segments that leave the envelope — highlighted only if the dimension is flagged
  const outside = current.map((v, i) => v > baseline[i].p90 * 1.1)
  const segs = []
  for (let i = 0; i < n - 1; i++) if (outside[i] || outside[i + 1]) segs.push(i)

  const fmt = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(0) : v.toFixed(1))

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / w) * (n - 1))
    setHover(i >= 0 && i < n ? i : null)
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={pad.l + w} y1={pad.t + h * (1 - f)} y2={pad.t + h * (1 - f)} stroke="var(--color-line)" strokeDasharray={f === 0 ? '' : '2 3'} />
              <text x={pad.l - 6} y={pad.t + h * (1 - f) + 3} textAnchor="end" className="mono" fontSize="9" fill="var(--color-fg-4)">
                {fmt(max * f)}
              </text>
            </g>
          ))}
          <path d={bandPath} fill="var(--color-fg)" opacity="0.075" />
          <path d={medPath} fill="none" stroke="var(--color-fg-4)" strokeDasharray="3 3" strokeWidth="1" />
          <path d={curPath} fill="none" stroke="var(--color-fg-2)" strokeWidth="1.25" strokeLinejoin="round" />
          {flagged &&
            segs.map((i) => (
              <line key={i} x1={x(i)} y1={y(current[i])} x2={x(i + 1)} y2={y(current[i + 1])} stroke="var(--color-amber)" strokeWidth="1.8" />
            ))}
          {novel.map((i) => (
            <g key={`n${i}`}>
              <line x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + h} stroke="var(--color-amber)" strokeDasharray="2 2" opacity="0.7" />
              <rect x={x(i) - 3} y={y(current[i]) - 3} width="6" height="6" fill="var(--color-ground)" stroke="var(--color-amber)" />
              <text x={x(i) + 6} y={pad.t + 8} className="mono" fontSize="9" fill="var(--color-amber)">
                +1 novel dst
              </text>
            </g>
          ))}
          {[0, Math.floor((n - 1) / 2), n - 1].map((i) => (
            <text key={i} x={x(i)} y={height - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="mono" fontSize="9" fill="var(--color-fg-4)">
              {bucketLabel(start, i, minutes)}
            </text>
          ))}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--color-fg-3)" strokeWidth="0.75" />
              <circle cx={x(hover)} cy={y(current[hover])} r="2.5" fill="var(--color-fg)" />
            </g>
          )}
        </svg>
      )}
      {hover !== null && (
        <div
          className="mono pointer-events-none absolute top-0 z-10 border border-line-strong bg-raised px-2 py-1 text-[10.5px] text-fg-2"
          style={{ left: Math.min(x(hover) + 8, width - 150) }}
        >
          <div className="text-fg-3">{bucketLabel(start, hover, minutes)}</div>
          <div>
            now <span className="text-fg">{fmt(current[hover])}</span> {unit}
          </div>
          <div>
            p50 {fmt(baseline[hover].p50)} · p90 {fmt(baseline[hover].p90)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Categorical share: baseline (outline) vs current (solid)            */
/* ------------------------------------------------------------------ */
export function DistributionCompare({ items, flagged = false, threshold = 0.15 }) {
  return (
    <div className="space-y-[7px]">
      {items.map((it) => {
        const diff = it.current - it.baseline
        const hot = flagged && Math.abs(diff) >= threshold
        return (
          <div key={it.k} className="grid grid-cols-[3.2rem_1fr_5.5rem] items-center gap-2">
            <span className={`mono text-[11px] ${hot ? 'text-amber' : 'text-fg-2'}`}>{it.k}</span>
            <div className="relative h-[11px]">
              <div className="absolute inset-y-0 left-0 border border-fg-4/70" style={{ width: `${it.baseline * 100}%` }} />
              <div
                className={`absolute left-0 top-[3px] h-[5px] ${hot ? 'bg-amber' : 'bg-fg-2'}`}
                style={{ width: `${Math.max(0.4, it.current * 100)}%` }}
              />
            </div>
            <span className="mono tabular text-right text-[10.5px] text-fg-3">
              {(it.baseline * 100).toFixed(0)}→<span className={hot ? 'text-amber' : 'text-fg'}>{(it.current * 100).toFixed(0)}%</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inter-arrival histogram: periodicity shows up as one dominant bin   */
/* ------------------------------------------------------------------ */
export function IntervalHistogram({ data, flagged = false, height = 104 }) {
  const { baseline, current, cv } = data
  const max = Math.max(...baseline, ...current)
  const peak = current.indexOf(Math.max(...current))
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height: height - 30 }}>
        {INTERVAL_BINS.map((b, i) => {
          const hot = flagged && i === peak && current[i] > baseline[i] * 2.5
          return (
            <div key={b} className="relative flex h-full flex-1 items-end" title={`${b}: baseline ${(baseline[i] * 100).toFixed(0)}% · now ${(current[i] * 100).toFixed(0)}%`}>
              <div className="absolute bottom-0 w-full border border-b-0 border-fg-4/70" style={{ height: `${(baseline[i] / max) * 100}%` }} />
              <div className={`relative mx-auto w-[46%] ${hot ? 'bg-amber' : 'bg-fg-2'}`} style={{ height: `${Math.max(1.5, (current[i] / max) * 100)}%` }} />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-[3px] border-t border-line pt-1">
        {INTERVAL_BINS.map((b) => (
          <span key={b} className="mono flex-1 text-center text-[8.5px] text-fg-4">
            {b.replace('s', '').replace('+', '')}
          </span>
        ))}
      </div>
      <div className="mono mt-1.5 flex justify-between text-[10.5px] text-fg-3">
        <span>seconds between connections</span>
        <span>
          CV {cv.baseline.toFixed(2)} → <span className={flagged ? 'text-amber' : 'text-fg'}>{cv.current.toFixed(2)}</span>
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Composition: two 100% bars                                         */
/* ------------------------------------------------------------------ */
const STONES = ['var(--color-fg-2)', 'var(--color-fg-3)', 'var(--color-fg-4)', 'var(--color-line-strong)', 'var(--color-line)']

export function StackCompare({ items, flagged = false }) {
  const row = (key, label) => (
    <div className="grid grid-cols-[4.2rem_1fr] items-center gap-2">
      <span className="label">{label}</span>
      <div className="flex h-[14px] w-full overflow-hidden">
        {items.map((it, i) => {
          const v = it[key]
          if (v <= 0.004) return null
          const hot = flagged && it.baseline < 0.02 && it.current > 0.15
          return (
            <div
              key={it.k}
              title={`${it.k} ${(v * 100).toFixed(0)}%`}
              className="mono flex items-center overflow-hidden border-r border-ground px-1 text-[9px] text-ink"
              style={{ width: `${v * 100}%`, background: hot ? 'var(--color-amber)' : STONES[i % STONES.length] }}
            >
              {v > 0.09 ? it.k : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
  return (
    <div className="space-y-2">
      {row('baseline', 'Baseline')}
      {row('current', 'Current')}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Deviation scale: z-score marker against the ±threshold band         */
/* ------------------------------------------------------------------ */
export function DeviationScale({ z, threshold = 2.5, max = 7, width = 120 }) {
  const pos = (v) => ((Math.min(max, Math.max(-max, v)) + max) / (2 * max)) * 100
  const hot = Math.abs(z) >= threshold
  const color = z >= 5 ? 'var(--color-crit)' : hot ? 'var(--color-amber)' : 'var(--color-fg-3)'
  return (
    <div className="relative h-3" style={{ width }} aria-label={`deviation ${z.toFixed(1)} sigma`}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
      <div className="absolute top-[3px] h-[6px] bg-fg/10" style={{ left: `${pos(-threshold)}%`, width: `${pos(threshold) - pos(-threshold)}%` }} />
      <div className="absolute top-0 h-3 w-px bg-fg-4" style={{ left: '50%' }} />
      <div className="absolute top-[1.5px] h-[9px] w-[3px] -translate-x-1/2" style={{ left: `${pos(z)}%`, background: color }} />
    </div>
  )
}

/** Dispatches a behavioral dimension to the right visual. */
export default function BehaviorChart({ dimension, profile, flagged, height }) {
  const d = profile[dimension.id]
  const start = profile.window.start
  switch (dimension.id) {
    case 'frequency':
      return <BandChart data={d} start={start} flagged={flagged} height={height} unit="conn" />
    case 'volume':
      return <BandChart data={d} start={start} flagged={flagged} height={height} unit="MB" />
    case 'diversity':
      return <BandChart data={d} start={start} minutes={15} flagged={flagged} novel={d.novel} height={height} unit="dst" />
    case 'ports':
      return <DistributionCompare items={d} flagged={flagged} />
    case 'regularity':
      return <IntervalHistogram data={d} flagged={flagged} height={height} />
    case 'protocols':
      return <StackCompare items={d} flagged={flagged} />
    default:
      return null
  }
}
