'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }      from '@/components/layout/AppShell'
import { BackHeader }    from '@/components/layout/BackHeader'
import { Card }          from '@/components/ui/Card'
import { Pill }          from '@/components/ui/Pill'
import { Btn }           from '@/components/ui/Btn'
import { Toggle }        from '@/components/ui/Toggle'
import { StatBadge }     from '@/components/ui/StatBadge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BRAND }         from '@/lib/constants'

const GROUPS  = ['כל הגן', 'קבוצה א׳', 'קבוצה ב׳', 'מועדון']
const SCREENS_LIST = [
  { id: 'beat',   label: 'מנהל הביט',        emoji: '🎛️', href: '/beat-manager'  },
  { id: 'song',   label: 'שיר הקסם',          emoji: '⭐', href: '/magic-song'    },
  { id: 'station',label: 'תחנות נגינה',       emoji: '🎸', href: '/stations'      },
  { id: 'rec',    label: 'הקלטה',             emoji: '🎤', href: '/recording'     },
  { id: 'lib',    label: 'ספרייה',            emoji: '📂', href: '/library'       },
]

const SETTINGS_LIST = [
  { key: 'lockScreens',    emoji: '🔒', label: 'נעילת מסכים',     desc: 'מונע מעבר חופשי בין מסכים'    },
  { key: 'quietMode',      emoji: '🔇', label: 'מצב שקט',          desc: 'פעולה ללא סאונד חיצוני'       },
  { key: 'groupRecording', emoji: '🎤', label: 'הקלטה קבוצתית',   desc: 'כל הילדים מקליטים ביחד'       },
  { key: 'aiSongs',        emoji: '✨', label: 'שירי AI',           desc: 'יצירת שירים אוטומטית'         },
  { key: 'activityTimer',  emoji: '⏰', label: 'טיימר פעילות',     desc: 'תזכורת מעבר בין תחנות'        },
] as const

type SettingKey = (typeof SETTINGS_LIST)[number]['key']

export default function TeacherPage() {
  const [group,  setGroup]  = useState('כל הגן')
  const [mins,   setMins]   = useState(10)
  const [active, setActive] = useState(false)
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({
    lockScreens:    false,
    quietMode:      true,
    groupRecording: true,
    aiSongs:        true,
    activityTimer:  true,
  })

  const togSetting = (key: SettingKey) =>
    setSettings(s => ({ ...s, [key]: !s[key] }))

  return (
    <AppShell bg="#fff1f5">
      <BackHeader title="מצב גננת 👩‍🏫" bg={BRAND.rose} />
      <div className="p-4 space-y-3">

        {/* Teacher profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card style={{ background: `${BRAND.rose}14`, border: `2px solid ${BRAND.rose}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <motion.div
                whileHover={{ scale: 1.06 }}
                style={{
                  width: 60, height: 60, borderRadius: 20, flexShrink: 0,
                  background: `linear-gradient(135deg, ${BRAND.rose}, ${BRAND.pink})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>
                👩‍🏫
              </motion.div>
              <div style={{ flex: 1 }}>
                <div className="font-black" style={{ fontSize: 18, color: BRAND.navy }}>שרה לוי</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>גן שושנים · תל אביב</div>
                <div style={{ marginTop: 5 }}>
                  <Pill color={BRAND.green}>מחוברת ✓</Pill>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-black" style={{ fontSize: 26, color: BRAND.rose }}>24</div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>ילדים</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick stats */}
        <motion.div className="flex gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatBadge value="8"  label="שירים היום"   emoji="🎵" color={BRAND.pink}   />
          <StatBadge value="3"  label="קליפים"        emoji="🎬" color={BRAND.purple} />
          <StatBadge value="85%" label="התקדמות"      emoji="📈" color={BRAND.green}  />
        </motion.div>

        {/* Group selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <SectionHeader title="קבוצה פעילה" emoji="👥" />
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {GROUPS.map(g => (
                <motion.button key={g} whileTap={{ scale: 0.94 }}
                  onClick={() => setGroup(g)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: `2px solid ${group === g ? BRAND.rose : '#e5e7eb'}`,
                    background: group === g ? `${BRAND.rose}18` : 'white',
                    color: group === g ? BRAND.rose : '#6b7280',
                    fontWeight: 800, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                  {g}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Timer stepper */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card>
            <SectionHeader title="זמן לכל תחנה" emoji="⏱" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.button whileTap={{ scale: 0.88 }}
                onClick={() => setMins(m => Math.max(5, m - 5))}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none',
                  background: '#f3f4f6', fontSize: 22, fontWeight: 900, cursor: 'pointer',
                }}>−</motion.button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span className="font-black" style={{ fontSize: 36, color: BRAND.navy }}>{mins}</span>
                <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}> דק׳</span>
              </div>
              <motion.button whileTap={{ scale: 0.88 }}
                onClick={() => setMins(m => Math.min(30, m + 5))}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none',
                  background: '#f3f4f6', fontSize: 22, fontWeight: 900, cursor: 'pointer',
                }}>+</motion.button>
            </div>
            {/* Mini timeline */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {[5, 10, 15, 20, 25, 30].map(v => (
                <motion.button key={v} whileTap={{ scale: 0.9 }}
                  onClick={() => setMins(v)}
                  style={{
                    flex: 1, height: 28, borderRadius: 7, border: 'none',
                    background: mins === v ? BRAND.rose : '#f3f4f6',
                    color: mins === v ? 'white' : '#9ca3af',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                  {v}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Settings toggles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card>
            <SectionHeader title="הגדרות פעילות" emoji="⚙️" />
            {SETTINGS_LIST.map((s, i) => (
              <div key={s.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBlock: 11,
                borderBottom: i < SETTINGS_LIST.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="font-black" style={{ fontSize: 14, color: BRAND.navy }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.desc}</div>
                </div>
                <Toggle on={settings[s.key]} onChange={() => togSetting(s.key)} color={BRAND.rose} />
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Start / Stop activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div key="active"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <Card style={{ background: `${BRAND.green}18`, border: `2px solid ${BRAND.green}44`, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🟢</div>
                  <div className="font-black" style={{ fontSize: 17, color: BRAND.green }}>פעילות פעילה!</div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 14 }}>
                    {group} · {mins} דק׳ לתחנה
                  </div>
                  <Btn full bg="#ef4444" onClick={() => setActive(false)}
                    style={{ fontSize: 16, padding: '13px' }}>
                    ⏹ עצרי פעילות
                  </Btn>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="idle"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <Btn full bg={`linear-gradient(135deg,${BRAND.rose},${BRAND.pink})`}
                  onClick={() => setActive(true)}
                  style={{
                    padding: '16px', fontSize: 18, borderRadius: 16,
                    boxShadow: `0 8px 24px ${BRAND.rose}55`,
                  }}>
                  🚀 התחילי פעילות!
                </Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </AppShell>
  )
}
