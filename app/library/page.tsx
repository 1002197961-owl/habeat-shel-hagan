'use client'
import { CharacterIntro } from '@/components/characters/CharacterCompanions'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { NarrationReader } from '@/components/audio/NarrationReader'
import { useNarration } from '@/hooks/useNarration'
import { NARRATION } from '@/lib/narrationCatalog'
import { BRAND } from '@/lib/constants'
import { playMusic, stopMusic } from '@/lib/audio'
import { CATALOG_KEY, CATALOG_URL, DEMO_TRACKS, playableCatalogRow, getApprovedRecording, type LibraryTrack } from '@/lib/catalog'

export default function LibraryPage() {
  const [playing,setPlaying] = useState<string|null>(null)
  const [catalog,setCatalog] = useState<LibraryTrack[]>(DEMO_TRACKS)
  const [source,setSource] = useState<'loading'|'live'|'fallback'>('loading')
  const [message,setMessage] = useState('')
  const narration = useNarration()
  const requestId = useRef(0)
  const request = useRef<AbortController|null>(null)
  const recording = useRef<HTMLAudioElement|null>(null)
  const objectUrl = useRef<string|null>(null)
  const stop = () => {
    requestId.current++; request.current?.abort(); request.current=null
    stopMusic()
    if (recording.current) { recording.current.pause(); recording.current.removeAttribute('src'); recording.current.load(); recording.current=null }
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current=null }
  }
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(),8000)
    fetch(`${CATALOG_URL}/rest/v1/song_catalog?select=*&published=eq.true&rights_status=eq.cleared&order=sort_order.asc`,{
      headers:{apikey:CATALOG_KEY},signal:controller.signal,
    }).then(async r => {if(!r.ok)throw new Error('catalog');return r.json()})
      .then((rows:unknown) => {
        if (!Array.isArray(rows)) throw new Error('catalog')
        const approved=rows.map(playableCatalogRow).filter((t):t is LibraryTrack => t!==null)
        setCatalog(approved); setSource('live')
      }).catch(() => {setSource('fallback')})
      .finally(() => clearTimeout(timeout))
    return () => {clearTimeout(timeout);controller.abort()}
  },[])
  useEffect(() => {
    const leave = () => {stop();setPlaying(null)}
    window.addEventListener('pagehide',leave)
    return () => {window.removeEventListener('pagehide',leave);stop()}
  },[])
  const toggle = async (track:LibraryTrack) => {
    const wasPlaying = playing===track.id
    stop(); narration.reset(); setPlaying(null); setMessage('')
    if(wasPlaying)return
    const current=requestId.current
    setPlaying(track.id)
    try {
      if(track.audio.kind==='builtin') {
        await playMusic(track.audio.id,() => {if(current===requestId.current)setPlaying(null)})
      } else {
        const controller = new AbortController();request.current=controller
        const url=await getApprovedRecording(track,controller.signal)
        if(current!==requestId.current){URL.revokeObjectURL(url);return}
        objectUrl.current=url
        const audio=new Audio(url);recording.current=audio
        audio.onended=() => {if(current===requestId.current){stop();setPlaying(null)}}
        audio.onerror=() => {if(current===requestId.current){stop();setPlaying(null);setMessage('השמע אינו זמין כרגע. נסו שוב.')}}
        await audio.play()
      }
    } catch {
      if(current!==requestId.current)return
      stop();setPlaying(null);setMessage('לא הצלחנו להשמיע. בדקו את החיבור ואת עוצמת הקול ונסו שוב.')
    }
  }
  return <AppShell bg="#f0f9ff">
    <BackHeader title="ספריית השירים 🎵" bg={BRAND.cyan} onBack={() => { stop(); narration.reset() }}/>
    <div className="p-4 space-y-4" dir="rtl">
      <Link href="/guide" className="inline-flex min-h-12 items-center rounded-xl px-3 py-2 text-base font-bold text-indigo-800">🎬 צפו בהדרכת הספרייה</Link>
      <CharacterIntro character="G"><p className="text-sm text-slate-700 font-semibold">בחרו קטע, הקשיבו לצלילים והצטרפו לקצב. אפשר לשמוע שוב כמה שרוצים.</p></CharacterIntro>
      {source==='fallback' && <p className="text-sm text-amber-900 bg-amber-50 rounded-xl p-2">אין כרגע חיבור לקטלוג. שלושת קטעי ההתנסות זמינים במכשיר.</p>}
      {source==='live' && !catalog.length && <p role="status">עדיין אין שירים מאושרים להשמעה.</p>}
      {catalog.map(track => <section key={track.id} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4" aria-label={track.title}>
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{track.emoji}</span>
          <div className="flex-1"><h2 className="font-black text-lg" style={{color:BRAND.navy}}>{track.title}</h2><p className="text-sm text-slate-600">{track.audio.kind==='builtin'?'קטע אינסטרומנטלי מקורי':track.audio.format==='sung'?'הקלטת שירה':'קטע אינסטרומנטלי'} · {track.duration}</p></div>
        </div>
        {!track.narrationId && <p className="my-3 text-base text-slate-700">{track.prompt}</p>}
        <button type="button" onClick={() => toggle(track)} className="mt-3 w-full rounded-xl px-3 py-3 font-bold text-white" style={{background:playing===track.id?BRAND.navy:BRAND.purple}} aria-label={`${playing===track.id?'עצור':'נגן'} ${track.title}`}>
          {playing===track.id?'⏹ עצור':'▶ השמיעו לי'}
        </button>
        {track.narrationId && <NarrationReader asset={NARRATION[track.narrationId]} player={narration} label={`ההסבר על ${track.title}`} beforePlay={() => {stop();setPlaying(null);setMessage('')}}/>}
      </section>)}
      {message && <p role="status" className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">{message}</p>}
      <p className="text-sm text-slate-600">שירים מוכרים יצטרפו לספרייה לאחר אישור הזכויות וההקלטה.</p>
    </div>
  </AppShell>
}
