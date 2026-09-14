import { profile } from '../data/content'

const items = [
  'Available for work',
  '2026 season',
  'AI evaluation',
  'Android · iOS',
  'New Delhi → anywhere',
]

export function Contact() {
  const links = [
    { label: 'LinkedIn', sub: 'anish-biswal', href: profile.links.linkedin },
    { label: 'GitHub', sub: 'Sanu5', href: profile.links.github },
    { label: 'LeetCode', sub: '1450+ rating', href: profile.links.leetcode },
    { label: 'Codeforces', sub: 'SanuCodex', href: profile.links.codeforces },
  ]
  return (
    <>
      <div className="livery" aria-hidden="true">
        <div className="track">
          {[0, 1].map((k) => (
            <span key={k}>
              {items.map((t) => (
                <span key={t}>
                  {t} <i />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <section className="contact band" id="contact">
        <div className="container">
          <p className="label" data-reveal>05 — Pit wall</p>
          <h2 className="display-xl" data-reveal>Let’s build something fast.</h2>
          <a className="email" href={`mailto:${profile.email}`} data-reveal={0.1}>{profile.email}</a>
          <div className="contact-links" data-reveal={0.2}>
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                <small>{l.sub}</small>
                <span>
                  {l.label}
                  <span className="arrow">↗</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
