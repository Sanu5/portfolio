import { gsap, ScrollTrigger } from '../lib/scroll'
import type { EngineLike } from '../lib/engine'
import { pose, rig } from './rig'

/**
 * Lights out: the car launches in from the right with the brakes flaring as it hauls down,
 * nose dives, settles, then the headlights come on as it turns to the hero angle.
 * If an Engine is supplied (armed by a user gesture) the revs are scored to the same timeline.
 */
export function runIntro(onDone: () => void, reduced: boolean, engine?: EngineLike | null) {
  const { car, body } = rig
  if (!car || !body) return onDone()
  const hero = pose('hero')

  if (reduced) {
    car.position.set(hero.x, hero.y, hero.z)
    car.rotation.y = hero.ry
    Object.assign(rig.view, view(hero))
    rig.lamp.head = 1
    rig.lamp.brake = 0.15
    onDone()
    return
  }

  rig.rpmLocked = true
  const tl = gsap.timeline({
    onComplete: () => {
      rig.rpmLocked = false
      onDone()
    },
  })
  tl.fromTo(car.position, { x: pose('intro').x }, { x: hero.x, duration: 2.4, ease: 'expo.out' }, 0)
    .to(rig.lamp, { brake: 1, duration: 0.2, ease: 'power2.out' }, 0.1)
    .to(body.rotation, { x: -0.032, duration: 0.3, ease: 'power2.out' }, 0.15)
    .to(body.rotation, { x: 0, duration: 1.6, ease: 'elastic.out(1, 0.3)' }, 0.45)
    .to(rig.lamp, { brake: 0.15, duration: 1.4, ease: 'power2.inOut' }, 1.5)
    .to(car.rotation, { y: hero.ry, duration: 2.1, ease: 'power3.inOut' }, 1.0)
    .to(rig.view, { ...view(hero), duration: 2.1, ease: 'power3.inOut' }, 1.0)
    .to(rig.lamp, { head: 1, duration: 0.35, ease: 'power3.in' }, 2.35)

  // rpm score for the tachometer (and the synth): full-throttle pull, upshift, haul down to idle
  rig.rpm = 2200
  tl.to(rig, { rpm: 8300, duration: 0.85, ease: 'power2.out' }, 0)
    .to(rig, { rpm: 5600, duration: 0.12, ease: 'power1.out' }, 0.85)
    .to(rig, { rpm: 7800, duration: 0.45, ease: 'power1.out' }, 0.97)
    .to(rig, { rpm: 1100, duration: 1.4, ease: 'power2.out' }, 1.4)
    .to(rig, { rpm: 950, duration: 1.2, ease: 'sine.inOut' }, 2.8)

  if (engine) {
    engine.throttle = 1
    if (engine.kind === 'samples') {
      // the real pull carries the sound; loops are ducked underneath and return at idle
      tl.add(() => engine.launch(), 0)
    } else {
      tl.add(() => engine.blip(), 0.85)
    }
    tl.add(() => { engine.throttle = 0 }, 1.4)
  }
  return tl
}

function view(p: ReturnType<typeof pose>) {
  return { cx: p.cam[0], cy: p.cam[1], cz: p.cam[2], tx: p.look[0], ty: p.look[1], tz: p.look[2] }
}

/**
 * One scrubbed timeline for the whole page. Positions are normalised section offsets, so each
 * segment plays exactly while that section scrolls into place. Every segment is a fromTo with
 * immediateRender off, which makes the timeline safe to rebuild on resize wherever the user is.
 */
