'use client'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/constants'
import { InputRecorder, MidiTransport, routeInput, type InputEvent, type InputPort, type Mapping, type MidiAccessLike, type Turn } from '@/lib/instrumentInput'
import { TurnTone } from '@/lib/turnTone'
import { BeatCore } from '@/components/characters/BeatCore'
import { beatCoreStateForTurn } from '@/lib/beatCore'
import { PilotIcon } from '@/components/ui/PilotIcon'
import { StaticCharacter } from '@/components/characters/StaticCharacter'

type Row = InputEvent & { decision: string; accepted: boolean; feedback: boolean; taskOutcome: 'not-counted' | 'in-progress' | 'completed'; uiCommitMs?: number; audioScheduledMs?: number }
const SIM_PORT: InputPort = { id: 'simulation', name: 'הדמיית פיתוח', manufacturer: '', state: 'connected' }
const SIM_MAPPING: Mapping = { portId: SIM_PORT.id, channel: 1, note: 60 }
const labels: Record<Turn, string> = { ready: 'מוכנים לנגן?', demonstrating: 'התור שלי — מקשיבים', waiting: 'התור שלך — נגנו פעם אחת', responded: 'שמענו אתכם!', paused: 'נעצור רגע' }
const reasons: Record<string, string> = { 'turn-response':'הפעיל תגובה במשחק', 'duplicate-delivery':'מסירה כפולה זהה', 'other-source':'מקור אחר', 'note-off':'שחרור', other:'הודעה אחרת', invalid:'הודעה לא תקינה', unmapped:'לא ממופה', 'outside-turn':'מחוץ לתור', 'stale-before-turn':'נוצר לפני תחילת התור' }

