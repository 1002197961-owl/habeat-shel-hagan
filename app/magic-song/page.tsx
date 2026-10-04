'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Btn }           from '@/components/ui/Btn'
import { WaveBar }       from '@/components/ui/WaveBar'
import { BRAND }         from '@/lib/constants'
import { speakHebrew } from '@/lib/audio'
import Link from 'next/link'
import { useNarration } from '@/hooks/useNarration'
import { NarrationReader } from '@/components/audio/NarrationReader'
import { NARRATION } from '@/lib/narrationCatalog'
import { MagicSongPlayer, type MagicSongPlayerHandle } from '@/components/audio/MagicSongPlayer'
import { PilotIcon } from '@/components/ui/PilotIcon'

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
    `הלב מלא ${feel}, והגיבור שלנו ${action}, 💫`,
    `במקום שנקרא ${place}, המילה "${magic}" מוסיפה קסם, ✨`,
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
  const [notice, setNotice] = useState('')

  const narration = useNarration()
  const songPlayer = useRef<MagicSongPlayerHandle | null>(null)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generatingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedRef = useRef(false)
  const stopSpeech = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
  const clearTransition = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = null
  }
  useEffect(() => {
    selectedRef.current = false
    return () => { clearTransition() }
  }, [qIdx])
  useEffect(() => () => {
    clearTransition()
    if (generatingTimer.current) clearTimeout(generatingTimer.current)
    stopSpeech()
  }, [])
  const goBack = () => {
    clearTransition(); narration.reset(); stopSpeech()
    selectedRef.current = false
    setQIdx(i => Math.max(0, i - 1))
  }

  const q = QUESTIONS[qIdx]
  const totalQ = QUESTIONS.length
  const progress = (qIdx / totalQ) * 100

  const selectAnswer = (value: string) => {
    if (selectedRef.current) return
    selectedRef.current = true
    narration.reset(); stopSpeech()
    setAnswers(prev => ({ ...prev, [qIdx]: value }))
    if (qIdx < totalQ - 1) transitionTimer.current = setTimeout(() => { transitionTimer.current = null; setQIdx(qIdx + 1) }, 280)
  }

  const submitFree = () => {
    const val = freeText.trim() || 'קסם'
    setAnswers(prev => ({ ...prev, [qIdx]: val }))
    if (qIdx < totalQ - 1) setQIdx(i => i + 1)
    setFreeText('')
  }

  const generate = (finalWord?: string) => {
    if (generatingTimer.current) return
    clearTransition(); narration.reset(); stopSpeech()
    setFlowStep('generating')
    generatingTimer.current = setTimeout(() => { generatingTimer.current = null; setSong(buildSong(finalWord ? { ...answers, 9: finalWord } : answers)); setFlowStep('result') }, 2200)
  }

  const reset = () => {
    clearTransition(); narration.reset(); stopSpeech(); selectedRef.current = false
    if (generatingTimer.current) clearTimeout(generatingTimer.current)
    generatingTimer.current = null
    setQIdx(0); setAnswers({}); setFreeText(''); setSong([])
    setSaved(false); setShowTeacher(false); setTeacherNotes({}); setNotice('')
    setFlowStep('questions')
  }

  if (flowStep === 'generating') {
    return (
      <AppShell bg="#fffbeb">
        <BackHeader title="שיר הקסם ⭐" bg={BRAND.orange} onBack={() => { clearTransition(); narration.reset(); stopSpeech() }} />
      <div className="px-4 pt-3"><Link href="/guide" className="inline-block rounded-xl bg-white px-3 py-2 text-sm font-bold text-indigo-800 shadow-sm">🎬 איך יוצרים שיר?</Link></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 64 }}>✨</motion.div>
          <div className="font-black" style={{ fontSize: 22, color: BRAND.navy }}>מרכיב מילים מהבחירות שלכם...</div>
          <WaveBar active count={16} height={28} />
          <div style={{ color: '#9ca3af', fontSize: 14 }}>מעבד את התשובות שלכם</div>
        </div>
      </AppShell>
    )
  }

  if (flowStep === 'result') {
    return (
      <AppShell bg="#fffbeb">
        <BackHeader title="המילים לשיר שלכם 🎵" bg={BRAND.orange} onBack={() => { clearTransition(); narration.reset(); stopSpeech() }} />
        <div className="p-4 space-y-3">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <Card style={{ background: `linear-gradient(135deg,${BRAND.navy},#312e81)` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <WaveBar active={false} count={18} height={28} />
              </div>
              <div style={{ textAlign: 'center', color: BRAND.yellow, fontWeight: 900, fontSize: 16, marginBottom: 14 }}>✨ המילים שיצרתם ✨</div>
              <p style={{color:'white',fontSize:12,textAlign:'center'}}>זו טיוטת מילים מהבחירות שלכם. אפשר לנסות לשיר עם ליווי, או להקריא את המילים.</p>
              {song.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.16, type: 'spring', stiffness: 180 }}
                  style={{ color: 'white', fontWeight: 700, fontSize: 16, padding: '9px 0',
                    borderBottom: i < song.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  {line}
                </motion.div>
              ))}
              <MagicSongPlayer ref={songPlayer} answers={answers} lines={song} beforePlay={() => { narration.reset(); stopSpeech() }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                <Btn bg={saved ? BRAND.green : BRAND.pink} onClick={() => { localStorage.setItem('habeat:magic-song', JSON.stringify(song)); setSaved(true) }} style={{ fontSize: 14, padding: '11px' }}>{saved ? '✓ נשמר' : '💾 שמור'}</Btn>
                <Link href="/recording" style={{ textDecoration: 'none' }}><Btn bg={BRAND.cyan} style={{ fontSize: 14, padding: '11px', width: '100%' }}>🎤 להקלטה</Btn></Link>
                <Btn bg={BRAND.purple} onClick={async () => { try { await navigator.clipboard.writeText(song.join('\n')); setNotice('המילים הועתקו!') } catch { setNotice('לא ניתן להעתיק במכשיר הזה.') } }} style={{ fontSize: 14, padding: '11px' }}>📋 העתק</Btn>
                <Btn bg={BRAND.orange} onClick={() => { songPlayer.current?.reset(); narration.reset(); if (!speakHebrew(song.join('. '))) setNotice('לא נמצא קול עברי במכשיר. הפעילו קול עברי בהגדרות הדפדפן ונסו שוב.') }} style={{ fontSize: 14, padding: '11px' }}><PilotIcon name="hear-again" /> הקראת המילים</Btn>
              </div>
              <button type="button" onClick={stopSpeech} className="mt-3 w-full rounded-xl border border-white/50 px-3 py-3 font-bold text-white"><PilotIcon name="stop" /> עצירת הקראת המילים</button>
            </Card>
          </motion.div>
          {notice && <p role="status" className="text-sm text-center text-indigo-900">{notice}</p>}
          <Card>
            <div className="font-black" style={{ fontSize: 14, color: BRAND.navy, marginBottom: 10 }}>📝 בחירות שלכם</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(answers).map(([idx, val]) => (
                <span key={idx} style={{ background: `${BRAND.yellow}22`, border: `1.5px solid ${BRAND.yellow}55`,
                  borderRadius: 10, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: BRAND.navy }}>{val}</span>
              ))}
            </div>
          </Card>
          <Btn full bg="#f3f4f6" onClick={reset} style={{ color: '#6b7280', padding: '13px', fontSize: 15 }}><PilotIcon name="try-again" /> צרו מילים לשיר חדש</Btn>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell bg="#fffbeb">
      <BackHeader title="שיר הקסם ⭐" bg={BRAND.orange} onBack={() => { clearTransition(); narration.reset(); stopSpeech() }} />
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
              <div style={{ fontSize: 13, color: '#6b7280' }}><PilotIcon name="hint" size={22} /> {q.hint}</div>
              <NarrationReader key={qIdx} asset={NARRATION[`question-${qIdx + 1}`]} player={narration} label={`שאלה ${qIdx + 1}`} beforePlay={stopSpeech}/>
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
                  style={{ padding: '13px', fontSize: 16, color: freeText.trim() ? BRAND.navy : '#9ca3af' }}><PilotIcon name="confirm" /> אישור</Btn>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.opts.map((opt, i) => {
                  const isSelected = answers[qIdx] === opt.l
                  const colors = [BRAND.pink, BRAND.cyan, BRAND.green]
                  const c = colors[i]
                  return (
                    <motion.div key={opt.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }} whileTap={{ scale: 0.97 }} role="button" tabIndex={0} aria-label={opt.l} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAnswer(opt.l) } }} onClick={() => selectAnswer(opt.l)}>
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

        {notice && <p role="status" className="text-sm text-center text-indigo-900">{notice}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          {qIdx > 0 && (
            <Btn bg="#f3f4f6" onClick={goBack} style={{ color: '#6b7280', padding: '11px 20px', fontSize: 14 }}><PilotIcon name="previous" /> אחורה</Btn>
          )}
          <div style={{ flex: 1 }} />
          {qIdx === totalQ - 1 && (answers[qIdx] || (q.freeText && freeText)) && (
            <Btn bg={`linear-gradient(135deg,${BRAND.yellow},${BRAND.orange})`}
              onClick={() => { if (q.freeText && freeText.trim()) submitFree(); generate(freeText.trim() || answers[qIdx]) }}
              style={{ color: BRAND.navy, padding: '11px 20px', fontSize: 15, fontWeight: 900 }}><PilotIcon name="next" /> צרו מילים לשיר!</Btn>
          )}
        </div>
      </div>
    </AppShell>
  )
}
