'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMIDI, MIDIEvent } from '@/hooks/useMIDI'

// ─── Types ───────────────────────────────────────────────────────────────────

type Song = {
  id: number
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  pattern: string[]
}

type RecordedEvent = MIDIEvent & { beatIndex: number; songId: number }

// ─── Constants ───────────────────────────────────────────────────────────────

const SONGS: Song[] = [
  { id: 1, title: 'אם אתה שמח',         difficulty: 'easy',   pattern: ['red','yellow','red','yellow','red','yellow','blue','yellow'] },
  { id: 2, title: 'יונתן הקטן',          difficulty: 'easy',   pattern: ['red','red','yellow','red','red','yellow','blue','yellow'] },
  { id: 3, title: 'לדוד משה הייתה חווה', difficulty: 'medium', pattern: ['green','red','yellow','green','red','yellow','blue','green'] },
  { id: 4, title: 'ידיים למעלה',         difficulty: 'medium', pattern: ['yellow','yellow','red','blue','yellow','yellow','red','purple'] },
  { id: 5, title: 'קן לציפור',           difficulty: 'hard',   pattern: ['blue','green','purple','red','yellow','blue','green','purple'] },
]

const COLOR_CONFIG: Record<string, { bg: string; flash: string; label: string; border: string }> = {
  red:    { bg: '#3d1a1a', flash: '#ef4444', label: 'תופים',              border: '#ef4444' },
  yellow: { bg: '#3d380a', flash: '#fbbf24', label: 'מחיאת כף',           border: '#fbbf24' },
  blue:   { bg: '#0a2540', flash: '#3b82f6', label: 'מיקרופון',           border: '#3b82f6' },
  green:  { bg: '#0a2e1a', flash: '#22c55e', label: 'גיטרה',              border: '#22c55e' },
  purple: { bg: '#1e0a3d', flash: '#a78bfa', label: 'קלידים',             border: '#a78bfa' },
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' }
const DIFFICULTY_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#f97316', hard: '#f43f5e' }
const BPM = 80
const BEAT_MS = (60 / BPM) * 1000

// ─── Sub-components ──────────────────────────────────────────────────────────

function BeatCell({ color, isActive, isPlaying, hit }: {
  color: string; isActive: boolean; isPlaying: boolean; hit: boolean
}) {
  const cfg = COLOR_CONFIG[color] ?? COLOR_CONFIG.red
  return (
    <motion.div
      animate={hit ? { scale: [1, 1.18, 1], opacity: [1, 1, 1] } : {}}
      transition={{ duration: 0.25 }}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 12,
        background: hit ? cfg.flash : isActive && isPlaying ? cfg.flash + 'cc' : cfg.bg,
        border: `2px solid ${isActive && isPlaying ? cfg.border : cfg.bg}`,
        boxShadow: hit ? `0 0 18px ${cfg.flash}99` : isActive && isPlaying ? `0 0 10px ${cfg.flash}66` : 'none',
        transition: 'background 0.1s, box-shadow 0.1s, border 0.1s',
      }}
    />
  )
}

