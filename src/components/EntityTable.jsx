import { ArrowDown, ArrowUp } from 'lucide-react'
import { fmtShortDate, fmtTime, fmtNum, fmtSigma } from '../lib/format'
import { RiskState } from './ui/Severity'
import Sparkline from './charts/Sparkline'

const COLUMNS = [
  { key: 'name', label: 'Entity', sortable: true },
  { key: 'type', label: 'Type', sortable: true, className: 'hidden md:table-cell' },
  { key: 'firstSeen', label: 'First seen', sortable: true, className: 'hidden 2xl:table-cell' },
  { key: 'lastSeen', label: 'Last seen', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'connections', label: 'Connections', sortable: true, align: 'right', className: 'hidden sm:table-cell' },
  { key: 'change', label: 'Behavior change', sortable: true },
  { key: 'risk', label: 'Risk state', sortable: true },
]

function ChangeCell({ z }) {
  const abs = Math.abs(z)
  const color = abs >= 5 ? 'bg-crit' : abs >= 2.5 ? 'bg-amber' : 'bg-fg-4'
  const text = abs >= 5 ? 'text-crit' : abs >= 2.5 ? 'text-amber' : 'text-fg-3'
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-[5px] w-16 bg-line">
        <div className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${Math.min(1, abs / 7) * 100}%` }} />
        <div className="absolute -top-0.5 h-[9px] w-px bg-fg-3" style={{ left: `${(2.5 / 7) * 100}%` }} title="2.5σ threshold" />
      </div>
      <span className={`mono tabular w-12 text-[11.5px] ${text}`}>{fmtSigma(z)}</span>
    </div>
  )
}

/**
 * Dense, sortable entity table. Rows are selectable; keyboard navigation is
 * handled by the page (j/k) and reflected through `selectedId`.
 */
export default function EntityTable({ entities, sort, onSort, selectedId, onSelect, narrow = false }) {
  const cols = narrow ? COLUMNS.filter((c) => c.key !== 'type') : COLUMNS
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead className="sticky top-0 z-10 bg-ground">
        <tr className="border-b border-line-strong">
          {cols.map((c) => {
            const active = sort.key === c.key
            return (
              <th key={c.key} className={`label whitespace-nowrap px-3 py-2 text-left font-normal first:pl-6 ${c.align === 'right' ? 'text-right' : ''} ${c.className ?? ''}`}>
                <button
                  onClick={() => onSort(c.key)}
                  className={`inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-fg ${active ? 'text-fg' : ''}`}
                >
                  {c.label}
                  {active && (sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                </button>
              </th>
            )
          })}
          <th className="label hidden whitespace-nowrap px-3 py-2 pr-6 text-left font-normal min-[1800px]:table-cell">24h activity</th>
        </tr>
      </thead>
      <tbody>
        {entities.map((e) => {
          const selected = e.id === selectedId
          return (
            <tr
              key={e.id}
              onClick={() => onSelect(e.id)}
              aria-selected={selected}
              className={`cursor-pointer border-b border-line/70 transition-colors ${selected ? 'bg-hover' : 'hover:bg-raised'}`}
            >
              <td className="relative w-full max-w-0 py-2 pl-6 pr-3">
                {selected && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
                <div className="mono truncate text-[12px] text-fg">{e.name}</div>
                <div className="mono mt-0.5 truncate text-[10.5px] text-fg-4">{e.type === 'HOST' ? `${e.address} · ${e.role}` : e.role}</div>
              </td>
              {!narrow && <td className="mono hidden px-3 text-[10.5px] tracking-wider text-fg-3 md:table-cell">{e.type}</td>}
              <td className="mono hidden whitespace-nowrap px-3 text-[11px] text-fg-3 2xl:table-cell">
                {fmtShortDate(e.firstSeen)} <span className="text-fg-4">{e.firstSeen.slice(0, 4)}</span>
              </td>
              <td className="mono hidden whitespace-nowrap px-3 text-[11px] text-fg-2 lg:table-cell">
                {fmtShortDate(e.lastSeen)} <span className="text-fg-3">{fmtTime(e.lastSeen)}</span>
              </td>
              <td className="mono tabular hidden px-3 text-right text-[11.5px] text-fg-2 sm:table-cell">{fmtNum(e.connections)}</td>
              <td className="px-3">
                <ChangeCell z={e.change} />
              </td>
              <td className="whitespace-nowrap px-3 pr-6">
                <RiskState risk={e.risk} />
              </td>
              <td className="hidden px-3 pr-6 min-[1800px]:table-cell">
                <Sparkline values={e.spark} width={88} height={18} color={e.risk === 'critical' ? 'var(--color-crit)' : e.risk === 'suspicious' ? 'var(--color-amber)' : 'var(--color-fg-3)'} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
