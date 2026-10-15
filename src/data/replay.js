// SIMULATED TELEMETRY — reconstructed sequence for incident INC-2047.
// Everything in this module is deterministic demo data: the "scores" are a
// scripted illustration of how an explainable behavioral model could weigh
// evidence, not the output of a real detector.
import { rng, expo, gaussian } from '../lib/rng'
import { smoothstep, clamp } from '../lib/format'
import { FLOWS, GRAPH_NODES } from './entities'

export const REPLAY_BASE = '2026-09-30T10:40:00Z'
export const REPLAY_DURATION = 420 // seconds (10:40:00 → 10:47:00)
export const INCIDENT_ID = 'INC-2047'

export const at = (sec) => new Date(new Date(REPLAY_BASE).getTime() + sec * 1000).toISOString()

/* ------------------------------------------------------------------ */
/* Phases                                                              */
/* ------------------------------------------------------------------ */
export const PHASES = [
  {
    id: 'normal',
    label: 'Normal',
    start: 0,
    tone: 'ok',
    summary: 'Traffic from ws-fin-014 sits inside its learned envelope.',
    detail:
      'Outbound connection rate, destination set and port usage all match the 7-day baseline for this host in the 09:00–12:00 window. No factor contributes to the deviation score.',
  },
  {
    id: 'deviation',
    label: 'Deviation',
    start: 151,
    tone: 'amber',
    summary: 'Outbound connection frequency leaves the baseline band.',
    detail:
      'Outbound connections rise to 4.1/min against a baseline of 1.2/min (p95 1.9/min). On its own this is weak evidence — software updates and sync clients produce similar bursts — so it only raises the host to observation.',
  },
  {
    id: 'anomaly',
    label: 'Anomaly',
    start: 182,
    tone: 'amber',
    summary: 'A destination never seen in 30 days is contacted on 8443/tcp.',
    detail:
      'ws-fin-014 resolves cdn-sync.example (first query fleet-wide) and opens TCP/8443 to 203.0.113.77. The destination and the port are both novel for the finance subnet. Two independent signals now point at the same host.',
  },
  {
    id: 'correlation',
    label: 'Correlation',
    start: 197,
    tone: 'amber',
    summary: 'Connections settle into a fixed 4.0 s interval.',
    detail:
      'Inter-arrival times to 203.0.113.77 collapse to 4.0 s ± 0.15 s (coefficient of variation 0.04, baseline 0.91). Human-driven traffic is bursty; machine check-ins are metronomic. The correlator links the frequency, novelty and periodicity signals.',
  },
  {
    id: 'escalation',
    label: 'Escalation',
    start: 245,
    tone: 'crit',
    summary: 'Pattern matches a known periodic-egress shape; internal reads spike.',
    detail:
      'The combined behavior matches pattern PAT-PERIODIC-EGRESS. Shortly after, ws-fin-014 reads 412 MB from srv-files-02 over SMB in 25 s (baseline 18 MB/h), followed by a rise in bytes sent to 203.0.113.77.',
  },
  {
    id: 'incident',
    label: 'Incident',
    start: 312,
    tone: 'crit',
    summary: 'Correlated evidence crosses the incident threshold (82/100).',
    detail:
      'Four deviation factors and two supporting observations are grouped into INC-2047. Confidence rises from 0.64 to 0.82. The sequence is handed to an analyst with the reconstruction attached.',
  },
]

export function phaseAt(t) {
  let p = PHASES[0]
  for (const ph of PHASES) if (t >= ph.start) p = ph
  return p
}

