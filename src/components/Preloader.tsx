import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { gsap } from '../lib/scroll'
import { createEngine, prefetchEngineAudio } from '../lib/engine'
import { useSite } from '../store'

const COLUMNS = 5
const STEP_MS = 340
const GIVE_UP_MS = 20000
const AUTO_LAUNCH_MS = 6000

/**
 * F1 start-light gantry. Four columns come on as the model loads; the fifth is the launch.
 * A tap launches with engine audio (the gesture unlocks Web Audio); doing nothing launches
 * silently after a few seconds.
 */
export function Preloader() {
  const { progress } = useProgress()
  const setPhase = useSite((s) => s.setPhase)
  const setGaveUp = useSite((s) => s.setGaveUp)
  const setEngine = useSite((s) => s.setEngine)
  const carReady = useSite((s) => s.carReady)
  const [lit, setLit] = useState(0)
  const [armed, setArmed] = useState(false) // four lights on, waiting for the launch
  const [gone, setGone] = useState(false)
  const loaded = useRef(false)
  const ready = useRef(false)
  const launched = useRef(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    prefetchEngineAudio()
  }, [])
  useEffect(() => {
    if (progress >= 100) loaded.current = true
  }, [progress])
  useEffect(() => {
    ready.current = carReady
  }, [carReady])

  // lights 1–4
  useEffect(() => {
    let i = 0
    let t: number
    const started = performance.now()
    const tick = () => {
      const timedOut = performance.now() - started > GIVE_UP_MS
      const canLight = i < COLUMNS - 2 || (loaded.current && ready.current) || timedOut
      if (canLight) {
        if (i === COLUMNS - 2 && timedOut && !ready.current) setGaveUp()
        i += 1
        setLit(i)
      }
      if (i < COLUMNS - 1) t = window.setTimeout(tick, canLight ? STEP_MS : 120)
      else setArmed(true)
    }
    t = window.setTimeout(tick, 500)
    return () => window.clearTimeout(t)
  }, [setGaveUp])

  const launch = async (withSound: boolean) => {
    if (launched.current) return
    launched.current = true
    let ignition = 0
    if (withSound) {
      const engine = await createEngine() // decodes the clips; the gesture already unlocked audio
      if (engine) {
        engine.rpm = 900
        await engine.start(0.4)
        ignition = engine.ignition() // engine turns over, settles to idle
        setEngine(engine)
      }
    }
    // fifth light, hold (long enough to hear the engine catch), lights out
    const hold = Math.max(900, Math.min(2600, ignition * 1000 * 0.45))
    window.setTimeout(() => setLit(COLUMNS), 250)
    window.setTimeout(() => {
      setLit(0)
      setPhase('intro')
      gsap.to(root.current, {
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        delay: 0.25,
        onComplete: () => setGone(true),
      })
    }, 250 + hold + Math.round(Math.random() * 500)) // a little jitter, like the real start
  }

  // silent auto-launch if nobody taps
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => void launch(false), AUTO_LAUNCH_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed])

  if (gone) return null

  return (
    <div className="preloader" ref={root} role="status" aria-live="polite" aria-label="Loading">
      <div className="lights" aria-hidden="true">
        {Array.from({ length: COLUMNS }, (_, c) => (
          <div className="light-col" key={c}>
            <span className={`light${c < lit ? ' on' : ''}`} />
            <span className={`light${c < lit ? ' on' : ''}`} />
          </div>
        ))}
      </div>
      <div className="preloader-copy caption-upper">
        <span className="pct">{Math.min(100, Math.round(progress))}%</span>
        <span className="dot" />
        <span>{lit === COLUMNS ? 'Lights out' : armed ? 'On the grid' : 'Formation lap'}</span>
      </div>
      <div className={`launch${armed && lit < COLUMNS ? ' is-ready' : ''}`}>
        <button className="btn btn-primary" onClick={() => void launch(true)}>
          <span className="spk" aria-hidden="true">◉</span> Lights out — with sound
        </button>
        <button className="btn btn-text" onClick={() => void launch(false)}>Enter quietly</button>
      </div>
    </div>
  )
}
