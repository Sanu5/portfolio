import { useEffect, useRef } from 'react'

/**
 * Quiet cursor: a small Rosso Corsa dot exactly on the pointer and a thin ring that glides after
 * it with a tight, fast ease. The ring opens over anything clickable and can carry a short label
 * (data-cursor="…"). Only geometry via transform, so it stays fluid. Pointer devices only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const d = dot.current!
    const r = ring.current!
    let x = -100, y = -100, rx = x, ry = y, shown = false, raf = 0, last = performance.now()

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        shown = true
        rx = x
        ry = y
        d.classList.remove('is-hidden')
        r.classList.remove('is-hidden')
      }
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button, [role="button"], [data-cursor]')
      const text = t?.dataset.cursor ?? ''
      r.classList.toggle('is-link', !!t)
      r.classList.toggle('has-label', !!text)
      if (label.current && text) label.current.textContent = text
    }
    const onDown = () => r.classList.add('is-down')
    const onUp = () => r.classList.remove('is-down')
    const onLeave = () => { d.classList.add('is-hidden'); r.classList.add('is-hidden') }
    const onEnter = () => { d.classList.remove('is-hidden'); r.classList.remove('is-hidden') }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = 1 - Math.exp(-dt * 28) // ~2–3 frames behind: fluid, never floaty
      rx += (x - rx) * k
      ry += (y - ry) * k
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
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

  return (
    <>
      <div className="cursor-ring is-hidden" ref={ring} aria-hidden="true">
        <span className="cursor-circle" />
        <span className="cursor-label" ref={label} />
      </div>
      <div className="cursor-dot is-hidden" ref={dot} aria-hidden="true" />
    </>
  )
}
