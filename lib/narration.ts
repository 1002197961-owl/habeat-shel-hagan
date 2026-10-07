export interface WordCue { word: string; start: number; end: number }
export interface NarrationAsset {
  id: string
  src: string
  text: string
  duration: number
  sha256: string
  alignment: { method: string; model: string; review: string }
  words: WordCue[]
}
export type NarrationStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
export interface NarrationState {
  id: string | null; status: NarrationStatus; wordIndex: number; currentTime: number; error: string
}
export const INITIAL_NARRATION: NarrationState = { id: null, status: 'idle', wordIndex: -1, currentTime: 0, error: '' }

export function wordAtTime(words: WordCue[], time: number): number {
  if (!Number.isFinite(time) || time < 0) return -1
  return words.findIndex(word => time >= word.start && time < word.end)
}
export function validateNarration(asset: NarrationAsset): boolean {
  if (!asset.words.length || asset.words.map(w => w.word).join(' ') !== asset.text) return false
  let end = 0
  return asset.words.every(w => {
    const valid = Boolean(w.word.trim()) && Number.isFinite(w.start) && Number.isFinite(w.end)
      && w.start >= end && w.end > w.start && w.end <= asset.duration
    end = w.end
    return valid
  })
}

// The media clock is the only source of truth. RAF reads currentTime; it never
// estimates word durations, distributes time across text, or advances a counter.
export class NarrationPlayer {
  state: NarrationState = { ...INITIAL_NARRATION }
  private audio: HTMLAudioElement | null = null
  private asset: NarrationAsset | null = null
  private generation = 0
  private frame: number | null = null
  private removeListeners: (() => void) | null = null
  constructor(
    private publish: (state: NarrationState) => void,
    private makeAudio: (src: string) => HTMLAudioElement = src => new Audio(src),
    private requestFrame: (fn: FrameRequestCallback) => number = fn => requestAnimationFrame(fn),
    private cancelFrame: (id: number) => void = id => cancelAnimationFrame(id),
  ) {}
  private emit(change: Partial<NarrationState>) {
    this.state = { ...this.state, ...change }
    this.publish(this.state)
  }
  private cancelTick() {
    if (this.frame !== null) this.cancelFrame(this.frame)
    this.frame = null
  }
  private release() {
    this.generation++
    this.cancelTick()
    this.removeListeners?.(); this.removeListeners = null
    if (this.audio) {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
    }
    this.audio = null
  }
  async play(asset: NarrationAsset, from = 0) {
    this.release()
    this.asset = asset
    const generation = this.generation
    const audio = this.makeAudio(asset.src)
    this.audio = audio
    const valid = () => generation === this.generation && this.audio === audio
    const hasCues = validateNarration(asset)
    const sync = () => {
      if (!valid()) return
      this.emit({currentTime: audio.currentTime, wordIndex: hasCues && !audio.paused ? wordAtTime(asset.words, audio.currentTime) : -1})
    }
    const tick = () => {
      this.frame = null
      if (!valid() || audio.paused || audio.ended || this.state.status !== 'playing') return
      sync(); this.frame = this.requestFrame(tick)
    }
    const playing = () => { if (valid()) { this.emit({ status: 'playing' }); this.cancelTick(); tick() } }
    const waiting = () => { if (valid()) { this.cancelTick(); this.emit({status:'loading',wordIndex:-1}) } }
    const paused = () => { if (valid() && !audio.ended) { this.cancelTick(); this.emit({status:'paused',wordIndex:-1,currentTime:audio.currentTime}) } }
    const ended = () => { if (valid()) { this.cancelTick(); this.emit({status:'ended',wordIndex:-1,currentTime:audio.currentTime}) } }
    const failed = () => { if (valid()) { this.release(); this.emit({status:'error',wordIndex:-1,error:'ההקראה לא נטענה. לחצו על שמעו שוב כדי לנסות מחדש.'}) } }
    const listeners: [string, EventListener][] = [
      ['timeupdate',sync],['playing',playing],['waiting',waiting],['pause',paused],['ended',ended],['error',failed],
      ['seeking',sync],['seeked',sync],
    ]
    listeners.forEach(([name, fn]) => audio.addEventListener(name,fn))
    this.removeListeners = () => listeners.forEach(([name,fn]) => audio.removeEventListener(name,fn))
    this.emit({id:asset.id,status:'loading',currentTime:from,wordIndex:-1,error:''})
    if (from > 0) audio.currentTime = from
    try {
      await audio.play()
      if (!valid()) return
      if (!audio.paused) playing()
    } catch {
      if (valid()) { this.release(); this.emit({status:'error',wordIndex:-1,error:'לחצו שוב על כפתור ההקראה ובדקו שהצליל במכשיר פעיל.'}) }
    }
  }
  pause() {
    const time = this.audio?.currentTime ?? this.state.currentTime
    this.release()
    this.emit({status:'paused',currentTime:time,wordIndex:-1})
  }
  resume() { if (this.asset) return this.play(this.asset,this.state.currentTime) }
  reset() { this.release(); this.asset=null; this.emit({...INITIAL_NARRATION}) }
  dispose() { this.release(); this.asset=null }
}
