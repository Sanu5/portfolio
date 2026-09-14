import { useEffect, useRef } from 'react'
import { rig } from '../three/rig'

const TICKS = 13 // 0..8 ×1000 rpm across a 270° sweep, last three red
const SWEEP = 270
const RPM_MAX = 9000

/**
 * Tachometer cursor. The dial sits exactly on the pointer (no lag — the native cursor is hidden),
 * the needle follows rig.rpm, which the engine controller drives from scroll and pointer speed.
 * Clickable things pull the needle into the red and show a label. Pointer devices only.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const needle = useRef<SVGGElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const el = root.current!
    let x = -100, y = -100, lx = x, ly = y, lt = performance.now(), speed = 0, shown = false, raf = 0

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        shown = true
        el.classList.remove('is-hidden')
      }
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button, [data-cursor]')
      const text = t?.dataset.cursor ?? ''
      rig.pointerHover = !!t
      el.classList.toggle('is-link', !!t)
      el.classList.toggle('has-label', !!text)
      if (label.current && text) label.current.textContent = text
    }
    const onDown = () => el.classList.add('is-down')
    const onUp = () => el.classList.remove('is-down')
    const onLeave = () => el.classList.add('is-hidden')
    const onEnter = () => el.classList.remove('is-hidden')

    const loop = (now: number) => {
      const dt = Math.max(1, now - lt) / 1000
      const inst = Math.hypot(x - lx, y - ly) / dt
      speed += (inst - speed) * (inst > speed ? 0.35 : 0.08)
      rig.pointerSpeed = speed
      lx = x
      ly = y
      lt = now
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (needle.current) {
        const a = -SWEEP / 2 + (Math.min(RPM_MAX, Math.max(0, rig.rpm)) / RPM_MAX) * SWEEP
        needle.current.style.transform = `rotate(${a}deg)`
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const a = ((-SWEEP / 2 + (i / (TICKS - 1)) * SWEEP) * Math.PI) / 180
    const r1 = i % 2 === 0 ? 17 : 19
    return { x1: 24 + Math.sin(a) * r1, y1: 24 - Math.cos(a) * r1, x2: 24 + Math.sin(a) * 22, y2: 24 - Math.cos(a) * 22, red: i >= TICKS - 3 }
  })

  return (
    <div className="cursor is-hidden" ref={root} aria-hidden="true">
      <svg className="tacho" viewBox="0 0 48 48" width="48" height="48">
        <circle className="tacho-face" cx="24" cy="24" r="23" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.red ? 'tick red' : 'tick'} />
        ))}
        <g className="needle" ref={needle}>
          <line x1="24" y1="26" x2="24" y2="6" />
        </g>
        <circle className="hub" cx="24" cy="24" r="2.6" />
      </svg>
      <span className="cursor-label" ref={label} />
    </div>
  )
}
