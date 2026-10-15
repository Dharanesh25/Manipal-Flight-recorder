import { Printer } from 'lucide-react'
import { useResource } from '../api/useResource'
import { fmtTime, fmtDateTime, fmtSigma } from '../lib/format'
import { ENTITY_BY_ID } from '../data/entities'
import { SIGNAL_EVENTS, SCORE_SERIES, factorsAt, REPLAY_DURATION, PHASES } from '../data/replay'
import { DIMENSIONS, PROFILES } from '../data/behavior'
import { SUPPORTING } from '../data/incidents'
import { DemoTag } from '../components/ui/Primitives'

/* Paper-specific building blocks (ink on ivory) */
function Section({ n, title, children }) {
  return (
    <section className="print-avoid-break mt-10">
      <h2 className="flex items-baseline gap-3 border-b border-ink pb-1.5">
        <span className="mono text-[11px] text-ink-2">{String(n).padStart(2, '0')}</span>
        <span className="font-serif text-[21px] leading-tight text-ink">{title}</span>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Table({ head, rows, className = '' }) {
  return (
    <table className={`w-full border-collapse text-[11.5px] ${className}`}>
      <thead>
        <tr className="border-b border-ink/40">
          {head.map((h) => (
            <th key={h} className="mono py-1.5 pr-3 text-left text-[9.5px] font-medium uppercase tracking-[0.08em] text-ink-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-ink/15 align-top">
            {r.map((c, j) => (
              <td key={j} className="py-1.5 pr-3 text-ink">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const SEV_INK = { info: 'text-ink-2', low: 'text-ink-2', medium: 'text-[#8a5a12]', high: 'text-[#8a5a12]', critical: 'text-[#9b2f1d]' }

function ScoreTrace() {
  const W = 640
  const H = 70
  const pts = SCORE_SERIES.map((v, t) => `${t ? 'L' : 'M'}${((t / REPLAY_DURATION) * W).toFixed(1)},${(H - (v / 100) * H).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" role="img" aria-label="Deviation score over the incident window">
      <line x1="0" x2={W} y1={H - 0.7 * H} y2={H - 0.7 * H} stroke="#9b2f1d" strokeDasharray="3 3" strokeWidth="0.8" />
      <line x1="0" x2={W} y1={H} y2={H} stroke="#1f1c18" strokeWidth="0.6" />
      {PHASES.slice(1).map((p) => (
        <g key={p.id}>
          <line x1={(p.start / REPLAY_DURATION) * W} x2={(p.start / REPLAY_DURATION) * W} y1="0" y2={H} stroke="#1f1c18" strokeOpacity="0.25" strokeDasharray="2 2" />
          <text x={(p.start / REPLAY_DURATION) * W + 3} y={H + 11} fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill="#5a544a">
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
      <path d={pts} fill="none" stroke="#1f1c18" strokeWidth="1.2" />
    </svg>
  )
}

export default function Report() {
  const { data: incidents } = useResource('incidents')
  const { data: detections } = useResource('detections')
  const inc = incidents.find((i) => i.id === 'INC-2047')
  const det = detections.find((d) => d.id === 'DET-7731')
  const profile = PROFILES['ws-fin-014']
  const factors = factorsAt(REPLAY_DURATION)
  const total = Math.round(factors.reduce((a, f) => a + f.value, 0))

  return (
    <div className="print-root min-h-full bg-ground px-4 py-6 md:px-8">
      {/* toolbar */}
      <div className="no-print mx-auto mb-6 flex max-w-[860px] flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <div className="label mb-1">08 · Investigation reports</div>
          <div className="text-[15px] text-fg">
            INC-2047 <span className="text-fg-3">· draft v0.3 · generated from the investigation workspace</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <DemoTag />
          <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 bg-ivory px-4 text-[13px] font-medium text-ink hover:bg-paper" title="Opens the print dialog — choose ‘Save as PDF’">
            <Printer size={14} /> Export Investigation Report
          </button>
        </div>
      </div>

      {/* sheet */}
      <article className="print-sheet mx-auto max-w-[860px] bg-paper px-8 py-10 text-ink shadow-[0_1px_0_rgba(0,0,0,0.4)] md:px-14 md:py-14">
        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mono text-[10.5px] tracking-[0.2em] text-ink">NETWORK FLIGHT RECORDER</div>
              <div className="mono mt-1 text-[10.5px] tracking-[0.2em] text-ink-2">INVESTIGATION REPORT</div>
            </div>
            <div className="mono border border-ink px-2 py-1 text-right text-[9.5px] leading-tight tracking-[0.12em]">
              TLP:AMBER
              <br />
              INTERNAL
            </div>
          </div>
          <h1 className="mt-10 font-serif text-[46px] leading-none tracking-[-0.01em]">{inc.id}</h1>
          <p className="mt-2 font-serif text-[20px] italic text-ink-2">{inc.title}</p>

          <dl className="mono mt-8 grid grid-cols-2 gap-x-8 border-y border-ink py-3 text-[10.5px] md:grid-cols-4">
            {[
              ['Severity', inc.severity.toUpperCase()],
              ['Status', inc.status],
              ['Deviation', `${inc.deviation} / 100`],
              ['Confidence', `${Math.round(inc.confidence * 100)}%`],
              ['First observed', fmtDateTime(inc.firstObserved)],
              ['Last observed', fmtDateTime(inc.lastObserved)],
              ['Prepared by', 'analyst-03'],
              ['Report date', '2026-10-01'],
            ].map(([k, v]) => (
              <div key={k} className="py-1">
                <dt className="text-[9px] uppercase tracking-[0.1em] text-ink-2">{k}</dt>
                <dd className="mt-0.5 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10.5px] italic text-ink-2">
            Prepared from simulated demonstration telemetry. Hosts, addresses and domains are fictional (RFC 5737 / .example). Scores are illustrative, not the output of a trained detector.
          </p>
        </header>

        <Section n={1} title="Executive summary">
          <p className="text-[13px] leading-relaxed">
            On 2026-09-30 between 10:42 and 10:59 UTC, finance workstation <span className="mono">ws-fin-014</span> (10.24.18.42) departed from its seven-day behavioral baseline. It began contacting a destination never previously seen in the environment, <span className="mono">cdn-sync.example</span> (203.0.113.77), on 8443/tcp at a fixed four-second interval. Two minutes later it read 412 MB from the finance share on <span className="mono">srv-files-02</span> and sent 38 MB to the same external address.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed">
            The combination — novel destination, non-standard port, machine-regular timing, and an internal read followed by outbound volume — is consistent with automated command-and-control and possible data staging. The host was network-isolated at 14:20 UTC. Root cause and data exposure are not yet confirmed.
          </p>
        </Section>

        <Section n={2} title="Detection evidence">
          <p className="mb-3 text-[12px] text-ink-2">
            {det.id} · {det.name} · confidence {Math.round(det.confidence * 100)}%
          </p>
          <Table head={['#', 'Finding', 'Observed', 'Baseline', 'Deviation']} rows={det.reasoning.map((r, i) => [i + 1, r.title, <span className="mono text-[10.5px]">{r.observed}</span>, <span className="mono text-[10.5px] text-ink-2">{r.baseline}</span>, <span className="mono">{r.deviation}</span>])} />
        </Section>

        <Section n={3} title="Behavioral changes">
          <p className="mb-3 text-[12px] text-ink-2">
            ws-fin-014 · current {profile.window.current} vs baseline {profile.window.baseline}
          </p>
          <Table
            head={['Dimension', 'Deviation', 'Assessment']}
            rows={DIMENSIONS.map((d) => [d.label, <span className={`mono ${Math.abs(profile.z[d.id]) >= 2.5 ? 'font-medium' : 'text-ink-2'}`}>{fmtSigma(profile.z[d.id])}</span>, <span className="text-[11px]">{profile.notes[d.id]}</span>])}
          />
          <div className="mt-5">
            <div className="mono mb-1 text-[9.5px] uppercase tracking-[0.1em] text-ink-2">Deviation score · 10:40 – 10:47 UTC · dashed line = incident threshold 70</div>
            <ScoreTrace />
          </div>
        </Section>

        <Section n={4} title="Affected entities">
          <Table
            head={['Entity', 'Type', 'Address', 'Role', 'Change', 'Risk']}
            rows={inc.entities.map((id) => {
              const e = ENTITY_BY_ID[id]
              return [<span className="mono">{e.name === '203.0.113.77' ? 'cdn-sync.example' : e.name}</span>, <span className="mono text-[10px]">{e.type}</span>, <span className="mono">{e.address}</span>, e.role, <span className="mono">{fmtSigma(e.change)}</span>, <span className="mono text-[10px]">{e.risk.toUpperCase()}</span>]
            })}
          />
        </Section>

        <Section n={5} title="Timeline">
          <Table
            head={['Time (UTC)', 'Event', 'Entity', 'Severity', 'Source']}
            rows={[
              ...SIGNAL_EVENTS.map((e) => [
                <span className="mono">{fmtTime(e.ts)}</span>,
                e.title,
                <span className="mono text-[10.5px]">{e.entity}</span>,
                <span className={`mono text-[10px] ${SEV_INK[e.severity]}`}>{e.severity.toUpperCase()}</span>,
                <span className="mono text-[10px] text-ink-2">{e.source}</span>,
              ]),
              [<span className="mono">14:20:03</span>, 'Host isolated by analyst', <span className="mono text-[10.5px]">ws-fin-014</span>, <span className="mono text-[10px]">ACTION</span>, <span className="mono text-[10px] text-ink-2">edr/agent</span>],
            ]}
          />
        </Section>

        <Section n={6} title="Confidence analysis">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="mono mb-2 text-[9.5px] uppercase tracking-[0.1em] text-ink-2">Deviation score composition · {total} / 100</div>
              {factors.map((f) => (
                <div key={f.id} className="mb-2">
                  <div className="flex justify-between text-[11.5px]">
                    <span>{f.label}</span>
                    <span className="mono">+{Math.round(f.value)}</span>
                  </div>
                  <div className="mt-1 h-[4px] bg-ink/10">
                    <div className="h-full bg-ink" style={{ width: `${(f.value / 32) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="mono mb-2 text-[9.5px] uppercase tracking-[0.1em] text-ink-2">Detection confidence · {Math.round(det.confidence * 100)}%</div>
              <ul className="text-[11.5px]">
                {det.confidenceParts.map((p) => (
                  <li key={p.label} className="flex justify-between border-b border-ink/15 py-1">
                    <span>{p.label}</span>
                    <span className="mono">
                      {p.value > 0 ? '+' : '−'}
                      {Math.abs(p.value).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mono mb-1 mt-4 text-[9.5px] uppercase tracking-[0.1em] text-ink-2">Supporting observations</div>
              <ul className="text-[11px] text-ink-2">
                {SUPPORTING['INC-2047'].map((s) => (
                  <li key={s.label} className="py-0.5">
                    — {s.label} <span className="mono text-[10px]">({s.effect})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-2">
            Counter-evidence checked: allow-listed destination (not matched), known update/sync agent signature (not matched), fleet-wide shared periodicity (not observed). An interactive user session was present and reduces confidence by 0.04.
          </p>
        </Section>

        <Section n={7} title="Recommended investigation steps">
          <ol className="list-none space-y-3 text-[12.5px] leading-relaxed">
            {[
              'Before releasing containment, capture volatile memory and the process table from ws-fin-014; identify the process that owned connections to 203.0.113.77:8443.',
              'Enumerate files read from \\\\srv-files-02\\finance-share between 10:44:38 and 10:45:03 UTC and assess whether the 38 MB outbound transfer could represent compressed share content.',
              'Block cdn-sync.example and 203.0.113.77 at egress; extend the DNS search for the domain beyond the 30-day sensor window using resolver archives.',
              'Examine ws-eng-221 (INC-2051) for the same process lineage or artefacts — its periodic shape resembles this incident on a different port.',
              'Review authentication activity for the account logged on to ws-fin-014 and reset credentials if host compromise is confirmed.',
              'Place zeek conn/smb and NetFlow records for 2026-09-30 10:30–11:30 UTC under retention hold beyond the 14-day default.',
            ].map((s, i) => (
              <li key={i} className="grid grid-cols-[1.8rem_1fr]">
                <span className="mono text-[11px] text-ink-2">{String(i + 1).padStart(2, '0')}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <footer className="mt-14 grid gap-8 border-t border-ink pt-4 text-[10.5px] md:grid-cols-3">
          <div>
            <div className="mono uppercase tracking-[0.1em] text-ink-2">Prepared by</div>
            <div className="mt-6 border-b border-ink/40" />
            <div className="mono mt-1">analyst-03 · Tier 2</div>
          </div>
          <div>
            <div className="mono uppercase tracking-[0.1em] text-ink-2">Reviewed by</div>
            <div className="mt-6 border-b border-ink/40" />
            <div className="mono mt-1 text-ink-2">pending</div>
          </div>
          <div className="mono text-right text-ink-2">
            NFR · {inc.id} · v0.3
            <br />
            generated 2026-10-01
          </div>
        </footer>
      </article>
    </div>
  )
}
