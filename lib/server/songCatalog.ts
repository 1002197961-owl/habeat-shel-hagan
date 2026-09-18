import { createClient } from '@supabase/supabase-js'
import { BUILTIN_CATALOG, catalogSongFromRow, type CatalogSong } from '../musicCatalog'

export type CatalogSource = 'builtin' | 'supabase' | 'unavailable'
export const AUDIO_BUCKET = 'song-audio'

export function getCatalogClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  if (!key.startsWith('sb_publishable_')) throw new Error('Only a publishable key is allowed for the shared catalog')
  // A publishable key only. Never use a service-role key to serve the shared catalog.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000), cache: 'no-store' }) } })
}

export async function loadSongCatalog(): Promise<{ songs: CatalogSong[]; source: CatalogSource }> {
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_PUBLISHABLE_KEY) return { songs: BUILTIN_CATALOG, source: 'builtin' }
  try {
    const client = getCatalogClient()
    if (!client) throw new Error('Incomplete catalog configuration')
    const { data, error } = await client.from('song_catalog').select('*').eq('published', true).order('sort_order').limit(200)
    if (error || !data) throw new Error('Catalog unavailable')
    const songs = data.map(catalogSongFromRow)
    if (songs.some(song => song === null)) throw new Error('Invalid catalog row')
    return { songs: songs as CatalogSong[], source: 'supabase' }
  } catch {
    return { songs: BUILTIN_CATALOG, source: 'unavailable' }
  }
}
