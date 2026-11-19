// Same original C4 sine tone as the existing garden exercise; no new song/recording.
export class TurnTone {
  private context: AudioContext | null = null
  private active = new Set<OscillatorNode>()
  private sounding = new Set<OscillatorNode>()
  private starts = new Map<OscillatorNode, ReturnType<typeof setTimeout>>()
  get clock() { return this.context?.currentTime ?? 0 }
  constructor(private onActivity: (active: boolean) => void = () => {}) {}
  async prepare() {
    this.context ??= new AudioContext({ latencyHint: 'interactive' })
    await this.context.resume()
    if (this.context.state !== 'running') throw new Error('Audio unavailable')
  }
  play(atTime?: number) {
    const context = this.context
    if (!context || context.state !== 'running') return null
    const node = context.createOscillator(), gain = context.createGain()
    node.type = 'sine'; node.frequency.value = 261.63
    const at = Math.max(context.currentTime, atTime ?? context.currentTime)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    node.connect(gain).connect(context.destination)
    this.active.add(node)
    node.onended = () => {
      node.disconnect(); gain.disconnect()
      this.active.delete(node)
      const timer = this.starts.get(node); if (timer) clearTimeout(timer)
      this.starts.delete(node)
      const wasSounding = this.sounding.delete(node)
      if (wasSounding && this.sounding.size === 0) this.onActivity(false)
    }
    node.start(at); node.stop(at + 0.24)
    const begin = () => { this.starts.delete(node); if (this.active.has(node)) { this.sounding.add(node); this.onActivity(true) } }
    const delay = Math.max(0, (at - context.currentTime) * 1000)
    if (delay > 0) this.starts.set(node, setTimeout(begin, delay)); else begin()
    return { scheduledAtMs: performance.now() + delay, contextTime: at, baseLatency: context.baseLatency ?? null }
  }
  stop() {
    for (const node of this.active) { try { node.stop() } catch {} }
    this.active.clear()
    this.starts.forEach(clearTimeout); this.starts.clear(); this.sounding.clear()
    this.onActivity(false)
  }
  dispose() { this.stop(); const context = this.context; this.context = null; void context?.close().catch(() => {}) }
}
