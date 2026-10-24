import { Database, Fingerprint, Sparkles, Wand2 } from 'lucide-react'

/**
 * How it works + About + Privacy, in one honest chapter.
 * The hero's secondary CTA lands here.
 */
export function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="about__head">
        <p className="mono" data-reveal>
          How it works
        </p>
        <h2 id="about-title" className="section-title" data-reveal data-reveal-delay={0.08}>
          A thought experiment, <span className="serif">rendered.</span>
        </h2>
        <p className="section-lede" data-reveal data-reveal-delay={0.16}>
          FUTUREME does not predict anything. It renders imagined futures so you can feel how many
          directions a single life contains.
        </p>
      </div>

      <ol className="about__steps">
        {[
          {
            icon: Sparkles,
            title: 'Scroll through a universe',
            body: 'A single particle sphere becomes a network, then a set of branching paths, then a landscape. Scrolling is the only control you need.',
          },
          {
            icon: Wand2,
            title: 'Pick a lens',
            body: 'Career, learning, lifestyle — each lens shifts the emphasis of the constellation and its readout. Nothing is measured; everything is illustrative.',
          },
          {
            icon: Database,
            title: 'Generate a scenario',
            body: 'Type a hypothetical and the page assembles a sketch from local templates: three milestones, one challenge, one first step.',
          },
          {
            icon: Fingerprint,
            title: 'Nothing about you leaves this page',
            body: 'There is no backend, no account and no analytics. The scenario generator runs entirely in your browser.',
          },
        ].map((step, i) => (
          <li key={step.title} className="glass about__step" data-reveal data-reveal-delay={i * 0.05}>
            <span className="about__idx mono">{String(i + 1).padStart(2, '0')}</span>
            <step.icon size={16} strokeWidth={1.1} aria-hidden="true" />
            <h3 className="about__step-title">{step.title}</h3>
            <p className="about__step-body">{step.body}</p>
          </li>
        ))}
      </ol>

      <div id="privacy" className="about__privacy glass" data-reveal>
        <p className="mono about__privacy-tag">Privacy</p>
        <div className="about__privacy-cols">
          <p>
            This experience runs entirely in your browser. There is no server, no database and no
            analytics script. Anything you type into the simulator stays in memory and disappears
            when you close the tab.
          </p>
          <p>
            The only outbound request is for web fonts. The visual system is procedural — generated
            geometry and CSS — so no images, videos or tracking pixels are loaded. Your motion
            preference and device capabilities are read locally to reduce animation.
          </p>
        </div>
      </div>
    </section>
  )
}
