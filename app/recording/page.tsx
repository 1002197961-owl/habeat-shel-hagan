'use client'
import { CharacterIntro } from '@/components/characters/CharacterCompanions'

import Link from 'next/link'

import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { BRAND } from '@/lib/constants'

type Clip = { id: number; url: string; name: string; kind: 'audio' | 'video' }

export default function RecordingPage() {
  const [kind, setKind] = useState<'audio' | 'video'>('audio')
  const [recording, setRecording] = useState(false)
  const [clips, setClips] = useState<Clip[]>([])
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const preview = useRef<HTMLVideoElement | null>(null)
  const clipsRef = useRef<Clip[]>([])

  useEffect(() => { clipsRef.current = clips }, [clips])
  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])
  useEffect(() => () => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
    stream.current?.getTracks().forEach(track => track.stop())
    clipsRef.current.forEach(clip => URL.revokeObjectURL(clip.url))
  }, [])

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('הדפדפן אינו תומך בהקלטה. נסו Chrome מעודכן.'); return }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' })
      stream.current = media
      if (preview.current && kind === 'video') preview.current.srcObject = media
      const mime = kind === 'video' ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      const supported = mime.find(type => MediaRecorder.isTypeSupported(type))
      const instance = new MediaRecorder(media, supported ? { mimeType: supported } : undefined)
      recorder.current = instance
      chunks.current = []
      instance.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data) }
      instance.onstop = () => {
        const blob = new Blob(chunks.current, { type: instance.mimeType })
        if (blob.size) setClips(prev => [{ id: Date.now(), url: URL.createObjectURL(blob), name: kind === 'video' ? 'הקליפ שלי' : 'ההקלטה שלי', kind }, ...prev])
        media.getTracks().forEach(track => track.stop())
        if (preview.current) preview.current.srcObject = null
        stream.current = null
        setRecording(false)
      }
      instance.start(250)
      setSeconds(0)
      setRecording(true)
    } catch { setError('צריך לאשר גישה למיקרופון' + (kind === 'video' ? ' ולמצלמה' : '') + ' כדי להקליט. אפשר לנסות שוב.') }
  }
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop() }
  const remove = (id: number) => setClips(prev => { const clip = prev.find(c => c.id === id); if (clip) URL.revokeObjectURL(clip.url); return prev.filter(c => c.id !== id) })

  return <AppShell bg="#fff8f0">
    <BackHeader title="אולפן הקלטה 🎤" bg={BRAND.orange} />
      <div className="px-4 pt-3"><Link href="/guide" className="inline-block rounded-xl bg-white px-3 py-2 text-sm font-bold text-indigo-800 shadow-sm">🎬 איך מקליטים?</Link></div>
    <div className="p-4 space-y-4" dir="rtl">
      <CharacterIntro character="M"><p className="text-sm text-slate-700">בחרו הקלטת קול או צילום קליפ, אשרו גישה למכשיר, ואז לחצו על התחלה. בקשו עזרה מגננת לפני שמצלמים ילדים.</p></CharacterIntro>
      <div className="flex gap-2">
        <button disabled={recording} onClick={() => setKind('audio')} className="flex-1 rounded-xl p-3 font-bold" style={{ background: kind === 'audio' ? BRAND.pink : '#e5e7eb', color: kind === 'audio' ? 'white' : BRAND.navy }}>🎙️ קול</button>
        <button disabled={recording} onClick={() => setKind('video')} className="flex-1 rounded-xl p-3 font-bold" style={{ background: kind === 'video' ? BRAND.purple : '#e5e7eb', color: kind === 'video' ? 'white' : BRAND.navy }}>🎬 וידאו</button>
      </div>
      {kind === 'video' && <video ref={preview} autoPlay muted playsInline aria-label="תצוגה מקדימה של המצלמה" className="w-full rounded-2xl bg-slate-900 min-h-40" />}
      <div className="rounded-2xl p-6 text-center text-white" style={{ background: BRAND.navy }}>
        <p className="text-lg font-bold">{recording ? `🔴 מקליטים · ${seconds} שניות` : 'מוכנים ליצור?'}</p>
        <button onClick={recording ? stop : start} className="mt-4 rounded-xl px-8 py-3 font-black" style={{ background: recording ? '#ef4444' : BRAND.green }}>
          {recording ? '⏹ עצור ושמור במכשיר' : '⏺ התחילו להקליט'}
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-900 text-sm">{error}</p>}
      <h2 className="font-black text-lg" style={{ color: BRAND.navy }}>היצירות שלי במפגש הזה</h2>
      {clips.length === 0 && <p className="text-sm text-slate-600">אחרי ההקלטה, היצירה תופיע כאן להשמעה ולהורדה.</p>}
      {clips.map(clip => <div key={clip.id} className="rounded-xl bg-white p-3 shadow-sm space-y-2">
        <strong>{clip.name}</strong>
        {clip.kind === 'video' ? <video src={clip.url} controls playsInline className="w-full rounded-lg" /> : <audio src={clip.url} controls className="w-full" />}
        <div className="flex gap-2"><a href={clip.url} download={`${clip.name}.${clip.kind === 'video' ? 'webm' : 'webm'}`} className="rounded-lg bg-indigo-700 text-white px-4 py-2 text-sm font-bold">⬇ הורדה</a><button onClick={() => remove(clip.id)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">מחיקה</button></div>
      </div>)}
      <p className="text-xs text-slate-600">ההקלטות נשמרות זמנית בדפדפן. הורידו אותן לפני סגירת העמוד. פרסום ושיתוף יתווספו בהמשך.</p>
    </div>
  </AppShell>
}
