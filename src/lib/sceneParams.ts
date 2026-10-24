/**
 * A tiny scene-parameter bus. The scroll timeline (GSAP) writes here,
 * the render loop reads here. Nothing here touches React state, so
 * animation never triggers a re-render.
 */
export interface SceneParams {
  /** 0 → 1 master scroll progress across the whole experience */
  scroll: number
  /** planet radius multiplier */
  scale: number
  /** camera distance from planet centre */
  camDist: number
  /** camera vertical angle (radians) */
  camPolar: number
  /** camera azimuth offset (radians) */
  camAzimuth: number
  /** camera target Y */
  camTargetY: number
  /** camera fov */
  fov: number
  /** normalised pointer (-1 → 1) */
  pointerX: number
  pointerY: number
  /** 0 → 1 how "networked" the surface looks (branch connections visible) */
  network: number
  /** 0 → 1 how much the planet is disrupted/branching into routes */
  branch: number
  /** 0 → 1 portal ring visibility */
  portal: number
  /** 0 → 1 city visibility */
  city: number
  /** 0 → 1 city camera travel */
  cityTravel: number
  /** 0 → 1 convergence (all paths collapse to one point) */
  converge: number
  /** 0 → 1 global brightness / presence of the whole system */
  presence: number
  /** planet rotation speed multiplier */
  spin: number
  /** which possibility is selected (0..2), -1 = none */
  possibility: number
  /** 0 → 1 how far the 3 miniature branch paths are drawn */
  miniBranches: number
}

export const params: SceneParams = {
  scroll: 0,
  scale: 1,
  camDist: 7.4,
  camPolar: Math.PI / 2,
  camAzimuth: 0,
  camTargetY: 0,
  fov: 42,
  pointerX: 0,
  pointerY: 0,
  network: 0,
  branch: 0,
  portal: 0,
  city: 0,
  cityTravel: 0,
  converge: 0,
  presence: 1,
  spin: 1,
  possibility: -1,
  miniBranches: 0,
}

type Listener = (p: SceneParams) => void
const listeners = new Set<Listener>()

export function onScene(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function emitScene() {
  for (const fn of listeners) fn(params)
}

/** Smoothly animated pointer that the render loop can read. */
export const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
