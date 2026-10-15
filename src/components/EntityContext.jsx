import { Link } from 'react-router-dom'
import { fmtDateTime, fmtNum, fmtSigma, fmtTime, fmtShortDate } from '../lib/format'
import { DIMENSIONS, DEVIATION_THRESHOLD } from '../data/behavior'
import { SeverityTag } from './ui/Severity'
import { incidentHref } from '../lib/links'
import { ENTITY_BY_ID } from '../data/entities'
import { INCIDENT_BY_ID } from '../data/incidents'
import { RiskState, FLOW_COLOR } from './ui/Severity'
import { Field, SectionHeader } from './ui/Primitives'
import Sparkline from './charts/Sparkline'
import { DeviationScale } from './BehaviorChart'

/**
 * Entity profile body, shared by the Overview map panel and the Entities
 * side panel. `flows` = flows touching this entity (optional).
 */
export default function EntityContext({ entity, flows = [], events = [], profile = null, compact = false }) {
  const e = entity
  const peer = (f) => (f.from === e.id ? f.to : f.from)
  return (
    <div className="space-y-5 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mono text-[12px] text-fg-2">{e.address}</div>
          <div className="mt-0.5 text-[12.5px] text-fg-3">{e.role}</div>
        </div>
        <RiskState risk={e.risk} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label">Behavior change</span>
          <span className={`mono text-[12px] ${Math.abs(e.change) >= 5 ? 'text-crit' : Math.abs(e.change) >= 2.5 ? 'text-amber' : 'text-fg-2'}`}>{fmtSigma(e.change)}</span>
        </div>
        <DeviationScale z={e.change} width="100%" />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label">Connections · 24h</span>
          <span className="mono text-[11px] text-fg-2">{fmtNum(e.connections)}</span>
        </div>
        <Sparkline values={e.spark} width={compact ? 300 : 370} height={34} color={e.risk === 'critical' ? 'var(--color-crit)' : e.risk === 'suspicious' ? 'var(--color-amber)' : 'var(--color-fg-3)'} className="mt-2 w-full" />
      </div>

      {profile && (
        <section>
          <SectionHeader label="Behavior fingerprint" meta="σ vs 7-day baseline" />
          <ul className="divide-y divide-line">
            {DIMENSIONS.map((d) => {
              const z = profile.z[d.id]
              return (
                <li key={d.id} className="grid grid-cols-[1fr_auto_3rem] items-center gap-3 py-1.5">
                  <span className={`truncate text-[12px] ${Math.abs(z) >= DEVIATION_THRESHOLD ? 'text-fg' : 'text-fg-3'}`}>{d.label}</span>
                  <DeviationScale z={z} width={90} />
                  <span className={`mono text-right text-[10.5px] ${z >= 5 ? 'text-crit' : z >= DEVIATION_THRESHOLD ? 'text-amber' : 'text-fg-4'}`}>{fmtSigma(z)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {e.deviations.length > 0 && (
        <section>
          <SectionHeader label="Detected deviations" />
          <ul className="divide-y divide-line">
            {e.deviations.map((d) => (
              <li key={d.metric} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] text-fg">{d.metric}</span>
                  <span className={`mono text-[11px] ${d.z >= 5 ? 'text-crit' : d.z >= 2.5 ? 'text-amber' : 'text-fg-2'}`}>{fmtSigma(d.z)}</span>
                </div>
                <div className="mono mt-0.5 text-[10.5px] text-fg-3">
                  {d.observed} <span className="text-fg-4">vs</span> {d.baseline}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <SectionHeader label="Recent activity" meta={`last ${events.length}`} />
          <ul className="divide-y divide-line">
            {events.map((ev) => (
              <li key={ev.id} className="grid grid-cols-[4.6rem_1fr_auto] items-baseline gap-2 py-1.5">
                <span className="mono text-[10.5px] text-fg-4">
                  {fmtShortDate(ev.ts).slice(0, 2)}·{fmtTime(ev.ts)}
                </span>
                <span className={`truncate text-[12px] ${ev.severity === 'info' ? 'text-fg-3' : 'text-fg'}`}>{ev.title}</span>
                <SeverityTag level={ev.severity} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {flows.length > 0 && (
        <section>
          <SectionHeader label="Connections" meta={`${flows.length} in window`} />
          <ul className="mono divide-y divide-line text-[11px]">
            {flows.map((f) => (
              <li key={f.id} className="flex items-center gap-2 py-1.5">
                <span className="h-px w-3" style={{ background: FLOW_COLOR[f.state] }} />
                <span className="text-fg-4">{f.from === e.id ? '→' : '←'}</span>
                <span className="truncate text-fg-2">{ENTITY_BY_ID[peer(f)]?.name === '203.0.113.77' ? 'cdn-sync.example' : ENTITY_BY_ID[peer(f)]?.name ?? peer(f)}</span>
                <span className="ml-auto text-fg-3">
                  {f.proto}/{f.port}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHeader label="Profile" />
        <dl>
          <Field label="Type">{e.type}</Field>
          {e.os && <Field label="Platform">{e.os}</Field>}
          <Field label="First seen">{fmtDateTime(e.firstSeen)}</Field>
          <Field label="Last seen">{fmtDateTime(e.lastSeen)}</Field>
        </dl>
      </section>

      <section>
        <SectionHeader label="Related incidents" />
        {e.incidents.length ? (
          <ul className="divide-y divide-line">
            {e.incidents.map((id) => {
              const inc = INCIDENT_BY_ID[id]
              return (
                <li key={id}>
                  <Link to={incidentHref(id)} className="flex items-baseline gap-3 py-2 hover:bg-raised">
                    <span className="mono text-[11.5px] text-fg">{id}</span>
                    <span className="truncate text-[12px] text-fg-2">{inc?.title}</span>
                    <span className="mono ml-auto shrink-0 text-[9.5px] text-fg-4">{inc?.status}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-2 text-[12px] text-fg-4">None.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-[12px]">
        <Link to={`/app/entities?id=${encodeURIComponent(e.id)}`} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
          Entity intelligence →
        </Link>
        {e.type === 'HOST' && (
          <Link to={`/app/behavior?id=${encodeURIComponent(e.id)}`} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
            Behavioral fingerprint →
          </Link>
        )}
        {e.incidents.includes('INC-2047') && (
          <Link to="/app/recorder" className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
            Replay INC-2047 →
          </Link>
        )}
      </div>
    </div>
  )
}
