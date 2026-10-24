import { useId, useState } from 'react'
import { Briefcase, BookOpen, Sunrise, Check } from 'lucide-react'
import { POSSIBILITIES, type Possibility } from '../data/content'
import { useGlassLight } from '../components/Cursor'
import { setSceneNow } from '../lib/sceneBridge'

const ICONS = {
  career: Briefcase,
  learning: BookOpen,
  lifestyle: Sunrise,
} as const

interface Props {
  onSelect: (index: number) => void
}

/**
 * Chapter Four — Your possibilities, visualized.
 * Selecting a card changes real, displayed state: the panel's readout,
 * the facets, the note and the central sphere's tint.
 */
export function Possibilities({ onSelect }: Props) {
  const [selected, setSelected] = useState<number>(-1)
  const active = selected >= 0 ? POSSIBILITIES[selected] : null
  const panelId = useId()

  const select = (index: number) => {
    const next = selected === index ? -1 : index
    setSelected(next)
    onSelect(next)
    setSceneNow({ possibility: next })
  }

  return (
    <section id="possibilities" className="section possibilities" aria-labelledby="poss-title">
      <div className="poss__head">
        <p className="mono" data-reveal>
          Chapter four
        </p>
        <h2 id="poss-title" className="section-title" data-reveal data-reveal-delay={0.08}>
          Imagine what&rsquo;s <span className="serif">possible</span>
        </h2>
        <p className="section-lede" data-reveal data-reveal-delay={0.16}>
          Three lenses on a life. Choose one and watch the constellation respond — this is a
          local demonstration, built from illustrative data.
        </p>
      </div>

      <div className="poss__panel glass" data-reveal>
        <div className="poss__grid" role="group" aria-label="Choose a lens on your future">
          {POSSIBILITIES.map((p, i) => (
            <PossCard
              key={p.key}
              item={p}
              selected={selected === i}
              onSelect={() => select(i)}
            />
          ))}
        </div>

        <div className="poss__readout" aria-live="polite" id={panelId}>
          {active ? (
            <>
              <div className="poss__readout-head">
                <p className="mono">Selected — {active.title}</p>
                <p className="mono poss__horizon">Horizon {active.data.horizon}</p>
              </div>
              <div className="poss__facets">
                {active.data.facets.map((f) => (
                  <div className="facet" key={f.label}>
                    <span className="mono facet__label">{f.label}</span>
                    <span className="facet__bar" aria-hidden="true">
                      <span style={{ transform: `scaleX(${f.value})` }} />
                    </span>
                    <span className="mono facet__value">{Math.round(f.value * 100)}</span>
                  </div>
                ))}
              </div>
              <p className="poss__note serif">{active.data.note}</p>
            </>
          ) : (
            <div className="poss__empty">
              <span className="mono">No lens selected</span>
              <p>Select a card to see what that direction would emphasise.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface CardProps {
  item: Possibility
  selected: boolean
  onSelect: () => void
}

function PossCard({ item, selected, onSelect }: CardProps) {
  const ref = useGlassLight<HTMLButtonElement>()
  const Icon = ICONS[item.key]

  return (
    <button
      ref={ref}
      className={`poss-card ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${item.title} — ${item.copy}`}
    >
      <span className="poss-card__art" aria-hidden="true">
        <MiniViz kind={item.key} />
      </span>
      <span className="poss-card__head">
        <Icon size={15} strokeWidth={1.1} aria-hidden="true" />
        <span className="mono">{item.title}</span>
        <span className="poss-card__check" aria-hidden="true">
          <Check size={11} strokeWidth={2} />
        </span>
      </span>
      <span className="poss-card__copy">{item.copy}</span>
      <span className="poss-card__sweep" aria-hidden="true" />
    </button>
  )
}

/** Tiny procedural illustrations — pure SVG, no assets. */
function MiniViz({ kind }: { kind: Possibility['key'] }) {
  if (kind === 'career') {
    return (
      <svg viewBox="0 0 120 48" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={8 + i * 27} y={38 - i * 8} width={14} height={8 + i * 8} rx={1} />
        ))}
        <path d="M10 34 L37 27 L64 21 L91 13" className="viz-line" />
      </svg>
    )
  }
  if (kind === 'learning') {
    return (
      <svg viewBox="0 0 120 48">
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={12 + i * 24} cy={i % 2 === 0 ? 20 : 30} r={i === 2 ? 4 : 2.5} />
        ))}
        <path d="M12 20 L36 30 L60 20 L84 30 L108 20" className="viz-line" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 48">
      <path d="M4 40 Q30 40 38 26 Q46 12 66 20 Q88 28 96 16 Q104 6 116 10" className="viz-line" />
      <circle cx={38} cy={26} r={2.5} />
      <circle cx={96} cy={16} r={2.5} />
    </svg>
  )
}
