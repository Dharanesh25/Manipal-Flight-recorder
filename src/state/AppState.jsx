import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEMO_NOW } from '../data/events'
import { AppStateContext } from './context'

const PREF_KEY = 'nfr.prefs.v1'
const DEFAULT_PREFS = {
  timezone: 'UTC',
  density: 'compact',
  reduceMotion: false,
  liveStream: true,
  sidebarCollapsed: false,
}

function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') }
  } catch {
    return DEFAULT_PREFS
  }
}

/**
 * Global state: a simulated clock (anchored to the demo dataset's "now"),
 * analyst preferences, and UI chrome toggles (shortcut overlay, mobile nav).
 */
export function AppStateProvider({ children }) {
  const [origin] = useState(() => Date.now())
  const [now, setNow] = useState(() => new Date(DEMO_NOW))
  const [prefs, setPrefs] = useState(loadPrefs)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(new Date(DEMO_NOW).getTime() + (Date.now() - origin)))
    }, 1000)
    return () => clearInterval(id)
  }, [origin])

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable — preferences stay in memory */
    }
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion)
  }, [prefs])

  const setPref = useCallback((k, v) => setPrefs((p) => ({ ...p, [k]: v })), [])

  const value = useMemo(
    () => ({ now, prefs, setPref, shortcutsOpen, setShortcutsOpen, navOpen, setNavOpen }),
    [now, prefs, setPref, shortcutsOpen, navOpen],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
