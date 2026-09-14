import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/** One Lenis instance, driven by GSAP's ticker so ScrollTrigger and the 3D scene share a clock. */
export function getLenis() {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis!.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function lockScroll() {
  getLenis().stop()
  document.documentElement.classList.add('lenis-stopped')
}

export function unlockScroll() {
  getLenis().start()
  document.documentElement.classList.remove('lenis-stopped')
}

export function scrollTo(target: string | number) {
  getLenis().scrollTo(target, { offset: 0, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) })
}

export { gsap, ScrollTrigger }
