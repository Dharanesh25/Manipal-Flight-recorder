// SIMULATED TELEMETRY — detection records with explainable reasoning.
import { rng, gaussian } from '../lib/rng'

function intervals(seed, n, mean, sd, { lognormal = false } = {}) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    if (lognormal) return Math.exp(Math.log(mean) + gaussian(r) * sd)
    return Math.max(0.1, mean + gaussian(r) * sd)
  })
}

const BASE_INTERVALS = intervals(7731, 60, 18, 1.05, { lognormal: true })
const CUR_INTERVALS = intervals(7732, 54, 4.0, 0.15)
// Two jitter outliers (network retransmits) — the "52 of 54" in reasoning step 4
CUR_INTERVALS[17] = 4.62
CUR_INTERVALS[38] = 3.47

export const DETECTIONS = [
  {
    id: 'DET-7731',
    name: 'Periodic Outbound Communication',
    severity: 'high',
    confidence: 0.87,
    status: 'CONFIRMED BY ANALYST',
    entity: 'ws-fin-014',
    target: '203.0.113.77:8443 · cdn-sync.example',
    incident: 'INC-2047',
    firstSeen: '2026-09-30T10:43:17Z',
    lastSeen: '2026-09-30T10:58:40Z',
    model: 'periodicity-v3 · simulated',
    summary:
      'ws-fin-014 began contacting a destination it had never used before, on a port its subnet never uses, at a fixed machine-like interval — and kept doing so long enough to rule out a one-off.',
    reasoning: [
      {
        id: 'r1',
        title: 'Connection interval became highly regular',
        statement: 'Inter-arrival times to the destination collapsed to 4.0 s ± 0.15 s.',
        observed: 'mean 4.01 s · σ 0.15 s · CV 0.04',
        baseline: 'median 18 s · CV 0.91 (bursty, human-driven)',
        deviation: '5.6σ',
        weight: 0.34,
        evidence: 'intervals',
      },
      {
        id: 'r2',
        title: 'Destination was previously unseen',
        statement: 'No host in the fleet contacted cdn-sync.example or 203.0.113.77 in the prior 30 days.',
        observed: 'first contact 2026-09-30 10:43:02',
        baseline: '0 contacts / 30 days · domain age 4 days',
        deviation: 'novel',
        weight: 0.26,
        evidence: 'firstseen',
      },
      {
        id: 'r3',
        title: 'Outbound frequency increased',
        statement: 'Outbound connection rate rose well above the host’s envelope for this time of day.',
        observed: '19.6 conn/min (10:40 – 11:00)',
        baseline: '1.2 conn/min median · p95 1.9',
        deviation: '6.8σ',
        weight: 0.22,
        evidence: 'frequency',
      },
      {
        id: 'r4',
        title: 'Pattern persisted across multiple intervals',
        statement: '52 of 54 consecutive intervals stayed within ±0.4 s of the mean.',
        observed: '54 intervals · 96% within tolerance',
        baseline: 'tolerance ±10% of mean · minimum 12 intervals',
        deviation: 'sustained',
        weight: 0.18,
        evidence: 'persistence',
      },
    ],
    confidenceParts: [
      { label: 'Periodicity match', value: 0.52 },
      { label: 'Destination novelty corroborates', value: 0.17 },
      { label: 'Persistence > 12 intervals', value: 0.14 },
      { label: 'Frequency deviation corroborates', value: 0.08 },
      { label: 'Interactive user session present', value: -0.04 },
    ],
    counterEvidence: [
      { check: 'Destination on sanctioned allow-list', result: 'Not matched', effect: 'none' },
      { check: 'Known software-update or sync agent signature', result: 'Not matched', effect: 'none' },
      { check: 'Interactive user session during activity', result: 'Observed', effect: '−0.04' },
      { check: 'Similar periodicity elsewhere in fleet (shared agent)', result: 'Not observed', effect: 'none' },
    ],
    data: {
      baseIntervals: BASE_INTERVALS,
      curIntervals: CUR_INTERVALS,
      // 30-day first-seen history: contacts per day to the destination
      contacts30d: [...Array(29).fill(0), 233],
      persistence: CUR_INTERVALS.map((v) => Math.abs(v - 4.0) <= 0.4),
    },
  },
  {
    id: 'DET-7744',
    name: 'Off-hours Periodic Connection',
    severity: 'high',
    confidence: 0.72,
    status: 'AWAITING TRIAGE',
    entity: 'ws-eng-221',
    target: '203.0.113.140:443',
    incident: 'INC-2051',
    firstSeen: '2026-10-01T02:41:31Z',
    lastSeen: '2026-10-01T02:41:42Z',
    model: 'periodicity-v3 · simulated',
    summary: 'Short 2-second check-in pattern to a new external address outside the host’s working hours. Too few intervals yet to be conclusive.',
  },
  {
    id: 'DET-7702',
    name: 'SMB Read Volume Spike',
    severity: 'medium',
    confidence: 0.77,
    status: 'LINKED · INC-2047',
    entity: 'srv-files-02',
    target: '\\\\srv-files-02\\finance-share',
    incident: 'INC-2047',
    firstSeen: '2026-09-30T10:44:38Z',
    lastSeen: '2026-09-30T10:45:03Z',
    model: 'volume-envelope-v2 · simulated',
    summary: '412 MB read by a single client in 25 seconds, 23× the hourly baseline.',
  },
  {
    id: 'DET-7738',
    name: 'Failed Authentication Burst',
    severity: 'low',
    confidence: 0.41,
    status: 'CLOSED · BENIGN',
    entity: 'ws-hr-008',
    target: 'CORP\\svc-account',
    incident: 'INC-2049',
    firstSeen: '2026-09-30T17:55:12Z',
    lastSeen: '2026-09-30T17:55:52Z',
    model: 'auth-sequence-v1 · simulated',
    summary: 'Five failures followed by a success from the same workstation — consistent with a mistyped password.',
  },
  {
    id: 'DET-7651',
    name: 'Volume Envelope Exceeded',
    severity: 'low',
    confidence: 0.33,
    status: 'CLOSED · BENIGN',
    entity: 'build-07',
    target: 'update-mirror.example:443',
    incident: 'INC-2039',
    firstSeen: '2026-09-28T01:10:02Z',
    lastSeen: '2026-09-28T01:52:19Z',
    model: 'volume-envelope-v2 · simulated',
    summary: 'Nightly build pulled 2.4× its usual package volume. Matched a scheduled dependency upgrade; closed as benign.',
  },
]

export const DETECTION_BY_ID = Object.fromEntries(DETECTIONS.map((d) => [d.id, d]))
