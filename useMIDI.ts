import { useEffect, useRef, useState, useCallback } from 'react'

export type MIDIDevice = {
  id: string
  name: string
  color: string   // mapped from BEAT_COLORS
  instrument: string
}

export type MIDIEvent = {
  deviceId: string
  note: number
  velocity: number
  timestamp: number
  type: 'noteOn' | 'noteOff'
}

// Map MIDI device name keywords → beat color system
const DEVICE_COLOR_MAP: { keyword: string; color: string; instrument: string }[] = [
  { keyword: 'drum',    color: 'red',    instrument: 'תופים' },
  { keyword: 'kit',     color: 'red',    instrument: 'תופים' },
  { keyword: 'guitar',  color: 'green',  instrument: 'גיטרה' },
  { keyword: 'mic',     color: 'blue',   instrument: 'מיקרופון' },
  { keyword: 'vocal',   color: 'blue',   instrument: 'מיקרופון' },
  { keyword: 'key',     color: 'purple', instrument: 'קלידים' },
  { keyword: 'piano',   color: 'purple', instrument: 'קלידים' },
  { keyword: 'organ',   color: 'purple', instrument: 'קלידים' },
  { keyword: 'dj',      color: 'yellow', instrument: 'כפתור / מחיאת כף' },
  { keyword: 'pad',     color: 'yellow', instrument: 'כפתור / מחיאת כף' },
]

const COLOR_ORDER = ['red', 'yellow', 'blue', 'green', 'purple']

function resolveDevice(input: MIDIInput, index: number): MIDIDevice {
  const name = (input.name ?? 'כלי ' + (index + 1)).toLowerCase()
  const match = DEVICE_COLOR_MAP.find(m => name.includes(m.keyword))
  return {
    id: input.id,
    name: input.name ?? 'כלי ' + (index + 1),
    color: match?.color ?? COLOR_ORDER[index % COLOR_ORDER.length],
    instrument: match?.instrument ?? 'כלי נגינה',
  }
}

type UseMIDIReturn = {
  devices: MIDIDevice[]
  lastEvents: Record<string, MIDIEvent>   // deviceId → latest event
  activeNotes: Record<string, boolean>    // deviceId → is playing right now
  supported: boolean
  error: string | null
  requestAccess: () => Promise<void>
}

export function useMIDI(onEvent?: (e: MIDIEvent) => void): UseMIDIReturn {
  const [devices, setDevices] = useState<MIDIDevice[]>([])
  const [lastEvents, setLastEvents] = useState<Record<string, MIDIEvent>>({})
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const accessRef = useRef<MIDIAccess | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

  const buildDeviceList = useCallback((access: MIDIAccess) => {
    const inputs = Array.from(access.inputs.values())
    setDevices(inputs.map((inp, i) => resolveDevice(inp, i)))
  }, [])

  const attachListeners = useCallback((access: MIDIAccess) => {
    Array.from(access.inputs.values()).forEach((input, i) => {
      const device = resolveDevice(input, i)
      input.onmidimessage = (msg: MIDIMessageEvent) => {
        const [status, note, velocity] = Array.from(msg.data)
        const isNoteOn  = (status & 0xf0) === 0x90 && velocity > 0
        const isNoteOff = (status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)
        if (!isNoteOn && !isNoteOff) return

        const event: MIDIEvent = {
          deviceId: device.id,
          note,
          velocity,
          timestamp: msg.timeStamp,
          type: isNoteOn ? 'noteOn' : 'noteOff',
        }

        setLastEvents(prev => ({ ...prev, [device.id]: event }))
        setActiveNotes(prev => ({ ...prev, [device.id]: isNoteOn }))

        if (isNoteOn) onEventRef.current?.(event)

        // Clear active state after 300ms for visual flash
        if (isNoteOn) {
          setTimeout(() => {
            setActiveNotes(prev => ({ ...prev, [device.id]: false }))
          }, 300)
        }
      }
    })
  }, [])

  const requestAccess = useCallback(async () => {
    if (!supported) { setError('הדפדפן לא תומך ב-Web MIDI API'); return }
    try {
      const access = await (navigator as any).requestMIDIAccess({ sysex: false })
      accessRef.current = access
      buildDeviceList(access)
      attachListeners(access)
      access.onstatechange = () => {
        buildDeviceList(access)
        attachListeners(access)
      }
    } catch (e) {
      setError('לא ניתן לגשת לכלי MIDI. ודא שהכלי מחובר ב-USB ואשר גישה בדפדפן.')
    }
  }, [supported, buildDeviceList, attachListeners])

  useEffect(() => {
    requestAccess()
    return () => {
      if (accessRef.current) {
        Array.from(accessRef.current.inputs.values()).forEach(i => { i.onmidimessage = null })
      }
    }
  }, [requestAccess])

  return { devices, lastEvents, activeNotes, supported, error, requestAccess }
}
