import { LOCKED_CORE_CSS, LOCKED_CORE_SVG } from './beatCoreSources'

export type BeatCoreCharacter = keyof typeof LOCKED_CORE_SVG
export type BeatCoreState = 'idle' | 'listening' | 'playing' | 'success' | 'band_sync'

const CHARACTER_LABELS: Record<BeatCoreCharacter, string> = {
  R: 'קצב', G: 'נגינה', V: 'קול', M: 'צלילים',
}
const STATE_LABELS: Record<BeatCoreState, string> = {
  idle: 'מנוחה', listening: 'הקשבה', playing: 'נגינה', success: 'הצלחה', band_sync: 'נגינה יחד',
}

/** Change semantic state only. The approved source shapes and CSS are not rewritten. */
export function beatCoreSvg(character: BeatCoreCharacter, state: BeatCoreState): string {
  const role = Object.hasOwn(LOCKED_CORE_SVG, character) ? character : 'R'
  const safeState = Object.hasOwn(STATE_LABELS, state) ? state : 'idle'
  return LOCKED_CORE_SVG[role]
    .replace('data-state="idle"', `data-state="${safeState}"`)
    .replace(/aria-label="[^"]*"/, `aria-label="${CHARACTER_LABELS[role]}: ${STATE_LABELS[safeState]}"`)
}

/** A completed turn is neither ongoing sound nor evidence of rhythmic correctness. */
export function beatCoreStateForTurn(turn: string, toneActive = false): BeatCoreState {
  if (!['waiting', 'demonstrating', 'responded'].includes(turn)) return 'idle'
  if (toneActive) return 'playing'
  if (turn === 'waiting' || turn === 'demonstrating') return 'listening'
  return 'idle'
}

export { LOCKED_CORE_CSS }
