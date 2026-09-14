import { profile } from '../data/content'
import contributions from '../data/contributions.json'

type Day = [string, number, number] // date, count, level 0–4

/**
 * Chassis plate: the GitHub contribution calendar woven as 2×2 twill carbon fibre.
 * Each day is one tow; contribution level sets how much light it catches.
 */
function CarbonWeave() {
  const weeks = contributions.weeks as Day[][]
  const cell = 12
  const gap = 1
  const w = weeks.length * (cell + gap)
  const h = 7 * (cell + gap)
  const tone = (level: number) => ['#1f1f1f', '#3a3a3a', '#5a5a5a', '#8a8a8a', '#c8c8c8'][level] ?? '#1f1f1f'
  return (
    <svg className="weave" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${contributions.total} GitHub contributions in the last year, woven as carbon fibre`}>
      <defs>
        <linearGradient id="twill-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id="twill-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
      </defs>
      {weeks.map((week, x) =>
        week.map(([date, count, level], y) => {
          const twill = ((x >> 1) + (y >> 1)) % 2 === 0
          return (
            <g key={date} transform={`translate(${x * (cell + gap)} ${y * (cell + gap)})`}>
              <title>{`${date}: ${count} contribution${count === 1 ? '' : 's'}`}</title>
              <rect width={cell} height={cell} fill={tone(level)} />
              <rect width={cell} height={cell} fill={twill ? 'url(#twill-a)' : 'url(#twill-b)'} />
              {level >= 3 && <rect width={cell} height={cell} fill="#da291c" opacity={level === 4 ? 0.55 : 0.25} />}
            </g>
          )
        }),
      )}
    </svg>
  )
}

export function Footer() {
  const total = contributions.total
  const chassis = `${contributions.login.toUpperCase()}·${contributions.fetched.slice(0, 4)}·${String(total).padStart(4, '0')}`
  return (
    <footer className="footer">
      <div className="container">
        <div className="plate" data-reveal>
          <div className="plate-meta">
            <p className="label">Chassis plate</p>
            <div className="chassis-no">
              <span className="caption-upper">Chassis N°</span>
              <strong>{chassis}</strong>
            </div>
            <p className="caption">
              {total.toLocaleString('en-US')} GitHub contributions in the last year, woven as carbon fibre.
              {' '}
              <a href={profile.links.github} target="_blank" rel="noreferrer">See the paddock ↗</a>
            </p>
          </div>
          <div className="weave-wrap">
            <CarbonWeave />
          </div>
        </div>
        <div className="row">
          <span>© 2026 {profile.name}</span>
          <span>{profile.location}</span>
        </div>
        <p className="credits">
          Built with React Three Fiber, GSAP and Lenis. Engine audio from Freesound recordings:{' '}
          <a href="https://freesound.org/s/857147/" target="_blank" rel="noreferrer">Ferrari idle</a> by jtvdb (CC0),{' '}
          <a href="https://freesound.org/s/241083/" target="_blank" rel="noreferrer">Ferrari 360 Spider</a> by PritzProductions (CC0),{' '}
          <a href="https://freesound.org/s/370278/" target="_blank" rel="noreferrer">Ferrari acceleration</a> by biholao (CC0),{' '}
          <a href="https://freesound.org/s/43484/" target="_blank" rel="noreferrer">Ferrari 355</a> by enginemusic (CC BY 3.0),{' '}
          <a href="https://freesound.org/s/812434/" target="_blank" rel="noreferrer">Ferrari engine on</a> by Oscar_Patrick (CC BY 4.0).
          This work uses{' '}
          <a href="https://sketchfab.com/3d-models/2026-ferrari-296-speciale-a-3b7f4d3f48364a5c832ca3b94272f759" target="_blank" rel="noreferrer">“2026 Ferrari 296 Speciale A”</a>{' '}
          by <a href="https://sketchfab.com/outpiston" target="_blank" rel="noreferrer">OUTPISTON</a>, licensed under{' '}
          <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a> (repainted, baked to static geometry).
          A personal, non-commercial homage — not affiliated with or endorsed by Ferrari S.p.A.
        </p>
      </div>
    </footer>
  )
}
