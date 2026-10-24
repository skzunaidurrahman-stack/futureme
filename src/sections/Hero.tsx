import { ArrowRight, Compass } from 'lucide-react'
import { ScrollHint } from '../components/NavOverlay'
import { useMagnetic } from '../components/Cursor'

interface Props {
  scrollTo: (sel: string) => void
}

export function Hero({ scrollTo }: Props) {
  const primaryRef = useMagnetic<HTMLButtonElement>(10)

  return (
    <section id="hero" className="section hero" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__kicker mono" data-hero-fade>
          <span className="hero__kicker-dot" aria-hidden="true" />
          An experiment in human potential
        </p>

        <h1 id="hero-title" className="hero__title" data-hero-fade>
          <span className="hero__line hero__line--1">Your future</span>
          <span className="hero__line hero__line--2">
            isn&rsquo;t <em>written.</em>
          </span>
        </h1>

        <p className="hero__sub" data-hero-fade>
          Explore the paths you could take. Discover the possibilities you haven&rsquo;t imagined.
        </p>

        <div className="hero__actions" data-hero-fade>
          <button
            ref={primaryRef}
            className="btn btn--primary"
            onClick={() => scrollTo('#explore')}
          >
            <span>Explore your future</span>
            <ArrowRight size={14} strokeWidth={1.25} className="arrow" aria-hidden="true" />
          </button>
          <button className="btn btn--ghost" onClick={() => scrollTo('#present')}>
            <Compass size={14} strokeWidth={1.25} aria-hidden="true" />
            <span>How it works</span>
          </button>
        </div>
      </div>

      <div className="hero__meta mono" aria-hidden="true">
        <span>01 — Origin</span>
        <span className="hero__meta-line" />
        <span>A universe of possibilities</span>
      </div>

      <ScrollHint onClick={() => scrollTo('#present')} />
    </section>
  )
}
