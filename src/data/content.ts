// All copy lives here so the sections stay dumb. Source: Anish_ work_resume.pdf (Sept 2026).

export const profile = {
  first: 'Anish',
  last: 'Biswal',
  name: 'Anish Biswal',
  role: 'AI Evaluation Engineer · Android Developer',
  location: 'New Delhi, IN',
  email: 'biswalworkanish@gmail.com',
  tagline: 'I write the benchmarks frontier models fail — and ship the apps people actually use.',
  resume: '/Anish_Biswal_Resume.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/anish-biswal-03b587219/',
    github: 'https://github.com/Sanu5',
    leetcode: 'https://leetcode.com/u/Anish55446/',
    codeforces: 'https://codeforces.com/profile/SanuCodex',
  },
}

export const about = {
  title: 'Built for the fast lane.',
  paragraphs: [
    'I’m an engineer from New Delhi working where AI evaluation meets mobile product. By day I author agentic coding benchmarks at Handshake AI — containerised tasks calibrated so frontier models fail while a hidden reference solution scores a perfect run.',
    'Before that I red-teamed frontier LLMs at Outlier (Scale AI), shipped a KYC revamp at MobiKwik that lifted completion by 20%, and I still take on Android work — from Compose apps to the AOSP layer of a custom device.',
    'I care about things that are deterministic, reproducible and fast. Also, quite obviously, about cars.',
  ],
  facts: [
    ['Now', 'AI Evaluation Engineer, Handshake AI'],
    ['Also', 'Freelance Android · AOSP for a telecom client'],
    ['Studied', 'B.Tech ECE, Delhi Technological University (2021–25) · Minor in Computer Engineering'],
    ['Led', 'Corporate division, STEP-DTU — sponsorships & partnerships'],
    ['Based', 'New Delhi, India · open to remote'],
  ] as [string, string][],
}

export type Race = {
  pos: string
  company: string
  role: string
  when: string
  bullets: string[]
  tags: string[]
}

export const experience: Race[] = [
  {
    pos: 'P1',
    company: 'Handshake AI',
    role: 'AI Evaluation Engineer',
    when: 'Mar 2026 — Present',
    bullets: [
      'Author end-to-end agentic coding benchmark tasks: a containerised Linux environment, a hidden reference solution and a programmatic verifier — calibrated so frontier agents fail while the oracle scores a perfect run.',
      'Tasks span runtime debugging and repair, SQL state recovery, shell and environment isolation, file and media operations, and package build & release recovery.',
      'Built a validation harness that rebuilds every task in a throwaway sandbox and runs all gates: static checks, oracle and no-op scoring, tamper and hijack matrices, determinism across runs, and hardness calibration.',
    ],
    tags: ['Docker', 'Python', 'pytest', 'Bash', 'Benchmark design'],
  },
  {
    pos: 'P2',
    company: 'Outlier · Scale AI',
    role: 'AI Model Evaluation & Red-Teaming Specialist',
    when: 'Apr 2025 — Jun 2026',
    bullets: [
      'Designed adversarial evaluation tasks inside sandboxed static and dynamic agent environments, probing frontier LLMs for failure modes on multi-step, tool-using workflows.',
      'Engineered conflicting-context scenarios — contradictory instructions, stale state, mutually exclusive constraints — and prompts that force the model to detect and resolve them.',
      'Defined oracle events and grading rubrics so every failure scores deterministically rather than subjectively.',
    ],
    tags: ['Red-teaming', 'Rubric design', 'Prompt engineering', 'Failure-mode analysis'],
  },
  {
    pos: 'P3',
    company: 'Independent',
    role: 'Freelance Android Developer',
    when: 'Sep 2025 — Present',
    bullets: [
      'Core application development and low-level system integration for the Lighko Wonder device — custom Android apps and the proprietary AOSP codebase.',
      'Proxy engineer for a telecom-sector client, owning end-to-end delivery of complex Android modules in Kotlin and Java.',
    ],
    tags: ['Kotlin', 'AOSP', 'Jetpack Compose', 'Hilt'],
  },
  {
    pos: 'P4',
    company: 'MobiKwik',
    role: 'SDE Intern',
    when: 'Apr 2025 — Jul 2025',
    bullets: [
      'End-to-end revamp of the KYC onboarding flow — benefits explainer, step restructuring, income-data fetching — lifting KYC completion by 20%.',
      'Rebuilt the KYC CPV screen with smoother backend integration and faster loads, cutting user drop-off.',
      'Shipped the new SBM card feature across onboarding and activation flows.',
    ],
    tags: ['Android', 'Kotlin', 'MVVM', 'Retrofit'],
  },
]

