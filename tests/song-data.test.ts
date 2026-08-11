import { describe, expect, it } from 'vitest'
import { BEAT_COLORS, MOCK_SONGS, PILOT_STATIONS } from '../lib/mockData'
import { SONGS, getSongById, getStageForStars, getTotalBeats } from '../lib/songLibrary'

describe('song data integrity', () => {
  it('keeps mock song ids unique and patterns playable', () => {
    expect(new Set(MOCK_SONGS.map(song => song.id)).size).toBe(MOCK_SONGS.length)
    for (const song of MOCK_SONGS) {
      expect(song.pattern.length).toBeGreaterThan(0)
      expect(song.pattern.every(beat => beat in BEAT_COLORS)).toBe(true)
    }
  })

  it('keeps the structured library internally consistent', () => {
    expect(new Set(SONGS.map(song => song.id)).size).toBe(SONGS.length)
    for (const song of SONGS) {
      expect(getSongById(song.id)).toEqual(song)
      expect(getTotalBeats(song)).toBeGreaterThan(0)
    }
  })

  it('returns the highest progression stage unlocked by stars', () => {
    const song = SONGS[0]
    expect(getStageForStars(song, 0).stage).toBe(1)
    expect(getStageForStars(song, 5).stage).toBe(3)
  })

  it('keeps pilot station ids unique and includes five active stations', () => {
    expect(new Set(PILOT_STATIONS.map(station => station.id)).size).toBe(PILOT_STATIONS.length)
    expect(PILOT_STATIONS.filter(station => station.active)).toHaveLength(6)
  })
})
