import { useEffect, useState } from 'react'
import { API_ENABLED, DEMO, fetchResource } from './client'

/**
 * Load a resource from the backend, falling back to demo telemetry.
 * In demo mode data is available synchronously, so pages render without a
 * loading flash. With an API configured, demo data is shown only if the
 * request fails (and `source` reports 'demo-fallback').
 */
export function useResource(key) {
  const [state, setState] = useState(() => ({
    data: API_ENABLED ? null : DEMO[key],
    source: API_ENABLED ? 'loading' : 'demo',
    error: null,
  }))

  useEffect(() => {
    if (!API_ENABLED) return
    const ctrl = new AbortController()
    fetchResource(key, { signal: ctrl.signal })
      .then(({ data, source }) => setState({ data, source, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({ data: DEMO[key], source: 'demo-fallback', error })
      })
    return () => ctrl.abort()
  }, [key])

  return state
}