function InstrumentColumn({ device, song, currentBeat, isPlaying, hit }: {
  device: { id: string; name: string; color: string; instrument: string }
  song: Song | null
  currentBeat: number
  isPlaying: boolean
  hit: boolean
}) {
  const cfg = COLOR_CONFIG[device.color] ?? COLOR_CONFIG.red

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: '12px 8px',
      background: '#ffffff08',
      borderRadius: 16,
      border: `1px solid ${hit ? cfg.border + '88' : '#ffffff12'}`,
      transition: 'border 0.15s',
    }}>
      {/* Header */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: cfg.flash + '22',
        border: `2px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {device.color === 'red' ? '🥁' : device.color === 'yellow' ? '👏' : device.color === 'blue' ? '🎙️' : device.color === 'green' ? '🎸' : '🎹'}
      </div>
      <div style={{ fontSize: 11, color: cfg.flash, fontWeight: 700, textAlign: 'center', fontFamily: 'Heebo, sans-serif' }}>
        {device.instrument}
      </div>
      <div style={{ fontSize: 10, color: '#ffffff55', textAlign: 'center', fontFamily: 'Heebo, sans-serif', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {device.name}
      </div>

      {/* Beat pattern */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        {song ? song.pattern.map((beatColor, i) => (
          <BeatCell
            key={i}
            color={beatColor}
            isActive={i === currentBeat}
            isPlaying={isPlaying}
            hit={hit && i === currentBeat && beatColor === device.color}
          />
        )) : (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 12, background: '#ffffff08', border: '1px solid #ffffff15' }} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RhythmPracticePage() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([])
  const [hitMap, setHitMap] = useState<Record<string, boolean>>({}) // deviceId → flash
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const beatRef = useRef(-1)

  const handleMIDIEvent = useCallback((e: MIDIEvent) => {
    // Flash the column
    setHitMap(prev => ({ ...prev, [e.deviceId]: true }))
    setTimeout(() => setHitMap(prev => ({ ...prev, [e.deviceId]: false })), 280)

    // Record if active
    if (isRecording && selectedSong) {
      setRecordedEvents(prev => [...prev, {
        ...e,
        beatIndex: beatRef.current,
        songId: selectedSong.id,
      }])
    }
  }, [isRecording, selectedSong])

  const { devices, supported, error, requestAccess } = useMIDI(handleMIDIEvent)

  // Simulate demo device if no MIDI connected (for development/preview)
  const displayDevices = devices.length > 0 ? devices : [
    { id: 'demo-1', name: 'Demo Drums',    color: 'red',    instrument: 'תופים' },
    { id: 'demo-2', name: 'Demo Keys',     color: 'purple', instrument: 'קלידים' },
    { id: 'demo-3', name: 'Demo Guitar',   color: 'green',  instrument: 'גיטרה' },
  ]

  const startPlayback = useCallback(() => {
    if (!selectedSong) return
    setIsPlaying(true)
    beatRef.current = -1
    setCurrentBeat(-1)
    intervalRef.current = setInterval(() => {
      beatRef.current = (beatRef.current + 1) % selectedSong.pattern.length
      setCurrentBeat(beatRef.current)
    }, BEAT_MS)
  }, [selectedSong])

  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setCurrentBeat(-1)
    beatRef.current = -1
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      stopPlayback()
      setSaveMessage(`✅ הוקלטו ${recordedEvents.length} אירועים!`)
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setRecordedEvents([])
      setIsRecording(true)
      startPlayback()
    }
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (selectedSong) {
      intervalRef.current = setInterval(() => {
        beatRef.current = (beatRef.current + 1) % selectedSong.pattern.length
        setCurrentBeat(beatRef.current)
      }, BEAT_MS)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [selectedSong, isPlaying])

  return (
    <div dir="rtl" style={{
      minHeight: '100dvh',
      background: '#0f0e1a',
      fontFamily: 'Heebo, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #ffffff12',
        background: '#1a1830',
      }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>🎵 תרגול קצב</div>
          <div style={{ color: '#ffffff55', fontSize: 11 }}>{displayDevices.length} כלים מחוברים</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* MIDI status */}
          <div style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 20,
            background: devices.length > 0 ? '#22c55e22' : '#f4433622',
            color: devices.length > 0 ? '#22c55e' : '#f44336',
            border: `1px solid ${devices.length > 0 ? '#22c55e44' : '#f4433644'}`,
            cursor: devices.length === 0 ? 'pointer' : 'default',
          }} onClick={devices.length === 0 ? requestAccess : undefined}>
            {devices.length > 0 ? '🔌 MIDI פעיל' : '⚡ חבר כלים'}
          </div>

          {/* BPM badge */}
          <div style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 20,
            background: '#8B5CF622', color: '#a78bfa', border: '1px solid #8B5CF644',
          }}>
            {BPM} BPM
          </div>
        </div>
      </div>

      {/* Song selector */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #ffffff0a' }}>
        <div style={{ fontSize: 11, color: '#ffffff55', marginBottom: 8 }}>בחר שיר לתרגול</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {SONGS.map(song => (
            <button
              key={song.id}
              onClick={() => { setSelectedSong(song); stopPlayback() }}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1.5px solid ${selectedSong?.id === song.id ? '#FF4DA6' : '#ffffff22'}`,
                background: selectedSong?.id === song.id ? '#FF4DA622' : 'transparent',
                color: selectedSong?.id === song.id ? '#FF4DA6' : '#ffffff88',
                fontSize: 12,
                fontFamily: 'Heebo, sans-serif',
                fontWeight: selectedSong?.id === song.id ? 700 : 400,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span>{song.title}</span>
              <span style={{
                fontSize: 9,
                color: DIFFICULTY_COLOR[song.difficulty],
                fontWeight: 700,
              }}>
                {DIFFICULTY_LABEL[song.difficulty]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Split screen — instrument columns */}
      <div style={{ flex: 1, display: 'flex', gap: 6, padding: '10px 10px 0', overflowY: 'auto' }}>
        {displayDevices.map(device => (
          <InstrumentColumn
            key={device.id}
            device={device}
            song={selectedSong}
            currentBeat={currentBeat}
            isPlaying={isPlaying}
            hit={!!hitMap[device.id]}
          />
        ))}
      </div>

      {/* Bottom controls */}
      <div style={{
        padding: '12px 16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: '#1a1830',
        borderTop: '1px solid #ffffff12',
      }}>

        {/* Save message */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center', fontSize: 13, color: '#22c55e',
                background: '#22c55e22', padding: '8px 16px', borderRadius: 12,
                border: '1px solid #22c55e44',
              }}
            >
              {saveMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play / Record row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Play/Stop */}
          <button
            onClick={isPlaying ? stopPlayback : startPlayback}
            disabled={!selectedSong}
            style={{
              flex: 1, padding: '12px', borderRadius: 14,
              background: isPlaying ? '#ffffff18' : '#6366f1',
              color: 'white', border: 'none',
              fontSize: 14, fontWeight: 700, fontFamily: 'Heebo, sans-serif',
              cursor: selectedSong ? 'pointer' : 'not-allowed', opacity: selectedSong ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isPlaying ? '⏹ עצור' : '▶ התחל'}
          </button>

          {/* Record */}
          <button
            onClick={toggleRecording}
            disabled={!selectedSong}
            style={{
              flex: 1, padding: '12px', borderRadius: 14,
              background: isRecording ? '#ef4444' : '#ef444422',
              color: isRecording ? 'white' : '#ef4444',
              border: `1.5px solid #ef4444`,
              fontSize: 14, fontWeight: 700, fontFamily: 'Heebo, sans-serif',
              cursor: selectedSong ? 'pointer' : 'not-allowed', opacity: selectedSong ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              animation: isRecording ? 'recpulse 1s ease-in-out infinite' : 'none',
            }}
          >
            {isRecording ? '⏹ עצור הקלטה' : '⏺ הקלטה'}
          </button>

          {/* Reset */}
          <button
            onClick={() => { stopPlayback(); setCurrentBeat(-1); setRecordedEvents([]) }}
            style={{
              padding: '12px 14px', borderRadius: 14,
              background: 'transparent', color: '#ffffff55',
              border: '1px solid #ffffff18',
              fontSize: 18, cursor: 'pointer',
            }}
          >
            ↺
          </button>
        </div>

        {/* Beat indicator strip */}
        {selectedSong && (
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {selectedSong.pattern.map((color, i) => {
              const cfg = COLOR_CONFIG[color]
              return (
                <div key={i} style={{
                  width: 28, height: 8, borderRadius: 4,
                  background: currentBeat === i ? cfg.flash : cfg.bg,
                  border: `1px solid ${currentBeat === i ? cfg.border : '#ffffff15'}`,
                  transition: 'background 0.1s',
                }} />
              )
            })}
          </div>
        )}

        {/* Recorded events count */}
        {recordedEvents.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#ffffff44' }}>
            {recordedEvents.length} אירועים מוקלטים
          </div>
        )}
      </div>

      <style>{`
        @keyframes recpulse {
          0%,100% { box-shadow: 0 0 0 0 #ef444455; }
          50%      { box-shadow: 0 0 0 8px #ef444400; }
        }
      `}</style>
    </div>
  )
}
