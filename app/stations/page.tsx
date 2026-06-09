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

        <motion.div className="flex gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <StatBadge value={activeCount}     label="תחנות פעילות" emoji="🟢" color={BRAND.green}  />
          <StatBadge value={totalKids}       label="ילדים פעילים"  emoji="👧" color={BRAND.pink}   />
          <StatBadge value={stations.length} label="תחנות סה״כ"   emoji="🏆" color={BRAND.purple} />
        </motion.div>

        {stations.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 + i * 0.06 }}>
            <Card style={{
              border: `2px solid ${expanded === s.id ? s.color : 'transparent'}`,
              boxShadow: expanded === s.id ? `0 4px 24px ${s.color}28` : undefined,
              transition: 'all 0.22s',
            }}>
              <div className="flex items-center gap-3" style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <motion.div whileHover={{ scale: 1.07 }} style={{
                  width: 58, height: 58, borderRadius: 17, flexShrink: 0,
                  background: `${s.color}20`, border: `2px solid ${s.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>{s.emoji}</motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-black" style={{ fontSize: 15, color: BRAND.navy }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subtitle}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <Pill color={s.active ? BRAND.green : '#9ca3af'}>
                      {s.active ? '✓ פעילה' : '⏸ כבויה'}
                    </Pill>
                    {s.active && s.kidsNow > 0 && (
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{s.kidsNow} ילדים</span>
                    )}
                  </div>
                </div>
                <div onClick={e => { e.stopPropagation(); toggle(s.id) }}>
                  <Toggle on={s.active} onChange={() => toggle(s.id)} color={s.color} />
                </div>
              </div>

              <AnimatePresence>
                {expanded === s.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 13, paddingTop: 13, borderTop: `1px solid ${s.color}22`,
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {([
                        ['ילדים כעת',  s.kidsNow],
                        ['שירים היום', s.songsToday],
                        [`${s.minutesActive}ד`, 'זמן פעיל'],
                      ] as [string | number, string | number][]).map(([val, label]) => (
                        <div key={String(label)} style={{ textAlign: 'center',
                          background: `${s.color}0f`, borderRadius: 12, padding: '9px 4px' }}>
                          <div className="font-black" style={{ fontSize: 20, color: s.color, lineHeight: 1 }}>{val}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginTop: 3 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>ניצולת תחנה</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{Math.round((s.kidsNow / 12) * 100)}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.kidsNow / 12) * 100}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 4, background: s.color }} />
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
