import { useCallback, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clamp } from './quality'
import type { Quality } from './quality'
import { setScene } from './sceneBridge'

gsap.registerPlugin(ScrollTrigger)

export interface Chapter {
  id: string
  label: string
}

export const CHAPTERS: Chapter[] = [
  { id: 'hero', label: 'Origin' },
  { id: 'present', label: 'Present' },
  { id: 'branch', label: 'Branching future' },
  { id: 'life', label: 'Another life' },
  { id: 'possibilities', label: 'Possibilities' },
  { id: 'explore', label: 'Explore' },
  { id: 'reveal', label: 'The reveal' },
]

/* ------------------------------------------------------------------ */
/* The camera journey. Each keyframe is a complete scene state;        */
/* scroll progress between two keyframes is interpolated every frame.  */
/* ------------------------------------------------------------------ */

interface Keyframe {
  at: number
  scale: number
  camDist: number
  camPolar: number
  camAzimuth: number
  camTargetY: number
  fov: number
  network: number
  branch: number
  portal: number
  city: number
  converge: number
  spin: number
}

type NumericKey = keyof Omit<Keyframe, 'at'>

const BASE: Keyframe = {
  at: 0,
  scale: 1,
  camDist: 7.4,
  camPolar: Math.PI / 2,
  camAzimuth: 0,
  camTargetY: 0,
  fov: 42,
  network: 0,
  branch: 0,
  portal: 0,
  city: 0,
  converge: 0,
  spin: 1,
}

const NUMERIC_KEYS: NumericKey[] = [
  'scale',
  'camDist',
  'camPolar',
  'camAzimuth',
  'camTargetY',
  'fov',
  'network',
  'branch',
  'portal',
  'city',
  'converge',
  'spin',
]

export function buildKeyframes(quality: Quality, anchors: Record<string, number>): Keyframe[] {
  const depth = quality.isMobile ? 0.6 : 1
  const s = (a: number, b: number, t: number) => a + (b - a) * t
  const a = anchors
  const mid = (from: number, to: number, t = 0.55) => s(from, to, t)

  const kf = (at: number, patch: Partial<Keyframe>): Keyframe => ({ ...BASE, ...patch, at })

  return [
    kf(0, {}),
    // 1. the present — approach the sphere, surface becomes a network
    kf(a.present, {
      scale: 1.16,
      camDist: 7.4 - 1.9 * depth,
      camPolar: Math.PI / 2 - 0.1 * depth,
      network: 1,
      spin: 1.1,
    }),
    // 2. pass through the outer particle shell
    kf(mid(a.present, a.branch, 0.62), {
      scale: 1.4,
      camDist: 7.4 - 4.2 * depth,
      network: 1,
      fov: 54,
      spin: 1.3,
    }),
    // 3. the branching future
    kf(a.branch, {
      scale: 0.4,
      camDist: 9.4,
      camPolar: Math.PI / 2 + 0.2,
      camAzimuth: -0.22,
      camTargetY: 1.5,
      fov: 46,
      branch: 1,
      network: 0.5,
      spin: 0.55,
    }),
    // 4. drift toward one route, the portal opens
    kf(mid(a.branch, a.life, 0.6), {
      scale: 0.4,
      camDist: 6.2,
      camPolar: Math.PI / 2 + 0.12,
      camAzimuth: 0.3,
      camTargetY: 2.4,
      fov: 50,
      branch: 0.95,
      portal: 0.6,
    }),
    // 5. enter another life
    kf(a.life, {
      scale: 0.18,
      camDist: 4.0,
      camPolar: Math.PI / 2,
      camAzimuth: 0,
      camTargetY: 0,
      fov: 58,
      branch: 0.25,
      portal: 1,
      city: 0.18,
    }),
    kf(mid(a.life, a.possibilities, 0.6), {
      scale: 0.16,
      camDist: 3.2,
      fov: 60,
      portal: 0,
      city: 1,
    }),
    // 6. the possibilities interface
    kf(a.possibilities, {
      scale: 0.95,
      camDist: 6.4,
      camPolar: Math.PI / 2,
      camAzimuth: 0,
      camTargetY: 0,
      fov: 44,
      network: 0.45,
      city: 0.5,
    }),
    kf(a.explore, {
      scale: 1.05,
      camDist: 6.1,
      network: 0.35,
      branch: 0.08,
      city: 0,
    }),
    // 7. retreat, converge, reveal
    kf(a.reveal, {
      scale: 0.85,
      camDist: 5.6,
      network: 0,
      branch: 0,
      converge: 0.4,
    }),
    kf(1, {
      scale: 0.35,
      camDist: 4.2,
      converge: 1,
      fov: 36,
    }),
  ]
}

