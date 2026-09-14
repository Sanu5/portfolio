import type { Group, MeshStandardMaterial, Object3D, SpotLight } from 'three'

/**
 * Mutable handles shared between React (refs), GSAP (tweens) and the render loop.
 * Kept outside React state on purpose: GSAP mutates these every frame.
 */
export const rig = {
  car: null as Group | null, // yaw + world position
  body: null as Group | null, // pitch only (brake dive)
  wheels: [] as Object3D[],
  lampMats: { head: [] as MeshStandardMaterial[], brake: [] as MeshStandardMaterial[] },
  headSpots: [] as SpotLight[],
  /** 0..1 lamp levels — tweened by GSAP, applied to materials every frame. */
  lamp: { head: 0, brake: 0 },
  /** 0..1 garage-bay spotlight level. */
  bay: 0,
  scrollTl: null as GSAPTimeline | null,
  view: { cx: 0, cy: 1.05, cz: 7.4, tx: 0, ty: 0.35, tz: 0 },
  pointer: { x: 0, y: 0 },
}

export type Pose = {
  x: number
  y: number
  z: number
  ry: number
  cam: [number, number, number]
  look: [number, number, number]
}

const P = Math.PI

/**
 * Desktop poses. Model front points -Z, so ry = π/2 faces -X (drives right → left),
 * ry = π faces the camera, ry = 3π/2 faces +X (drives left → right).
 */
const DESKTOP: Record<string, Pose> = {
  intro: { x: 17, y: 0, z: 0.2, ry: P / 2, cam: [0, 1.05, 8.2], look: [0.5, 0.35, 0] },
  hero: { x: 2.2, y: 0, z: 0.2, ry: P / 2 + 0.58, cam: [0, 1.05, 8.2], look: [0.5, 0.35, 0] },
  about: { x: -2.4, y: 0, z: 0.2, ry: P / 2, cam: [0, 1.0, 9.8], look: [0, 0.9, 0] },
  experience: { x: 4.6, y: 0, z: -13, ry: -0.6, cam: [0, 2.0, 7.4], look: [1.0, 0.2, -4] },
  projects: { x: -18, y: 0, z: 0.4, ry: P / 2, cam: [0, 1.0, 7.4], look: [0, 0.35, 0] },
  skillsFar: { x: 0, y: 0, z: -52, ry: P, cam: [0, 1.5, 8], look: [0, 1.75, 0] },
  skills: { x: 0, y: 0, z: 2.2, ry: P, cam: [0, 1.5, 8], look: [0, 1.75, 0] },
  contact: { x: 20, y: 0, z: 0.4, ry: (3 * P) / 2, cam: [0, 1.0, 7.4], look: [0, 0.35, 0] },
  /** Garage bay: parked on the left under the spotlight while a case study opens on the right. */
  bay: { x: -2.9, y: 0, z: -1.4, ry: P / 2 + 0.5, cam: [0.9, 1.3, 9.8], look: [-1.9, 0.55, -1.0] },
}

/** Portrait phones and small tablets. Landscape phones keep the desktop staging (they have the width for it). */
export function isNarrow() {
  return typeof window !== 'undefined' && window.innerWidth < 900 && window.innerHeight >= window.innerWidth
}

/**
 * Portrait staging. A 4 m car that fits a 375 px viewport is small and any text over it is
 * unreadable, so on phones it sits above the headline in the hero, drives out of frame for the
 * text sections, comes back head-on under the spec sheet, and leaves again at Contact.
 */
const NARROW: Partial<Record<keyof typeof DESKTOP, Partial<Pose>>> = {
  intro: { x: 14, z: 0.4, ry: P / 2, cam: [0, 1.3, 13], look: [0, -0.55, 0] },
  hero: { x: 0.5, z: 0.4, ry: P / 2 + 0.85, cam: [0, 1.3, 13], look: [0, -0.55, 0] },
  about: { x: -20, z: 0.4, ry: P / 2, cam: [0, 1.3, 13], look: [0, -0.2, 0] },
  experience: { x: -20, z: 0.4, ry: P / 2, cam: [0, 1.3, 13], look: [0, -0.2, 0] },
  projects: { x: -20, z: 0.4, ry: P / 2, cam: [0, 1.3, 13], look: [0, -0.2, 0] },
  skillsFar: { x: 0, z: -52, ry: P, cam: [0, 1.4, 12], look: [0, 1.9, 0] },
  skills: { x: 0, z: 0.5, ry: P, cam: [0, 1.4, 12], look: [0, 1.9, 0] },
  contact: { x: 22, z: 0.4, ry: (3 * P) / 2, cam: [0, 1.3, 13], look: [0, 0.2, 0] },
  bay: { x: 0.3, z: 0.4, ry: P / 2 + 0.7, cam: [0, 1.3, 13], look: [0, -0.9, 0] },
}

export function pose(name: keyof typeof DESKTOP): Pose {
  const p = DESKTOP[name]
  return isNarrow() ? { ...p, ...NARROW[name] } : p
}

// Dev-only handle for poking the rig from the console.
if (import.meta.env.DEV) (window as unknown as { __rig: typeof rig }).__rig = rig
