'use client'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/constants'
import { InputRecorder, MidiTransport, routeInput, type InputEvent, type InputPort, type Mapping, type MidiAccessLike, type Turn } from '@/lib/instrumentInput'
import { PROFILE_KEY, PAD_CUES, parseProfile, matchProfile, mappingFor, learnPad, type InstrumentProfile, type PadId } from '@/lib/instrumentProfile'
import { TurnTone } from '@/lib/turnTone'
import { createSequenceRound, beginSequenceResponse, receiveSequencePad, pauseSequence, nextSequenceLevel, sequenceDemoSchedule, padForInputSource, type SequenceRound } from '@/lib/sequenceGame'
import { BeatCore } from '@/components/characters/BeatCore'
import { beatCoreStateForTurn } from '@/lib/beatCore'
import { PilotIcon } from '@/components/ui/PilotIcon'
import { StaticCharacter } from '@/components/characters/StaticCharacter'

type Row = InputEvent & { sequenceRoundId?: number; sequenceStep?: number; padId?: PadId; expectedPad?: PadId; decision: string; accepted: boolean; feedback: boolean; taskOutcome: 'not-counted' | 'in-progress' | 'completed'; uiCommitMs?: number; audioScheduledMs?: number }
const SIM_PORT: InputPort = { id: 'simulation', name: 'הדמיית פיתוח', manufacturer: '', state: 'connected' }
const SIM_MAPPING: Mapping = { portId: SIM_PORT.id, channel: 1, note: 60 }
// These notes exist only in the explicitly labelled software simulation.
const SIM_PADS: {id: PadId; channel: number; note: number}[] = [{id:'green',channel:1,note:60},{id:'orange',channel:1,note:61},{id:'yellow',channel:1,note:62}]
const labels: Record<Turn, string> = { ready: 'מוכנים לנגן?', demonstrating: 'התור שלי — מקשיבים', waiting: 'התור שלך — נגנו פעם אחת', responded: 'שמענו אתכם!', paused: 'נעצור רגע' }
const reasons: Record<string, string> = { 'different-pad':'פד מוכר אחר — לא הפד המבוקש', 'turn-response':'הפעיל תגובה במשחק', 'duplicate-delivery':'מסירה כפולה זהה', 'other-source':'מקור אחר', 'note-off':'שחרור', other:'הודעה אחרת', invalid:'הודעה לא תקינה', unmapped:'לא ממופה', 'outside-turn':'מחוץ לתור', 'stale-before-turn':'נוצר לפני תחילת התור' }

