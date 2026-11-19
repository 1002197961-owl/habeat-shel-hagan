'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import recordings from '@/data/magic-song-recordings.json'
import { findMagicSongRecording, type MagicSongAnswers } from '@/lib/magicSong'
import { useMagicSong } from '@/hooks/useMagicSong'
import { BRAND } from '@/lib/constants'
import { playMusic, stopMusic } from '@/lib/audio'
import { DEMO_TRACKS } from '@/lib/catalog'
import { PilotIcon } from '@/components/ui/PilotIcon'

export interface MagicSongPlayerHandle { reset: () => void }

export const MagicSongPlayer = forwardRef<MagicSongPlayerHandle, {
  answers: MagicSongAnswers; lines: string[]; beforePlay: () => void
}>(function MagicSongPlayer({ answers, lines, beforePlay }, ref) {
  const recording = useMemo(() => findMagicSongRecording(recordings, answers, lines), [answers, lines])
  const player = useMagicSong(recording)
  const [accompaniment, setAccompaniment] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [accompanimentError, setAccompanimentError] = useState('')
  const accompanimentGeneration = useRef(0)
  const backingId = answers[6] === 'מהיר' ? 'color-parade' : answers[6] === 'איטי' ? 'rain-dance' : 'garden-hello'
  const backing = DEMO_TRACKS.find(track => track.id === backingId)!
  const stopAccompaniment = useCallback(() => {
    accompanimentGeneration.current++
    stopMusic(); setAccompaniment('idle')
  }, [])
  const resetAll = useCallback(() => { player.reset(); stopAccompaniment() }, [player.reset, stopAccompaniment])
  useImperativeHandle(ref, () => ({ reset: resetAll }), [resetAll])
  useEffect(() => {
    const leave = () => { accompanimentGeneration.current++; stopMusic(); setAccompaniment('idle') }
    const hide = () => { if (document.hidden) leave() }
    window.addEventListener('pagehide', leave)
    window.addEventListener('popstate', leave)
    document.addEventListener('visibilitychange', hide)
    return () => {
      accompanimentGeneration.current++; stopMusic()
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('popstate', leave)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])
  const playAccompaniment = async () => {
    resetAll(); beforePlay(); setAccompanimentError('')
    const current = ++accompanimentGeneration.current
    setAccompaniment('loading')
    try {
      await playMusic(backingId, () => { if (current === accompanimentGeneration.current) setAccompaniment('idle') })
      if (current === accompanimentGeneration.current) setAccompaniment('playing')
    } catch {
      if (current === accompanimentGeneration.current) {
        stopAccompaniment(); setAccompanimentError('הליווי לא הושמע. בדקו שהצליל במכשיר פעיל ונסו שוב.')
      }
    }
  }
  const active = player.status === 'playing' || player.status === 'loading'
  const start = () => { stopAccompaniment(); beforePlay(); void player.play() }
  return <section dir="rtl" lang="he" aria-label="נגן שיר הקסם" data-magic-song-player
    data-song-configured={recording ? 'true' : 'false'} data-song-available={player.verified ? 'true' : 'false'} className="mt-4 rounded-xl border border-white/30 p-3 text-white">
    {!recording ? <p role="status" className="text-sm leading-relaxed" data-song-unavailable>
      המילים מוכנות. הקלטת שירה שמתאימה לבחירות האלה עדיין אינה זמינה.
      אפשר להקריא את המילים או להקליט ביצוע משלכם.
    </p> : <>
      <p className="text-sm font-bold">🎵 נגן השיר</p>
      <p data-song-transcript className="mt-3 text-lg font-bold leading-loose">
        {recording.words.map((cue, index) => <span key={index}>
          <span data-song-word={index} data-active-word={player.state.wordIndex === index ? 'true' : 'false'}
            aria-current={player.state.wordIndex === index ? 'true' : undefined}
            style={player.state.wordIndex === index ? { background: BRAND.yellow, color: BRAND.navy, borderRadius: 4, textDecoration: 'underline', textUnderlineOffset: 4 } : undefined}>
            {cue.word}
          </span>{index < recording.words.length - 1 ? ' ' : ''}
        </span>)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={start} className="min-h-11 rounded-xl px-4 py-3 font-extrabold" style={{ background: BRAND.green, color: BRAND.navy }}>
          <PilotIcon name={player.status === 'idle' ? 'play' : 'hear-again'} /> {player.status === 'idle' ? 'ניגון השיר' : 'ניגון מחדש'}
        </button>
        {player.status === 'paused' && <button type="button" onClick={() => { stopAccompaniment(); beforePlay(); player.resume() }} className="min-h-11 rounded-xl border border-white px-3 py-2 font-bold"><PilotIcon name="play" /> המשך השיר</button>}
        <button type="button" onClick={player.pause} disabled={!active} className="min-h-11 rounded-xl border border-white px-3 py-2 font-bold disabled:opacity-40"><PilotIcon name="stop" /> עצירת השיר</button>
        <button type="button" onClick={player.reset} disabled={player.status === 'idle' && !player.error} className="min-h-11 rounded-xl border border-white px-3 py-2 font-bold disabled:opacity-40"><PilotIcon name="try-again" /> השיר להתחלה</button>
      </div>
      <p role="status" className="mt-2 text-sm">
        {player.error || (player.status === 'loading' ? 'טוענים ובודקים את הקלטת השיר…' : player.status === 'playing' ? 'השיר מתנגן' : player.status === 'paused' ? 'השיר נעצר' : player.status === 'ended' ? 'השיר הסתיים' : '')}
      </p>
    </>}
    <div className="mt-4 border-t border-white/30 pt-3" data-magic-song-accompaniment data-accompaniment-status={accompaniment}>
      <p className="font-bold">🎹 ליווי לניסיון: {backing.title}</p>
      <p className="mt-1 text-sm leading-relaxed">מנגינה מקורית קיימת, ללא קול שר. אפשר לשיר את המילים בעצמכם; הליווי אינו מותאם למילים.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void playAccompaniment()} className="min-h-11 rounded-xl px-4 py-3 font-extrabold" style={{ background: BRAND.cyan, color: BRAND.navy }}>
          <PilotIcon name={accompaniment === 'idle' ? 'play' : 'hear-again'} /> {accompaniment === 'idle' ? 'ניגון ליווי ללא שירה' : 'הליווי מההתחלה'}
        </button>
        <button type="button" onClick={stopAccompaniment} disabled={accompaniment === 'idle'} className="min-h-11 rounded-xl border border-white px-3 py-2 font-bold disabled:opacity-40"><PilotIcon name="stop" /> עצירת הליווי</button>
      </div>
      <p role="status" className="mt-2 text-sm">{accompanimentError || (accompaniment === 'loading' ? 'מפעילים את הליווי…' : accompaniment === 'playing' ? 'הליווי מתנגן, אפשר להצטרף בשירה' : '')}</p>
    </div>
  </section>
})
