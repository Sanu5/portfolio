import { SynthEngine } from './engine-synth'
import { asset } from './asset'

/**
 * Engine audio. Real Ferrari recordings (see scripts/make-engine-audio.py): three seamless loops
 * crossfaded and pitch-shifted by rpm, plus one-shots for engine start, the launch pull and a
 * rev blip that duck the loops while they play. Falls back to the procedural V6 if decoding fails.
 */
export interface EngineLike {
  readonly kind: 'samples' | 'synth'
  rpm: number
  throttle: number
  start(volume?: number): Promise<void>
  stop(fade?: number): void
  setMuted(muted: boolean): void
  /** Engine turning on — returns duration in seconds. */
  ignition(): number
  /** Full-throttle launch pull — returns duration in seconds. */
  launch(): number
  /** Short rev. */
  blip(gain?: number): void
}

const FILES = ['start', 'idle', 'mid', 'high', 'launch', 'blip'] as const
type Name = (typeof FILES)[number]
const LOOPS: { name: Name; rpm: number }[] = [
  { name: 'idle', rpm: 1000 },
  { name: 'mid', rpm: 3600 },
  { name: 'high', rpm: 6800 },
]

const bytes = new Map<Name, Promise<ArrayBuffer>>()

/** Fetch the clips early (no AudioContext needed) so the launch tap only has to decode. */
export function prefetchEngineAudio() {
  for (const n of FILES) {
    if (!bytes.has(n)) bytes.set(n, fetch(asset(`audio/${n}.m4a`)).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText)))))
  }
}

class SampleEngine implements EngineLike {
  readonly kind = 'samples' as const
  rpm = 900
  throttle = 0
  private ctx: AudioContext
  private master: GainNode
  private loopBus: GainNode
  private loops: { name: Name; rpm: number; src: AudioBufferSourceNode; gain: GainNode }[] = []
  private buffers: Map<Name, AudioBuffer>
  private raf = 0
  private running = false
  private volume = 0.4
  private muted = false
  private duckUntil = 0
  private shots: AudioBufferSourceNode[] = []

  private constructor(ctx: AudioContext, buffers: Map<Name, AudioBuffer>) {
    this.ctx = ctx
    this.buffers = buffers
    this.master = ctx.createGain()
    this.master.gain.value = 0
    // gentle low-shelf + compressor so the loops sit together
    const shelf = ctx.createBiquadFilter()
    shelf.type = 'lowshelf'
    shelf.frequency.value = 140
    shelf.gain.value = 3
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 4
    comp.attack.value = 0.01
    comp.release.value = 0.2
    this.master.connect(shelf).connect(comp).connect(ctx.destination)
    this.loopBus = ctx.createGain()
    this.loopBus.gain.value = 0
    this.loopBus.connect(this.master)
    for (const l of LOOPS) {
      const src = ctx.createBufferSource()
      src.buffer = buffers.get(l.name)!
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0
      src.connect(gain).connect(this.loopBus)
      src.start()
      this.loops.push({ ...l, src, gain })
    }
  }

  static async create(): Promise<SampleEngine> {
    prefetchEngineAudio()
    const ctx = new AudioContext()
    const decoded = new Map<Name, AudioBuffer>()
    await Promise.all(
      FILES.map(async (n) => {
        const ab = await bytes.get(n)!
        decoded.set(n, await ctx.decodeAudioData(ab.slice(0)))
      }),
    )
    return new SampleEngine(ctx, decoded)
  }

  async start(volume = 0.4) {
    this.volume = volume
    if (this.ctx.state !== 'running') await this.ctx.resume()
    this.running = true
    this.master.gain.setTargetAtTime(this.muted ? 0 : volume, this.ctx.currentTime, 0.2)
    const tick = () => {
      if (!this.running) return
      this.apply()
      this.raf = requestAnimationFrame(tick)
    }
    tick()
  }

  stop(fade = 1) {
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 4)
    window.setTimeout(() => {
      this.running = false
      cancelAnimationFrame(this.raf)
      void this.ctx.close()
    }, fade * 1000 + 300)
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.15)
  }

  ignition() {
    return this.shot('start', 0.9, 0.35)
  }

  launch() {
    return this.shot('launch', 1, 0.08)
  }

  blip(gain = 0.55) {
    this.shot('blip', gain, 0.35)
  }

  /** Play a one-shot, ducking the loops for its duration. Returns the clip length. */
  private shot(name: Name, gain: number, duckTo: number) {
    const buf = this.buffers.get(name)
    if (!buf) return 0
    for (const s of this.shots) {
      try { s.stop() } catch { /* already ended */ }
    }
    this.shots = []
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = gain
    src.connect(g).connect(this.master)
    src.start()
    this.shots.push(src)
    const t = this.ctx.currentTime
    this.loopBus.gain.cancelScheduledValues(t)
    this.loopBus.gain.setTargetAtTime(duckTo, t, 0.05)
    this.duckUntil = t + buf.duration - 0.6
    return buf.duration
  }

  private apply() {
    const t = this.ctx.currentTime
    const rpm = Math.max(700, Math.min(9000, this.rpm))
    // loop weights: idle → mid → high with overlapping ramps
    const w = (a: number, b: number) => Math.max(0, Math.min(1, (rpm - a) / (b - a)))
    const weights: Record<string, number> = {
      idle: 1 - w(1400, 3200),
      mid: w(1400, 3200) * (1 - w(4800, 6600)),
      high: w(4800, 6600),
    }
    const load = 0.55 + 0.45 * this.throttle
    for (const l of this.loops) {
      const rate = Math.max(0.7, Math.min(1.5, rpm / l.rpm))
      l.src.playbackRate.setTargetAtTime(rate, t, 0.05)
      l.gain.gain.setTargetAtTime(weights[l.name] * load, t, 0.08)
    }
    if (t > this.duckUntil) this.loopBus.gain.setTargetAtTime(1, t, 0.4)
  }
}

/** Synth fallback wrapped in the same interface. */
class SynthAdapter implements EngineLike {
  readonly kind = 'synth' as const
  private e = new SynthEngine()
  get rpm() { return this.e.rpm }
  set rpm(v: number) { this.e.rpm = v }
  get throttle() { return this.e.throttle }
  set throttle(v: number) { this.e.throttle = v }
  start(volume = 0.32) { return this.e.start(volume) }
  stop(fade = 1.2) { this.e.stop(fade) }
  setMuted(m: boolean) { this.e.setMuted(m) }
  ignition() { return 0 }
  launch() { return 0 }
  blip() { this.e.pop(0.8) }
}

/** Must be called from a user gesture. Samples first, synth if anything fails. */
export async function createEngine(): Promise<EngineLike | null> {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  try {
    return await SampleEngine.create()
  } catch (err) {
    console.warn('[engine] samples unavailable, using synth', err)
    try {
      return new SynthAdapter()
    } catch {
      return null
    }
  }
}
