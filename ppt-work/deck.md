<!-- Slide number: 1 -->

MANIPAL

ACADEMY OF HIGHER EDUCATION
Institution of Embrace Diamant in the University
HackSprint

24-Hour Hackathon

17-18

VENUE DETAILS
SATURDAY
Manipal Academy of Higher Education (MAHE)
09 A.M. Onwards
OCTOBER

YOUR NAME:

TEAM NAME:

TRACK NO:

ORGANIZED BY:
REGISTER NOW

Team Size
1-4 Members
MANIPAL

ACADEMY OF HIGHER EDUCATION
Institution of Embrace Diamant in the University

<!-- Slide number: 2 -->

Solution

THE PROBLEM
Alert tools say that something fired, not how it developed. Analysts rebuild timelines by hand from scattered logs, and a black-box score earns little trust.
Network Flight Recorder
OUR APPROACH
Behavior instead of signatures, chronology instead of snapshots, and evidence instead of verdicts: every flag decomposes into named factors with the observed value and the baseline.
See the attack before it becomes the incident.
An investigation workstation for security analysts. It learns how every host, address and protocol normally behaves, flags when that behavior drifts, and replays the sequence second by second — with every score explained.

01
02
03
04
05
06
Normal behavior
Behavioral deviation
Anomaly detection
Event correlation
Attack timeline
Explainable investigation
7-day baseline per entity, matched to the same hours of day
Live flows measured in ? against that envelope
Deviation that persists, or meets a novel destination
Signals on one entity in one time window are linked
Sequence rebuilt second by second, routine traffic kept
Score split into named factors with their evidence
All telemetry in this build is simulated — the frontend demonstrates the workflow and performs no real threat detection.

<!-- Slide number: 3 -->

INC-2047 Replay
Demo scenario: finance workstation ws-fin-014 (10.24.18.42) starts checking in with a never-seen domain every 4 seconds, then reads 412 MB from a file server. Replay window: 30 Sep 2026, 10:40–10:47 UTC.

### Chart: Deviation score crosses the incident threshold at 10:44

| Category | Deviation score | Incident threshold (70) |
|---|---|---|
| 10:40:00 | 8.0 | 70.0 |
| 10:40:10 | 8.0 | 70.0 |
| 10:40:20 | 8.0 | 70.0 |
| 10:40:30 | 8.0 | 70.0 |
| 10:40:40 | 8.0 | 70.0 |
| 10:40:50 | 8.0 | 70.0 |
| 10:41:00 | 8.0 | 70.0 |
| 10:41:10 | 8.0 | 70.0 |
| 10:41:20 | 8.0 | 70.0 |
| 10:41:30 | 8.0 | 70.0 |
| 10:41:40 | 8.0 | 70.0 |
| 10:41:50 | 8.0 | 70.0 |
| 10:42:00 | 8.0 | 70.0 |
| 10:42:10 | 8.0 | 70.0 |
| 10:42:20 | 8.0 | 70.0 |
| 10:42:30 | 8.0 | 70.0 |
| 10:42:40 | 7.1 | 70.0 |
| 10:42:50 | 14.8 | 70.0 |
| 10:43:00 | 26.1 | 70.0 |
| 10:43:10 | 50.8 | 70.0 |
| 10:43:20 | 53.0 | 70.0 |
| 10:43:30 | 53.6 | 70.0 |
| 10:43:40 | 54.8 | 70.0 |
| 10:43:50 | 60.6 | 70.0 |
| 10:44:00 | 69.1 | 70.0 |
| 10:44:10 | 72.5 | 70.0 |
| 10:44:20 | 74.7 | 70.0 |
| 10:44:30 | 76.9 | 70.0 |
| 10:44:40 | 78.8 | 70.0 |
| 10:44:50 | 80.4 | 70.0 |
| 10:45:00 | 81.5 | 70.0 |
| 10:45:10 | 82.0 | 70.0 |
| 10:45:20 | 82.0 | 70.0 |
| 10:45:30 | 82.0 | 70.0 |
| 10:45:40 | 82.0 | 70.0 |
| 10:45:50 | 82.0 | 70.0 |
| 10:46:00 | 82.0 | 70.0 |
| 10:46:10 | 82.0 | 70.0 |
| 10:46:20 | 82.0 | 70.0 |
| 10:46:30 | 82.0 | 70.0 |
| 10:46:40 | 82.0 | 70.0 |
| 10:46:50 | 82.0 | 70.0 |
| 10:47:00 | 82.0 | 70.0 |10:40:00
NORMAL
Traffic inside the 7-day baseline
10:42:31
DEVIATION
Outbound rate 4.1/min vs 1.2 baseline
10:43:02
ANOMALY
First contact: cdn-sync.example on 8443/tcp
10:43:17
CORRELATION
Check-ins lock to 4.0 s ± 0.15 s
10:44:05
ESCALATION
Periodic-egress match; 412 MB SMB read
10:45:12
INCIDENT
Score 82 / 100 · confidence 0.82
Score 82 = outbound frequency +32 · destination novelty +21 · periodic timing +17 · unusual port +12. Scores are scripted demo values, not output of a trained model.

<!-- Slide number: 4 -->

Key Features

—
01
02
03
04
Landing page
Security Overview
Flight Recorder
Investigation
Behavioral Analysis
What is this product?
What is abnormal right now?
How did the incident develop?
Why was it flagged?
What moved from baseline?
Auto-playing, scrubbable replay of INC-2047
Zoomable network map, live event stream, 24h density
Drag a cursor: graph, events, score and explanation move together
Reconstruction timeline + factor breakdown + analyst notes
Deviation matrix and six-dimension fingerprint

