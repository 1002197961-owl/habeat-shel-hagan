'use client'

import { motion } from 'framer-motion'
import { AppShell }   from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { Card }       from '@/components/ui/Card'
import { BRAND }      from '@/lib/constants'
import { MOCK_GARDENS } from '@/lib/mockData'

const STATS = [
  { label: 'גנים פעילים',   value: '4',  emoji: '🏫', color: BRAND.cyan   },
  { label: 'ילדים השתתפו',  value: '92', emoji: '👧', color: BRAND.pink   },
  { label: 'שירים נוצרו',   value: '28', emoji: '🎵', color: BRAND.yellow },
  { label: 'קליפים הוקלטו', value: '9',  emoji: '🎬', color: BRAND.purple },
]

const WEEK = [
  { day: 'א', h: 40, color: BRAND.cyan   },
  { day: 'ב', h: 65, color: BRAND.pink   },
  { day: 'ג', h: 85, color: BRAND.yellow },
  { day: 'ד', h: 72, color: BRAND.green  },
  { day: 'ה', h: 95, color: BRAND.purple },
]

export default function DashboardPage() {
  return (
    <AppShell bg="#eef2ff">
      <BackHeader title="דאשבורד עירוני 📊" bg={BRAND.navy} />
      <div className="p-4 space-y-3">

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {STATS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 220 }}>
              <Card style={{ textAlign: 'center', padding: '18px 12px' }}>
                <div style={{ fontSize: 28, marginBottom: 5 }}>{s.emoji}</div>
                <div className="font-black" style={{ fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Weekly bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <Card>
            <div className="font-black mb-4" style={{ fontSize: 15, color: BRAND.navy }}>פעילות השבוע 📈</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96 }}>
              {WEEK.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <motion.div
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: 0.42 + i * 0.08, type: 'spring', stiffness: 110 }}
                    style={{
                      width: '100%', height: `${d.h}%`,
                      borderRadius: '7px 7px 3px 3px',
                      background: d.color, opacity: i === 4 ? 1 : 0.75,
                      transformOrigin: 'bottom',
                    }} />
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>{d.day}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Gardens list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <div className="font-black mb-3" style={{ fontSize: 15, color: BRAND.navy }}>גנים בפיילוט 🏫</div>
            {MOCK_GARDENS.map((g, i) => {
              const barColor = g.progress > 70 ? BRAND.green : g.progress > 40 ? BRAND.orange : '#ef4444'
              return (
                <motion.div key={g.id}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.56 + i * 0.07 }}
                  style={{ paddingBlock: 13, borderBottom: i < MOCK_GARDENS.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div className="font-black" style={{ fontSize: 15, color: BRAND.navy }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {g.city} · {g.kids} ילדים · 🎵{g.songs} · 🎬{g.clips}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="font-black" style={{ fontSize: 20, color: barColor, lineHeight: 1 }}>{g.progress}%</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>התקדמות</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${g.progress}%` }}
                      transition={{ delay: 0.62 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 4, background: barColor }} />
                  </div>
                </motion.div>
              )
            })}
          </Card>
        </motion.div>

      </div>
    </AppShell>
  )
}
