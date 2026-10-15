import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { fmtTime, fmtDate, fmtDelta } from '../lib/format'
import { SeverityTag, SEV_COLOR } from './ui/Severity'
import { Confidence } from './ui/Primitives'
import { PHASES, REPLAY_BASE, REPLAY_DURATION } from '../data/replay'
import { ENTITY_BY_ID } from '../data/entities'

function RawRecord({ raw }) {
  if (!raw) return null
  return (
    <dl className="mono grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-[11px]">
      {Object.entries(raw).map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-fg-4">{k}</dt>
          <dd className="break-all text-fg-2">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

const inReplay = (ts) => {
  const d = (new Date(ts) - new Date(REPLAY_BASE)) / 1000
  return d >= 0 && d <= REPLAY_DURATION ? d : null
}

/* ------------------------------------------------------------------ */
/* Forensic timeline — dense structured rows grouped by hour           */
/* ------------------------------------------------------------------ */
const COLS = 'grid-cols-[4.6rem_minmax(0,1fr)_5.5rem] md:grid-cols-[4.8rem_6.5rem_minmax(0,1fr)_5.2rem_5.6rem] xl:grid-cols-[4.6rem_7.4rem_7.6rem_6.6rem_minmax(0,1fr)_4.6rem_6.6rem_8.6rem]'

export function ForensicTimeline({ events, expandedId, onToggle, cursorId }) {
  const cursorRef = useRef(null)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) cursorRef.current?.scrollIntoView({ block: 'nearest' })
    mounted.current = true
  }, [cursorId])

  let lastHour = null
  return (
    <div role="table" aria-label="Forensic event timeline" className="text-[12.5px]">
      <div role="row" className={`label sticky top-0 z-10 grid ${COLS} gap-x-3 border-b border-line-strong bg-ground px-6 py-2`}>
        <span>Time</span>
        <span className="hidden xl:block">Event ID</span>
        <span className="hidden md:block">Entity</span>
        <span className="hidden xl:block">Type</span>
        <span>Event</span>
        <span className="hidden md:block">Severity</span>
        <span className="hidden xl:block">Confidence</span>
        <span className="hidden text-right md:block xl:text-left">
          <span className="xl:hidden">Conf.</span>
          <span className="hidden xl:inline">Source</span>
        </span>
        <span className="md:hidden">Severity</span>
      </div>
      {events.map((e) => {
        const hour = e.ts.slice(0, 13)
        const header = hour !== lastHour
        lastHour = hour
        const open = e.id === expandedId
        const quiet = e.severity === 'info'
        const replayT = inReplay(e.ts)
        return (
          <Fragment key={e.id}>
            {header && (
              <div className="mono flex items-center gap-3 border-b border-line bg-panel px-6 py-1.5 text-[10.5px] text-fg-3">
                <span className="text-fg-2">{fmtDate(e.ts)}</span>
                <span>{hour.slice(11)}:00 UTC</span>
              </div>
            )}
            <div
              role="row"
              ref={e.id === cursorId ? cursorRef : null}
              onClick={() => onToggle(e.id)}
              className={`relative grid cursor-pointer ${COLS} items-center gap-x-3 border-b border-line/70 px-6 py-[7px] transition-colors ${
                open ? 'bg-raised' : e.id === cursorId ? 'bg-hover/70' : 'hover:bg-raised'
              }`}
            >
              {e.id === cursorId && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
              <span className={`mono tabular text-[11.5px] ${quiet ? 'text-fg-4' : 'text-fg-2'}`}>{fmtTime(e.ts)}</span>
              <span className="mono hidden truncate text-[10.5px] text-fg-4 xl:block">{e.id}</span>
              <span className="mono hidden truncate text-[11.5px] text-fg-2 md:block">{e.entity}</span>
              <span className="mono hidden text-[10px] uppercase tracking-wide text-fg-3 xl:block">{e.type}</span>
              <span className="flex min-w-0 items-center gap-2">
                <ChevronRight size={12} className={`shrink-0 text-fg-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                <span className={`truncate ${quiet ? 'text-fg-3' : 'text-fg'}`}>{e.title}</span>
                <span className="mono hidden truncate text-[10.5px] text-fg-4 2xl:inline">{e.detail}</span>
              </span>
              <span className="hidden md:block">
                <SeverityTag level={e.severity} />
              </span>
              <span className="hidden xl:block">
                <Confidence value={e.confidence} showBar={!quiet} />
              </span>
              <span className="mono hidden text-right text-[10.5px] text-fg-4 md:block xl:text-left">
                <span className="xl:hidden">{Math.round(e.confidence * 100)}%</span>
                <span className="hidden truncate xl:inline">{e.source}</span>
              </span>
              <span className="md:hidden">
                <SeverityTag level={e.severity} />
              </span>
            </div>
            {open && (
              <div className="nfr-enter grid gap-6 border-b border-line bg-raised px-6 pb-4 pl-[6.4rem] pt-1 md:grid-cols-[1fr_1fr]">
                <div>
                  <div className="label mb-1.5">Detail</div>
                  <p className="mono text-[11.5px] leading-relaxed text-fg-2">{e.detail}</p>
                  <div className="mono mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10.5px] text-fg-3">
                    <span>{e.id}</span>
                    <span>{e.entity}</span>
                    <span>{e.type}</span>
                    <span>{e.source}</span>
                  </div>
                  <div className="mt-3 flex gap-4 text-[11.5px]">
                    {replayT !== null && (
                      <Link to={`/app/recorder?t=${Math.round(replayT)}`} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
                        Replay in Flight Recorder →
                      </Link>
                    )}
                    {ENTITY_BY_ID[e.entity] && (
                      <Link to={`/app/entities?id=${encodeURIComponent(e.entity)}`} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
                        Entity profile →
                      </Link>
                    )}
                  </div>
                </div>
                {e.raw && (
                  <div>
                    <div className="label mb-1.5">Record</div>
                    <RawRecord raw={e.raw} />
                  </div>
                )}
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Incident reconstruction — chronological chain with phase dividers   */
/* ------------------------------------------------------------------ */
export function ReconstructionTimeline({ events, expanded, onToggle }) {
  let lastPhase = null
  let prevT = null
  return (
    <ol className="relative">
      <span className="absolute bottom-2 left-[5.65rem] top-2 w-px bg-line-strong" aria-hidden />
      {events.map((e) => {
        const phase = PHASES.find((p) => p.id === e.phase)
        const header = e.phase !== lastPhase
        lastPhase = e.phase
        const delta = prevT === null ? null : e.t - prevT
        prevT = e.t
        const open = expanded.has(e.id)
        const color = SEV_COLOR[e.severity]
        return (
          <Fragment key={e.id}>
            {header && (
              <li className="relative flex items-center gap-3 pb-2 pt-5 first:pt-1">
                <span className="w-[4.9rem]" />
                <span
                  className="relative z-10 h-[9px] w-[9px] -translate-x-[3px] border"
                  style={{ borderColor: phase.tone === 'crit' ? 'var(--color-crit)' : phase.tone === 'amber' ? 'var(--color-amber)' : 'var(--color-ok)', background: 'var(--color-ground)' }}
                />
                <span className={`mono text-[10.5px] tracking-[0.12em] ${phase.tone === 'crit' ? 'text-crit' : phase.tone === 'amber' ? 'text-amber' : 'text-ok'}`}>{phase.label.toUpperCase()}</span>
                <span className="h-px flex-1 bg-line" />
              </li>
            )}
            <li className="relative">
              <button onClick={() => onToggle(e.id)} className="group grid w-full grid-cols-[4.9rem_auto_1fr] gap-x-3 py-2 text-left">
                <span className="text-right">
                  <span className="mono tabular block text-[12px] text-fg">{fmtTime(e.ts)}</span>
                  {delta !== null && <span className="mono block text-[10px] text-fg-4">{fmtDelta(delta)}</span>}
                </span>
                <span className="relative z-10 mt-[5px] h-[7px] w-[7px] rotate-45" style={{ background: e.severity === 'info' ? 'var(--color-ground)' : color, border: `1px solid ${color}` }} />
                <span className="min-w-0 border-b border-line/70 pb-2.5 group-hover:border-line-strong">
                  <span className="flex items-baseline gap-3">
                    <span className="text-[13.5px] text-fg">{e.title}</span>
                    <span className="ml-auto shrink-0">
                      <SeverityTag level={e.severity} />
                    </span>
                  </span>
                  <span className="mono mt-1 block text-[11px] leading-relaxed text-fg-3">{e.detail}</span>
                  <span className="mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-fg-4">
                    <span className="text-fg-2">{e.entity}</span>
                    <span>{e.source}</span>
                    <span>{e.id}</span>
                    <Confidence value={e.confidence} className="ml-auto" />
                  </span>
                  {open && (
                    <span className="nfr-enter mt-3 block border-l border-line-strong pl-3">
                      <RawRecord raw={e.raw} />
                    </span>
                  )}
                </span>
              </button>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
