/**
 * Device / environment capability detection.
 * Everything here is cheap, synchronous and read once per session.
 */

export type Tier = 'high' | 'mid' | 'low' | 'fallback'

export interface Quality {
  tier: Tier
  isTouch: boolean
  isMobile: boolean
  reducedMotion: boolean
  dpr: number
  /** particle budget for the planet surface */
  particles: number
  /** secondary particle budget (trails, city dust, portal) */
  dust: number
  /** star count */
  stars: number
  antialias: boolean
  /** how much of the cinematic camera journey we run */
  cinematic: boolean
  /** pinned scroll length multiplier */
  scrollScale: number
}

let cached: Quality | null = null

export function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    if (!gl) return false
    // release immediately
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

export function getQuality(): Quality {
  if (cached) return cached

  const nav = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
  }
  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  const cores = nav.hardwareConcurrency ?? 2
  const memory = nav.deviceMemory ?? 4
  const vw = window.innerWidth
  const isMobile = vw < 760 || (coarse && vw < 1024)
  const isTouch = coarse
  const hasWebGL = detectWebGL()

  let tier: Tier = 'mid'
  if (!hasWebGL) {
    tier = 'fallback'
  } else if (cores <= 2 || memory <= 2) {
    tier = 'low'
  } else if (isMobile) {
    tier = 'low'
  } else if (cores <= 4) {
    tier = 'mid'
  } else {
    tier = 'high'
  }

  const dpr = Math.min(
    window.devicePixelRatio || 1,
    tier === 'high' ? 1.5 : tier === 'mid' ? 1.25 : 1,
  )

  const particles = tier === 'high' ? 2400 : tier === 'mid' ? 1800 : tier === 'low' ? 1200 : 0
  const dust = tier === 'high' ? 900 : tier === 'mid' ? 600 : tier === 'low' ? 320 : 0
  const stars = tier === 'high' ? 340 : tier === 'mid' ? 220 : tier === 'low' ? 120 : 0

  cached = {
    tier,
    isTouch,
    isMobile,
    reducedMotion,
    dpr,
    particles,
    dust,
    stars,
    antialias: tier === 'high',
    cinematic: tier === 'high' || tier === 'mid',
    scrollScale: isMobile ? 0.62 : tier === 'low' ? 0.8 : 1,
  }
  return cached
}

/** Observable reduced-motion preference. */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = (e: MediaQueryListEvent) => cb(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

/** Observe an element's visibility without running work while hidden. */
export function onVisible(
  el: Element,
  cb: (visible: boolean) => void,
  rootMargin = '10% 0px',
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb(true)
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) cb(entry.isIntersecting)
    },
    { rootMargin, threshold: 0 },
  )
  io.observe(el)
  return () => io.disconnect()
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-6))
  return t * t * (3 - 2 * t)
}
/** 0→1→0 window between a..b..c..d */
export const window4 = (a: number, b: number, c: number, d: number, x: number) =>
  Math.min(smoothstep(a, b, x), 1 - smoothstep(c, d, x))
