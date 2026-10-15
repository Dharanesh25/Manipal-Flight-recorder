import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { ReconstructionTimeline } from '../components/Timeline'
import DetectionPanel from '../components/DetectionPanel'
import { IncidentMeta } from '../components/IncidentPanel'
import Sparkline from '../components/charts/Sparkline'
import { SectionHeader, DemoTag, Button } from '../components/ui/Primitives'
import { SeverityTag } from '../components/ui/Severity'
import { useResource } from '../api/useResource'
import { useHotkeys } from '../lib/hooks'
import { fmtTime } from '../lib/format'
import { SIGNAL_EVENTS, SCORE_SERIES, factorsAt, REPLAY_DURATION } from '../data/replay'
import { LIVE_SIGNAL, EVENT_LOG } from '../data/events'
import { INC_2051_FACTORS, SUPPORTING } from '../data/incidents'
import { detectionHref, isOpenIncident } from '../lib/links'

const NOTES_KEY = 'nfr.notes.v1'

function readNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** INC-2051 events mapped onto phases so they share the reconstruction view. */
const INC_2051_EVENTS = LIVE_SIGNAL.map((e, i) => ({
  ...e,
  // Reuse the ID the event carries in the forensic log so references match across pages
  id: EVENT_LOG.find((x) => x.ts === e.ts && x.title === e.title)?.id ?? `EVT-1001-${i}`,
  t: (new Date(e.ts) - new Date(LIVE_SIGNAL[0].ts)) / 1000,
  phase: i === 0 ? 'deviation' : i < 3 ? 'anomaly' : 'correlation',
}))

