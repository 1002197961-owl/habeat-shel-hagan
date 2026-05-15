'use client'

import { WAVE_COLORS } from '@/lib/constants'

interface WaveBarProps {
  active?: boolean
  count?: number
  color?: string
  height?: number
  className?: string
}

export function WaveBar({
  active = true,
  count = 15,
  color,
  height = 32,
  className = '',
}: WaveBarProps) {
  // Build a natural-looking envelope using sine waves
  const bars = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return 0.35 + Math.sin(t * Math.PI) * 0.55 + Math.sin(t * Math.PI * 3) * 0.1
  })

  return (
    <div
      className={`flex items-end gap-[3px] ${className}`}
      style={{ height }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-sm flex-shrink-0"
          style={{
            width: 5,
            height: `${h * 100}%`,
            background: color ?? WAVE_COLORS[i % WAVE_COLORS.length],
            transformOrigin: 'bottom',
            opacity: active ? 1 : 0.35,
            animation: active
              ? `waveBar ${0.7 + (i % 6) * 0.13}s ease-in-out ${i * 0.055}s infinite alternate`
              : 'none',
            transition: 'opacity 0.3s',
          }}
        />
      ))}
    </div>
  )
}
