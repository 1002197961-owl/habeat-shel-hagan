import type { PadId } from './instrumentProfile'

export type SequencePhase = 'demonstrating' | 'waiting' | 'completed' | 'paused'
export type SequenceRound = {
  id: number; level: number; pads: PadId[]; index: number; phase: SequencePhase
  mistakes: number; lastEventId: number | null
}

/** Three short, predictable levels; only the adult's calibrated pad choices enter. */
export function createSequenceRound(id: number, choices: readonly PadId[], level = 1): SequenceRound {
  const pool = [...new Set(choices)]
  if (!pool.length) throw new Error('Choose a calibrated pad')
  if (!Number.isInteger(level) || level < 1 || level > 3) throw new Error('Level must be 1–3')
  return { id, level, pads: Array.from({ length: level }, (_, i) => pool[i % pool.length]), index: 0, phase: 'demonstrating', mistakes: 0, lastEventId: null }
}

export function beginSequenceResponse(round: SequenceRound): SequenceRound {
  return round.phase === 'demonstrating' ? { ...round, phase: 'waiting', index: 0 } : round
}

/** Transport validation happens first. There is intentionally no rhythm/latency score. */
export function receiveSequencePad(round: SequenceRound, pad: PadId, eventId: number) {
  if (round.phase !== 'waiting' || !Number.isInteger(eventId) || eventId <= (round.lastEventId ?? -1))
    return { round, accepted: false, reason: 'inactive-or-repeated' as const }
  if (pad !== round.pads[round.index])
    return { round: { ...round, mistakes: round.mistakes + 1, lastEventId: eventId }, accepted: false, reason: 'different-pad' as const }
  const index = round.index + 1
  return { round: { ...round, index, lastEventId: eventId, phase: index === round.pads.length ? 'completed' as const : 'waiting' as const }, accepted: true, reason: 'sequence-step' as const }
}

export function pauseSequence(round: SequenceRound): SequenceRound {
  return { ...round, phase: 'paused', index: 0 }
}

export function nextSequenceLevel(round: SequenceRound): number | null {
  return round.phase === 'completed' && round.level < 3 ? round.level + 1 : null
}

export function sequenceDemoSchedule(length: number, intervalMs: number) {
  if (!Number.isInteger(length) || length < 1 || length > 3) throw new Error('Invalid length')
  if (![650, 900, 1200].includes(intervalMs)) throw new Error('Invalid demo tempo')
  return { steps: Array.from({ length }, (_, index) => ({ index, atMs: index * intervalMs })), responseAtMs: length * intervalMs }
}

/** Synthetic pad choices cannot become the target for an unrelated saved instrument. */
export function padForInputSource(source: 'web-midi' | 'simulation', current: PadId, calibrated: readonly PadId[]): PadId {
  if (source === 'simulation') return 'green'
  return calibrated.includes(current) ? current : calibrated[0] ?? 'green'
}