/* ------------------------------------------------------------------ */
/* Deviation factors (explainability)                                 */
/* ------------------------------------------------------------------ */
export const FACTORS = [
  {
    id: 'freq',
    label: 'Outbound frequency deviation',
    max: 32,
    start: 151,
    ramp: 40,
    evidence: '19.6 conn/min vs 1.2 baseline (p95 1.9)',
  },
  {
    id: 'novelty',
    label: 'Destination novelty',
    max: 21,
    start: 182,
    ramp: 10,
    evidence: 'cdn-sync.example · 203.0.113.77 — 0 prior contacts / 30d',
  },
  {
    id: 'periodic',
    label: 'Periodic communication pattern',
    max: 17,
    start: 197,
    ramp: 115,
    evidence: '4.0 s ± 0.15 s interval · CV 0.04 (baseline 0.91)',
  },
  {
    id: 'port',
    label: 'Unusual port behavior',
    max: 12,
    start: 220,
    ramp: 25,
    evidence: '8443/tcp outbound — 0 occurrences in finance subnet baseline',
  },
]

export function factorsAt(t) {
  return FACTORS.map((f) => ({ ...f, value: f.max * smoothstep((t - f.start) / f.ramp) }))
}

const noiseR = rng(2047)
const NOISE = Array.from({ length: REPLAY_DURATION + 1 }, () => 8 + gaussian(noiseR) * 1.6)

/** Deviation score 0–100 at time t (sum of factor contributions, floor = baseline noise). */
export function scoreAt(t) {
  const s = factorsAt(t).reduce((a, f) => a + f.value, 0)
  const n = NOISE[clamp(Math.round(t), 0, REPLAY_DURATION)]
  return Math.max(n * (1 - smoothstep(s / 20)), s, n * 0.6)
}

export const SCORE_SERIES = Array.from({ length: REPLAY_DURATION + 1 }, (_, t) => scoreAt(t))

/** Correlator confidence (0–1) at time t. */
export function confidenceAt(t) {
  if (t < 151) return 0
  if (t < 182) return 0.18 + 0.1 * smoothstep((t - 151) / 30)
  if (t < 197) return 0.34
  if (t < 245) return 0.42 + 0.1 * smoothstep((t - 197) / 40)
  if (t < 312) return 0.58 + 0.06 * smoothstep((t - 245) / 60)
  return 0.64 + 0.18 * smoothstep((t - 312) / 20)
}

