import * as THREE from 'three'
import type { Quality } from '../lib/quality'
import { clamp, lerp } from '../lib/quality'
import { params, pointer, type SceneParams } from '../lib/sceneParams'

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const PLANET_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform float uNetwork;
  uniform float uBranch;
  uniform float uConverge;
  uniform vec3  uPointer;
  uniform float uSpin;
  attribute float aSeed;
  attribute float aSize;
  attribute float aNetwork;
  varying float vAlpha;
  varying vec3  vColor;
  varying float vSeed;

  void main() {
    vec3 p = position;
    vSeed = aSeed;

    // slow independent shimmer so the surface feels alive, not uniform
    float wave = sin(uTime * 0.55 + aSeed * 6.2831 + p.y * 1.6) * 0.012;
    p *= 1.0 + wave * (0.35 + aNetwork * 1.4);

    // network lift: nodes that belong to a connection rise off the surface
    float lift = aNetwork * uNetwork * (0.05 + 0.14 * aSize);
    p += normalize(position + 0.0001) * lift;

    // convergence: spiral inward to a single bright point
    float k = uConverge;
    if (k > 0.0001) {
      float ang = k * 5.2 + aSeed * 2.4;
      float c = cos(ang);
      float s = sin(ang);
      vec3 q = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
      p = mix(q, q * 0.02, smoothstep(0.0, 1.0, k));
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    // perspective sizing, clamped so points never explode near the camera
    float size = uSize * aSize * uDpr * (18.0 / max(dist, 0.8));
    gl_PointSize = clamp(size, 0.6, 26.0);

    float facing = smoothstep(-1.0, 0.6, normalize(position).y * 0.0 + 1.0);
    float nearFade = smoothstep(0.35, 1.6, dist);

    float alpha = 1.0;
    alpha *= mix(0.35, 1.0, facing);
    alpha *= nearFade;

    // pointer-responsive highlight on the sphere
    vec3 n = normalize(position);
    float pt = max(0.0, dot(n, normalize(uPointer)));
    vColor = mix(vec3(0.42, 0.62, 1.0), vec3(0.56, 0.91, 0.97), aNetwork * 0.85);
    vColor = mix(vColor, vec3(0.66, 0.55, 0.98), smoothstep(0.45, 1.0, aSeed) * 0.45);
    vColor += pt * pt * vec3(0.35, 0.55, 0.85) * 0.9;
    vColor *= mix(1.0, 1.5, uNetwork * 0.5);

    vAlpha = alpha * mix(0.55, 1.0, aSize);
    vAlpha *= 1.0 + uBranch * 0.25;
    vAlpha *= 1.0 - uConverge * 0.55;

    gl_Position = projectionMatrix * mv;
  }
`

const PLANET_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying vec3  vColor;
  varying float vSeed;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.2);
    float a = vAlpha * uOpacity * glow;
    if (a < 0.004) discard;
    vec3 col = vColor + vec3(0.12) * pow(core, 6.0);
    gl_FragColor = vec4(col, a);
  }
`

const DUST_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uDpr;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    p.x += sin(uTime * 0.12 + aSeed * 9.0) * 0.35;
    p.y += cos(uTime * 0.09 + aSeed * 7.0) * 0.3;
    p.z += sin(uTime * 0.07 + aSeed * 5.0) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(uSize * uDpr * (10.0 / max(-mv.z, 1.0)), 0.5, 12.0);
    vAlpha = smoothstep(60.0, 6.0, -mv.z) * smoothstep(0.6, 3.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const DUST_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = pow(smoothstep(0.5, 0.0, d), 2.5);
    float a = vAlpha * uOpacity * glow;
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uColorA, uColorB, vSeed), a);
  }
`

const STAR_VERT = /* glsl */ `
  uniform float uDpr;
  uniform float uTime;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp((0.9 + aSeed * 1.7) * uDpr, 0.5, 4.0);
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.4 + aSeed * 1.6) + aSeed * 30.0);
    vAlpha = twinkle;
    gl_Position = projectionMatrix * mv;
  }
`

const STAR_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = pow(smoothstep(0.5, 0.0, d), 1.8);
    vec3 col = mix(vec3(0.72, 0.82, 1.0), vec3(0.85, 0.9, 1.0), vSeed);
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`

