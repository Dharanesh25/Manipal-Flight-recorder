import { Link } from 'react-router-dom'
import { fmtDateTime, fmtTime, fmtShortDate, fmtDelta } from '../lib/format'
import { ENTITY_BY_ID } from '../data/entities'
import { SeverityTag, RiskState } from './ui/Severity'
import { Field, Confidence } from './ui/Primitives'
import { detectionHref } from '../lib/links'

/** Incident metadata as a definition list (investigation left column). */
export function IncidentMeta({ incident }) {
  const span = (new Date(incident.lastObserved) - new Date(incident.firstObserved)) / 1000
  return (
    <dl>
      <Field label="Incident ID">{incident.id}</Field>
      <Field label="First observed">{fmtDateTime(incident.firstObserved)}</Field>
      <Field label="Last observed">
        {fmtDateTime(incident.lastObserved)}
        <span className="block text-[11px] text-fg-4">span {fmtDelta(span).slice(1)}</span>
      </Field>
      <Field label="Affected entities" stack>
        <ul className="space-y-1.5">
          {incident.entities.map((id) => {
            const e = ENTITY_BY_ID[id]
            return (
              <li key={id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {e?.name === '203.0.113.77' ? 'cdn-sync.example' : e?.name ?? id}
                  {(e?.type === 'HOST' || e?.id === '203.0.113.77') && <span className="ml-1.5 text-fg-4">{e.address}</span>}
                </span>
                {e && <RiskState risk={e.risk} />}
              </li>
            )
          })}
        </ul>
      </Field>
      <Field label="Protocols">{incident.protocols.join(' · ')}</Field>
      <Field label="Destination count">
        {incident.destinations.total}
        <span className="ml-2 text-amber">{incident.destinations.novel} novel</span>
      </Field>
      <Field label="Behavior deviation">
        <span className={incident.deviation >= 70 ? 'text-crit' : 'text-amber'}>{incident.deviation}</span>
        <span className="text-fg-4"> / 100</span>
      </Field>
      <Field label="Confidence">
        <Confidence value={incident.confidence} />
      </Field>
      <Field label="Detection">
        <Link to={detectionHref(incident.detection)} className="underline decoration-line-strong underline-offset-2 hover:decoration-fg-2">
          {incident.detection}
        </Link>
      </Field>
      <Field label="Assignee">{incident.assignee ?? <span className="text-fg-4">unassigned</span>}</Field>
      {incident.containment && (
        <Field label="Containment">
          <span className="text-ok">{fmtTime(incident.containment.ts)}</span>
          <span className="block text-[11px] text-fg-3">{incident.containment.action}</span>
        </Field>
      )}
    </dl>
  )
}

/** Compact incident queue (overview). */
export function IncidentList({ incidents, onOpen }) {
  return (
    <ul className="divide-y divide-line">
      {incidents.map((i) => {
        const closed = i.status.startsWith('CLOSED')
        return (
          <li key={i.id}>
            <button
              onClick={() => onOpen?.(i)}
              className={`grid w-full grid-cols-[4.6rem_1fr_auto] items-baseline gap-x-3 px-1 py-2.5 text-left hover:bg-raised ${closed ? 'opacity-55' : ''}`}
            >
              <span className="mono text-[11.5px] text-fg">{i.id}</span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] text-fg">{i.title}</span>
                <span className="mono mt-0.5 block truncate text-[10.5px] text-fg-4">
                  {fmtShortDate(i.opened)} {fmtTime(i.opened)} · {i.entities[0]}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <SeverityTag level={i.severity} />
                <span className={`mono text-[9.5px] tracking-wider ${i.status === 'TRIAGE' ? 'text-amber' : closed ? 'text-fg-4' : 'text-fg-2'}`}>{i.status}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
