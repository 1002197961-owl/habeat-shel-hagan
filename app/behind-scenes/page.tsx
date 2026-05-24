'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Btn }           from '@/components/ui/Btn'
import { Pill }          from '@/components/ui/Pill'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'

const STAGES = [
  { id: 0, label: 'אקט א׳ — ההתחלה',  desc: 'הגיבור מגיע לגן ומכיר חברים חדשים', color: BRAND.cyan   },
  { id: 1, label: 'אקט ב׳ — ההרפתקה', desc: 'ביחד מוצאים את הגיטרה הקסומה בגינה', color: BRAND.orange },
  { id: 2, label: 'אקט ג׳ — הסיום',   desc: 'הצגה גדולה! כל הגן שר ורוקד ביחד 🎉', color: BRAND.green  },
]

const CHARS = ['🦊','🐰','🐻','🦁','🐸','🦋','🐼','🦄']
const BGS   = ['🌲','🏠','🌈','🎪','🏖️','🌙','🏔️','🌸']

const STEP_LABELS = ['בחרי דמות', 'בחרי רקע', 'בחרי שלב', 'יצרי קליפ']

export default function BehindScenesPage() {
  const [stage,   setStage]   = useState(0)
  const [char,    setChar]    = useState('🦊')
  const [bg,      setBg]      = useState('🌲')
  const [step,    setStep]    = useState(0)
  const [exporting, setExp]   = useState(false)
  const [done,    setDone]    = useState(false)

  const activeStage = STAGES[stage]

  const handleExport = () => {
    setExp(true)
    setTimeout(() => { setExp(false); setDone(true) }, 2200)
  }

  return (
    <AppShell bg="#f5f3ff">
      <BackHeader title="מאחורי הקלעים 🎬" bg={BRAND.purple} />
      <div className="p-4 space-y-3">

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                padding: '7px 4px', borderRadius: 10,
                background: i <= step ? `${BRAND.purple}22` : '#f3f4f6',
                border: `1.5px solid ${i <= step ? BRAND.purple : 'transparent'}`,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 800,
                  color: i <= step ? BRAND.purple : '#9ca3af',
                }}>
                  {i + 1}. {label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stage preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <Card style={{
            background: `linear-gradient(135deg, ${BRAND.navy}, #312e81)`,
            minHeight: 170,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', textAlign: 'center',
          }}>
            {/* Background emoji */}
            <div style={{
              position: 'absolute', fontSize: 100, opacity: 0.12,
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}>{bg}</div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={char + bg + stage}
                  initial={{ scale: 0.6, opacity: 0, y: 20 }}
                  animate={{ scale: 1,   opacity: 1, y: 0  }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <div style={{ fontSize: 64, marginBottom: 10,
                    filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))' }}>
                    {char}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 16, marginBottom: 4 }}>
                {activeStage.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, maxWidth: 260, margin: '0 auto' }}>
                {activeStage.desc}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Character picker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <SectionHeader title="בחרי דמות" emoji="🦊" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CHARS.map(c => (
                <motion.button key={c} whileTap={{ scale: 0.88 }}
                  onClick={() => { setChar(c); setStep(s => Math.max(s, 1)) }}
                  style={{
                    width: 52, height: 52, borderRadius: 14, fontSize: 26,
                    border: `2.5px solid ${char === c ? BRAND.purple : '#e5e7eb'}`,
                    background: char === c ? `${BRAND.purple}18` : 'white',
                    cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: char === c ? `0 2px 12px ${BRAND.purple}33` : 'none',
                  }}>
                  {c}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Background picker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card>
            <SectionHeader title="בחרי רקע" emoji="🎨" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BGS.map(b => (
                <motion.button key={b} whileTap={{ scale: 0.88 }}
                  onClick={() => { setBg(b); setStep(s => Math.max(s, 2)) }}
                  style={{
                    width: 52, height: 52, borderRadius: 14, fontSize: 26,
                    border: `2.5px solid ${bg === b ? BRAND.purple : '#e5e7eb'}`,
                    background: bg === b ? `${BRAND.purple}18` : 'white',
                    cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: bg === b ? `0 2px 12px ${BRAND.purple}33` : 'none',
                  }}>
                  {b}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Stage picker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card>
            <SectionHeader title="בחרי שלב בסיפור" emoji="📖" />
            {STAGES.map((s, i) => (
              <motion.div key={i} whileTap={{ scale: 0.98 }}
                onClick={() => { setStage(i); setStep(st => Math.max(st, 3)) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 14,
                  background: stage === i ? `${s.color}18` : '#fafafa',
                  border: `2px solid ${stage === i ? s.color : 'transparent'}`,
                  cursor: 'pointer', marginBottom: i < STAGES.length - 1 ? 8 : 0,
                  transition: 'all 0.2s',
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${s.color}22`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: s.color,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="font-black" style={{ fontSize: 14, color: BRAND.navy }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{s.desc}</div>
                </div>
                {stage === i && <Pill color={s.color}>✓</Pill>}
              </motion.div>
            ))}
          </Card>
        </motion.div>

        {/* Export button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          {done ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              style={{
                background: `linear-gradient(135deg, ${BRAND.green}, #15803d)`,
                borderRadius: 16, padding: '16px', textAlign: 'center',
              }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>הקליפ מוכן!</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                נשמר בספריית הקליפים שלך
              </div>
            </motion.div>
          ) : (
            <Btn full onClick={handleExport}
              bg={exporting
                ? `${BRAND.purple}88`
                : `linear-gradient(135deg, ${BRAND.purple}, #5b21b6)`}
              style={{
                padding: '16px', fontSize: 17, borderRadius: 16,
                boxShadow: `0 8px 24px ${BRAND.purple}55`,
              }}>
              {exporting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}>🎬</motion.span>
                  יוצר קליפ...
                </span>
              ) : '🎬 יצרי קליפ!'}
            </Btn>
          )}
        </motion.div>

      </div>
    </AppShell>
  )
}
