// SIMULATED TELEMETRY — forensic event log and live stream seed.
import { rng } from '../lib/rng'
import { REPLAY_EVENTS, REPLAY_BASE, REPLAY_DURATION } from './replay'

export const EVENT_CATEGORIES = ['Network', 'Authentication', 'DNS', 'Endpoint', 'Behavior', 'Anomaly']
export const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical']

/** Demo clock origin: the simulated "now" when the app is opened. */
export const DEMO_NOW = '2026-10-01T02:41:48Z'

/* ------------------------------------------------------------------ */
/* INC-2051 — the live sequence on ws-eng-221                          */
/* ------------------------------------------------------------------ */
export const LIVE_SIGNAL = [
  {
    ts: '2026-10-01T02:41:18Z',
    title: 'Behavior deviation detected',
    type: 'Behavior',
    entity: 'ws-eng-221',
    severity: 'medium',
    confidence: 0.61,
    source: 'nfr/behavior-model',
    detail: 'Off-hours outbound rate 5.2/min vs 0.2/min baseline for 02:00–03:00',
  },
  {
    ts: '2026-10-01T02:41:21Z',
    title: 'Unusual outbound connection',
    type: 'Network',
    entity: 'ws-eng-221',
    severity: 'medium',
    confidence: 0.58,
    source: 'zeek/conn',
    detail: '10.24.7.91:40112 → 203.0.113.140:443/tcp · no SNI · no PTR',
  },
  {
    ts: '2026-10-01T02:41:27Z',
    title: 'Destination reputation changed',
    type: 'Network',
    entity: '203.0.113.140',
    severity: 'medium',
    confidence: 0.66,
    source: 'intel/sim-feed',
    detail: 'unclassified → suspicious (simulated feed) · ASN first seen in fleet',
  },
  {
    ts: '2026-10-01T02:41:31Z',
    title: 'Repeated connection pattern',
    type: 'Anomaly',
    entity: 'ws-eng-221',
    severity: 'high',
    confidence: 0.72,
    source: 'nfr/behavior-model',
    detail: '6 connections at 2.0 s ± 0.21 s · CV 0.11',
  },
  {
    ts: '2026-10-01T02:41:36Z',
    title: 'Events correlated',
    type: 'Anomaly',
    entity: 'ws-eng-221',
    severity: 'high',
    confidence: 0.74,
    source: 'nfr/correlator',
    detail: '4 events grouped → INC-2051 (draft) · similar shape to INC-2047',
  },
  {
    ts: '2026-10-01T02:41:42Z',
    title: 'Incident confidence increased',
    type: 'Anomaly',
    entity: 'ws-eng-221',
    severity: 'high',
    confidence: 0.79,
    source: 'nfr/correlator',
    detail: 'INC-2051 confidence 0.74 → 0.79 · awaiting analyst triage',
  },
]

/* ------------------------------------------------------------------ */
/* Routine background telemetry                                        */
/* ------------------------------------------------------------------ */
const ROUTINE = [
  { title: 'DNS query', type: 'DNS', entity: 'build-07', detail: 'AAAA update-mirror.example → NOERROR', source: 'zeek/dns' },
  { title: 'Kerberos TGT issued', type: 'Authentication', entity: 'ws-fin-019', detail: 'AS-REQ · AES256 · success', source: 'ad/auth' },
  { title: 'HTTPS session', type: 'Network', entity: 'ws-fin-019', detail: '→ auth-node.example:443 · 22 KB', source: 'zeek/conn' },
  { title: 'Package fetch', type: 'Network', entity: 'build-07', detail: '→ update-mirror.example:443 · 3.4 MB', source: 'zeek/conn' },
  { title: 'Process start', type: 'Endpoint', entity: 'build-07', detail: 'cargo · signed · parent runner', source: 'edr/agent' },
  { title: 'LDAP query', type: 'Authentication', entity: 'srv-files-02', detail: 'group membership lookup · 12 ms', source: 'ad/auth' },
  { title: 'DNS query', type: 'DNS', entity: 'ws-eng-221', detail: 'A update-mirror.example → NOERROR', source: 'zeek/dns' },
  { title: 'SMB session', type: 'Network', entity: 'srv-files-02', detail: 'build-07 → \\\\srv-files-02\\artifacts · 1.1 MB', source: 'zeek/smb' },
  { title: 'Telemetry upload', type: 'Network', entity: 'dns-int-01', detail: '→ telemetry.example:443 · 6 KB', source: 'zeek/conn' },
  { title: 'Interactive logon', type: 'Authentication', entity: 'ws-hr-008', detail: 'type 2 logon · success', source: 'ad/auth' },
  { title: 'Process start', type: 'Endpoint', entity: 'ws-fin-019', detail: 'OUTLOOK.EXE · signed', source: 'edr/agent' },
]

