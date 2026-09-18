import { describe, expect, it } from 'vitest'
import { BUILTIN_CATALOG, ORIGINAL_SCORES, catalogSongFromRow, filterCatalog } from '../lib/musicCatalog'
import { audioResponse, renderOriginalWav, SAMPLE_RATE } from '../lib/wavAudio'

describe('playable song catalog', () => {
  it('only exposes real original audio as playable and accepts Hebrew vowel marks in search', () => {
    const options = { query: '', category: 'all', playableOnly: true, favoritesOnly: false, favoriteIds: [] as string[] }
    expect(filterCatalog(BUILTIN_CATALOG, options).map(song => song.id)).toEqual(Object.keys(ORIGINAL_SCORES))
    expect(filterCatalog(BUILTIN_CATALOG, { ...options, query: 'טִיפּוֹת' }).map(song => song.id)).toEqual(['rain-dance'])
    expect(filterCatalog(BUILTIN_CATALOG, { ...options, favoritesOnly: true, favoriteIds: ['rain-dance'], category: 'movement' })).toHaveLength(0)
    expect(filterCatalog(BUILTIN_CATALOG, { ...options, query: 'יונתן' })).toHaveLength(0)
  })

  it('rejects malformed, unapproved and unsafe cloud audio data', () => {
    const row = { id: 'licensed-song', title: 'שיר', artist: 'יוצר', category: 'nature', difficulty: 'easy', age_level: '3-6', bpm: 100, duration_sec: 30, emoji: '🎵', color: '#22c55e', pattern: ['red', 'rest'], description: 'קטע לתרגול', builtin_audio_id: null, audio_object_path: 'approved/track.mp3', rights_status: 'cleared' }
    expect(catalogSongFromRow(row)?.audio).toEqual({ kind: 'storage', path: 'approved/track.mp3' })
    for (const unsafe of [{ rights_status: 'pending' }, { audio_object_path: '../private/track.mp3' }, { audio_object_path: 'https://other.example/track.mp3' }, { pattern: ['unknown'] }, { bpm: -1 }, { builtin_audio_id: '__proto__' }, { category: 'constructor' }]) {
      expect(catalogSongFromRow({ ...row, ...unsafe })).toBeNull()
    }
  })

  it.each(Object.keys(ORIGINAL_SCORES))('renders %s as non-silent, unclipped PCM with the correct duration', id => {
    const bytes = renderOriginalWav(id)!
    const view = new DataView(bytes.buffer)
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE')
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE)
    const sampleCount = (bytes.length - 44) / 2
    expect(sampleCount / SAMPLE_RATE).toBeCloseTo(BUILTIN_CATALOG.find(song => song.id === id)!.durationSec!, 3)
    let max = 0
    let energy = 0
    for (let index = 44; index < bytes.length; index += 2) { const sample = view.getInt16(index, true); max = Math.max(max, Math.abs(sample)); energy += sample * sample }
    expect(max).toBeLessThan(32767)
    expect(Math.sqrt(energy / sampleCount)).toBeGreaterThan(1000)
  })

  it('implements seek ranges, suffix ranges and invalid-range responses', async () => {
    const bytes = renderOriginalWav('garden-hello')!
    const full = audioResponse(bytes, null)
    expect(full.status).toBe(200)
    expect(Number(full.headers.get('Content-Length'))).toBe(bytes.length)
    const partial = audioResponse(bytes, 'bytes=44-99')
    expect(partial.status).toBe(206)
    expect(new Uint8Array(await partial.arrayBuffer())).toEqual(bytes.slice(44, 100))
    expect(new Uint8Array(await audioResponse(bytes, 'bytes=-44').arrayBuffer())).toEqual(bytes.slice(-44))
    for (const bad of ['bytes=-0', 'bytes=90-20', 'bytes=999999999-', 'bytes=0-1,5-7', 'oops']) expect(audioResponse(bytes, bad).status).toBe(416)
    expect(renderOriginalWav('unknown')).toBeNull()
    expect(renderOriginalWav('__proto__')).toBeNull()
  })
})
