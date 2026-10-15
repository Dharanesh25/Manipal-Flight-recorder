import { useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import { ForensicTimeline } from '../components/Timeline'
import { PageHeader, Segmented, DemoTag } from '../components/ui/Primitives'
import { useResource } from '../api/useResource'
import { useHotkeys } from '../lib/hooks'
import { fmtTime, fmtShortDate } from '../lib/format'
import { EVENT_CATEGORIES } from '../data/events'

const BUCKET_MIN = 20

/** Event density over the full log; click a bucket to constrain the range. */
function DensityBrush({ events, range, onRange }) {
  const start = Math.floor(new Date(events[0].ts).getTime() / 3600000) * 3600000
  const end = new Date(events[events.length - 1].ts).getTime()
  const span = BUCKET_MIN * 60000
  const n = Math.ceil((end - start) / span) + 1
  const buckets = useMemo(() => {
    const b = Array.from({ length: n }, (_, i) => ({ from: start + i * span, total: 0, sev: 0 }))
    const rank = { info: 0, low: 1, medium: 2, high: 3, critical: 4 }
    for (const e of events) {
      const i = Math.floor((new Date(e.ts).getTime() - start) / span)
      b[i].total++
      b[i].sev = Math.max(b[i].sev, rank[e.severity])
    }
    return b
  }, [events, n, start, span])
  const max = Math.max(...buckets.map((b) => b.total))
  const [hover, setHover] = useState(null)
  const marks = buckets.filter((b) => new Date(b.from).getUTCMinutes() === 0 && new Date(b.from).getUTCHours() % 3 === 0)

  return (
    <div className="relative px-6 pb-2 pt-4">
      <div className="flex h-14 items-end gap-px" title="Bar height ∝ √(event count)">
        {buckets.map((b, i) => {
          const inRange = range && b.from >= range[0] && b.from < range[1]
          const color = b.sev >= 4 ? 'bg-crit' : b.sev >= 2 ? 'bg-amber' : inRange ? 'bg-fg-2' : 'bg-fg-4/60'
          return (
            <button
              key={i}
              onClick={() => onRange(inRange ? null : [b.from, b.from + span])}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex h-full flex-1 items-end ${range && !inRange ? 'opacity-40' : ''}`}
              aria-label={`${fmtTime(new Date(b.from).toISOString())} · ${b.total} events`}
            >
              <span className={`block w-full ${hover === i ? 'bg-fg' : color}`} style={{ height: `${Math.sqrt(b.total / max) * 100}%`, minHeight: b.total ? 2 : 0 }} />
            </button>
          )
        })}
      </div>
      <div className="relative mt-1 h-3">
        {marks.map((b) => (
          <span key={b.from} className="mono absolute -translate-x-1/2 text-[9.5px] text-fg-4" style={{ left: `${((b.from - start) / (n * span)) * 100}%` }}>
            {fmtTime(new Date(b.from).toISOString()).slice(0, 5)}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div className="mono pointer-events-none absolute top-0 z-10 whitespace-nowrap border border-line-strong bg-raised px-2 py-1 text-[10.5px] text-fg-2" style={{ left: `min(calc(${(hover / n) * 100}% + 1.5rem), calc(100% - 12rem))` }}>
          {fmtShortDate(new Date(buckets[hover].from).toISOString())} {fmtTime(new Date(buckets[hover].from).toISOString()).slice(0, 5)} · {buckets[hover].total} events
        </div>
      )}
    </div>
  )
}

export default function EventTimeline() {
  const { data: events } = useResource('events')
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState('desc')
  const [hideRoutine, setHideRoutine] = useState(false)
  const [range, setRange] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [cursor, setCursor] = useState(0)
  const searchRef = useRef(null)

  const counts = useMemo(() => {
    const c = { All: events.length, Critical: events.filter((e) => e.severity === 'critical').length }
    for (const k of EVENT_CATEGORIES) c[k] = events.filter((e) => e.type === k).length
    return c
  }, [events])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = events.filter((e) => {
      if (filter === 'Critical' ? e.severity !== 'critical' : filter !== 'All' && e.type !== filter) return false
      if (hideRoutine && e.severity === 'info') return false
      if (range) {
        const t = new Date(e.ts).getTime()
        if (t < range[0] || t >= range[1]) return false
      }
      if (q && !`${e.title} ${e.entity} ${e.detail} ${e.id} ${e.source}`.toLowerCase().includes(q)) return false
      return true
    })
    return order === 'desc' ? list.slice().reverse() : list
  }, [events, filter, query, order, hideRoutine, range])

  const cursorId = filtered[Math.min(cursor, filtered.length - 1)]?.id
  useHotkeys(
    {
      j: () => setCursor((c) => Math.min(filtered.length - 1, c + 1)),
      k: () => setCursor((c) => Math.max(0, c - 1)),
      Enter: () => cursorId && setExpandedId((x) => (x === cursorId ? null : cursorId)),
      '/': () => searchRef.current?.focus(),
      Escape: () => setExpandedId(null),
    },
    [filtered, cursorId],
  )

  const filters = [
    { value: 'All', label: 'All', count: counts.All },
    ...EVENT_CATEGORIES.map((k) => ({ value: k, label: k, count: counts[k] })),
    { value: 'Critical', label: 'Critical', count: counts.Critical, tone: 'bg-crit' },
  ]

  return (
    <div className="min-h-full">
      <PageHeader kicker="05 · Event timeline" title="Forensic timeline" subtitle="Every recorded event, in order. Routine telemetry is kept so signals can be read in context.">
        <DemoTag />
      </PageHeader>

      <div className="border-b border-line">
        <DensityBrush events={events} range={range} onRange={setRange} />
      </div>

      <div className="border-b border-line px-6 pt-1">
        <FilterBar
          ref={searchRef}
          filters={filters}
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setCursor(0)
          }}
          query={query}
          onQuery={(v) => {
            setQuery(v)
            setCursor(0)
          }}
          placeholder="entity, IP, event ID…"
        >
          <Segmented
            options={[
              { value: false, label: 'ALL' },
              { value: true, label: 'NO ROUTINE' },
            ]}
            value={hideRoutine}
            onChange={setHideRoutine}
          />
          <Segmented
            options={[
              { value: 'desc', label: 'NEWEST' },
              { value: 'asc', label: 'OLDEST' },
            ]}
            value={order}
            onChange={setOrder}
          />
        </FilterBar>
      </div>

      <div className="mono flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2 text-[10.5px] text-fg-4">
        <span>
          <span className="text-fg-2">{filtered.length}</span> of {events.length} events
        </span>
        {range && (
          <button onClick={() => setRange(null)} className="flex items-center gap-1.5 border border-line-strong px-1.5 py-0.5 text-fg-2 hover:text-fg">
            {fmtShortDate(new Date(range[0]).toISOString())} {fmtTime(new Date(range[0]).toISOString()).slice(0, 5)}–{fmtTime(new Date(range[1]).toISOString()).slice(0, 5)}
            <X size={11} />
          </button>
        )}
        <span className="ml-auto hidden sm:inline">j / k move · enter expand · / filter</span>
      </div>

      {filtered.length ? (
        <ForensicTimeline events={filtered} expandedId={expandedId} onToggle={(id) => setExpandedId((x) => (x === id ? null : id))} cursorId={cursorId} />
      ) : (
        <p className="px-6 py-10 text-[13px] text-fg-3">No events match these filters.</p>
      )}
    </div>
  )
}
