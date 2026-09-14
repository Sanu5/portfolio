import { about } from '../data/content'

export function About() {
  return (
    <section className="about band" id="about">
      <div className="container split">
        <div className="copy">
          <p className="label" data-reveal>01 — The driver</p>
          <h2 className="display-xl" data-reveal>{about.title}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i} data-reveal={0.05 * (i + 1)}>{p}</p>
          ))}
          <ul className="facts" data-reveal={0.2}>
            {about.facts.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
