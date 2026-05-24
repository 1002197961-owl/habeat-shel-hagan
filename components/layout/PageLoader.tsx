'use client'

import { motion } from 'framer-motion'
import { WAVE_COLORS } from '@/lib/constants'

export function PageLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-5"
      style={{ background: 'linear-gradient(180deg, #160d38 0%, #0b1730 100%)' }}
    >
      {/* Spinning note */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 48 }}
      >
        🎵
      </motion.div>

      {/* Animated waveform */}
      <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
        {WAVE_COLORS.map((color, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: '100%',
              borderRadius: 3,
              background: color,
              transformOrigin: 'bottom',
              animation: `waveBar ${0.7 + i * 0.12}s ease-in-out ${i * 0.07}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div
        className="font-bold text-sm tracking-widest"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        טוען...
      </div>
    </div>
  )
}
