import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import NetworkGraph from '../components/NetworkGraph'
import EventStream from '../components/EventStream'
import EntityContext from '../components/EntityContext'
import { IncidentList } from '../components/IncidentPanel'
import { DeviationScale } from '../components/BehaviorChart'
import { SectionHeader, Segmented, SidePanel, Meter, DemoTag } from '../components/ui/Primitives'
import { RISK_COLOR } from '../components/ui/Severity'
import { useResource } from '../api/useResource'
import { useAppState } from '../state/context'
import { useHotkeys } from '../lib/hooks'
import { fmtSigma, fmtTime, fmtNum } from '../lib/format'
import { GRAPH_NODES, ENTITY_BY_ID } from '../data/entities'
import { LIVE_SEED, DEMO_NOW, routineLiveEvent } from '../data/events'
import { TELEMETRY_SOURCES } from '../data/system'
import { incidentHref } from '../lib/links'

const WINDOWS = [
  { value: 15, label: '15M' },
  { value: 60, label: '1H' },
  { value: 360, label: '6H' },
  { value: 1440, label: '24H' },
]

/* ------------------------------------------------------------------ */
/* 24h event density strip with the selected time window highlighted    */
/* ------------------------------------------------------------------ */
function DensityStrip({ events, windowMin }) {
  const end = new Date(DEMO_NOW).getTime()
  const start = end - 24 * 3600 * 1000
  const N = 96 // 15-minute buckets
  const buckets = useMemo(() => {
    const b = Array.from({ length: N }, () => ({ total: 0, warn: 0, crit: 0 }))
    for (const e of events) {
      const ts = new Date(e.ts).getTime()
      if (ts < start || ts > end) continue
      const i = Math.min(N - 1, Math.floor(((ts - start) / (end - start)) * N))
      b[i].total++
      if (e.severity === 'critical' || e.severity === 'high') b[i].crit++
      else if (e.severity === 'medium') b[i].warn++
    }
    return b
  }, [events, start, end])
  const max = Math.max(...buckets.map((b) => b.total), 1)
  const selFrac = Math.min(1, windowMin / 1440)
  const [hover, setHover] = useState(null)

  return (
    <div className="relative">
      <div className="relative flex h-12 items-end gap-px">
        <div className="pointer-events-none absolute inset-y-0 right-0 border-l border-signal/60 bg-signal/[0.06]" style={{ width: `${selFrac * 100}%` }} />
        {buckets.map((b, i) => (
          <div key={i} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {b.crit > 0 && <div className="absolute -top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 bg-crit" />}
            {b.warn > 0 && !b.crit && <div className="absolute -top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 border border-amber" />}
            <div className={`w-full ${hover === i ? 'bg-fg-2' : 'bg-fg-4/70'}`} style={{ height: `${Math.sqrt(b.total / max) * 70}%`, minHeight: b.total ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mono mt-1 flex justify-between text-[9.5px] text-fg-4">
        <span>{fmtTime(new Date(start).toISOString()).slice(0, 5)}</span>
        <span>−18h</span>
        <span>−12h</span>
        <span>−6h</span>
        <span>now</span>
      </div>
      {hover !== null && (
        <div className="mono pointer-events-none absolute -top-8 z-10 whitespace-nowrap border border-line-strong bg-raised px-2 py-1 text-[10.5px] text-fg-2" style={{ left: `${Math.min(80, (hover / N) * 100)}%` }}>
          {fmtTime(new Date(start + hover * 15 * 60000).toISOString()).slice(0, 5)} · {buckets[hover].total} events
          {buckets[hover].crit > 0 && <span className="text-crit"> · {buckets[hover].crit} high+</span>}
        </div>
      )}
    </div>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const { now, prefs } = useAppState()
  const { data: entityData } = useResource('entities')
  const { data: allEvents } = useResource('events')
  const { data: incidents } = useResource('incidents')

  const [windowMin, setWindowMin] = useState(1440)
  const [selected, setSelected] = useState(null)
  const [streamPaused, setStreamPaused] = useState(false)
  const [signalsOnly, setSignalsOnly] = useState(false)
  const [stream, setStream] = useState(() => [...LIVE_SEED].reverse())
  const seq = useRef(0)
  const nowRef = useRef(now)
  nowRef.current = now

  // Simulated live stream: routine telemetry trickles in on the demo clock.
  useEffect(() => {
    if (streamPaused || !prefs.liveStream) return
    const id = setInterval(() => {
      seq.current += 1
      const ev = { ...routineLiveEvent(seq.current, nowRef.current.toISOString()), fresh: true }
      setStream((s) => [ev, ...s.map((x) => ({ ...x, fresh: false }))].slice(0, 40))
    }, 7000)
    return () => clearInterval(id)
  }, [streamPaused, prefs.liveStream])

  const streamView = useMemo(() => (signalsOnly ? stream.filter((e) => e.severity !== 'info') : stream), [stream, signalsOnly])

  const flows = useMemo(() => entityData.flows.filter((f) => f.lastSeenMin <= windowMin), [entityData, windowMin])
  const selectedEntity = selected ? ENTITY_BY_ID[selected] : null
  const selectedFlows = selected ? flows.filter((f) => f.from === selected || f.to === selected) : []

  const counts = useMemo(() => {
    const c = { critical: 0, suspicious: 0, elevated: 0, normal: 0 }
    for (const n of GRAPH_NODES) c[n.risk]++
    return c
  }, [])
  const topDeviations = useMemo(() => [...entityData.entities].filter((e) => e.type === 'HOST' || e.type === 'IP').sort((a, b) => b.change - a.change).slice(0, 6), [entityData])

  useHotkeys({ Escape: () => setSelected(null) })

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ---------------- main column ---------------- */}
      <div className="min-w-0 border-line lg:border-r">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 px-6 pb-4 pt-5">
          <div>
            <div className="label mb-1.5">01 · Security overview</div>
            <h1 className="text-[22px] font-medium leading-tight tracking-[-0.01em]">Behavioral activity</h1>
          </div>
          <div className="mono flex items-center gap-5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5" style={{ background: RISK_COLOR.critical }} />
              <span className="text-crit">{counts.critical}</span>
              <span className="text-fg-4">critical</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5" style={{ background: RISK_COLOR.suspicious }} />
              <span className="text-amber">{counts.suspicious}</span>
              <span className="text-fg-4">suspicious</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-fg-4" />
              <span className="text-fg-2">{counts.normal + counts.elevated}</span>
              <span className="text-fg-4">within baseline</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="label">Window</span>
            <Segmented options={WINDOWS} value={windowMin} onChange={setWindowMin} />
          </div>
        </div>

        {/* Activity map */}
        <section className="relative border-y border-line" aria-label="Behavioral activity map">
          <div className="pointer-events-none absolute left-6 top-3 z-10 flex items-center gap-3">
            <span className="label !text-fg-2">Behavioral activity map</span>
            <span className="mono text-[10.5px] text-fg-4">
              {GRAPH_NODES.length} entities · {flows.length} flows in window
            </span>
          </div>
          <div className="h-[460px] bg-ground xl:h-[540px]">
            <NetworkGraph nodes={GRAPH_NODES} flows={flows} selectedId={selected} onSelect={setSelected} />
          </div>
          <SidePanel
            open={!!selectedEntity}
            onClose={() => setSelected(null)}
            kicker={selectedEntity?.type}
            title={<span className="mono">{selectedEntity?.name === '203.0.113.77' ? 'cdn-sync.example' : selectedEntity?.name}</span>}
            width="w-[360px]"
          >
            {selectedEntity && <EntityContext entity={selectedEntity} flows={selectedFlows} compact />}
          </SidePanel>
        </section>

        {/* Density */}
        <section className="border-b border-line px-6 pb-4 pt-8">
          <SectionHeader label="Event density · 24h" meta="15-min buckets · markers = medium / high+ severity" rule={false} className="mb-3" />
          <DensityStrip events={allEvents} windowMin={windowMin} />
        </section>

        {/* Lower band */}
        <div className="grid md:grid-cols-2 2xl:grid-cols-3">
          <section className="border-b border-line px-6 py-5 md:border-r">
            <SectionHeader label="Investigations" meta={`${incidents.filter((i) => !i.status.startsWith('CLOSED')).length} open`} />
            <IncidentList incidents={incidents} onOpen={(i) => navigate(incidentHref(i.id))} />
          </section>
          <section className="border-b border-line px-6 py-5 2xl:border-r">
            <SectionHeader label="Largest behavioral deviations" meta="vs 7-day baseline" />
            <ul className="divide-y divide-line">
              {topDeviations.map((e) => (
                <li key={e.id}>
                  <button onClick={() => (e.graph ? setSelected(e.id) : navigate(`/app/entities?id=${encodeURIComponent(e.id)}`))} className="grid w-full grid-cols-[1fr_auto_3.2rem] items-center gap-3 py-2 text-left hover:bg-raised">
                    <span className="min-w-0">
                      <span className="mono block truncate text-[12px] text-fg">{e.name}</span>
                      <span className="block truncate text-[11px] text-fg-4">{e.deviations[0]?.metric ?? e.role}</span>
                    </span>
                    <DeviationScale z={e.change} width={96} />
                    <span className={`mono text-right text-[11px] ${e.change >= 5 ? 'text-crit' : e.change >= 2.5 ? 'text-amber' : 'text-fg-3'}`}>{fmtSigma(e.change)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="border-b border-line px-6 py-5 md:col-span-2 2xl:col-span-1">
            <SectionHeader label="Sensor posture" meta="SENSOR-01">
              <DemoTag>SIMULATED</DemoTag>
            </SectionHeader>
            <ul className="divide-y divide-line">
              {TELEMETRY_SOURCES.map((s) => (
                <li key={s.id} className="grid grid-cols-[1fr_4.2rem_4rem] items-center gap-3 py-[7px]">
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-fg-2">{s.name}</span>
                    <span className="mono block truncate text-[10px] text-fg-4">{s.source}</span>
                  </span>
                  <span className="mono tabular text-right text-[10.5px] text-fg-3">{fmtNum(s.eps)} eps</span>
                  <span>
                    <Meter value={s.coverage} tone={s.state === 'degraded' ? 'amber' : 'fg'} />
                    <span className={`mono mt-1 block text-right text-[9.5px] ${s.state === 'degraded' ? 'text-amber' : 'text-fg-4'}`}>{(s.coverage * 100).toFixed(0)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* ---------------- live rail ---------------- */}
      <aside className="flex min-h-[480px] flex-col border-t border-line lg:sticky lg:top-0 lg:h-[calc(100vh-3rem)] lg:border-t-0" aria-label="Live event stream">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className={`h-1.5 w-1.5 rounded-full ${streamPaused || !prefs.liveStream ? 'bg-fg-4' : 'nfr-pulse bg-ok'}`} />
          <span className="label !text-fg-2">Live event stream</span>
          <button
            onClick={() => setStreamPaused((p) => !p)}
            className="ml-auto flex h-6 w-6 items-center justify-center text-fg-3 hover:bg-hover hover:text-fg"
            aria-label={streamPaused ? 'Resume stream' : 'Pause stream'}
            title={streamPaused ? 'Resume' : 'Pause'}
          >
            {streamPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <Segmented
            options={[
              { value: false, label: 'ALL' },
              { value: true, label: 'SIGNALS' },
            ]}
            value={signalsOnly}
            onChange={setSignalsOnly}
          />
          <span className="mono text-[10px] text-fg-4">{streamView.length} shown</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EventStream
            events={streamView}
            onSelect={(e) => (ENTITY_BY_ID[e.entity]?.graph ? setSelected(e.entity) : navigate('/app/timeline'))}
          />
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[10.5px] leading-snug text-fg-4">Simulated stream. Routine events are generated client-side every 7 s.</div>
      </aside>
    </div>
  )
}