export default function Investigation() {
  const { data: incidents } = useResource('incidents')
  const open = incidents.filter(isOpenIncident)
  const [params, setParams] = useSearchParams()
  // Only open incidents have a reconstruction workspace; anything else falls back to INC-2047
  const requested = params.get('id')
  const incidentId = open.some((i) => i.id === requested) ? requested : 'INC-2047'
  const setIncidentId = (id) => setParams({ id }, { replace: true })
  const incident = incidents.find((i) => i.id === incidentId)
  const is2047 = incidentId === 'INC-2047'
  const events = is2047 ? SIGNAL_EVENTS : INC_2051_EVENTS
  const factors = is2047 ? factorsAt(REPLAY_DURATION) : INC_2051_FACTORS

  const [expanded, setExpanded] = useState(() => new Set())
  const toggle = (id) =>
    setExpanded((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const allOpen = expanded.size === events.length

  const [notes, setNotes] = useState(readNotes)
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
    } catch {
      /* ignore */
    }
  }, [notes])

  useHotkeys({ e: () => setExpanded(allOpen ? new Set() : new Set(events.map((e) => e.id))) }, [allOpen, events])

  const scoreWindow = useMemo(() => SCORE_SERIES.filter((_, i) => i % 3 === 0), [])

  return (
    <div className="min-h-full">
      {/* incident queue tabs */}
      <div className="flex items-stretch overflow-x-auto border-b border-line">
        {open.map((i) => (
          <button
            key={i.id}
            onClick={() => {
              setIncidentId(i.id)
              setExpanded(new Set())
            }}
            className={`relative flex shrink-0 items-center gap-3 border-r border-line px-5 py-2.5 text-left ${i.id === incidentId ? 'bg-panel' : 'hover:bg-panel/60'}`}
          >
            {i.id === incidentId && <span className="absolute inset-x-0 top-0 h-[2px] bg-ivory" />}
            <span className="mono text-[11.5px] text-fg">{i.id}</span>
            <span className="mono text-[9.5px] tracking-wider text-fg-3">{i.status}</span>
          </button>
        ))}
        <Link to="/app" className="ml-auto flex shrink-0 items-center px-5 text-[11.5px] text-fg-3 hover:text-fg">
          Incident queue
        </Link>
      </div>

      {/* header */}
      <header className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-line px-6 pb-5 pt-5">
        <div className="min-w-0">
          <div className="label mb-2">03 · Incident investigation</div>
          <div className="mono mb-1 text-[13px] text-fg-3">{incident.id}</div>
          <h1 className="text-[24px] font-medium leading-tight tracking-[-0.015em]">{incident.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2">
              <span className="label">Severity</span>
              <SeverityTag level={incident.severity} long />
            </span>
            <span className="flex items-center gap-2">
              <span className="label">Status</span>
              <span className={`mono text-[11px] tracking-wider ${incident.status === 'TRIAGE' ? 'text-amber' : 'text-fg'}`}>{incident.status}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="label">Opened</span>
              <span className="mono text-[11px] text-fg-2">{incident.opened.slice(0, 10)} {fmtTime(incident.opened)}</span>
            </span>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {is2047 && (
            <Link to="/app/recorder">
              <Button>Replay sequence</Button>
            </Link>
          )}
          <Link to={detectionHref(incident.detection)}>
            <Button>
              {incident.detection} <ArrowUpRight size={13} />
            </Button>
          </Link>
          {is2047 && (
            <Link to="/app/report">
              <Button variant="primary">Generate report</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_360px]">
        {/* LEFT · metadata */}
        <aside className="border-b border-line px-6 py-5 lg:border-r">
          <SectionHeader label="Incident metadata" />
          <IncidentMeta incident={incident} />
          <div className="mt-6">
            <SectionHeader label="Analyst notes" meta="stored in this browser" />
            <textarea
              value={notes[incident.id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [incident.id]: e.target.value }))}
              placeholder="Hypotheses, next steps, hand-off context…"
              rows={5}
              className="mt-2 w-full resize-y border border-line bg-panel p-2.5 text-[12.5px] leading-relaxed text-fg placeholder:text-fg-4 focus:border-fg-4 focus:outline-none"
            />
          </div>
        </aside>

        {/* CENTER · reconstruction */}
        <section className="min-w-0 border-b border-line px-6 py-5 xl:border-r">
          <SectionHeader label="Event reconstruction" meta={`${events.length} correlated events · chronological`}>
            <button onClick={() => setExpanded(allOpen ? new Set() : new Set(events.map((e) => e.id)))} className="mono text-[10.5px] text-fg-3 hover:text-fg" title="Toggle all records (E)">
              {allOpen ? 'COLLAPSE ALL' : 'EXPAND ALL'}
            </button>
          </SectionHeader>
          {is2047 && (
            <div className="flex items-center gap-4 border-b border-line py-3">
              <span className="label shrink-0">Score 10:40 → 10:47</span>
              <Sparkline values={scoreWindow} width={600} height={26} color="var(--color-amber)" className="min-w-0 flex-1" />
              <span className="mono shrink-0 text-[11px] text-crit">82</span>
            </div>
          )}
          {!is2047 && (
            <p className="border-b border-line py-3 text-[12.5px] text-amber/90">
              Sequence still developing — the correlator has seen 6 intervals and requires 12 for a confirmed periodicity finding.
            </p>
          )}
          <div className="pt-2">
            <ReconstructionTimeline events={events} expanded={expanded} onToggle={toggle} />
          </div>
        </section>

        {/* RIGHT · explanation */}
        <aside className="border-b border-line px-6 py-5 lg:col-span-2 xl:col-span-1">
          <SectionHeader label="Why was this flagged?">
            <DemoTag>SIMULATED</DemoTag>
          </SectionHeader>
          <div className="pt-4">
            <DetectionPanel factors={factors} simulated={false} />
          </div>
          <div className="mt-6">
            <SectionHeader label="Supporting observations" meta="raise confidence, not score" />
            <ul className="divide-y divide-line">
              {SUPPORTING[incident.id].map((s) => (
                <li key={s.label} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] text-fg">{s.label}</span>
                    <span className="mono shrink-0 text-[10.5px] text-fg-3">{s.effect}</span>
                  </div>
                  <div className="mono mt-1 text-[10.5px] text-fg-4">{s.detail}</div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 border-l border-line-strong pl-3 text-[11.5px] leading-relaxed text-fg-4">
            Scores and factor weights on this page are scripted demo values illustrating how an explainable model would present evidence. They are not produced by a trained detector.
          </p>
        </aside>
      </div>
    </div>
  )
}
