import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import ShortcutOverlay from './ShortcutOverlay'
import ErrorBoundary from './ErrorBoundary'
import { NAV } from './nav'
import { useAppState } from '../../state/context'
import { useHotkeys } from '../../lib/hooks'

export default function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { prefs, setPref, shortcutsOpen, setShortcutsOpen } = useAppState()
  const mainRef = useRef(null)

  // <main> is the scroll container — start each section at the top
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [pathname])

  const map = { '?': () => setShortcutsOpen(true), '[': () => setPref('sidebarCollapsed', !prefs.sidebarCollapsed) }
  for (const n of NAV) map[n.key] = () => navigate(n.to)
  useHotkeys(map, [prefs.sidebarCollapsed])

  useEffect(() => {
    const item = [...NAV].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
    document.title = item ? `${item.label} · Network Flight Recorder` : 'Network Flight Recorder'
  }, [pathname])

  return (
    <div className="print-root flex h-full overflow-hidden bg-ground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main ref={mainRef} className="print-root relative min-h-0 flex-1 overflow-y-auto">
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
