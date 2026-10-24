import { useEffect, useRef } from 'react'
import { getQuality, onVisible } from '../lib/quality'
import { pointer, params, type SceneParams } from '../lib/sceneParams'
import { setPointer } from '../lib/sceneBridge'
import { createExperience, type Experience } from './FutureScene'

export interface SceneHandle {
  pulse: () => void
  setPossibility: (index: number) => void
}

interface Props {
  onReady?: () => void
  onUnavailable?: () => void
  handleRef?: React.RefObject<SceneHandle | null>
}

/**
 * Single WebGL canvas for the entire experience.
 * Fixed behind the document; one renderer, one scene graph, one RAF loop.
 */
export function SceneCanvas({ onReady, onUnavailable, handleRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const expRef = useRef<Experience | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const quality = getQuality()
    if (quality.tier === 'fallback') {
      onUnavailable?.()
      return
    }

    let exp: Experience | null = null
    try {
      exp = createExperience(canvas, quality)
    } catch (err) {
      console.error('[FUTUREME] WebGL init failed', err)
      onUnavailable?.()
      return
    }

    expRef.current = exp
    if (handleRef) {
      handleRef.current = {
        pulse: () => exp?.pulse(),
        setPossibility: (i: number) => exp?.setPossibility(i),
      }
    }
    onReady?.()

    const onResize = () => exp?.onResize()
    window.addEventListener('resize', onResize)

    // pause the render loop when the page is hidden or the canvas is offscreen
    let pageHidden = document.hidden
    const onVis = () => {
      pageHidden = document.hidden
      exp?.setActive(!pageHidden)
    }
    document.addEventListener('visibilitychange', onVis)

    // pointer parallax — desktop only
    let pointerBound = false
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      setPointer(x, y)
    }
    if (!quality.isTouch) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      pointerBound = true
    }

    // offscreen activation
    const unobserve = onVisible(document.body, (visible) => {
      if (pageHidden) return
      exp?.setActive(visible)
    })

    return () => {
      unobserve()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      if (pointerBound) window.removeEventListener('pointermove', onPointerMove)
      pointer.x = 0
      pointer.y = 0
      pointer.tx = 0
      pointer.ty = 0
      if (handleRef) handleRef.current = null
      expRef.current = null
      exp?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />
}

export type { SceneParams }
export { params }