const NOTABLE = [
  {
    ts: '2026-09-30T08:52:14Z',
    title: 'Baseline model refreshed',
    type: 'Behavior',
    entity: 'nfr-sensor-01',
    severity: 'info',
    confidence: 0.99,
    source: 'nfr/behavior-model',
    detail: '1,912 entity baselines updated · 7-day rolling window',
  },
  {
    ts: '2026-09-30T09:31:40Z',
    title: 'NXDOMAIN rate above baseline',
    type: 'DNS',
    entity: 'build-07',
    severity: 'low',
    confidence: 0.52,
    source: 'zeek/dns',
    detail: '38 NXDOMAIN / 5 min (baseline 9) · typo in mirror config — resolved',
  },
  {
    ts: '2026-09-30T13:07:55Z',
    title: 'Unsigned binary executed',
    type: 'Endpoint',
    entity: 'build-07',
    severity: 'low',
    confidence: 0.6,
    source: 'edr/agent',
    detail: '/tmp/build-cache/protoc · hash 9f1c…e04a · expected toolchain path',
  },
  {
    ts: '2026-09-30T14:20:03Z',
    title: 'Host isolated by analyst',
    type: 'Endpoint',
    entity: 'ws-fin-014',
    severity: 'high',
    confidence: 1,
    source: 'edr/agent',
    detail: 'Network containment applied · INC-2047 · reversible',
  },
  {
    ts: '2026-09-30T17:55:12Z',
    title: 'Failed authentication burst',
    type: 'Authentication',
    entity: 'ws-hr-008',
    severity: 'medium',
    confidence: 0.55,
    source: 'ad/auth',
    detail: '5 failures → success within 40 s · single account · same workstation',
  },
  {
    ts: '2026-09-30T22:10:44Z',
    title: 'Sensor packet loss',
    type: 'Network',
    entity: 'nfr-sensor-01',
    severity: 'low',
    confidence: 0.99,
    source: 'sensor/health',
    detail: '0.8% drop on tap gw-edge-01 for 3 min · coverage gap recorded',
  },
  {
    ts: '2026-10-01T01:12:30Z',
    title: 'Behavior deviation (benign)',
    type: 'Behavior',
    entity: 'build-07',
    severity: 'low',
    confidence: 0.44,
    source: 'nfr/behavior-model',
    detail: 'Nightly build 2.1σ above volume baseline · matches scheduled job',
  },
]

function buildRoutine() {
  const r = rng(9090)
  const out = []
  const start = new Date('2026-09-30T08:00:00Z').getTime()
  const end = new Date('2026-10-01T02:41:00Z').getTime()
  const rStart = new Date(REPLAY_BASE).getTime()
  const rEnd = rStart + REPLAY_DURATION * 1000
  let t = start
  while (t < end) {
    // Denser during business hours
    const hour = new Date(t).getUTCHours()
    const gap = hour >= 8 && hour <= 18 ? 6 + r() * 14 : 18 + r() * 40
    t += gap * 60 * 1000
    if (t >= end) break
    if (t >= rStart - 60000 && t <= rEnd + 60000) continue
    const tpl = ROUTINE[Math.floor(r() * ROUTINE.length)]
    out.push({ ...tpl, ts: new Date(Math.min(end, t + Math.floor(r() * 59) * 1000)).toISOString(), severity: 'info', confidence: 0.99 })
  }
  return out
}

function stamp(list) {
  const counters = {}
  return list
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((e) => {
      const mmdd = e.ts.slice(5, 7) + e.ts.slice(8, 10)
      counters[mmdd] = (counters[mmdd] ?? 0) + 1
      return { ...e, id: e.id ?? `EVT-${mmdd}-${String(counters[mmdd] + (mmdd === '0930' ? 3000 : 100)).padStart(4, '0')}` }
    })
}

/** Full forensic event log (oldest → newest). */
export const EVENT_LOG = stamp([
  ...buildRoutine(),
  ...NOTABLE,
  ...LIVE_SIGNAL,
  ...REPLAY_EVENTS.map(({ t, phase, signal, routine, ...e }) => e),
])

/** Seed for the Overview live stream: the last 14 events before DEMO_NOW. */
export const LIVE_SEED = EVENT_LOG.filter((e) => e.ts <= DEMO_NOW).slice(-14)

/** Routine events emitted by the simulated stream while the app is open. */
export function routineLiveEvent(seq, ts) {
  const tpl = ROUTINE[(seq * 7) % ROUTINE.length]
  return {
    ...tpl,
    ts,
    id: `EVT-1001-${String(900 + seq).padStart(4, '0')}`,
    severity: 'info',
    confidence: 0.99,
    simulated: true,
  }
}
