// SIMULATED TELEMETRY — behavioral baselines vs current behavior.
// Baselines are illustrative percentile envelopes (p10 / p50 / p90) over a
// 7-day rolling window for the same time-of-day window.
import { rng, gaussian } from '../lib/rng'

export const DIMENSIONS = [
  { id: 'frequency', label: 'Connection frequency', unit: 'conn / 5 min', kind: 'series' },
  { id: 'diversity', label: 'Destination diversity', unit: 'unique dst / 15 min', kind: 'series' },
  { id: 'ports', label: 'Port distribution', unit: 'share of flows', kind: 'distribution' },
  { id: 'regularity', label: 'Temporal regularity', unit: 'inter-arrival histogram', kind: 'histogram' },
  { id: 'volume', label: 'Traffic volume', unit: 'MB out / 5 min', kind: 'series' },
  { id: 'protocols', label: 'Protocol distribution', unit: 'share of bytes', kind: 'stack' },
]

export const INTERVAL_BINS = ['0.5s', '1s', '2s', '4s', '8s', '16s', '32s', '64s', '128s', '256s+']

/**
 * Build a baseline envelope and a current series.
 * spikes: [{ from, to, value }] replace current values (absolute).
 */
function series(seed, n, p50, spread, spikes = [], { integer = true, diurnal = 0.25 } = {}) {
  const r = rng(seed)
  const baseline = []
  const current = []
  for (let i = 0; i < n; i++) {
    const shape = 1 + diurnal * Math.sin((i / n) * Math.PI)
    const mid = p50 * shape
    const b = { p10: Math.max(0, mid - spread * 1.1), p50: mid, p90: mid + spread * 1.2 }
    baseline.push(b)
    let v = mid + gaussian(r) * spread * 0.45
    for (const s of spikes) if (i >= s.from && i <= s.to) v = s.value * (0.94 + r() * 0.12)
    v = Math.max(0, v)
    current.push(integer ? Math.round(v) : Math.round(v * 10) / 10)
  }
  return { baseline, current }
}

function histogram(shape) {
  const total = shape.reduce((a, b) => a + b, 0)
  return shape.map((v) => v / total)
}

const P = (spec) => spec

export const PROFILES = {
  'ws-fin-014': P({
    window: { baseline: '2026-09-23 → 09-29 · 09:00 — 12:00', current: '2026-09-30 · 09:00 — 12:00', start: '09:00', step5: true },
    z: { frequency: 6.8, diversity: 1.3, ports: 4.0, regularity: 5.6, volume: 4.6, protocols: 3.7 },
    notes: {
      frequency: 'Peaks at 98 conn / 5 min between 10:40 and 11:00 — 16× the median.',
      diversity: 'Unique destinations stay within the band; one of them is new. Volume of destinations is not the signal — novelty is.',
      ports: '8443/tcp goes from 0% to 61% of outbound flows.',
      regularity: 'Inter-arrival times collapse onto a single 4 s bin (CV 0.04 vs 0.91). Strong machine-timing signal.',
      volume: '38 MB sent in the 10:45 bucket against a 1.6 MB median.',
      protocols: 'Bytes shift from sanctioned HTTPS to TLS on a non-standard port and SMB.',
    },
    frequency: series(101, 36, 6, 3, [{ from: 20, to: 23, value: 96 }]),
    diversity: { ...series(102, 12, 4, 1.6, [{ from: 7, to: 7, value: 6 }]), novel: [7] },
    volume: series(103, 36, 1.6, 0.8, [{ from: 21, to: 21, value: 38 }, { from: 20, to: 20, value: 6.1 }, { from: 22, to: 23, value: 4.4 }], { integer: false }),
    ports: [
      { k: '443', baseline: 0.58, current: 0.18 },
      { k: '53', baseline: 0.24, current: 0.12 },
      { k: '88', baseline: 0.09, current: 0.03 },
      { k: '445', baseline: 0.09, current: 0.06 },
      { k: '8443', baseline: 0, current: 0.61 },
    ],
    regularity: {
      baseline: histogram([1, 3, 6, 9, 14, 18, 17, 13, 10, 9]),
      current: histogram([0.4, 1, 2, 62, 4, 6, 6, 4, 3, 2]),
      cv: { baseline: 0.91, current: 0.04 },
    },
    protocols: [
      { k: 'HTTPS', baseline: 0.71, current: 0.06 },
      { k: 'SMB', baseline: 0.21, current: 0.49 },
      { k: 'TLS/8443', baseline: 0, current: 0.44 },
      { k: 'KRB', baseline: 0.05, current: 0.005 },
      { k: 'DNS', baseline: 0.03, current: 0.005 },
    ],
  }),
  'ws-eng-221': P({
    window: { baseline: '2026-09-24 → 09-30 · 00:00 — 03:00', current: '2026-10-01 · 00:00 — 03:00', start: '00:00', step5: true },
    z: { frequency: 3.9, diversity: 1.9, ports: 0.8, regularity: 3.4, volume: 1.2, protocols: 0.6 },
    notes: {
      frequency: 'Off-hours outbound rises sharply in the final buckets (02:40 onward).',
      diversity: 'One destination outside the host’s 30-day set; band otherwise respected.',
      ports: 'Ports unchanged — traffic uses 443/tcp like normal browsing.',
      regularity: 'Emerging 2 s periodicity; fewer samples than INC-2047, lower certainty.',
      volume: 'Bytes remain inside the band.',
      protocols: 'Protocol mix unchanged.',
    },
    frequency: series(201, 36, 1, 1, [{ from: 32, to: 33, value: 26 }]),
    diversity: { ...series(202, 12, 1.5, 1, [{ from: 10, to: 10, value: 3 }]), novel: [10] },
    volume: series(203, 36, 0.3, 0.25, [], { integer: false, diurnal: 0 }),
    ports: [
      { k: '443', baseline: 0.71, current: 0.76 },
      { k: '53', baseline: 0.22, current: 0.2 },
      { k: '22', baseline: 0.07, current: 0.04 },
    ],
    regularity: {
      baseline: histogram([1, 2, 4, 7, 11, 16, 19, 16, 13, 11]),
      current: histogram([1, 4, 31, 9, 8, 9, 10, 8, 6, 5]),
      cv: { baseline: 0.84, current: 0.11 },
    },
    protocols: [
      { k: 'HTTPS', baseline: 0.82, current: 0.85 },
      { k: 'SSH', baseline: 0.12, current: 0.1 },
      { k: 'DNS', baseline: 0.06, current: 0.05 },
    ],
  }),
  'srv-files-02': P({
    window: { baseline: '2026-09-23 → 09-29 · 09:00 — 12:00', current: '2026-09-30 · 09:00 — 12:00', start: '09:00', step5: true },
    z: { frequency: 0.7, diversity: 0.4, ports: 0.2, regularity: 0.3, volume: 4.2, protocols: 0.5 },
    notes: {
      frequency: 'Session count is ordinary.',
      diversity: 'Client set unchanged.',
      ports: 'SMB and LDAP only, as expected.',
      regularity: 'Request timing is human-shaped.',
      volume: '412 MB served to a single client in the 10:44 bucket.',
      protocols: 'Mix unchanged; the SMB share simply grew.',
    },
    frequency: series(301, 36, 22, 6),
    diversity: { ...series(302, 12, 18, 4), novel: [] },
    volume: series(303, 36, 14, 5, [{ from: 20, to: 20, value: 412 }], { integer: false }),
    ports: [
      { k: '445', baseline: 0.84, current: 0.86 },
      { k: '389', baseline: 0.12, current: 0.11 },
      { k: '135', baseline: 0.04, current: 0.03 },
    ],
    regularity: {
      baseline: histogram([4, 6, 9, 12, 15, 16, 14, 11, 8, 5]),
      current: histogram([5, 7, 10, 12, 15, 15, 13, 10, 8, 5]),
      cv: { baseline: 1.12, current: 1.08 },
    },
    protocols: [
      { k: 'SMB', baseline: 0.9, current: 0.93 },
      { k: 'LDAP', baseline: 0.07, current: 0.05 },
      { k: 'RPC', baseline: 0.03, current: 0.02 },
    ],
  }),
}

