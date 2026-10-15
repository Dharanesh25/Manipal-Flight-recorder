import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Uppercase section label with optional right-hand slot and hairline rule. */
export function SectionHeader({ label, meta, children, className = '', rule = true }) {
  return (
    <div className={`flex items-center gap-3 ${rule ? 'border-b border-line pb-2' : ''} ${className}`}>
      <h2 className="label shrink-0 !text-fg-2">{label}</h2>
      {meta && <span className="mono truncate text-[10.5px] text-fg-4">{meta}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}

/** Small "simulated" disclosure. Used wherever numbers could be mistaken for live output. */
export function DemoTag({ children = 'SIMULATED TELEMETRY', className = '' }) {
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 border border-dashed border-line-strong px-1.5 py-[1px] text-[9.5px] tracking-[0.12em] text-fg-3 ${className}`}
      title="Demo data bundled with the frontend. No live traffic is analysed."
    >
      {children}
    </span>
  )
}

export function Kbd({ children }) {
  return (
    <kbd className="mono inline-flex h-[18px] min-w-[18px] items-center justify-center border border-line-strong bg-raised px-1 text-[10px] text-fg-2">
      {children}
    </kbd>
  )
}

/** Key/value row for metadata lists. */
export function Field({ label, children, mono = true, stack = false, className = '' }) {
  return (
    <div className={`grid items-baseline border-b border-line/70 py-[7px] last:border-0 ${stack ? 'grid-cols-1 gap-1.5' : 'grid-cols-[minmax(0,8rem)_1fr] gap-3'} ${className}`}>
      <dt className="text-[12px] text-fg-3">{label}</dt>
      <dd className={`min-w-0 text-[12.5px] text-fg ${mono ? 'mono' : ''}`}>{children}</dd>
    </div>
  )
}

/** Segmented control — the app's single toggle-group idiom. */
export function Segmented({ options, value, onChange, size = 'sm', className = '' }) {
  return (
    <div className={`inline-flex border border-line ${className}`} role="tablist">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        const active = v === value
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`mono border-r border-line px-2 last:border-r-0 ${size === 'sm' ? 'h-6 text-[10.5px]' : 'h-7 text-[11px]'} tracking-wide transition-colors ${
              active ? 'bg-ivory text-ink' : 'text-fg-3 hover:bg-hover hover:text-fg'
            }`}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

export function Button({ children, variant = 'ghost', className = '', ...rest }) {
  const styles = {
    primary: 'bg-ivory text-ink hover:bg-paper border border-ivory',
    ghost: 'border border-line-strong text-fg-2 hover:text-fg hover:border-fg-4 hover:bg-hover',
    quiet: 'text-fg-3 hover:text-fg hover:bg-hover border border-transparent',
  }
  return (
    <button
      className={`inline-flex h-8 items-center gap-2 px-3 text-[12.5px] font-medium transition-colors disabled:opacity-40 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Thin horizontal meter (0–1). */
export function Meter({ value, tone = 'fg', className = '', height = 3 }) {
  const color = { fg: 'bg-fg-2', amber: 'bg-amber', crit: 'bg-crit', ok: 'bg-ok' }[tone]
  return (
    <div className={`relative w-full bg-line ${className}`} style={{ height }}>
      <div className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

/** Confidence as a value plus a 10-step tick meter. */
export function Confidence({ value, showBar = true, className = '' }) {
  const steps = Math.round(value * 10)
  const tone = value >= 0.75 ? 'var(--color-fg)' : value >= 0.5 ? 'var(--color-fg-2)' : 'var(--color-fg-3)'
  // 10 tick marks drawn as a repeating gradient (2 elements instead of 10 per row)
  const ticks = (c) => `repeating-linear-gradient(to right, ${c} 0 2px, transparent 2px 4px)`
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showBar && (
        <span className="relative h-[9px] w-[38px]" style={{ background: ticks('var(--color-line-strong)') }} aria-hidden>
          <span className="absolute inset-y-0 left-0" style={{ width: steps * 4, background: ticks(tone) }} />
        </span>
      )}
      <span className="mono tabular text-[11px] text-fg-2">{(value * 100).toFixed(0)}%</span>
    </span>
  )
}

/** Right-hand contextual panel. Esc closes. */
export function SidePanel({ open, onClose, title, kicker, children, width = 'w-[420px]', fixed = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <aside
      className={`nfr-slide ${fixed ? 'fixed bottom-0 top-12' : 'absolute inset-y-0'} right-0 z-30 flex max-w-full flex-col border-l border-line-strong bg-panel ${width}`}
      aria-label={typeof title === 'string' ? title : 'Details'}
    >
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          {kicker && <div className="label mb-1">{kicker}</div>}
          <div className="truncate text-[15px] font-medium text-fg">{title}</div>
        </div>
        <button onClick={onClose} className="ml-auto p-1 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Close panel (Esc)">
          <X size={15} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  )
}

/** Page heading used inside the app shell. */
export function PageHeader({ kicker, title, subtitle, children }) {
  return (
    <header className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-line px-6 pb-4 pt-5">
      <div className="min-w-0">
        {kicker && <div className="label mb-1.5">{kicker}</div>}
        <h1 className="text-[22px] font-medium leading-tight tracking-[-0.01em] text-fg">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-fg-3">{subtitle}</p>}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </header>
  )
}
