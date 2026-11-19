'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadMagicSongBytes, type MagicSongRecording } from '@/lib/magicSong'
import { INITIAL_NARRATION, NarrationPlayer, type NarrationState } from '@/lib/narration'

export function useMagicSong(recording: MagicSongRecording | null) {
  const [state, setState] = useState<NarrationState>(INITIAL_NARRATION)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const player = useRef<NarrationPlayer | null>(null)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const prepared = useRef<{ key: string; url: string } | null>(null)

  const reset = useCallback(() => {
    generation.current++
    request.current?.abort(); request.current = null
    player.current?.reset()
    if (prepared.current) URL.revokeObjectURL(prepared.current.url)
    prepared.current = null
    setVerifying(false); setVerified(false); setError('')
  }, [])

  useEffect(() => {
    const current = new NarrationPlayer(setState)
    player.current = current
    const leave = () => reset()
    const hide = () => { if (document.hidden) reset() }
    window.addEventListener('pagehide', leave)
    window.addEventListener('popstate', leave)
    document.addEventListener('visibilitychange', hide)
    return () => {
      generation.current++
      request.current?.abort(); request.current = null
      current.dispose(); player.current = null
      if (prepared.current) URL.revokeObjectURL(prepared.current.url)
      prepared.current = null
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('popstate', leave)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [reset])

  useEffect(() => { reset() }, [recording, reset])

  const play = async () => {
    if (!recording || !player.current) return
    const current = ++generation.current
    request.current?.abort()
    const abort = new AbortController()
    request.current = abort
    player.current.reset()
    setError(''); setVerifying(true)
    try {
      const key = `${recording.id}:${recording.sha256}`
      if (prepared.current?.key !== key) {
        if (prepared.current) URL.revokeObjectURL(prepared.current.url)
        prepared.current = null
        const bytes = await loadMagicSongBytes(recording, abort.signal)
        if (current !== generation.current || abort.signal.aborted) return
        prepared.current = { key, url: URL.createObjectURL(bytes) }
      }
      if (current !== generation.current || abort.signal.aborted) return
      setVerifying(false)
      setVerified(true)
      await player.current?.play({ ...recording, src: prepared.current.url })
    } catch {
      if (current === generation.current && !abort.signal.aborted) {
        setVerifying(false)
        setVerified(false)
        setError('לא ניתן לטעון את הקלטת השיר המאושרת. בדקו את החיבור ונסו שוב.')
      }
    } finally {
      if (current === generation.current) request.current = null
    }
  }

  const pause = () => {
    // Stopping during verification must not start sound when fetch later settles.
    if (verifying) { reset(); return }
    player.current?.pause()
  }
  const resume = () => {
    if (recording && prepared.current && state.status === 'paused') {
      setError(''); void player.current?.resume()
    }
  }
  return {
    state,
    verified: verified && state.status !== 'error',
    status: verifying ? 'loading' : state.status,
    error: error || (state.error ? 'השיר לא הושמע. לחצו שוב על כפתור הניגון ובדקו שהצליל במכשיר פעיל.' : ''),
    play, pause, resume, reset,
  }
}
