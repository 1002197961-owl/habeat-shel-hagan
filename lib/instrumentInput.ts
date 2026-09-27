// Web MIDI is one documented candidate transport, not evidence of physical hardware.
export type InputPort = { id: string; name: string; manufacturer: string; state: string }
export type InputEvent = {
  id: number; source: 'web-midi' | 'simulation'; port: InputPort; bytes: number[];
  receivedAt: string; receivedMs: number; browserEventMs: number | null;
  kind: 'note-on' | 'note-off' | 'other' | 'invalid'; channel: number | null;
  note: number | null; velocity: number | null; duplicate: boolean;
}
export type Mapping = { portId: string; channel: number; note: number }
export type Turn = 'ready' | 'demonstrating' | 'waiting' | 'responded' | 'paused'

export function decodeMIDI(bytes: number[]) {
  const empty = { kind: 'other' as InputEvent['kind'], channel: null, note: null, velocity: null }
  if (!bytes.length || bytes.some(b => !Number.isInteger(b) || b < 0 || b > 255) || bytes[0] < 128)
    return { ...empty, kind: 'invalid' as const }
  const status = bytes[0] & 0xf0
  if (status !== 0x90 && status !== 0x80) return empty
  if (bytes.length !== 3 || bytes[1] > 127 || bytes[2] > 127) return { ...empty, kind: 'invalid' as const }
  return { kind: status === 0x90 && bytes[2] > 0 ? 'note-on' as const : 'note-off' as const,
    channel: (bytes[0] & 15) + 1, note: bytes[1], velocity: bytes[2] }
}

export class InputRecorder {
  private sequence = 0
  private seen = new Set<string>()
  resetFingerprints() { this.seen.clear() }
  receive(source: InputEvent['source'], port: InputPort, bytes: number[], browserEventMs: number | null,
    receivedMs: number, receivedAt: string): InputEvent {
    const stamp = browserEventMs !== null && Number.isFinite(browserEventMs) && browserEventMs >= 0 ? browserEventMs : null
    // No arbitrary debounce: two fast real messages with distinct timestamps survive.
    // This detects identical browser deliveries only; it cannot identify physical double triggers.
    const key = stamp === null ? null : `${source}:${port.id}:${stamp}:${bytes.join(',')}`
    const duplicate = key !== null && this.seen.has(key)
    if (key !== null) this.seen.add(key)
    if (this.seen.size > 4096) this.seen.delete(this.seen.values().next().value!)
    return { id: ++this.sequence, source, port, bytes: [...bytes], receivedMs, receivedAt,
      browserEventMs: stamp, ...decodeMIDI(bytes), duplicate }
  }
}

export function routeInput(event: InputEvent, mode: InputEvent['source'], mapping: Mapping | null,
  turn: Turn, waitingSince: number, remaining = 1) {
  if (event.duplicate) return { accepted: false, reason: 'duplicate-delivery', next: turn }
  if (event.source !== mode) return { accepted: false, reason: 'other-source', next: turn }
  if (event.kind !== 'note-on') return { accepted: false, reason: event.kind, next: turn }
  if (!mapping || mapping.portId !== event.port.id || mapping.channel !== event.channel || mapping.note !== event.note)
    return { accepted: false, reason: 'unmapped', next: turn }
  if (turn !== 'waiting') return { accepted: false, reason: 'outside-turn', next: turn }
  if (event.browserEventMs !== null && event.browserEventMs < waitingSince)
    return { accepted: false, reason: 'stale-before-turn', next: turn }
  return { accepted: true, reason: 'turn-response', next: (remaining > 1 ? 'waiting' : 'responded') as Turn }
}

type MidiMessage = { data: Uint8Array | null; timeStamp: number }
export type MidiPortLike = InputPort & {
  addEventListener(type: string, handler: (event: MidiMessage) => void): void;
  removeEventListener(type: string, handler: (event: MidiMessage) => void): void;
  open(): Promise<unknown>; close(): Promise<unknown>;
}
export type MidiAccessLike = {
  inputs: Map<string, MidiPortLike>;
  addEventListener(type: string, handler: () => void): void;
  removeEventListener(type: string, handler: () => void): void;
}

export class MidiTransport {
  private generation = 0
  private access: MidiAccessLike | null = null
  private bound = new Map<MidiPortLike, (event: MidiMessage) => void>()
  constructor(private onMessage: (port: InputPort, bytes: number[], timeStamp: number) => void,
    private onPorts: (ports: InputPort[]) => void, private onError: (message: string) => void) {}
  async connect(request: () => Promise<MidiAccessLike>) {
    this.disconnect()
    const generation = this.generation
    try {
      const access = await request()
      if (generation !== this.generation) return
      this.access = access
      access.addEventListener('statechange', this.reconcile)
      this.reconcile()
    } catch { if (generation === this.generation) this.onError('הגישה לקלט לא אושרה או אינה זמינה. אפשר לנסות שוב.') }
  }
  private reconcile = () => {
    if (!this.access) return
    const ports = [...this.access.inputs.values()].filter(p => p.state === 'connected')
    for (const [port, handler] of this.bound) if (!ports.includes(port)) {
      port.removeEventListener('midimessage', handler); this.bound.delete(port)
    }
    for (const port of ports) if (!this.bound.has(port)) {
      const generation = this.generation
      const handler = (event: MidiMessage) => {
        if (generation === this.generation && this.bound.has(port) && port.state === 'connected')
          this.onMessage({ id: port.id, name: port.name || 'כניסת MIDI ללא שם', manufacturer: port.manufacturer || '', state: port.state },
            Array.from(event.data ?? []), event.timeStamp)
      }
      this.bound.set(port, handler); port.addEventListener('midimessage', handler)
      void port.open().catch(() => { if (generation === this.generation) this.onError('לא ניתן לפתוח את כניסת הקלט.') })
    }
    this.onPorts(ports.map(p => ({ id: p.id, name: p.name || 'כניסת MIDI ללא שם', manufacturer: p.manufacturer || '', state: p.state })))
  }
  disconnect() {
    this.generation++
    this.access?.removeEventListener('statechange', this.reconcile)
    this.access = null
    const bound = [...this.bound]; this.bound.clear()
    for (const [port, handler] of bound) {
      port.removeEventListener('midimessage', handler); void port.close().catch(() => {})
    }
  }
}
