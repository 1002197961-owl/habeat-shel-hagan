'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { BRAND } from '@/lib/constants'
import {
  DEMO_CHILDREN,
  SESSION_STATIONS,
  TEACHER_SESSION_STORAGE_KEY,
  applySavedHistory,
  buildSavedSession,
  createBalancedAssignments,
  validateAssignments,
  type Assignment,
  type GroupId,
  type SavedTeacherSession,
} from '@/lib/teacherSession'

type FlowStep = 'select' | 'assign' | 'confirm' | 'active' | 'done'

const GROUPS: { id: GroupId; label: string; emoji: string }[] = [
  { id: 'all', label: 'כל הגן', emoji: '🌈' },
  { id: 'a', label: 'קבוצה א׳', emoji: '⭐' },
  { id: 'b', label: 'קבוצה ב׳', emoji: '🎵' },
]

const STEPS: { id: FlowStep; label: string }[] = [
  { id: 'select', label: 'בחירה' },
  { id: 'assign', label: 'חלוקה' },
  { id: 'confirm', label: 'אישור' },
  { id: 'active', label: 'פעילות' },
  { id: 'done', label: 'שמירה' },
]

const stepIndex = (step: FlowStep) => STEPS.findIndex(item => item.id === step)

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function StepRail({ step }: { step: FlowStep }) {
  const activeIndex = stepIndex(step)
  return (
    <div aria-label="שלבי הפעילות" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
      {STEPS.map((item, index) => (
        <div key={item.id} style={{ textAlign: 'center' }}>
          <div style={{
            height: 7,
            borderRadius: 99,
            background: index <= activeIndex ? BRAND.rose : '#e5e7eb',
            transition: 'background .25s ease',
          }} />
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            marginTop: 5,
            color: index === activeIndex ? BRAND.rose : '#9ca3af',
          }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function TeacherPage() {
  const [step, setStep] = useState<FlowStep>('select')
  const [group, setGroup] = useState<GroupId>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>(DEMO_CHILDREN.map(child => child.id))
  const [durationMinutes, setDurationMinutes] = useState(10)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [sessions, setSessions] = useState<SavedTeacherSession[]>([])
  const [remaining, setRemaining] = useState(10 * 60)
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [savedSession, setSavedSession] = useState<SavedTeacherSession | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TEACHER_SESSION_STORAGE_KEY)
      if (raw) setSessions(JSON.parse(raw) as SavedTeacherSession[])
    } catch {
      setSessions([])
    }
  }, [])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = window.setInterval(() => setRemaining(value => value - 1), 1000)
    return () => window.clearInterval(id)
  }, [running, remaining])

  useEffect(() => {
    if (remaining === 0) setRunning(false)
  }, [remaining])

  const childrenWithHistory = useMemo(
    () => applySavedHistory(DEMO_CHILDREN, sessions),
    [sessions],
  )

  const visibleChildren = useMemo(
    () => childrenWithHistory.filter(child => group === 'all' || child.group === group),
    [childrenWithHistory, group],
  )

  const selectedChildren = useMemo(
    () => childrenWithHistory.filter(child => selectedIds.includes(child.id)),
    [childrenWithHistory, selectedIds],
  )

  const validation = validateAssignments(selectedChildren, assignments)

  const chooseGroup = (nextGroup: GroupId) => {
    setGroup(nextGroup)
    const ids = childrenWithHistory
      .filter(child => nextGroup === 'all' || child.group === nextGroup)
      .map(child => child.id)
    setSelectedIds(ids)
  }

  const toggleChild = (childId: string) => {
    setSelectedIds(ids => ids.includes(childId)
      ? ids.filter(id => id !== childId)
      : [...ids, childId])
  }

  const createAssignments = () => {
    setAssignments(createBalancedAssignments(selectedChildren))
    setStep('assign')
  }

  const changeStation = (childId: string, stationId: string) => {
    setAssignments(items => items.map(item =>
      item.childId === childId ? { ...item, stationId } : item,
    ))
  }

  const beginActivity = () => {
    setStartedAt(new Date())
    setRemaining(durationMinutes * 60)
    setRunning(true)
    setStep('active')
  }

  const finishAndSave = () => {
    const completedAt = new Date()
    const session = buildSavedSession({
      assignments,
      group,
      durationMinutes,
      startedAt: startedAt ?? completedAt,
      completedAt,
    })
    const nextSessions = [session, ...sessions].slice(0, 20)
    window.localStorage.setItem(TEACHER_SESSION_STORAGE_KEY, JSON.stringify(nextSessions))
    setSessions(nextSessions)
    setSavedSession(session)
    setRunning(false)
    setStep('done')
  }

  const resetFlow = () => {
    setStep('select')
    setAssignments([])
    setStartedAt(null)
    setSavedSession(null)
    setRemaining(durationMinutes * 60)
  }

  return (
    <AppShell bg="linear-gradient(180deg,#fff1f5 0%,#fff7ed 100%)">
      <BackHeader title="מצב גננת 👩‍🏫" bg={BRAND.rose} />
      <div className="p-4 space-y-3">
        <Card style={{ padding: 14, border: `1.5px solid ${BRAND.rose}22` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div className="font-black" style={{ color: BRAND.navy, fontSize: 16 }}>סבב מוזיקלי חדש</div>
              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>נתוני הדגמה · ללא פרטי ילדים אמיתיים</div>
            </div>
            <Pill color={BRAND.green}>נשמר במכשיר</Pill>
          </div>
          <StepRail step={step} />
        </Card>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <Card>
                <div className="font-black" style={{ color: BRAND.navy, fontSize: 15, marginBottom: 10 }}>1. בחרי קבוצה</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {GROUPS.map(item => (
                    <motion.button key={item.id} whileTap={{ scale: .95 }} onClick={() => chooseGroup(item.id)} style={{
                      border: `2px solid ${group === item.id ? BRAND.rose : '#e5e7eb'}`,
                      background: group === item.id ? `${BRAND.rose}14` : 'white',
                      borderRadius: 13,
                      padding: '10px 4px',
                      color: group === item.id ? BRAND.rose : '#6b7280',
                      fontFamily: 'inherit',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 20 }}>{item.emoji}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>{item.label}</div>
                    </motion.button>
                  ))}
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="font-black" style={{ color: BRAND.navy, fontSize: 15 }}>2. בחרי אווטרים</div>
                  <Pill color={BRAND.rose}>{selectedIds.length} נבחרו</Pill>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {visibleChildren.map(child => {
                    const selected = selectedIds.includes(child.id)
                    return (
                      <motion.button key={child.id} whileTap={{ scale: .92 }} onClick={() => toggleChild(child.id)} aria-pressed={selected} style={{
                        border: `2.5px solid ${selected ? child.color : '#e5e7eb'}`,
                        background: selected ? `${child.color}15` : '#fafafa',
                        borderRadius: 15,
                        padding: '9px 3px 8px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        position: 'relative',
                      }}>
                        {selected && <span style={{ position: 'absolute', top: 4, left: 5, color: child.color, fontSize: 11, fontWeight: 900 }}>✓</span>}
                        <div style={{ fontSize: 31 }}>{child.avatar}</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.navy, marginTop: 3 }}>{child.name}</div>
                      </motion.button>
                    )
                  })}
                </div>
              </Card>

              <Card>
                <div className="font-black" style={{ color: BRAND.navy, fontSize: 15, marginBottom: 9 }}>3. זמן לכל תחנה</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
                  {[5, 10, 15, 20].map(value => (
                    <button key={value} onClick={() => setDurationMinutes(value)} style={{
                      border: 'none',
                      borderRadius: 11,
                      padding: '10px 4px',
                      background: durationMinutes === value ? BRAND.navy : '#f3f4f6',
                      color: durationMinutes === value ? 'white' : '#6b7280',
                      fontFamily: 'inherit',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}>{value} דק׳</button>
                  ))}
                </div>
              </Card>

              <Btn full bg={`linear-gradient(135deg,${BRAND.rose},${BRAND.pink})`} onClick={createAssignments} disabled={selectedChildren.length < 4} style={{ padding: 15, fontSize: 17 }}>
                ✨ צרי חלוקה חכמה
              </Btn>
              {selectedChildren.length < 4 && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>יש לבחור לפחות ארבעה משתתפים.</div>}
            </motion.div>
          )}

          {step === 'assign' && (
            <motion.div key="assign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <Card style={{ background: `${BRAND.cyan}0e`, border: `1.5px solid ${BRAND.cyan}33` }}>
                <div className="font-black" style={{ color: BRAND.navy, fontSize: 16 }}>החלוקה החכמה מוכנה</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>המערכת העדיפה תפקידים חדשים ואיזנה את מספר הילדים. אפשר לשנות כל שיבוץ.</div>
              </Card>

              {assignments.map(item => {
                const child = selectedChildren.find(value => value.id === item.childId)!
                const station = SESSION_STATIONS.find(value => value.id === item.stationId)!
                const isNew = !child.history.includes(station.id)
                return (
                  <Card key={child.id} style={{ padding: 12, borderRight: `5px solid ${station.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 45, height: 45, borderRadius: 14, background: `${child.color}18`, display: 'grid', placeItems: 'center', fontSize: 26 }}>{child.avatar}</div>
                      <div style={{ width: 72 }}>
                        <div className="font-black" style={{ color: BRAND.navy, fontSize: 14 }}>{child.name}</div>
                        {isNew && <span style={{ color: BRAND.green, fontSize: 10, fontWeight: 900 }}>חדש עבורו/ה</span>}
                      </div>
                      <select aria-label={`תחנה עבור ${child.name}`} value={item.stationId} onChange={event => changeStation(child.id, event.target.value)} style={{
                        flex: 1,
                        minWidth: 0,
                        border: `2px solid ${station.color}55`,
                        borderRadius: 11,
                        padding: '9px 7px',
                        fontFamily: 'inherit',
                        fontWeight: 800,
                        color: BRAND.navy,
                        background: 'white',
                      }}>
                        {SESSION_STATIONS.map(value => <option key={value.id} value={value.id}>{value.emoji} {value.role}</option>)}
                      </select>
                    </div>
                  </Card>
                )
              })}

              <div style={{ borderRadius: 12, padding: '10px 12px', background: validation.valid ? '#dcfce7' : '#fee2e2', color: validation.valid ? '#166534' : '#991b1b', fontSize: 12, fontWeight: 800 }}>
                {validation.valid ? '✓' : '⚠'} {validation.message}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8 }}>
                <Btn bg="#e5e7eb" onClick={() => setStep('select')} style={{ color: '#6b7280' }}>חזרה</Btn>
                <Btn bg={BRAND.rose} onClick={() => setStep('confirm')} disabled={!validation.valid}>המשך לאישור</Btn>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <Card style={{ textAlign: 'center', background: `linear-gradient(135deg,${BRAND.navy},#312e81)`, color: 'white' }}>
                <div style={{ fontSize: 36 }}>🎼</div>
                <div className="font-black" style={{ fontSize: 19, marginTop: 5 }}>בודקות לפני שמתחילים</div>
                <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 4 }}>{selectedChildren.length} משתתפים · {durationMinutes} דקות לתחנה</div>
              </Card>

              {SESSION_STATIONS.map(station => {
                const stationAssignments = assignments.filter(item => item.stationId === station.id)
                return (
                  <Card key={station.id} style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: `${station.color}18`, display: 'grid', placeItems: 'center', fontSize: 23 }}>{station.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div className="font-black" style={{ color: BRAND.navy, fontSize: 14 }}>{station.name}</div>
                        <div style={{ color: station.color, fontSize: 11, fontWeight: 800 }}>{station.role}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {stationAssignments.map(item => {
                          const child = selectedChildren.find(value => value.id === item.childId)!
                          return <span key={child.id} title={child.name} style={{ fontSize: 25 }}>{child.avatar}</span>
                        })}
                      </div>
                    </div>
                  </Card>
                )
              })}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 8 }}>
                <Btn bg="#e5e7eb" onClick={() => setStep('assign')} style={{ color: '#6b7280' }}>עריכה</Btn>
                <Btn bg={`linear-gradient(135deg,${BRAND.green},#15803d)`} onClick={beginActivity} style={{ fontSize: 16 }}>▶ אישור והתחלה</Btn>
              </div>
            </motion.div>
          )}

          {step === 'active' && (
            <motion.div key="active" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <Card style={{ textAlign: 'center', padding: '24px 16px', background: `linear-gradient(145deg,${BRAND.navy},#312e81)`, color: 'white', overflow: 'hidden', position: 'relative' }}>
                <motion.div animate={running ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 38 }}>🎵</motion.div>
                <div style={{ color: BRAND.yellow, fontSize: 12, fontWeight: 900, marginTop: 4 }}>הפעילות מתנגנת</div>
                <div className="font-black" style={{ fontSize: 54, letterSpacing: 3, lineHeight: 1.15, marginTop: 8 }}>{formatTime(remaining)}</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12 }}>{GROUPS.find(item => item.id === group)?.label} · {selectedChildren.length} משתתפים</div>
                <button onClick={() => setRunning(value => !value)} style={{ marginTop: 15, border: 'none', borderRadius: 12, padding: '9px 22px', background: running ? '#fee2e2' : '#dcfce7', color: running ? '#b91c1c' : '#166534', fontFamily: 'inherit', fontWeight: 900, cursor: 'pointer' }}>
                  {running ? '⏸ השהיה' : '▶ המשך'}
                </button>
              </Card>

              <Card>
                <div className="font-black" style={{ color: BRAND.navy, fontSize: 15, marginBottom: 10 }}>מי נמצא איפה?</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SESSION_STATIONS.map(station => (
                    <div key={station.id} style={{ borderRadius: 13, padding: 10, background: `${station.color}12`, border: `1.5px solid ${station.color}33` }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: station.color }}>{station.emoji} {station.name}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
                        {assignments.filter(item => item.stationId === station.id).map(item => {
                          const child = selectedChildren.find(value => value.id === item.childId)!
                          return <span key={child.id} title={child.name} style={{ fontSize: 24 }}>{child.avatar}</span>
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Btn full bg={`linear-gradient(135deg,${BRAND.rose},${BRAND.pink})`} onClick={finishAndSave} style={{ padding: 15, fontSize: 16 }}>⏹ סיום ושמירת הסבב</Btn>
            </motion.div>
          )}

          {step === 'done' && savedSession && (
            <motion.div key="done" initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <Card style={{ textAlign: 'center', padding: '28px 18px', background: 'linear-gradient(145deg,#dcfce7,#f0fdf4)', border: `2px solid ${BRAND.green}55` }}>
                <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220 }} style={{ fontSize: 58 }}>🏆</motion.div>
                <div className="font-black" style={{ color: '#166534', fontSize: 21, marginTop: 7 }}>הסבב נשמר בהצלחה!</div>
                <div style={{ color: '#4b5563', fontSize: 13, marginTop: 5 }}>{savedSession.assignments.length} משתתפים השלימו פעילות מוזיקלית.</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
                  <Pill color={BRAND.green}>סבב #{sessions.length}</Pill>
                  <Pill color={BRAND.cyan}>נשמר בפרופיל ההדגמה</Pill>
                </div>
              </Card>
              <Card>
                <div className="font-black" style={{ color: BRAND.navy, fontSize: 14 }}>מה נשמר?</div>
                <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.65, marginTop: 6 }}>
                  הקבוצה, משך הפעילות, השיבוץ של כל אווטאר וזמן הסיום. בסבב הבא המערכת תתחשב בהתנסות הזאת ותעדיף עבור כל ילד וילדה תפקיד חדש.
                </div>
              </Card>
              <Btn full bg={`linear-gradient(135deg,${BRAND.cyan},#0284c7)`} onClick={resetFlow} style={{ padding: 15, fontSize: 16 }}>＋ התחילי סבב נוסף</Btn>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
