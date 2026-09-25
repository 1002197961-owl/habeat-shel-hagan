export type DemoTrack = 'garden-hello' | 'rain-dance' | 'color-parade'

const scores: Record<DemoTrack, { bpm: number; notes: number[]; wave: OscillatorType }> = {
  'garden-hello': { bpm: 100, notes: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 261.63], wave: 'sine' },
  'rain-dance': { bpm: 80, notes: [392, 0, 440, 392, 329.63, 0, 293.66, 329.63], wave: 'sine' },
  'color-parade': { bpm: 120, notes: [261.63, 329.63, 392, 440, 523.25, 440, 392, 523.25], wave: 'triangle' },
}

let context: AudioContext | null = null
let active: OscillatorNode[] = []
let stopTimer: ReturnType<typeof setTimeout> | null = null

export function stopMusic() {
  if (stopTimer) clearTimeout(stopTimer)
  stopTimer = null
  for (const oscillator of active) {
    try { oscillator.stop() } catch { /* already stopped */ }
  }
  active = []
}

export async function playMusic(track: DemoTrack, onDone: () => void) {
  stopMusic()
  const score = scores[track]
  context ??= new AudioContext()
  await context.resume()
  const beat = 60 / score.bpm
  const start = context.currentTime + 0.04
  const notes = [...score.notes, ...score.notes, ...score.notes, ...score.notes]
  notes.forEach((frequency, index) => {
    if (!frequency) return
    const oscillator = context!.createOscillator()
    const gain = context!.createGain()
    oscillator.type = score.wave
    oscillator.frequency.value = frequency
    const time = start + index * beat
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.12, time + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + beat * 0.8)
    oscillator.connect(gain).connect(context!.destination)
    oscillator.start(time)
    oscillator.stop(time + beat * 0.82)
    active.push(oscillator)
  })
  stopTimer = setTimeout(() => { active = []; stopTimer = null; onDone() }, notes.length * beat * 1000)
}

export function speakHebrew(text: string, onDone?: () => void): boolean {
  if (!('speechSynthesis' in window)) return false
  const synthesis = window.speechSynthesis
  synthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'he-IL'
  utterance.rate = 0.86
  utterance.pitch = 1.04
  const voices = synthesis.getVoices()
  const hebrewVoice = voices.find(v => v.lang.toLowerCase() === 'he-il')
    ?? voices.find(v => v.lang.toLowerCase().startsWith('he'))
  if (!hebrewVoice) return false
  utterance.voice = hebrewVoice
  utterance.onend = () => onDone?.()
  utterance.onerror = () => onDone?.()
  synthesis.speak(utterance)
  return true
}
