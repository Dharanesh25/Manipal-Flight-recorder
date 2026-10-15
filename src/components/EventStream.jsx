import { fmtTime } from '../lib/format'
import { SeverityTag } from './ui/Severity'
import { Confidence } from './ui/Primitives'

/**
 * Chronological event list for rails and side panels.
 * Each row: timestamp · event type · entity · severity · confidence.
 */
export default function EventStream({ events, selectedId, onSelect, activeId, dimRoutine = true, showDetail = false, emptyText = 'No events in range.' }) {
  if (!events.length) return <div className="px-4 py-6 text-[12px] text-fg-4">{emptyText}</div>
  return (
    <ol className="divide-y divide-line/80">
      {events.map((e) => {
        const quiet = dimRoutine && e.severity === 'info'
        const selected = e.id === selectedId
        const active = e.id === activeId
        return (
          <li key={e.id} className={e.fresh ? 'nfr-enter' : ''}>
            <button
              onClick={() => onSelect?.(e)}
              className={`group relative grid w-full grid-cols-[4.1rem_1fr] gap-x-3 px-4 py-2.5 text-left transition-colors ${
                selected ? 'bg-hover' : 'hover:bg-raised'
              }`}
            >
              {(active || selected) && <span className={`absolute inset-y-0 left-0 w-[2px] ${active ? 'bg-signal' : 'bg-fg-3'}`} />}
              <span className={`mono tabular pt-px text-[11px] ${quiet ? 'text-fg-4' : 'text-fg-2'}`}>{fmtTime(e.ts)}</span>
              <span className="min-w-0">
                <span className={`block truncate text-[12.5px] leading-snug ${quiet ? 'text-fg-3' : 'text-fg'}`}>{e.title}</span>
                <span className="mt-1 flex items-center gap-3">
                  <span className="mono truncate text-[10.5px] text-fg-3">{e.entity}</span>
                  <span className="mono text-[10px] uppercase tracking-wide text-fg-4">{e.type}</span>
                </span>
                {showDetail && e.detail && !quiet && <span className="mono mt-1 block text-[10.5px] leading-relaxed text-fg-4">{e.detail}</span>}
                {!quiet && (
                  <span className="mt-1.5 flex items-center justify-between gap-3">
                    <SeverityTag level={e.severity} />
                    <Confidence value={e.confidence} />
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