export type Project = {
  slug: string
  name: string
  kind: string
  year: string
  blurb: string
  tags: string[]
  links: { label: string; href: string }[]
  gradient: string
  glyph: string
  /** Phone screenshots (portrait) shown fanned on the card plate and inside the bay. */
  images?: string[]
  study: {
    role: string
    problem: string
    built: string[]
    outcome: string
  }
}

export const projects: Project[] = [
  {
    slug: 'mehfil',
    name: 'Mehfil',
    kind: 'iOS 26 · Android · Firebase',
    year: '2026',
    blurb: 'Wedding-vendor operations, native on both platforms. SwiftUI with Liquid Glass on iOS 26, Jetpack Compose on Android, Firebase Auth + Firestore underneath — plus a device-only mode when there’s no backend config.',
    tags: ['SwiftUI', 'Jetpack Compose', 'Firebase', 'Design system'],
    links: [
      { label: 'iOS repo', href: 'https://github.com/Sanu5/mehfil-ios' },
      { label: 'Android repo', href: 'https://github.com/Sanu5/mehfil-android' },
    ],
    gradient: 'radial-gradient(120% 140% at 0% 100%, #5a1410 0%, #2a1a1a 45%, #1c1c1c 100%)',
    glyph: 'M',
    images: ['/projects/mehfil-1.png', '/projects/mehfil-2.png', '/projects/mehfil-3.png'],
    study: {
      role: 'Design, iOS, Android, backend — solo',
      problem: 'Wedding vendors in India run a season of overlapping events on WhatsApp and paper: crew get double-booked, deposits go unchased, and nobody has one view of Saturday.',
      built: [
        'A 92-artboard design system (light + dark) with tokens shared by both apps, then native clients: SwiftUI on iOS 26 with Liquid Glass tab roots and floating title chips; Jetpack Compose on Android with the same content model.',
        'Firebase Auth (Sign in with Apple + Google) and Firestore under a per-vendor document tree — clients, events, milestones, crew, inventory, receivables, enquiries — with security rules and a policies doc.',
        'A device-only mode: with no backend config the app runs on a local JSON repository, so the product demos and ships without a server.',
        'Derived state (overdue balances, crew conflicts, season totals) is computed, never stored — one source of truth per fact.',
      ],
      outcome: 'Two native apps, one backend, a public legal site, and a release pipeline (signed Android release with ProGuard; App Store-ready iOS) — verified on simulator and emulator.',
    },
  },
  {
    slug: 'marketmind',
    name: 'MarketMind',
    kind: 'FastAPI · SwiftUI · Claude',
    year: '2026',
    blurb: 'AI decision-support for Indian stocks and IPOs. Deterministic scoring engines, per-instrument provider fallback chains with health telemetry, Claude only for narratives — with a labelled rule-based fallback.',
    tags: ['Python', 'FastAPI', 'SwiftUI', 'Claude API'],
    links: [{ label: 'Private build', href: '' }],
    gradient: 'radial-gradient(120% 140% at 100% 0%, #3a3a3a 0%, #232323 50%, #171717 100%)',
    glyph: 'MM',
    study: {
      role: 'Architecture, backend, iOS — solo',
      problem: 'Retail investors in India get opinions, not evidence. Free market-data sources rate-limit, bot-gate or go stale, so a naive app either lies or breaks.',
      built: [
        'FastAPI + SQLAlchemy backend with provider protocols and per-instrument fallback chains (NSE → Upstox → Yahoo, and so on), validation, health telemetry and stale-flagged last-good serving.',
        'Deterministic scoring engines for stocks and IPOs — weights and thresholds live in config, every recommendation carries its evidence list and a data-completeness score.',
        'Claude (structured JSON output) only for narratives and news interpretation, with a labelled rule-based fallback so the product never depends on the model being up.',
        'A SwiftUI client with deep links, a six-state "market mode" and honest unavailable/stale states instead of fake numbers.',
      ],
      outcome: '42 offline tests covering the failover matrix; the app stays truthful when three upstream providers throttle the same afternoon.',
    },
  },
  {
    slug: 'foodgrab',
    name: 'FoodGrab',
    kind: 'Kotlin · Bun · PostgreSQL',
    year: '2025',
    blurb: 'Full-stack food delivery built by a team of four that I led. Compose + Hilt + MVVM on Android, a Bun/PostgreSQL backend, secure REST APIs — and 35% lower API latency after optimisation.',
    tags: ['Jetpack Compose', 'Hilt', 'Bun', 'PostgreSQL'],
    links: [{ label: 'GitHub', href: 'https://github.com/Sanu5/FDA-Android' }],
    gradient: 'radial-gradient(120% 140% at 50% 100%, #4a2a10 0%, #262020 50%, #171717 100%)',
    glyph: 'FG',
    study: {
      role: 'Team lead + Android — team of four',
      problem: 'A full food-ordering loop — browse, order, pay, track — built end to end by a student team with no backend to start from.',
      built: [
        'Led the team and owned the Android app: Jetpack Compose UI, Hilt for DI, MVVM with a clean repository layer and Retrofit clients.',
        'A Bun + PostgreSQL backend with secure REST endpoints for menus, ordering, authentication and live order tracking.',
        'Profiled and reworked the data flow between client and API — batching, caching and payload trimming.',
      ],
      outcome: 'API latency down 35% after optimisation; a responsive app the whole team could demo on real devices.',
    },
  },
  {
    slug: 'cadence-field',
    name: 'Cadence Field',
    kind: 'Figma Plugin API · TypeScript',
    year: '2026',
    blurb: 'A 13-screen predictive-maintenance iOS design system generated straight into Figma by a custom TypeScript plugin — tokens, components, variants and screens, without spending a single MCP call.',
    tags: ['Figma', 'TypeScript', 'Design tokens'],
    links: [{ label: 'Case study soon', href: '' }],
    gradient: 'radial-gradient(120% 140% at 0% 0%, #10303a 0%, #1c2426 50%, #171717 100%)',
    glyph: 'CF',
    study: {
      role: 'Design systems + tooling — solo',
      problem: 'A 13-screen predictive-maintenance iOS design needed to land in Figma as real components and variables — on a Starter plan with no MCP quota, three pages and one variable mode per collection.',
      built: [
        'A TypeScript Figma development plugin that generates the whole file: colour collections for dark and light, spacing/radius/sizing tokens, 11 text styles, glass effect styles.',
        'Components with proper variant sets and variable bindings — hand-drawn icon components where SF Symbols were unavailable.',
        'A bridge server so scripts can run and export PNGs through the open plugin, sidestepping the API quota entirely.',
      ],
      outcome: 'A rebuildable design file: change the contract, re-run the plugin, and every screen regenerates consistently.',
    },
  },
]