/* ------------------------------------------------------------------ */
/* Events within the replay window                                     */
/* ------------------------------------------------------------------ */
// Signal events belong to the incident; routine events are background noise
// that an analyst would see in the raw stream.
const SIGNAL = [
  {
    t: 128,
    title: 'Baseline established',
    type: 'Behavior',
    entity: 'ws-fin-014',
    severity: 'info',
    confidence: 0.97,
    source: 'nfr/behavior-model',
    detail: '7-day baseline, 09:00–12:00 window · 1,284 flows · 14 destinations · ports 53, 88, 443, 445',
    raw: { window: '2026-09-23 → 2026-09-29', flows: 1284, dest_set: 14, conn_rate_p50: '1.2/min', conn_rate_p95: '1.9/min' },
  },
  {
    t: 151,
    title: 'Outbound frequency deviation',
    type: 'Behavior',
    entity: 'ws-fin-014',
    severity: 'low',
    confidence: 0.58,
    source: 'nfr/behavior-model',
    detail: 'Outbound rate 4.1/min vs baseline 1.2/min (p95 1.9) — 2.9σ',
    raw: { metric: 'conn_rate_out', observed: 4.1, baseline_p50: 1.2, baseline_p95: 1.9, z: 2.9 },
  },
  {
    t: 167,
    title: 'First DNS query for domain',
    type: 'DNS',
    entity: 'ws-fin-014',
    severity: 'low',
    confidence: 0.71,
    source: 'zeek/dns',
    detail: 'A cdn-sync.example → 203.0.113.77 · TTL 60 · first query fleet-wide',
    raw: { query: 'cdn-sync.example', qtype: 'A', answer: '203.0.113.77', ttl: 60, resolver: '10.24.1.10' },
  },
  {
    t: 182,
    title: 'New destination contacted',
    type: 'Network',
    entity: 'ws-fin-014',
    severity: 'medium',
    confidence: 0.74,
    source: 'zeek/conn',
    detail: '10.24.18.42:51544 → 203.0.113.77:8443/tcp · destination unseen in 30 days',
    raw: { uid: 'C4f9qA2mXk1', orig: '10.24.18.42:51544', resp: '203.0.113.77:8443', proto: 'tcp', service: 'ssl', duration: '0.41s' },
  },
  {
    t: 189,
    title: 'Destination reputation changed',
    type: 'Network',
    entity: '203.0.113.77',
    severity: 'medium',
    confidence: 0.62,
    source: 'intel/sim-feed',
    detail: 'cdn-sync.example: unclassified → suspicious · domain age 4 days (simulated feed)',
    raw: { indicator: 'cdn-sync.example', previous: 'unclassified', current: 'suspicious', domain_age_days: 4 },
  },
  {
    t: 197,
    title: 'Repeated connection interval detected',
    type: 'Anomaly',
    entity: 'ws-fin-014',
    severity: 'high',
    confidence: 0.79,
    source: 'nfr/behavior-model',
    detail: '5 consecutive intervals 4.0 s ± 0.15 s to 203.0.113.77 — CV 0.04',
    raw: { intervals_s: [3.98, 4.04, 3.91, 4.12, 4.0], mean: 4.01, stdev: 0.15, cv: 0.04 },
  },
  {
    t: 220,
    title: 'Unusual port behavior',
    type: 'Anomaly',
    entity: 'ws-fin-014',
    severity: 'medium',
    confidence: 0.69,
    source: 'nfr/behavior-model',
    detail: '8443/tcp outbound from finance subnet — 0 occurrences in baseline',
    raw: { port: 8443, subnet: '10.24.18.0/24', baseline_occurrences: 0 },
  },
  {
    t: 245,
    title: 'Behavior correlated with known anomaly pattern',
    type: 'Anomaly',
    entity: 'ws-fin-014',
    severity: 'high',
    confidence: 0.81,
    source: 'nfr/correlator',
    detail: 'Matches PAT-PERIODIC-EGRESS (frequency ↑ · novel destination · fixed interval)',
    raw: { pattern: 'PAT-PERIODIC-EGRESS', matched_signals: ['conn_rate_out', 'dest_novelty', 'interval_cv'], similarity: 0.81 },
  },
  {
    t: 278,
    title: 'SMB read volume spike',
    type: 'Network',
    entity: 'srv-files-02',
    severity: 'high',
    confidence: 0.77,
    source: 'zeek/smb',
    detail: 'ws-fin-014 read 412 MB from \\\\srv-files-02\\finance-share in 25 s (baseline 18 MB/h)',
    raw: { client: '10.24.18.42', server: '172.16.4.21', share: 'finance-share', bytes_read: 432013312, duration: '25.2s' },
  },
  {
    t: 302,
    title: 'Outbound volume increase',
    type: 'Network',
    entity: 'ws-fin-014',
    severity: 'critical',
    confidence: 0.8,
    source: 'netflow/gw-edge-01',
    detail: '38 MB sent to 203.0.113.77:8443 in 40 s · upload/download ratio 31:1',
    raw: { bytes_out: 39845888, bytes_in: 1285324, ratio: '31:1', window: '40s' },
  },
  {
    t: 312,
    title: 'Events correlated into INC-2047',
    type: 'Anomaly',
    entity: 'ws-fin-014',
    severity: 'critical',
    confidence: 0.82,
    source: 'nfr/correlator',
    detail: '9 events · 3 entities · deviation score 82/100',
    raw: { incident: 'INC-2047', events: 9, entities: ['ws-fin-014', '203.0.113.77', 'srv-files-02'] },
  },
  {
    t: 331,
    title: 'Incident confidence increased',
    type: 'Anomaly',
    entity: 'ws-fin-014',
    severity: 'critical',
    confidence: 0.82,
    source: 'nfr/correlator',
    detail: 'Confidence 0.64 → 0.82 after SMB + outbound volume evidence',
    raw: { previous: 0.64, current: 0.82 },
  },
]

