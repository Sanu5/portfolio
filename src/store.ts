import { create } from 'zustand'
import type { EngineLike } from './lib/engine'

type Phase = 'loading' | 'lights-out' | 'intro' | 'live'

type State = {
  phase: Phase
  setPhase: (p: Phase) => void
  /** True once the car has mounted inside the WebGL scene (not merely downloaded). */
  carReady: boolean
  setCarReady: (v: boolean) => void
  /** Set by the preloader when the scene never came up (no WebGL, background tab that never woke) — the site proceeds without the car. */
  gaveUp: boolean
  setGaveUp: () => void
  /** Engine audio for the launch, created only from the tap on the launch button. */
  engine: EngineLike | null
  setEngine: (e: EngineLike | null) => void
  /** Slug of the project whose garage bay is open. */
  openProject: string | null
  setOpenProject: (slug: string | null) => void
  reducedMotion: boolean
}

export const useSite = create<State>((set) => ({
  phase: 'loading',
  setPhase: (phase) => set({ phase }),
  carReady: false,
  setCarReady: (carReady) => set({ carReady }),
  gaveUp: false,
  setGaveUp: () => set({ gaveUp: true }),
  engine: null,
  setEngine: (engine) => set({ engine }),
  openProject: null,
  setOpenProject: (openProject) => set({ openProject }),
  reducedMotion:
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}))

// Dev-only handle for poking the store from the console.
if (import.meta.env.DEV) (window as unknown as { __site: typeof useSite }).__site = useSite
