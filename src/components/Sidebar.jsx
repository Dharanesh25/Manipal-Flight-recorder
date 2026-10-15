import { Link, NavLink } from 'react-router-dom'
import { PanelLeft, X } from 'lucide-react'
import { NAV } from './layout/nav'
import Wordmark from './layout/Wordmark'
import { Kbd } from './ui/Primitives'
import { useAppState } from '../state/context'
import { SYSTEM_STATUS } from '../data/system'
import { useMediaQuery } from '../lib/hooks'

function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? `${item.label} (${item.key})` : undefined}
      className={({ isActive }) =>
        `group relative flex h-9 items-center gap-3 text-[13px] transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'} ${
          isActive ? 'bg-hover text-fg' : 'text-fg-3 hover:bg-raised hover:text-fg'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-0 left-0 w-[2px] bg-ivory" />}
          <span className={`mono tabular text-[10.5px] ${isActive ? 'text-fg-2' : 'text-fg-4 group-hover:text-fg-3'}`}>{item.n}</span>
          {!collapsed && <span className="truncate">{item.short}</span>}
          {!collapsed && item.badge && <span className="mono ml-auto text-[10px] text-amber">{item.badge}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { prefs, setPref, navOpen, setNavOpen } = useAppState()
  const wide = useMediaQuery('(min-width: 1280px)')
  // Below 1280px the workspace needs the width: fall back to the numbered rail.
  const collapsed = prefs.sidebarCollapsed || !wide
  const main = NAV.filter((n) => !n.footer)
  const footer = NAV.filter((n) => n.footer)
  const close = () => setNavOpen(false)

  const body = (isDrawer) => {
    const c = collapsed && !isDrawer
    return (
      <div className="flex h-full flex-col">
        <div className={`flex h-12 shrink-0 items-center border-b border-line ${c ? 'justify-center' : 'px-4'}`}>
          <Link to="/" title="Product introduction" onClick={isDrawer ? close : undefined}>
            <Wordmark compact={c} />
          </Link>
          {isDrawer && (
            <button onClick={close} className="ml-auto p-1 text-fg-3 hover:text-fg" aria-label="Close navigation">
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3" aria-label="Primary">
          {!c && <div className="label px-4 pb-2 pt-1">Workspace</div>}
          {main.map((item) => (
            <NavItem key={item.to} item={item} collapsed={c} onNavigate={isDrawer ? close : undefined} />
          ))}
          <div className="my-3 border-t border-line" />
          {footer.map((item) => (
            <NavItem key={item.to} item={item} collapsed={c} onNavigate={isDrawer ? close : undefined} />
          ))}
        </nav>

        {!c && (
          <div className="shrink-0 border-t border-line px-4 py-3">
            <div className="mono flex items-center justify-between text-[10.5px]">
              <span className="text-fg-3">{SYSTEM_STATUS.sensor}</span>
              <span className="flex items-center gap-1.5 text-ok">
                <span className="nfr-pulse h-1.5 w-1.5 rounded-full bg-ok" />
                {SYSTEM_STATUS.monitoring}
              </span>
            </div>
            <div className="mono mt-1.5 flex items-center justify-between text-[10.5px] text-fg-4">
              <span>coverage</span>
              <span className="text-fg-2">{(SYSTEM_STATUS.coverage * 100).toFixed(1)}%</span>
            </div>
            <p className="mt-3 text-[10.5px] leading-snug text-fg-4">All telemetry in this build is simulated. No live traffic is analysed.</p>
            <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-fg-4">
              <Kbd>?</Kbd> shortcuts
              <span className="ml-auto" />
              <Kbd>[</Kbd> collapse
            </div>
          </div>
        )}
        {!isDrawer && wide && (
          <button
            onClick={() => setPref('sidebarCollapsed', !collapsed)}
            className={`flex h-9 shrink-0 items-center border-t border-line text-fg-4 hover:bg-raised hover:text-fg ${c ? 'justify-center' : 'gap-2 px-4 text-[11px]'}`}
            aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft size={14} />
            {!c && 'Collapse'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <aside className={`no-print hidden shrink-0 border-r border-line bg-panel md:block ${collapsed ? 'w-14' : 'w-[13.5rem]'} transition-[width] duration-150`}>
        {body(false)}
      </aside>
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ground/70" onClick={close} />
          <aside className="nfr-slide absolute inset-y-0 left-0 w-64 border-r border-line-strong bg-panel">{body(true)}</aside>
        </div>
      )}
    </>
  )
}
