import { useEffect, useRef } from 'react'
import { profile } from '../data/content'
import { gsap, scrollTo } from '../lib/scroll'
import { useSite } from '../store'

export function Hero() {
  const phase = useSite((s) => s.phase)
  const reduced = useSite((s) => s.reducedMotion)
  const ref = useRef<HTMLElement>(null)
  const played = useRef(false)

  // Park the name below its mask before anything plays (CSS transforms would confuse GSAP's yPercent).
  useEffect(() => {
    gsap.set(gsap.utils.selector(ref)('.mask > span'), { yPercent: 110, visibility: 'visible' })
  }, [])

  useEffect(() => {
    if (played.current || (phase !== 'intro' && phase !== 'live')) return
    played.current = true
    const q = gsap.utils.selector(ref)
    ref.current?.classList.add('is-live')
    gsap
      .timeline({ delay: reduced ? 0 : 1.05 })
      .fromTo(q('.mask > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: 0.09 }, 0)
      .fromTo(q('.hero-reveal'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, 0.45)
  }, [phase, reduced])

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="container">
        <div className="hero-copy">
          <p className="eyebrow caption-upper hero-reveal">{profile.role}</p>
          <h1 className="display-mega hero-name" aria-label={profile.name}>
            <span className="mask" aria-hidden="true">
              <span>{profile.first}</span>
            </span>
            <span className="mask" aria-hidden="true">
              <span>{profile.last}</span>
            </span>
          </h1>
          <p className="lede hero-reveal">{profile.tagline}</p>
          <div className="cta-row hero-reveal">
            <a className="btn btn-primary" href="#projects" onClick={(e) => { e.preventDefault(); scrollTo('#projects') }}>
              View work <span className="arrow">→</span>
            </a>
            <a className="btn btn-outline" href={profile.resume} target="_blank" rel="noreferrer">
              Download résumé
            </a>
          </div>
        </div>
        <div className="hero-meta caption-upper hero-reveal">
          <span className="scroll-cue">
            <span className="line" />
            Scroll
          </span>
          <span>{profile.location} · 2026</span>
        </div>
      </div>
    </section>
  )
}
