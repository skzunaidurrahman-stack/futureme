import { useSyncExternalStore } from 'react'
import { emitScene, onScene, params, type SceneParams } from './sceneParams'

let scheduled = false
let queued: Partial<SceneParams> = {}

/** Apply scene params at most once per animation frame (coalesced). */
export function setScene(patch: Partial<SceneParams>) {
  queued = { ...queued, ...patch }
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    Object.assign(params, queued)
    queued = {}
    scheduled = false
    emitScene()
  })
}

/** Apply immediately — only for discrete, user-driven changes. */
export function setSceneNow(patch: Partial<SceneParams>) {
  Object.assign(params, patch)
  emitScene()
}

/* ------------------------------------------------------------------ */
/* React bridge — lets UI read discrete scene values without the       */
/* render loop ever causing re-renders.                                */
/* ------------------------------------------------------------------ */

let version = 0
const listeners = new Set<() => void>()

onScene(() => {
  version++
  for (const fn of listeners) fn()
})

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

const getVersion = () => version

export function useSceneVersion() {
  return useSyncExternalStore(subscribe, getVersion, getVersion)
}

/** Raw pointer target — consumed by the render loop, never by React. */
import { pointer } from './sceneParams'
export function setPointer(x: number, y: number) {
  pointer.tx = x
  pointer.ty = y
}
