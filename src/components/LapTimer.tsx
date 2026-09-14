import { useEffect, useRef } from 'react'
import { useSite } from '../store'

/** Timing-tower readout of time on site, starting when the lights go out. */
export function LapTimer() {
  const ref = useRef<HTMLSpanElement>(null)
  const phase = useSite((s) => s.phase)
  const t0 = useRef<number | null>(null)

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'live') return
    if (t0.current === null) t0.current = performance.now()
    let raf = 0
    const tick = () => {
      const ms = performance.now() - (t0.current ?? 0)
      const m = Math.floor(ms / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      const f = Math.floor(ms % 1000)
      if (ref.current) ref.current.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(f).padStart(3, '0')}`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  return (
    <span className="lap" aria-label="Time on page">
      <span className="lap-key">Lap</span>
      <span className="lap-val" ref={ref}>00:00.000</span>
    </span>
  )
}
