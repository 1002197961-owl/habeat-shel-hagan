'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Btn }           from '@/components/ui/Btn'
import { WaveBar }       from '@/components/ui/WaveBar'
import { BRAND }         from '@/lib/constants'

const QUESTIONS = [
  { q: 'על מה יהיה השיר?', emoji: '🎵', hint: 'בחרו נושא',
    opts: [{ l: 'חיות', e: '🦁' }, { l: 'טבע', e: '🌳' }, { l: 'חברות', e: '👫' }] },
  { q: 'מי הגיבור של השיר?', emoji: '⭐', hint: 'בחרו דמות',
    opts: [{ l: 'ילד קטן', e: '👦' }, { l: 'ילדה קטנה', e: '👧' }, { l: 'חיה חמודה', e: '🐰' }] },
  { q: 'איך הגיבור מרגיש?', emoji: '💫', hint: 'בחרו רגש',
    opts: [{ l: 'שמחה', e: '😊' }, { l: 'הפתעה', e: '😲' }, { l: 'אהבה', e: '💖' }] },
  { q: 'איפה מתרחש הסיפור?', emoji: '🗺️', hint: 'בחרו מקום',
    opts: [{ l: 'בגן ילדים', e: '🌿' }, { l: 'בים', e: '🌊' }, { l: 'ביער', e: '🌲' }] },
  { q: 'מה הגיבור עושה?', emoji: '🎬', hint: 'בחרו פעולה',
    opts: [{ l: 'שר', e: '🎤' }, { l: 'רוקד', e: '💃' }, { l: 'משחק', e: '🎮' }] },
  { q: 'איזה כלי נגינה מתאים?', emoji: '🎸', hint: 'בחרו כלי',
    opts: [{ l: 'גיטרה', e: '🎸' }, { l: 'תופים', e: '🥁' }, { l: 'פסנתר', e: '🎹' }] },
  { q: 'מה הקצב שמתאים?', emoji: '⚡', hint: 'בחרו קצב',
    opts: [{ l: 'מהיר', e: '⚡' }, { l: 'בינוני', e: '🎵' }, { l: 'איטי', e: '🌙' }] },
  { q: 'מה קורה בסוף השיר?', emoji: '🎉', hint: 'בחרו סיום',
    opts: [{ l: 'חגיגה', e: '🎉' }, { l: 'חיבוק', e: '🤗' }, { l: 'שקיעה', e: '🌅' }] },
  { q: 'מה המסר של השיר?', emoji: '🌟', hint: 'בחרו מסר',
    opts: [{ l: 'להיות חברים', e: '🤝' }, { l: 'לאהוב טבע', e: '🌱' }, { l: 'ליהנות', e: '🌈' }] },
  { q: 'הוסיפו מילה קסומה', emoji: '✨', hint: 'מילה אחת שמרגישה נכון',
    opts: [], freeText: true },
]

const buildSong = (answers: Record<number, string>) => {
  const theme  = answers[0] || 'טבע'
  const hero   = answers[1] || 'ילד קטן'
  const feel   = answers[2] || 'שמחה'
  const place  = answers[3] || 'בגן'
  const action = answers[4] || 'שר'
  const magic  = answers[9] || 'קסם'
  return [
    `${hero} יוצא לחפש ${theme}, 🌟`,
    `${feel} מלאה בלב כשהוא ${action}, 💫`,
    `ב${place} הקסום "${magic}" ממלא הכל, ✨`,
    `זה השיר שלנו — הביט של הגן! 🎉`,
  ]
}

type FlowStep = 'questions' | 'generating' | 'result'

