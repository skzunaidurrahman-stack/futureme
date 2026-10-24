/**
 * Deterministic, fully local scenario generator.
 * No network, no model, no API keys — template data + keyword matching.
 * Same input + same path always yields the same scenario.
 */

export type PathKey = 'conservative' | 'alternative' | 'unexpected'

export interface Milestone {
  when: string
  text: string
}

export interface Scenario {
  title: string
  path: PathKey
  domain: DomainKey
  milestones: Milestone[]
  challenge: string
  firstStep: string
  horizon: string
  /** stable 0..1 numbers used by the visuals */
  signature: [number, number, number]
}

interface Domain {
  key: DomainKey
  label: string
  keywords: string[]
  verbs: string[]
  places: string[]
  subjects: string[]
  challenge: string
}

export type DomainKey =
  | 'science'
  | 'creative'
  | 'business'
  | 'exploration'
  | 'health'
  | 'technology'
  | 'teaching'
  | 'craft'
  | 'generic'

const DOMAINS: Domain[] = [
  {
    key: 'science',
    label: 'Research & discovery',
    keywords: [
      'research', 'researcher', 'scientist', 'science', 'physics', 'biology', 'chemistry',
      'neuroscience', 'astronomy', 'lab', 'laboratory', 'phd', 'academic', 'study', 'mathematics',
      'math', 'genetics', 'climate', 'quantum', 'medicine', 'doctor', 'clinical',
    ],
    verbs: ['investigate', 'test', 'publish', 'replicate', 'measure'],
    places: ['a small university lab', 'an interdisciplinary research group', 'a field station'],
    subjects: [
      'a question nobody has had the instruments to ask yet',
      'a dataset that does not behave the way the literature expects',
      'a method borrowed from an unrelated discipline',
    ],
    challenge:
      'The first two years produce more questions than answers, and the results that matter arrive later than the funding cycle would like.',
  },
  {
    key: 'creative',
    label: 'Making & design',
    keywords: [
      'creator', 'create', 'artist', 'design', 'designer', 'writer', 'writing', 'film', 'filmmaker',
      'music', 'musician', 'photography', 'photographer', 'animator', 'illustrator', 'game',
      'gamedev', 'architecture', 'fashion', 'studio', 'publish', 'novel', 'podcast',
    ],
    verbs: ['make', 'compose', 'direct', 'publish', 'exhibit'],
    places: ['a shared studio', 'a residency abroad', 'a small independent label'],
    subjects: [
      'a body of work with a single obsessive idea running through it',
      'a format nobody has tried yet because it sits between two media',
      'the thing you keep making when nobody is asking',
    ],
    challenge:
      'The work improves faster than the audience grows. Learning to show unfinished things is the real skill.',
  },
  {
    key: 'business',
    label: 'Building & leading',
    keywords: [
      'entrepreneur', 'startup', 'start-up', 'company', 'founder', 'business', 'product',
      'manager', 'leadership', 'lead', 'ceo', 'consulting', 'finance', 'invest', 'venture',
      'market', 'sales', 'brand', 'agency',
    ],
    verbs: ['build', 'launch', 'raise', 'hire', 'scale'],
    places: ['a two-person office', 'an accelerator cohort', 'a market that has never been served well'],
    subjects: [
      'a problem you personally could not stop thinking about',
      'a small product that removes one specific frustration',
      'a service that is obviously needed and strangely missing',
    ],
    challenge:
      'Momentum hides bad assumptions. The hardest month is the one where the numbers say the idea needs to change shape.',
  },
  {
    key: 'exploration',
    label: 'Travel & fieldwork',
    keywords: [
      'explore', 'explorer', 'travel', 'country', 'abroad', 'world', 'journey', 'mountain',
      'ocean', 'sea', 'dive', 'climb', 'hike', 'expedition', 'wilderness', 'sail', 'nomad',
      'live in', 'move to', 'new place',
    ],
    verbs: ['travel', 'document', 'map', 'learn', 'return'],
    places: ['a coastal town you cannot pronounce yet', 'a highland route with no signal', 'a city on the other side of the language barrier'],
    subjects: [
      'a place that changes the questions you ask',
      'a route that takes three weeks and one notebook',
      'a community that has solved something quietly',
    ],
    challenge:
      'Motion is easy; belonging is not. The difficult part is choosing somewhere to stay long enough to be changed by it.',
  },
  {
    key: 'health',
    label: 'Care & the body',
    keywords: [
      'health', 'fitness', 'athlete', 'sport', 'training', 'marathon', 'nutrition', 'therapy',
      'therapist', 'nurse', 'psychology', 'wellbeing', 'meditation', 'sleep', 'recovery', 'yoga',
    ],
    verbs: ['train', 'practise', 'recover', 'support', 'sustain'],
    places: ['a clinic that treats the whole person', 'a training programme built around your own limits', 'a practice focused on prevention'],
    subjects: [
      'a sustainable routine rather than an extreme one',
      'a skill that compounds with every quiet repetition',
      'the difference between being fit and being well',
    ],
    challenge:
      'Progress is non-linear and the body keeps its own calendar. Consistency beats intensity, and that is harder than it sounds.',
  },
  {
    key: 'technology',
    label: 'Systems & software',
    keywords: [
      'engineer', 'engineering', 'developer', 'software', 'code', 'coding', 'programming',
      'ai', 'machine learning', 'robotics', 'data', 'security', 'cloud', 'systems', 'hardware',
      'maker', 'electronics',
    ],
    verbs: ['build', 'ship', 'instrument', 'debug', 'maintain'],
    places: ['a small engineering team', 'an open-source project with real users', 'a workshop where software meets hardware'],
    subjects: [
      'a system that is boring in exactly the right ways',
      'a tool you wish existed three years ago',
      'a problem where correctness matters more than speed',
    ],
    challenge:
      'The interesting engineering is rarely the urgent engineering. Protecting deep work from shallow work is the whole game.',
  },
  {
    key: 'teaching',
    label: 'Teaching & sharing',
    keywords: [
      'teach', 'teacher', 'education', 'professor', 'mentor', 'lecture', 'school', 'university',
      'course', 'workshop', 'community', 'nonprofit', 'volunteer', 'social',
    ],
    verbs: ['explain', 'mentor', 'design', 'gather', 'teach'],
    places: ['a classroom where you are the least senior person in the room', 'a community programme that runs on trust', 'a cohort of people who arrived with different reasons'],
    subjects: [
      'a way of explaining a hard idea so it becomes obvious',
      'a curriculum built from what actually helped you',
      'a room full of people who learn by making',
    ],
    challenge:
      'Teaching exposes every gap in your own understanding. That is the point, and it is also exhausting.',
  },
  {
    key: 'craft',
    label: 'Practice & mastery',
    keywords: [
      'craft', 'carpentry', 'wood', 'cook', 'chef', 'baking', 'ceramics', 'pottery', 'garden',
      'farming', 'repair', 'restore', 'instrument', 'photography', 'print', 'tailor',
    ],
    verbs: ['practise', 'repair', 'refine', 'master', 'sell'],
    places: ['a workshop with a north-facing window', 'a small atelier', 'a market stall that becomes a studio'],
    subjects: [
      'a technique that takes ten thousand hours and never gets boring',
      'a material that rewards patience',
      'a form you return to for decades',
    ],
    challenge:
      'The market rewards speed; craft rewards slowness. Finding the place where both can be true is the work.',
  },
  {
    key: 'generic',
    label: 'An open direction',
    keywords: [],
    verbs: ['begin', 'practise', 'explore', 'build', 'learn'],
    places: ['a small experiment with a visible outcome', 'a weekly block of protected time', 'a group of people who are already doing it'],
    subjects: [
      'a version of this you could start this month',
      'the smallest honest version of the ambition',
      'a version that fits your actual life',
    ],
    challenge:
      'The gap between imagining and starting is mostly a matter of scale. Make the first version small enough to finish.',
  },
]

