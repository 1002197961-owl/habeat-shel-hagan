'use client'

import { motion } from 'framer-motion'
import { BRAND } from '@/lib/constants'

const STATS = [
  { value: '4',  label: 'גנים', emoji: '🏫', color: BRAND.cyan },
  { value: '92', label: 'ילדים', emoji: '👧', color: BRAND.pink },
  { value: '28', label: 'שירים', emoji: '🎵', color: BRAND.yellow },
  { value: '9',  label: 'קליפים', emoji: '🎬', color: BRAND.purple },
]

export function StatsStrip() {
  return (
    <motion.div
      className="flex justify-center gap-3 px-4 pb-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
    >
      {STATS.map((s, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.06, type: 'spring', stiffness: 200 }}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: '8px 12px',
            minWidth: 56,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 16 }}>{s.emoji}</span>
          <span
            className="font-black leading-none"
            style={{ color: s.color, fontSize: 20, marginTop: 2 }}
          >
            {s.value}
          </span>
          <span
            className="font-bold"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 }}
          >
            {s.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
