// The context object lives in its own module so React Fast Refresh can
// hot-swap AppStateProvider without recreating the context (which would
// orphan every consumer during development).
import { createContext, useContext } from 'react'

export const AppStateContext = createContext(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
