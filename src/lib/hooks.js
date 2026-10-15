import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Measure an element's content box. Returns [ref, { width, height }]. */
export function useSize() {
  const [node, setNode] = useState(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const ref = useCallback((n) => setNode(n), [])

  useLayoutEffect(() => {
    if (!node) return
    const update = () => {
      const r = node.getBoundingClientRect()
      setSize((s) => (s.width === Math.round(r.width) && s.height === Math.round(r.height) ? s : { width: Math.round(r.width), height: Math.round(r.height) }))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])

  return [ref, size]
}

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

/**
 * Register keyboard shortcuts. `map` keys are KeyboardEvent.key values, with an
 * optional "shift+" prefix. Ignored while typing in a field.
 */
export function useHotkeys(map, deps = []) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e.target)) return
      // Let focused controls keep their native Enter / Space activation
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button, a, [role="switch"], [role="tab"]')) return
      const key = (e.shiftKey && e.key.length > 1 ? 'shift+' : '') + e.key
      const fn = ref.current[key] ?? ref.current[e.key]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** requestAnimationFrame loop that advances while `running` is true. */
export function useAnimationFrame(callback, running) {
  const cb = useRef(callback)
  cb.current = callback
  useEffect(() => {
    if (!running) return
    let raf
    let last = performance.now()
    const loop = (now) => {
      cb.current((now - last) / 1000)
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])
}

/** Subscribe to a CSS media query. */
export function useMediaQuery(query) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const on = () => setMatch(mql.matches)
    on()
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [query])
  return match
}
