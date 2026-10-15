// Deterministic pseudo-random generator so the simulated telemetry is
// identical on every load (mulberry32).
export function rng(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gaussian(r) {
  let u = 0
  let v = 0
  while (u === 0) u = r()
  while (v === 0) v = r()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/** Exponentially distributed inter-arrival (Poisson process). */
export function expo(r, rate) {
  return -Math.log(1 - r()) / rate
}