const LINE_VERT = /* glsl */ `
  attribute float aProgress;
  attribute float aSeed;
  varying float vProgress;
  varying float vSeed;
  void main() {
    vProgress = aProgress;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const LINE_FRAG = /* glsl */ `
  uniform float uDraw;
  uniform float uOpacity;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uTime;
  varying float vProgress;
  varying float vSeed;
  void main() {
    if (vProgress > uDraw) discard;
    float edge = smoothstep(uDraw - 0.12, uDraw, vProgress);
    float head = smoothstep(0.0, 0.35, vProgress);
    vec3 col = mix(uColorA, uColorB, vProgress);
    float pulse = 0.78 + 0.22 * sin(uTime * 1.2 + vSeed * 12.0 + vProgress * 6.0);
    float a = uOpacity * pulse * (0.35 + 0.65 * head) * (0.6 + edge * 0.4);
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`

/* ------------------------------------------------------------------ */
/* Geometry builders                                                   */
/* ------------------------------------------------------------------ */

function fibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    positions[i * 3] = Math.cos(theta) * r * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = Math.sin(theta) * r * radius
  }
  return positions
}

function rand(seed: number) {
  // deterministic-ish PRNG so layouts are stable between reloads
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export interface Experience {
  dispose: () => void
  setActive: (active: boolean) => void
  pulse: () => void
  setPossibility: (index: number) => void
  setMiniBranches: (amount: number) => void
  onResize: () => void
}

export function createExperience(canvas: HTMLCanvasElement, quality: Quality): Experience {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    alpha: false,
    powerPreference: 'low-power',
    stencil: false,
    depth: true,
  })
  renderer.setPixelRatio(quality.dpr)
  renderer.setClearColor(0x050609, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050609, 0.028)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 260)
  camera.position.set(0, 0, 7.4)

  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o)
    return o
  }

  /* ---------------- shared uniforms ---------------- */
  const uTime = { value: 0 }
  const uDpr = { value: quality.dpr }

  /* ---------------- stars (far field) ---------------- */
  const starGeo = track(new THREE.BufferGeometry())
  {
    const n = quality.stars
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const r = 60 + rand(i * 3.1) * 90
      const theta = rand(i * 1.7) * Math.PI * 2
      const phi = Math.acos(2 * rand(i * 5.3) - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.6
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      seed[i] = rand(i * 9.7)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    starGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  }
  const starMat = track(
    new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uDpr, uTime, uOpacity: { value: 0.9 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  const stars = new THREE.Points(starGeo, starMat)
  stars.frustumCulled = false
  scene.add(stars)

  /* ---------------- planet particle cloud ---------------- */
  const planetGroup = new THREE.Group()
  scene.add(planetGroup)

  const PLANET_R = 1.55
  const planetGeo = track(new THREE.BufferGeometry())
  const planetMat: THREE.ShaderMaterial = track(
    new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uTime,
        uDpr,
        uSize: { value: 2.1 },
        uOpacity: { value: 1 },
        uNetwork: { value: 0 },
        uBranch: { value: 0 },
        uConverge: { value: 0 },
        uSpin: { value: 1 },
        uPointer: { value: new THREE.Vector3(0, 0, 1) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )

  const nodeCount = quality.particles
  {
    const base = fibonacciSphere(nodeCount, PLANET_R)
    const pos = new Float32Array(base)
    const seed = new Float32Array(nodeCount)
    const size = new Float32Array(nodeCount)
    const net = new Float32Array(nodeCount)
    for (let i = 0; i < nodeCount; i++) {
      const s = rand(i * 2.13)
      seed[i] = s
      size[i] = 0.55 + Math.pow(rand(i * 4.71), 2.2) * 1.35
      // ~38% of nodes are network anchors that lift off the surface
      net[i] = rand(i * 7.77) > 0.62 ? 1 : 0
      // slight radial scatter so the shell has thickness
      const jitter = 1 + (rand(i * 11.3) - 0.5) * 0.045
      pos[i * 3] *= jitter
      pos[i * 3 + 1] *= jitter
      pos[i * 3 + 2] *= jitter
    }
    planetGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    planetGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    planetGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    planetGeo.setAttribute('aNetwork', new THREE.BufferAttribute(net, 1))
  }
  const planet = new THREE.Points(planetGeo, planetMat)
  planet.frustumCulled = false
  planetGroup.add(planet)

  /* ---------------- orbital rings ---------------- */
  const ringGroup = new THREE.Group()
  planetGroup.add(ringGroup)
  const ringMaterials: THREE.ShaderMaterial[] = []
  const RING_TILTS = [
    { rx: Math.PI / 2 - 0.32, rz: 0.18, r: 2.15, speed: 0.05 },
    { rx: Math.PI / 2 + 0.22, rz: -0.42, r: 2.62, speed: -0.035 },
    { rx: Math.PI / 2 - 0.08, rz: 0.6, r: 3.1, speed: 0.022 },
  ]
  for (let i = 0; i < RING_TILTS.length; i++) {
    const cfg = RING_TILTS[i]
    const seg = quality.tier === 'low' ? 180 : 320
    const geo = track(new THREE.BufferGeometry())
    const pts = new Float32Array(seg * 3)
    const prog = new Float32Array(seg)
    const seed = new Float32Array(seg)
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2
      const wobble = 1 + Math.sin(a * 3 + i) * 0.012
      pts[s * 3] = Math.cos(a) * cfg.r * wobble
      pts[s * 3 + 1] = Math.sin(a * 3 + i) * 0.03
      pts[s * 3 + 2] = Math.sin(a) * cfg.r * wobble
      prog[s] = s / seg
      seed[s] = rand(s + i * 31)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    geo.setAttribute('aProgress', new THREE.BufferAttribute(prog, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = track(
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: {
          uDraw: { value: 1 },
          uOpacity: { value: 0.55 },
          uTime,
          uColorA: { value: new THREE.Color('#5f7dff') },
          uColorB: { value: new THREE.Color('#8fe8f6') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    ringMaterials.push(mat)
    const line = new THREE.LineLoop(geo, mat)
    line.rotation.set(cfg.rx, 0, cfg.rz)
    line.userData.speed = cfg.speed
    ringGroup.add(line)
  }

  /* ---------------- atmosphere glow (cheap additive shell) ---------------- */
  const atmoMat = track(
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
          float glow = pow(rim, 2.6);
          gl_FragColor = vec4(uColor, glow * uOpacity);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color('#4b7bff') },
        uOpacity: { value: 0.55 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  )
  const atmoGeo = track(new THREE.SphereGeometry(PLANET_R * 1.34, 32, 24))
  const atmo = new THREE.Mesh(atmoGeo, atmoMat)
  planetGroup.add(atmo)

  /* ---------------- surface branch network ---------------- */
  // Short arcs connecting anchor nodes across the sphere. Drawn as one
  // LineSegments object with a single draw-range shader.
  const networkMat = track(
    new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      uniforms: {
        uDraw: { value: 0 },
        uOpacity: { value: 0 },
        uTime,
        uColorA: { value: new THREE.Color('#7fa4ff') },
        uColorB: { value: new THREE.Color('#a78bfa') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  const networkGeo = track(new THREE.BufferGeometry())
  {
    const anchorCount = Math.min(quality.tier === 'low' ? 90 : 150, Math.floor(nodeCount / 8))
    const verts: number[] = []
    const prog: number[] = []
    const seeds: number[] = []
    const v = new THREE.Vector3()
    for (let i = 0; i < anchorCount; i++) {
      const a1 = rand(i * 3.71) * Math.PI * 2
      const a2 = rand(i * 8.13) * Math.PI * 2
      const y1 = rand(i * 5.19) * 2 - 1
      const y2 = rand(i * 1.37) * 2 - 1
      const p1 = new THREE.Vector3(
        Math.cos(a1) * Math.sqrt(1 - y1 * y1),
        y1,
        Math.sin(a1) * Math.sqrt(1 - y1 * y1),
      ).multiplyScalar(PLANET_R * 1.045)
      const p2 = new THREE.Vector3(
        Math.cos(a2) * Math.sqrt(1 - y2 * y2),
        y2,
        Math.sin(a2) * Math.sqrt(1 - y2 * y2),
      ).multiplyScalar(PLANET_R * 1.045)
      const segments = 10
      for (let s = 0; s < segments; s++) {
        const t1 = s / segments
        const t2 = (s + 1) / segments
        v.lerpVectors(p1, p2, t1)
        const len1 = v.length()
        v.multiplyScalar((len1 + Math.sin(t1 * Math.PI) * 0.26) / len1)
        verts.push(v.x, v.y, v.z)
        prog.push(t1)
        seeds.push(rand(i * 2.9))

        v.lerpVectors(p1, p2, t2)
        const len2 = v.length()
        v.multiplyScalar((len2 + Math.sin(t2 * Math.PI) * 0.26) / len2)
        verts.push(v.x, v.y, v.z)
        prog.push(t2)
        seeds.push(rand(i * 2.9))
      }
    }
    networkGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    networkGeo.setAttribute('aProgress', new THREE.Float32BufferAttribute(prog, 1))
    networkGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  }
  const network = new THREE.LineSegments(networkGeo, networkMat)
  network.frustumCulled = false
  planetGroup.add(network)

  /* ---------------- branching future (chapter 2) ---------------- */
  const branchGroup = new THREE.Group()
  scene.add(branchGroup)

  interface Route {
    group: THREE.Group
    mat: THREE.ShaderMaterial
    coreMat: THREE.ShaderMaterial
    dir: THREE.Vector3
    label: THREE.Vector3
  }
  const ROUTE_DIRS = [
    new THREE.Vector3(-0.78, 0.5, 0.32),
    new THREE.Vector3(0.2, 0.82, 0.55),
    new THREE.Vector3(0.86, 0.18, 0.48),
    new THREE.Vector3(-0.15, -0.62, 0.78),
  ]
  const ROUTE_COLORS = ['#8fe8f6', '#6f9dff', '#a78bfa', '#9fd6c4']

  const routes: Route[] = ROUTE_DIRS.map((dir, i) => {
    const group = new THREE.Group()
    const normal = dir.clone().normalize()
    const start = normal.clone().multiplyScalar(PLANET_R * 0.5)

    // curved path outward with gentle lateral drift
    const pts: THREE.Vector3[] = []
    const side = new THREE.Vector3(normal.z, 0.35, -normal.x).normalize()
    const segs = 42
    for (let s = 0; s <= segs; s++) {
      const t = s / segs
      const p = start.clone().lerp(normal.clone().multiplyScalar(11 + i * 0.7), t)
      p.addScaledVector(side, Math.sin(t * Math.PI) * (1.6 + i * 0.35))
      p.y += Math.sin(t * Math.PI * 0.9) * (1.2 + i * 0.2)
      pts.push(p)
    }

    const geo = track(new THREE.BufferGeometry())
    const verts: number[] = []
    const prog: number[] = []
    const seeds: number[] = []
    for (let s = 0; s < segs; s++) {
      const a = pts[s]
      const b = pts[s + 1]
      verts.push(a.x, a.y, a.z, b.x, b.y, b.z)
      prog.push(s / segs, (s + 1) / segs)
      seeds.push(i / 4, i / 4)
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(prog, 1))
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))

    const color = new THREE.Color(ROUTE_COLORS[i])
    const mat = track(
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: {
          uDraw: { value: 0 },
          uOpacity: { value: 0 },
          uTime,
          uColorA: { value: color.clone().multiplyScalar(0.55) },
          uColorB: { value: color.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    const line = new THREE.LineSegments(geo, mat)
    line.frustumCulled = false
    group.add(line)

    // travelling particle trail along the route
    const trailGeo = track(new THREE.BufferGeometry())
    const trailCount = quality.tier === 'low' ? 24 : 48
    const tpos = new Float32Array(trailCount * 3)
    const tseed = new Float32Array(trailCount)
    const tprog = new Float32Array(trailCount)
    for (let s = 0; s < trailCount; s++) {
      tprog[s] = s / trailCount
      tseed[s] = rand(s + i * 17)
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3))
    trailGeo.setAttribute('aProgress', new THREE.BufferAttribute(tprog, 1))
    trailGeo.setAttribute('aSeed', new THREE.BufferAttribute(tseed, 1))

    const coreMat = track(
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          uniform float uTravel;
          uniform float uDpr;
          uniform float uOpacity;
          attribute float aProgress;
          attribute float aSeed;
          varying float vAlpha;
          varying float vSeed;
          void main() {
            float t = fract(aProgress + uTravel);
            vSeed = aSeed;
            // sample the same curve shape in the vertex shader
            vec3 dir = normalize(vec3(${normal.x.toFixed(4)}, ${normal.y.toFixed(4)}, ${normal.z.toFixed(4)}));
            vec3 start = dir * ${(PLANET_R * 0.5).toFixed(4)};
            vec3 end = dir * ${(11 + i * 0.7).toFixed(4)};
            vec3 side = normalize(vec3(dir.z, 0.35, -dir.x));
            vec3 p = mix(start, end, t);
            p += side * sin(t * 3.14159) * ${(1.6 + i * 0.35).toFixed(4)};
            p.y += sin(t * 3.14159 * 0.9) * ${(1.2 + i * 0.2).toFixed(4)};
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp((1.2 + aSeed * 2.0) * uDpr * (16.0 / max(-mv.z, 1.0)), 0.5, 18.0);
            vAlpha = uOpacity * (1.0 - abs(t - 0.5) * 0.6);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          varying float vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(smoothstep(0.5, 0.0, d), 2.4);
            gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.25), glow * vAlpha);
          }
        `,
        uniforms: {
          uTravel: { value: 0 },
          uDpr,
          uOpacity: { value: 0 },
          uColor: { value: color.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    const trail = new THREE.Points(trailGeo, coreMat)
    trail.frustumCulled = false
    group.add(trail)

    branchGroup.add(group)
    return {
      group,
      mat,
      coreMat,
      dir: normal,
      label: normal.clone().multiplyScalar(8.2).add(side.clone().multiplyScalar(1.4)),
    }
  })

  /* ---------------- portal ring (chapter 3) ---------------- */
  const portalGroup = new THREE.Group()
  scene.add(portalGroup)
  const portalMat = track(
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uDpr;
        attribute float aSeed;
        attribute float aAngle;
        varying float vAlpha;
        varying float vSeed;
        void main() {
          vSeed = aSeed;
          float r = 2.35 + (aSeed - 0.5) * 0.34;
          float ang = aAngle + uTime * (0.06 + aSeed * 0.22);
          vec3 p = vec3(cos(ang) * r, sin(ang) * r, (aSeed - 0.5) * 0.22);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp((1.0 + aSeed * 2.6) * uDpr * (14.0 / max(-mv.z, 1.0)), 0.5, 20.0);
          vAlpha = 0.4 + 0.6 * aSeed;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying float vAlpha;
        varying float vSeed;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float glow = pow(smoothstep(0.5, 0.0, d), 2.2);
          gl_FragColor = vec4(mix(uColorA, uColorB, vSeed), glow * vAlpha * uOpacity);
        }
      `,
      uniforms: {
        uTime,
        uDpr,
        uOpacity: { value: 0 },
        uColorA: { value: new THREE.Color('#8fe8f6') },
        uColorB: { value: new THREE.Color('#a78bfa') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  {
    const n = quality.tier === 'low' ? 420 : 900
    const geo = track(new THREE.BufferGeometry())
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    const ang = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      seed[i] = rand(i * 3.3)
      ang[i] = rand(i * 6.1) * Math.PI * 2
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aAngle', new THREE.BufferAttribute(ang, 1))
    const ring = new THREE.Points(geo, portalMat)
    ring.frustumCulled = false
    portalGroup.add(ring)
  }

  /* ---------------- the future city (chapter 3) ---------------- */
  const cityGroup = new THREE.Group()
  scene.add(cityGroup)

  const cityMat = track(
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vHeight;
        varying float vSeed;
        attribute float aSeed;
        void main() {
          vSeed = aSeed;
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          vHeight = position.y;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vHeight;
        varying float vSeed;
        void main() {
          float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
          float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);
          float band = smoothstep(0.42, 0.46, fract(vHeight * 3.0 + uTime * 0.03)) * 0.35;
          vec3 col = uColor * (0.10 + rim * 1.5 + h * 0.35 + band);
          col = mix(col, vec3(0.55, 0.9, 1.0), rim * 0.35);
          float a = (0.16 + rim * 0.75 + h * 0.12) * uOpacity;
          gl_FragColor = vec4(col, a);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color('#4a6bd6') },
        uOpacity: { value: 0 },
        uTime,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )

  {
    const count = quality.tier === 'high' ? 84 : quality.tier === 'mid' ? 64 : 44
    const geo = track(new THREE.BoxGeometry(1, 1, 1))
    const seedArr = new Float32Array(count)
    const mesh = new THREE.InstancedMesh(geo, cityMat, count)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const ring = 3 + Math.floor(rand(i * 1.9) * 5)
      const angle = rand(i * 7.1) * Math.PI * 2
      const radius = 5 + ring * 4.2 + rand(i * 3.7) * 2.5
      const height = 2 + Math.pow(rand(i * 5.5), 2) * 16
      const w = 0.35 + rand(i * 9.1) * 0.75
      dummy.position.set(
        Math.cos(angle) * radius,
        height / 2 - 3.5,
        Math.sin(angle) * radius - 26 - ring * 2,
      )
      dummy.scale.set(w, height, w)
      dummy.rotation.y = angle
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      seedArr[i] = rand(i * 2.2)
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedArr, 1))
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    cityGroup.add(mesh)
  }

  // thin luminous pathways between buildings
  const cityLinesMat = track(
    new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      uniforms: {
        uDraw: { value: 0 },
        uOpacity: { value: 0 },
        uTime,
        uColorA: { value: new THREE.Color('#6f9dff') },
        uColorB: { value: new THREE.Color('#8fe8f6') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  {
    const geo = track(new THREE.BufferGeometry())
    const verts: number[] = []
    const prog: number[] = []
    const seeds: number[] = []
    const links = quality.tier === 'low' ? 16 : 26
    for (let i = 0; i < links; i++) {
      const a = rand(i * 3.3) * Math.PI * 2
      const r1 = 8 + rand(i * 1.1) * 20
      const r2 = 8 + rand(i * 4.4) * 20
      const y1 = -2 + rand(i * 6.6) * 12
      const y2 = -2 + rand(i * 8.8) * 14
      const p1 = new THREE.Vector3(Math.cos(a) * r1, y1, Math.sin(a) * r1 - 34)
      const p2 = new THREE.Vector3(Math.cos(a + 0.6) * r2, y2, Math.sin(a + 0.6) * r2 - 40)
      const segs = 8
      for (let s = 0; s < segs; s++) {
        const t1 = s / segs
        const t2 = (s + 1) / segs
        const v1 = p1.clone().lerp(p2, t1)
        const v2 = p1.clone().lerp(p2, t2)
        v1.y += Math.sin(t1 * Math.PI) * 1.4
        v2.y += Math.sin(t2 * Math.PI) * 1.4
        verts.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
        prog.push(t1, t2)
        seeds.push(i / links, i / links)
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(prog, 1))
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    const lines = new THREE.LineSegments(geo, cityLinesMat)
    lines.frustumCulled = false
    cityGroup.add(lines)
  }

  /* ---------------- drifting dust (used in city + passage) ---------------- */
  const dustGeo = track(new THREE.BufferGeometry())
  {
    const n = quality.dust
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand(i * 1.3) - 0.5) * 46
      pos[i * 3 + 1] = (rand(i * 2.7) - 0.5) * 26
      pos[i * 3 + 2] = -rand(i * 4.9) * 60 + 10
      seed[i] = rand(i * 8.1)
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  }
  const dustMat = track(
    new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: {
        uTime,
        uDpr,
        uSize: { value: 1.4 },
        uOpacity: { value: 0 },
        uColorA: { value: new THREE.Color('#8fe8f6') },
        uColorB: { value: new THREE.Color('#a78bfa') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.frustumCulled = false
  scene.add(dust)

  /* ---------------- three miniature paths (chapter 5 result) ---------------- */
  // Each path lives in its own group, anchored at the sphere's edge and
  // scaled so its branch point sits on the sphere surface.
  const MINI_ANCHOR = 2.35
  const MINI_LEN = 2.4
  const miniGroup = new THREE.Group()
  scene.add(miniGroup)
  const miniMats: THREE.ShaderMaterial[] = []
  const miniDots: THREE.Points[] = []
  const MINI_COLORS = ['#8fe8f6', '#6f9dff', '#a78bfa']
  for (let i = 0; i < 3; i++) {
    const dirX = (i - 1) * 1.15
    const g = new THREE.Group()
    g.position.y = MINI_ANCHOR
    g.scale.setScalar(MINI_LEN)
    const geo = track(new THREE.BufferGeometry())
    const verts: number[] = []
    const prog: number[] = []
    const seeds: number[] = []
    const segs = 26
    const at = (t: number) =>
      new THREE.Vector3(
        dirX * Math.pow(t, 1.3) + Math.sin(t * 2.2 + i) * 0.16,
        t,
        Math.sin(t * 1.5 + i * 1.1) * 0.28,
      )
    for (let s = 0; s < segs; s++) {
      const t1 = s / segs
      const t2 = (s + 1) / segs
      const a = at(t1)
      const b = at(t2)
      verts.push(a.x, a.y, a.z, b.x, b.y, b.z)
      prog.push(t1, t2)
      seeds.push(i / 3, i / 3)
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(prog, 1))
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    const mat = track(
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: {
          uDraw: { value: 0 },
          uOpacity: { value: 0 },
          uTime,
          uColorA: { value: new THREE.Color(MINI_COLORS[i]).multiplyScalar(0.5) },
          uColorB: { value: new THREE.Color(MINI_COLORS[i]) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    miniMats.push(mat)
    const line = new THREE.LineSegments(geo, mat)
    line.frustumCulled = false
    g.add(line)

    // node dot at the tip
    const dotGeo = track(new THREE.BufferGeometry())
    const tip = at(1)
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute([tip.x, tip.y, tip.z], 3))
    const dotMat = track(
      new THREE.PointsMaterial({
        color: new THREE.Color(MINI_COLORS[i]),
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    const dot = new THREE.Points(dotGeo, dotMat)
    dot.frustumCulled = false
    g.add(dot)
    miniDots.push(dot)
    miniGroup.add(g)
  }

  /* ---------------- state ---------------- */
  let active = true
  let disposed = false
  let raf = 0
  let time = 0
  let lastFrame = performance.now()
  let frameSkip = 0
  let pulseT = 0
  let targetPossibility = -1
  let possibilityMix = -1

  const pointerVec = new THREE.Vector3(0, 0, 1)
  const camPos = new THREE.Vector3()
  const camLook = new THREE.Vector3()
  const curLook = new THREE.Vector3()

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setPixelRatio(quality.dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  /* ---------------- per-frame update ---------------- */
  function update(dt: number, p: SceneParams) {
    time += dt
    uTime.value = time

    // smooth pointer
    pointer.x = lerp(pointer.x, pointer.tx, 1 - Math.pow(0.001, dt))
    pointer.y = lerp(pointer.y, pointer.ty, 1 - Math.pow(0.001, dt))
    const px = pointer.x
    const py = pointer.y

    // ---- planet ----
    const converge = clamp(p.converge)
    const scale = p.scale * (1 - converge * 0.97)
    planetGroup.scale.setScalar(scale)
    planetGroup.rotation.y += dt * 0.055 * p.spin
    planetGroup.rotation.x = lerp(planetGroup.rotation.x, py * 0.18, 0.05)

    planetMat.uniforms.uNetwork.value = p.network
    planetMat.uniforms.uBranch.value = p.branch
    planetMat.uniforms.uConverge.value = converge
    planetMat.uniforms.uOpacity.value = p.presence * (1 - converge * 0.15)

    // pointer light vector (in planet local space, roughly)
    pointerVec.set(px * 1.4, py * 1.4, 1).normalize()
    ;(planetMat.uniforms.uPointer.value as THREE.Vector3).copy(pointerVec)

    // network lines
    networkMat.uniforms.uDraw.value = clamp(p.network * 1.15)
    networkMat.uniforms.uOpacity.value = clamp(p.network) * 0.85 * p.presence
    network.visible = p.network > 0.001

    // rings
    ringGroup.rotation.y -= dt * 0.02
    for (let i = 0; i < ringMaterials.length; i++) {
      const line = ringGroup.children[i] as THREE.LineLoop
      line.rotation.y += dt * (line.userData.speed as number)
      const draw = clamp(p.network * 1.2 + p.branch * 0.6 + 0.15)
      ringMaterials[i].uniforms.uDraw.value = draw
      ringMaterials[i].uniforms.uOpacity.value =
        (0.16 + p.network * 0.5 + p.branch * 0.3) * p.presence
    }

    // atmosphere
    atmoMat.uniforms.uOpacity.value = (0.32 + p.network * 0.35) * p.presence
    atmo.visible = converge < 0.98

    // ---- branch routes ----
    const branchOn = p.branch > 0.001
    branchGroup.visible = branchOn
    if (branchOn) {
      for (let i = 0; i < routes.length; i++) {
        const r = routes[i]
        const draw = clamp((p.branch - i * 0.12) * 1.6)
        r.mat.uniforms.uDraw.value = draw
        r.mat.uniforms.uOpacity.value = draw * 0.85
        r.coreMat.uniforms.uOpacity.value = draw * 0.9
        r.coreMat.uniforms.uTravel.value = time * 0.08 + i * 0.25
      }
    }

    // ---- portal ----
    const portalOn = p.portal > 0.001
    portalGroup.visible = portalOn
    if (portalOn) {
      portalMat.uniforms.uOpacity.value = clamp(p.portal) * 0.95
      portalGroup.scale.setScalar(0.35 + p.portal * 0.85)
    }

    // ---- city ----
    const cityOn = p.city > 0.001
    cityGroup.visible = cityOn
    if (cityOn) {
      cityMat.uniforms.uOpacity.value = clamp(p.city)
      cityLinesMat.uniforms.uDraw.value = clamp(p.city * 1.2)
      cityLinesMat.uniforms.uOpacity.value = clamp(p.city) * 0.5
    }
    dustMat.uniforms.uOpacity.value = clamp(p.city) * 0.9 + clamp(p.portal) * 0.4
    dust.visible = dustMat.uniforms.uOpacity.value > 0.005

    // ---- mini branches ----
    const miniOn = p.miniBranches > 0.001
    miniGroup.visible = miniOn
    if (miniOn) {
      for (let i = 0; i < miniMats.length; i++) {
        const d = clamp((p.miniBranches - i * 0.08) * 1.5)
        miniMats[i].uniforms.uDraw.value = d
        miniMats[i].uniforms.uOpacity.value = d * 0.95
        ;(miniDots[i].material as THREE.PointsMaterial).opacity = d
      }
    }

    // ---- possibility selection subtly alters the planet ----
    if (p.possibility !== targetPossibility) targetPossibility = p.possibility
    possibilityMix = lerp(possibilityMix, targetPossibility, 1 - Math.pow(0.01, dt))
    const mix = possibilityMix
    if (mix > -0.5) {
      // tint + density shift per possibility
      const tints = [
        new THREE.Color('#5c8dff'),
        new THREE.Color('#8fe8f6'),
        new THREE.Color('#a78bfa'),
      ]
      const idx = Math.max(0, Math.min(2, Math.round(mix)))
      const target = tints[idx]
      const current = atmoMat.uniforms.uColor.value as THREE.Color
      current.lerp(target, 0.05)
      ringMaterials.forEach((m, i) => {
        const a = m.uniforms.uColorB.value as THREE.Color
        a.lerp(target, 0.03 + i * 0.005)
      })
      planetGroup.rotation.z = lerp(planetGroup.rotation.z, (mix - 1) * 0.06, 0.04)
      planetMat.uniforms.uSize.value = lerp(planetMat.uniforms.uSize.value, 2.1 + (1 - Math.abs(mix - 1)) * 0.5, 0.05)
    }

    // ---- camera ----
    const shake = pulseT > 0 ? Math.sin(pulseT * 40) * pulseT * 0.02 : 0
    pulseT = Math.max(0, pulseT - dt * 1.6)

    const dist = p.camDist
    const polar = p.camPolar + py * 0.16
    const azimuth = p.camAzimuth + px * 0.28
    camPos.set(
      Math.sin(polar) * Math.sin(azimuth) * dist + shake,
      Math.cos(polar) * dist + p.camTargetY + shake,
      Math.sin(polar) * Math.cos(azimuth) * dist,
    )
    camera.position.copy(camPos)
    camLook.set(0, p.camTargetY, 0)
    curLook.lerp(camLook, 1 - Math.pow(0.0001, dt))
    camera.lookAt(curLook)
    if (Math.abs(camera.fov - p.fov) > 0.01) {
      camera.fov = lerp(camera.fov, p.fov, 0.08)
      camera.updateProjectionMatrix()
    }

    stars.rotation.y += dt * 0.004
    stars.rotation.x = lerp(stars.rotation.x, py * 0.03, 0.03)

    // fog deepens as the city forms
    ;(scene.fog as THREE.FogExp2).density = lerp(0.02, 0.032, clamp(p.city))
  }

  /* ---------------- render loop ---------------- */
  function loop(now: number) {
    if (disposed) return
    raf = requestAnimationFrame(loop)
    if (!active) return

    const dt = Math.min((now - lastFrame) / 1000, 0.05)
    lastFrame = now

    // adaptive frame skipping on low tier — keeps the CPU free
    if (quality.tier === 'low') {
      frameSkip = (frameSkip + 1) % 2
      if (frameSkip === 1) return
    }

    update(dt * (quality.tier === 'low' ? 2 : 1), params)
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(loop)

  /* ---------------- public API ---------------- */
  return {
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose?.()
        const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose?.()
      })
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      scene.clear()
    },
    setActive(next: boolean) {
      active = next
      lastFrame = performance.now()
    },
    pulse() {
      pulseT = 1
    },
    setPossibility(index: number) {
      targetPossibility = index
    },
    setMiniBranches(amount: number) {
      miniMats.forEach((m) => {
        m.uniforms.uDraw.value = amount
      })
    },
    onResize: resize,
  }
}
