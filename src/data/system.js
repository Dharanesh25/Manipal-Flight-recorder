// SIMULATED TELEMETRY — sensor and pipeline status.
export const SYSTEM_STATUS = {
  environment: 'PRODUCTION',
  sensor: 'SENSOR-01',
  monitoring: 'ACTIVE',
  model: 'STABLE',
  modelVersion: 'behavior-baseline 3.2.1 (simulated)',
  lastDetection: '2026-10-01T02:41:18Z',
  coverage: 0.947,
  ingestLagMs: 840,
  entitiesTracked: 1912,
  baselineWindowDays: 7,
}

export const TELEMETRY_SOURCES = [
  { id: 'zeek-conn', name: 'Zeek conn.log', kind: 'Network flows', source: 'tap · gw-edge-01', eps: 1840, coverage: 0.99, state: 'ok' },
  { id: 'zeek-dns', name: 'Zeek dns.log', kind: 'DNS', source: 'tap · dns-int-01', eps: 620, coverage: 0.98, state: 'ok' },
  { id: 'zeek-smb', name: 'Zeek smb_files.log', kind: 'File access', source: 'span · core-sw-02', eps: 210, coverage: 0.93, state: 'ok' },
  { id: 'netflow', name: 'NetFlow v9', kind: 'Flow summaries', source: 'gw-edge-01', eps: 3900, coverage: 0.97, state: 'ok' },
  { id: 'ad-auth', name: 'Directory auth events', kind: 'Authentication', source: 'dc-01 · forwarder', eps: 95, coverage: 0.96, state: 'ok' },
  { id: 'edr', name: 'Endpoint agent', kind: 'Process / containment', source: '1,804 of 1,912 hosts', eps: 470, coverage: 0.94, state: 'degraded' },
  { id: 'intel', name: 'Reputation feed', kind: 'Enrichment', source: 'simulated feed', eps: 2, coverage: 1, state: 'simulated' },
]

export const COVERAGE_GAPS = [
  { segment: 'Guest Wi-Fi 10.40.0.0/16', reason: 'Out of sensor scope' },
  { segment: '108 hosts without endpoint agent', reason: 'Lab / legacy devices' },
  { segment: 'gw-edge-01 tap 22:10–22:13', reason: '0.8% packet loss' },
]
