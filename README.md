# FUTUREME — Your life, simulated

An experimental digital universe for exploring the possible versions of your future.
Cinematic scroll storytelling over a single procedural particle planet — no backend,
no API keys, no assets beyond fonts.

**Live preview:** run it locally with the commands below.

---

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript, built with Vite |
| 3D | Three.js — one renderer, one scene graph, one RAF loop |
| Scroll | GSAP + ScrollTrigger (scrubbed master timeline) |
| Icons | lucide-react |
| Type | Space Grotesk, Instrument Serif, JetBrains Mono |

No Lenis, no post-processing, no external AI calls.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # type-checks, then builds to dist/
npm run preview
```

Lint:

```bash
npm run lint
```

## How it is put together

```
src/
  App.tsx                  boot milestones, loader gate, section composition
  app.css                  layout + art direction
  index.css                tokens, primitives, buttons, glass
  experience/
    FutureScene.ts         the whole 3D system (planet, network, routes,
                           portal, city, dust, mini branches)
    SceneCanvas.tsx        the single WebGL canvas + lifecycle/cleanup
  lib/
    quality.ts             capability detection → tier, DPR cap, budgets
    sceneParams.ts         parameter bus shared by GSAP and the render loop
    sceneBridge.ts         coalesced writes + React subscription bridge
    useScrollSystem.ts     master keyframe camera journey + reveals
  sections/                Hero, Present, Branching, AnotherLife,
                           Possibilities, Explore, Reveal, About
  components/              Loader, NavOverlay, ProgressRail, Cursor
  data/
    content.ts             routes + possibility lenses (local demo data)
    scenarios.ts           deterministic scenario generator
```

### The scroll system

`useScrollSystem` samples a list of keyframes — each a complete scene state
(scale, camera distance/angle, fov, network, branch, portal, city, converge) —
against total page progress, with a smoothstep between neighbours. Scene writes
are coalesced to one per animation frame, so scrolling never triggers a React
render.

### Performance notes

- One `WebGLRenderer`, reused; disposed on unmount along with every geometry,
  material and the RAF loop.
- Device tiers (`high` / `mid` / `low` / `fallback`) set particle budgets
  (2 400 / 1 800 / 1 200), star and dust counts, antialiasing and a DPR cap of
  1.5 / 1.25 / 1.
- The low tier runs at half frame rate and shortens the camera journey.
- The render loop pauses when the tab is hidden.
- All geometry is procedural; the only texture is a tiny inline SVG grain.
- If WebGL is unavailable the site falls back to a pure-CSS visual and remains
  fully usable.

### Accessibility

Semantic sections and headings, a skip link, keyboard-reachable controls with
visible focus rings, `aria-pressed` on selectable cards, live regions for the
scenario output and chapter state, a real dialog for the index overlay, and full
`prefers-reduced-motion` support (animations and scroll scrubbing disabled,
copy shown in its final state).

## The scenario generator

`src/data/scenarios.ts` matches keywords to a domain (research, creative,
business, exploration, health, technology, teaching, craft, or a generic
fallback) and combines it with one of three trajectories — conservative,
alternative, unexpected. Output is deterministic: the same input always yields
the same milestones, challenge and first step. It is explicitly framed as an
imaginative sketch, not a prediction or advice.

## Deploying

The build output is fully static:

```bash
npm run build
```

Publish `dist/` to Netlify, Vercel, Cloudflare Pages, GitHub Pages or any static
host. No environment variables are required.

---

An exploration of what could be.
