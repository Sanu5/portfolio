import { createEngine } from '../lib/engine'
import { useSite } from '../store'

/** Nav sound switch. Entering quietly leaves no engine; the first tap here creates one (a user gesture). */
export function SoundToggle() {
  const engine = useSite((s) => s.engine)
  const setEngine = useSite((s) => s.setEngine)
  const muted = useSite((s) => s.muted)
  const setMuted = useSite((s) => s.setMuted)
  const phase = useSite((s) => s.phase)
  const on = !!engine && !muted

  const toggle = async () => {
    if (!engine) {
      const e = await createEngine()
      if (!e) return
      e.rpm = 950
      await e.start(0.4)
      e.ignition()
      setEngine(e)
      setMuted(false)
      return
    }
    engine.setMuted(!muted)
    setMuted(!muted)
  }

  if (phase === 'loading') return null
  return (
    <button className={`sound${on ? ' is-on' : ''}`} onClick={() => void toggle()} aria-pressed={on} aria-label={on ? 'Mute engine' : 'Engine sound on'} data-cursor={on ? 'Mute' : 'Sound'}>
      <span className="bars" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="caption-upper">{on ? 'Engine' : 'Muted'}</span>
    </button>
  )
}
