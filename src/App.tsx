import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cursor } from './components/Cursor'
import { Loader } from './components/Loader'
import { NavOverlay, ProgressRail } from './components/NavOverlay'
import { SceneCanvas, type SceneHandle } from './experience/SceneCanvas'
import { getQuality, type Quality } from './lib/quality'
import { useScrollSystem } from './lib/useScrollSystem'
import { Hero } from './sections/Hero'
import { Present } from './sections/Present'
import { Branching } from './sections/Branching'
import { AnotherLife } from './sections/AnotherLife'
import { Possibilities } from './sections/Possibilities'
import { Explore } from './sections/Explore'
import { About } from './sections/About'
import { Footer, Reveal } from './sections/Reveal'
import './app.css'

export default function App() {
  const quality = useMemo<Quality>(() => getQuality(), [])
  const sceneRef = useRef<SceneHandle | null>(null)
  const [bootProgress, setBootProgress] = useState(0.06)
  const [sceneReady, setSceneReady] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [layoutReady, setLayoutReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)

  /* ---------- real boot milestones ---------- */
  useEffect(() => {
    let cancelled = false
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) {
          setFontsReady(true)
          setBootProgress((p) => Math.max(p, 0.55))
        }
      })
    } else {
      setFontsReady(true)
    }
    const t = window.setTimeout(() => {
      if (!cancelled) setLayoutReady(true)
    }, 260)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (sceneReady) setBootProgress((p) => Math.max(p, 0.85))
    if (fontsReady && layoutReady) setBootProgress((p) => Math.max(p, 0.92))
    if (sceneReady && fontsReady && layoutReady) setBootProgress(1)
  }, [sceneReady, fontsReady, layoutReady])

  const ready = fontsReady && layoutReady && (sceneReady || webglFailed)

  useEffect(() => {
    if (webglFailed) {
      document.documentElement.classList.add('no-webgl')
    }
  }, [webglFailed])

  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const handleSceneUnavailable = useCallback(() => {
    setWebglFailed(true)
    setSceneReady(true)
  }, [])

  const { progress, activeChapter, scrollTo } = useScrollSystem({
    quality,
    started: entered,
  })

  /* ---------- lock scroll while the loader is on screen ---------- */
  useEffect(() => {
    if (entered) {
      document.body.classList.remove('is-locked')
      return
    }
    document.body.classList.add('is-locked')
    window.scrollTo(0, 0)
  }, [entered])

  const onEnter = useCallback(() => {
    setEntered(true)
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <a className="skip-link" href="#explore">
        Skip to the interactive simulator
      </a>

      <Cursor />

      <div className="scene-layer" aria-hidden="true">
        {!webglFailed && (
          <SceneCanvas
            handleRef={sceneRef}
            onReady={handleSceneReady}
            onUnavailable={handleSceneUnavailable}
          />
        )}
        <div className="scene-grain" />
        <div className="scene-vignette" />
        {webglFailed && <div className="scene-fallback" />}
      </div>

      <NavOverlay progress={progress} activeChapter={activeChapter} scrollTo={scrollTo} />
      <ProgressRail progress={progress} activeChapter={activeChapter} scrollTo={scrollTo} />

      <main id="experience" className={`experience ${entered ? 'is-live' : ''}`}>
        <Hero scrollTo={scrollTo} />
        <Present />
        <Branching scrollTo={scrollTo} />
        <AnotherLife />
        <Possibilities onSelect={(i) => sceneRef.current?.setPossibility(i)} />
        <Explore onScenario={(s) => sceneRef.current?.setPossibility(s ? 1 : -1)} />
        <Reveal scrollTo={scrollTo} />
        <About />
      </main>

      <Footer scrollTo={scrollTo} />

      {!entered && <Loader progress={bootProgress} ready={ready} onEnter={onEnter} />}

      {webglFailed && (
        <p className="webgl-note mono">
          WebGL is unavailable — the visual journey is shown in its reduced CSS form. Every chapter
          and the simulator remain fully usable.
        </p>
      )}
    </>
  )
}