export const specs = [
  { value: 650, suffix: '+', label: 'DSA problems', note: 'LeetCode · Codeforces · GfG' },
  { value: 1450, suffix: '+', label: 'LeetCode rating', note: 'DP · graphs · complexity' },
  { value: 20, suffix: '%', label: 'KYC completion lift', note: 'MobiKwik onboarding revamp' },
  { value: 35, suffix: '%', label: 'API latency cut', note: 'FoodGrab backend' },
  { value: 4, suffix: '', label: 'Platforms shipped', note: 'Android · iOS · Web · Backend' },
]

export const skillGroups = [
  { name: 'AI & model evaluation', sub: 'the day job', items: ['LLM evaluation', 'Agentic benchmark authoring', 'Red-team scenario design', 'Conflicting-context construction', 'Oracle event specification', 'Rubric design & grading', 'Failure-mode analysis', 'Deterministic scoring', 'Hardness calibration'] },
  { name: 'Android', sub: 'native, production', items: ['Kotlin', 'Jetpack Compose', 'Material Design', 'Coroutines', 'Hilt / Dagger 2', 'MVVM', 'Room', 'Retrofit', 'Android Profiler', 'AOSP', 'JUnit / Espresso'] },
  { name: 'Backend & data', sub: '', items: ['Node.js', 'Express', 'REST APIs', 'FastAPI', 'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Firebase'] },
  { name: 'Systems & tooling', sub: 'reproducible by default', items: ['Docker', 'Linux', 'Bash', 'Git & GitHub', 'pytest', 'CI/CD', 'JSON / YAML', 'Regex', 'CLI tooling'] },
  { name: 'Languages', sub: '', items: ['C', 'C++', 'Python', 'Kotlin', 'Swift', 'JavaScript', 'TypeScript', 'SQL'] },
]

export const nav = [
  { label: 'About', href: '#about', n: '01' },
  { label: 'Experience', href: '#experience', n: '02' },
  { label: 'Projects', href: '#projects', n: '03' },
  { label: 'Skills', href: '#skills', n: '04' },
  { label: 'Contact', href: '#contact', n: '05' },
]