export default function TurnTakingPage() {
  const [mode, setMode] = useState<InputEvent['source']>('web-midi')
  const [ports, setPorts] = useState<InputPort[]>([])
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [turn, setTurn] = useState<Turn>('ready')
  const [rows, setRows] = useState<Row[]>([])
  const [connections, setConnections] = useState<{ at: string; ports: InputPort[] }[]>([])
  const [error, setError] = useState('')
  const [capability, setCapability] = useState('טרם נבדק')
  const [busy, setBusy] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [captureSince, setCaptureSince] = useState(0)
  const [lastAccepted, setLastAccepted] = useState<number | null>(null)
  const [lastGameEventId, setLastGameEventId] = useState<number | null>(null)
  const [targetActions, setTargetActions] = useState(1)
  const [actionsInTurn, setActionsInTurn] = useState(0)
  const [lastAction, setLastAction] = useState('')
  const [equipment, setEquipment] = useState('SENOSEN — יש להשלים דגם וכבל')
  const [target, setTarget] = useState('טאבלט Android / Chrome — יש להשלים דגם וגרסה')
  const [observed, setObserved] = useState('')
  const [notes, setNotes] = useState('')
  const controller = useRef<MidiTransport | null>(null)
  const recorder = useRef(new InputRecorder())
  const tone = useRef<TurnTone | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const generation = useRef(0)
  const total = useRef(0)
  const totalAccepted = useRef(0)
  const totalMatched = useRef(0)
  const totalDuplicate = useRef(0)
  const completedRounds = useRef(0)
  const feedbackResponses = useRef(0)
  const rowsRef = useRef<Row[]>([])
  const state = useRef({ mode, mapping, turn, targetActions, actionsInTurn, waitingSince: 0 })
  state.current = { ...state.current, mode, mapping, turn, targetActions, actionsInTurn }
  const stop = (next: Turn = 'paused') => {
    generation.current++
    timers.current.forEach(clearTimeout); timers.current = []
    tone.current?.stop()
    state.current.turn = next; setTurn(next); setBusy(false)
    state.current.actionsInTurn = 0; setActionsInTurn(0)
    setLastGameEventId(null)
    setLastAction('')
  }
  const handle = useRef((source: InputEvent['source'], port: InputPort, bytes: number[], stamp: number) => {})
  handle.current = (source, port, bytes, stamp) => {
    const event = recorder.current.receive(source, port, bytes, stamp, performance.now(), new Date().toISOString())
    const s = state.current, selected = s.mode === 'simulation' ? SIM_MAPPING : s.mapping
    const decision = routeInput(event, s.mode, selected, s.turn, s.waitingSince, s.targetActions - s.actionsInTurn)
    const mapped = !event.duplicate && source === s.mode && event.kind === 'note-on' && selected?.portId === port.id && selected.channel === event.channel && selected.note === event.note
    const feedback = mapped && decision.reason !== 'stale-before-turn' && (s.turn === 'waiting' || s.turn === 'demonstrating' || s.turn === 'responded')
    const row: Row = { ...event, accepted: decision.accepted, feedback, decision: decision.reason, taskOutcome: 'not-counted' }
    total.current++
    if (event.duplicate) totalDuplicate.current++
    if (mapped) totalMatched.current++
    if (feedback) {
      const audio = tone.current?.play()
      if (audio) row.audioScheduledMs = audio.scheduledAtMs - event.receivedMs
      else setError('הקלט התקבל, אך השמע אינו מוכן. עצרו והתחילו שוב.')
      feedbackResponses.current++; setLastAccepted(event.id)
      setLastAction(`נקלטה פעולה ${feedbackResponses.current}`)
    }
    if (decision.accepted) {
      // Update synchronous counters before rendering; a duplicate cannot fill the second slot.
      state.current.actionsInTurn++; setActionsInTurn(state.current.actionsInTurn)
      state.current.turn = decision.next; setTurn(decision.next)
      row.taskOutcome = decision.next === 'responded' ? 'completed' : 'in-progress'
      if (row.taskOutcome === 'completed') completedRounds.current++
      totalAccepted.current++
      setLastGameEventId(event.id)
    }
    rowsRef.current = [row, ...rowsRef.current].slice(0, 1000)
    setRows(rowsRef.current)
  }
  useLayoutEffect(() => {
    if (lastAccepted === null) return
    // Batched inputs can share a DOM commit; do not invent a separate paint for each.
    for (const row of rowsRef.current) if (row.feedback && row.uiCommitMs === undefined) row.uiCommitMs = performance.now() - row.receivedMs
    setRows([...rowsRef.current])
  }, [lastAccepted])
  useEffect(() => {
    setCapability(window.isSecureContext && 'requestMIDIAccess' in navigator && typeof navigator.requestMIDIAccess === 'function' ? 'Web MIDI זמין לבקשת הרשאה' : 'Web MIDI אינו זמין כאן')
    tone.current = new TurnTone()
    controller.current = new MidiTransport((port, data, stamp) => handle.current('web-midi', port, data, stamp), next => {
      setPorts(next)
      setConnections(previous => [{ at: new Date().toISOString(), ports: next }, ...previous].slice(0, 100))
      if (state.current.mode === 'web-midi' && state.current.mapping && !next.some(p => p.id === state.current.mapping!.portId)) {
        stop(); setCaptureSince(performance.now()); setError('הכלי נותק. חברו מחדש והתחילו סבב חדש כשאתם מוכנים.')
      }
    }, setError)
    const leave = () => { stop(); controller.current?.disconnect(); setPorts([]); setCaptureSince(performance.now()) }
    const hidden = () => { if (document.hidden) leave() }
    window.addEventListener('pagehide', leave); document.addEventListener('visibilitychange', hidden)
    return () => {
      generation.current++
      timers.current.forEach(clearTimeout)
      controller.current?.disconnect(); tone.current?.dispose()
      window.removeEventListener('pagehide', leave); document.removeEventListener('visibilitychange', hidden)
    }
  }, [])
  const connect = async () => {
    stop('ready'); setError(''); setBusy(true); setPorts([]); setMapping(null)
    state.current.mapping = null; recorder.current.resetFingerprints(); setCaptureSince(performance.now())
    const request = (navigator as Navigator & { requestMIDIAccess?: (options: { sysex: boolean }) => Promise<MidiAccessLike> }).requestMIDIAccess
    if (!window.isSecureContext || !request) { setError('ממשק Web MIDI אינו זמין בדפדפן הזה. אין כרגע חיבור לכלי.'); setBusy(false); return }
    await controller.current?.connect(() => request.call(navigator, { sysex: false }))
    setBusy(false)
  }
  const ready = mode === 'simulation' || !!(mapping && ports.some(p => p.id === mapping.portId))
  const start = async () => {
    stop('ready'); setError('')
    if (!ready) return
    const request = generation.current; setBusy(true)
    try {
      await tone.current!.prepare()
      if (request !== generation.current) return
      setBusy(false); state.current.turn = 'demonstrating'; setTurn('demonstrating')
      tone.current!.play()
      if (state.current.targetActions === 2) timers.current.push(setTimeout(() => {
        if (request === generation.current) tone.current!.play()
      }, 650))
      timers.current.push(setTimeout(() => {
        if (request !== generation.current) return
        state.current.waitingSince = performance.now(); state.current.turn = 'waiting'; setTurn('waiting')
      }, state.current.targetActions === 2 ? 1250 : 600))
    } catch { if (request === generation.current) { setBusy(false); setError('לא ניתן להפעיל שמע. בדקו עוצמה והרשאה ונסו שוב.') } }
  }
  const switchMode = (next: InputEvent['source']) => {
    stop('ready'); controller.current?.disconnect(); setPorts([]); setMapping(null); setCaptureSince(performance.now())
    state.current.mode = next; state.current.mapping = null
    setMode(next); setError('')
  }
  const latestNote = rows.find(r => r.source === 'web-midi' && r.receivedMs >= captureSince && r.kind === 'note-on' && !r.duplicate && ports.some(p => p.id === r.port.id))
  const learn = () => {
    if (!latestNote || latestNote.channel === null || latestNote.note === null) return
    stop('ready'); const next = { portId: latestNote.port.id, channel: latestNote.channel, note: latestNote.note }
    state.current.mapping = next; setMapping(next)
  }
  const exportReport = () => {
    const report = {
      schema: 2, createdAt: new Date().toISOString(), version: process.env.NEXT_PUBLIC_BUILD_SHA || 'audio-word-sync-integration-candidate',
      url: location.origin + location.pathname, browser: navigator.userAgent, language: navigator.language,
      viewport: { width: innerWidth, height: innerHeight }, capability, equipment, targetDevice: target,
      physicalProof: 'NOT_AUTOMATICALLY_VERIFIED', observation: { physicalActionCount: observed === '' ? null : Number(observed), notes },
      mode, mapping, ports, connections, targetActions, rhythmAccuracy: 'NOT_ASSESSED',
      totals: { messages: total.current, mappedNoteOns: totalMatched.current, identicalDuplicateDeliveries: totalDuplicate.current, feedbackResponses: feedbackResponses.current, gameResponses: totalAccepted.current, completedRounds: completedRounds.current, omittedFromLog: Math.max(0, total.current - rowsRef.current.length) },
      timingMeaning: 'receivedAt is browser wall time. receivedMs and browserEventMs use the browser monotonic clock, not a hardware clock. uiCommitMs is JS-to-DOM commit, not paint or physical-to-screen latency. audioScheduledMs is scheduling, not sound heard. Missed physical actions and end-to-end latency require external observation.',
      events: [...rowsRef.current].reverse(),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `habeat-input-${Date.now()}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const clear = () => {
    stop('ready'); rowsRef.current = []; setRows([]); setLastAccepted(null); setConnections([])
    total.current = 0; totalAccepted.current = 0; totalMatched.current = 0; totalDuplicate.current = 0
    completedRounds.current = 0; feedbackResponses.current = 0; setLastAction('')
    recorder.current.resetFingerprints(); setObserved(''); setNotes('')
  }
  return <main dir="rtl" className="min-h-screen p-4 space-y-4 bg-sky-50" style={{ color: BRAND.navy }}>
    <Link href="/" onClick={() => { stop(); controller.current?.disconnect() }} className="inline-block py-2 font-bold"><PilotIcon name="home" /> חזרה לבית</Link>
    <h1 className="text-2xl font-black">התור שלי, התור שלך</h1>
    <section aria-label="משחק תורות" className="rounded-3xl bg-white p-5 text-center space-y-4 shadow-sm">
      <div className="flex items-end justify-center gap-2" aria-label="חברי הלהקה"><StaticCharacter character="G" /><StaticCharacter character="R" /><StaticCharacter character="M" /></div>
      <div className="flex justify-center"><BeatCore character="R" state={beatCoreStateForTurn(turn)} size={42} decorative /></div>
      <p className="text-2xl font-black min-h-16" role="status" data-turn={turn}>{turn === 'waiting' && targetActions === 2 ? 'התור שלך — נגנו פעמיים' : labels[turn]}</p>
      <p>{targetActions === 1 ? 'מקשיבים לצליל אחד, ואז מנגנים פעם אחת.' : 'מקשיבים לשני צלילים, ואז מנגנים פעמיים.'}</p>
      <p data-action-progress data-game-response-id={lastGameEventId ?? undefined} aria-live="polite">{actionsInTurn} מתוך {targetActions} פעולות בסבב</p>
      {lastAction && <p className="rounded-xl p-2 font-bold" style={{ background: BRAND.yellow }} data-input-feedback data-input-event-id={lastAccepted ?? undefined}>{lastAction}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button disabled={!ready || busy} onClick={start} className="rounded-xl p-3 text-white font-bold disabled:opacity-40" style={{ background: BRAND.cyan }}><PilotIcon name={turn === 'ready' ? 'play' : 'hear-again'} /> {turn === 'ready' ? 'התחילו' : 'שמעו שוב והתחילו'}</button>
        <button onClick={() => stop()} className="rounded-xl p-3 bg-slate-100 font-bold"><PilotIcon name="stop" /> עצירה</button>
        <button onClick={() => stop('ready')} className="rounded-xl p-3 bg-slate-100 font-bold"><PilotIcon name="try-again" /> חזרה להתחלה</button>
      </div>
      {!ready && <p className="text-sm">לפני שמתחילים, מבוגר מחבר ומכוון את תופי SENOSEN דרך הגדרות הכלי.</p>}
      {mode === 'simulation' && <div className="rounded-xl bg-amber-100 p-3 space-y-2">
        <p className="font-bold">מצב הדמיה לפיתוח — אינו הוכחת חיבור לכלי.</p>
        <button onClick={() => handle.current('simulation', SIM_PORT, [144, 60, 100], performance.now())} className="rounded-xl bg-white p-3 font-bold">פעולת הדמיה</button>
      </div>}
      {error && <p role="alert" className="text-sm font-bold">{error}</p>}
    </section>
    <button aria-expanded={setupOpen} aria-controls="instrument-setup" onClick={() => setSetupOpen(open => !open)} className="rounded-xl bg-white p-3 font-bold">
      {setupOpen && <PilotIcon name="close" />} {setupOpen ? 'סגירת הגדרות הכלי' : 'הגדרות כלי למבוגר'}
    </button>
    {setupOpen && <section id="instrument-setup" aria-label="הגדרות כלי למבוגר" className="rounded-3xl bg-white p-4 space-y-4 shadow-sm">
      <h2 className="text-lg font-black">חיבור וכיוון תופי SENOSEN</h2>
      <p className="text-sm">החיבור מיועד ליציאת MIDI של התופים ולטאבלט Android עם Chrome. משתמשים בכבל נתונים ובמתאם המתאים ליחידה. אין מיפוי תופים קבוע: לומדים את הפד מהקלט שמגיע בפועל.</p>
      <label className="block font-bold">מקור קלט
        <select value={mode} onChange={e => switchMode(e.target.value as InputEvent['source'])} className="block w-full rounded-xl border p-3 mt-1">
          <option value="web-midi">כלי MIDI — SENOSEN</option><option value="simulation">הדמיית פיתוח בלבד</option>
        </select>
      </label>
      {mode === 'web-midi' && <div className="space-y-3">
        <p>{capability}</p>
        <button disabled={busy} onClick={connect} className="rounded-xl bg-sky-100 p-3 font-bold disabled:opacity-40">בדקו כניסות קלט</button>
        <p role="status">{ports.length ? `כניסות שנמצאו: ${ports.map(p => p.name).join(', ')}` : 'עדיין לא נפתחה כניסת MIDI. חברו את הכלי ולחצו לבדיקה.'}</p>
        <p className="text-sm">הכו פעם אחת על הפד שנבחר. בדקו שזה התו שמופיע, ואז מפו אותו למשחק. זיהוי כניסה לבדו אינו מאמת חיבור פיזי.</p>
        <p data-latest-note>{latestNote ? `קלט אחרון: ${latestNote.port.name} · ערוץ ${latestNote.channel}, תו ${latestNote.note}, עוצמה ${latestNote.velocity}` : 'ממתינים להקשה חדשה על הפד'}</p>
        <button disabled={!latestNote} onClick={learn} className="rounded-xl bg-sky-100 p-3 font-bold disabled:opacity-40"><PilotIcon name="confirm" /> מפו את התו האחרון למשחק</button>
        {mapping && <p className="font-bold">מיפוי: ערוץ {mapping.channel}, תו {mapping.note}</p>}
      </div>}
      <label className="block font-bold">רמת הסבב
        <select value={targetActions} onChange={e => { stop('ready'); const count = Number(e.target.value); state.current.targetActions = count; setTargetActions(count) }} className="block w-full rounded-xl border p-3 mt-1">
          <option value={1}>הקשה אחת</option><option value={2}>שתי הקשות</option>
        </select>
      </label>
      {ready && <button onClick={() => setSetupOpen(false)} className="rounded-xl bg-emerald-100 p-3 font-bold"><PilotIcon name="confirm" /> סיימנו לכוון, חוזרים למשחק</button>}
      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer font-bold">אבחון ושמירת דוח למבוגר</summary>
        <div className="mt-3 space-y-3 text-sm">
          <p>הדוח נשמר רק בהורדה למכשיר הזה. אין צורך בשמות או בפרטים של ילדים.</p>
          <label className="block">ציוד וכבל<input value={equipment} onChange={e => setEquipment(e.target.value)} className="block w-full rounded-lg border p-2" /></label>
          <label className="block">מכשיר ודפדפן<input value={target} onChange={e => setTarget(e.target.value)} className="block w-full rounded-lg border p-2" /></label>
          <label className="block">מספר פעולות פיזיות שנצפו<input type="number" min="0" step="1" value={observed} onChange={e => setObserved(e.target.value)} className="block w-full rounded-lg border p-2" /></label>
          <label className="block">הערות לבדיקה<textarea value={notes} onChange={e => setNotes(e.target.value)} className="block w-full rounded-lg border p-2" /></label>
          <p>תגובות במשחק: {totalAccepted.current} · מסירות זהות שסוננו: {totalDuplicate.current}</p>
          <p>סבבים שהושלמו: {completedRounds.current} · הודעות קלט: {total.current}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={clear} className="rounded-xl bg-slate-100 p-3 font-bold">התחילו מדידה חדשה</button>
            <button onClick={exportReport} className="rounded-xl bg-slate-100 p-3 font-bold">הורידו דוח JSON</button>
          </div>
          <p>בדיקות תוכנה אינן הוכחת כלי פיזי. יש להשוות בין ההקשות שנצפו, תגובת המשחק והאירועים בדוח.</p>
          <ol aria-label="יומן קלט" className="max-h-64 overflow-y-auto space-y-2">
            {rows.slice(0, 30).map(row => <li key={row.id} className="rounded-lg bg-slate-50 p-2 break-words">
              #{row.id} · {row.source === 'simulation' ? 'הדמיה' : row.port.name} · {row.bytes.join(', ')} · {reasons[row.decision] || row.decision}
            </li>)}
          </ol>
        </div>
      </details>
      <Link href="/teacher" onClick={() => { stop(); controller.current?.disconnect() }} className="inline-block py-2 font-bold">חזרה למצב גננת</Link>
    </section>}
  </main>
}
