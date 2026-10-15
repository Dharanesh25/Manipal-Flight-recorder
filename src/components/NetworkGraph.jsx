import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Maximize2 } from 'lucide-react'
import { ZONES, PERIMETER_X } from '../data/entities'
import { RISK_COLOR, FLOW_COLOR } from './ui/Severity'

const VB = { w: 1000, h: 620 }
const MIN_K = 0.6
const MAX_K = 3.2

function curve(a, b, bend = 0.12) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const cx = mx - dy * bend
  const cy = my + dx * bend
  return { d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, mid: { x: (a.x + 2 * cx + b.x) / 4, y: (a.y + 2 * cy + b.y) / 4 } }
}

/**
 * Behavioral activity map: entities as nodes, observed flows as edges.
 * Normal entities stay quiet; colour appears only where behavior deviates.
 */
export default function NetworkGraph({
  nodes,
  flows,
  nodeRisk = {},
  hidden,
  selectedId,
  onSelect,
  interactive = true,
  showZones = true,
  showLegend = true,
  className = '',
}) {
  const svgRef = useRef(null)
  const [view, setView] = useState({ k: 1, x: 0, y: 0 })
  const [hoverNode, setHoverNode] = useState(null)
  const [hoverEdge, setHoverEdge] = useState(null)
  const drag = useRef(null)

  const visibleNodes = useMemo(() => nodes.filter((n) => !hidden?.has(n.id)), [nodes, hidden])
  const byId = useMemo(() => Object.fromEntries(visibleNodes.map((n) => [n.id, n])), [visibleNodes])
  const edges = useMemo(() => flows.filter((f) => byId[f.from] && byId[f.to]), [flows, byId])
  const riskOf = (n) => nodeRisk[n.id] ?? n.risk

  // Ignore focus on nodes that aren't currently drawn (e.g. hidden at this replay time)
  const focus = [hoverNode, selectedId].find((id) => id && byId[id]) ?? null
  const neighbours = useMemo(() => {
    if (!focus) return null
    const s = new Set([focus])
    for (const e of edges) {
      if (e.from === focus) s.add(e.to)
      if (e.to === focus) s.add(e.from)
    }
    return s
  }, [focus, edges])

  /* ---------------- zoom & pan ---------------- */
  const toViewBox = (clientX, clientY) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }
  const zoomAt = (factor, p = { x: VB.w / 2, y: VB.h / 2 }) => {
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor))
      const r = k / v.k
      return { k, x: p.x - (p.x - v.x) * r, y: p.y - (p.y - v.y) * r }
    })
  }
  // Native non-passive listener so wheel-zoom doesn't scroll the page
  useEffect(() => {
    const svg = svgRef.current
    if (!interactive || !svg) return
    const onWheel = (e) => {
      e.preventDefault()
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, toViewBox(e.clientX, e.clientY))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive])
  const onPointerDown = (e) => {
    if (e.button !== 0) return
    if (!interactive) {
      const node = e.target.closest?.('[data-node]')?.dataset.node ?? null
      onSelect?.(node)
      return
    }
    const node = e.target.closest?.('[data-node]')?.dataset.node ?? null
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, node, scale: svgRef.current.getScreenCTM().a }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer already released — drag still works without capture */
    }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x) / d.scale
    const dy = (e.clientY - d.y) / d.scale
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }))
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (d && !d.moved) onSelect?.(d.node)
  }

  return (
    <div className={`relative h-full w-full select-none overflow-hidden ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        className={`h-full w-full ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label="Network relationship graph"
      >
        <defs>
          <pattern id="nfr-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--color-line)" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          <marker id="nfr-arrow-crit" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0L6,3L0,6z" fill="var(--color-crit)" />
          </marker>
          <marker id="nfr-arrow-amber" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0L6,3L0,6z" fill="var(--color-amber)" />
          </marker>
        </defs>

        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          <rect x="-500" y="-500" width={VB.w + 1000} height={VB.h + 1000} fill="url(#nfr-grid)" />

          {showZones &&
            ZONES.map((z) => (
              <g key={z.id}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} fill="var(--color-fg)" fillOpacity="0.012" stroke="var(--color-line-strong)" strokeDasharray="2 4" />
                <text x={z.x + 8} y={z.y + 14} className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
                  {z.label}
                  <tspan fill="var(--color-fg-4)" opacity="0.7">{`  ${z.cidr}`}</tspan>
                </text>
              </g>
            ))}

          {/* Perimeter */}
          <line x1={PERIMETER_X} x2={PERIMETER_X} y1="20" y2={VB.h - 20} stroke="var(--color-line-strong)" strokeDasharray="6 4" />
          <text x={PERIMETER_X + 8} y="34" className="mono" fontSize="9" letterSpacing="0.08em" fill="var(--color-fg-4)">
            EXTERNAL
          </text>
          <text transform={`translate(${PERIMETER_X - 6},${VB.h - 30}) rotate(-90)`} className="mono" fontSize="8.5" letterSpacing="0.08em" fill="var(--color-fg-4)">
            EGRESS · gw-edge-01 · SENSOR TAP
          </text>

          {/* Edges */}
          {edges.map((e) => {
            const a = byId[e.from]
            const b = byId[e.to]
            const { d, mid } = curve(a, b, a.external || b.external ? 0.06 : 0.12)
            const dim = neighbours && !(neighbours.has(e.from) && neighbours.has(e.to) && (e.from === focus || e.to === focus))
            const color = FLOW_COLOR[e.state] ?? FLOW_COLOR.normal
            const active = e.state !== 'normal'
            const showLabel = !dim && (focus || active || hoverEdge === e.id)
            return (
              <g key={e.id} opacity={dim ? 0.14 : 1} style={{ transition: 'opacity 160ms' }} onMouseEnter={() => setHoverEdge(e.id)} onMouseLeave={() => setHoverEdge(null)}>
                <path d={d} fill="none" stroke="transparent" strokeWidth="10" />
                <path d={d} fill="none" stroke={color} strokeOpacity={active ? 0.95 : 0.5} strokeWidth={0.6 + e.weight * (active ? 0.55 : 0.35)} />
                {active && (
                  <path
                    d={d}
                    fill="none"
                    stroke={e.state === 'anomalous' ? 'var(--color-paper)' : 'var(--color-amber)'}
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeDasharray="2 10"
                    className="nfr-flow"
                    markerEnd={`url(#nfr-arrow-${e.state === 'anomalous' ? 'crit' : 'amber'})`}
                  />
                )}
                {showLabel && (
                  <text x={mid.x} y={mid.y - 4} textAnchor="middle" className="mono" fontSize="9" fill={active ? color : 'var(--color-fg-3)'} paintOrder="stroke" stroke="var(--color-ground)" strokeWidth="3">
                    {e.proto}/{e.port}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {visibleNodes.map((n) => {
            const risk = riskOf(n)
            const color = RISK_COLOR[risk]
            const selected = n.id === selectedId
            const dim = neighbours && !neighbours.has(n.id)
            const size = n.type === 'HOST' ? 9 : 8
            const labelRight = !n.external
            return (
              <g
                key={n.id}
                data-node={n.id}
                transform={`translate(${n.x},${n.y})`}
                opacity={dim ? 0.25 : 1}
                style={{ transition: 'opacity 160ms', cursor: 'pointer' }}
                onMouseEnter={() => setHoverNode(n.id)}
                onMouseLeave={() => setHoverNode(null)}
              >
                <circle r="22" fill="transparent" />
                {risk === 'critical' && <circle r="16" fill="none" stroke="var(--color-crit)" strokeOpacity="0.6" className="nfr-pulse" />}
                {risk === 'suspicious' && <circle r="13" fill="none" stroke="var(--color-amber)" strokeOpacity="0.55" strokeDasharray="2 2.5" />}
                {selected && <rect x={-size - 6} y={-size - 6} width={(size + 6) * 2} height={(size + 6) * 2} fill="none" stroke="var(--color-ivory)" strokeWidth="1" />}
                {n.external ? (
                  <circle r={size * 0.7} fill={risk === 'critical' ? color : 'var(--color-ground)'} stroke={color} strokeWidth={risk === 'normal' ? 1 : 1.5} />
                ) : (
                  <rect
                    x={-size / 2}
                    y={-size / 2}
                    width={size}
                    height={size}
                    fill={risk === 'critical' ? color : risk === 'normal' ? 'var(--color-raised)' : 'var(--color-ground)'}
                    stroke={risk === 'normal' ? 'var(--color-fg-3)' : color}
                    strokeWidth={risk === 'normal' ? 1 : 1.5}
                  />
                )}
                <text
                  x={labelRight ? 14 : 0}
                  y={labelRight ? -1 : 22}
                  textAnchor={labelRight ? 'start' : 'middle'}
                  className="mono"
                  fontSize="10.5"
                  fill={risk === 'normal' ? 'var(--color-fg-2)' : risk === 'elevated' ? 'var(--color-fg)' : color}
                  paintOrder="stroke"
                  stroke="var(--color-ground)"
                  strokeWidth="3"
                >
                  {n.label}
                </text>
                <text
                  x={labelRight ? 14 : 0}
                  y={labelRight ? 11 : 33}
                  textAnchor={labelRight ? 'start' : 'middle'}
                  className="mono"
                  fontSize="9"
                  fill="var(--color-fg-4)"
                  paintOrder="stroke"
                  stroke="var(--color-ground)"
                  strokeWidth="3"
                >
                  {n.sub}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {interactive && (
        <div className="absolute right-3 top-3 flex flex-col border border-line bg-panel/90">
          <button onClick={() => zoomAt(1.25)} className="p-1.5 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Zoom in" title="Zoom in (+)">
            <Plus size={13} />
          </button>
          <button onClick={() => zoomAt(0.8)} className="border-y border-line p-1.5 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Zoom out" title="Zoom out (−)">
            <Minus size={13} />
          </button>
          <button onClick={() => setView({ k: 1, x: 0, y: 0 })} className="p-1.5 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Reset view" title="Reset view (0)">
            <Maximize2 size={12} />
          </button>
        </div>
      )}

      {showLegend && (
        <div className="mono pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1 bg-ground/80 px-2 py-1 text-[9.5px] tracking-wide text-fg-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 border border-fg-3 bg-raised" />
            INTERNAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-fg-3" />
            EXTERNAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 bg-fg-4" />
            BASELINE FLOW
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 bg-amber" />
            DEVIATING
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 bg-crit" />
            ANOMALOUS
          </span>
          {interactive && <span className="text-fg-4/80">· scroll to zoom · drag to pan</span>}
        </div>
      )}
    </div>
  )
}
