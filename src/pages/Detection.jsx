import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { BandChart } from '../components/BehaviorChart'
import { IntervalDotStrip, FirstSeenStrip, PersistenceGrid, ConfidenceWaterfall } from '../components/charts/Evidence'
import { SectionHeader, DemoTag, Field } from '../components/ui/Primitives'
import { SeverityTag } from '../components/ui/Severity'
import { useResource } from '../api/useResource'
import { useHotkeys } from '../lib/hooks'
import { fmtDateTime, fmtTime } from '../lib/format'
import { PROFILES } from '../data/behavior'
import { incidentHref } from '../lib/links'

function Evidence({ kind, det }) {
  switch (kind) {
    case 'intervals':
      return <IntervalDotStrip baseline={det.data.baseIntervals} current={det.data.curIntervals} />
    case 'firstseen':
      return <FirstSeenStrip contacts={det.data.contacts30d} />
    case 'frequency':
      return <BandChart data={PROFILES['ws-fin-014'].frequency} start="09:00" flagged height={110} unit="conn" />
    case 'persistence':
      return <PersistenceGrid checks={det.data.persistence} />
    default:
      return null
  }
}

function ReasoningStep({ step, index, det, open, onToggle }) {
  return (
    <li className="border-b border-line">
      <button onClick={onToggle} className="grid w-full grid-cols-[2.6rem_1fr_auto] items-start gap-x-4 py-4 text-left hover:bg-panel/50" aria-expanded={open}>
        <span className="mono text-[22px] leading-none text-fg-4">{index + 1}</span>
        <span className="min-w-0">
          <span className="block text-[15px] text-fg">{step.title}</span>
          <span className="mt-1 block text-[12.5px] leading-snug text-fg-3">{step.statement}</span>
        </span>
        <span className="flex items-center gap-4">
          <span className="hidden text-right sm:block">
            <span className="label block">Weight</span>
            <span className="mono text-[12px] text-fg-2">{Math.round(step.weight * 100)}%</span>
          </span>
          <ChevronDown size={14} className={`text-fg-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="nfr-enter grid gap-6 pb-6 pl-[3.6rem] pr-2 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <dl className="self-start">
            <div className="border-b border-line py-2">
              <dt className="label">Observed</dt>
              <dd className="mono mt-1 text-[12px] text-fg">{step.observed}</dd>
            </div>
            <div className="border-b border-line py-2">
              <dt className="label">Baseline</dt>
              <dd className="mono mt-1 text-[12px] text-fg-2">{step.baseline}</dd>
            </div>
            <div className="py-2">
              <dt className="label">Deviation</dt>
              <dd className={`mono mt-1 text-[12px] ${step.deviation.endsWith('σ') ? 'text-amber' : 'text-crit'}`}>{step.deviation}</dd>
            </div>
          </dl>
          <div className="min-w-0 border-l border-line pl-5">
            <div className="label mb-3">Evidence</div>
            <Evidence kind={step.evidence} det={det} />
          </div>
        </div>
      )}
    </li>
  )
}

export default function Detection() {
  const { data: detections } = useResource('detections')
  const [params, setParams] = useSearchParams()
  const selectedId = detections.some((d) => d.id === params.get('id')) ? params.get('id') : 'DET-7731'
  const setSelectedId = (id) => setParams({ id }, { replace: true })
  const det = detections.find((d) => d.id === selectedId)
  const [open, setOpen] = useState(() => new Set(['r1', 'r2', 'r3', 'r4']))
  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const idx = detections.findIndex((d) => d.id === selectedId)
  useHotkeys(
    {
      j: () => setSelectedId(detections[Math.min(detections.length - 1, idx + 1)].id),
      k: () => setSelectedId(detections[Math.max(0, idx - 1)].id),
    },
    [idx],
  )

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* detection list */}
      <aside className="border-b border-line lg:border-b-0 lg:border-r">
        <div className="border-b border-line px-5 py-3">
          <div className="label">07 · Detections</div>
        </div>
        <ul className="flex overflow-x-auto lg:block">
          {detections.map((d) => {
            const sel = d.id === selectedId
            return (
              <li key={d.id} className="min-w-[220px] border-r border-line lg:min-w-0 lg:border-b lg:border-r-0">
                <button onClick={() => setSelectedId(d.id)} className={`relative block w-full px-5 py-3 text-left ${sel ? 'bg-panel' : 'hover:bg-panel/60'}`}>
                  {sel && <span className="absolute inset-y-0 left-0 w-[2px] bg-ivory" />}
                  <span className="mono flex items-center justify-between text-[10.5px] text-fg-3">
                    {d.id}
                    <SeverityTag level={d.severity} />
                  </span>
                  <span className={`mt-1 block text-[12.5px] ${sel ? 'text-fg' : 'text-fg-2'}`}>{d.name}</span>
                  <span className="mono mt-1 block text-[10px] text-fg-4">
                    {d.entity} · {Math.round(d.confidence * 100)}%
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div className="min-w-0">
        {/* header */}
        <header className="border-b border-line px-6 pb-6 pt-5 md:px-8">
          <div className="flex items-center gap-3">
            <span className="label">Detection</span>
            <span className="mono text-[11px] text-fg-3">{det.id}</span>
            <span className="ml-auto">
              <DemoTag />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-12 gap-y-5">
            <div className="min-w-0 max-w-3xl">
              <h1 className="text-[28px] font-medium leading-[1.1] tracking-[-0.02em]">{det.name}</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-fg-2">{det.summary}</p>
            </div>
            <div className="ml-auto flex items-end gap-8">
              <div>
                <div className="label">Severity</div>
                <div className="mt-2">
                  <SeverityTag level={det.severity} long className="!text-[12px]" />
                </div>
              </div>
              <div>
                <div className="label">Confidence</div>
                <div className="mono tabular mt-1 text-[34px] leading-none text-fg">
                  {Math.round(det.confidence * 100)}
                  <span className="text-[15px] text-fg-3">%</span>
                </div>
              </div>
            </div>
          </div>
          <dl className="mt-5 grid gap-x-10 md:grid-cols-2 2xl:grid-cols-3">
            <Field label="Entity">{det.entity}</Field>
            <Field label="Target">{det.target}</Field>
            <Field label="Status">{det.status}</Field>
            <Field label="First seen">{fmtDateTime(det.firstSeen)}</Field>
            <Field label="Last seen">{fmtDateTime(det.lastSeen)}</Field>
            <Field label="Incident">
              {incidentHref(det.incident).startsWith('/app/investigation') ? (
                <Link to={incidentHref(det.incident)} className="underline decoration-line-strong underline-offset-2 hover:decoration-fg-2">
                  {det.incident}
                </Link>
              ) : (
                <span>
                  {det.incident} <span className="text-fg-4">· closed</span>
                </span>
              )}
            </Field>
            <Field label="Model">
              <span className="text-fg-3">{det.model}</span>
            </Field>
          </dl>
        </header>

        {det.reasoning ? (
          <div className="grid 2xl:grid-cols-[minmax(0,1fr)_400px]">
            <section className="px-6 py-6 md:px-8 2xl:border-r 2xl:border-line">
              <SectionHeader label="Detection reasoning" meta="each step is independently checkable">
                <button onClick={() => setOpen(open.size ? new Set() : new Set(det.reasoning.map((r) => r.id)))} className="mono text-[10.5px] text-fg-3 hover:text-fg">
                  {open.size ? 'COLLAPSE ALL' : 'EXPAND ALL'}
                </button>
              </SectionHeader>
              <ol>
                {det.reasoning.map((step, i) => (
                  <ReasoningStep key={step.id} step={step} index={i} det={det} open={open.has(step.id)} onToggle={() => toggle(step.id)} />
                ))}
              </ol>
            </section>

            <aside className="border-t border-line px-6 py-6 md:px-8 2xl:border-t-0">
              <SectionHeader label="Confidence composition" />
              <div className="pt-4">
                <ConfidenceWaterfall parts={det.confidenceParts} />
              </div>

              <div className="mt-8">
                <SectionHeader label="Counter-evidence checked" meta="what would lower confidence" />
                <ul className="divide-y divide-line">
                  {det.counterEvidence.map((c) => (
                    <li key={c.check} className="grid grid-cols-[1fr_auto] gap-x-4 py-2.5">
                      <span className="text-[12.5px] text-fg-2">{c.check}</span>
                      <span className={`mono text-right text-[10.5px] ${c.result === 'Observed' ? 'text-amber' : 'text-fg-3'}`}>
                        {c.result.toUpperCase()}
                        <span className="block text-fg-4">{c.effect === 'none' ? 'no effect' : c.effect}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <SectionHeader label="Weight of each reasoning step" />
                <div className="mt-3 flex h-[10px]">
                  {det.reasoning.map((r, i) => (
                    <div key={r.id} className="border-r border-ground last:border-0" style={{ flexGrow: r.weight, background: ['var(--color-fg)', 'var(--color-fg-2)', 'var(--color-fg-3)', 'var(--color-fg-4)'][i] }} title={`${r.title} · ${Math.round(r.weight * 100)}%`} />
                  ))}
                </div>
                <ol className="mono mt-2 space-y-1 text-[10.5px] text-fg-3">
                  {det.reasoning.map((r, i) => (
                    <li key={r.id} className="flex justify-between gap-3">
                      <span className="truncate">
                        {i + 1}. {r.title}
                      </span>
                      <span className="text-fg-2">{Math.round(r.weight * 100)}%</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="mt-8 border-l border-line-strong pl-3 text-[11.5px] leading-relaxed text-fg-4">
                Weights, confidence and evidence are scripted demo values. They show how the interface presents an explainable detection; no model has evaluated real traffic.
              </p>
            </aside>
          </div>
        ) : (
          <section className="px-6 py-8 md:px-8">
            <SectionHeader label="Detection reasoning" />
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-fg-3">
              Step-by-step evidence for {det.id} is not included in this demo dataset. Last update at {fmtTime(det.lastSeen)} UTC. Open{' '}
              <button onClick={() => setSelectedId('DET-7731')} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
                DET-7731
              </button>{' '}
              for a fully explained detection.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
