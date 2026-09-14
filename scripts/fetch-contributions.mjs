/**
 * Bakes the GitHub contribution calendar into src/data/contributions.json (needs `gh auth login`).
 * usage: node scripts/fetch-contributions.mjs [login]
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const login = process.argv[2] || 'Sanu5'
const query = `query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }`
const out = execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`, '-F', `login=${login}`], { encoding: 'utf8' })
const cal = JSON.parse(out).data.user.contributionsCollection.contributionCalendar
const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }
const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => [d.date, d.contributionCount, levels[d.contributionLevel] ?? 0]))
const json = { login, total: cal.totalContributions, fetched: new Date().toISOString().slice(0, 10), weeks }
writeFileSync(new URL('../src/data/contributions.json', import.meta.url), JSON.stringify(json))
console.log(`${login}: ${cal.totalContributions} contributions across ${weeks.length} weeks → src/data/contributions.json`)
