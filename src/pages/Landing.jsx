import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pause, Play } from 'lucide-react'
import Wordmark from '../components/layout/Wordmark'
import RecorderStrip from '../components/RecorderStrip'
import DetectionPanel from '../components/DetectionPanel'
import { IntervalHistogram } from '../components/BehaviorChart'
import { DemoTag, Meter } from '../components/ui/Primitives'
import { SeverityTag } from '../components/ui/Severity'
import { useAnimationFrame } from '../lib/hooks'
import { fmtOffset, fmtTime } from '../lib/format'
import { useAppState } from '../state/context'
import { REPLAY_BASE, REPLAY_DURATION, phaseAt, factorsAt, scoreAt, SIGNAL_EVENTS, PHASES } from '../data/replay'
import { PROFILES } from '../data/behavior'
import { SYSTEM_STATUS } from '../data/system'

const SPEED = 32 // replay seconds per real second

function StatusRow({ label, value, tone = 'fg', children }) {
  const color = { fg: 'text-fg', ok: 'text-ok' }[tone]
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12.5px] text-fg-3">{label}</span>
      <span className={`mono flex items-center gap-2 text-[12px] ${color}`}>
        {tone === 'ok' && <span className="nfr-pulse h-1.5 w-1.5 rounded-full bg-ok" />}
        {value}
        {children}
      </span>
    </div>
  )
}

const METHOD = [
  ['Normal behavior', 'Each host, address and protocol gets a rolling baseline: rate, destinations, ports, timing and volume for the same hour of day.'],
  ['Behavioral deviation', 'Live flows are compared to the envelope. Departures are measured in σ, not flagged by signature.'],
  ['Anomaly detection', 'Deviations that persist, or that co-occur with novelty — a new destination, a new port — become anomalies.'],
  ['Event correlation', 'Anomalies sharing an entity and a time window are linked. Weak signals combine into a sequence.'],
  ['Attack timeline', 'The sequence is reconstructed second by second, with the routine traffic around it kept for context.'],
  ['Explainable investigation', 'Every score decomposes into named factors with the observed value, the baseline and the evidence behind it.'],
]

