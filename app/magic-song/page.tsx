'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Btn }           from '@/components/ui/Btn'
import { WaveBar }       from '@/components/ui/WaveBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'

/* ── Templates & helpers ────────────────────────── */
const TEMPLATES = [
  { words: ['גשם', 'שמש', 'קשת'],       color: BRAND.cyan  },
  { words: ['כלב', 'חתול', 'חבר'],       color: BRAND.green },
  { words: ['גיטרה', 'ריקוד', 'שמחה'],  color: BRAND.pink  },
]
const LABELS = ['מילה ראשונה 🌟', 'מילה שנייה 🎸', 'מילה שלישית 🌈']
const HINTS  = ['גשם...', 'שמחה...', 'כוכב...']

const buildSong = (w: string[]) => [
  `יש לנו ${w[0]} יפה ומיוחד, 🌟`,
  `עם ${w[1]} הכל הופך לשמחה, 🎉`,
  `ביחד נשיר על ${w[2]} שלנו, 🎶`,
  `הביט של הגן — זה אנחנו! 💖`,
]

/* ── Sparkle helpers ────────────────────────────── */
const SPARK_EMOJIS = ['✨', '🌟', '⭐', '🎵', '🎶', '💫']
const makeSparkles = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i,
    emoji: SPARK_EMOJIS[Math.floor(Math.random() * SPARK_EMOJIS.length)],
    x: 5 + Math.random() * 90,   // % of container width
    size: 14 + Math.random() * 14,
    delay: i * 0.07,
  }))

