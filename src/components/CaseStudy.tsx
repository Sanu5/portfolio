import { useEffect } from 'react'
import { projects } from '../data/content'
import { lockScroll, unlockScroll } from '../lib/scroll'
import { closeBay, openBay } from '../three/choreography'
import { useSite } from '../store'

/** The garage bay: the car rolls under the spotlight on the left, the case study slides in on the right. */
export function CaseStudy() {
  const slug = useSite((s) => s.openProject)
  const setOpen = useSite((s) => s.setOpenProject)
  const project = projects.find((p) => p.slug === slug)

  useEffect(() => {
    if (!slug) return
    lockScroll()
    openBay()
    document.documentElement.classList.add('bay-open')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      closeBay()
      unlockScroll()
      document.documentElement.classList.remove('bay-open')
    }
  }, [slug, setOpen])

  return (
    <div className={`bay${project ? ' is-open' : ''}`} aria-hidden={!project}>
      <button className="bay-scrim" aria-label="Close" onClick={() => setOpen(null)} tabIndex={project ? 0 : -1} />
      <aside className="bay-panel" role="dialog" aria-modal="true" aria-labelledby="bay-title" data-lenis-prevent>
        {project && (
          <>
            <header className="bay-head">
              <p className="label">Bay {String(projects.indexOf(project) + 1).padStart(2, '0')} — {project.kind}</p>
              <button className="bay-close" onClick={() => setOpen(null)} aria-label="Close case study">
                <span />
                <span />
              </button>
            </header>
            <h2 className="display-xl" id="bay-title">{project.name}</h2>
            <p className="bay-role caption-upper">{project.study.role} · {project.year}</p>

            {project.images && (
              <div className="bay-shots">
                {project.images.map((src, i) => (
                  <img key={src} src={src} alt={`${project.name} screen ${i + 1}`} loading="lazy" />
                ))}
              </div>
            )}

            <section className="bay-section">
              <h3 className="caption-upper">The brief</h3>
              <p>{project.study.problem}</p>
            </section>
            <section className="bay-section">
              <h3 className="caption-upper">What I built</h3>
              <ul className="race-bullets">
                {project.study.built.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
            <section className="bay-section">
              <h3 className="caption-upper">Outcome</h3>
              <p className="bay-outcome">{project.study.outcome}</p>
            </section>
            <div className="race-tags">
              {project.tags.map((t) => (
                <span className="pill" key={t}>{t}</span>
              ))}
            </div>
            <div className="bay-links">
              {project.links.map((l) =>
                l.href ? (
                  <a key={l.label} className="btn btn-outline" href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>
                ) : (
                  <span key={l.label} className="caption-upper bay-private">{l.label}</span>
                ),
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
