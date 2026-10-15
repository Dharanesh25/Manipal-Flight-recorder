import { useState } from 'react'
import { PageHeader, Segmented, Meter, DemoTag } from '../components/ui/Primitives'
import { useAppState } from '../state/context'
import { API_ENABLED, ENDPOINTS } from '../api/client'
import { fmtNum } from '../lib/format'
import { SYSTEM_STATUS, TELEMETRY_SOURCES, COVERAGE_GAPS } from '../data/system'

const SECTIONS = [
  ['model', 'Detection model'],
  ['sources', 'Telemetry sources'],
  ['retention', 'Retention'],
  ['thresholds', 'Alert thresholds'],
  ['prefs', 'User preferences'],
  ['status', 'System status'],
]

function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-8 shrink-0 border transition-colors ${checked ? 'border-ivory bg-ivory' : 'border-line-strong bg-raised'}`}
    >
      <span className={`absolute top-[2px] h-3 w-3 transition-all ${checked ? 'left-[16px] bg-ink' : 'left-[2px] bg-fg-3'}`} />
    </button>
  )
}

/** One setting: label + explanation on the left, control on the right. */
function Row({ label, hint, children }) {
  return (
    <div className="grid gap-x-10 gap-y-2 border-b border-line py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div>
        <div className="text-[13px] text-fg">{label}</div>
        {hint && <p className="mt-1 text-[12px] leading-snug text-fg-3">{hint}</p>}
      </div>
      <div className="flex items-center md:justify-end">{children}</div>
    </div>
  )
}

function Slider({ value, onChange, min, max, step, format }) {
  return (
    <div className="flex w-full items-center gap-3 md:w-72">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer" />
      <span className="mono tabular w-14 text-right text-[12px] text-fg">{format(value)}</span>
    </div>
  )
}

function Block({ id, title, meta, children }) {
  return (
    <section id={id} className="scroll-mt-4 border-b border-line px-6 py-6 md:px-8">
      <div className="mb-2 flex items-baseline gap-3">
        <h2 className="text-[15px] font-medium text-fg">{title}</h2>
        {meta && <span className="mono text-[10.5px] text-fg-4">{meta}</span>}
      </div>
      {children}
    </section>
  )
}

export default function Settings() {
  const { prefs, setPref } = useAppState()
  const [s, setS] = useState({
    window: '7d',
    todMatch: true,
    sigma: 2.5,
    correlation: 15,
    sources: Object.fromEntries(TELEMETRY_SOURCES.map((x) => [x.id, true])),
    retFlows: '14d',
    retEvents: '90d',
    retIncidents: '1y',
    incidentScore: 70,
    minConfidence: 0.6,
    minIntervals: 12,
    jitter: 10,
  })
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }))

  return (
    <div className="min-h-full">
      <PageHeader kicker="09 · Settings" title="Settings" subtitle="Model, telemetry and alerting configuration for SENSOR-01. Changes here apply to this browser session only — no backend is connected.">
        <DemoTag>DEMO CONFIGURATION</DemoTag>
      </PageHeader>

      <div className="grid lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden border-r border-line py-5 lg:block" aria-label="Settings sections">
          <ul className="sticky top-4">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex items-center gap-3 px-6 py-1.5 text-[12.5px] text-fg-3 hover:text-fg">
                  <span className="mono text-[10px] text-fg-4">{String(i + 1).padStart(2, '0')}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 max-w-5xl">
          <Block id="model" title="Detection model" meta={SYSTEM_STATUS.modelVersion}>
            <Row label="Baseline window" hint="Length of the rolling history each entity’s envelope is learned from.">
              <Segmented options={['7d', '14d', '28d']} value={s.window} onChange={(v) => set('window', v)} size="md" />
            </Row>
            <Row label="Time-of-day matching" hint="Compare against the same hours on previous days rather than the whole-day average. Reduces false positives from shift patterns.">
              <Switch checked={s.todMatch} onChange={(v) => set('todMatch', v)} label="Time-of-day matching" />
            </Row>
            <Row label="Deviation threshold" hint="Distance from baseline (in σ) at which a dimension counts as deviating.">
              <Slider value={s.sigma} onChange={(v) => set('sigma', v)} min={1.5} max={4} step={0.1} format={(v) => `${v.toFixed(1)}σ`} />
            </Row>
            <Row label="Correlation window" hint="Deviations on the same entity within this window are considered for correlation.">
              <Slider value={s.correlation} onChange={(v) => set('correlation', v)} min={5} max={60} step={5} format={(v) => `${v} min`} />
            </Row>
          </Block>

          <Block id="sources" title="Telemetry sources" meta={`${TELEMETRY_SOURCES.length} configured`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    {['Source', 'Kind', 'Collector', 'Rate', 'Coverage', 'State', ''].map((h) => (
                      <th key={h} className="label py-2 pr-4 text-left font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TELEMETRY_SOURCES.map((x) => (
                    <tr key={x.id} className={`border-b border-line/70 ${s.sources[x.id] ? '' : 'opacity-45'}`}>
                      <td className="py-2.5 pr-4 text-fg">{x.name}</td>
                      <td className="pr-4 text-fg-3">{x.kind}</td>
                      <td className="mono pr-4 text-[11px] text-fg-3">{x.source}</td>
                      <td className="mono tabular pr-4 text-[11px] text-fg-2">{fmtNum(x.eps)} eps</td>
                      <td className="w-28 pr-4">
                        <Meter value={x.coverage} tone={x.state === 'degraded' ? 'amber' : 'fg'} />
                        <span className="mono text-[10px] text-fg-4">{(x.coverage * 100).toFixed(0)}%</span>
                      </td>
                      <td className={`mono pr-4 text-[10px] tracking-wider ${x.state === 'degraded' ? 'text-amber' : x.state === 'simulated' ? 'text-fg-3' : 'text-ok'}`}>{x.state.toUpperCase()}</td>
                      <td className="text-right">
                        <Switch checked={s.sources[x.id]} onChange={(v) => set('sources', { ...s.sources, [x.id]: v })} label={`Enable ${x.name}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <Block id="retention" title="Retention">
            <Row label="Raw flow records" hint="zeek conn / dns / smb and NetFlow. Needed to replay sequences in the Flight Recorder.">
              <Segmented options={['7d', '14d', '30d']} value={s.retFlows} onChange={(v) => set('retFlows', v)} size="md" />
            </Row>
            <Row label="Events & detections" hint="Normalised events, deviations and detection records.">
              <Segmented options={['30d', '90d', '180d']} value={s.retEvents} onChange={(v) => set('retEvents', v)} size="md" />
            </Row>
            <Row label="Incidents & reports" hint="Investigation records, analyst notes and exported reports.">
              <Segmented options={['1y', '3y', '7y']} value={s.retIncidents} onChange={(v) => set('retIncidents', v)} size="md" />
            </Row>
          </Block>

          <Block id="thresholds" title="Alert thresholds">
            <Row label="Incident deviation score" hint="Correlated sequences above this score open an incident.">
              <Slider value={s.incidentScore} onChange={(v) => set('incidentScore', v)} min={40} max={95} step={1} format={(v) => `${v}`} />
            </Row>
            <Row label="Minimum alert confidence" hint="Detections below this confidence are recorded but do not notify.">
              <Slider value={s.minConfidence} onChange={(v) => set('minConfidence', v)} min={0.3} max={0.95} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
            </Row>
            <Row label="Periodicity — minimum intervals" hint="Consecutive regular intervals required before a periodic pattern is confirmed.">
              <Slider value={s.minIntervals} onChange={(v) => set('minIntervals', v)} min={4} max={30} step={1} format={(v) => `${v}`} />
            </Row>
            <Row label="Periodicity — jitter tolerance" hint="Allowed deviation of each interval from the mean.">
              <Slider value={s.jitter} onChange={(v) => set('jitter', v)} min={2} max={25} step={1} format={(v) => `±${v}%`} />
            </Row>
          </Block>

          <Block id="prefs" title="User preferences" meta="saved in this browser">
            <Row label="Reduce motion" hint="Disables flow animation, pulses and autoplay on the landing page.">
              <Switch checked={prefs.reduceMotion} onChange={(v) => setPref('reduceMotion', v)} label="Reduce motion" />
            </Row>
            <Row label="Simulated live stream" hint="Append routine demo events to the Overview stream every few seconds.">
              <Switch checked={prefs.liveStream} onChange={(v) => setPref('liveStream', v)} label="Simulated live stream" />
            </Row>
            <Row label="Collapsed sidebar" hint="Show section numbers only. Toggle anywhere with [.">
              <Switch checked={prefs.sidebarCollapsed} onChange={(v) => setPref('sidebarCollapsed', v)} label="Collapsed sidebar" />
            </Row>
            <Row label="Time zone" hint="All timestamps are shown in UTC to keep sensor, endpoint and report times aligned.">
              <span className="mono text-[12px] text-fg-2">UTC</span>
            </Row>
          </Block>

          <Block id="status" title="System status">
            <dl className="grid gap-x-10 md:grid-cols-2">
              {[
                ['Sensor', `${SYSTEM_STATUS.sensor} · ${SYSTEM_STATUS.environment}`],
                ['Monitoring', SYSTEM_STATUS.monitoring],
                ['Behavior model', `${SYSTEM_STATUS.model} · ${SYSTEM_STATUS.modelVersion}`],
                ['Entities tracked', fmtNum(SYSTEM_STATUS.entitiesTracked)],
                ['Ingest lag', `${SYSTEM_STATUS.ingestLagMs} ms (p50)`],
                ['Telemetry coverage', `${(SYSTEM_STATUS.coverage * 100).toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
                  <dt className="text-[12.5px] text-fg-3">{k}</dt>
                  <dd className="mono text-[12px] text-fg">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <div className="label mb-2">Coverage gaps</div>
              <ul className="divide-y divide-line">
                {COVERAGE_GAPS.map((g) => (
                  <li key={g.segment} className="flex justify-between gap-4 py-2 text-[12.5px]">
                    <span className="mono text-[11.5px] text-fg-2">{g.segment}</span>
                    <span className="text-fg-3">{g.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <div className="label mb-2">Backend API</div>
              <p className="mb-3 text-[12.5px] text-fg-3">
                {API_ENABLED ? (
                  <>Connected mode — requests go to the configured FastAPI backend.</>
                ) : (
                  <>
                    Not connected. The frontend is serving bundled demo telemetry. Set <span className="mono text-fg-2">VITE_API_BASE</span> to a FastAPI backend to switch.
                  </>
                )}
              </p>
              <ul className="mono grid gap-x-10 text-[11.5px] md:grid-cols-2">
                {Object.entries(ENDPOINTS).map(([k, path]) => (
                  <li key={k} className="flex justify-between border-b border-line py-1.5">
                    <span className="text-fg-2">GET {path}</span>
                    <span className={API_ENABLED ? 'text-ok' : 'text-fg-4'}>{API_ENABLED ? 'LIVE' : 'DEMO'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Block>
        </div>
      </div>
    </div>
  )
}