const PATH_META: Record<
  PathKey,
  {
    label: string
    tone: string
    horizon: string
    stepStyle: (d: Domain, subject: string) => string
    titleStyle: (d: Domain) => string
    challengePrefix: string
  }
> = {
  conservative: {
    label: 'Conservative path',
    tone: 'steady',
    horizon: '3–5 years',
    stepStyle: (_d, subject) => `Block four hours a week and use them on ${subject}. Nothing else changes yet.`,
    titleStyle: (d) => `The quiet version: ${d.label.toLowerCase()}, built slowly`,
    challengePrefix: 'The risk here is not failure, it is drift.',
  },
  alternative: {
    label: 'Alternative path',
    tone: 'lateral',
    horizon: '2–4 years',
    stepStyle: () => `Find one person already doing this and ask them for the version of the plan they would not post publicly.`,
    titleStyle: (d) => `The lateral move: ${d.label.toLowerCase()}, from an unexpected angle`,
    challengePrefix: 'The risk here is novelty for its own sake.',
  },
  unexpected: {
    label: 'Unexpected path',
    tone: 'strange',
    horizon: '5–12 years',
    stepStyle: () => `Spend a weekend pretending this is already your life. Write down what actually felt right.`,
    titleStyle: (d) => `The strange version: ${d.label.toLowerCase()}, taken seriously`,
    challengePrefix: 'The risk here is that it works.',
  },
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset * 7919) % arr.length]
}

