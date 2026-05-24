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

const STATIONS = [
  { id: 0, name: 'תחנת הופעה',   emoji: '🎸', color: BRAND.pink,   kids: 6  },
  { id: 1, name: 'רצפת הקצב',    emoji: '🎹', color: BRAND.yellow, kids: 8  },
  { id: 2, name: 'עמדת שירה',    emoji: '🎧', color: BRAND.cyan,   kids: 0  },
  { id: 3, name: 'תחנות טאבלט',  emoji: '📱', color: BRAND.purple, kids: 10 },
]

const COUNTDOWN = 600
const fmt       = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function BeatManagerPage() {
  const [countdown, setCountdown] = useState(COUNTDOWN)
  const [elapsed,   setElapsed]   = useState(0)
  const [running,   setRunning]   = useState(false)
  const [idx,       setIdx]       = useState(0)
  const [songs,     setSongs]     = useState(3)
  const [log,       setLog]       = useState([
    '10:00 — נפתחה פעילות הביט 🎵',
    '09:55 — כל הילדים בתחנות ✅',
  ])

  /* ── Timers ─────────────────────────────── */
  useEffect(() => {
    if (!running) return
    const down = setInterval(() => setCountdown(s => (s > 0 ? s - 1 : 0)), 1000)
    const up   = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(down); clearInterval(up) }
  }, [running])

  /* ── Switch station ─────────────────────── */
  const switchStation = useCallback(() => {
    const next = (idx + 1) % STATIONS.length
    setIdx(next)
    setSongs(s => s + 1)
    const t = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    setLog(l => [
      `${t} — מעבר ל${STATIONS[next].name} ${STATIONS[next].emoji}`,
      ...l.slice(0, 6),
    ])
  }, [idx])

  const reset = () => { setCountdown(COUNTDOWN); setElapsed(0); setRunning(false) }

  const pct    = countdown / COUNTDOWN
  const R      = 58
  const circ   = 2 * Math.PI * R
  const active = STATIONS[idx]

  return (
    <AppShell bg="#f0f9ff">
      <BackHeader title="מנהל הביט 🎛️" bg={BRAND.cyan} />

      <div className="p-4 space-y-3">

        {/* ── Session overview ───────────────── */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <StatBadge value={24}        label="ילדים"    emoji="👧" color={BRAND.pink}   />
          <StatBadge value={songs}     label="שירים"    emoji="🎵" color={BRAND.yellow} />
          <StatBadge value={fmt(elapsed)} label="עברו" emoji="⏱"  color={BRAND.cyan}   />
        </motion.div>

        {/* ── Countdown timer ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card style={{ background: `linear-gradient(135deg,${BRAND.navy},#312e81)` }} className="text-center py-6">

            {/* Glow when running */}
            <AnimatePresence>
              {running && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
                    boxShadow: `inset 0 0 60px ${BRAND.cyan}22, 0 0 40px ${BRAND.cyan}18`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Circular ring */}
            <div className="relative inline-flex items-center justify-center" style={{ width: 152, height: 152 }}>
              <svg width="152" height="152" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="76" cy="76" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                <circle cx="76" cy="76" r={R} fill="none"
                  stroke={running ? BRAND.cyan : 'rgba(255,255,255,0.3)'}
                  strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
                />
              </svg>
              <div className="relative">
                <div
                  className="font-black text-white"
                  style={{ fontSize: 38, letterSpacing: 3, lineHeight: 1,
                    animation: running ? 'pulseSoft 2s ease-in-out infinite' : 'none' }}
                >
                  {fmt(countdown)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
                  {running ? 'פועל' : 'מושהה'}
                </div>
              </div>
            </div>

            {/* Waveform */}
            <div className="flex justify-center mt-3 mb-5">
              <WaveBar active={running} count={14} color={running ? BRAND.cyan : undefined} height={22} />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <Btn bg={running ? '#ef4444' : BRAND.green} onClick={() => setRunning(r => !r)}
                style={{ minWidth: 136, fontSize: 16, padding: '12px 24px' }}>
                {running ? '⏸ עצור' : '▶ התחל'}
              </Btn>
              <button onClick={reset}
                style={{ width: 46, height: 46, background: 'rgba(255,255,255,0.13)',
                  border: 'none', borderRadius: 14, color: 'white', fontSize: 20, cursor: 'pointer' }}>
                ↺
              </button>
            </div>
          </Card>
        </motion.div>

        {/* ── Active station ──────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card style={{ background: `${active.color}1a`, border: `2px solid ${active.color}44` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 7 }}>
              תחנה פעילה כעת
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-3 mb-3"
              >
                <motion.span
                  style={{ fontSize: 38 }}
                  initial={{ scale: 0.7, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {active.emoji}
                </motion.span>
                <div className="flex-1">
                  <div className="font-black" style={{ fontSize: 20, color: active.color }}>{active.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{active.kids} ילדים</div>
                </div>
                <Pill color={active.color}>פעילה ✓</Pill>
              </motion.div>
            </AnimatePresence>
            <Btn bg={active.color} full onClick={switchStation} style={{ fontSize: 16, padding: '13px' }}>
              🔄 החלף תחנה
            </Btn>
          </Card>
        </motion.div>

        {/* ── Station grid ────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <SectionHeader title="כל התחנות" emoji="📍" />
          <div className="grid grid-cols-2 gap-3">
            {STATIONS.map((s, i) => (
              <motion.div key={s.id} whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setIdx(i)
                  const t = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                  setLog(l => [`${t} — מעבר ל${s.name} ${s.emoji}`, ...l.slice(0, 6)])
                }}>
                <Card style={{
                  padding: 13, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${i === idx ? s.color : 'transparent'}`,
                  background: i === idx ? `${s.color}1a` : 'white',
                  transition: 'all 0.2s',
                  boxShadow: i === idx ? `0 4px 20px ${s.color}33` : undefined,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{s.emoji}</div>
                  <div className="font-bold leading-snug" style={{ fontSize: 12, color: BRAND.navy }}>{s.name}</div>
                  <div style={{ marginTop: 8 }}>
                    <Pill color={i === idx ? s.color : '#9ca3af'}>
                      {i === idx ? 'פעילה ✓' : 'ממתינה'}
                    </Pill>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Activity log ────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card>
            <SectionHeader title="יומן פעילות" emoji="📋" />
            <AnimatePresence initial={false}>
              {log.map((entry, i) => (
                <motion.div key={entry + i}
                  initial={{ opacity: 0, height: 0, paddingBlock: 0 }}
                  animate={{ opacity: 1, height: 'auto', paddingBlock: 10 }}
                  exit={{ opacity: 0, height: 0, paddingBlock: 0 }}
                  style={{
                    fontSize: 13, color: '#374151', fontWeight: 500,
                    borderBottom: i < log.length - 1 ? '1px solid #f3f4f6' : 'none',
                    overflow: 'hidden',
                  }}
                >
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
