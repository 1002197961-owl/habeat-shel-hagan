'use client'

import { motion } from 'framer-motion'
import { WaveBar } from '@/components/ui/WaveBar'
import { BRAND }   from '@/lib/constants'

const FLOATERS = [
  { note: '🎵', size: 18, top: 22,  left: '7%',  dur: 3.0, delay: 0.0 },
  { note: '🎶', size: 14, top: 58,  left: '80%', dur: 4.0, delay: 0.4 },
  { note: '✨', size: 22, top: 12,  left: '86%', dur: 3.5, delay: 0.8 },
  { note: '🌟', size: 16, top: 68,  left: '5%',  dur: 4.5, delay: 0.3 },
  { note: '🎵', size: 20, top: 34,  left: '70%', dur: 3.2, delay: 0.6 },
  { note: '🎶', size: 15, top: 82,  left: '52%', dur: 3.8, delay: 1.0 },
  { note: '⭐', size: 13, top: 46,  left: '20%', dur: 4.2, delay: 0.5 },
  { note: '🎵', size: 17, top: 72,  left: '38%', dur: 3.6, delay: 0.9 },
]

export function LogoHero() {
  return (
    <motion.section
      className="relative text-center overflow-hidden"
      style={{ paddingTop: 52, paddingBottom: 28, paddingInline: 24 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient radial glow behind the card */}
      <div
        style={{
          position: 'absolute',
          width: 320, height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND.purple}38 0%, ${BRAND.pink}18 40%, transparent 70%)`,
          left: '50%', top: '42%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          filter: 'blur(24px)',
        }}
      />

      {/* Floating music notes */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ fontSize: f.size, top: f.top, left: f.left, opacity: 0.5 }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        >
          {f.note}
        </motion.span>
      ))}

      {/* Live badge */}
      <motion.div
        className="inline-flex items-center gap-1.5 mb-4"
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 999,
          padding: '5px 14px',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <motion.div
          style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.green, flexShrink: 0 }}
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
          פעיל עכשיו · 4 גנים
        </span>
      </motion.div>

      {/* Glass logo card */}
      <motion.div
        className="card-glass inline-block relative"
        style={{ paddingInline: 52, paddingBlock: 30, marginBottom: 20 }}
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          <span
            className="block font-black leading-none"
            style={{
              color: BRAND.pink,
              fontSize: 64,
              textShadow: `0 0 32px ${BRAND.pink}66, 0 0 64px ${BRAND.pink}33`,
            }}
          >
            הביט
          </span>
          <span
            className="block font-extrabold text-white"
            style={{ fontSize: 36, marginTop: 2, letterSpacing: '-0.01em' }}
          >
            של הגן
          </span>
        </motion.div>

        <motion.div
          className="flex justify-center"
          style={{ marginTop: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
        >
          <WaveBar active count={18} height={28} />
        </motion.div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="text-white/75 font-bold m-0"
        style={{ fontSize: 15, letterSpacing: '0.25em' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.4 }}
      >
        קצב. יצירה. דמיון.
      </motion.p>
    </motion.section>
  )
}
