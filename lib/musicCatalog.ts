import { SONGS, type BeatColor, type Difficulty, type SongCategory } from './songLibrary'

export type CatalogSong = {
  id: string
  title: string
  artist: string
  category: SongCategory
  difficulty: Difficulty
  ageLevel: string
  bpm: number
  durationSec: number | null
  emoji: string
  color: string
  pattern: BeatColor[]
  description: string
  audio: { kind: 'builtin'; scoreId: string } | { kind: 'storage'; path: string } | null
}

// Original instrumental exercises composed for this demo. No borrowed recordings or vocals.
export const ORIGINAL_SCORES: Record<string, { bpm: number; notes: number[] }> = {
  'garden-hello': { bpm: 100, notes: [60, 64, 67, 64, 62, 65, 69, 0, 67, 64, 62, 60, 64, 67, 72, 0, 69, 67, 65, 64, 62, 65, 67, 0, 64, 62, 60, 62, 67, 64, 60, 0] },
  'rain-dance': { bpm: 80, notes: [72, 0, 69, 67, 64, 0, 67, 69, 72, 74, 72, 0, 69, 67, 64, 0, 65, 69, 72, 0, 67, 71, 74, 0, 72, 69, 67, 64, 67, 64, 60, 0] },
  'color-parade': { bpm: 120, notes: [60, 67, 64, 67, 69, 65, 69, 0, 62, 69, 65, 69, 71, 67, 71, 0, 72, 67, 69, 64, 65, 69, 67, 0, 64, 67, 62, 65, 67, 64, 60, 0] },
}

const originals: CatalogSong[] = ([
  { id: 'garden-hello', title: 'בוקר של צלילים', emoji: '☀️', color: '#FFA500', category: 'movement', bpm: 100, pattern: ['red', 'rest', 'yellow', 'rest'], description: 'מתחילים בפעימה קבועה, ומצטרפים במחיאה בכל פעימה שנייה.' },
  { id: 'rain-dance', title: 'טיפות רוקדות', emoji: '💧', color: '#00B4E6', category: 'nature', bpm: 80, pattern: ['purple', 'rest', 'blue', 'rest'], description: 'מקשיבים לטיפות, מנגנים בעדינות ומשאירים מקום לשקט.' },
  { id: 'color-parade', title: 'מצעד הצבעים', emoji: '🌈', color: '#8B5CF6', category: 'movement', bpm: 120, pattern: ['red', 'yellow', 'purple', 'rest'], description: 'מעבירים את הפעימה בין שלושה כלים ועוצרים יחד בהפסקה.' },
] satisfies Array<Pick<CatalogSong, 'id' | 'title' | 'emoji' | 'color' | 'category' | 'bpm' | 'pattern' | 'description'>>).map(song => ({ ...song, artist: 'הביט של הגן · קטע מקורי ללא שירה', difficulty: 'easy', ageLevel: '3-6', durationSec: 32 * 60 / song.bpm, audio: { kind: 'builtin', scoreId: song.id } }))

export const BUILTIN_CATALOG: CatalogSong[] = [
  ...originals,
  ...SONGS.map(song => ({
    id: song.id, title: song.title, artist: 'שיר מוכר · קובץ שמע טרם נוסף', category: song.category,
    difficulty: song.difficulty, ageLevel: song.ageLevel, bpm: song.bpm, durationSec: null,
    emoji: song.emoji, color: song.previewColor, pattern: song.colorPattern,
    description: 'פריט לתכנון הספרייה. השמעה תיפתח לאחר הוספת הקלטה מאושרת לשימוש.', audio: null,
  })),
]

export const CATEGORY_LABELS: Record<SongCategory, string> = { folk: 'שירי עם', movement: 'תנועה', nature: 'טבע', animals: 'חיות', holiday: 'חגים' }
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' }
export const FAVORITES_KEY = 'habeat-song-favorites-v1'

export function normalizeSearch(value: string): string {
  return value.normalize('NFKD').replace(/[\u0591-\u05C7]/g, '').replace(/[׳״'"–־-]/g, ' ').toLowerCase().trim()
}

export function filterCatalog(songs: CatalogSong[], filters: { query: string; category: string; playableOnly: boolean; favoritesOnly: boolean; favoriteIds: string[] }): CatalogSong[] {
  const query = normalizeSearch(filters.query)
  return songs.filter(song => (!query || normalizeSearch(`${song.title} ${song.artist} ${CATEGORY_LABELS[song.category]}`).includes(query))
    && (filters.category === 'all' || song.category === filters.category)
    && (!filters.playableOnly || song.audio !== null)
    && (!filters.favoritesOnly || filters.favoriteIds.includes(song.id)))
}

export function formatSongTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

// The Data API is an external boundary: never trust a row's shape or asset path.
export function catalogSongFromRow(value: unknown): CatalogSong | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const text = (key: string, max = 200) => typeof row[key] === 'string' && (row[key] as string).length > 0 && (row[key] as string).length <= max
  if (!text('id', 80) || !/^[a-z0-9-]+$/.test(String(row.id)) || !text('title') || !text('artist') || !text('description', 1000)) return null
  if (!Object.hasOwn(CATEGORY_LABELS, String(row.category)) || !Object.hasOwn(DIFFICULTY_LABELS, String(row.difficulty))) return null
  if (!text('age_level', 10) || !text('emoji', 16) || !/^#[0-9a-f]{6}$/i.test(String(row.color))) return null
  if (typeof row.bpm !== 'number' || row.bpm < 40 || row.bpm > 220) return null
  if (row.duration_sec !== null && (typeof row.duration_sec !== 'number' || row.duration_sec <= 0 || row.duration_sec > 1800)) return null
  if (!Array.isArray(row.pattern) || row.pattern.length < 1 || row.pattern.length > 32 || !row.pattern.every(beat => ['red', 'yellow', 'blue', 'green', 'purple', 'rest'].includes(beat))) return null
  let audio: CatalogSong['audio'] = null
  if (row.builtin_audio_id !== null && row.builtin_audio_id !== undefined) {
    if (typeof row.builtin_audio_id !== 'string' || !Object.hasOwn(ORIGINAL_SCORES, row.builtin_audio_id) || row.audio_object_path) return null
    audio = { kind: 'builtin', scoreId: row.builtin_audio_id }
  } else if (row.audio_object_path !== null && row.audio_object_path !== undefined) {
    if (typeof row.audio_object_path !== 'string' || !/^[a-zA-Z0-9/_-]+\.(mp3|wav|m4a|ogg)$/.test(row.audio_object_path) || row.audio_object_path.startsWith('/')) return null
    if (row.rights_status !== 'cleared') return null
    audio = { kind: 'storage', path: row.audio_object_path }
  }
  return { id: String(row.id), title: String(row.title), artist: String(row.artist), category: row.category as SongCategory, difficulty: row.difficulty as Difficulty, ageLevel: String(row.age_level), bpm: row.bpm, durationSec: row.duration_sec as number | null, emoji: String(row.emoji), color: String(row.color), pattern: row.pattern as BeatColor[], description: String(row.description), audio }
}
