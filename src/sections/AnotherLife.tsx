/**
 * Chapter Three — Enter another life.
 * Tall editorial statements over the abstract city. Each line is its own
 * scroll window so they never stack on top of one another.
 */
export function AnotherLife() {
  return (
    <section id="life" className="section life" aria-labelledby="life-title">
      <h2 id="life-title" className="sr-only">
        Enter another life
      </h2>

      <div className="life__statements">
        <p className="life__statement" data-statement>
          <span className="mono life__num">i.</span>
          One decision.
        </p>
        <p className="life__statement life__statement--wide" data-statement>
          <span className="mono life__num">ii.</span>
          An entirely different <span className="serif">direction.</span>
        </p>
        <p className="life__statement" data-statement>
          <span className="mono life__num">iii.</span>
          Countless ways to begin.
        </p>
      </div>

      <div className="life__caption mono" data-reveal>
        <span className="life__caption-line" aria-hidden="true" />
        A projection of one path · abstract representation
      </div>
    </section>
  )
}
