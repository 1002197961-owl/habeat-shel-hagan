// Same original C4 sine tone as the existing garden exercise; no new song/recording.
export class TurnTone {
  private context: AudioContext | null = null
  private active = new Set<OscillatorNode>()
  async prepare() {
    this.context ??= new AudioContext({ latencyHint: 'interactive' })
    await this.context.resume()
    if (this.context.state !== 'running') throw new Error('Audio unavailable')
  }
  play() {
    const context = this.context
    if (!context || context.state !== 'running') return null
    const node = context.createOscillator(), gain = context.createGain()
    node.type = 'sine'; node.frequency.value = 261.63
    const at = context.currentTime
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    node.connect(gain).connect(context.destination)
    this.active.add(node)
    node.onended = () => { node.disconnect(); gain.disconnect(); this.active.delete(node) }
    node.start(at); node.stop(at + 0.24)
    return { scheduledAtMs: performance.now(), contextTime: at, baseLatency: context.baseLatency ?? null }
  }
  stop() {
    for (const node of this.active) { try { node.stop() } catch {} }
    this.active.clear()
  }
  dispose() { this.stop(); const context = this.context; this.context = null; void context?.close().catch(() => {}) }
}
