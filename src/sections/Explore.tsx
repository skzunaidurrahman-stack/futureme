import { useCallback, useId, useRef, useState } from 'react'
import { ArrowRight, CornerDownLeft, RotateCcw, TriangleAlert } from 'lucide-react'
import {
  PATH_OPTIONS,
  generateScenario,
  type PathKey,
  type Scenario,
} from '../data/scenarios'
import { useMagnetic } from '../components/Cursor'
import { setSceneNow } from '../lib/sceneBridge'

interface Props {
  onScenario?: (scenario: Scenario | null) => void
}

/**
 * Chapter Five — Create a possible future.
 * A deterministic, local scenario builder. No network requests,
 * no AI service: templates and keyword matching only.
 */
export function Explore({ onScenario }: Props) {
  const [value, setValue] = useState('')
  const [path, setPath] = useState<PathKey>('conservative')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Scenario | null>(null)
  const [pending, setPending] = useState(false)
  const inputId = useId()
  const errorId = useId()
  const resultRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useMagnetic<HTMLButtonElement>(8)

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const text = value.trim()
      if (text.length < 2) {
        setError('Enter at least a few words so the scenario has something to work with.')
        return
      }
      setError('')
      setPending(true)
      // a short, honest beat — the generation itself is instant
      window.setTimeout(() => {
        const scenario = generateScenario(text, path)
        setResult(scenario)
        setPending(false)
        setSceneNow({ miniBranches: 1 })
        onScenario?.(scenario)
        window.setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
            block: 'center',
          })
        }, 60)
      }, 420)
    },
    [value, path, onScenario],
  )

  const reset = () => {
    setResult(null)
    setValue('')
    setError('')
    setSceneNow({ miniBranches: 0 })
    onScenario?.(null)
  }

  return (
    <section id="explore" className="section explore" aria-labelledby="explore-title">
      <div className="explore__head">
        <p className="mono" data-reveal>
          Chapter five
        </p>
        <h2 id="explore-title" className="section-title" data-reveal data-reveal-delay={0.08}>
          What would you like to <span className="serif">explore?</span>
        </h2>
        <p className="section-lede" data-reveal data-reveal-delay={0.16}>
          Type a hypothetical direction. The simulator assembles a scenario from local templates —
          an imaginative sketch, not a prediction or professional advice.
        </p>
      </div>

      <div className="explore__grid">
        <form className="glass explore__form" onSubmit={submit} noValidate data-reveal>
          <label htmlFor={inputId} className="mono explore__label">
            Your hypothetical
          </label>
          <div className={`explore__field ${error ? 'has-error' : ''}`}>
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. Become a researcher, launch a company, explore a new country…"
              autoComplete="off"
              maxLength={120}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            <span className="explore__enter" aria-hidden="true">
              <CornerDownLeft size={12} strokeWidth={1.4} />
            </span>
          </div>
          {error && (
            <p className="explore__error" id={errorId} role="alert">
              <TriangleAlert size={12} strokeWidth={1.4} aria-hidden="true" />
              {error}
            </p>
          )}

          <fieldset className="explore__paths">
            <legend className="mono explore__legend">Choose a trajectory</legend>
            <div className="explore__path-row">
              {PATH_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className={`path-pill ${path === opt.key ? 'is-on' : ''}`}
                >
                  <input
                    type="radio"
                    name="path"
                    value={opt.key}
                    checked={path === opt.key}
                    onChange={() => setPath(opt.key)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="explore__actions">
            <button
              ref={buttonRef}
              type="submit"
              className="btn btn--primary"
              disabled={pending}
              aria-busy={pending}
            >
              <span>{pending ? 'Projecting…' : 'Generate scenario'}</span>
              <ArrowRight size={14} strokeWidth={1.25} className="arrow" aria-hidden="true" />
            </button>
            <p className="mono explore__disclaimer">
              Local templates only · no account · nothing stored
            </p>
          </div>
        </form>

        <div className="explore__result" ref={resultRef} aria-live="polite">
          {result ? (
            <article className="glass scenario">
              <div className="scenario__top">
                <p className="mono scenario__path">
                  {PATH_OPTIONS.find((p) => p.key === result.path)?.label} · horizon {result.horizon}
                </p>
                <button className="scenario__reset" onClick={reset} aria-label="Start over">
                  <RotateCcw size={13} strokeWidth={1.4} aria-hidden="true" />
                  <span className="mono">Reset</span>
                </button>
              </div>

              <h3 className="scenario__title">{result.title}</h3>
              <div className="hairline" data-hairline />

              <ol className="scenario__milestones">
                {result.milestones.map((m, i) => (
                  <li key={i}>
                    <span className="scenario__idx mono">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="mono scenario__when">{m.when}</p>
                      <p className="scenario__text">{m.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="scenario__bottom">
                <div>
                  <p className="mono scenario__label">Potential challenge</p>
                  <p className="scenario__body">{result.challenge}</p>
                </div>
                <div>
                  <p className="mono scenario__label">A practical first step</p>
                  <p className="scenario__body scenario__body--accent">{result.firstStep}</p>
                </div>
              </div>

              <p className="scenario__fine mono">
                An imaginative scenario, not a prediction, guarantee, or professional advice.
              </p>
            </article>
          ) : (
            <div className="glass explore__placeholder">
              <div className="explore__placeholder-art" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="mono">Awaiting a hypothesis</p>
              <p>
                Three possible trajectories are drawn for every direction you enter. Choose one and
                the sphere will branch.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
