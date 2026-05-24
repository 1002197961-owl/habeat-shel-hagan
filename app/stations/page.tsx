'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Pill }          from '@/components/ui/Pill'
import { Toggle }        from '@/components/ui/Toggle'
import { StatBadge }     from '@/components/ui/StatBadge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'
import { PILOT_STATIONS } from '@/lib/mockData'

export default function StationsPage() {
  const [stations, setStations] = useState(PILOT_STATIONS)
  const [expanded, setExpanded] = useState<number | null>(1)

  const toggle = (id: number) =>
    setStations(ss => ss.map(s => s.id === id ? { ...s, active: !s.active } : s))

  const activeCount = stations.filter(s => s.active).length
  const totalKids   = stations.filter(s => s.active).reduce((a, s) => a + s.kidsNow, 0)

  return (
    <AppShell bg="#fff0f8">
      <BackHeader title="תחנות כלי נגינה 🎸" bg={BRAND.pink} />
      <div className="p-4 space-y-3">

        {/* Session overview */}
        <motion.div className="flex gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <StatBadge value={activeCount} label="תחנות פעילות" emoji="🟢" color={BRAND.green}  />
          <StatBadge value={totalKids}   label="ילדים פעילים"  emoji="👧" color={BRAND.pink}   />
          <StatBadge value="4"           label="תחנות סה״כ"    emoji="🏆" color={BRAND.purple} />
        </motion.div>

        {/* Station cards */}
        {stations.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.08 }}>
            <Card style={{
              border: `2px solid ${expanded === s.id ? s.color : 'transparent'}`,
              boxShadow: expanded === s.id ? `0 4px 24px ${s.color}28` : undefined,
              transition: 'all 0.25s',
            }}>
              {/* Header row */}
              <div className="flex items-center gap-3"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  style={{
                    width: 62, height: 62, borderRadius: 18, flexShrink: 0,
                    background: `${s.color}22`, border: `2px solid ${s.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                  }}>
                  {s.emoji}
                </motion.div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-black" style={{ fontSize: 16, color: BRAND.navy }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.subtitle}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill color={s.active ? BRAND.green : '#9ca3af'}>
                      {s.active ? '✓ פעילה' : '⏸ כבויה'}
                    </Pill>
                    {s.active && s.kidsNow > 0 && (
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                        {s.kidsNow} ילדים כעת
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <div onClick={e => { e.stopPropagation(); toggle(s.id) }}>
                  <Toggle on={s.active} onChange={() => toggle(s.id)} color={s.color} />
                </div>
              </div>

              {/* Expanded stats */}
              <AnimatePresence>
                {expanded === s.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{
                      marginTop: 14, paddingTop: 14,
                      borderTop: `1px solid ${s.color}22`,
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
                    }}>
                      {([
                        ['ילדים כעת',  s.kidsNow,         s.color],
                        ['שירים היום', s.songsToday,      s.color],
                        ['זמן פעיל',   `${s.minutesActive}ד`, s.color],
                      ] as [string, string | number, string][]).map(([label, value, color]) => (
                        <div key={label} style={{
                          textAlign: 'center', background: `${color}10`,
                          borderRadius: 12, padding: '10px 6px',
                        }}>
                          <div className="font-black" style={{ fontSize: 22, color, lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginTop: 4 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>ניצולת תחנה</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>
                          {Math.round((s.kidsNow / 12) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(s.kidsNow / 12) * 100}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 4, background: s.color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}

      </div>
    </AppShell>
  )
}
