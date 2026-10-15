import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BehaviorChart, { DeviationScale } from '../components/BehaviorChart'
import { PageHeader, SectionHeader, Segmented, DemoTag } from '../components/ui/Primitives'
import { RiskState } from '../components/ui/Severity'
import { useResource } from '../api/useResource'
import { useHotkeys } from '../lib/hooks'
import { fmtSigma } from '../lib/format'
import { ENTITY_BY_ID } from '../data/entities'
import { DIMENSIONS, PROFILED_ENTITIES, DEVIATION_THRESHOLD } from '../data/behavior'

function zTone(z) {
  const a = Math.abs(z)
  if (a >= 5) return { bg: 'color-mix(in oklab, var(--color-crit) 78%, var(--color-ground))', fg: 'var(--color-paper)', text: 'text-crit' }
  if (a >= DEVIATION_THRESHOLD) return { bg: 'color-mix(in oklab, var(--color-amber) 30%, var(--color-ground))', fg: 'var(--color-amber)', text: 'text-amber' }
  // quiet stone ramp for in-band values
  const o = 0.04 + Math.min(1, a / DEVIATION_THRESHOLD) * 0.14
  return { bg: `color-mix(in oklab, var(--color-fg) ${o * 100}%, transparent)`, fg: 'var(--color-fg-3)', text: 'text-fg-3' }
}