const ROUTINE_TEMPLATES = [
  { title: 'DNS query', type: 'DNS', entity: 'ws-fin-019', detail: 'A auth-node.example → 192.0.2.15', source: 'zeek/dns' },
  { title: 'Kerberos TGS request', type: 'Authentication', entity: 'ws-fin-019', detail: 'krbtgt/CORP · AES256 · success', source: 'ad/auth' },
  { title: 'HTTPS session', type: 'Network', entity: 'ws-fin-014', detail: '10.24.18.42 → telemetry.example:443 · 14 KB', source: 'zeek/conn' },
  { title: 'DNS query', type: 'DNS', entity: 'ws-fin-014', detail: 'A telemetry.example → 198.51.100.23', source: 'zeek/dns' },
  { title: 'LDAP bind', type: 'Authentication', entity: 'srv-files-02', detail: 'srv-files-02$ → dc-01 · simple bind over TLS', source: 'ad/auth' },
  { title: 'Package fetch', type: 'Network', entity: 'build-07', detail: '10.24.3.18 → update-mirror.example:443 · 2.1 MB', source: 'zeek/conn' },
  { title: 'Process start', type: 'Endpoint', entity: 'ws-fin-019', detail: 'EXCEL.EXE · signed · parent explorer.exe', source: 'edr/agent' },
  { title: 'SMB tree connect', type: 'Network', entity: 'ws-fin-019', detail: '\\\\srv-files-02\\finance-share · 340 KB read', source: 'zeek/smb' },
]

const routineR = rng(77)
const ROUTINE = []
for (let t = 6; t < REPLAY_DURATION; t += 14 + Math.floor(routineR() * 26)) {
  const tpl = ROUTINE_TEMPLATES[Math.floor(routineR() * ROUTINE_TEMPLATES.length)]
  ROUTINE.push({ ...tpl, t, severity: 'info', confidence: 0.99, routine: true })
}

export const REPLAY_EVENTS = [...SIGNAL.map((e) => ({ ...e, signal: true })), ...ROUTINE]
  .sort((a, b) => a.t - b.t)
  .map((e, i) => ({
    ...e,
    id: `EVT-0930-${String(4100 + i).padStart(4, '0')}`,
    ts: at(e.t),
    phase: phaseAt(e.t).id,
  }))

export const SIGNAL_EVENTS = REPLAY_EVENTS.filter((e) => e.signal)

/* ------------------------------------------------------------------ */
/* Lane telemetry (flow ticks per entity) for the recorder strip       */
/* ------------------------------------------------------------------ */
export const LANES = [
  { id: 'ws-fin-014', label: 'ws-fin-014', addr: '10.24.18.42', rate: 1 / 11 },
  { id: '203.0.113.77', label: 'cdn-sync.example', addr: '203.0.113.77', rate: 0 },
  { id: 'srv-files-02', label: 'srv-files-02', addr: '172.16.4.21', rate: 1 / 7 },
  { id: 'dns-int-01', label: 'dns-int-01', addr: '10.24.1.10', rate: 1 / 3.5 },
  { id: 'ws-fin-019', label: 'ws-fin-019', addr: '10.24.18.57', rate: 1 / 13 },
  { id: 'telemetry.example', label: 'telemetry.example', addr: '198.51.100.23', rate: 1 / 16 },
]

