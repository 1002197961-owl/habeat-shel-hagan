'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { NAV_SCREENS } from '@/lib/constants'

export function NavGrid() {
  return (
    <nav aria-label="ניווט ראשי" className="grid grid-cols-2 gap-4 px-5 pb-10">
      {NAV_SCREENS.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 + i * 0.07, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.94 }}
          whileHover={{
            scale: 1.05,
            y: -4,
            boxShadow: `0 18px 40px ${item.color}55`,
            transition: { duration: 0.18 },
          }}
        >
          <Link href={item.href} className="block no-underline">
            <div
              className="nav-card"
              style={{ background: item.gradient, padding: '22px 16px 20px' }}
            >
              {/* Emoji with hover scale via parent motion */}
              <motion.div
                style={{ fontSize: 42, marginBottom: 10, lineHeight: 1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {item.emoji}
              </motion.div>

              <div
                className="text-white font-extrabold leading-snug"
                style={{ fontSize: 14, textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}
              >
                {item.label}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </nav>
  )
}
