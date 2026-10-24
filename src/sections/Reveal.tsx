import { ArrowUpRight } from 'lucide-react'
import { useMagnetic } from '../components/Cursor'

interface Props {
  scrollTo: (sel: string) => void
}

export function Reveal({ scrollTo }: Props) {
  const ctaRef = useMagnetic<HTMLButtonElement>(12)

  return (
    <section id="reveal" className="section reveal" aria-labelledby="reveal-title">
      <div className="reveal__statements">
        <h2 id="reveal-title" className="reveal__line" data-statement>
          The future isn&rsquo;t
          <br />a destination.
        </h2>
        <p className="reveal__line reveal__line--second" data-statement>
          It&rsquo;s something
          <br />
          <span className="serif">you build.</span>
        </p>
      </div>

      <div className="reveal__cta" data-reveal>
        <button ref={ctaRef} className="btn btn--primary" onClick={() => scrollTo('#explore')}>
          <span>Begin your next chapter</span>
          <ArrowUpRight size={14} strokeWidth={1.25} className="arrow" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

interface FooterProps {
  scrollTo: (sel: string) => void
}

export function Footer({ scrollTo }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__wordmark">FUTUREME</p>
        <p className="footer__line serif">An exploration of what could be.</p>
      </div>

      <div className="footer__rule" data-hairline />

      <div className="footer__bottom">
        <nav className="footer__links" aria-label="Footer">
          <button onClick={() => scrollTo('#explore')}>Explore</button>
          <button onClick={() => scrollTo('#about')}>About</button>
          <button onClick={() => scrollTo('#privacy')}>Privacy</button>
        </nav>
        <p className="mono footer__meta">
          An independent experiment · no accounts · no tracking · 2026
        </p>
      </div>
    </footer>
  )
}
