'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell }   from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { Card }       from '@/components/ui/Card'
import { WaveBar }    from '@/components/ui/WaveBar'
import { BRAND }      from '@/lib/constants'
import { MOCK_SONGS } from '@/lib/mockData'

const TABS = [
  { id: 'songs', label: '🎵 שירים', count: 6 },
  { id: 'clips', label: '🎬 קליפים', count: 4 },
  { id: 'mine',  label: '⭐ שלי',   count: 2 },
]

export default function LibraryPage() {
  const [tab,     setTab]     = useState('songs')
  const [query,   setQuery]   = useState('')
  const [playing, setPlaying] = useState<number | null>(null)

  const songs = MOCK_SONGS.filter(s =>
    !query || s.title.includes(query) || s.artist.includes(query)
  )

  return (
    <AppShell bg="#f0fdf4">
      <BackHeader title="ספריית שירים וקליפים 📂" bg={BRAND.green} />
      <div className="p-4 space-y-3">

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="🔍 חיפוש שיר..."
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              border: '2px solid #e5e7eb', fontSize: 16,
              fontFamily: 'inherit', outline: 'none', direction: 'rtl',
              transition: 'border 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = BRAND.green)}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '11px 4px', borderRadius: 12, border: 'none',
                background: tab === t.id ? BRAND.green : '#e5e7eb',
                color: tab === t.id ? 'white' : '#6b7280',
                fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>{t.label} ({t.count})</button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {songs.map((song, i) => (
            <motion.div key={song.id}
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.07 }}
              whileTap={{ scale: 0.97 }}>
              <Card style={{ padding: 12, cursor: 'pointer' }}
                onClick={() => setPlaying(playing === song.id ? null : song.id)}>

                {/* Thumbnail */}
                <div style={{
                  height: 80, borderRadius: 14, marginBottom: 10,
                  background: `linear-gradient(135deg,${song.color}30,${song.color}10)`,
                  border: `2px solid ${song.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {playing === song.id
                    ? <WaveBar active count={9} color={song.color} height={40} />
                    : <span style={{ fontSize: 36 }}>{song.emoji}</span>
                  }
                </div>

                <div className="font-black" style={{ fontSize: 14, color: BRAND.navy }}>{song.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, marginBottom: 8 }}>{song.artist}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{song.duration}</span>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, background: song.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 13,
                  }}>{playing === song.id ? '⏸' : '▶'}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {songs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 700 }}>לא נמצאו שירים</div>
          </motion.div>
        )}

      </div>
    </AppShell>
  )
}
