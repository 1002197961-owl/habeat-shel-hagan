'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Pill }          from '@/components/ui/Pill'
import { Btn }           from '@/components/ui/Btn'
import { WaveBar }       from '@/components/ui/WaveBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'
import { MOCK_CLIPS }    from '@/lib/mockData'

const MODES = [
  { id: 'song',  label: '🎵 שיר',  color: BRAND.pink   },
  { id: 'beat',  label: '🥁 ביט',  color: BRAND.orange },
  { id: 'free',  label: '🎙 חופשי', color: BRAND.purple },
]

const CLIP_NAMES = ['יצירה מיוחדת', 'ביט חדש', 'שיר שמח', 'קצב הגן', 'מנגינת הבוקר']

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function RecordingPage() {
  const [recording, setRecording] = useState(false)
  const [secs,      setSecs]      = useState(0)
  const [mode,      setMode]      = useState('song')
  const [clips,     setClips]     = useState(MOCK_CLIPS)
  const [playing,   setPlaying]   = useState<number | null>(null)

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  const stopAndSave = () => {
    setRecording(false)
    const name = CLIP_NAMES[clips.length % CLIP_NAMES.length]
    setClips(c => [
      { id: Date.now(), name, duration: fmt(secs), date: 'עכשיו', emoji: '🆕' },
      ...c,
    ])
    setSecs(0)
  }

  const activeMode = MODES.find(m => m.id === mode)!

  return (
    <AppShell bg="#fff8f0">
      <BackHeader title="הקלטה וצילום קליפ 🎤" bg={BRAND.orange} />
      <div className="p-4 space-y-3">

        {/* Mode selector */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {MODES.map(m => (
              <motion.button key={m.id} whileTap={{ scale: 0.94 }}
                onClick={() => !recording && setMode(m.id)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 12, border: 'none',
                  background: mode === m.id ? m.color : '#f3f4f6',
                  color: mode === m.id ? 'white' : '#6b7280',
                  fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                  cursor: recording ? 'not-allowed' : 'pointer',
                  opacity: recording && mode !== m.id ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}>
                {m.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recording studio */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card style={{
            background: recording
              ? 'linear-gradient(135deg, #1a0505, #2d0808)'
              : `linear-gradient(135deg, ${BRAND.navy}, #312e81)`,
            textAlign: 'center',
            padding: '28px 20px',
            transition: 'background 0.5s',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Pulsing background when recording */}
            <AnimatePresence>
              {recording && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)',
                    animation: 'pulseSoft 1.5s ease-in-out infinite',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Mode label */}
            <div style={{ marginBottom: 16 }}>
              <Pill color={recording ? '#ef4444' : activeMode.color}>
                {recording ? '● מקליט' : activeMode.label}
              </Pill>
            </div>

            {/* Waveform */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <WaveBar
                active={recording}
                count={20}
                color={recording ? '#ef4444' : 'rgba(255,255,255,0.3)'}
                height={48}
              />
            </div>

            {/* Timer */}
            <div style={{
              fontSize: 52, fontWeight: 900, letterSpacing: 4, lineHeight: 1,
              color: recording ? '#ef4444' : 'white',
              animation: recording ? 'blink 1s ease-in-out infinite' : 'none',
              marginBottom: 20,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(secs)}
            </div>

            {/* Record button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={recording ? stopAndSave : () => setRecording(true)}
              style={{
                width: 84, height: 84, borderRadius: '50%', border: 'none',
                background: recording ? '#ef4444' : activeMode.color,
                fontSize: 30, cursor: 'pointer',
                boxShadow: recording
                  ? '0 0 0 12px rgba(239,68,68,0.2), 0 0 0 26px rgba(239,68,68,0.08)'
                  : `0 8px 28px ${activeMode.color}88`,
                animation: recording ? 'pulseSoft 1.2s ease-in-out infinite' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            >
              {recording ? '⏹' : '🎤'}
            </motion.button>

            <div style={{
              marginTop: 12, fontSize: 13, fontWeight: 700,
              color: recording ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.45)',
            }}>
              {recording ? 'לחצי לעצירה ושמירה' : 'לחצי להקלטה'}
            </div>
          </Card>
        </motion.div>

        {/* Saved clips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card>
            <SectionHeader title="קליפים שמורים" emoji="📁"
              subtitle={`${clips.length} הקלטות`} />

            {clips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎙</div>
                <div style={{ fontWeight: 700 }}>עדיין אין הקלטות</div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {clips.map((clip, i) => (
                <motion.div key={clip.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    paddingBlock: 11,
                    borderBottom: i < clips.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}>
                    {/* Thumbnail */}
                    <motion.div whileTap={{ scale: 0.94 }}
                      onClick={() => setPlaying(playing === clip.id ? null : clip.id)}
                      style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                        background: `${BRAND.orange}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}>
                      {playing === clip.id
                        ? <WaveBar active count={4} color={BRAND.orange} height={20} />
                        : <span style={{ fontSize: 20 }}>{clip.emoji}</span>
                      }
                    </motion.div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-black" style={{ fontSize: 14, color: BRAND.navy }}>{clip.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {clip.date} · {clip.duration}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setPlaying(playing === clip.id ? null : clip.id)}
                        style={{
                          width: 34, height: 34, borderRadius: 9, border: 'none',
                          background: `${BRAND.cyan}22`, cursor: 'pointer', fontSize: 14,
                        }}>
                        {playing === clip.id ? '⏸' : '▶'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setClips(c => c.filter(x => x.id !== clip.id))}
                        style={{
                          width: 34, height: 34, borderRadius: 9, border: 'none',
                          background: '#fee2e2', cursor: 'pointer', fontSize: 14,
                        }}>
                        🗑
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>
        </motion.div>

      </div>
    </AppShell>
  )
}
