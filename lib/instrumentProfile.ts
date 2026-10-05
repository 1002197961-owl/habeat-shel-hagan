import type { InputPort, Mapping } from './instrumentInput'

export const PROFILE_KEY = 'habeat.instrument-profile.v1'
// Visual positions from the supplied pad layout; MIDI notes are always learned.
// Left/right are from the player's view, with the control module at the top.
export const PAD_CUES = [
  { id: 'green', label: 'ירוק — אמצע שמאל', color: '#22C55E', symbol: '●', row: 2, column: 1 },
  { id: 'orange', label: 'כתום — אמצע ימין', color: '#FB923C', symbol: '◆', row: 2, column: 4 },
  { id: 'yellow', label: 'צהוב — למטה שמאל', color: '#FACC15', symbol: '★', row: 3, column: 1 },
  { id: 'pink', label: 'ורוד — למטה באמצע', color: '#F9A8D4', symbol: '♥', row: 3, column: 2 },
  { id: 'purple', label: 'סגול — למטה ימין', color: '#A78BFA', symbol: '✚', row: 3, column: 4 },
  { id: 'blue', label: 'תכלת 1 — שמאל חיצוני', color: '#38BDF8', symbol: '1', row: 1, column: 1 },
  { id: 'blue-left-inner', label: 'תכלת 2 — שמאל פנימי', color: '#38BDF8', symbol: '2', row: 1, column: 2 },
  { id: 'blue-right-inner', label: 'תכלת 3 — ימין פנימי', color: '#38BDF8', symbol: '3', row: 1, column: 3 },
  { id: 'blue-right-outer', label: 'תכלת 4 — ימין חיצוני', color: '#38BDF8', symbol: '4', row: 1, column: 4 },
] as const
export type PadId = typeof PAD_CUES[number]['id']
export type LearnedPad = { id: PadId; channel: number; note: number }
export type InstrumentProfile = { version: 1; port: Pick<InputPort, 'id' | 'name' | 'manufacturer'>; pads: LearnedPad[] }
export function parseProfile(raw: string | null): InstrumentProfile | null {
  try {
    const p = JSON.parse(raw || 'null')
    if (!p || p.version !== 1 || !p.port || !['id','name','manufacturer'].every(k => typeof p.port[k] === 'string') || !p.port.id || !Array.isArray(p.pads) || !p.pads.length || p.pads.length > PAD_CUES.length) return null
    const ids = new Set(), notes = new Set()
    for (const pad of p.pads) {
      const key = `${pad.channel}:${pad.note}`
      if (!PAD_CUES.some(c => c.id === pad.id) || !Number.isInteger(pad.channel) || pad.channel < 1 || pad.channel > 16 || !Number.isInteger(pad.note) || pad.note < 0 || pad.note > 127 || ids.has(pad.id) || notes.has(key)) return null
      ids.add(pad.id); notes.add(key)
    }
    return { version: 1, port: { id: p.port.id, name: p.port.name, manufacturer: p.port.manufacturer }, pads: p.pads.map((p: LearnedPad) => ({id:p.id,channel:p.channel,note:p.note})) }
  } catch { return null }
}
/** Metadata is not a universal model identity. Different IDs always require adult confirmation. */
export function matchProfile(profile: InstrumentProfile | null, ports: InputPort[]) {
  if (!profile) return null
  const matches = ports.filter(p => p.state === 'connected' && p.id === profile.port.id && p.name === profile.port.name && p.manufacturer === profile.port.manufacturer)
  return matches.length === 1 ? matches[0] : null
}
export function mappingFor(profile: InstrumentProfile | null, port: InputPort | null, pad: PadId): Mapping | null {
  const learned = profile?.pads.find(p => p.id === pad)
  return learned && port ? {portId:port.id,channel:learned.channel,note:learned.note} : null
}
export function learnPad(profile: InstrumentProfile | null, port: InputPort, id: PadId, channel: number, note: number): InstrumentProfile {
  if (profile && (profile.port.id !== port.id || profile.port.name !== port.name || profile.port.manufacturer !== port.manufacturer)) throw Error('different-device')
  if (profile?.pads.some(p => p.id !== id && p.channel === channel && p.note === note)) throw Error('duplicate-pad')
  const next = {version:1 as const, port:{id:port.id,name:port.name,manufacturer:port.manufacturer},pads:[...(profile?.pads.filter(p => p.id !== id) || []),{id,channel,note}]}
  const valid = parseProfile(JSON.stringify(next))
  if (!valid) throw Error('invalid-pad')
  return valid
}
