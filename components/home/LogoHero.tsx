'use client'

import { motion } from 'framer-motion'
import { WaveBar } from '@/components/ui/WaveBar'

const FLOATERS = [
  { note: '🎵', size: 18, top: 18, left: '8%',  dur: 3.0, delay: 0.0 },
  { note: '🎶', size: 14, top: 44, left: '78%', dur: 4.0, delay: 0.4 },
  { note: '✨', size: 22, top: 10, left: '85%', dur: 3.5, delay: 0.8 },
  { note: '🌟', size: 16, top: 52, left: '4%',  dur: 4.5, delay: 0.3 },
  { note: '🎵', size: 20, top: 28, left: '68%', dur: 3.2, delay: 0.6 },
  { note: '🎶', size: 15, top: 38, left: '50%', dur: 3.8, delay: 1.0 },
]

export function LogoHero() {
  return (
    <motion.section
      className="relative text-center overflow-hidden"
      style={{ paddingTop: 36, paddingBottom: 24, paddingInline: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating music notes */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ fontSize: f.size, top: f.top, left: f.left, opacity: 0.6 }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: f.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: f.delay,
          }}
        >
          {f.note}
        </motion.span>
      ))}

      {/* Glass logo card */}
      <motion.div
        className="card-glass inline-block"
        style={{ paddingInline: 44, paddingBlock: 24, marginBottom: 14 }}
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Logo text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <span
            className="block text-[52px] font-black leading-tight text-shadow-glow-pink"
            style={{ color: '#FF4DA6' }}
          >
            הביט
          </span>
          <span className="block text-[32px] font-extrabold text-white leading-tight">
            של הגן
          </span>
        </motion.div>

        {/* Animated waveform */}
        <motion.div
          className="flex justify-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <WaveBar active count={15} height={22} />
        </motion.div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="text-white/85 text-[17px] font-bold tracking-[0.2em] m-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        קצב. יצירה. דמיון.
      </motion.p>
    </motion.section>
  )
}
