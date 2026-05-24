'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Pill }          from '@/components/ui/Pill'
import { Btn }           from '@/components/ui/Btn'
import { WaveBar }       from '@/components/ui/WaveBar'
import { StatBadge }     from '@/components/ui/StatBadge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'
import { MOCK_SONGS, PILOT_STATIONS } from '@/lib/mockData'

type Step = 'practice' | 'song-select' | 'instrument-select'

const ALL_INSTRUMENTS = [
  { id: 'guitar',  label: 'גיטרה',   emoji: '🎸' },
  { id: 'piano',   label: 'פסנתר',   emoji: '🎹' },
  { id: 'drums',   label: 'תופים',   emoji: '🥁' },
  { id: 'voice',   label: 'שירה',    emoji: '🎤' },
  { id: 'dj',      label: 'DJ',      emoji: '🎚️' },
  { id: 'organ',   label: 'אורגנית', emoji: '🎼' },
]

const STATION_NAMES = PILOT_STATIONS.map(s => s.name)
const DEFAULT_SECS  = 600
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

export default function BeatManagerPage() {
  const [step,       setStep]       = useState<Step>('practice')
  const [songId,     setSongId]     = useState<number>(1)
  const [instruments,setInstr]      = useState<string[]>(['guitar','voice'])
  const [stationIdx, setStation]    = useState(0)
  const [countdown,  setCountdown]  = useState(DEFAULT_SECS)
  const [elapsed,    setElapsed]    = useState(0)
  const [running,    setRunning]    = useState(false)
  const [songs,      setSongsCount] = useState(3)
  const [log,        setLog]        = useState([
    '10:00 — נפתחה פעילות הביט 🎵',
    '09:55 — כל הילדים בתחנות ✅',
  ])

  useEffect(() => {
    if (!running) return
    const d = setInterval(() => setCountdown(s => s > 0 ? s - 1 : 0), 1000)
    const u = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(d); clearInterval(u) }
  }, [running])

  const switchStation = useCallback(() => {
    const next = (stationIdx + 1) % STATION_NAMES.length
    setStation(next)
    setSongsCount(s => s + 1)
    const t = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    setLog(l => [`${t} — מעבר ל${STATION_NAMES[next]}`, ...l.slice(0, 6)])
  }, [stationIdx])

  const activeSong    = MOCK_SONGS.find(s => s.id === songId) ?? MOCK_SONGS[0]
  const pct           = countdown / DEFAULT_SECS
  const R             = 58
  const circ          = 2 * Math.PI * R
  const activeStation = PILOT_STATIONS[stationIdx % PILOT_STATIONS.length]

  if (step === 'song-select') {
    return (
      <AppShell bg="#f0f9ff">
        <BackHeader title="בחירת שיר 🎵" bg={BRAND.cyan} backHref="#" />
        <div className="p-4 space-y-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>בחרי שיר לפעילות היום:</div>
            {MOCK_SONGS.map((song, i) => (
              <motion.div key={song.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }} whileTap={{ scale: 0.97 }}>
                <Card style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  border: `2px solid ${songId === song.id ? song.color : 'transparent'}`,
                  background: songId === song.id ? `${song.color}12` : 'white', transition: 'all 0.2s' }}
                  onClick={() => { setSongId(song.id); setStep('instrument-select') }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, fontSize: 26,
                    background: `${song.color}22`, border: `2px solid ${song.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{song.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div className="font-black" style={{ fontSize: 15, color: BRAND.navy }}>{song.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{song.artist} · {song.duration}</div>
                  </div>
                  {songId === song.id && <Pill color={song.color}>✓</Pill>}
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <Btn bg="#e5e7eb" full onClick={() => setStep('practice')} style={{ color: '#6b7280', padding: '13px', fontSize: 15 }}>← חזרה</Btn>
        </div>
      </AppShell>
    )
  }

  if (step === 'instrument-select') {
    const toggle = (id: string) =>
      setInstr(arr => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
    return (
      <AppShell bg="#f0f9ff">
        <BackHeader title="בחירת כלים 🎸" bg={BRAND.cyan} backHref="#" />
        <div className="p-4 space-y-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ background: `${activeSong.color}14`, border: `2px solid ${activeSong.color}33`,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{activeSong.emoji}</span>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>שיר שנבחר</div>
                <div className="font-black" style={{ fontSize: 15, color: BRAND.navy }}>{activeSong.title}</div>
              </div>
              <button onClick={() => setStep('song-select')} style={{ marginRight: 'auto', background: 'none',
                border: 'none', cursor: 'pointer', color: BRAND.cyan, fontWeight: 700, fontSize: 13 }}>שנה</button>
            </Card>
            <SectionHeader title="בחרי כלי נגינה לפעילות:" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {ALL_INSTRUMENTS.map(ins => {
                const on = instruments.includes(ins.id)
                return (
                  <motion.div key={ins.id} whileTap={{ scale: 0.93 }} onClick={() => toggle(ins.id)}
                    style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 16, cursor: 'pointer',
                      background: on ? `${BRAND.cyan}1a` : '#f9fafb',
                      border: `2px solid ${on ? BRAND.cyan : '#e5e7eb'}`, transition: 'all 0.18s' }}>
                    <div style={{ fontSize: 28, marginBottom: 5 }}>{ins.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: on ? BRAND.cyan : '#6b7280' }}>{ins.label}</div>
                    {on && <div style={{ fontSize: 10, color: BRAND.green, fontWeight: 700, marginTop: 3 }}>✓ נבחר</div>}
                  </motion.div>
                )
              })}
            </div>
            <Btn full bg={`linear-gradient(135deg,${BRAND.cyan},#0096c7)`}
              onClick={() => {
                const t = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                setLog(l => [`${t} — התחיל תרגול: ${activeSong.title} 🎵`, ...l.slice(0, 6)])
                setStep('practice')
              }} style={{ padding: '15px', fontSize: 17, borderRadius: 16 }}>
              ▶ המשך לתרגול!
            </Btn>
            <Btn bg="#e5e7eb" full onClick={() => setStep('song-select')}
              style={{ color: '#6b7280', padding: '11px', fontSize: 14, marginTop: 8 }}>← חזרה לבחירת שיר</Btn>
          </motion.div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell bg="#f0f9ff">
      <BackHeader title="מנהל הביט 🎛️" bg={BRAND.cyan} />
      <div className="p-4 space-y-3">
        <motion.div className="flex gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <StatBadge value={24} label="ילדים" emoji="👧" color={BRAND.pink} />
          <StatBadge value={songs} label="שירים" emoji="🎵" color={BRAND.yellow} />
          <StatBadge value={fmt(elapsed)} label="עברו" emoji="⏱" color={BRAND.cyan} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card style={{ background: `${activeSong.color}12`, border: `2px solid ${activeSong.color}30`,
            display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{activeSong.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>שיר פעיל</div>
              <div className="font-black" style={{ fontSize: 15, color: BRAND.navy }}>{activeSong.title}</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                {instruments.map(id => { const ins = ALL_INSTRUMENTS.find(x => x.id === id); return ins ? <span key={id} style={{ fontSize: 14 }}>{ins.emoji}</span> : null })}
              </div>
            </div>
            <button onClick={() => setStep('song-select')} style={{ background: BRAND.cyan, border: 'none',
              borderRadius: 10, padding: '6px 12px', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>שנה</button>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card style={{ background: `linear-gradient(135deg,${BRAND.navy},#312e81)` }} className="text-center py-5">
            <AnimatePresence>
              {running && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
                    boxShadow: `inset 0 0 60px ${BRAND.cyan}22, 0 0 40px ${BRAND.cyan}18` }} />
              )}
            </AnimatePresence>
            <div className="relative inline-flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg width="140" height="140" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                <circle cx="70" cy="70" r={R} fill="none" stroke={running ? BRAND.cyan : 'rgba(255,255,255,0.25)'}
                  strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }} />
              </svg>
              <div>
                <div className="font-black text-white" style={{ fontSize: 36, letterSpacing: 3, lineHeight: 1 }}>{fmt(countdown)}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginTop: 3, textAlign: 'center' }}>{running ? 'פועל' : 'מושהה'}</div>
              </div>
            </div>
            <div className="flex justify-center mt-2 mb-4">
              <WaveBar active={running} count={12} color={running ? BRAND.cyan : undefined} height={20} />
            </div>
            <div className="flex justify-center gap-3">
              <Btn bg={running ? '#ef4444' : BRAND.green} onClick={() => setRunning(r => !r)}
                style={{ minWidth: 130, fontSize: 16, padding: '11px 22px' }}>
                {running ? '⏸ עצור' : '▶ התחל'}
              </Btn>
              <button onClick={() => { setCountdown(DEFAULT_SECS); setElapsed(0); setRunning(false) }}
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.13)', border: 'none',
                  borderRadius: 13, color: 'white', fontSize: 20, cursor: 'pointer' }}>↺</button>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card style={{ background: `${activeStation.color}1a`, border: `2px solid ${activeStation.color}44` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 7 }}>תחנה פעילה</div>
            <AnimatePresence mode="wait">
              <motion.div key={stationIdx} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 mb-3">
                <motion.span style={{ fontSize: 36 }} initial={{ scale: 0.7 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}>{activeStation.emoji}</motion.span>
                <div className="flex-1">
                  <div className="font-black" style={{ fontSize: 18, color: activeStation.color }}>{activeStation.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{activeStation.kidsNow} ילדים</div>
                </div>
                <Pill color={activeStation.color}>פעילה ✓</Pill>
              </motion.div>
            </AnimatePresence>
            <Btn bg={activeStation.color} full onClick={switchStation} style={{ fontSize: 15, padding: '12px' }}>🔄 החלף תחנה</Btn>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card>
            <SectionHeader title="יומן פעילות" emoji="📋" />
            <AnimatePresence initial={false}>
              {log.map((entry, i) => (
                <motion.div key={entry + i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ fontSize: 13, color: '#374151', fontWeight: 500, overflow: 'hidden',
                    paddingBlock: 9, borderBottom: i < log.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  {entry}
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}