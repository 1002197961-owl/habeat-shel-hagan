'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { NAV_SCREENS } from '@/lib/constants'

export function NavGrid() {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="grid grid-cols-2 gap-3 px-4 pb-8"
    >
      {NAV_SCREENS.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay:    0.3 + i * 0.07,
            duration: 0.35,
            ease:     [0.22, 1, 0.36, 1],
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04, y: -2 }}
        >
          <Link href={item.href} className="block no-underline">
            <div
              className="nav-card p-5"
              style={{ background: item.gradient }}
            >
              <div className="text-[38px] mb-2 leading-none">{item.emoji}</div>
              <div
                className="text-white font-extrabold text-sm leading-tight text-shadow-sm"
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
