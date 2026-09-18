'use client'

import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { BRAND } from '@/lib/constants'
import { COLOR_META } from '@/lib/songLibrary'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, FAVORITES_KEY, filterCatalog, formatSongTime, type CatalogSong } from '@/lib/musicCatalog'
import type { CatalogSource } from '@/lib/server/songCatalog'
import styles from './SongLibrary.module.css'

const PAGE_SIZE = 4

export function SongLibrary({ songs, source }: { songs: CatalogSong[]; source: CatalogSource }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [playableOnly, setPlayableOnly] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [storageWarning, setStorageWarning] = useState(false)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<CatalogSong | null>(() => songs.find(song => song.audio) ?? null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState(0)
  const [rate, setRate] = useState(1)
  const [loop, setLoop] = useState(false)
  const [audioError, setAudioError] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const requestId = useRef(0)
  const autoPlayNext = useRef(false)

  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
      if (Array.isArray(value)) setFavorites(value.filter((id): id is string => typeof id === 'string'))
    } catch { setStorageWarning(true) }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.playbackRate = rate
  }, [rate, selected])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !autoPlayNext.current) return
    autoPlayNext.current = false
    const currentRequest = ++requestId.current
    let cancelled = false
    setLoading(true)
    void audio.play().catch((error: unknown) => {
      if (cancelled || currentRequest !== requestId.current || (error instanceof DOMException && error.name === 'AbortError')) return
      setLoading(false)
      setAudioError('ההשמעה לא התחילה. לחצי על הפעלה בנגן כדי לנסות שוב.')
    })
    return () => { cancelled = true; audio.pause() }
  }, [selected])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    const update = () => { setPosition(audioRef.current?.currentTime ?? 0); frame = requestAnimationFrame(update) }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const filtered = filterCatalog(songs, { query, category, playableOnly, favoritesOnly, favoriteIds: favorites })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const playableCount = songs.filter(song => song.audio).length
  const activeBeat = selected && playing ? Math.floor(position * selected.bpm / 60) % selected.pattern.length : -1

  function favorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)) } catch { setStorageWarning(true) }
  }

  function choose(song: CatalogSong) {
    if (!song.audio) return
    setAudioError('')
    if (selected?.id === song.id) {
      const audio = audioRef.current
      if (!audio) return
      if (!audio.paused) audio.pause()
      else {
        if (audio.ended) audio.currentTime = 0
        const currentRequest = ++requestId.current
        setLoading(true)
        void audio.play().catch((error: unknown) => {
          if (currentRequest !== requestId.current || (error instanceof DOMException && error.name === 'AbortError')) return
          setLoading(false)
          setAudioError('לא ניתן להשמיע כרגע. בדקי את החיבור ונסי שוב בנגן.')
        })
      }
      return
    }
    requestId.current++
    audioRef.current?.pause()
    setPlaying(false)
    setPosition(0)
    autoPlayNext.current = true
    setSelected(song)
  }

  return (
    <AppShell bg="#f0fdf4">
      <BackHeader title="ספריית שירים 🎵" bg={BRAND.green} />
      <main className={styles.library}>
        <div className={styles.intro}>
          <h1>בוחרים. מקשיבים. מנגנים.</h1>
          <p>{playableCount} קטעים זמינים להשמעה · {songs.length} פריטים בספרייה</p>
        </div>
        {source === 'unavailable' && <p role="status" className={styles.notice}>הספרייה בענן אינה זמינה כרגע. אפשר לנגן בקטעי הבסיס ולנסות שוב לאחר רענון.</p>}

        {selected && <section className={styles.player} aria-label="נגן השירים">
          <div className={styles.playerHeading}>
            <span className={styles.cover} style={{ background: `${selected.color}22` }} aria-hidden="true">{selected.emoji}</span>
            <div><span className={styles.eyebrow}>{loading ? 'טוען שמע…' : playing ? 'מתנגן עכשיו' : 'מוכן לנגינה'}</span><h2>{selected.title}</h2><p>{selected.artist}</p></div>
          </div>
          <audio key={selected.id} ref={audioRef} controls preload="metadata" loop={loop}
            aria-label={`נגן: ${selected.title}`} src={`/api/songs/${selected.id}/audio`}
            onPlaying={() => { setPlaying(true); setLoading(false); setAudioError('') }}
            onWaiting={() => { setLoading(true); setPlaying(false) }}
            onCanPlay={() => setLoading(false)}
            onPause={() => { setPlaying(false); setLoading(false) }}
            onEnded={() => { setPlaying(false); setLoading(false) }}
            onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
            onError={() => { setPlaying(false); setLoading(false); setAudioError('קובץ השמע לא נטען. בדקי את החיבור ונסי שוב.') }}
          />
          <div className={styles.playerOptions}>
            <label>מהירות <select value={rate} onChange={event => setRate(Number(event.target.value))} aria-label="מהירות נגינה"><option value="0.75">איטית ×0.75</option><option value="1">רגילה ×1</option><option value="1.25">מהירה ×1.25</option></select></label>
            <label><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)} /> חזרה בלולאה</label>
          </div>
          {audioError && <p role="alert" className={styles.error}>{audioError} <button onClick={() => { audioRef.current?.load(); choose(selected) }}>נסי שוב</button></p>}
          <details className={styles.practice}>
            <summary>🥁 מנגנים יחד לפי הצבעים</summary>
            <p>{selected.description}</p>
            <div className={styles.beats} aria-label="סדר הפעימות מימין לשמאל">
              {selected.pattern.map((beat, index) => <div key={index} className={styles.beat} aria-current={activeBeat === index ? 'step' : undefined}
                style={{ borderColor: COLOR_META[beat].hex, background: activeBeat === index ? `${COLOR_META[beat].hex}35` : 'white', transform: activeBeat === index ? 'scale(1.06)' : undefined }}>
                <span aria-hidden="true">{COLOR_META[beat].icon}</span><small>{index + 1}. {COLOR_META[beat].label}</small>
              </div>)}
            </div>
            <p className={styles.hint}>ליווי קצב מוצע: אפשר להצטרף במחיאות או בכלי נגינה. הסימנים נעים בזמן ההשמעה.</p>
          </details>
        </section>}

        <section className={styles.filters} aria-label="חיפוש וסינון שירים">
          <label className={styles.search}>חיפוש בספרייה<input type="search" value={query} placeholder="שם שיר או נושא…" onChange={event => { setQuery(event.target.value); setPage(0) }} /></label>
          <div className={styles.filterRow}>
            <label>נושא<select value={category} onChange={event => { setCategory(event.target.value); setPage(0) }}><option value="all">כל הנושאים</option>{Object.entries(CATEGORY_LABELS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
            <button className={favoritesOnly ? styles.selected : ''} aria-pressed={favoritesOnly} onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(0) }}>⭐ מועדפים ({favorites.filter(id => songs.some(song => song.id === id)).length})</button>
          </div>
          <label className={styles.check}><input type="checkbox" checked={playableOnly} onChange={event => { setPlayableOnly(event.target.checked); setPage(0) }} /> רק קטעים שאפשר להשמיע עכשיו</label>
        </section>
        {storageWarning && <p role="status" className={styles.notice}>המועדפים זמינים כעת, אך הדפדפן לא מאפשר לשמור אותם לביקור הבא.</p>}
        <p className={styles.results} role="status">{filtered.length} תוצאות{favoritesOnly ? ' במועדפים' : ''}</p>
        <div className={styles.grid}>
          {visible.map(song => <article key={song.id} className={styles.songCard} style={{ borderColor: selected?.id === song.id ? song.color : 'transparent' }}>
            <div className={styles.songTop}><span aria-hidden="true" className={styles.songEmoji} style={{ background: `${song.color}20` }}>{song.emoji}</span><button className={styles.star} onClick={() => favorite(song.id)} aria-pressed={favorites.includes(song.id)} aria-label={`${favorites.includes(song.id) ? 'הסרת' : 'הוספת'} ${song.title} ${favorites.includes(song.id) ? 'מהמועדפים' : 'למועדפים'}`}>{favorites.includes(song.id) ? '★' : '☆'}</button></div>
            <h2>{song.title}</h2><p className={styles.artist}>{song.artist}</p>
            <div className={styles.tags}><span>{CATEGORY_LABELS[song.category]}</span><span>{DIFFICULTY_LABELS[song.difficulty]}</span><span>גילי <bdi>{song.ageLevel}</bdi></span></div>
            <div className={styles.duration}><span dir="ltr">{formatSongTime(song.durationSec)}</span>{song.audio && <span>{song.bpm} פעימות/דקה</span>}</div>
            <button className={styles.play} disabled={!song.audio} onClick={() => choose(song)} aria-label={song.audio ? `${selected?.id === song.id && playing ? 'השהיית' : 'השמעת'} ${song.title}` : `${song.title} — ממתין לקובץ שמע`}>
              {!song.audio ? 'ממתין לקובץ שמע' : selected?.id === song.id && loading ? 'טוען…' : selected?.id === song.id && playing ? '⏸ השהיה' : '▶ נגינה'}
            </button>
          </article>)}
        </div>
        {filtered.length === 0 && <div className={styles.empty}><span aria-hidden="true">🎵</span><p>{favoritesOnly ? 'אין מועדפים שמתאימים לסינון. סמני כוכב לצד הקטעים שאהבת.' : 'אין קטעים שמתאימים לחיפוש. נסי שם אחר או נושא אחר.'}</p><button onClick={() => { setQuery(''); setCategory('all'); setFavoritesOnly(false); setPlayableOnly(true); setPage(0) }}>הצגת קטעים זמינים</button></div>}
        {pages > 1 && <nav className={styles.pagination} aria-label="דפדוף בספרייה"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>הקודם</button><span>{currentPage + 1} מתוך {pages}</span><button disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>הבא</button></nav>}
        <p className={styles.footer}>המועדפים נשמרים בדפדפן הזה. הקטעים המקוריים הם מנגינות לתרגול, ללא שירה.</p>
      </main>
    </AppShell>
  )
}
