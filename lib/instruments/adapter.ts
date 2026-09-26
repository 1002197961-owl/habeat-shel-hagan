export type InstrumentEvent = {
  sourceId: string
  instrument: 'guitar' | 'drums' | 'voice' | 'keys' | string
  action: string
  value?: number
  timestamp: number
}

// Hardware-independent input boundary.
// Keyboard/touch simulation, Web MIDI and future sensor/API adapters should all emit this shape.
export interface InstrumentAdapter {
  id: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe(listener: (event: InstrumentEvent) => void): () => void
}
