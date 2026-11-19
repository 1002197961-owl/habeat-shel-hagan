'use client'
import Link from 'next/link'
import './turn-taking.css'
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
  const [setupStep, setSetupStep] = useState<'connect' | 'calibrate' | 'options' | 'pads' | 'backup' | 'report' | 'log'>('connect')
  const [armed, setArmed] = useState(false)
  const [logPage, setLogPage] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (setupOpen) dialog.current?.showModal(); else dialog.current?.close()
  }, [setupOpen])
  useEffect(() => {
    setArmed(false)
    if (setupOpen) dialog.current?.querySelector<HTMLElement>('h2')?.focus()
  }, [setupStep, setupOpen])
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
      if (restored) { state.current.mapping = restored; setMapping(restored); setProfileStatus('הכלי המוכר זוהה — הכיוון השמור נטען'); setError(previous => previous.startsWith('הכלי נותק') ? '' : previous) }
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
  const gamePads = chosenPads === null ? availablePads : chosenPads.filter(id => availablePads.includes(id))
  const openSetup = (step: typeof setupStep = ready ? 'options' : 'connect') => { stop('ready'); setSetupStep(step); setSetupOpen(true) }
  const start = async (levelOverride?: number) => {
    const previousRound = roundRef.current
    stop('ready'); setError('')
    if (!ready) { openSetup('connect'); return }
    const level = levelOverride ?? sequenceLevel
    if (gameModeRef.current === 'sequence' && gamePads.length < level) { setSequenceLevel(level); updateRound(null); setError(`לרצף הזה צריך ${level} פדים שונים. כוונו עוד פד או בחרו רמה קצרה יותר.`); openSetup('calibrate'); return }
    if (gameModeRef.current === 'sequence' && !gamePads.length) { setError('בחרו לפחות פד מכויל אחד למשחק.'); return }
    const request = generation.current; setBusy(true)
    try {
      const nextRound = gameModeRef.current === 'sequence' ? previousRound && levelOverride === undefined && previousRound.level === level && previousRound.pads.every(id => gamePads.includes(id))
        ? { ...previousRound, id: ++roundCounter.current, index: 0, phase: 'demonstrating' as const, mistakes: 0, lastEventId: null }
        : createSequenceRound(++roundCounter.current, gamePads, level) : null
      await tone.current!.prepare()
      if (request !== generation.current) return
      setBusy(false); state.current.turn = 'demonstrating'; setTurn('demonstrating')
      if (nextRound) {
        setSequenceLevel(nextRound.level); updateRound(nextRound); setSetupOpen(false)
        const schedule = sequenceDemoSchedule(nextRound.pads.length, demoTempo)
        const audioStart = tone.current!.clock + 0.08
        for (const step of schedule.steps) {
          const audio = tone.current!.play(audioStart + step.atMs / 1000)
          if (!audio) { stop(); setError('השמע נעצר. התחילו שוב.'); return }
          demoLog.current = [...demoLog.current, {roundId:nextRound.id,step:step.index + 1,padId:nextRound.pads[step.index],scheduledAtMs:audio.scheduledAtMs}].slice(-1000)
          const demonstrate = () => {
            if (request !== generation.current) return
            const id = nextRound.pads[step.index]
            setDemoIndex(step.index); applyTargetPad(id)
            timers.current.push(setTimeout(() => { if (request === generation.current) setDemoIndex(null) }, 240))
          }
          timers.current.push(setTimeout(demonstrate, step.atMs + 80))
        }
        timers.current.push(setTimeout(() => {
          if (request !== generation.current) return
          setDemoIndex(null); updateRound(beginSequenceResponse(nextRound)); applyTargetPad(nextRound.pads[0])
          state.current.waitingSince = performance.now(); state.current.turn = 'waiting'; setTurn('waiting')
        }, schedule.responseAtMs + 80))
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
  useEffect(() => {
    if (!setupOpen || setupStep !== 'calibrate' || !armed || !latestNote) return
    setArmed(false); learn()
    // A fresh note is learned once, only after the adult selects a physical pad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNote?.id, armed, setupOpen, setupStep])
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
  const displaySequence = sequenceRound?.pads || (gamePads.length >= sequenceLevel ? createSequenceRound(roundCounter.current + 1, gamePads, sequenceLevel).pads : [])
  const activeStep = turn === 'demonstrating' ? demoIndex : turn === 'waiting' ? sequenceRound?.index : null
  const nextLevel = sequenceRound ? nextSequenceLevel(sequenceRound) : null
  const cue = PAD_CUES.find(p => p.id === selectedPad)!
  const stepTitle = {connect:'1 · מחברים את התופים', calibrate:'2 · בוחרים פד ומקישים', options:'3 · מוכנים למשחק', pads:'בחירת פדים למשחק', backup:'גיבוי והחלפת כלי', report:'אבחון ושמירת דוח למבוגר', log:'יומן קלט'}[setupStep]
  const closeSetup = () => { setArmed(false); setSetupOpen(false) }
  return <main dir="rtl" className="turn-screen" style={{ color: BRAND.navy }}>
    <header className="turn-header">
      <Link href="/" onClick={() => { stop(); controller.current?.disconnect() }} aria-label="חזרה לבית"><PilotIcon name="home" /></Link>
      <h1>{isSequence ? 'מנגנים עם הלהקה' : 'התור שלי, התור שלך'}</h1>
      <button onClick={() => openSetup()} aria-label="הגדרות כלי למבוגר">הגדרות</button>
    </header>
    <section aria-label={isSequence ? 'משחק רצפים' : 'משחק תורות'} data-game-mode={gameMode} className="turn-stage">
      <div className="turn-band" data-character-response={characterActive ? 'playing' : 'idle'} data-cue-source={demonstrationActive ? 'demonstration' : inputPulse ? 'input' : 'idle'} data-response-event-id={inputPulse ? lastAccepted ?? undefined : undefined} data-demo-step={demonstrationActive && demoIndex !== null ? demoIndex + 1 : undefined} data-demo-round-id={demonstrationActive ? sequenceRound?.id : undefined} style={{ outline: characterActive ? `4px solid ${PAD_CUES.find(p => p.id === characterPad)!.color}` : '4px solid transparent' }} aria-label="חברי הלהקה">
        <StaticCharacter character="G" height={64} /><StaticCharacter character="R" height={64} /><StaticCharacter character="M" height={64} />
        <BeatCore character="R" state={beatCoreStateForTurn(turn, toneActive)} size={40} decorative />
      </div>
      <p className="turn-status" role="status" data-turn={turn}>{isSequence ? turn === 'waiting' ? 'עכשיו אתם — נגנו לפי הסדר' : turn === 'demonstrating' ? toneActive ? 'מקשיבים למקצב של הלהקה' : 'מנוחה — עוד מעט תורכם' : turn === 'responded' ? 'הרצף הושלם!' : labels[turn] : turn === 'waiting' && targetActions === 2 ? 'התור שלך — נגנו פעמיים' : labels[turn]}</p>
      {isSequence && <div data-sequence-level={sequenceLevel}>
        <p className="turn-caption">שלב {sequenceLevel} מתוך 3 · {sequenceLevel === 3 ? 'טָם · טַ־טַ · מנוחה' : sequenceLevel === 2 ? 'טָם · טָם · מנוחה' : 'טָם · מקשיבים עד התור שלנו'}</p>
        <ol dir="rtl" aria-label="הרצף לנגינה, מימין לשמאל" className="turn-sequence">
          {displaySequence.map((id, index) => { const p = PAD_CUES.find(p => p.id === id)!; const complete = turn !== 'demonstrating' && index < (sequenceRound?.index || 0); return <li key={index} data-sequence-step={index + 1} data-sequence-pad={id} data-step-active={activeStep === index ? 'true' : 'false'} data-step-complete={complete ? 'true' : 'false'} aria-current={activeStep === index ? 'step' : undefined} aria-label={`צעד ${index + 1}: ${p.label}${complete ? ', הושלם' : ''}`} style={{background:p.color,outline:activeStep === index ? '4px solid #1e1b4b' : undefined}}>
            <span>{index + 1}</span><strong aria-hidden="true">{p.symbol}</strong><span>{complete ? '✓' : activeStep === index ? turn === 'demonstrating' ? 'מקשיבים' : 'עכשיו' : ' '}</span>
          </li>})}
        </ol>
      </div>}
      {(ready || profile) ? <div data-target-pad={selectedPad} className="turn-target" style={{borderColor:cue.color}}>
        <p className="font-black">{turn === 'demonstrating' ? 'מקשיבים: ' : 'הפד הבא: '}{cue.label}</p>
        <div dir="ltr" className="turn-pad-map" aria-label="מיקום הפד בכלי, לוח הכפתורים למעלה">
          {PAD_CUES.map(p => <span key={p.id} data-pad-position={p.id} aria-label={p.label} style={{gridRow:p.row,gridColumn:p.column,background:p.color,opacity:p.id === selectedPad ? 1 : 0.35,outline:p.id === selectedPad ? '3px solid #0f172a' : undefined}}>{p.symbol}</span>)}
        </div>
      </div> : <p className="turn-welcome">מחברים תופים, מקשיבים ללהקה ומנגנים יחד.<br />לחצו על ״התחילו״ ונחבר את הכלי.</p>}
      <p data-action-progress data-game-response-id={lastGameEventId ?? undefined} aria-live="polite">{actionsInTurn} מתוך {isSequence ? sequenceLevel : targetActions} פעולות בסבב</p>
      <p className="turn-feedback" data-input-feedback data-input-event-id={lastAccepted ?? undefined} aria-live="polite">{lastAction || (turn === 'waiting' ? 'אפשר לקחת את הזמן ולנסות שוב' : '\u00a0')}</p>
      {error && !setupOpen && <p role="alert" className="turn-error">{error}</p>}
      {mode === 'simulation' && <div className="turn-simulation"><p>הדמיית פיתוח — ללא כלי פיזי</p><div>
        {(isSequence ? SIM_PADS : SIM_PADS.slice(0,1)).map(pad => <button key={pad.id} onClick={() => handle.current('simulation', SIM_PORT, [144, pad.note, 100], performance.now())}>{isSequence ? `הדמיית ${PAD_CUES.find(p => p.id === pad.id)!.label}` : 'פעולת הדמיה'}</button>)}
      </div></div>}
    </section>
    <footer className="turn-actions">
      {isSequence && nextLevel !== null ? <button className="turn-primary" onClick={() => void start(nextLevel)}><PilotIcon name="next" /> {gamePads.length >= nextLevel ? 'לשלב הבא' : 'כוונו פד נוסף לשלב הבא'}</button> : <button disabled={busy} className="turn-primary" onClick={() => void start()}><PilotIcon name={turn === 'ready' ? 'play' : 'hear-again'} /> {busy ? 'מכינים את השמע…' : turn === 'ready' ? 'התחילו' : isSequence ? 'הרצף שוב' : 'שמעו שוב והתחילו'}</button>}
      <div className="turn-secondary">
        <button onClick={() => stop()}><PilotIcon name="stop" /> עצירה</button>
        {isSequence && nextLevel !== null && <button onClick={() => void start()}><PilotIcon name="hear-again" /> הרצף שוב</button>}
        <button onClick={() => { stop('ready'); updateRound(null); setSequenceLevel(1) }}><PilotIcon name="try-again" /> משחק חדש</button>
      </div>
    </footer>
    <dialog ref={dialog} className="turn-dialog" aria-labelledby="setup-title" onCancel={closeSetup} onClose={closeSetup}>
      <header><h2 id="setup-title" tabIndex={-1}>{stepTitle}</h2><button aria-label="סגירת הגדרות הכלי" onClick={closeSetup}><PilotIcon name="close" /></button></header>
      <div className="turn-dialog-page" key={setupStep}>
        {setupStep === 'connect' && <>
          <p>חברו את יציאת MIDI של SENOSEN בכבל נתונים למחשב או לטאבלט התומך ב־Web MIDI.</p>
          <button className="turn-primary" disabled={busy} onClick={connect}>{busy ? 'מחפשים את הכלי…' : 'חיבור התופים'}</button>
          <p role="status">{ports.length ? `נמצא: ${ports.map(p => p.name).join(', ')}` : capability}</p>
          <p data-profile-status>{profileStatus}</p>
          {profile && !matchProfile(profile, ports) && ports.map(p => <button key={p.id} onClick={() => confirmPort(p)}>אישור מבוגר: התאימו פרופיל ל־{p.name}</button>)}
          <button disabled={!ports.length && mode !== 'simulation'} onClick={() => setSetupStep(ready && gamePads.length >= sequenceLevel ? 'options' : 'calibrate')}>{ready ? 'הכיוון נשמר — ממשיכים' : 'הבא — כיוון הפדים'}</button>
          <button onClick={() => setSetupStep('backup')}>ייבוא כיוון או הדמיית פיתוח</button>
        </>}
        {setupStep === 'calibrate' && <>
          <p>בחרו כאן את הפד, ואז הקישו עליו פעם אחת בתופים. הכיוון יישמר אוטומטית.</p>
          <p className="turn-caption">לרצף של 3: כוונו למשל תכלת 1, סגול וירוק. המיקומים הם מצד הנגן, לוח הכפתורים למעלה.</p>
          <div dir="ltr" className="turn-calibration" aria-label="בחירת הפד לכיוון">{PAD_CUES.map(p => <button key={p.id} aria-label={`כיוון ${p.label}`} aria-pressed={armed && learnSlot === p.id} style={{gridRow:p.row,gridColumn:p.column,background:p.color}} disabled={!ports.length || mode !== 'web-midi'} onClick={() => {setLearnSlot(p.id);setCaptureSince(performance.now());setArmed(true);setError('')}}><strong>{p.symbol}</strong><small>{profile?.pads.some(x=>x.id===p.id) ? '✓ שמור' : p.label.split(' — ')[0]}</small></button>)}</div>
          <p role="status" data-latest-note>{armed ? `הקישו עכשיו על הפד ה${PAD_CUES.find(p => p.id === learnSlot)!.label}` : `${profile?.pads.length || 0} פדים שמורים. בחרו פד נוסף או המשיכו.`}</p>
          <p className="turn-caption">אין זיהוי אוטומטי של צבע: בדקו שהפד שבחרתם תואם לכלי.</p>
          <button className="turn-primary" disabled={!ready} onClick={() => {setArmed(false);setSetupStep('options')}}>הבא — למשחק</button>
          <button onClick={() => setSetupStep('connect')}>חזרה לחיבור</button>
        </>}
        {setupStep === 'options' && <>
          <label>אופן המשחק<select value={gameMode} onChange={e => {stop('ready'); const next=e.target.value as 'sequence'|'turns';gameModeRef.current=next;setGameMode(next);updateRound(null);setSequenceLevel(1);if(next==='turns' && mode==='simulation')applyTargetPad('green')}}><option value="sequence">משחק רצפים עם הלהקה</option><option value="turns">תרגול תורות פשוט</option></select></label>
          {isSequence ? <>
            <label>רמת פתיחה<select value={sequenceLevel} onChange={e=>{stop('ready');updateRound(null);setSequenceLevel(Number(e.target.value))}}>{[1,2,3].map(n=><option key={n} value={n} disabled={gamePads.length<n}>{n} — {n} {n===1?'הקשה':'הקשות בפדים שונים'}{gamePads.length<n?' (נדרשים עוד פדים)':''}</option>)}</select></label>
            <label>מהירות ההדגמה<select value={demoTempo} onChange={e=>{stop('ready');updateRound(null);setDemoTempo(Number(e.target.value))}}><option value={1200}>איטית — 50 פעימות בדקה</option><option value={900}>רגועה — כ־67 פעימות בדקה</option><option value={650}>מהירה יותר — כ־92 פעימות בדקה</option></select></label>
            <p className="turn-caption">תיבה של 4 פעימות, עם מנוחה לפני תור הילד. ההתקדמות בודקת סדר פדים; אין מגבלת זמן או ציון דיוק בקצב.</p>
          </> : <label>רמת הסבב<select value={targetActions} onChange={e=>{stop('ready');const n=Number(e.target.value);state.current.targetActions=n;setTargetActions(n)}}><option value={1}>הקשה אחת</option><option value={2}>שתי הקשות</option></select></label>}
          {gamePads.length<3 && isSequence && <p>כרגע {gamePads.length} פדים זמינים. כדי להגיע לשלוש הקשות שונות, כוונו ובחרו לפחות 3.</p>}
          <button className="turn-primary" disabled={!ready || (isSequence && gamePads.length<sequenceLevel)} onClick={closeSetup}>סיימנו לכוון, חוזרים למשחק</button>
          <div className="turn-options-grid"><button onClick={()=>setSetupStep('calibrate')}>כיוון פדים</button><button onClick={()=>setSetupStep('pads')}>פדים למשחק</button><button onClick={()=>setSetupStep('backup')}>כלי וגיבוי</button><button onClick={()=>setSetupStep('report')}>אבחון ושמירת דוח למבוגר</button></div>
        </>}
        {setupStep === 'pads' && <>
          <p>הרצף ישתמש בפדים המסומנים בלבד, בלי לחזור על אותו פד באותו רצף.</p>
          <div className="turn-options-grid">{availablePads.map(id=><label key={id} className="turn-check"><input type="checkbox" checked={gamePads.includes(id)} onChange={e=>{stop('ready');updateRound(null);setChosenPads(e.target.checked?[...gamePads,id]:gamePads.filter(p=>p!==id));setSequenceLevel(1)}} />{PAD_CUES.find(p=>p.id===id)!.label}</label>)}</div>
          {!availablePads.length && <p>אין עדיין פדים מכוילים.</p>}
          {!isSequence && profile && <label>הפד למשחק<select value={selectedPad} onChange={e=>selectPad(e.target.value as PadId)}>{profile.pads.map(p=><option key={p.id} value={p.id}>{PAD_CUES.find(c=>c.id===p.id)!.label}</option>)}</select></label>}
          <button onClick={()=>setSetupStep('options')}>חזרה להגדרות המשחק</button>
        </>}
        {setupStep === 'backup' && <>
          <label>מקור קלט<select value={mode} onChange={e=>switchMode(e.target.value as InputEvent['source'])}><option value="web-midi">כלי MIDI — SENOSEN</option><option value="simulation">הדמיית פיתוח בלבד</option></select></label>
          <button onClick={()=>setSetupStep(mode==='simulation'?'options':'connect')}>{mode==='simulation'?'ממשיכים בהדמיה':'חיבור כלי MIDI'}</button>
          <button disabled={!profile} onClick={downloadProfile}>הורידו גיבוי כיוון</button>
          <label>ייבוא כיוון מגן אחר<input type="file" accept="application/json,.json" onChange={e=>{void importProfile(e.target.files?.[0]);e.target.value=''}} /></label>
          <p data-profile-status>{profileStatus}</p>
          <p>הכיוון נשמר בדפדפן ובכתובת האלה. בכלי שונה נדרש אישור מבוגר ובדיקת הפדים.</p>
          <button onClick={()=>setSetupStep('options')}>חזרה להגדרות המשחק</button>
        </>}
        {setupStep === 'report' && <>
          <p>הדוח יורד למכשיר בלבד. אין להזין פרטים של ילדים.</p>
          <label>ציוד וכבל<input value={equipment} onChange={e=>setEquipment(e.target.value)} /></label>
          <label>מכשיר ודפדפן<input value={target} onChange={e=>setTarget(e.target.value)} /></label>
          <label>מספר פעולות פיזיות שנצפו<input type="number" min="0" step="1" value={observed} onChange={e=>setObserved(e.target.value)} /></label>
          <label>הערות לבדיקה<input value={notes} onChange={e=>setNotes(e.target.value)} /></label>
          <div className="turn-options-grid"><button onClick={exportReport}>הורידו דוח JSON</button><button onClick={()=>{setLogPage(0);setSetupStep('log')}}>יומן קלט</button><button onClick={clear}>התחילו מדידה חדשה</button><button onClick={()=>setSetupStep('options')}>חזרה למשחק</button></div>
        </>}
        {setupStep === 'log' && <>
          <p>תגובות: {totalAccepted.current} · כפילויות שסוננו: {totalDuplicate.current} · סבבים: {completedRounds.current}</p>
          <ol aria-label="יומן קלט" className="turn-log">{rows.slice(logPage*4,logPage*4+4).map(row=><li key={row.id}>#{row.id} · {row.source==='simulation'?'הדמיה':row.port.name} · {row.bytes.join(', ')} · {reasons[row.decision]||row.decision}</li>)}</ol>
          <div className="turn-options-grid"><button disabled={logPage===0} onClick={()=>setLogPage(p=>p-1)}>הקודם</button><button disabled={(logPage+1)*4>=rows.length} onClick={()=>setLogPage(p=>p+1)}>הבא</button></div>
          <p>בדיקת תוכנה אינה הוכחה לפעולת כלי פיזי.</p><button onClick={()=>setSetupStep('report')}>חזרה לדוח</button>
        </>}
        {error && <p role="alert" className="turn-error">{error}</p>}
      </div>
    </dialog>
  </main>
}
