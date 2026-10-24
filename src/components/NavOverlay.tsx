import { useEffect, useRef, useState } from 'react'
import { ArrowRight, MoveDown, Sparkles } from 'lucide-react'
import { CHAPTERS } from '../lib/useScrollSystem'

interface NavProps {
  progress: number
  activeChapter: number
  scrollTo: (sel: string) => void
}

export function NavOverlay({ progress, activeChapter, scrollTo }: NavProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstLinkRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    firstLinkRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    // let the panel close before scrolling so layout is stable
    requestAnimationFrame(() => scrollTo(`#${id}`))
  }

  return (
    <>
      <header className="nav">
        <button
          className="nav__mark"
          onClick={() => scrollTo('#hero')}
          aria-label="FUTUREME — back to the beginning"
        >
          <span className="nav__dot" aria-hidden="true" />
          FUTUREME
        </button>

        <div className="nav__right">
          <span className="nav__chapter mono">
            {String(activeChapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
          <button
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav__toggle-label mono">{open ? 'Close' : 'Index'}</span>
            <span className={`nav__burger ${open ? 'is-open' : ''}`} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>

        <div className="nav__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </header>

      <div
        id="nav-panel"
        ref={panelRef}
        className={`nav-panel ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Experience index"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="nav-panel__inner">
          <p className="mono nav-panel__kicker">Index of the experience</p>
          <ul className="nav-panel__list">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button
                  ref={i === 0 ? firstLinkRef : undefined}
                  className={`nav-panel__link ${i === activeChapter ? 'is-active' : ''}`}
                  onClick={() => go(c.id)}
                >
                  <span className="nav-panel__num mono">{String(i + 1).padStart(2, '0')}</span>
                  <span>{c.label}</span>
                  <ArrowRight size={16} strokeWidth={1} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="nav-panel__foot mono">
            <Sparkles size={12} strokeWidth={1} aria-hidden="true" />
            An exploration of what could be
          </div>
        </div>
      </div>

      {open && <button className="nav-scrim" aria-label="Close index" onClick={() => setOpen(false)} />}
    </>
  )
}

interface RailProps {
  progress: number
  activeChapter: number
  scrollTo: (sel: string) => void
}

export function ProgressRail({ progress, activeChapter, scrollTo }: RailProps) {
  return (
    <nav className="rail" aria-label="Chapter navigation">
      <span className="rail__track" aria-hidden="true">
        <span className="rail__fill" style={{ transform: `scaleY(${progress})` }} />
      </span>
      <ul className="rail__dots">
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              className={`rail__dot ${i === activeChapter ? 'is-active' : ''}`}
              onClick={() => scrollTo(`#${c.id}`)}
              aria-label={`Go to ${c.label}`}
              aria-current={i === activeChapter ? 'true' : undefined}
            >
              <span aria-hidden="true" />
              <em>{c.label}</em>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <button className="scroll-hint" onClick={onClick} aria-label="Scroll to begin">
      <span className="mono">Scroll</span>
      <span className="scroll-hint__line" aria-hidden="true">
        <span />
      </span>
      <MoveDown size={12} strokeWidth={1} aria-hidden="true" />
    </button>
  )
}
