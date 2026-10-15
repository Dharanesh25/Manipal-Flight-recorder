// API client. The frontend is shaped for a FastAPI backend exposing:
//   GET /api/events      GET /api/entities    GET /api/incidents
//   GET /api/behavior    GET /api/detections  GET /api/timeline
//
// Until a backend is configured (VITE_API_BASE or VITE_USE_API=true), every
// call resolves to the bundled demo telemetry and is flagged `source: 'demo'`.
import { EVENT_LOG } from '../data/events'
import { ENTITIES, FLOWS } from '../data/entities'
import { INCIDENTS } from '../data/incidents'
import { PROFILES } from '../data/behavior'
import { DETECTIONS } from '../data/detections'
import { REPLAY_EVENTS, PHASES, REPLAY_BASE, REPLAY_DURATION } from '../data/replay'
import { SYSTEM_STATUS, TELEMETRY_SOURCES } from '../data/system'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
export const API_ENABLED = Boolean(import.meta.env.VITE_API_BASE) || import.meta.env.VITE_USE_API === 'true'

export const DEMO = {
  events: EVENT_LOG,
  entities: { entities: ENTITIES, flows: FLOWS },
  incidents: INCIDENTS,
  behavior: PROFILES,
  detections: DETECTIONS,
  timeline: { base: REPLAY_BASE, duration: REPLAY_DURATION, phases: PHASES, events: REPLAY_EVENTS },
  system: { status: SYSTEM_STATUS, sources: TELEMETRY_SOURCES },
}

export const ENDPOINTS = {
  events: '/api/events',
  entities: '/api/entities',
  incidents: '/api/incidents',
  behavior: '/api/behavior',
  detections: '/api/detections',
  timeline: '/api/timeline',
  system: '/api/system',
}

export async function fetchResource(key, { signal } = {}) {
  if (!API_ENABLED) return { data: DEMO[key], source: 'demo' }
  const res = await fetch(`${API_BASE}${ENDPOINTS[key]}`, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${ENDPOINTS[key]} → HTTP ${res.status}`)
  return { data: await res.json(), source: 'api' }
}
