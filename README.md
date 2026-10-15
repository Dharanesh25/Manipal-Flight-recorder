# Network Flight Recorder — frontend

An investigation workstation for behavioral network forensics:

**normal behavior → behavioral deviation → anomaly → correlation → attack timeline → explainable investigation**

> All telemetry in this build is **simulated**. External addresses use RFC 5737
> documentation ranges and the `.example` TLD. Scores and weights are scripted
> to illustrate explainable detection — no live traffic is analysed.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
```

## Pages

| Route | Page |
|---|---|
| `/` | Product introduction with a live, scrubbable replay of INC-2047 |
| `/app` | Security overview — behavioral activity map, event density, live stream |
| `/app/recorder` | **Flight Recorder** — replay a sequence; graph, events, score and explanation follow the cursor |
| `/app/investigation` | Incident workspace — metadata, reconstruction, “why was this flagged?” |
| `/app/behavior` | Behavioral baselines — deviation matrix and six-dimension fingerprint |
| `/app/timeline` | Forensic timeline — filterable, keyboard-navigable event log |
| `/app/entities` | Entity intelligence — sortable table with contextual side panel |
| `/app/detection` | Detection details — reasoning steps with evidence, confidence composition |
| `/app/report` | Investigation report (print / save as PDF) |
| `/app/settings` | Model, sources, retention, thresholds, preferences, system status |

## Keyboard

`1`–`9` jump to section · `?` shortcuts · `[` collapse sidebar · `Esc` close panel
Flight Recorder: `Space` play/pause · `←/→` 1 s · `Shift+←/→` previous/next event · `P` next phase · `Home/End`
Lists: `j/k` move · `Enter` expand · `/` filter

## Structure

```
src/
  api/          client.js (endpoint map + demo fallback), useResource.js
  data/         simulated telemetry: entities, replay (INC-2047), events, incidents,
                behavior baselines, detections, system
  components/   Sidebar, TopBar, NetworkGraph, RecorderStrip, Timeline, EventStream,
                EntityTable, DetectionPanel, BehaviorChart, IncidentPanel,
                MetricDisplay, FilterBar, EntityContext, charts/, ui/, layout/
  pages/        one file per route
  state/        AppState (simulated clock, preferences)
  lib/          formatting, deterministic RNG, hooks
```

## Connecting a FastAPI backend

The UI reads through `useResource(key)`. With no backend configured it serves the
bundled demo data. To switch, set `VITE_API_BASE` (or `VITE_USE_API=true` to use the
dev proxy at `/api` → `http://localhost:8000`, overridable with `NFR_BACKEND`).

| Endpoint | Shape expected (see `src/data/*` for the exact fields) |
|---|---|
| `GET /api/events` | `Event[]` — `{ id, ts, title, type, entity, severity, confidence, source, detail, raw? }` |
| `GET /api/entities` | `{ entities: Entity[], flows: Flow[] }` |
| `GET /api/incidents` | `Incident[]` |
| `GET /api/behavior` | `{ [entityId]: Profile }` — baseline envelopes + current series per dimension |
| `GET /api/detections` | `Detection[]` with `reasoning`, `confidenceParts`, `counterEvidence` |
| `GET /api/timeline` | `{ base, duration, phases, events }` for a replay window |

If a request fails, the page falls back to demo data and reports `source: 'demo-fallback'`.
