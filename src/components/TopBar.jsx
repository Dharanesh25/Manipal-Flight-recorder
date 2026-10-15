import { Menu } from 'lucide-react'
import { useAppState } from '../state/context'
import { fmtTime, fmtDate } from '../lib/format'
import { SYSTEM_STATUS } from '../data/system'
import { DemoTag } from './ui/Primitives'

function Slot({ label, children, className = '' }) {
  return (
    <div className={`h-full items-center gap-2 whitespace-nowrap border-l border-line px-4 ${className}`}>
      <span className="label">{label}</span>
      <span className="mono text-[11px] text-fg">{children}</span>
    </div>
  )
}

export default function TopBar() {
  const { now, setNavOpen, setShortcutsOpen } = useAppState()
  const iso = now.toISOString()
  return (
    <header className="no-print flex h-12 shrink-0 items-stretch border-b border-line bg-ground">
      <button onClick={() => setNavOpen(true)} className="flex items-center px-4 text-fg-3 hover:text-fg md:hidden" aria-label="Open navigation">
        <Menu size={16} />
      </button>
      <div className="flex items-center px-4 md:px-6">
        <span className="mono whitespace-nowrap text-[11px] font-medium tracking-[0.18em] text-fg">
          <span className="hidden sm:inline">NETWORK </span>FLIGHT RECORDER
        </span>
      </div>

      <Slot label="Env" className="hidden xl:flex">
        {SYSTEM_STATUS.environment} <span className="text-fg-4">/</span> {SYSTEM_STATUS.sensor}
      </Slot>
      <Slot label="Status" className="hidden md:flex">
        <span className="inline-flex items-center gap-1.5 text-ok">
          <span className="nfr-pulse h-1.5 w-1.5 rounded-full bg-ok" />
          MONITORING
        </span>
      </Slot>

      <div className="ml-auto flex items-stretch">
        <div className="hidden items-center px-4 2xl:flex">
          <DemoTag />
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap border-l border-line px-4" title="Simulated clock anchored to the demo dataset">
          <span className="mono tabular text-[12px] text-fg">{fmtTime(iso)}</span>
          <span className="mono text-[10.5px] text-fg-4">UTC</span>
          <span className="mono hidden text-[10.5px] text-fg-4 xl:inline">· {fmtDate(iso)}</span>
        </div>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="mono hidden items-center border-l border-line px-3 text-[11px] text-fg-3 hover:bg-raised hover:text-fg lg:flex"
          title="Keyboard shortcuts"
        >
          ?
        </button>
        <div className="flex items-center gap-2.5 border-l border-line px-4">
          <span className="mono flex h-6 w-6 items-center justify-center bg-ivory text-[10px] font-semibold text-ink">A3</span>
          <span className="hidden whitespace-nowrap leading-none xl:block">
            <span className="block text-[12px] text-fg">analyst-03</span>
            <span className="mono mt-0.5 block text-[9.5px] tracking-wider text-fg-4">TIER 2 · SOC</span>
          </span>
        </div>
      </div>
    </header>
  )
}
