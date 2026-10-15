import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Kbd } from '../ui/Primitives'
import { NAV } from './nav'

const GROUPS = [
  {
    title: 'Global',
    items: [
      [['1', '…', '9'], 'Jump to section'],
      [['['], 'Collapse sidebar'],
      [['?'], 'Show this panel'],
      [['Esc'], 'Close panel / clear selection'],
    ],
  },
  {
    title: 'Flight Recorder',
    items: [
      [['Space'], 'Play / pause replay'],
      [['←', '→'], 'Step 1 s'],
      [['Shift', '←/→'], 'Jump to previous / next event'],
      [['Home', 'End'], 'Start / end of window'],
      [['P'], 'Next phase'],
    ],
  },
  {
    title: 'Lists & tables',
    items: [
      [['J', 'K'], 'Next / previous row'],
      [['Enter'], 'Expand / open row'],
      [['/'], 'Focus filter'],
    ],
  },
]

export default function ShortcutOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="absolute inset-0 bg-ground/75" onClick={onClose} />
      <div className="nfr-enter relative w-full max-w-2xl border border-line-strong bg-panel">
        <div className="flex items-center border-b border-line px-5 py-3">
          <span className="label !text-fg-2">Keyboard shortcuts</span>
          <button onClick={onClose} className="ml-auto p-1 text-fg-3 hover:text-fg" aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="label mb-2">{g.title}</h3>
              <ul className="divide-y divide-line">
                {g.items.map(([keys, desc]) => (
                  <li key={desc} className="flex items-center justify-between gap-4 py-1.5 text-[12.5px] text-fg-2">
                    {desc}
                    <span className="flex gap-1">
                      {keys.map((k) => (k === '…' ? <span key={k} className="text-fg-4">…</span> : <Kbd key={k}>{k}</Kbd>))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section>
            <h3 className="label mb-2">Sections</h3>
            <ul className="mono grid grid-cols-1 gap-y-1 text-[11.5px] text-fg-3">
              {NAV.map((n) => (
                <li key={n.to} className="flex items-center gap-2">
                  <Kbd>{n.key}</Kbd>
                  {n.label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
