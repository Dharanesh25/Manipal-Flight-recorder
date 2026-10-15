/** Product mark: a flat trace with a single deviation and an event marker. */
export function Glyph({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M2 20h8l3-9 4 14 3-8h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="20" cy="17" r="2.8" fill="var(--color-crit)" />
    </svg>
  )
}

export default function Wordmark({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-fg">
      <Glyph size={18} />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[13px] font-semibold tracking-[-0.01em]">Flight Recorder</span>
          <span className="mono mt-[3px] block text-[9px] tracking-[0.16em] text-fg-4">NETWORK · NFR</span>
        </span>
      )}
    </span>
  )
}