05
06
07
08
09
Event Timeline
Network Entities
Detection Details
Investigation Report
Settings
What is the full record?
What do we know about each entity?
Is the detection logic sound?
What goes to stakeholders?
How is it configured?
Filters, search, time-range brush, j/k keys
Sortable table with profile side panel
Four reasoning steps with evidence charts
Seven-section forensic document, PDF export
Thresholds, sources, retention, backend status
Keyboard-first: 1–9 jump between sections · Space plays the replay · j / k move through rows · ? lists every shortcut.

<!-- Slide number: 5 -->

Tech Stack & Architecture

React 19
Vite 8
Component UI, hooks, context state
Dev server, hot reload, ~139 KB gzipped build

Tailwind CSS 4
React Router 7
Design tokens defined once in @theme
10 routes, deep links with ?id=
Engineering choices
One data hook. Every page reads through useResource(key) — switching to FastAPI is one setting, not ten pages.
Deterministic demo data. Seeded telemetry renders the same story on every run.
Hand-built SVG visuals. Network graph, recorder strip and baseline charts — no chart library.
Reusable components. NetworkGraph, RecorderStrip, Timeline, EventStream, EntityTable, DetectionPanel.
Resilient UI. Responsive from 768 to 1440 px; an error boundary contains page failures.

JavaScript (ES modules)
lucide-react
Plain JS, as the brief required
Minimal interface glyphs

Custom SVG
FastAPI · planned
Graph, replay strip, evidence charts
/api/events, /entities, /incidents, /behavior, /detections, /timeline

<!-- Slide number: 6 -->

Architecture

Pages · 10 routes in src/pages, rendered inside AppShell
Landing · Overview · Flight Recorder · Investigation · Behavior · Timeline · Entities · Detection · Report · Settings   —   shell adds sidebar, top bar, shortcuts, error boundary

renders
reads data
reads clock & prefs

Shared components   src/components
useResource(key)   src/api
AppState   src/state
NetworkGraph · RecorderStrip
Timeline · EventStream
EntityTable · DetectionPanel
BehaviorChart · FilterBar
Serves bundled demo data today
Calls /api/* once VITE_API_BASE is set
Falls back to demo data on failure
Simulated clock (UTC)
Analyst preferences in localStorage
Shortcut overlay, mobile navigation

today
when VITE_API_BASE is set

Demo telemetry   src/data
FastAPI backend   planned
INC-2047 replay · 109 events · entities · incidents · behavioral baselines
events · entities · incidents · behavior · detections · timeline

<!-- Slide number: 7 -->

Data Flow Diagram
How telemetry becomes an explained incident — the pipeline the frontend is built to display.

1
2
3
4
5
6
Telemetry sources
Behavior model
Deviation scoring
Correlator
Incidents & detections
FastAPI  /api/*
Zeek conn / dns / smb, NetFlow, directory auth, endpoint agent, reputation feed
7-day rolling baseline per entity, same hours of day
? per dimension: rate, destinations, ports, timing, volume, protocols
Links signals on one entity within a 15-minute window
Score = sum of named factors, plus confidence
events · entities · incidents · behavior · detections · timeline

Raw flow records
Events & detections
Incidents & reports

JSON
kept 14 days
kept 90 days
kept 1 year

In this build: stages 1–5 are simulated in src/data with seeded, deterministic telemetry. The frontend already reads them through useResource exactly as it will read /api/*.
React frontend (this project)
Overview · Flight Recorder · Investigation · Behavior · Timeline · Entities · Detection · Report

<!-- Slide number: 8 -->

Screenshot of Your Project

![overview.jpg](Picture154.jpg)

Security Overview
What is abnormal right now?
Behavioral activity map: critical entities in red, deviating flows in amber, normal traffic stays quiet
Zoom, pan and select an entity to open its profile in place
Time window 15 min – 24 h filters the flows shown
Live event stream with severity and confidence on every event
Open investigations, largest deviations and sensor posture below

<!-- Slide number: 9 -->

Flight Recorder

![recorder_crop.jpg](Picture154.jpg)

Phase rail
Replay strip
Synchronized panels
Six phases from Normal to Incident; click one to jump straight to it.
One lane per entity, one tick per flow. Ahead of the cursor stays dimmed.
Graph, event list, score and explanation all follow the cursor.

<!-- Slide number: 10 -->

Investigation & Detection

![investigation.jpg](Picture154.jpg)

![detection.jpg](Picture158.jpg)

Incident Investigation
Detection Details
Metadata, a chronological reconstruction with raw records, and “Why was this flagged?” — the 82/100 score split into four factors.
Four reasoning steps, each with observed vs baseline values and an evidence chart, plus confidence composition and counter-evidence checks.

<!-- Slide number: 11 -->

Others

10
15
Verified
Scrubbing moves time, phase, score (10 ? 53 ? 82), events and graph together
Incident ? detection links open the matching record
Every score equals the sum of its factors (82 and 61)
Zero console errors across all routes
screens: landing page plus nine workspace sections
bugs found and fixed in a scripted debug pass

Next steps
109
4
Build the FastAPI backend against the existing /api/* contract
Ingest real Zeek and NetFlow telemetry
Replace scripted scores with a trained baseline model
Check the printed PDF of the investigation report
simulated events in the forensic log
viewport widths verified (768–1440 px), no overflow

Honest limits: all telemetry is simulated and the frontend performs no live detection. Addresses use RFC 5737 ranges and .example domains.

RUN IT LOCALLY
npm install  ?  npm run dev  ?  localhost:5173
