'use client'
import { useEffect, useState, useCallback } from 'react'

export function useTimer({ initial = 0, direction = 'up' as 'up' | 'down', onExpire }: { initial?: number; direction?: 'up' | 'down'; onExpire?: () => void } = {}) {
  const [secs, setSecs] = useState(initial)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecs(s => {
        if (direction === 'down') {
          if (s <= 1) { setRunning(false); onExpire?.(); return 0 }
          return s - 1
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, direction, onExpire])

  const toggle = useCallback(() => setRunning(r => !r), [])
  const reset = useCallback((val?: number) => { setSecs(val ?? initial); setRunning(false) }, [initial])

  return { secs, running, toggle, reset, start: () => setRunning(true), pause: () => setRunning(false) }
}
