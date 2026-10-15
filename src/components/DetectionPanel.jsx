/**
 * Explainability breakdown: how each behavioral factor contributes to the
 * deviation score. The stacked rule at the top shows the composition; rows
 * below give the evidence behind each contribution.
 */
const TONES = ['var(--color-crit)', 'var(--color-amber)', 'color-mix(in oklab, var(--color-amber) 60%, var(--color-fg-3))', 'var(--color-fg-2)']

export default function DetectionPanel({ factors, threshold = 70, max = 100, showEvidence = true, compact = false, simulated = true }) {
  const total = factors.reduce((a, f) => a + f.value, 0)
  const over = total >= threshold
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">Total behavioral deviation</span>
        {simulated && <span className="mono text-[9.5px] tracking-wider text-fg-4">SIMULATED SCORING</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`mono tabular text-[34px] leading-none tracking-tight ${over ? 'text-crit' : total > 30 ? 'text-amber' : 'text-fg'}`}>{Math.round(total)}</span>
        <span className="mono text-[13px] text-fg-3">/ {max}</span>
        <span className="mono ml-auto text-[10.5px] text-fg-3">threshold {threshold}</span>
      </div>

      {/* Composition rule */}
      <div className="relative mt-3 h-[10px] w-full bg-line">
        <div className="absolute inset-y-0 left-0 flex" style={{ width: `${(total / max) * 100}%`, transition: 'width 200ms' }}>
          {factors.map((f, i) =>
            f.value > 0.2 ? <div key={f.id} style={{ flexGrow: f.value, background: TONES[i % TONES.length] }} className="h-full border-r border-ground last:border-0" /> : null,
          )}
        </div>
        <div className="absolute -bottom-1 -top-1 w-px bg-fg" style={{ left: `${(threshold / max) * 100}%` }} title={`Incident threshold ${threshold}`} />
      </div>

      <ol className={`${compact ? 'mt-3' : 'mt-5'} divide-y divide-line`}>
        {factors.map((f, i) => {
          const live = f.value > 0.2
          return (
            <li key={f.id} className={`py-2.5 ${live ? '' : 'opacity-40'}`}>
              <div className="flex items-baseline gap-3">
                <span className="h-2 w-2 shrink-0 translate-y-[-1px]" style={{ background: live ? TONES[i % TONES.length] : 'var(--color-line-strong)' }} />
                <span className="min-w-0 flex-1 text-[12.5px] text-fg">{f.label}</span>
                <span className="mono tabular text-[13px] text-fg">+{Math.round(f.value)}</span>
              </div>
              <div className="ml-5 mt-1.5 flex items-center gap-2">
                <div className="h-[3px] flex-1 bg-line">
                  <div className="h-full" style={{ width: `${(f.value / f.max) * 100}%`, background: TONES[i % TONES.length], transition: 'width 200ms' }} />
                </div>
                <span className="mono w-12 text-right text-[10px] text-fg-4">max {f.max}</span>
              </div>
              {showEvidence && <div className="mono ml-5 mt-1.5 text-[10.5px] leading-relaxed text-fg-3">{f.evidence}</div>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
