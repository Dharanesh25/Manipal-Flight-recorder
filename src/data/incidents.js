// SIMULATED TELEMETRY — incident records.
export const INCIDENTS = [
  {
    id: 'INC-2051',
    title: 'Off-hours periodic outbound connection',
    severity: 'high',
    status: 'TRIAGE',
    opened: '2026-10-01T02:41:36Z',
    firstObserved: '2026-10-01T02:41:18Z',
    lastObserved: '2026-10-01T02:41:42Z',
    entities: ['ws-eng-221', '203.0.113.140'],
    protocols: ['TCP', 'HTTPS', 'DNS'],
    destinations: { total: 3, novel: 1 },
    deviation: 61,
    confidence: 0.79,
    detection: 'DET-7744',
    assignee: null,
  },
  {
    id: 'INC-2049',
    title: 'Failed authentication burst',
    severity: 'low',
    status: 'CLOSED · BENIGN',
    opened: '2026-09-30T17:56:01Z',
    firstObserved: '2026-09-30T17:55:12Z',
    lastObserved: '2026-09-30T17:55:52Z',
    entities: ['ws-hr-008'],
    protocols: ['KRB'],
    destinations: { total: 1, novel: 0 },
    deviation: 34,
    confidence: 0.41,
    detection: 'DET-7738',
    assignee: 'analyst-01',
  },
  {
    id: 'INC-2047',
    title: 'Unusual outbound communication pattern',
    severity: 'high',
    status: 'UNDER INVESTIGATION',
    opened: '2026-09-30T10:45:12Z',
    firstObserved: '2026-09-30T10:42:31Z',
    lastObserved: '2026-09-30T10:58:40Z',
    entities: ['ws-fin-014', '203.0.113.77', 'srv-files-02'],
    protocols: ['TCP', 'DNS', 'SMB', 'HTTPS'],
    destinations: { total: 4, novel: 1 },
    deviation: 82,
    confidence: 0.82,
    detection: 'DET-7731',
    assignee: 'analyst-03',
    containment: { ts: '2026-09-30T14:20:03Z', action: 'Network isolation via EDR (reversible)' },
  },
  {
    id: 'INC-2039',
    title: 'Build runner volume spike',
    severity: 'low',
    status: 'CLOSED · BENIGN',
    opened: '2026-09-28T01:14:40Z',
    firstObserved: '2026-09-28T01:10:02Z',
    lastObserved: '2026-09-28T01:52:19Z',
    entities: ['build-07'],
    protocols: ['HTTPS', 'SMB'],
    destinations: { total: 6, novel: 0 },
    deviation: 29,
    confidence: 0.33,
    detection: 'DET-7651',
    assignee: 'analyst-02',
  },
]

/** Factor breakdown for the still-developing INC-2051 (fewer intervals observed). */
export const INC_2051_FACTORS = [
  // Sums to the incident's deviation score (61)
  { id: 'offhours', label: 'Off-hours outbound frequency', max: 32, value: 30, evidence: '5.2 conn/min vs 0.2 baseline for 02:00–03:00' },
  { id: 'novelty', label: 'Destination novelty', max: 21, value: 20, evidence: '203.0.113.140 — no PTR, ASN new to fleet' },
  { id: 'periodic', label: 'Periodic communication pattern', max: 17, value: 11, evidence: '6 intervals at 2.0 s ± 0.21 s — below 12-interval minimum' },
  { id: 'port', label: 'Unusual port behavior', max: 12, value: 0, evidence: '443/tcp — consistent with host baseline' },
]

/** Observations that raise confidence without adding to the deviation score. */
export const SUPPORTING = {
  'INC-2047': [
    { label: 'SMB read volume spike on srv-files-02', detail: '412 MB in 25 s by ws-fin-014 · 23× hourly baseline', effect: '+0.12 confidence' },
    { label: 'Outbound bytes to 203.0.113.77 rose after SMB read', detail: '38 MB in 40 s · upload/download 31:1', effect: '+0.06 confidence' },
    { label: 'Destination reputation changed', detail: 'Simulated feed: unclassified → suspicious · domain age 4 days', effect: 'context only' },
  ],
  'INC-2051': [
    { label: 'Shape resembles INC-2047', detail: 'Novel destination + fixed interval · different host and port', effect: '+0.05 confidence' },
    { label: 'No interactive session on host', detail: 'Last console logon 18:41 · activity is unattended', effect: 'context only' },
  ],
}

export const INCIDENT_BY_ID =Object.fromEntries(INCIDENTS.map((i) => [i.id, i]))
