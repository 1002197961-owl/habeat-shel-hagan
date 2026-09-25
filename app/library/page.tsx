'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { BRAND } from '@/lib/constants'
import { playMusic, stopMusic, speakHebrew, type DemoTrack } from '@/lib/audio'

type Track = { id: DemoTrack; title: string; emoji: string; duration: string; color: string; prompt: string }
const tracks: Track[] = [
  { id: 'garden-hello', title: 'בוקר של צלילים', emoji: '☀️', duration: 'כ־19 שניות', color: '#FFD600', prompt: 'בואו נקשיב, נמחא כפיים ונצטרף לקצב!' },
  { id: 'rain-dance', title: 'טיפות רוקדות', emoji: '🌧️', duration: 'כ־24 שניות', color: '#00B4E6', prompt: 'איך נשמעות טיפות של גשם? בואו ננסה!' },
  { id: 'color-parade', title: 'מצעד הצבעים', emoji: '🎨', duration: 'כ־16 שניות', color: '#FF4DA6', prompt: 'כל צבע מקבל צליל. בחרו צבע והצטרפו!' },
]

export default function LibraryPage() {
  const [playing, setPlaying] = useState<DemoTrack | null>(null)
  const [catalog, setCatalog] = useState<Track[]>(tracks)
  const [catalogSource, setCatalogSource] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [message, setMessage] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch('https://oqwzjhqzjfhdlploezad.supabase.co/rest/v1/song_catalog?select=id,title,emoji,color,builtin_audio_id,rights_status,published&published=eq.true&rights_status=eq.cleared&order=sort_order.asc', {
      headers: { apikey: 'sb_publishable_fDE7XnJ7POVT_UkylwNDcA_Eh3jdPVG' }, signal: controller.signal,
    }).then(async response => { if (!response.ok) throw new Error('catalog'); return response.json() })
      .then((rows: { id: string; title: string; emoji: string; color: string; builtin_audio_id: string | null }[]) => {
        const available = rows.filter(row => tracks.some(track => track.id === row.builtin_audio_id))
          .map(row => ({ ...tracks.find(track => track.id === row.builtin_audio_id)!, title: row.title, emoji: row.emoji, color: row.color }))
        if (available.length) { setCatalog(available); setCatalogSource('live') } else setCatalogSource('fallback')
      }).catch(() => { if (!controller.signal.aborted) setCatalogSource('fallback') })
    return () => controller.abort()
  }, [])
  useEffect(() => () => { stopMusic(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  const toggle = async (id: DemoTrack) => {
    if (playing === id) { stopMusic(); setPlaying(null); return }
    try {
      setMessage('')
      setPlaying(id)
      await playMusic(id, () => setPlaying(current => current === id ? null : current))
    } catch {
      setPlaying(null)
      setMessage('לא הצלחנו להשמיע. בדקו שהצליל במכשיר פעיל ונסו שוב.')
    }
  }

  return <AppShell bg="#f0f9ff">
    <BackHeader title="ספריית השירים 🎵" bg={BRAND.cyan} />
    <div className="p-4 space-y-4" dir="rtl">
      <Link href="/guide" className="inline-block text-sm font-bold text-indigo-800">🎬 צפו בהדרכת הספרייה</Link>
      <p className="text-sm text-slate-700 font-semibold">בחרו קטע, הקשיבו לצלילים והצטרפו לקצב. אפשר לשמוע שוב כמה שרוצים.</p>
      {catalogSource === 'fallback' && <p className="text-xs text-amber-900 bg-amber-50 rounded-xl p-2">אין כרגע חיבור לקטלוג. שלושת קטעי ההתנסות זמינים במכשיר.</p>}
      {catalog.map(track => <section key={track.id} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4" aria-label={track.title}>
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{track.emoji}</span>
          <div className="flex-1"><h2 className="font-black text-lg" style={{color:BRAND.navy}}>{track.title}</h2><p className="text-xs text-slate-600">קטע אינסטרומנטלי מקורי · {track.duration}</p></div>
        </div>
        <p className="my-3 text-sm text-slate-700">{track.prompt}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => toggle(track.id)} className="flex-1 rounded-xl px-3 py-3 font-bold text-white" style={{background: playing === track.id ? BRAND.navy : BRAND.purple}} aria-label={`${playing === track.id ? 'עצור' : 'נגן'} ${track.title}`}>
            {playing === track.id ? '⏹ עצור' : '▶ השמיעו לי'}
          </button>
          <button type="button" onClick={() => { if (!speakHebrew(`${track.title}. ${track.prompt}`)) setMessage('אין הקראה במכשיר הזה. נסו בדפדפן Chrome עם קול בעברית.') }} className="rounded-xl px-3 py-3 font-bold border-2" style={{borderColor:track.color,color:BRAND.navy}} aria-label={`הקרא את ההסבר על ${track.title}`}>
            🔊 הקראו לי
          </button>
        </div>
      </section>)}
      {message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{message}</p>}
      <p className="text-xs text-slate-600">שירים מוכרים יצטרפו לספרייה לאחר הוספת שמע והסדרת זכויות.</p>
    </div>
  </AppShell>
}
