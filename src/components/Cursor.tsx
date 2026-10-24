import { useEffect, useRef } from 'react'
import { getQuality } from '../lib/quality'

/**
 * A custom desktop cursor: a fine ring that trails the pointer and
 * expands over interactive elements. It never replaces the native
 * cursor on touch devices, and never draws when motion is reduced.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement | null>(null)
  const dotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const q = getQuality()
    if (q.isTouch || q.reducedMotion) return
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    let raf = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let visible = false
    let scale = 1
    let targetScale = 1

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      if (!visible) {
        visible = true
        ring.style.opacity = '1'
        dot.style.opacity = '1'
        rx = x
        ry = y
      }
      const target = e.target as HTMLElement | null
      const interactive = target?.closest(
        'button, a, input, textarea, [role="button"], .card, .nav__toggle',
      )
      targetScale = interactive ? 2.1 : 1
      document.body.classList.toggle('cursor-hover', Boolean(interactive))
    }

    const onLeave = () => {
      visible = false
      ring.style.opacity = '0'
      dot.style.opacity = '0'
    }

    const onDown = () => {
      scale = 0.75
      targetScale = 0.75
    }
    const onUp = () => {
      targetScale = 1
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      scale += (targetScale - scale) * 0.14
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.body.classList.remove('cursor-hover')
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor cursor--ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor cursor--dot" aria-hidden="true" />
    </>
  )
}

/** Gentle magnetic pull on CTAs — desktop, motion-allowed only. */
export function useMagnetic<T extends HTMLElement>(strength = 14) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const q = getQuality()
    if (q.isTouch || q.reducedMotion) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let running = false

    const tick = () => {
      cx += (tx - cx) * 0.18
      cy += (ty - cy) * 0.18
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
        running = false
        el.style.transform = tx === 0 && ty === 0 ? '' : el.style.transform
        return
      }
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      const max = Math.max(r.width, r.height) * 0.9
      if (dist < max) {
        tx = (dx / max) * strength
        ty = (dy / max) * strength
      } else {
        tx = 0
        ty = 0
      }
      start()
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      start()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.style.transform = ''
    }
  }, [strength])
  return ref
}

/** Pointer-responsive light inside glass panels. */
export function useGlassLight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [])
  return ref
}