function buildTicks() {
  const r = rng(4242)
  const ticks = {}
  for (const lane of LANES) ticks[lane.id] = []

  // Baseline Poisson traffic for each lane (with a deviation multiplier for ws-fin-014)
  for (const lane of LANES) {
    if (!lane.rate) continue
    let t = expo(r, lane.rate)
    while (t < REPLAY_DURATION) {
      ticks[lane.id].push({ t, h: 0.2 + r() * 0.35, state: 'normal' })
      const mult = lane.id === 'ws-fin-014' && t > 151 ? 2.6 : 1
      t += expo(r, lane.rate * mult)
    }
  }
  // Extra deviation flows (ws-fin-014 → existing destinations) during deviation phase
  for (let t = 151; t < 182; t += 3 + r() * 5) {
    ticks['ws-fin-014'].push({ t, h: 0.3 + r() * 0.25, state: 'deviating' })
  }
  // Periodic beacon: ws-fin-014 → 203.0.113.77 every 4.0 s ± 0.15 s
  for (let t = 182; t < REPLAY_DURATION; t += 4 + gaussian(r) * 0.15) {
    const late = t > 245
    const exfil = t > 302 && t < 342
    const h = exfil ? 0.8 + r() * 0.2 : 0.42 + r() * 0.06
    const state = late ? 'anomalous' : 'deviating'
    ticks['ws-fin-014'].push({ t, h: h * 0.9, state, beacon: true })
    ticks['203.0.113.77'].push({ t, h, state, beacon: true })
  }
  // SMB read burst ws-fin-014 ← srv-files-02
  for (let t = 278; t < 303; t += 0.7 + r() * 0.6) {
    ticks['srv-files-02'].push({ t, h: 0.6 + r() * 0.4, state: 'anomalous' })
  }
  for (const id of Object.keys(ticks)) ticks[id].sort((a, b) => a.t - b.t)
  return ticks
}

export const LANE_TICKS = buildTicks()

/** Arcs connecting correlated events across lanes. */
export const CORRELATIONS = [
  { t: 167, from: 'ws-fin-014', to: 'dns-int-01', label: 'DNS' },
  { t: 182, from: 'ws-fin-014', to: '203.0.113.77', label: 'first contact' },
  { t: 278, from: 'srv-files-02', to: 'ws-fin-014', label: 'SMB 412 MB' },
  { t: 302, from: 'ws-fin-014', to: '203.0.113.77', label: '38 MB out' },
]

/** Count of flow ticks per bucket — event density strip. */
export function densityBuckets(bucket = 10) {
  const n = Math.ceil(REPLAY_DURATION / bucket)
  const out = Array.from({ length: n }, () => ({ total: 0, flagged: 0 }))
  for (const id of Object.keys(LANE_TICKS)) {
    for (const tk of LANE_TICKS[id]) {
      const i = Math.min(n - 1, Math.floor(tk.t / bucket))
      out[i].total++
      if (tk.state !== 'normal') out[i].flagged++
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Graph state at time t                                              */
/* ------------------------------------------------------------------ */
const RISK_TIMELINE = {
  'ws-fin-014': [[0, 'normal'], [151, 'elevated'], [182, 'suspicious'], [245, 'critical']],
  '203.0.113.77': [[182, 'suspicious'], [245, 'critical']],
  'srv-files-02': [[0, 'normal'], [278, 'suspicious']],
}

function stepLookup(steps, t, fallback) {
  let v = fallback
  for (const [s, val] of steps) if (t >= s) v = val
  return v
}

/** Returns { flows, nodeRisk, hidden } describing the graph at replay second t. */
export function graphStateAt(t) {
  const flows = FLOWS.filter((f) => f.replayStart !== null && (f.replayStart === undefined || t >= f.replayStart)).map(
    (f) => ({ ...f, state: f.replayState ? stepLookup(f.replayState, t, 'normal') : 'normal' }),
  )
  // Every entity starts the replay at baseline; only scripted transitions change it
  const nodeRisk = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, 'normal']))
  const hidden = new Set()
  for (const [id, steps] of Object.entries(RISK_TIMELINE)) {
    const v = stepLookup(steps, t, null)
    if (v === null) hidden.add(id)
    else nodeRisk[id] = v
  }
  hidden.add('203.0.113.140')
  return { flows, nodeRisk, hidden }
}
