import { experience } from '../data/content'

export function Experience() {
  return (
    <section className="experience band" id="experience">
      <div className="container">
        <div className="section-head">
          <p className="label" data-reveal>02 — Race calendar</p>
          <h2 className="display-xl" data-reveal>Every season, a faster lap.</h2>
        </div>
        <ol className="calendar">
          {experience.map((r) => (
            <li className="race-row" key={r.company} data-reveal>
              <div className="race-pos" aria-label={`Position ${r.pos}`}>{r.pos}</div>
              <div className="race-when">
                <strong>{r.company}</strong>
                {r.when}
              </div>
              <div>
                <h3 className="race-role">{r.role}</h3>
                <ul className="race-bullets">
                  {r.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div className="race-tags">
                  {r.tags.map((t) => (
                    <span className="pill outline" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
