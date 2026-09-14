import { useEffect, useState } from 'react'
import { nav, profile } from '../data/content'
import { getLenis, scrollTo } from '../lib/scroll'
import { useSite } from '../store'
import { LapTimer } from './LapTimer'

export function Nav() {
  const phase = useSite((s) => s.phase)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const lenis = getLenis()
    const onScroll = ({ scroll, direction }: { scroll: number; direction: number }) => {
      setScrolled(scroll > 24)
      setHidden(direction === 1 && scroll > 160)
    }
    lenis.on('scroll', onScroll)
    return () => lenis.off('scroll', onScroll)
  }, [])

  const go = (href: string | number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollTo(href)
  }

  return (
    <>
      <header className={`nav${hidden && !open ? ' is-hidden' : ''}${scrolled ? ' is-scrolled' : ''}`} style={{ opacity: phase === 'loading' ? 0 : 1, transition: 'opacity .6s' }}>
        <a className="wordmark" href="#top" onClick={go(0)} aria-label="Back to top">
          <span className="mark" />
          {profile.name}
        </a>
        <nav className="nav-links" aria-label="Sections">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={go(n.href)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <LapTimer />
          <a className="btn btn-outline nav-cta" href={profile.resume} target="_blank" rel="noreferrer">
            Résumé
          </a>
        </div>
        <button className={`burger${open ? ' is-open' : ''}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className={`mobile-menu${open ? ' is-open' : ''}`} aria-hidden={!open}>
        {nav.map((n) => (
          <a key={n.href} href={n.href} onClick={go(n.href)}>
            {n.label}
            <small>{n.n}</small>
          </a>
        ))}
        <a href={profile.resume} target="_blank" rel="noreferrer">
          Résumé
          <small>PDF</small>
        </a>
      </div>
    </>
  )
}
