import { useEffect, useRef, useState } from 'react'
import { getQuality } from '../lib/quality'

/**
 * Cinematic loading sequence. It is driven by real milestones reported by
 * the app (fonts, scene, layout) — never by a fake timer. A hard ceiling
 * guarantees it can never hang, even if WebGL fails.
 */
interface Props {
  /** real progress 0 → 1 reported by the app */
  progress: number
  onEnter: () => void
  /** when true the user can already enter (all milestones hit) */
  ready: boolean
}

const WORD = 'FUTUREME'.split('')

export function Loader({ progress, ready, onEnter }: Props) {
  const [entering, setEntering] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const reduced = useRef(getQuality().reducedMotion)

  // Hard ceiling: if something silently fails, the loader leaves anyway.
  useEffect(() => {
    const t = window.setTimeout(() => setEntering(true), 6000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready || entering) return
    setEntering(true)
  }, [ready, entering])

  useEffect(() => {
    if (!entering) return
    const t = window.setTimeout(
      () => {
        setDismissed(true)
        onEnter()
      },
      reduced.current ? 200 : 1100,
    )
    return () => window.clearTimeout(t)
  }, [entering, onEnter])

  if (dismissed) return null

  const pct = Math.round(Math.min(1, progress) * 100)

  return (
    <div className={`loader ${entering ? 'is-entering' : ''}`} role="status" aria-live="polite">
      <div className="loader__core" aria-hidden="true">
        <span className="loader__seed" />
        <span className="loader__orbit loader__orbit--a" />
        <span className="loader__orbit loader__orbit--b" />
        <span className="loader__orbit loader__orbit--c" />
      </div>

      <h1 className="loader__word" aria-label="FUTUREME">
        {WORD.map((ch, i) => (
          <span key={i} style={{ animationDelay: `${300 + i * 55}ms` }} aria-hidden="true">
            {ch}
          </span>
        ))}
      </h1>

      <div className="loader__meta">
        <span className="loader__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
        </span>
        <span className="mono loader__pct">{pct.toString().padStart(3, '0')}</span>
      </div>
      <p className="mono loader__note">
        {pct < 40 ? 'Calibrating the possible' : pct < 85 ? 'Mapping your constellations' : 'Opening the horizon'}
      </p>
    </div>
  )
}
