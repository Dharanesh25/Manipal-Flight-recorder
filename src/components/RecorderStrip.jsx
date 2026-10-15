import { memo, useMemo, useRef, useState } from 'react'
import { useSize } from '../lib/hooks'
import { fmtOffset, clamp } from '../lib/format'
import { LANES, LANE_TICKS, CORRELATIONS, PHASES, SIGNAL_EVENTS, SCORE_SERIES, REPLAY_BASE, REPLAY_DURATION } from '../data/replay'
import { SEV_COLOR, FLOW_COLOR } from './ui/Severity'

const D = REPLAY_DURATION
const THRESHOLD = 70
const PHASE_FILL = {
  ok: 'var(--color-fg)',
  amber: 'var(--color-amber)',
  crit: 'var(--color-crit)',
}

function layout(width, { compact }) {
  const gutter = width < 640 ? 92 : compact ? 128 : 150
  const laneH = compact ? 24 : 30
  const pad = { l: gutter, r: 14 }
  const axisH = 20
  const phaseH = 20
  const eventsH = 22
  const lanesTop = axisH + phaseH + eventsH
  const lanesH = LANES.length * laneH
  const scoreTop = lanesTop + lanesH + 10
  const scoreH = compact ? 44 : 58
  const height = scoreTop + scoreH + 8
  const w = Math.max(50, width - pad.l - pad.r)
  return { gutter, laneH, pad, axisH, phaseH, eventsH, lanesTop, lanesH, scoreTop, scoreH, height, w, x: (t) => pad.l + (t / D) * w }
}

