import { useEffect } from 'react'
import { Scene } from './three/Scene'
import { CaseStudy } from './components/CaseStudy'
import { Cursor } from './components/Cursor'
import { buildScrollChoreography, initPageMotion, runIntro } from './three/choreography'
import { rig } from './three/rig'
import { getLenis, lockScroll, unlockScroll, ScrollTrigger } from './lib/scroll'
import { useSite } from './store'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Projects } from './components/Projects'
import { Skills } from './components/Skills'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Overlays } from './components/Overlays'

export default function App() {
  const phase = useSite((s) => s.phase)
  const setPhase = useSite((s) => s.setPhase)
  const reduced = useSite((s) => s.reducedMotion)
  const carReady = useSite((s) => s.carReady)
  const gaveUp = useSite((s) => s.gaveUp)
  const engine = useSite((s) => s.engine)

  // Always start at the top: the intro assumes the hero is in view.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    getLenis()
    lockScroll()
  }, [])

  // Lights out → launch. Runs the moment the car is in the scene (or immediately if the scene never came up).
  useEffect(() => {
    if (phase !== 'intro' || (!carReady && !gaveUp)) return
    runIntro(() => setPhase('live'), reduced, engine)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, carReady, gaveUp, reduced, setPhase])

  // Live rpm: idle, plus scroll speed and pointer speed, a lift onto anything clickable.
  // Drives the tachometer cursor and the engine audio when there is one.
  useEffect(() => {
    if (phase !== 'live') return
    const lenis = getLenis()
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!rig.rpmLocked) {
        const scroll = Math.min(1, Math.abs(lenis.velocity) / 55)
        const pointer = Math.min(1, rig.pointerSpeed / 2600)
        const target = 950 + scroll * 6200 + pointer * 2200 + (rig.pointerHover ? 900 : 0)
        const k = target > rig.rpm ? 6 : 2.2
        rig.rpm += (target - rig.rpm) * (1 - Math.exp(-dt * k))
        const e = useSite.getState().engine
        if (e) {
          e.rpm = rig.rpm
          e.throttle = target > rig.rpm + 150 ? 1 : 0
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // Page motion (reveals, counters, progress bar) — once, when the site goes live.
  useEffect(() => {
    if (phase !== 'live') return
    unlockScroll()
    const teardown = initPageMotion()
    ScrollTrigger.refresh()
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return teardown
  }, [phase])

  // Car choreography — rebuilt on resize, and if the car (re)mounts, e.g. a background tab waking up late.
  useEffect(() => {
    if (phase !== 'live' || !carReady) return
    let teardown = buildScrollChoreography()
    ScrollTrigger.refresh()

    let timer: number
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        teardown()
        teardown = buildScrollChoreography()
        ScrollTrigger.refresh()
      }, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(timer)
      teardown()
    }
  }, [phase, carReady])

  return (
    <>
      <Scene />
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
        <Footer />
      </main>
      <CaseStudy />
      <Cursor />
      <Overlays />
    </>
  )
}
