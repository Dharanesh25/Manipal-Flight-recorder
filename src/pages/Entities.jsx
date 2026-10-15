import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterBar from '../components/FilterBar'
import EntityTable from '../components/EntityTable'
import EntityContext from '../components/EntityContext'
import { PageHeader, Segmented, SidePanel, DemoTag } from '../components/ui/Primitives'
import { useResource } from '../api/useResource'
import { useHotkeys } from '../lib/hooks'
import { RISK_ORDER } from '../data/entities'

const TYPES = ['HOST', 'IP', 'DOMAIN', 'PORT', 'PROTOCOL']
const TYPE_LABEL = { HOST: 'Hosts', IP: 'IPs', DOMAIN: 'Domains', PORT: 'Ports', PROTOCOL: 'Protocols' }

export default function Entities() {
  const [params, setParams] = useSearchParams()
  const { data } = useResource('entities')
  const { data: events } = useResource('events')
  const { data: profiles } = useResource('behavior')
  const { entities, flows } = data

  const [type, setType] = useState('All')
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('all')
  const [sort, setSort] = useState({ key: 'risk', dir: 'asc' })
  const searchRef = useRef(null)
  const selectedId = params.get('id')
  const select = (id) => setParams(id ? { id } : {}, { replace: true })

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = entities.filter(
      (e) =>
        (type === 'All' || e.type === type) &&
        (risk === 'all' || e.risk !== 'normal') &&
        (!q || `${e.name} ${e.address} ${e.role}`.toLowerCase().includes(q)),
    )
    const dir = sort.dir === 'asc' ? 1 : -1
    const val = (e) => (sort.key === 'risk' ? RISK_ORDER[e.risk] * 100 - e.change : sort.key === 'change' ? Math.abs(e.change) : e[sort.key])
    return list.sort((a, b) => {
      const va = val(a)
      const vb = val(b)
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * dir
    })
  }, [entities, type, risk, query, sort])

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'change' || key === 'connections' || key === 'lastSeen' ? 'desc' : 'asc' }))

  const idx = rows.findIndex((r) => r.id === selectedId)
  useHotkeys(
    {
      j: () => rows.length && select(rows[Math.min(rows.length - 1, idx + 1)].id),
      k: () => rows.length && select(rows[Math.max(0, idx - 1)].id),
      '/': () => searchRef.current?.focus(),
      Escape: () => select(null),
    },
    [rows, idx],
  )

  const selected = entities.find((e) => e.id === selectedId)
  const selectedFlows = selected ? flows.filter((f) => f.from === selected.id || f.to === selected.id) : []
  const selectedEvents = selected ? events.filter((e) => e.entity === selected.id).slice(-8).reverse() : []

  const counts = Object.fromEntries(TYPES.map((t) => [t, entities.filter((e) => e.type === t).length]))
  const atRisk = entities.filter((e) => e.risk === 'critical' || e.risk === 'suspicious').length

  return (
    <div className={`min-h-full transition-[padding] duration-150 ${selected ? 'xl:pr-[420px]' : ''}`}>
      <PageHeader kicker="06 · Network entities" title="Entity intelligence" subtitle="Hosts, addresses, domains, ports and protocols observed by the sensor, ranked by how far their behavior has moved from baseline.">
        <span className="mono text-[11px] text-fg-3">
          <span className="text-amber">{atRisk}</span> at risk · {entities.length} tracked
        </span>
        <DemoTag />
      </PageHeader>

      <div className="border-b border-line px-6 pt-1">
        <FilterBar
          ref={searchRef}
          filters={[{ value: 'All', label: 'All', count: entities.length }, ...TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t], count: counts[t] }))]}
          value={type}
          onChange={setType}
          query={query}
          onQuery={setQuery}
          placeholder="name, address, role…"
        >
          <Segmented
            options={[
              { value: 'all', label: 'ALL' },
              { value: 'risk', label: 'DEVIATING' },
            ]}
            value={risk}
            onChange={setRisk}
          />
        </FilterBar>
      </div>

      {rows.length ? (
        <EntityTable narrow={!!selected} entities={rows} sort={sort} onSort={onSort} selectedId={selectedId} onSelect={(id) => select(id === selectedId ? null : id)} />
      ) : (
        <p className="px-6 py-10 text-[13px] text-fg-3">No entities match.</p>
      )}
      <p className="mono px-6 py-3 text-[10.5px] text-fg-4">Behavior change = largest deviation across fingerprint dimensions, in σ from the entity’s own baseline. Bar tick marks the 2.5σ threshold. j / k to move · Esc to close.</p>

      <SidePanel
        open={!!selected}
        onClose={() => select(null)}
        kicker={`${selected?.type ?? ''} · entity profile`}
        title={<span className="mono">{selected?.name}</span>}
        fixed
      >
        {selected && <EntityContext entity={selected} flows={selectedFlows} events={selectedEvents} profile={profiles[selected.id] ?? null} />}
      </SidePanel>
    </div>
  )
}
