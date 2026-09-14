/**
 * Procedural twin-turbo V6 built from oscillators — no audio file to license.
 * Firing frequency = rpm / 60 × 3 (six cylinders, four-stroke). Layers: saw at the firing
 * rate, a half-rate square for the uneven-idle lope, a detuned octave, band-passed noise for
 * intake/exhaust texture and a faint turbo whistle. Everything runs through a soft clipper
 * and an rpm-following low-pass so it opens up as the revs climb.
 */
export class SynthEngine {
  static supported = typeof window !== 'undefined' && 'AudioContext' in window

  rpm = 900
  throttle = 0
  private ctx: AudioContext
  private master: GainNode
  private body: GainNode
  private saw: OscillatorNode
  private sub: OscillatorNode
  private oct: OscillatorNode
  private noise: AudioBufferSourceNode
  private noiseFilter: BiquadFilterNode
  private noiseGain: GainNode
  private turbo: OscillatorNode
  private turboGain: GainNode
  private lowpass: BiquadFilterNode
  private lfo: OscillatorNode
  private lfoGain: GainNode
  private raf = 0
  private running = false
  private volume = 0.32
  private muted = false

  constructor() {
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    // tone chain: oscillators → clipper → lowpass → thump EQ → body gain → master
    const shaper = ctx.createWaveShaper()
    shaper.curve = SynthEngine.softClip(3.2)
    shaper.oversample = '2x'
    this.lowpass = ctx.createBiquadFilter()
    this.lowpass.type = 'lowpass'
    this.lowpass.Q.value = 0.9
    const thump = ctx.createBiquadFilter()
    thump.type = 'peaking'
    thump.frequency.value = 110
    thump.gain.value = 7
    thump.Q.value = 1.1
    this.body = ctx.createGain()
    this.body.gain.value = 0.6
    shaper.connect(this.lowpass).connect(thump).connect(this.body).connect(this.master)

    const mk = (type: OscillatorType, gain: number) => {
      const o = ctx.createOscillator()
      o.type = type
      const g = ctx.createGain()
      g.gain.value = gain
      o.connect(g).connect(shaper)
      o.start()
      return o
    }
    this.saw = mk('sawtooth', 0.55)
    this.sub = mk('square', 0.22)
    this.oct = mk('sawtooth', 0.18)
    this.oct.detune.value = 7

    // idle lope
    this.lfo = ctx.createOscillator()
    this.lfo.type = 'sine'
    this.lfoGain = ctx.createGain()
    this.lfo.connect(this.lfoGain).connect(this.body.gain)
    this.lfo.start()

    // noise texture
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    this.noise = ctx.createBufferSource()
    this.noise.buffer = buf
    this.noise.loop = true
    this.noiseFilter = ctx.createBiquadFilter()
    this.noiseFilter.type = 'bandpass'
    this.noiseFilter.Q.value = 1.6
    this.noiseGain = ctx.createGain()
    this.noiseGain.gain.value = 0
    this.noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master)
    this.noise.start()

    // turbo whistle
    this.turbo = ctx.createOscillator()
    this.turbo.type = 'sine'
    this.turboGain = ctx.createGain()
    this.turboGain.gain.value = 0
    this.turbo.connect(this.turboGain).connect(this.master)
    this.turbo.start()

    this.apply()
  }

  private static softClip(drive: number) {
    const n = 1024
    const curve = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive)
    }
    return curve
  }

  /** Must be called from a user gesture. */
  async start(volume = 0.32) {
    this.volume = volume
    if (this.ctx.state !== 'running') await this.ctx.resume()
    this.running = true
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(this.muted ? 0 : volume, t, 0.25)
    const tick = () => {
      if (!this.running) return
      this.apply()
      this.raf = requestAnimationFrame(tick)
    }
    tick()
  }

  /** Fade out and release the graph. */
  stop(fade = 1.2) {
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(0, t, fade / 4)
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

  /** Short off-throttle pop (gear change, overrun). */
  pop(strength = 1) {
    const t = this.ctx.currentTime
    this.noiseGain.gain.cancelScheduledValues(t)
    this.noiseGain.gain.setValueAtTime(0.5 * strength, t)
    this.noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  }

  private apply() {
    const rpm = Math.max(600, this.rpm)
    const f = (rpm / 60) * 3
    const t = this.ctx.currentTime
    const k = 0.03
    this.saw.frequency.setTargetAtTime(f, t, k)
    this.sub.frequency.setTargetAtTime(f / 2, t, k)
    this.oct.frequency.setTargetAtTime(f * 2, t, k)
    const load = Math.min(1, rpm / 8500)
    this.lowpass.frequency.setTargetAtTime(280 + load * 3800 + this.throttle * 900, t, k)
    this.lfo.frequency.setTargetAtTime(f / 6, t, k)
    this.lfoGain.gain.setTargetAtTime(0.28 * (1 - load) * (1 - this.throttle * 0.7), t, k)
    this.noiseFilter.frequency.setTargetAtTime(600 + load * 3000, t, k)
    this.noiseGain.gain.setTargetAtTime(0.02 + this.throttle * 0.11 + load * 0.05, t, 0.08)
    this.turbo.frequency.setTargetAtTime(1600 + rpm * 0.55, t, k)
    this.turboGain.gain.setTargetAtTime(this.throttle * 0.035 * load, t, 0.1)
  }
}