/** Static telemetry layer — memoised, re-rendered only on resize. */
const StaticLayer = memo(function StaticLayer({ L, compact }) {
  const { x, pad, w, axisH, phaseH, eventsH, lanesTop, laneH, scoreTop, scoreH } = L
  const laneY = (i) => lanesTop + i * laneH
  const laneIdx = Object.fromEntries(LANES.map((l, i) => [l.id, i]))

  const scorePath = useMemo(() => {
    const ys = (v) => scoreTop + scoreH - (v / 100) * scoreH
    let d = `M${x(0)},${scoreTop + scoreH}`
    for (let t = 0; t <= D; t += 2) d += `L${x(t).toFixed(1)},${ys(SCORE_SERIES[t]).toFixed(1)}`
    return { area: `${d}L${x(D)},${scoreTop + scoreH}Z`, line: d.replace(/^M[^L]+/, `M${x(0)},${ys(SCORE_SERIES[0])}`) }
  }, [x, scoreTop, scoreH])

  const ticks = []
  for (let s = 0; s <= D; s += 30) ticks.push(s)

  return (
    <g>
      {/* time axis */}
      {ticks.map((s) => (
        <g key={s}>
          <line x1={x(s)} x2={x(s)} y1={axisH - 4} y2={scoreTop + scoreH} stroke="var(--color-line)" strokeWidth="0.6" opacity={s % 60 === 0 ? 0.9 : 0.4} />
          {s % 60 === 0 && (
            <text x={x(s)} y={axisH - 8} textAnchor={s === 0 ? 'start' : s === D ? 'end' : 'middle'} className="mono" fontSize="9.5" fill="var(--color-fg-4)">
              {fmtOffset(REPLAY_BASE, s)}
            </text>
          )}
        </g>
      ))}

      {/* phase band */}
      {PHASES.map((p, i) => {
        const end = PHASES[i + 1]?.start ?? D
        const x0 = x(p.start)
        const x1 = x(end)
        return (
          <g key={p.id}>
            <rect x={x0} y={axisH} width={x1 - x0} height={phaseH} fill={PHASE_FILL[p.tone]} opacity={p.tone === 'ok' ? 0.035 : p.tone === 'amber' ? 0.1 : 0.14} />
            <line x1={x0} x2={x0} y1={axisH} y2={scoreTop + scoreH} stroke={i === 0 ? 'transparent' : 'var(--color-line-strong)'} strokeDasharray="2 3" />
            {x1 - x0 > 46 && (
              <text x={x0 + 6} y={axisH + 13.5} className="mono" fontSize="9" letterSpacing="0.08em" fill={p.tone === 'crit' ? 'var(--color-crit)' : p.tone === 'amber' ? 'var(--color-amber)' : 'var(--color-fg-3)'}>
                {p.label.toUpperCase()}
              </text>
            )}
          </g>
        )
      })}

      {/* signal events row */}
      <text x={8} y={axisH + phaseH + 15} className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
        EVENTS
      </text>
      <line x1={pad.l} x2={pad.l + w} y1={axisH + phaseH + eventsH - 0.5} y2={axisH + phaseH + eventsH - 0.5} stroke="var(--color-line)" />
      {SIGNAL_EVENTS.map((e) => {
        const cx = x(e.t)
        const cy = axisH + phaseH + eventsH / 2
        const anomaly = e.t === 182
        return (
          <g key={e.id}>
            <title>{`${fmtOffset(REPLAY_BASE, e.t)} · ${e.title}`}</title>
            <rect x={cx - 3.5} y={cy - 3.5} width="7" height="7" transform={`rotate(45 ${cx} ${cy})`} fill={e.severity === 'info' ? 'var(--color-ground)' : SEV_COLOR[e.severity]} stroke={SEV_COLOR[e.severity]} />
            {anomaly && (
              <g>
                <line x1={cx} x2={cx} y1={cy + 5} y2={scoreTop + scoreH} stroke="var(--color-amber)" strokeOpacity="0.55" strokeWidth="0.8" />
                <text x={cx + 4} y={scoreTop + 9} className="mono" fontSize="8.5" letterSpacing="0.06em" fill="var(--color-amber)" paintOrder="stroke" stroke="var(--color-panel)" strokeWidth="3">
                  ANOMALY {fmtOffset(REPLAY_BASE, e.t)}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* lanes */}
      {LANES.map((lane, i) => {
        const y0 = laneY(i)
        const yb = y0 + laneH - 4
        return (
          <g key={lane.id}>
            <line x1={pad.l} x2={pad.l + w} y1={yb + 0.5} y2={yb + 0.5} stroke="var(--color-line)" />
            <text x={8} y={y0 + laneH / 2 - 1} className="mono" fontSize="10" fill="var(--color-fg-2)">
              {L.gutter < 120 ? lane.label.slice(0, 11) : lane.label}
            </text>
            <text x={8} y={y0 + laneH / 2 + 10} className="mono" fontSize="8.5" fill="var(--color-fg-4)">
              {lane.addr}
            </text>
            {LANE_TICKS[lane.id].map((tk, j) => (
              <line
                key={j}
                x1={x(tk.t)}
                x2={x(tk.t)}
                y1={yb}
                y2={yb - tk.h * (laneH - 8)}
                stroke={FLOW_COLOR[tk.state]}
                strokeOpacity={tk.state === 'normal' ? 0.75 : 0.95}
                strokeWidth={tk.beacon ? 1.15 : 1}
              />
            ))}
          </g>
        )
      })}

      {/* correlations */}
      {CORRELATIONS.map((c, i) => {
        const a = laneIdx[c.from]
        const b = laneIdx[c.to]
        const ya = laneY(a) + laneH / 2
        const yb = laneY(b) + laneH / 2
        const cx = x(c.t)
        const col = c.t >= 245 ? 'var(--color-crit)' : 'var(--color-amber)'
        return (
          <g key={i} opacity="0.9">
            <line x1={cx} x2={cx} y1={ya} y2={yb} stroke={col} strokeWidth="1" strokeDasharray="1 2" />
            <circle cx={cx} cy={ya} r="2.6" fill="var(--color-ground)" stroke={col} />
            <circle cx={cx} cy={yb} r="2.6" fill={col} />
            {!compact && (
              <text x={cx + 5} y={Math.max(ya, yb) - 3} className="mono" fontSize="8.5" fill={col} paintOrder="stroke" stroke="var(--color-ground)" strokeWidth="3">
                {c.label}
              </text>
            )}
          </g>
        )
      })}

      {/* score lane */}
      <text x={8} y={scoreTop + 12} className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
        DEVIATION
      </text>
      <text x={8} y={scoreTop + 24} className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
        SCORE
      </text>
      <line x1={pad.l} x2={pad.l + w} y1={scoreTop + scoreH} y2={scoreTop + scoreH} stroke="var(--color-line-strong)" />
      <line
        x1={pad.l}
        x2={pad.l + w}
        y1={scoreTop + scoreH - (THRESHOLD / 100) * scoreH}
        y2={scoreTop + scoreH - (THRESHOLD / 100) * scoreH}
        stroke="var(--color-crit)"
        strokeOpacity="0.5"
        strokeDasharray="3 3"
      />
      <text x={pad.l + 4} y={scoreTop + scoreH - (THRESHOLD / 100) * scoreH - 3} className="mono" fontSize="8.5" fill="var(--color-crit)" opacity="0.8">
        INCIDENT THRESHOLD {THRESHOLD}
      </text>
      <path d={scorePath.area} fill="var(--color-amber)" opacity="0.1" />
      <path d={scorePath.line} fill="none" stroke="var(--color-amber)" strokeWidth="1.2" />
    </g>
  )
})

/**
 * Multi-lane flight-recorder strip. Each lane is one entity; each tick is an
 * observed flow (height ∝ log bytes). Controlled via `t` / `onScrub`.
 */
export default function RecorderStrip({ t, onScrub, compact = false, className = '' }) {
  const [ref, { width }] = useSize()
  const [hoverT, setHoverT] = useState(null)
  const dragging = useRef(false)
  const L = useMemo(() => layout(width || 800, { compact }), [width, compact])
  const { x, pad, w, axisH, lanesTop, scoreTop, scoreH, height } = L

  const tFromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return clamp(((e.clientX - r.left - pad.l) / w) * D, 0, D)
  }
  const cx = x(t)
  const score = SCORE_SERIES[Math.round(clamp(t, 0, D))]
  const ys = scoreTop + scoreH - (score / 100) * scoreH

  return (
    <div ref={ref} className={`relative w-full touch-none ${className}`} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="block cursor-ew-resize"
          onPointerDown={(e) => {
            if (!onScrub) return
            dragging.current = true
            try {
              e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
              /* pointer already released — drag still works without capture */
            }
            onScrub(tFromEvent(e))
          }}
          onPointerMove={(e) => {
            const tt = tFromEvent(e)
            setHoverT(tt)
            if (dragging.current) onScrub?.(tt)
          }}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => setHoverT(null)}
          role="slider"
          aria-label="Replay position"
          aria-valuemin={0}
          aria-valuemax={D}
          aria-valuenow={Math.round(t)}
          aria-valuetext={fmtOffset(REPLAY_BASE, t)}
        >
          <StaticLayer L={L} compact={compact} />

          {/* "Not yet replayed" mask */}
          <rect x={cx} y={lanesTop - 22} width={Math.max(0, pad.l + w - cx)} height={height - lanesTop + 22} fill="var(--color-ground)" opacity="0.74" />

          {hoverT !== null && Math.abs(hoverT - t) > 2 && (
            <g pointerEvents="none">
              <line x1={x(hoverT)} x2={x(hoverT)} y1={axisH} y2={scoreTop + scoreH} stroke="var(--color-fg-3)" strokeDasharray="2 2" strokeWidth="0.75" />
              <text x={x(hoverT) + 4} y={height - 1} className="mono" fontSize="9" fill="var(--color-fg-3)">
                {fmtOffset(REPLAY_BASE, hoverT)}
              </text>
            </g>
          )}

          {/* cursor */}
          <g pointerEvents="none">
            <line x1={cx} x2={cx} y1={axisH - 2} y2={scoreTop + scoreH} stroke="var(--color-ivory)" strokeWidth="1" />
            <rect x={clamp(cx - 30, 0, width - 60)} y={0} width="60" height="15" fill="var(--color-ivory)" />
            <text x={clamp(cx, 30, width - 30)} y={11} textAnchor="middle" className="mono" fontSize="10" fontWeight="500" fill="var(--color-ink)">
              {fmtOffset(REPLAY_BASE, t)}
            </text>
            <circle cx={cx} cy={ys} r="3" fill="var(--color-ivory)" />
            <text x={cx + (cx > width - 70 ? -7 : 7)} y={ys - 5} textAnchor={cx > width - 70 ? 'end' : 'start'} className="mono" fontSize="10" fill="var(--color-ivory)" paintOrder="stroke" stroke="var(--color-ground)" strokeWidth="3">
              {Math.round(score)}
            </text>
          </g>
        </svg>
      )}
    </div>
  )
}