function sampleKeyframes(frames: Keyframe[], t: number) {
  const out: Record<string, number> = {}
  let i = 0
  for (let k = 0; k < frames.length - 1; k++) {
    if (t >= frames[k].at) i = k
  }
  const a = frames[i]
  const b = frames[Math.min(frames.length - 1, i + 1)]
  const span = b.at - a.at || 1
  const raw = clamp((t - a.at) / span)
  const e = raw * raw * (3 - 2 * raw) // smoothstep for cinematic ease
  for (const key of NUMERIC_KEYS) {
    out[key] = a[key] + (b[key] - a[key]) * e
  }
  return out
}

/* ------------------------------------------------------------------ */

interface Options {
  quality: Quality
  started: boolean
}

export function useScrollSystem({ quality, started }: Options) {
  const [progress, setProgress] = useState(0)
  const [activeChapter, setActiveChapter] = useState(0)

  const scrollTo = useCallback((selector: string) => {
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY + 1
    window.scrollTo({ top, behavior: quality.reducedMotion ? 'auto' : 'smooth' })
  }, [quality.reducedMotion])

  useEffect(() => {
    if (!started) return
    const root = document.documentElement

    const ctx = gsap.context(() => {
      const experience = document.querySelector<HTMLElement>('#experience')
      if (!experience) return

      const anchorOf = (id: string) => {
        const el = document.getElementById(id)
        if (!el) return 0
        const max = root.scrollHeight - window.innerHeight
        const top = el.getBoundingClientRect().top + window.scrollY
        return clamp(top / (max || 1))
      }

      const anchors = {
        present: anchorOf('present'),
        branch: anchorOf('branch'),
        life: anchorOf('life'),
        possibilities: anchorOf('possibilities'),
        explore: anchorOf('explore'),
        reveal: anchorOf('reveal'),
      }

      const frames = buildKeyframes(quality, anchors)
      const state = { p: 0 }

      const write = () => {
        const sampled = sampleKeyframes(frames, state.p)
        setScene(sampled)
        setProgress(state.p)
      }

      gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: write,
        scrollTrigger: {
          trigger: experience,
          start: 'top top',
          end: 'bottom bottom',
          scrub: quality.reducedMotion ? true : 0.75,
          invalidateOnRefresh: true,
          onRefresh: write,
        },
      })

      /* ---------- hero exit: typography dissolves as we descend ---------- */
      const heroCopy = document.querySelectorAll<HTMLElement>('[data-hero-fade]')
      if (heroCopy.length) {
        gsap.to(heroCopy, {
          yPercent: -18,
          opacity: 0,
          filter: 'blur(10px)',
          ease: 'none',
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      /* ---------- editorial statements in the city chapter ---------- */
      document.querySelectorAll<HTMLElement>('[data-statement]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 60, filter: 'blur(14px)', scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              end: 'top 45%',
              scrub: true,
            },
          },
        )
        gsap.to(el, {
          opacity: 0,
          y: -50,
          filter: 'blur(10px)',
          ease: 'power2.in',
          scrollTrigger: {
            trigger: el,
            start: 'bottom 55%',
            end: 'bottom 10%',
            scrub: true,
          },
        })
      })

      /* ---------- generic reveal ---------- */
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        const delay = Number(el.dataset.revealDelay ?? 0)
        gsap.fromTo(
          el,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: quality.reducedMotion ? 0.01 : 1.1,
            delay,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          },
        )
      })

      /* ---------- hairline separators draw in ---------- */
      document.querySelectorAll<HTMLElement>('[data-hairline]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.4,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          },
        )
      })

      /* ---------- branch route emphasis ---------- */
      document.querySelectorAll<HTMLElement>('[data-route]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: el.dataset.side === 'right' ? 30 : -30 },
          {
            opacity: 1,
            x: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '#branch',
              start: `top+=${Number(el.dataset.routeStart ?? 0) * 100}px top`,
              end: `top+=${(Number(el.dataset.routeStart ?? 0) + 0.6) * 100}px top`,
              scrub: true,
            },
          },
        )
      })
    })

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const t1 = window.setTimeout(refresh, 500)
    const t2 = window.setTimeout(refresh, 1800)

    return () => {
      window.removeEventListener('load', refresh)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      ctx.revert()
    }
  }, [started, quality])

  /* chapter detection for the nav + progress rail */
  useEffect(() => {
    if (!started) return
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const idx = CHAPTERS.findIndex((c) => c.id === e.target.id)
          if (idx >= 0) setActiveChapter(idx)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [started])

  return { progress, activeChapter, scrollTo }
}