export function buildScrollChoreography(): () => void {
  const car = rig.car
  if (!car) return () => {}

  const el = (id: string) => document.getElementById(id) as HTMLElement
  const sections = { about: el('about'), experience: el('experience'), projects: el('projects'), skills: el('skills'), contact: el('contact') }
  const max = Math.max(1, ScrollTrigger.maxScroll(window))
  const at = (s: HTMLElement) => Math.min(1, s.offsetTop / max)

  const tl = gsap.timeline({
    defaults: { ease: 'power1.inOut' },
    scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 0.9 },
  })

  const seg = (fromName: Parameters<typeof pose>[0], toName: Parameters<typeof pose>[0], from: number, to: number) => {
    const a = pose(fromName)
    const b = pose(toName)
    const d = Math.max(1e-4, to - from)
    tl.fromTo(car.position, { x: a.x, y: a.y, z: a.z }, { x: b.x, y: b.y, z: b.z, duration: d, immediateRender: false }, from)
    tl.fromTo(car.rotation, { y: a.ry }, { y: b.ry, duration: d, immediateRender: false }, from)
    tl.fromTo(rig.view, view(a), { ...view(b), duration: d, immediateRender: false }, from)
  }

  const tAbout = at(sections.about)
  const tExp = at(sections.experience)
  const tProj = at(sections.projects)
  const tSkills = at(sections.skills)
  const tContact = at(sections.contact)

  seg('hero', 'about', 0, tAbout)
  seg('about', 'experience', tAbout, tExp)
  seg('experience', 'projects', tExp, tProj)
  seg('skillsFar', 'skills', tProj + 1e-4, tSkills)
  seg('skills', 'contact', tSkills, tContact)

  rig.scrollTl = tl
  return () => {
    if (rig.scrollTl === tl) rig.scrollTl = null
    tl.scrollTrigger?.kill()
    tl.kill()
  }
}

let bayTl: GSAPTimeline | null = null

/** The car rolls into the lit garage bay on the left while a case study opens on the right. */
export function openBay(engine?: EngineLike | null) {
  const car = rig.car
  if (!car) return
  engine?.blip(0.5)
  rig.scrollTl?.scrollTrigger?.disable(false)
  bayTl?.kill()
  const b = pose('bay')
  bayTl = gsap.timeline({ defaults: { ease: 'power3.inOut', duration: 1.6 } })
    .to(car.position, { x: b.x, y: b.y, z: b.z }, 0)
    .to(car.rotation, { y: b.ry }, 0)
    .to(rig.view, view(b), 0)
    .to(rig, { bay: 1, duration: 1.2, ease: 'power2.out' }, 0.5)
    .to(rig.lamp, { head: 1, brake: 0.15, duration: 0.4 }, 0)
}

/**
 * Reverse: the bay light dims and the car eases back to the pose the scroll timeline holds for the
 * current scroll position; only then does the ScrollTrigger take over again (so nothing snaps).
 */
export function closeBay() {
  const car = rig.car
  const tl = rig.scrollTl
  bayTl?.kill()
  bayTl = null
  gsap.to(rig, { bay: 0, duration: 0.6, ease: 'power2.in' })
  if (!car) return
  if (!tl?.scrollTrigger) return
  const st = tl.scrollTrigger

  // sample the scroll pose without showing it: force-render the timeline, read, restore
  const here = { x: car.position.x, y: car.position.y, z: car.position.z, ry: car.rotation.y, ...rig.view }
  tl.render(tl.time(), true, true)
  const there = { x: car.position.x, y: car.position.y, z: car.position.z, ry: car.rotation.y, ...rig.view }
  car.position.set(here.x, here.y, here.z)
  car.rotation.y = here.ry
  Object.assign(rig.view, { cx: here.cx, cy: here.cy, cz: here.cz, tx: here.tx, ty: here.ty, tz: here.tz })

  bayTl = gsap.timeline({
    defaults: { ease: 'power3.inOut', duration: 1.3 },
    onComplete: () => {
      bayTl = null
      st.enable(false)
      st.refresh()
    },
  })
    .to(car.position, { x: there.x, y: there.y, z: there.z }, 0)
    .to(car.rotation, { y: there.ry }, 0)
    .to(rig.view, { cx: there.cx, cy: there.cy, cz: there.cz, tx: there.tx, ty: there.ty, tz: there.tz }, 0)
}

/** Fade-up for anything tagged data-reveal, plus count-ups for data-count and the top progress bar. */
export function initPageMotion(): () => void {
  const ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((node) => {
      gsap.fromTo(
        node,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          delay: Number(node.dataset.reveal || 0),
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        },
      )
    })

    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((node) => {
      const target = Number(node.dataset.count)
      const o = { v: 0 }
      gsap.to(o, {
        v: target,
        duration: 1.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: node, start: 'top 85%', once: true },
        onUpdate: () => {
          node.textContent = Math.round(o.v).toLocaleString('en-US')
        },
      })
    })

    gsap.to('.progress-bar', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 0.3 },
    })
  })
  return () => ctx.revert()
}
