import { forwardRef } from 'react'
import { Search } from 'lucide-react'

/**
 * Category tabs with counts, an optional search field and trailing controls.
 * `filters`: [{ value, label, count }]
 */
const FilterBar = forwardRef(function FilterBar(
  { filters, value, onChange, query, onQuery, placeholder = 'Filter…', children, className = '' },
  searchRef,
) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      <div className="-mb-px flex flex-wrap items-center" role="tablist">
        {filters.map((f) => {
          const active = f.value === value
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(f.value)}
              className={`group relative flex h-8 items-center gap-1.5 px-2.5 text-[12.5px] transition-colors ${
                active ? 'text-fg' : 'text-fg-3 hover:text-fg'
              }`}
            >
              {f.tone && <span className={`h-1.5 w-1.5 ${f.tone}`} />}
              {f.label}
              {f.count !== undefined && <span className="mono tabular text-[10.5px] text-fg-4 group-hover:text-fg-3">{f.count}</span>}
              <span className={`absolute inset-x-2 -bottom-px h-px ${active ? 'bg-fg' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {onQuery && (
          <label className="flex h-7 w-56 items-center gap-2 border border-line bg-panel px-2 focus-within:border-fg-4">
            <Search size={13} className="shrink-0 text-fg-4" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={placeholder}
              className="mono min-w-0 flex-1 bg-transparent text-[11.5px] text-fg placeholder:text-fg-4 focus:outline-none"
            />
            <span className="mono text-[10px] text-fg-4">/</span>
          </label>
        )}
        {children}
      </div>
    </div>
  )
})

export default FilterBar