export default function MagicSongPage() {
  const [flowStep, setFlowStep] = useState<FlowStep>('questions')
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [freeText, setFreeText] = useState('')
  const [showTeacher, setShowTeacher] = useState(false)
  const [teacherNotes, setTeacherNotes] = useState<Record<number, string>>({})
  const [song, setSong] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const q = QUESTIONS[qIdx]
  const totalQ = QUESTIONS.length
  const progress = (qIdx / totalQ) * 100

  const selectAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }))
    if (qIdx < totalQ - 1) setTimeout(() => setQIdx(i => i + 1), 280)
  }

  const submitFree = () => {
    const val = freeText.trim() || 'קסם'
    setAnswers(prev => ({ ...prev, [qIdx]: val }))
    if (qIdx < totalQ - 1) setQIdx(i => i + 1)
    setFreeText('')
  }

  const generate = () => {
    setFlowStep('generating')
    setTimeout(() => { setSong(buildSong(answers)); setFlowStep('result') }, 2200)
  }

  const reset = () => {
    setQIdx(0); setAnswers({}); setFreeText(''); setSong([])
    setSaved(false); setShowTeacher(false); setTeacherNotes({})
    setFlowStep('questions')
  }

  if (flowStep === 'generating') {
    return (
      <AppShell bg="#fffbeb">
        <BackHeader title="שיר הקסם ⭐" bg={BRAND.orange} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 64 }}>✨</motion.div>
          <div className="font-black" style={{ fontSize: 22, color: BRAND.navy }}>יוצר שיר קסום...</div>
          <WaveBar active count={16} height={28} />
          <div style={{ color: '#9ca3af', fontSize: 14 }}>מעבד את התשובות שלכם</div>
        </div>
      </AppShell>
    )
  }

  if (flowStep === 'result') {
    return (
      <AppShell bg="#fffbeb">
        <BackHeader title="השיר שלכם! 🎵" bg={BRAND.orange} />
        <div className="p-4 space-y-3">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <Card style={{ background: `linear-gradient(135deg,${BRAND.navy},#312e81)` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <WaveBar active count={18} height={28} />
              </div>
              <div style={{ textAlign: 'center', color: BRAND.yellow, fontWeight: 900, fontSize: 16, marginBottom: 14 }}>✨ השיר שלכם ✨</div>
              {song.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.16, type: 'spring', stiffness: 180 }}
                  style={{ color: 'white', fontWeight: 700, fontSize: 16, padding: '9px 0',
                    borderBottom: i < song.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  {line}
                </motion.div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                <Btn bg={saved ? BRAND.green : BRAND.pink} onClick={() => setSaved(true)} style={{ fontSize: 14, padding: '11px' }}>{saved ? '✓ נשמר' : '💾 שמור'}</Btn>
                <Btn bg={BRAND.cyan} style={{ fontSize: 14, padding: '11px' }}>🎤 הקלט</Btn>
                <Btn bg={BRAND.purple} style={{ fontSize: 14, padding: '11px' }}>📋 העתק</Btn>
                <Btn bg={BRAND.orange} style={{ fontSize: 14, padding: '11px' }}>🔊 השמע</Btn>
              </div>
            </Card>
          </motion.div>
          <Card>
            <div className="font-black" style={{ fontSize: 14, color: BRAND.navy, marginBottom: 10 }}>📝 בחירות שלכם</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(answers).map(([idx, val]) => (
                <span key={idx} style={{ background: `${BRAND.yellow}22`, border: `1.5px solid ${BRAND.yellow}55`,
                  borderRadius: 10, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: BRAND.navy }}>{val}</span>
              ))}
            </div>
          </Card>
          <Btn full bg="#f3f4f6" onClick={reset} style={{ color: '#6b7280', padding: '13px', fontSize: 15 }}>🔄 צרו שיר חדש</Btn>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell bg="#fffbeb">
      <BackHeader title="שיר הקסם ⭐" bg={BRAND.orange} />
      <div className="p-4 space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>שאלה {qIdx + 1} מתוך {totalQ}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: BRAND.orange }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 7, background: '#f3e9d2', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${BRAND.yellow},${BRAND.orange})` }} />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={qIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <Card style={{ textAlign: 'center', padding: '22px 18px', background: `linear-gradient(135deg,${BRAND.yellow}33,${BRAND.orange}18)` }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 52, marginBottom: 10 }}>{q.emoji}</motion.div>
              <div className="font-black" style={{ fontSize: 20, color: BRAND.navy, marginBottom: 4 }}>{q.q}</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{q.hint}</div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={qIdx + '-opts'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
            {q.freeText ? (
              <Card>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>כתבו מילה קסומה לשיר:</div>
                <input value={freeText} onChange={e => setFreeText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && freeText.trim() && submitFree()}
                  placeholder="לדוגמה: שמיים, ניצוץ, ריחוף..." autoFocus
                  style={{ width: '100%', padding: '14px', borderRadius: 13, direction: 'rtl',
                    border: `2px solid ${freeText ? BRAND.orange : '#e5e7eb'}`, fontSize: 18,
                    fontFamily: 'inherit', fontWeight: 700, outline: 'none',
                    background: freeText ? `${BRAND.yellow}18` : 'white',
                    boxSizing: 'border-box', marginBottom: 12, transition: 'border 0.2s' }} />
                <Btn full bg={freeText.trim() ? `linear-gradient(135deg,${BRAND.yellow},${BRAND.orange})` : '#e5e7eb'}
                  onClick={submitFree} disabled={!freeText.trim()}
                  style={{ padding: '13px', fontSize: 16, color: freeText.trim() ? BRAND.navy : '#9ca3af' }}>✓ אישור</Btn>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.opts.map((opt, i) => {
                  const isSelected = answers[qIdx] === opt.l
                  const colors = [BRAND.pink, BRAND.cyan, BRAND.green]
                  const c = colors[i]
                  return (
                    <motion.div key={opt.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }} whileTap={{ scale: 0.97 }} onClick={() => selectAnswer(opt.l)}>
                      <Card style={{ cursor: 'pointer', background: isSelected ? `${c}22` : 'white',
                        border: `2.5px solid ${isSelected ? c : '#e5e7eb'}`,
                        boxShadow: isSelected ? `0 4px 20px ${c}33` : undefined,
                        transition: 'all 0.18s', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <motion.span style={{ fontSize: 40 }} animate={isSelected ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>{opt.e}</motion.span>
                        <span className="font-black" style={{ fontSize: 18, color: isSelected ? c : BRAND.navy }}>{opt.l}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ marginRight: 'auto', width: 26, height: 26, borderRadius: '50%',
                              background: c, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 14, fontWeight: 900 }}>✓</motion.div>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setShowTeacher(t => !t)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.orange, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
            {showTeacher ? '▲ הסתר הערות גננת' : '✏️ הוסיפי הערת גננת (אופציונלי)'}
          </button>
        </div>
        <AnimatePresence>
          {showTeacher && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <textarea value={teacherNotes[qIdx] ?? ''} onChange={e => setTeacherNotes(n => ({ ...n, [qIdx]: e.target.value }))}
                placeholder="הערות חופשיות של הגננת לשאלה זו..." rows={2}
                style={{ width: '100%', padding: '12px', borderRadius: 12, direction: 'rtl',
                  border: `2px solid ${BRAND.orange}44`, fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', resize: 'none', boxSizing: 'border-box', background: `${BRAND.yellow}11` }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: 10 }}>
          {qIdx > 0 && (
            <Btn bg="#f3f4f6" onClick={() => setQIdx(i => i - 1)} style={{ color: '#6b7280', padding: '11px 20px', fontSize: 14 }}>← אחורה</Btn>
          )}
          <div style={{ flex: 1 }} />
          {qIdx === totalQ - 1 && (answers[qIdx] || (q.freeText && freeText)) && (
            <Btn bg={`linear-gradient(135deg,${BRAND.yellow},${BRAND.orange})`}
              onClick={() => { if (q.freeText && freeText.trim()) submitFree(); setTimeout(generate, 100) }}
              style={{ color: BRAND.navy, padding: '11px 20px', fontSize: 15, fontWeight: 900 }}>✨ צרי שיר!</Btn>
          )}
        </div>
      </div>
    </AppShell>
  )
}