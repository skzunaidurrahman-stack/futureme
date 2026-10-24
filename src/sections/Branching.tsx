import { useState } from 'react'
import { ROUTES } from '../data/content'
import { useGlassLight } from '../components/Cursor'

/**
 * Chapter Two — The branching future.
 * Four routes diverge from the planet. Hovering / focusing a card
 * raises its route in the scene without ever being the only way to
 * read the content: every route's copy is visible as text.
 */
export function Branching({ scrollTo }: { scrollTo: (sel: string) => void }) {
  const [active, setActive] = useState<number>(-1)

  return (
    <section id="branch" className="section branch" aria-labelledby="branch-title">
      <div className="branch__head">
        <p className="mono" data-reveal>
          Chapter two
        </p>
        <h2 id="branch-title" className="section-title" data-reveal data-reveal-delay={0.08}>
          The branching <span className="serif">future</span>
        </h2>
        <p className="section-lede" data-reveal data-reveal-delay={0.16}>
          One point. Several directions. None of them guaranteed. These are fictional examples of
          the kinds of futures people imagine — not predictions about yours.
        </p>
      </div>

      <div className="branch__layout">
        <div className="branch__spacer" aria-hidden="true" />
        <ul className="branch__routes">
          {ROUTES.map((route) => (
            <li key={route.key} data-route data-route-start={route.index * 0.4}>
              <RouteCard
                route={route}
                isActive={active === route.index}
                onActivate={() => setActive(route.index)}
                onDeactivate={() => setActive(-1)}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="branch__foot" data-reveal>
        <p className="mono">Each path is a question, not an answer.</p>
        <button className="btn btn--ghost" onClick={() => scrollTo('#life')}>
          Follow one path <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

interface RouteCardProps {
  route: (typeof ROUTES)[number]
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

function RouteCard({ route, isActive, onActivate, onDeactivate }: RouteCardProps) {
  const ref = useGlassLight<HTMLButtonElement>()

  return (
    <button
      ref={ref}
      className={`glass route-card ${isActive ? 'is-active' : ''}`}
      style={{ ['--route' as string]: route.color }}
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      aria-pressed={isActive}
      aria-label={`${route.name}: ${route.copy}`}
    >
      <span className="route-card__head">
        <span className="mono route-card__tag">{route.tag}</span>
        <span className="route-card__orb" aria-hidden="true" />
      </span>
      <span className="route-card__name">{route.name}</span>
      <span className="route-card__copy">{route.copy}</span>
      <span className="route-card__sweep" aria-hidden="true" />
    </button>
  )
}