export default function Landing() {
  const { prefs } = useAppState()
  const [t, setT] = useState(prefs.reduceMotion ? 331 : 120)
  const [playing, setPlaying] = useState(!prefs.reduceMotion)
  const hold = useRef(0)
  useEffect(() => {
    document.title = 'Network Flight Recorder'
  }, [])
  const tRef = useRef(t)
  tRef.current = t

  useAnimationFrame((dt) => {
    const step = Math.min(dt, 0.1)
    if (tRef.current >= REPLAY_DURATION) {
      // Hold on the completed sequence briefly, then loop
      hold.current += step
      if (hold.current > 2.4) {
        hold.current = 0
        setT(0)
      }
      return
    }
    setT(Math.min(REPLAY_DURATION, tRef.current + step * SPEED))
  }, playing)

  const phase = phaseAt(t)
  const score = scoreAt(t)
  const lastEvent = [...SIGNAL_EVENTS].reverse().find((e) => e.t <= t)
  const fin014 = PROFILES['ws-fin-014']

  return (
    <div className="min-h-full bg-ground text-fg">
      {/* nav */}
      <header className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 md:px-10">
        <Wordmark />
        <nav className="hidden items-center gap-6 text-[13px] text-fg-3 md:flex">
          <a href="#recorder" className="hover:text-fg">Recorder</a>
          <a href="#method" className="hover:text-fg">Method</a>
          <a href="#evidence" className="hover:text-fg">Explainability</a>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <DemoTag className="hidden sm:inline-flex" />
          <Link to="/app" className="hidden text-[13px] text-fg-2 hover:text-fg sm:inline">
            Open workspace
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-10 pt-10 md:px-10 lg:grid-cols-12 lg:pt-16">
        <div className="lg:col-span-8">
          <div className="label mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-fg-4" />
            Behavioral network forensics
          </div>
          <h1 className="max-w-[17ch] font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-fg sm:text-[60px] xl:text-[72px]">
            See the attack before it becomes <em className="text-fg-2">the incident.</em>
          </h1>
          <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-fg-2">
            Network Flight Recorder reconstructs behavioral changes across network activity to help security teams understand how suspicious activity develops.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/app/recorder" className="inline-flex h-11 items-center gap-3 bg-ivory px-5 text-[14px] font-medium text-ink transition-colors hover:bg-paper">
              Open Flight Recorder <ArrowRight size={16} />
            </Link>
            <Link to="/app/detection" className="inline-flex h-11 items-center gap-3 border border-line-strong px-5 text-[14px] text-fg-2 transition-colors hover:border-fg-4 hover:text-fg">
              Explore Detection
            </Link>
          </div>
        </div>

        <aside className="self-end lg:col-span-4">
          <div className="border-t border-fg-4 pt-3">
            <div className="label mb-1 flex items-center justify-between">
              <span className="!text-fg-2">System status</span>
              <span className="text-fg-4">{SYSTEM_STATUS.sensor}</span>
            </div>
            <StatusRow label="Network monitoring" value="ACTIVE" tone="ok" />
            <StatusRow label="Behavior model" value="STABLE" />
            <StatusRow label="Last detection" value={fmtTime(SYSTEM_STATUS.lastDetection)} />
            <StatusRow label="Telemetry coverage" value={`${(SYSTEM_STATUS.coverage * 100).toFixed(1)}%`}>
              <Meter value={SYSTEM_STATUS.coverage} className="!w-14" tone="ok" height={3} />
            </StatusRow>
            <p className="mt-3 text-[11px] leading-snug text-fg-4">Status reflects the bundled demo environment. No live network is being monitored.</p>
          </div>
        </aside>
      </section>

      {/* recorder visualization */}
      <section id="recorder" className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="border border-line bg-panel">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2.5">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex h-7 w-7 items-center justify-center border border-line-strong text-fg-2 hover:bg-hover hover:text-fg"
              aria-label={playing ? 'Pause replay' : 'Play replay'}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span className="mono text-[11px] text-fg-2">
              REPLAY <span className="text-fg-4">·</span> INC-2047 <span className="text-fg-4">·</span> 2026-09-30 {fmtOffset(REPLAY_BASE, 0)} — {fmtOffset(REPLAY_BASE, REPLAY_DURATION)} UTC
            </span>
            <span className="ml-auto flex items-center gap-5">
              <span className="mono text-[11px]">
                <span className="text-fg-4">PHASE </span>
                <span className={phase.tone === 'crit' ? 'text-crit' : phase.tone === 'amber' ? 'text-amber' : 'text-ok'}>{phase.label.toUpperCase()}</span>
              </span>
              <span className="mono text-[11px]">
                <span className="text-fg-4">SCORE </span>
                <span className="tabular text-fg">{String(Math.round(score)).padStart(2, '0')}</span>
              </span>
              <DemoTag>SIMULATED</DemoTag>
            </span>
          </div>
          <div className="px-1 pt-3 sm:px-3">
            <RecorderStrip
              t={t}
              onScrub={(v) => {
                setPlaying(false)
                setT(v)
              }}
            />
          </div>
          <div className="grid border-t border-line md:grid-cols-[1fr_1.3fr]">
            <div className="border-b border-line px-4 py-3 md:border-b-0 md:border-r">
              <div className="label mb-1">Latest signal</div>
              {lastEvent ? (
                <div className="flex items-baseline gap-3">
                  <span className="mono text-[11.5px] text-fg-3">{fmtTime(lastEvent.ts)}</span>
                  <span className="truncate text-[13px] text-fg">{lastEvent.title}</span>
                  <SeverityTag level={lastEvent.severity} className="ml-auto shrink-0" />
                </div>
              ) : (
                <div className="text-[13px] text-fg-3">No deviation — traffic within baseline.</div>
              )}
            </div>
            <div className="px-4 py-3">
              <div className="label mb-1">What changed</div>
              <p className="text-[13px] leading-snug text-fg-2">{phase.summary}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-fg-4">
          Each lane is one entity; each tick one observed flow. Drag across the strip to scrub. Ticks turn amber where behavior leaves its baseline and red once correlated evidence points to compromise.
        </p>
      </section>

      {/* method */}
      <section id="method" className="mx-auto max-w-[1440px] px-5 pt-24 md:px-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="label mb-4">Method</div>
            <h2 className="max-w-[18ch] font-serif text-[34px] leading-[1.08] tracking-[-0.01em]">From a quiet baseline to an explained sequence.</h2>
          </div>
          <p className="self-end text-[15px] leading-relaxed text-fg-2 lg:col-span-6 lg:col-start-7">
            Signature tools ask whether traffic looks like something already known to be bad. The flight recorder asks a different question: is this entity behaving the way it normally does — and if not, what happened, in what order?
          </p>
        </div>
        <ol className="mt-12 grid gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
          {METHOD.map(([title, body], i) => (
            <li key={title} className="bg-ground py-5 pr-5 sm:pl-5 sm:[&:nth-child(odd)]:pl-0 lg:[&:nth-child(odd)]:pl-5 lg:first:!pl-0">
              <div className="mono flex items-center gap-2 text-[11px]">
                <span className="text-fg-4">{String(i + 1).padStart(2, '0')}</span>
                <span className={`h-px flex-1 ${i === 0 ? 'bg-ok/60' : i < 3 ? 'bg-amber/60' : 'bg-crit/60'}`} />
              </div>
              <h3 className="mt-4 text-[14.5px] font-medium text-fg">{title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-fg-3">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* evidence */}
      <section id="evidence" className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 md:px-10">
        <div className="label mb-4">What the analyst receives</div>
        <h2 className="max-w-[24ch] font-serif text-[34px] leading-[1.08] tracking-[-0.01em]">Evidence, not a verdict.</h2>

        <div className="mt-12 grid gap-px border border-line bg-line lg:grid-cols-3">
          <div className="bg-ground p-6">
            <div className="label mb-4 !text-fg-2">Why was this flagged?</div>
            <DetectionPanel factors={factorsAt(REPLAY_DURATION)} compact showEvidence={false} />
          </div>
          <div className="bg-ground p-6">
            <div className="label mb-4 !text-fg-2">Reconstructed sequence</div>
            <ol className="divide-y divide-line">
              {SIGNAL_EVENTS.filter((e) => e.severity !== 'info')
                .slice(0, 7)
                .map((e) => (
                  <li key={e.id} className="grid grid-cols-[4.2rem_1fr] gap-3 py-2">
                    <span className="mono text-[11px] text-fg-3">{fmtTime(e.ts)}</span>
                    <span className="text-[12.5px] text-fg">{e.title}</span>
                  </li>
                ))}
            </ol>
            <div className="mono mt-3 flex flex-wrap gap-x-3 text-[10.5px] text-fg-4">
              {PHASES.map((p, i) => (
                <span key={p.id}>
                  {p.label.toUpperCase()}
                  {i < PHASES.length - 1 && <span className="ml-3">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-ground p-6">
            <div className="label mb-4 !text-fg-2">Behavioral fingerprint · timing</div>
            <IntervalHistogram data={fin014.regularity} flagged height={140} />
            <p className="mt-4 text-[12.5px] leading-relaxed text-fg-3">
              Outline: the host’s usual spread of gaps between connections. Solid: the day in question — almost every connection lands 4 seconds after the last. People are irregular; software check-ins are not.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <Link to="/app" className="inline-flex h-10 items-center gap-3 bg-ivory px-5 text-[13.5px] font-medium text-ink hover:bg-paper">
            Open the workspace <ArrowRight size={15} />
          </Link>
          <Link to="/app/investigation" className="text-[13.5px] text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg">
            Walk through INC-2047
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-2 px-5 py-6 text-[11.5px] text-fg-4 md:px-10">
          <span className="mono">NETWORK FLIGHT RECORDER · PROTOTYPE</span>
          <span>All telemetry shown is simulated. Addresses use reserved documentation ranges (RFC 5737) and the .example domain.</span>
          <span className="ml-auto">No live threat detection is performed by this frontend.</span>
        </div>
      </footer>
    </div>
  )
}
