import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pause, Play, SkipBack, SkipForward, Rewind } from 'lucide-react'
import RecorderStrip from '../components/RecorderStrip'
import NetworkGraph from '../components/NetworkGraph'
import EventStream from '../components/EventStream'
import DetectionPanel from '../components/DetectionPanel'
import { PageHeader, SectionHeader, Segmented, DemoTag, Kbd } from '../components/ui/Primitives'
import { useAnimationFrame, useHotkeys } from '../lib/hooks'
import { fmtOffset, clamp } from '../lib/format'
import { GRAPH_NODES } from '../data/entities'
import { REPLAY_BASE, REPLAY_DURATION, PHASES, REPLAY_EVENTS, SIGNAL_EVENTS, phaseAt, factorsAt, scoreAt, confidenceAt, graphStateAt } from '../data/replay'

const D = REPLAY_DURATION
const TONE_TEXT = { ok: 'text-ok', amber: 'text-amber', crit: 'text-crit' }
const TONE_BG = { ok: 'bg-ok', amber: 'bg-amber', crit: 'bg-crit' }

/* ------------------------------------------------------------------ */
/* Phase rail — the "flight plan" of the incident                      */
/* ------------------------------------------------------------------ */
function PhaseRail({ t, onJump }) {
  const current = phaseAt(t)
  return (
    <ol className="grid grid-cols-3 border-b border-line md:grid-cols-6">
      {PHASES.map((p, i) => {
        const end = PHASES[i + 1]?.start ?? D
        const state = p.id === current.id ? 'current' : t >= end ? 'past' : 'future'
        const progress = state === 'current' ? (t - p.start) / (end - p.start) : state === 'past' ? 1 : 0
        return (
          <li key={p.id} className="border-b border-r border-line last:border-r-0 md:border-b-0">
            <button onClick={() => onJump(p.start)} className={`group relative block h-full w-full px-4 pb-3 pt-3.5 text-left transition-colors ${state === 'current' ? 'bg-raised' : 'hover:bg-panel'}`}>
              <span className="absolute inset-x-0 top-0 h-[2px] bg-line">
                <span className={`block h-full ${state === 'future' ? '' : TONE_BG[p.tone]}`} style={{ width: `${progress * 100}%`, opacity: state === 'past' ? 0.55 : 1 }} />
              </span>
              <span className="mono flex items-center justify-between text-[10px]">
                <span className="text-fg-4">{String(i + 1).padStart(2, '0')}</span>
                <span className={state === 'future' ? 'text-fg-4' : 'text-fg-3'}>{fmtOffset(REPLAY_BASE, p.start)}</span>
              </span>
              <span className={`mono mt-2 block text-[12px] tracking-[0.1em] ${state === 'future' ? 'text-fg-4' : state === 'current' ? TONE_TEXT[p.tone] : 'text-fg-2'}`}>{p.label.toUpperCase()}</span>
              <span className={`mt-1 hidden text-[11.5px] leading-snug xl:block ${state === 'future' ? 'text-fg-4' : 'text-fg-3'}`}>{p.summary}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Readout({ label, children, className = '' }) {
  return (
    <div className={`border-l border-line px-4 ${className}`}>
      <div className="label">{label}</div>
      <div className="mono tabular mt-1 text-[15px] leading-none text-fg">{children}</div>
    </div>
  )
}

export default function FlightRecorder() {
  const [params] = useSearchParams()
  const initial = clamp(Number(params.get('t') ?? 182), 0, D)
  const [t, setT] = useState(Number.isFinite(initial) ? initial : 182)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(8)
  const [signalsOnly, setSignalsOnly] = useState(false)
  const [selected, setSelected] = useState(null)

  const tRef = useRef(t)
  tRef.current = t
  useAnimationFrame((dt) => {
    // Clamp frame gaps (e.g. after a background tab) so the cursor never leaps
    const next = tRef.current + Math.min(dt, 0.1) * speed
    if (next >= D) {
      setT(D)
      setPlaying(false)
    } else {
      setT(next)
    }
  }, playing)

  const seek = (v) => setT(clamp(v, 0, D))
  const signalTimes = SIGNAL_EVENTS.map((e) => e.t)
  const prevEvent = () => seek([...signalTimes].reverse().find((x) => x < t - 0.5) ?? 0)
  const nextEvent = () => seek(signalTimes.find((x) => x > t + 0.5) ?? D)
  const nextPhase = () => seek(PHASES.find((p) => p.start > t + 0.5)?.start ?? 0)
  const toggle = () => {
    if (t >= D) setT(0)
    setPlaying((p) => !p)
  }

  useHotkeys({
    ' ': toggle,
    ArrowLeft: () => {
      setPlaying(false)
      seek(t - 1)
    },
    ArrowRight: () => {
      setPlaying(false)
      seek(t + 1)
    },
    'shift+ArrowLeft': () => {
      setPlaying(false)
      prevEvent()
    },
    'shift+ArrowRight': () => {
      setPlaying(false)
      nextEvent()
    },
    Home: () => seek(0),
    End: () => seek(D),
    p: nextPhase,
    Escape: () => setSelected(null),
  })

  const phase = phaseAt(t)
  const factors = factorsAt(t)
  const score = scoreAt(t)
  const confidence = confidenceAt(t)
  const graph = useMemo(() => graphStateAt(Math.floor(t)), [Math.floor(t)]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleEvents = useMemo(() => {
    const upTo = REPLAY_EVENTS.filter((e) => e.t <= t)
    return (signalsOnly ? upTo.filter((e) => e.signal) : upTo).slice().reverse()
  }, [t, signalsOnly])
  const activeId = visibleEvents.find((e) => e.signal)?.id

  return (
    <div className="min-h-full">
      <PageHeader kicker="02 · Flight Recorder" title="Flight Recorder" subtitle="Replay the behavioral sequence surrounding a security event.">
        <div className="mono hidden items-center gap-2 border border-line px-3 py-1.5 text-[11px] text-fg-2 sm:flex">
          <span className="text-fg-4">RECORDING</span> INC-2047 <span className="text-fg-4">·</span> ws-fin-014 <span className="text-fg-4">·</span> 2026-09-30
        </div>
        <DemoTag />
      </PageHeader>

      <PhaseRail t={t} onJump={(v) => { setPlaying(false); seek(v) }} />

      {/* transport */}
      <div className="flex flex-wrap items-center gap-y-3 border-b border-line py-3 pl-6">
        <div className="flex items-center gap-1 pr-4">
          <button onClick={() => seek(0)} className="flex h-8 w-8 items-center justify-center text-fg-3 hover:bg-hover hover:text-fg" aria-label="Rewind to start (Home)" title="Rewind (Home)">
            <Rewind size={14} />
          </button>
          <button onClick={() => { setPlaying(false); prevEvent() }} className="flex h-8 w-8 items-center justify-center text-fg-3 hover:bg-hover hover:text-fg" aria-label="Previous event" title="Previous event (Shift+←)">
            <SkipBack size={14} />
          </button>
          <button onClick={toggle} className="flex h-9 w-9 items-center justify-center bg-ivory text-ink hover:bg-paper" aria-label={playing ? 'Pause' : 'Play'} title="Play / pause (Space)">
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button onClick={() => { setPlaying(false); nextEvent() }} className="flex h-8 w-8 items-center justify-center text-fg-3 hover:bg-hover hover:text-fg" aria-label="Next event" title="Next event (Shift+→)">
            <SkipForward size={14} />
          </button>
          <Segmented
            className="ml-3"
            options={[1, 4, 8, 16].map((v) => ({ value: v, label: `${v}×` }))}
            value={speed}
            onChange={setSpeed}
          />
        </div>
        <div className="flex flex-wrap items-center gap-y-3">
          <Readout label="Replay time">
            {fmtOffset(REPLAY_BASE, t)}
            <span className="ml-2 text-[10.5px] text-fg-4">T+{Math.round(t)}s</span>
          </Readout>
          <Readout label="Phase">
            <span className={TONE_TEXT[phase.tone]}>{phase.label.toUpperCase()}</span>
          </Readout>
          <Readout label="Deviation score">
            <span className={score >= 70 ? 'text-crit' : score >= 30 ? 'text-amber' : ''}>{Math.round(score)}</span>
            <span className="text-[11px] text-fg-4"> / 100</span>
          </Readout>
          <Readout label="Correlation confidence">{confidence > 0 ? `${Math.round(confidence * 100)}%` : <span className="text-fg-4">—</span>}</Readout>
        </div>
        <div className="ml-auto hidden items-center gap-1.5 pr-6 text-[10.5px] text-fg-4 2xl:flex">
          <Kbd>Space</Kbd> play <Kbd>←</Kbd>
          <Kbd>→</Kbd> 1 s <Kbd>⇧</Kbd>+arrows event <Kbd>P</Kbd> phase
        </div>
      </div>

      {/* strip */}
      <section className="border-b border-line px-3 pb-2 pt-4 sm:px-4">
        <RecorderStrip
          t={t}
          onScrub={(v) => {
            setPlaying(false)
            seek(v)
          }}
        />
      </section>

      {/* synchronized panels */}
      <div className="grid lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
        <section className="relative min-h-[380px] border-b border-line lg:border-r">
          <div className="absolute left-5 top-3 z-10">
            <SectionHeader label="Entity relationships" meta={`@ ${fmtOffset(REPLAY_BASE, t)}`} rule={false} />
          </div>
          <div className="h-[400px] 2xl:h-[560px]">
            <NetworkGraph nodes={GRAPH_NODES} flows={graph.flows} nodeRisk={graph.nodeRisk} hidden={graph.hidden} selectedId={selected} onSelect={setSelected} showLegend={false} />
          </div>
        </section>

        <section className="flex max-h-[520px] flex-col border-b border-line 2xl:h-[560px] 2xl:max-h-[560px] 2xl:border-r">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <span className="label !text-fg-2">Recorded events</span>
            <span className="mono text-[10.5px] text-fg-4">{visibleEvents.length} up to cursor</span>
            <Segmented
              className="ml-auto"
              options={[
                { value: false, label: 'ALL' },
                { value: true, label: 'SIGNALS' },
              ]}
              value={signalsOnly}
              onChange={setSignalsOnly}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EventStream
              events={visibleEvents}
              activeId={activeId}
              showDetail
              onSelect={(e) => {
                setPlaying(false)
                seek(e.t)
              }}
              emptyText="Cursor is before the first recorded event."
            />
          </div>
        </section>

        <section className="border-b border-line px-6 py-4 lg:col-span-2 2xl:col-span-1">
          <SectionHeader label="Explanation" meta={`phase ${PHASES.indexOf(phase) + 1} of ${PHASES.length}`} />
          <div key={phase.id} className="nfr-enter pt-3">
            <div className={`mono text-[12px] tracking-[0.1em] ${TONE_TEXT[phase.tone]}`}>{phase.label.toUpperCase()}</div>
            <p className="mt-1.5 text-[14px] leading-snug text-fg">{phase.summary}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fg-3">{phase.detail}</p>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <DetectionPanel factors={factors} compact />
          </div>
        </section>
      </div>
    </div>
  )
}
