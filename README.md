# Anish Biswal — Portfolio

A cinematic, Ferrari-inspired portfolio: near-black canvas, a single Rosso Corsa accent, and a real-time 3D car that
launches in on load and is choreographed by scroll.

**Stack:** Vite · React 19 · TypeScript · three.js via React Three Fiber + drei + postprocessing · GSAP ScrollTrigger · Lenis · zustand · Inter (self-hosted).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview
```

## How it's put together

| Path | What |
|---|---|
| `src/data/content.ts` | **All copy** — bio, experience, projects, specs, skills, links. Edit this, not the components. |
| `src/styles/tokens.css` | Design tokens from `DESIGN-ferrari.md` (colors, type roles, spacing ladder, radius). |
| `src/styles/global.css` | Section layouts and components (buttons, race-calendar rows, feature cards, spec cells). |
| `src/three/rig.ts` | The car/camera **poses** per section, desktop and narrow. Tune the choreography here. |
| `src/three/choreography.ts` | Intro timeline (lights out → launch → brake dive → turn) and the scrubbed scroll timeline. |
| `src/three/Scene.tsx` | Canvas with shadows, HDRI studio (+ light strips), reflective floor, bloom/ACES post, camera rig, wheel spin, lamp driver, volumetric bay light. |
| `src/three/Car.tsx` | Loads `public/models/ferrari-296.glb` (Draco), paint/glass/rim materials, headlight + brake-light materials and beam spotlights. |
| `src/lib/engine.ts` | Engine audio: real Ferrari recordings as rpm-crossfaded loops + one-shots (start, launch pull, blip); `engine-synth.ts` is the procedural fallback. Created only from a user gesture. |
| `scripts/make-engine-audio.py` | Cuts/loops the Freesound clips into `public/audio/*.m4a` (numpy + macOS `afconvert`). |
| `src/components/*` | Preloader (start lights + launch gate), Nav (+ lap timer, sound toggle), Hero, About, Experience, Projects, CaseStudy (garage bay), Skills, Contact, Footer (contribution weave), Cursor (dot + ring). |
| `scripts/bake-car.mjs` | Sketchfab glTF → static, Draco-compressed GLB: bakes the skin, poses the door closed, names wheels/lamps, repaints. |
| `scripts/fetch-contributions.mjs` | Bakes the GitHub contribution calendar to `src/data/contributions.json` (`npm run contributions`). |

### Page flow
1. **Preloader** — four start-light columns come on as the model loads (the fourth waits until the car is actually in the scene). Then a launch gate: *Lights out — with sound* lights the fifth column on the tap, the engine turns over (a real "engine on" recording), and ~1 s later the lights go out; doing nothing launches silently after 6 s.
2. **Lights out** — the car launches in from the right with brake lights flaring as it hauls down, nose-dives, settles, and the headlights come on as it turns to the hero angle while the name reveals. The launch pull plays under it, the engine settles as the car stops, then fades out — sound belongs to the launch only; nothing plays on the page or while scrolling.
3. **Scroll** — one scrubbed GSAP timeline moves the car between poses: side profile (About) → parked in the distance (Experience) → drives off (Projects) → head-on approach (Skills) → drives off (Contact). Wheels roll from real displacement. On portrait phones the car leaves the frame for the text sections and returns head-on for Skills.
4. **Garage bays** — click a project card: the page steps back, the car rolls under a volumetric spotlight on the left and the case study slides in on the right. Closing eases the car back to the scroll pose before ScrollTrigger resumes.

### The car
`public/models/ferrari-296.glb` (3.8 MB) is baked from the Sketchfab download in `source-assets/` with:

```bash
npm run bake -- source-assets/scene.gltf public/models/ferrari-296.glb
```

(unzip the download first). The bake converts 109 skinned meshes to static geometry, poses the rig at the animation's
last keyframe (door closed), pivots the four wheels on their axles as `wheel_fl/fr/rl/rr`, splits the lamp mesh into
`lights_front` / `lights_rear`, repaints `Paint` and the calipers, strips the skeleton and Draco-compresses.
`Car.tsx` flips the model (it faces +Z) so the choreography's −Z-forward poses apply. To use another model, run it
through the same script and check the printed node names.

### Project images
Add portrait screenshots to `public/projects/` and list them in a project's `images` array in `content.ts` — they fan
out on the card plate and appear in the bay. Cards without images keep the gradient plate. Mehfil ships with three.

## Deploy
Static site — `npm run build` and upload `dist/` to Vercel, Netlify, Cloudflare Pages or GitHub Pages
(for a project page, set `base` in `vite.config.ts`).

## Engine audio
The clips are CC-licensed Ferrari recordings from Freesound (none is labelled a 296 — the idle is an unspecified Ferrari,
the revs are a 355 and a 360, the pull is a Ferrari acceleration): 857147 jtvdb (CC0), 241083 PritzProductions (CC0),
370278 biholao (CC0), 43484 enginemusic (CC BY 3.0), 812434 Oscar_Patrick (CC BY 4.0). Keep the footer credit. To swap
in a 296 recording, edit the `CUTS` table in `scripts/make-engine-audio.py` (start, idle/mid/high loops, launch, blip) and
re-run `python3 scripts/make-engine-audio.py`.

## Credits
This work is based on ["2026 Ferrari 296 Speciale A"](https://sketchfab.com/3d-models/2026-ferrari-296-speciale-a-3b7f4d3f48364a5c832ca3b94272f759)
by [OUTPISTON](https://sketchfab.com/outpiston), licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/)
(repainted, baked to static geometry). The licence is non-commercial and share-alike, and the author notes the mesh and
textures originate from CSR2 — keep the credit in the footer and don't use the site commercially. HDRI
`studio_small_09` from Poly Haven (CC0). A personal homage — not affiliated with or endorsed by Ferrari S.p.A.
FerrariSans is licensed; Inter is the documented substitute.