export function matchDomain(input: string): Domain {
  const text = input.toLowerCase()
  let best: { domain: Domain; score: number } | null = null
  for (const d of DOMAINS) {
    if (!d.keywords.length) continue
    let score = 0
    for (const k of d.keywords) {
      if (text.includes(k)) score += k.length > 5 ? 2 : 1
    }
    if (score > 0 && (!best || score > best.score)) best = { domain: d, score }
  }
  return best?.domain ?? DOMAINS[DOMAINS.length - 1]
}

export function generateScenario(input: string, path: PathKey): Scenario {
  const trimmed = input.trim()
  const domain = matchDomain(trimmed)
  const seed = hash(`${trimmed.toLowerCase()}::${path}::${domain.key}`)
  const meta = PATH_META[path]

  const subject = pick(domain.subjects, seed, 1)
  const verb = pick(domain.verbs, seed, 2)
  const place = pick(domain.places, seed, 3)

  const titles: Record<PathKey, string> = {
    conservative: meta.titleStyle(domain),
    alternative: meta.titleStyle(domain),
    unexpected: meta.titleStyle(domain),
  }

  const milestoneSets: Record<PathKey, Milestone[]> = {
    conservative: [
      { when: 'First 6 months', text: `You ${verb} ${subject} in ${place}, mostly on evenings and weekends.` },
      { when: 'Year 1–2', text: `The work starts to be legible to other people — a small portfolio, a first result, one collaboration that sticks.` },
      { when: 'Year 3–5', text: `It becomes part of your identity rather than an addition to it. The schedule is stable; the ambition quietly grows.` },
    ],
    alternative: [
      { when: 'First 3 months', text: `You borrow the method of ${domain.label.toLowerCase()} and apply it somewhere it was never meant to go.` },
      { when: 'Year 1', text: `You ${verb} alongside ${place} and discover the constraint that makes the idea specific.` },
      { when: 'Year 2–4', text: `The hybrid you created becomes the thing people know you for — neither of the original fields, but both.` },
    ],
    unexpected: [
      { when: 'The first detour', text: `You follow ${subject} far enough that the original plan stops making sense — in a good way.` },
      { when: 'The middle', text: `You end up in ${place}, working with people you could not have named a year earlier.` },
      { when: 'The long tail', text: `What started as a sideline becomes the throughline. You ${verb} something that did not exist before you began.` },
    ],
  }

  const challenges: Record<PathKey, string> = {
    conservative: `Steady progress is easy to postpone. ${domain.challenge}`,
    alternative: `Two disciplines means two sets of standards. ${domain.challenge}`,
    unexpected: `Without a clear map, momentum is the only compass. ${domain.challenge}`,
  }

  const firstSteps: Record<PathKey, string> = {
    conservative: meta.stepStyle(domain, subject),
    alternative: `Write one paragraph describing the version of ${domain.label.toLowerCase()} that borrows from another field entirely. Then find the first person who would read it.`,
    unexpected: `Ask three people what they would do if they were not allowed to do the obvious thing. Notice which answer you keep thinking about.`,
  }

  return {
    title: titles[path],
    path,
    domain: domain.key,
    milestones: milestoneSets[path],
    challenge: `${meta.challengePrefix} ${challenges[path]}`,
    firstStep: firstSteps[path],
    horizon: meta.horizon,
    signature: [
      (seed % 1000) / 1000,
      ((seed >> 10) % 1000) / 1000,
      ((seed >> 20) % 1000) / 1000,
    ],
  }
}

export const PATH_OPTIONS: { key: PathKey; label: string }[] = [
  { key: 'conservative', label: 'Conservative path' },
  { key: 'alternative', label: 'Alternative path' },
  { key: 'unexpected', label: 'Unexpected path' },
]
