'use client'
import { useEffect, useRef, useState } from 'react'
import { INITIAL_NARRATION, NarrationPlayer, type NarrationAsset } from '@/lib/narration'

export function useNarration() {
  const [state, setState] = useState(INITIAL_NARRATION)
  const player = useRef<NarrationPlayer | null>(null)
  useEffect(() => {
    const current = new NarrationPlayer(setState)
    player.current = current
    const leave = () => current.reset()
    window.addEventListener('pagehide', leave)
    window.addEventListener('popstate', leave)
    return () => {
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('popstate', leave)
      current.dispose(); player.current = null
    }
  }, [])
  return { state,
    play: (asset: NarrationAsset) => player.current?.play(asset),
    pause: () => player.current?.pause(),
    resume: () => player.current?.resume(),
    reset: () => player.current?.reset(),
  }
}
export type NarrationControls = ReturnType<typeof useNarration>
