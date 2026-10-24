export type RouteKey = 'creator' | 'scientist' | 'entrepreneur' | 'explorer'

export interface Route {
  key: RouteKey
  index: number
  name: string
  tag: string
  copy: string
  color: string
  /** scene-space label position hint, used for CSS placement */
  x: number
  y: number
}

export const ROUTES: Route[] = [
  {
    key: 'creator',
    index: 0,
    name: 'CREATOR',
    tag: 'Path 01',
    copy: 'Build ideas that change how people experience the world.',
    color: '#8fe8f6',
    x: 18,
    y: 30,
  },
  {
    key: 'scientist',
    index: 1,
    name: 'SCIENTIST',
    tag: 'Path 02',
    copy: 'Ask difficult questions and uncover what lies beyond the known.',
    color: '#6f9dff',
    x: 62,
    y: 20,
  },
  {
    key: 'entrepreneur',
    index: 2,
    name: 'ENTREPRENEUR',
    tag: 'Path 03',
    copy: 'Turn ambitious ideas into meaningful products.',
    color: '#a78bfa',
    x: 70,
    y: 58,
  },
  {
    key: 'explorer',
    index: 3,
    name: 'EXPLORER',
    tag: 'Path 04',
    copy: 'Discover unfamiliar places, disciplines, and possibilities.',
    color: '#9fd6c4',
    x: 22,
    y: 64,
  },
]

export interface Possibility {
  key: 'career' | 'learning' | 'lifestyle'
  index: number
  title: string
  copy: string
  /** local demo data shown when the card is selected */
  data: {
    horizon: string
    facets: { label: string; value: number }[]
    note: string
  }
}

export const POSSIBILITIES: Possibility[] = [
  {
    key: 'career',
    index: 0,
    title: 'CAREER',
    copy: 'Explore alternative professional directions.',
    data: {
      horizon: '5–10 years',
      facets: [
        { label: 'Autonomy', value: 0.78 },
        { label: 'Specialism', value: 0.62 },
        { label: 'Impact', value: 0.86 },
        { label: 'Stability', value: 0.44 },
      ],
      note: 'A career shaped more by the problems you choose than by the title you hold.',
    },
  },
  {
    key: 'learning',
    index: 1,
    title: 'LEARNING',
    copy: 'Visualize new skills, disciplines, and interests.',
    data: {
      horizon: '1–3 years',
      facets: [
        { label: 'Depth', value: 0.7 },
        { label: 'Breadth', value: 0.82 },
        { label: 'Practice', value: 0.9 },
        { label: 'Theory', value: 0.55 },
      ],
      note: 'Skills are less like checkpoints and more like compounding interests.',
    },
  },
  {
    key: 'lifestyle',
    index: 2,
    title: 'LIFESTYLE',
    copy: 'Imagine different routines, priorities, and ambitions.',
    data: {
      horizon: 'Now — 5 years',
      facets: [
        { label: 'Rest', value: 0.74 },
        { label: 'Motion', value: 0.58 },
        { label: 'Focus', value: 0.66 },
        { label: 'Community', value: 0.8 },
      ],
      note: 'The quiet architecture of a day decides what a decade is made of.',
    },
  },
]
