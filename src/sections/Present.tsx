import { useGlassLight } from '../components/Cursor'

/**
 * Chapter One — The present.
 * The copy floats beside the sphere; the sphere is the WebGL canvas
 * behind everything, so this section is mostly air.
 */
export function Present() {
  const panelRef = useGlassLight<HTMLDivElement>()

  return (
    <section id="present" className="section present" aria-labelledby="present-title">
      <div className="present__inner">
        <div ref={panelRef} className="glass present__panel" data-reveal>
          <p className="mono present__tag">You are here</p>
          <h2 id="present-title" className="present__title">
            Every possibility <br />
            <span className="serif">begins somewhere.</span>
          </h2>
          <div className="present__rule hairline" data-hairline />
          <ul className="present__stats">
            <li>
              <span className="mono">Present</span>
              <span className="present__value">1</span>
              <span className="present__hint">life in motion</span>
            </li>
            <li>
              <span className="mono">Potential</span>
              <span className="present__value">∞</span>
              <span className="present__hint">unexplored paths</span>
            </li>
            <li>
              <span className="mono">Possibility</span>
              <span className="present__value">?</span>
              <span className="present__hint">yours to imagine</span>
            </li>
          </ul>
        </div>

        <div className="present__aside" data-reveal data-reveal-delay={0.15}>
          <p className="present__body">
            This is a demonstration — not a measurement. The sphere you see is a representation
            of possibility, drawn from a set of imagined futures rather than data about you.
          </p>
          <p className="mono present__note">Illustrative interface · no personal data collected</p>
        </div>
      </div>

      <div className="present__labels mono" aria-hidden="true">
        <span className="present__label present__label--a">Node 0.001</span>
        <span className="present__label present__label--b">Signal stable</span>
        <span className="present__label present__label--c">Branch count — 4</span>
      </div>
    </section>
  )
}