export default function TurnTakingPage() {
  const [mode, setMode] = useState<InputEvent['source']>('web-midi')
  const [gameMode, setGameMode] = useState<'sequence' | 'turns'>('sequence')
  const gameModeRef = useRef(gameMode); gameModeRef.current = gameMode
  const [sequenceLevel, setSequenceLevel] = useState(1)
  const [demoTempo, setDemoTempo] = useState(900)
  const [chosenPads, setChosenPads] = useState<PadId[] | null>(null)
  const [sequenceRound, setSequenceRound] = useState<SequenceRound | null>(null)
  const roundRef = useRef<SequenceRound | null>(null)
  const roundCounter = useRef(0)
  const [demoIndex, setDemoIndex] = useState<number | null>(null)
  const demoLog = useRef<{roundId:number;step:number;padId:PadId;scheduledAtMs:number}[]>([])
  const updateRound = (next: SequenceRound | null) => { roundRef.current = next; setSequenceRound(next) }
  const [ports, setPorts] = useState<InputPort[]>([])
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [profile, setProfile] = useState<InstrumentProfile | null>(null)
  const profileRef = useRef<InstrumentProfile | null>(null)
  const [selectedPad, setSelectedPad] = useState<PadId>('green')
  const [learnSlot, setLearnSlot] = useState<PadId>('green')
  const [profileStatus, setProfileStatus] = useState('')
  const [inputPulse, setInputPulse] = useState(false)
  const [toneActive, setToneActive] = useState(false)
  const [feedbackPad, setFeedbackPad] = useState<PadId>('green')
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedPadRef = useRef<PadId>('green')
  selectedPadRef.current = selectedPad
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
  const [target, setTarget] = useState('טאבלט ואוזניות — יש להשלים דגם, מערכת ודפדפן')
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
    setDemoIndex(null)
    if (roundRef.current) updateRound(pauseSequence(roundRef.current))
    setInputPulse(false); if (pulseTimer.current) clearTimeout(pulseTimer.current)
    state.current.turn = next; setTurn(next); setBusy(false)
    state.current.actionsInTurn = 0; setActionsInTurn(0)
    setLastGameEventId(null)
    setLastAction('')
  }
  const applyTargetPad = (id: PadId) => {
    selectedPadRef.current = id; setSelectedPad(id)
    const simulated = SIM_PADS.find(p => p.id === id)
    const next = state.current.mode === 'simulation' && simulated
      ? {portId:SIM_PORT.id,channel:simulated.channel,note:simulated.note}
      : mappingFor(profileRef.current, matchProfile(profileRef.current, ports), id)
    state.current.mapping = next; setMapping(next)
  }
  const handle = useRef((source: InputEvent['source'], port: InputPort, bytes: number[], stamp: number) => {})
  handle.current = (source, port, bytes, stamp) => {
    const event = recorder.current.receive(source, port, bytes, stamp, performance.now(), new Date().toISOString())
    const s = state.current, sequence = gameModeRef.current === 'sequence', round = roundRef.current
    const selected = s.mode === 'simulation' && !sequence ? SIM_MAPPING : s.mapping
    const remaining = sequence && round ? round.pads.length - round.index : s.targetActions - s.actionsInTurn
    const decision = routeInput(event, s.mode, selected, s.turn, s.waitingSince, remaining)
    const learnedPad = (s.mode === 'simulation' ? SIM_PADS : profileRef.current?.pads)?.find(p => p.channel === event.channel && p.note === event.note)
    const mapped = !event.duplicate && source === s.mode && event.kind === 'note-on' && selected?.portId === port.id && (s.mode === 'simulation' && !sequence ? selected.channel === event.channel && selected.note === event.note : !!learnedPad)
    if (mapped && !decision.accepted && decision.reason === 'unmapped') decision.reason = 'different-pad'
    const feedback = mapped && (event.browserEventMs === null || event.browserEventMs >= s.waitingSince) && decision.reason !== 'stale-before-turn' && (sequence ? s.turn === 'waiting' : s.turn === 'waiting' || s.turn === 'demonstrating' || s.turn === 'responded')
    const sequenceResult = sequence && round && learnedPad && feedback ? receiveSequencePad(round, learnedPad.id, event.id) : null
    if (sequenceResult) {
      updateRound(sequenceResult.round)
      decision.accepted = sequenceResult.accepted
      decision.next = sequenceResult.round.phase === 'completed' ? 'responded' : s.turn
    }
    const row: Row = { ...event, sequenceRoundId: sequence ? round?.id : undefined, sequenceStep: sequence && round ? round.index + 1 : undefined, padId: mapped ? learnedPad?.id : undefined, expectedPad: selectedPadRef.current, accepted: decision.accepted, feedback, decision: decision.reason, taskOutcome: 'not-counted' }
    total.current++
    if (event.duplicate) totalDuplicate.current++
    if (mapped) totalMatched.current++
    if (feedback) {
      const audio = tone.current?.play()
      if (audio) row.audioScheduledMs = audio.scheduledAtMs - event.receivedMs
      else setError('הקלט התקבל, אך השמע אינו מוכן. עצרו והתחילו שוב.')
      feedbackResponses.current++; setLastAccepted(event.id)
      setFeedbackPad(learnedPad?.id || selectedPadRef.current); setInputPulse(true); if (pulseTimer.current) clearTimeout(pulseTimer.current)
      pulseTimer.current = setTimeout(() => setInputPulse(false), 650)
      setLastAction(sequence && !decision.accepted ? 'ננסה שוב בנחת — עכשיו הפד המסומן' : learnedPad ? `שמענו את הפד ה${PAD_CUES.find(p => p.id === learnedPad.id)!.label}${decision.reason === 'different-pad' ? ' — עכשיו הפד המסומן' : '!'}` : `נקלטה פעולה ${feedbackResponses.current}`)
    }
    if (decision.accepted) {
      // Update synchronous counters before rendering; a duplicate cannot fill the second slot.
      state.current.actionsInTurn++; setActionsInTurn(state.current.actionsInTurn)
      state.current.turn = decision.next; setTurn(decision.next)
      row.taskOutcome = decision.next === 'responded' ? 'completed' : 'in-progress'
      if (row.taskOutcome === 'completed') completedRounds.current++
      totalAccepted.current++
      setLastGameEventId(event.id)
      if (sequenceResult) {
        if (sequenceResult.round.phase === 'completed') setLastAction('הרצף הושלם! אפשר להתקדם או לנגן שוב')
        else applyTargetPad(sequenceResult.round.pads[sequenceResult.round.index])
      }
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
    try {
      const saved = parseProfile(localStorage.getItem(PROFILE_KEY))
      profileRef.current = saved; setProfile(saved)
      if (saved) { setSelectedPad(saved.pads[0].id); selectedPadRef.current = saved.pads[0].id; setProfileStatus('הכיוון השמור מוכן. חברו את הכלי כדי לזהות אותו.') }
    } catch { setProfileStatus('השמירה המקומית אינה זמינה. אפשר לכוון ולייצא קובץ גיבוי.') }
    tone.current = new TurnTone(setToneActive)
    controller.current = new MidiTransport((port, data, stamp) => handle.current('web-midi', port, data, stamp), next => {
      setPorts(next)
      const matched = matchProfile(profileRef.current, next)
      const restored = mappingFor(profileRef.current, matched, selectedPadRef.current)
      if (restored) { state.current.mapping = restored; setMapping(restored); setProfileStatus('הכלי המוכר זוהה — הכיוון השמור נטען') }
      setConnections(previous => [{ at: new Date().toISOString(), ports: next }, ...previous].slice(0, 100))
      if (state.current.mode === 'web-midi' && state.current.mapping && !restored) {
        stop(); state.current.mapping = null; setMapping(null); setCaptureSince(performance.now()); setError('הכלי נותק. חברו מחדש והתחילו סבב חדש כשאתם מוכנים.')
      }
    }, setError)
    let disposed = false
    const reconnectGranted = async () => {
      if (!profileRef.current || state.current.mode !== 'web-midi' || !navigator.permissions) return
      try {
        const permission = await navigator.permissions.query({name:'midi' as PermissionName, sysex:false} as PermissionDescriptor)
        if (!disposed && permission.state === 'granted' && window.isSecureContext && navigator.requestMIDIAccess)
          await controller.current?.connect(() => navigator.requestMIDIAccess({sysex:false}) as unknown as Promise<MidiAccessLike>)
      } catch { /* Unsupported permission query: the explicit connect button remains available. */ }
    }
    void reconnectGranted()
    const leave = () => { stop(); controller.current?.disconnect(); setPorts([]); setCaptureSince(performance.now()) }
    const hidden = () => { if (document.hidden) leave(); else void reconnectGranted() }
    window.addEventListener('pagehide', leave); document.addEventListener('visibilitychange', hidden)
    return () => {
      disposed = true
      generation.current++
      timers.current.forEach(clearTimeout)
      controller.current?.disconnect(); tone.current?.dispose(); if (pulseTimer.current) clearTimeout(pulseTimer.current)
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
  const availablePads = mode === 'simulation' ? SIM_PADS.map(p => p.id) : profile?.pads.map(p => p.id) || []
  const gamePads = chosenPads === null ? availablePads.slice(0, 3) : availablePads.filter(id => chosenPads.includes(id)).slice(0, 3)
  const start = async (levelOverride?: number) => {
    stop('ready'); setError('')
    if (!ready) return
    if (gameModeRef.current === 'sequence' && !gamePads.length) { setError('בחרו לפחות פד מכויל אחד למשחק.'); return }
    const request = generation.current; setBusy(true)
    try {
      const nextRound = gameModeRef.current === 'sequence' ? createSequenceRound(++roundCounter.current, gamePads, levelOverride ?? sequenceLevel) : null
      await tone.current!.prepare()
      if (request !== generation.current) return
      setBusy(false); state.current.turn = 'demonstrating'; setTurn('demonstrating')
      if (nextRound) {
        setSequenceLevel(nextRound.level); updateRound(nextRound); setSetupOpen(false)
        const schedule = sequenceDemoSchedule(nextRound.pads.length, demoTempo)
        for (const step of schedule.steps) {
          const demonstrate = () => {
            if (request !== generation.current) return
            const id = nextRound.pads[step.index]
            setDemoIndex(step.index); applyTargetPad(id)
            const audio = tone.current!.play()
            if (!audio) { stop(); setError('השמע נעצר. בדקו את האוזניות והתחילו את הרצף שוב.'); return }
            if (audio) demoLog.current = [...demoLog.current, {roundId:nextRound.id,step:step.index + 1,padId:id,scheduledAtMs:audio.scheduledAtMs}].slice(-1000)
          }
          if (step.atMs === 0) demonstrate()
          else timers.current.push(setTimeout(demonstrate, step.atMs))
        }
        timers.current.push(setTimeout(() => {
          if (request !== generation.current) return
          setDemoIndex(null); updateRound(beginSequenceResponse(nextRound)); applyTargetPad(nextRound.pads[0])
          state.current.waitingSince = performance.now(); state.current.turn = 'waiting'; setTurn('waiting')
        }, schedule.responseAtMs))
        return
      }
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
    setMode(next); setError(''); setChosenPads(null); updateRound(null); setSequenceLevel(1)
    const destinationPad = padForInputSource(next, selectedPadRef.current, profileRef.current?.pads.map(p => p.id) || [])
    selectedPadRef.current = destinationPad; setSelectedPad(destinationPad)
    if (next === 'simulation') applyTargetPad(destinationPad)
  }
  const latestNote = rows.find(r => r.source === 'web-midi' && r.receivedMs >= captureSince && r.kind === 'note-on' && !r.duplicate && ports.some(p => p.id === r.port.id))
  const saveProfile = (next: InstrumentProfile) => {
    profileRef.current = next; setProfile(next)
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); setProfileStatus('הכיוון נשמר בדפדפן הזה לפעמים הבאות') }
    catch { setProfileStatus('הכיוון פעיל אך לא נשמר. הורידו גיבוי לפני הסגירה.') }
  }
  const selectPad = (id: PadId) => {
    stop('ready'); selectedPadRef.current = id; setSelectedPad(id)
    const next = mappingFor(profileRef.current, matchProfile(profileRef.current, ports), id)
    state.current.mapping = next; setMapping(next)
  }
  const learn = () => {
    if (!latestNote || latestNote.channel === null || latestNote.note === null) return
    try {
      const next = learnPad(profileRef.current, latestNote.port, learnSlot, latestNote.channel, latestNote.note)
      saveProfile(next); setError(''); selectPad(learnSlot); setCaptureSince(performance.now())
    } catch (e) { setError(e instanceof Error && e.message === 'duplicate-pad' ? 'התו הזה כבר שייך לפד אחר. הקישו על הפד שבחרתם.' : 'זה כלי שונה מהפרופיל. אשרו התאמה לכלי המחובר לפני המשך הכיוון.') }
  }
  const downloadProfile = () => {
    if (!profile) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], {type:'application/json'}))
    const a = document.createElement('a'); a.href = url; a.download = 'habeat-pads-v1.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const importProfile = async (file?: File) => {
    if (!file) return
    if (file.size > 20000) { setError('קובץ הפרופיל גדול מדי'); return }
    const imported = parseProfile(await file.text())
    if (!imported) { setError('קובץ הכיוון אינו תקין או שגרסתו אינה נתמכת'); return }
    stop('ready'); saveProfile(imported); selectPad(imported.pads[0].id)
    setProfileStatus('הפרופיל יובא. אם זהות הכניסה שונה, מבוגר צריך לאשר את ההתאמה ולבדוק כל פד.')
  }
  const confirmPort = (port: InputPort) => {
    if (!profile || !window.confirm('להחיל את הכיוון השמור על הכניסה הזאת? יש לבדוק בפועל כל פד לפני המשחק. שם ודגם זהים אינם מבטיחים מיפוי זהה.')) return
    saveProfile({...profile, port:{id:port.id,name:port.name,manufacturer:port.manufacturer}})
    selectPad(selectedPad)
  }
  const exportReport = () => {
    const report = {
      schema: 3, createdAt: new Date().toISOString(), version: process.env.NEXT_PUBLIC_BUILD_SHA || 'audio-word-sync-integration-candidate',
      url: location.origin + location.pathname, browser: navigator.userAgent, language: navigator.language,
      viewport: { width: innerWidth, height: innerHeight }, capability, equipment, targetDevice: target,
      physicalProof: 'NOT_AUTOMATICALLY_VERIFIED', observation: { physicalActionCount: observed === '' ? null : Number(observed), notes },
      mode, mapping, profile, expectedPad: selectedPad, ports, connections, targetActions, rhythmAccuracy: 'NOT_ASSESSED',
      gameMode, sequenceRound, sequenceLevel, demoTempoMs: demoTempo, demoEvents: [...demoLog.current], timingScore: 'NOT_IMPLEMENTED',
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
    recorder.current.resetFingerprints(); setObserved(''); setNotes(''); demoLog.current = []; updateRound(null)
  }
  const isSequence = gameMode === 'sequence'
  const demonstrationActive = isSequence && turn === 'demonstrating' && toneActive
  const characterActive = inputPulse || demonstrationActive
  const characterPad = demonstrationActive ? selectedPad : feedbackPad
  const displaySequence = sequenceRound?.pads || (gamePads.length ? createSequenceRound(0, gamePads, sequenceLevel).pads : [])
  const activeStep = turn === 'demonstrating' ? demoIndex : turn === 'waiting' ? sequenceRound?.index : null
  const nextLevel = sequenceRound ? nextSequenceLevel(sequenceRound) : null
  return <main dir="rtl" className="min-h-screen p-4 space-y-4 bg-sky-50" style={{ color: BRAND.navy }}>
    <Link href="/" onClick={() => { stop(); controller.current?.disconnect() }} className="inline-flex min-h-12 items-center rounded-xl px-3 py-2 font-bold"><PilotIcon name="home" /> חזרה לבית</Link>
    <h1 className="text-2xl font-black">{isSequence ? 'מנגנים עם הלהקה' : 'התור שלי, התור שלך'}</h1>
    <section aria-label={isSequence ? 'משחק רצפים' : 'משחק תורות'} data-game-mode={gameMode} className="rounded-3xl bg-white p-4 text-center space-y-3 shadow-sm">
      <div className="flex items-end justify-center gap-2 rounded-3xl" data-character-response={characterActive ? "playing" : "idle"} data-cue-source={demonstrationActive ? 'demonstration' : inputPulse ? 'input' : 'idle'} data-response-event-id={inputPulse ? lastAccepted ?? undefined : undefined} data-demo-step={demonstrationActive && demoIndex !== null ? demoIndex + 1 : undefined} data-demo-round-id={demonstrationActive ? sequenceRound?.id : undefined} style={{ outline: characterActive ? `6px solid ${PAD_CUES.find(p => p.id === characterPad)!.color}` : "6px solid transparent" }} aria-label="חברי הלהקה">
        <StaticCharacter character="G" height={isSequence ? 72 : undefined} /><StaticCharacter character="R" height={isSequence ? 72 : undefined} /><StaticCharacter character="M" height={isSequence ? 72 : undefined} />
        {isSequence && <BeatCore character="R" state={beatCoreStateForTurn(turn, toneActive)} size={48} decorative />}
      </div>
      {!isSequence && <div className="flex justify-center"><BeatCore character="R" state={beatCoreStateForTurn(turn, toneActive)} size={84} decorative /></div>}
      {isSequence && <div data-sequence-level={sequenceLevel}>
        <p className="font-black">שלב {sequenceLevel} מתוך 3</p>
        <ol dir="rtl" aria-label="הרצף לנגינה, מימין לשמאל" className="mt-2 flex justify-center gap-2">
          {displaySequence.map((id, index) => { const cue = PAD_CUES.find(p => p.id === id)!; const completed = turn !== 'demonstrating' && index < (sequenceRound?.index || 0); return <li key={index} data-sequence-step={index + 1} data-sequence-pad={id} data-step-active={activeStep === index ? 'true' : 'false'} data-step-complete={completed ? 'true' : 'false'} aria-current={activeStep === index ? 'step' : undefined} aria-label={`צעד ${index + 1}: ${cue.label}${completed ? ', הושלם' : ''}`} className="min-w-0 flex-1 max-w-24 rounded-2xl border-2 border-slate-800 p-2 text-slate-900" style={{background:cue.color,outline:activeStep === index ? '4px solid #1e1b4b' : undefined}}>
            <span className="block text-xs font-bold">{index + 1}</span><span className="block text-2xl" aria-hidden="true">{cue.symbol}</span><span className="block text-xs font-bold min-h-4">{completed ? '✓' : activeStep === index ? turn === 'demonstrating' ? 'מקשיבים' : 'עכשיו' : ''}</span>
          </li>})}
        </ol>
      </div>}
      {(ready || profile) && <div data-target-pad={selectedPad} className="mx-auto max-w-xs rounded-3xl border-4 border-slate-800 p-3" style={{background: PAD_CUES.find(p => p.id === selectedPad)!.color}}>
        <span aria-hidden="true" className={isSequence ? "text-3xl text-slate-900" : "text-5xl text-slate-900"}>{PAD_CUES.find(p => p.id === selectedPad)!.symbol}</span>
        <p className="font-black text-lg text-slate-900">{isSequence && turn === 'demonstrating' ? 'מקשיבים ומסתכלים על הפד ה' : 'מנגנים על הפד ה'}{PAD_CUES.find(p => p.id === selectedPad)!.label}</p>
        <div dir="ltr" className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-white/90 p-2" aria-label="מיקום הפד בכלי, לוח הכפתורים למעלה">
          {PAD_CUES.map(p => <span key={p.id} data-pad-position={p.id} aria-label={p.label} style={{gridRow:p.row,gridColumn:p.column,background:p.color,opacity:p.id === selectedPad ? 1 : 0.3,outline:p.id === selectedPad ? '3px solid #0f172a' : undefined}} className="flex min-h-8 items-center justify-center rounded-full border border-slate-600 font-black text-slate-900">{p.symbol}</span>)}
        </div>
      </div>}
      <p className="text-xl font-black" role="status" data-turn={turn}>{isSequence ? turn === 'waiting' ? 'עכשיו אתם — נגנו לפי הסדר' : turn === 'demonstrating' ? 'הלהקה מדגימה — מקשיבים ומסתכלים' : turn === 'responded' ? sequenceLevel === 3 ? 'ניגנתם רצף של שלוש הקשות!' : 'הרצף הושלם!' : labels[turn] : turn === 'waiting' && targetActions === 2 ? 'התור שלך — נגנו פעמיים' : labels[turn]}</p>
      <p className="text-sm">{isSequence ? 'מקשיבים לרצף, ואז מנגנים את הפדים המסומנים. אפשר לקחת את הזמן ולנסות שוב.' : targetActions === 1 ? 'מקשיבים לצליל אחד, ואז מנגנים פעם אחת.' : 'מקשיבים לשני צלילים, ואז מנגנים פעמיים.'}</p>
      <p data-action-progress data-game-response-id={lastGameEventId ?? undefined} aria-live="polite">{actionsInTurn} מתוך {isSequence ? displaySequence.length : targetActions} פעולות בסבב</p>
      {lastAction && <p className="rounded-xl p-2 font-bold" style={{ background: BRAND.yellow }} data-input-feedback data-input-event-id={lastAccepted ?? undefined}>{lastAction}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button disabled={!ready || busy || (isSequence && !gamePads.length)} onClick={() => void start()} className="rounded-xl p-3 text-white font-bold disabled:opacity-40" style={{ background: BRAND.cyan }}><PilotIcon name={turn === 'ready' ? 'play' : 'hear-again'} /> {turn === 'ready' ? 'התחילו' : isSequence ? 'הרצף שוב' : 'שמעו שוב והתחילו'}</button>
        {isSequence && nextLevel !== null && <button onClick={() => void start(nextLevel)} className="min-h-12 rounded-xl p-3 bg-emerald-200 font-black"><PilotIcon name="next" /> לשלב הבא</button>}
        <button onClick={() => stop()} className="rounded-xl p-3 bg-slate-100 font-bold"><PilotIcon name="stop" /> עצירה</button>
        <button onClick={() => { stop('ready'); if (isSequence) { updateRound(null); setSequenceLevel(1) } }} className="rounded-xl p-3 bg-slate-100 font-bold"><PilotIcon name="try-again" /> {isSequence ? 'משחק חדש' : 'חזרה להתחלה'}</button>
      </div>
      {!ready && <p className="text-sm">לפני שמתחילים, מבוגר מחבר ומכוון את תופי SENOSEN דרך הגדרות הכלי.</p>}
      {mode === 'simulation' && <div className="rounded-xl bg-amber-100 p-3 space-y-2">
        <p className="font-bold">מצב הדמיה לפיתוח — אינו הוכחת חיבור לכלי.</p>
        {isSequence ? <div className="flex flex-wrap justify-center gap-2">{SIM_PADS.map(pad => <button key={pad.id} onClick={() => handle.current('simulation', SIM_PORT, [144, pad.note, 100], performance.now())} className="min-h-12 rounded-xl bg-white p-3 font-bold">הדמיית {PAD_CUES.find(p => p.id === pad.id)!.label}</button>)}</div> : <button onClick={() => handle.current('simulation', SIM_PORT, [144, 60, 100], performance.now())} className="rounded-xl bg-white p-3 font-bold">פעולת הדמיה</button>}
      </div>}
      {error && <p role="alert" className="text-sm font-bold">{error}</p>}
    </section>
    <button aria-expanded={setupOpen} aria-controls="instrument-setup" onClick={() => setSetupOpen(open => !open)} className="rounded-xl bg-white p-3 font-bold">
      {setupOpen && <PilotIcon name="close" />} {setupOpen ? 'סגירת הגדרות הכלי' : 'הגדרות כלי למבוגר'}
    </button>
    {setupOpen && <section id="instrument-setup" aria-label="הגדרות כלי למבוגר" className="rounded-3xl bg-white p-4 space-y-4 shadow-sm">
      <h2 className="text-lg font-black">חיבור וכיוון תופי SENOSEN</h2>
      <p className="text-sm">החיבור מיועד ליציאת MIDI של התופים ולמחשב או לטאבלט עם דפדפן שתומך ב־Web MIDI, כולל Chromebook עם Chrome. משתמשים בכבל נתונים ובמתאם המתאים ליחידה. אין מיפוי תופים קבוע: לומדים כל פד מהקלט שמגיע בפועל ושומרים בדפדפן. תשעת המיקומים מתאימים לפריסה שבתמונה; ארבעת הפדים התכולים נבדלים לפי מיקום ומספר. לוח הכפתורים נמצא למעלה, ושמאל וימין הם מצד הנגן. המבוגר מאמת כל מיקום מול הכלי בפועל; אין זיהוי אוטומטי של צבע פיזי.</p>
      <label className="block font-bold">מקור קלט
        <select value={mode} onChange={e => switchMode(e.target.value as InputEvent['source'])} className="block w-full rounded-xl border p-3 mt-1">
          <option value="web-midi">כלי MIDI — SENOSEN</option><option value="simulation">הדמיית פיתוח בלבד</option>
        </select>
      </label>
      {mode === 'web-midi' && <div className="space-y-3">
        <p>{capability}</p>
        <button disabled={busy} onClick={connect} className="rounded-xl bg-sky-100 p-3 font-bold disabled:opacity-40">בדקו כניסות קלט</button>
        <p role="status">{ports.length ? `כניסות שנמצאו: ${ports.map(p => p.name).join(', ')}` : 'עדיין לא נפתחה כניסת MIDI. חברו את הכלי ולחצו לבדיקה.'}</p>
        <p role="status" data-profile-status>{profileStatus}</p>
        <label className="block font-bold">הפד שמכוונים
          <select value={learnSlot} onChange={e => {setLearnSlot(e.target.value as PadId); setCaptureSince(performance.now())}} className="block w-full rounded-xl border p-3">
            {PAD_CUES.map(p => <option key={p.id} value={p.id}>{p.label} {p.symbol}{profile?.pads.some(x => x.id === p.id) ? ' — שמור' : ''}</option>)}
          </select>
        </label>
        <p className="text-sm">הכו פעם אחת על הפד שנבחר. בדקו שזה התו שמופיע, ואז מפו אותו למשחק. זיהוי כניסה לבדו אינו מאמת חיבור פיזי.</p>
        <p data-latest-note>{latestNote ? `קלט אחרון: ${latestNote.port.name} · ערוץ ${latestNote.channel}, תו ${latestNote.note}, עוצמה ${latestNote.velocity}` : 'ממתינים להקשה חדשה על הפד'}</p>
        <button disabled={!latestNote} onClick={learn} className="rounded-xl bg-sky-100 p-3 font-bold disabled:opacity-40"><PilotIcon name="confirm" /> מפו את התו האחרון למשחק</button>
        {profile && <div className="space-y-2">
          <label className="block font-bold">הפד למשחק<select value={selectedPad} onChange={e => selectPad(e.target.value as PadId)} className="block w-full rounded-xl border p-3">{profile.pads.map(p => <option key={p.id} value={p.id}>{PAD_CUES.find(c => c.id === p.id)!.label} {PAD_CUES.find(c => c.id === p.id)!.symbol}</option>)}</select></label>
          <p>{profile.pads.length} פדים שמורים. כוונו פעם אחת את כל הפדים שבהם תרצו להשתמש.</p>
          {!matchProfile(profile, ports) && ports.map(p => <button key={p.id} onClick={() => confirmPort(p)} className="rounded-xl bg-amber-100 p-3">אישור מבוגר: התאימו פרופיל ל־{p.name}</button>)}
          <button onClick={downloadProfile} className="rounded-xl bg-slate-100 p-3">הורידו גיבוי כיוון</button>
        </div>}
        <label className="block">ייבוא כיוון מגן אחר<input type="file" accept="application/json,.json" onChange={e => {void importProfile(e.target.files?.[0]); e.target.value = ''}} className="block max-w-full" /></label>
        <p className="text-sm">הכיוון נשמר למכשיר ולכתובת האתר האלה. במכשיר או כתובת חדשים אפשר לייבא גיבוי; זהות שונה מחייבת אישור ובדיקת מבוגר.</p>
        {mapping && <p className="font-bold">מיפוי: ערוץ {mapping.channel}, תו {mapping.note}</p>}
      </div>}
      <label className="block font-bold">אופן המשחק
        <select value={gameMode} onChange={e => { stop('ready'); const next = e.target.value as 'sequence' | 'turns'; gameModeRef.current = next; setGameMode(next); updateRound(null); setSequenceLevel(1); if (next === 'turns' && state.current.mode === 'simulation') applyTargetPad('green') }} className="block w-full rounded-xl border p-3 mt-1">
          <option value="sequence">משחק רצפים עם הלהקה</option><option value="turns">תרגול תורות פשוט</option>
        </select>
      </label>
      {isSequence && <div className="space-y-3">
        <label className="block font-bold">רמת פתיחה<select value={sequenceLevel} onChange={e => { stop('ready'); updateRound(null); setSequenceLevel(Number(e.target.value)) }} className="block w-full rounded-xl border p-3"><option value={1}>1 — הקשה אחת</option><option value={2}>2 — שתי הקשות ברצף</option><option value={3}>3 — שלוש הקשות ברצף</option></select></label>
        <label className="block font-bold">מהירות ההדגמה<select value={demoTempo} onChange={e => { stop('ready'); updateRound(null); setDemoTempo(Number(e.target.value)) }} className="block w-full rounded-xl border p-3"><option value={1200}>איטית</option><option value={900}>רגועה</option><option value={650}>מהירה יותר</option></select></label>
        <fieldset className="rounded-xl border p-3"><legend className="font-bold">עד שלושה פדים למשחק, מתוך הכיוון השמור</legend>
          {availablePads.map(id => <label key={id} className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={gamePads.includes(id)} disabled={!gamePads.includes(id) && gamePads.length >= 3} onChange={e => { stop('ready'); updateRound(null); setChosenPads(e.target.checked ? [...gamePads,id] : gamePads.filter(p => p !== id)) }} className="h-6 w-6" />{PAD_CUES.find(p => p.id === id)!.label}</label>)}
          {!gamePads.length && <p className="text-sm">כוונו ובחרו לפחות פד אחד לפני התחלת המשחק.</p>}
        </fieldset>
        <p className="text-sm">ההתקדמות בודקת סדר פדים בלבד. אין ניקוד דיוק בקצב או הגבלת זמן לתשובה. צליל ההדגמה הוא אותו צליל מקורי בכל פד.</p>
      </div>}
      {!isSequence && <label className="block font-bold">רמת הסבב
        <select value={targetActions} onChange={e => { stop('ready'); const count = Number(e.target.value); state.current.targetActions = count; setTargetActions(count) }} className="block w-full rounded-xl border p-3 mt-1">
          <option value={1}>הקשה אחת</option><option value={2}>שתי הקשות</option>
        </select>
      </label>}
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