/** Quieter profiles for the remaining hosts — generated from a template. */
function quietProfile(seed, base, notes) {
  const r = rng(seed)
  const z = {
    frequency: Math.round(r() * 12) / 10,
    diversity: Math.round(r() * 10) / 10,
    ports: Math.round(r() * 6) / 10,
    regularity: Math.round(r() * 8) / 10,
    volume: Math.round((r() * 14 + (seed === 501 ? 7 : 0))) / 10,
    protocols: Math.round(r() * 5) / 10,
  }
  return {
    window: { baseline: '2026-09-24 → 09-30 · 00:00 — 03:00', current: '2026-10-01 · 00:00 — 03:00', start: '00:00', step5: true },
    z,
    notes: {
      frequency: 'Within band.',
      diversity: 'Within band.',
      ports: 'No new ports.',
      regularity: 'No periodic structure.',
      volume: notes ?? 'Within band.',
      protocols: 'Mix unchanged.',
    },
    frequency: series(seed + 1, 36, base, base * 0.35),
    diversity: { ...series(seed + 2, 12, Math.max(2, base / 6), 1.5), novel: [] },
    volume: series(seed + 3, 36, base / 8, base / 20, [], { integer: false }),
    ports: [
      { k: '443', baseline: 0.62, current: 0.6 },
      { k: '53', baseline: 0.27, current: 0.28 },
      { k: '88', baseline: 0.11, current: 0.12 },
    ],
    regularity: {
      baseline: histogram([2, 4, 7, 10, 14, 17, 16, 13, 10, 7]),
      current: histogram([2, 4, 8, 10, 13, 16, 16, 14, 10, 7]),
      cv: { baseline: 0.97, current: 0.94 },
    },
    protocols: [
      { k: 'HTTPS', baseline: 0.74, current: 0.72 },
      { k: 'DNS', baseline: 0.16, current: 0.17 },
      { k: 'KRB', baseline: 0.1, current: 0.11 },
    ],
  }
}

PROFILES['build-07'] = quietProfile(501, 34, 'Nightly build 2.1σ above median at 01:10 — matches scheduled job (benign).')
PROFILES['ws-fin-019'] = quietProfile(511, 6)
PROFILES['dc-01'] = quietProfile(521, 52)
PROFILES['dns-int-01'] = quietProfile(531, 75)
PROFILES['ws-hr-008'] = quietProfile(541, 3)

export const PROFILED_ENTITIES = ['ws-fin-014', 'ws-eng-221', 'srv-files-02', 'build-07', 'ws-fin-019', 'dc-01', 'dns-int-01', 'ws-hr-008']

/** Labels for 5-minute buckets across a 3h window. */
export function bucketLabel(start, i, minutes = 5) {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + i * minutes
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** A deviation is "meaningful" when it exceeds this many sigma. */
export const DEVIATION_THRESHOLD = 2.5