/* ------------------------------------------------------------------ */
/* Entity × dimension deviation matrix                                 */
/* ------------------------------------------------------------------ */
function DeviationMatrix({ profiles, selected, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th className="label w-[13rem] py-2 pl-6 text-left font-normal">Entity</th>
            {DIMENSIONS.map((d) => (
              <th key={d.id} className="label px-1 py-2 text-left font-normal">
                {d.label}
              </th>
            ))}
            <th className="label py-2 pr-6 text-right font-normal">Max</th>
          </tr>
        </thead>
        <tbody>
          {PROFILED_ENTITIES.map((id) => {
            const p = profiles[id]
            const e = ENTITY_BY_ID[id]
            const max = Math.max(...Object.values(p.z))
            const sel = id === selected
            return (
              <tr key={id} onClick={() => onSelect(id)} className={`cursor-pointer border-t border-line ${sel ? 'bg-hover' : 'hover:bg-raised'}`}>
                <td className="relative py-1.5 pl-6 pr-3">
                  {sel && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
                  <span className="mono block text-[12px] text-fg">{e.name}</span>
                  <span className="mono block text-[10px] text-fg-4">{e.address}</span>
                </td>
                {DIMENSIONS.map((d) => {
                  const z = p.z[d.id]
                  const t = zTone(z)
                  return (
                    <td key={d.id} className="px-[2px] py-1.5">
                      <div className="mono flex h-7 items-center px-2 text-[10.5px] tabular-nums" style={{ background: t.bg, color: t.fg }} title={`${d.label}: ${fmtSigma(z)}`}>
                        {Math.abs(z) >= DEVIATION_THRESHOLD ? fmtSigma(z) : z.toFixed(1)}
                      </div>
                    </td>
                  )
                })}
                <td className={`mono py-1.5 pr-6 text-right text-[11px] ${zTone(max).text}`}>{fmtSigma(max)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One fingerprint dimension                                           */
/* ------------------------------------------------------------------ */
function DimensionPanel({ dim, profile }) {
  const z = profile.z[dim.id]
  const flagged = Math.abs(z) >= DEVIATION_THRESHOLD
  return (
    <section className="border-b border-r border-line px-5 pb-5 pt-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className={`text-[13px] ${flagged ? 'text-fg' : 'text-fg-2'}`}>{dim.label}</h3>
          <div className="mono text-[10px] text-fg-4">{dim.unit}</div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <span className={`mono text-[11.5px] ${zTone(z).text}`}>{fmtSigma(z)}</span>
          <DeviationScale z={z} width={84} />
        </div>
      </div>
      <div className={`mt-4 ${flagged ? '' : 'opacity-70'}`}>
        <BehaviorChart dimension={dim} profile={profile} flagged={flagged} height={118} />
      </div>
      <p className={`mt-3 text-[12px] leading-snug ${flagged ? 'text-fg-2' : 'text-fg-4'}`}>{profile.notes[dim.id]}</p>
    </section>
  )
}

export default function Behavior() {
  const [params, setParams] = useSearchParams()
  const { data: profiles } = useResource('behavior')
  const initial = PROFILED_ENTITIES.includes(params.get('id')) ? params.get('id') : 'ws-fin-014'
  const [selected, setSelectedState] = useState(initial)
  const [mode, setMode] = useState('all')
  const setSelected = (id) => {
    setSelectedState(id)
    setParams({ id }, { replace: true })
  }

  const idx = PROFILED_ENTITIES.indexOf(selected)
  useHotkeys(
    {
      j: () => setSelected(PROFILED_ENTITIES[Math.min(PROFILED_ENTITIES.length - 1, idx + 1)]),
      k: () => setSelected(PROFILED_ENTITIES[Math.max(0, idx - 1)]),
    },
    [idx],
  )

  const profile = profiles[selected]
  const entity = ENTITY_BY_ID[selected]
  const flaggedDims = useMemo(() => DIMENSIONS.filter((d) => Math.abs(profile.z[d.id]) >= DEVIATION_THRESHOLD), [profile])
  const shown = mode === 'all' ? DIMENSIONS : flaggedDims
  const quiet = DIMENSIONS.filter((d) => !shown.includes(d))

  return (
    <div className="min-h-full">
      <PageHeader kicker="04 · Behavioral analysis" title="Behavioral baselines" subtitle="Each entity’s current behavior measured against its own 7-day envelope for the same time of day. Only departures beyond 2.5σ are highlighted.">
        <DemoTag />
      </PageHeader>

      <section className="border-b border-line pb-3 pt-4">
        <SectionHeader label="Deviation matrix" meta={`σ from baseline · ${PROFILED_ENTITIES.length} profiled hosts · j / k to move`} className="mx-6 mb-1" rule={false}>
          <span className="mono hidden items-center gap-3 text-[10px] text-fg-4 md:flex">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 bg-fg/10" /> within band
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 bg-amber/40" /> ≥ 2.5σ
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 bg-crit" /> ≥ 5σ
            </span>
          </span>
        </SectionHeader>
        <DeviationMatrix profiles={profiles} selected={selected} onSelect={setSelected} />
      </section>

      {/* fingerprint header */}
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line px-6 py-5">
        <div>
          <div className="label mb-1">Behavioral fingerprint</div>
          <div className="flex items-baseline gap-3">
            <span className="mono text-[18px] text-fg">{entity.name}</span>
            <span className="mono text-[12px] text-fg-3">{entity.address}</span>
            <RiskState risk={entity.risk} />
          </div>
          <div className="mt-0.5 text-[12.5px] text-fg-3">{entity.role}</div>
        </div>
        <dl className="mono grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11px]">
          <dt className="flex items-center gap-2 text-fg-4">
            <span className="h-2.5 w-4 border border-fg-4/70 bg-fg/[0.07]" /> BASELINE
          </dt>
          <dd className="text-fg-2">{profile.window.baseline}</dd>
          <dt className="flex items-center gap-2 text-fg-4">
            <span className="h-px w-4 bg-fg-2" /> CURRENT
          </dt>
          <dd className="text-fg">{profile.window.current}</dd>
        </dl>
        <div className="ml-auto flex items-center gap-3">
          <span className="mono text-[11px] text-fg-3">
            <span className={flaggedDims.length ? 'text-amber' : 'text-ok'}>{flaggedDims.length}</span> of 6 dimensions deviate
          </span>
          <Segmented
            options={[
              { value: 'all', label: 'ALL' },
              { value: 'dev', label: 'DEVIATIONS' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
      </div>

      {shown.length > 0 ? (
        <div className="grid border-l border-line md:grid-cols-2 2xl:grid-cols-3" key={selected}>
          {shown.map((d) => (
            <DimensionPanel key={d.id} dim={d} profile={profile} />
          ))}
        </div>
      ) : (
        <p className="px-6 py-8 text-[13px] text-ok">All six dimensions are within the baseline envelope for this window.</p>
      )}
      {quiet.length > 0 && (
        <div className="mono flex flex-wrap gap-x-6 gap-y-1 px-6 py-3 text-[11px] text-fg-4">
          <span>Within baseline:</span>
          {quiet.map((d) => (
            <span key={d.id}>
              {d.label} <span className="text-fg-3">{fmtSigma(profile.z[d.id])}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