/* ── Component ─────────────────────────────────── */
export default function MagicSongPage() {
  const [words,    setWords]    = useState(['', '', ''])
  const [loading,  setLoading]  = useState(false)
  const [song,     setSong]     = useState<string[] | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [sparks,   setSparks]   = useState<ReturnType<typeof makeSparkles>>([])
  const [focused,  setFocused]  = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const allFilled = words.every(w => w.trim())

  const setWord = (i: number, val: string) => {
    const n = [...words]; n[i] = val; setWords(n); setSong(null)
  }

  const generate = () => {
    if (!allFilled) return
    setLoading(true); setSong(null); setSaved(false); setCopied(false)
    setTimeout(() => {
      setLoading(false)
      setSong(buildSong(words))
      setSparks(makeSparkles())
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }, 1900)
  }

  const copyLyrics = () => {
    if (!song) return
    navigator.clipboard.writeText(song.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <AppShell bg="#fffbeb">
      <BackHeader title="שיר הקסם ⭐" bg={BRAND.orange} />

      <div className="p-4 space-y-3">

        {/* ── Hero ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card style={{
            background: `linear-gradient(135deg,${BRAND.yellow}44,${BRAND.orange}22)`,
            textAlign: 'center', padding: '20px 16px',
          }}>
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 48, marginBottom: 8 }}
            >
              ✨🎵✨
            </motion.div>
            <div className="font-black" style={{ fontSize: 18, color: BRAND.navy }}>יוצרים שיר ביחד!</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
              הכניסו 3 מילים ואנחנו ניצור שיר קסום
            </div>
          </Card>
        </motion.div>

        {/* ── Word inputs ────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SectionHeader title="בחרו את המילים שלכם:" />

            {words.map((w, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                <motion.label
                  style={{
                    display: 'block', fontSize: 12, fontWeight: 700,
                    color: focused === i ? BRAND.orange : '#9ca3af',
                    marginBottom: 6, transition: 'color 0.2s',
                  }}
                >
                  {LABELS[i]}
                </motion.label>

                <div style={{ position: 'relative' }}>
                  <input
                    value={w}
                    onChange={e => setWord(i, e.target.value)}
                    onFocus={() => setFocused(i)}
                    onBlur={() => setFocused(null)}
                    placeholder={HINTS[i]}
                    style={{
                      width: '100%', padding: '13px 14px', borderRadius: 13,
                      border: `2.5px solid ${focused === i ? BRAND.orange : w ? `${BRAND.orange}66` : '#e5e7eb'}`,
                      fontSize: 17, fontFamily: 'inherit', outline: 'none',
                      background: w ? `${BRAND.yellow}22` : focused === i ? '#fffbeb' : 'white',
                      fontWeight: 700, transition: 'all 0.2s', direction: 'rtl',
                      boxSizing: 'border-box',
                    }}
                  />
                  {w && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 22, height: 22, borderRadius: '50%',
                        background: BRAND.green, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 12, fontWeight: 900,
                      }}
                    >✓</motion.div>
                  )}
                </div>
              </div>
            ))}

            {/* Templates */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 8 }}>
                דוגמאות מהירות:
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {TEMPLATES.map((t, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.93 }}
                    onClick={() => { setWords(t.words); setSong(null) }}
                    style={{
                      background: `${t.color}22`, border: `1.5px solid ${t.color}44`,
                      borderRadius: 10, padding: '5px 12px', fontSize: 13,
                      color: t.color, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                    {t.words.join(' · ')}
                  </motion.button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Generate button ─────────────────── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <motion.div whileTap={allFilled && !loading ? { scale: 0.97 } : {}}>
            <Btn full onClick={generate} disabled={!allFilled || loading}
              bg={allFilled ? `linear-gradient(135deg,${BRAND.yellow},${BRAND.orange})` : '#e5e7eb'}
              style={{
                padding: '16px', fontSize: 18, borderRadius: 16,
                color: allFilled ? BRAND.navy : '#9ca3af',
                boxShadow: allFilled ? `0 8px 24px ${BRAND.orange}55` : 'none',
                transition: 'all 0.25s',
              }}>
              {loading ? '✨ יוצר את השיר...' : '🎵 צור שיר קסם!'}
            </Btn>
          </motion.div>
        </motion.div>

        {/* ── Loading ─────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 40, display: 'inline-block' }}>🎵</motion.div>
              <div style={{ color: BRAND.orange, fontWeight: 700, marginTop: 10, fontSize: 15 }}>
                השיר בדרך...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Song result ─────────────────────── */}
        <AnimatePresence>
          {song && !loading && (
            <motion.div ref={resultRef}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} style={{ position: 'relative' }}>

              {/* Sparkles */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
                {sparks.map(s => (
                  <motion.div key={s.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -80 }}
                    transition={{ duration: 1.4, delay: s.delay, ease: 'easeOut' }}
                    style={{ position: 'absolute', left: `${s.x}%`, bottom: '20%',
                      fontSize: s.size, pointerEvents: 'none' }}>
                    {s.emoji}
                  </motion.div>
                ))}
              </div>

              <Card style={{ background: `linear-gradient(135deg,${BRAND.navy},#312e81)` }}>
                {/* Waveform header */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <WaveBar active count={16} height={26} />
                </div>

                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ color: BRAND.yellow, fontWeight: 900, fontSize: 15 }}>✨ השיר שלכם ✨</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>
                    {words.join(' · ')}
                  </div>
                </div>

                {/* Lyrics */}
                {song.map((line, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.14, type: 'spring', stiffness: 200 }}
                    style={{
                      color: 'white', fontWeight: 700, fontSize: 16,
                      padding: '9px 0',
                      borderBottom: i < song.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}>
                    {line}
                  </motion.div>
                ))}

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                  <Btn bg={saved ? BRAND.green : BRAND.pink} onClick={() => setSaved(true)}
                    style={{ fontSize: 14, padding: '11px 8px' }}>
                    {saved ? '✓ נשמר' : '💾 שמור'}
                  </Btn>
                  <Btn bg={copied ? BRAND.green : BRAND.purple} onClick={copyLyrics}
                    style={{ fontSize: 14, padding: '11px 8px' }}>
                    {copied ? '✓ הועתק' : '📋 העתק'}
                  </Btn>
                  <Btn bg={BRAND.cyan}   style={{ fontSize: 14, padding: '11px 8px' }}>🎤 הקלט</Btn>
                  <Btn bg={BRAND.orange} style={{ fontSize: 14, padding: '11px 8px' }}>🔊 השמע</Btn>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  )
}
