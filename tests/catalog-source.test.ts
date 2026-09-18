import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCatalogClient, loadSongCatalog } from '../lib/server/songCatalog'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('catalog configuration and failure behavior', () => {
  it('uses the approved shared project when there is no environment override', async () => {
    vi.stubEnv('SUPABASE_URL', undefined)
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', undefined)
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await loadSongCatalog()).source).toBe('supabase')
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://oqwzjhqzjfhdlploezad.supabase.co/rest/v1/song_catalog')
  })
  it('works without an account and identifies the built-in source', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
    expect((await loadSongCatalog()).source).toBe('builtin')
  })
  it('reports incomplete cloud configuration rather than claiming connection', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
    expect((await loadSongCatalog()).source).toBe('unavailable')
  })
  it('refuses a privileged secret key', () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_secret_test')
    expect(() => getCatalogClient()).toThrow('Only a publishable key')
  })
  it('falls back visibly during a cloud outage', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })))
    const result = await loadSongCatalog()
    expect(result.source).toBe('unavailable')
    expect(result.songs.filter(song => song.audio)).toHaveLength(3)
  })
})
