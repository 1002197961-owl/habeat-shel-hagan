export interface Song {
  id: number
  title: string
  artist: string
  duration: string
  emoji: string
  color: string
}

export interface Garden {
  id: number
  name: string
  city: string
  kids: number
  songs: number
  clips: number
  progress: number
}

export interface Station {
  id: number
  name: string
  subtitle: string
  emoji: string
  color: string
  active: boolean
  kidsNow: number
  songsToday: number
  minutesActive: number
}

export interface Clip {
  id: number
  name: string
  duration: string
  date: string
  emoji: string
}

// ── Songs ──────────────────────────────────────
export const MOCK_SONGS: Song[] = [
  { id: 1, title: 'שיר הגשם',       artist: 'גן שושנים',   duration: '2:34', emoji: '🌧️', color: '#00B4E6' },
  { id: 2, title: 'ריקוד הכוכבים',  artist: 'גן הדר',       duration: '1:58', emoji: '⭐', color: '#FFD600' },
  { id: 3, title: 'הגיטרה הורודה',  artist: 'גן פרחים',     duration: '3:12', emoji: '🎸', color: '#FF4DA6' },
  { id: 4, title: 'צבעי הקשת',      artist: 'גן תמר',       duration: '2:45', emoji: '🌈', color: '#FFA500' },
  { id: 5, title: 'מסע הצלילים',    artist: 'גן עדן',        duration: '2:20', emoji: '🎵', color: '#8B5CF6' },
  { id: 6, title: 'שיר הבוקר',     artist: 'גן שמש',        duration: '1:45', emoji: '☀️', color: '#22C55E' },
]

// ── Gardens (city dashboard) ───────────────────
export const MOCK_GARDENS: Garden[] = [
  { id: 1, name: 'גן שושנים', city: 'תל אביב',      kids: 24, songs: 8,  clips: 3, progress: 85 },
  { id: 2, name: 'גן הדר',    city: 'ראשון לציון',  kids: 22, songs: 5,  clips: 1, progress: 62 },
  { id: 3, name: 'גן פרחים',  city: 'בת ים',         kids: 26, songs: 12, clips: 5, progress: 91 },
  { id: 4, name: 'גן תמר',    city: 'חולון',         kids: 20, songs: 3,  clips: 0, progress: 40 },
]

// ── Pilot stations (physical equipment) ───────
export const PILOT_STATIONS: Station[] = [
  {
    id: 1, name: 'תחנת הופעה',   subtitle: 'גיטרה ורודה + מיקרופון',     emoji: '🎸',
    color: '#FF4DA6', active: true,  kidsNow: 6,  songsToday: 3, minutesActive: 18,
  },
  {
    id: 2, name: 'רצפת הקצב',    subtitle: 'שטיח פסנתר ענק',              emoji: '🎹',
    color: '#FFD600', active: true,  kidsNow: 8,  songsToday: 5, minutesActive: 24,
  },
  {
    id: 3, name: 'עמדת שירה',    subtitle: 'Logitech G335 Headset',        emoji: '🎧',
    color: '#00B4E6', active: false, kidsNow: 0,  songsToday: 0, minutesActive: 0,
  },
  {
    id: 4, name: 'תחנות פעילות', subtitle: 'טאבלטים עם כיסוי מוקשח',     emoji: '📱',
    color: '#8B5CF6', active: true,  kidsNow: 10, songsToday: 7, minutesActive: 30,
  },
]

// ── Sample recordings ──────────────────────────
export const MOCK_CLIPS: Clip[] = [
  { id: 1, name: 'שיר הגן שלנו',  duration: '0:32', date: 'היום',   emoji: '🎵' },
  { id: 2, name: 'ריקוד הכוכבים', duration: '0:48', date: 'אתמול',  emoji: '⭐' },
  { id: 3, name: 'קצב הגשם',      duration: '1:05', date: 'שלשום',  emoji: '🌧️' },
]
