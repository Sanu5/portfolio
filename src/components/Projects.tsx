import { profile, projects } from '../data/content'
import { useSite } from '../store'

export function Projects() {
  const setOpen = useSite((s) => s.setOpenProject)
  return (
    <section className="projects band" id="projects">
      <div className="container">
        <div className="section-head">
          <p className="label" data-reveal>03 — The garage</p>
          <h2 className="display-xl" data-reveal>Things I’ve shipped.</h2>
        </div>
        <div className="grid">
          {projects.map((p, i) => (
            <article className="card" key={p.name} data-reveal={0.06 * i} data-cursor="Open bay" onClick={() => setOpen(p.slug)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(p.slug) } }}>
              <div className="card-plate">
                <div className="plate-bg" style={{ background: p.gradient }} />
                {p.images && (
                  <div className="plate-shots" aria-hidden="true">
                    {p.images.map((src) => (
                      <img key={src} src={src} alt="" loading="lazy" />
                    ))}
                  </div>
                )}
                <span className="plate-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="plate-year">{p.year}</span>
                {!p.images && <span className="plate-glyph" aria-hidden="true">{p.glyph}</span>}
              </div>
              <div className="card-body">
                <h3>
                  {p.name}
                  <span className="kind">{p.kind}</span>
                </h3>
                <p>{p.blurb}</p>
                <div className="race-tags">
                  {p.tags.map((t) => (
                    <span className="pill" key={t}>{t}</span>
                  ))}
                </div>
                <div className="card-links">
                  <span className="open-bay">Open bay <span className="arrow">→</span></span>
                  {p.links.map((l) =>
                    l.href ? (
                      <a key={l.label} href={l.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{l.label} ↗</a>
                    ) : (
                      <span key={l.label} className="private caption-upper">{l.label}</span>
                    ),
                  )}
                </div>
              </div>
            </article>
          ))}
          <a className="card card-more" href={profile.links.github} target="_blank" rel="noreferrer" data-reveal={0.3}>
            <p className="label">More in the paddock</p>
            <h3 className="display-lg">30+ repos on GitHub</h3>
            <span className="btn btn-text">
              github.com/Sanu5 <span className="arrow">→</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
