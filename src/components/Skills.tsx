import { skillGroups, specs } from '../data/content'

export function Skills() {
  return (
    <section className="skills band" id="skills">
      <div className="container">
        <div className="section-head">
          <p className="label" data-reveal>04 — Spec sheet</p>
          <h2 className="display-xl" data-reveal>The numbers.</h2>
        </div>
        <div className="specs" data-reveal>
          {specs.map((s) => (
            <div className="spec-cell" key={s.label}>
              <div className="number-display">
                <span data-count={s.value}>0</span>
                {s.suffix && <sup>{s.suffix}</sup>}
              </div>
              <div className="caption-upper">{s.label}</div>
              <div className="caption">{s.note}</div>
            </div>
          ))}
        </div>
        <div className="skill-groups">
          {skillGroups.map((g, i) => (
            <div className="skill-group" key={g.name} data-reveal={0.04 * i}>
              <h3>
                {g.name}
                {g.sub && <small>{g.sub}</small>}
              </h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
