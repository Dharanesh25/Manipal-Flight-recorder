// Formatting helpers. All telemetry timestamps are ISO-8601 UTC strings.

const pad = (n, w = 2) => String(n).padStart(w, '0')

export function fmtTime(iso) {
  const d = new Date(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function fmtDateTime(iso) {
  return `${fmtDate(iso)} ${fmtTime(iso)}`
}

export function fmtShortDate(iso) {
  const d = new Date(iso)
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]
  return `${pad(d.getUTCDate())} ${m}`
}

/** Seconds → "+1m 04s" style delta */
export function fmtDelta(sec) {
  const s = Math.round(Math.abs(sec))
  const sign = sec < 0 ? '−' : '+'
  if (s < 60) return `${sign}${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${sign}${m}m ${pad(s % 60)}s`
  const h = Math.floor(m / 60)
  return `${sign}${h}h ${pad(m % 60)}m`
}

/** Offset in seconds from a base ISO time → "HH:MM:SS" */
export function fmtOffset(baseIso, sec) {
  return fmtTime(new Date(new Date(baseIso).getTime() + sec * 1000).toISOString())
}

export function fmtBytes(b) {
  if (b < 1024) return `${b} B`
  const u = ['KB', 'MB', 'GB', 'TB']
  let v = b / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${u[i]}`
}

export function fmtNum(n) {
  return n.toLocaleString('en-US')
}

export function fmtPct(v, digits = 0) {
  return `${(v * 100).toFixed(digits)}%`
}

export function fmtSigma(z) {
  const sign = z > 0 ? '+' : z < 0 ? '−' : '±'
  return `${sign}${Math.abs(z).toFixed(1)}σ`
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
